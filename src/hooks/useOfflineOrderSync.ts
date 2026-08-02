import { useCallback, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { offlineDb, type QueuedOfflineOrder, type OfflineOrderError, type OfflineOrderStep } from '@/lib/offlineDb';
import { useWhatsApp } from '@/hooks/useWhatsApp';
import { WhatsAppDataHelper } from '@/integrations/whatsapp/data-helper';
import type { OrderCreatedData, NotificationResult } from '@/integrations/whatsapp/types';

type NotifyOrderCreated = (phoneNumber: string, orderData: OrderCreatedData) => Promise<NotificationResult>;

const BASE_DELAY_MS = 3000;
const MAX_DELAY_MS = 300000;

function backoffDelay(attempts: number): number {
  const capped = Math.min(BASE_DELAY_MS * 2 ** Math.max(attempts - 1, 0), MAX_DELAY_MS);
  return Math.round(Math.random() * capped);
}

function computePointsEarned(items: QueuedOfflineOrder['payload']['items']): number {
  let total = 0;
  for (const item of items) {
    if (item.service_type === 'kilo' && item.weight_kg) {
      total += Math.round(item.weight_kg);
    } else if (item.service_type === 'unit') {
      total += Math.ceil(item.quantity);
    } else if (item.service_type === 'combined') {
      if (item.weight_kg) total += Math.round(item.weight_kg);
      total += Math.ceil(item.quantity);
    }
  }
  return total;
}

class RetryableSyncError extends Error {
  retryable = true as const;
}

class PermanentSyncError extends Error {
  permanent = true as const;
  code: string | null;
  constructor(message: string, code: string | null = null) {
    super(message);
    this.code = code;
  }
}

// A Postgres error surfaced by supabase-js always carries a `code`
// (the Postgres error code, e.g. '23505'). A transport failure (dropped
// connection, timeout, CORS) never does - that distinction is what
// separates "safe to retry forever" from "stop and ask a human".
function throwClassified(error: { code?: string; message?: string }, step: OfflineOrderStep): never {
  if (!error.code) {
    throw new RetryableSyncError(error.message || 'Network error');
  }
  throw new PermanentSyncError(error.message || `Postgres error ${error.code}`, error.code);
}

async function sendOfflineOrderNotification(
  record: QueuedOfflineOrder,
  pointsEarned: number,
  notifyOrderCreated: NotifyOrderCreated
): Promise<void> {
  try {
    const { data: storeRow } = await supabase
      .from('stores')
      .select('name, address, phone, enable_qr, enable_points, wa_use_store_number, wa_sender_id')
      .eq('id', record.storeId)
      .maybeSingle();

    const storeInfo = WhatsAppDataHelper.getStoreInfoFromContext(storeRow);
    const orderItems = WhatsAppDataHelper.formatOrderItems(record.payload.items);

    const notificationData: OrderCreatedData = {
      orderId: record.id,
      customerName: record.payload.customer_name,
      totalAmount: record.payload.total_amount,
      subtotal: record.payload.subtotal,
      estimatedCompletion: WhatsAppDataHelper.formatEstimatedCompletion(record.payload.estimated_completion),
      paymentStatus: record.payload.payment_status || 'pending',
      orderItems,
      storeInfo,
      pointsEarned: pointsEarned > 0 ? pointsEarned : undefined,
      discountAmount: record.payload.discount_amount && record.payload.discount_amount > 0 ? record.payload.discount_amount : undefined,
    };

    await notifyOrderCreated(record.payload.customer_phone, notificationData);
  } catch (error) {
    // Notification failures never affect sync status - the order is
    // already durably saved server-side by the time this runs.
    console.warn('Offline order synced but WhatsApp notification failed:', error);
  }
}

async function processQueuedOrder(
  record: QueuedOfflineOrder,
  notifyOrderCreated: NotifyOrderCreated
): Promise<void> {
  const startingStep = record.step;
  await offlineDb.offlineOrderQueue.update(record.id, {
    status: 'syncing',
    attempts: record.attempts + 1,
  });

  let step = record.step;
  let pointsEarned = 0;

  try {
    if (step === 'orders') {
      const { error } = await supabase.from('orders').insert({
        id: record.id,
        store_id: record.storeId,
        customer_name: record.payload.customer_name,
        customer_phone: record.payload.customer_phone,
        subtotal: record.payload.subtotal,
        tax_amount: record.payload.tax_amount,
        total_amount: record.payload.total_amount,
        discount_amount: record.payload.discount_amount || 0,
        execution_status: record.payload.execution_status || 'in_queue',
        payment_status: record.payload.payment_status || 'pending',
        payment_method: record.payload.payment_method,
        payment_amount: record.payload.payment_amount,
        cash_received: record.payload.cash_received,
        payment_notes: record.payload.payment_notes,
        order_date: record.payload.order_date || new Date(record.queuedAt).toISOString(),
        estimated_completion: record.payload.estimated_completion,
      });

      if (error) {
        if (error.code === '23505') {
          // Our own prior attempt likely landed before the response
          // reached the client - confirm it's actually this order before
          // treating the conflict as success.
          const { data: existing } = await supabase
            .from('orders')
            .select('id, store_id')
            .eq('id', record.id)
            .maybeSingle();
          if (!existing || existing.store_id !== record.storeId) {
            throw new PermanentSyncError('Order id collision with an unrelated order', error.code);
          }
          // fall through - confirmed already inserted by us
        } else {
          throwClassified(error, 'orders');
        }
      }

      step = 'order_items';
      await offlineDb.offlineOrderQueue.update(record.id, { step });
    }

    if (step === 'order_items') {
      const { data: existingItems, error: existingError } = await supabase
        .from('order_items')
        .select('id')
        .eq('order_id', record.id)
        .limit(1);

      if (existingError) {
        throwClassified(existingError, 'order_items');
      }

      if (!existingItems || existingItems.length === 0) {
        const orderItems = record.payload.items.map((item) => ({
          order_id: record.id,
          service_name: item.service_name,
          service_price: item.service_price,
          quantity: Math.ceil(item.quantity),
          line_total: item.service_price * item.quantity,
          service_type: item.service_type,
          weight_kg: item.weight_kg,
          unit_items: item.service_type === 'kilo' ? 0 : item.unit_items,
          estimated_completion: item.estimated_completion,
          category: item.category,
          item_type: item.item_type || 'service',
        }));

        const { error } = await supabase.from('order_items').insert(orderItems);
        if (error) {
          throwClassified(error, 'order_items');
        }
      }

      step = 'points_earning';
      await offlineDb.offlineOrderQueue.update(record.id, { step });
    }

    if (step === 'points_earning') {
      if (record.needsPointsEarning) {
        // Re-check enable_points live against this order's store (not
        // necessarily the currently-selected store in the UI) - the
        // queue-time snapshot could be stale by the time this syncs.
        const { data: storeRow } = await supabase
          .from('stores')
          .select('enable_points')
          .eq('id', record.storeId)
          .maybeSingle();

        if (storeRow?.enable_points) {
          pointsEarned = computePointsEarned(record.payload.items);
          if (pointsEarned > 0) {
            const { error } = await supabase.rpc('award_points_for_synced_order', {
              p_order_id: record.id,
              p_store_id: record.storeId,
              p_customer_phone: record.payload.customer_phone,
              p_points_earned: pointsEarned,
            });
            if (error) {
              throwClassified(error, 'points_earning');
            }
          }
        }
      }

      step = 'done';
      await offlineDb.offlineOrderQueue.update(record.id, { step });
    }

    // Only the run that actually causes the step transition into 'done'
    // notifies - a resumed run that starts with step already 'done' (crash
    // between marking done and deleting the record below) must not
    // re-send WhatsApp.
    if (startingStep !== 'done') {
      void sendOfflineOrderNotification(record, pointsEarned, notifyOrderCreated);
    }

    // Once synced, this record has nothing left to do - the order now
    // lives in Supabase and shows up in Order History like any other.
    // Deleting it (rather than marking a terminal 'synced' status) keeps
    // the local queue from growing unbounded across a device's lifetime.
    await offlineDb.offlineOrderQueue.delete(record.id);
  } catch (err) {
    const errorInfo: OfflineOrderError = {
      step,
      code: err instanceof PermanentSyncError ? err.code : null,
      message: err instanceof Error ? err.message : 'Unknown error',
      at: Date.now(),
    };

    if (err instanceof RetryableSyncError) {
      const latest = await offlineDb.offlineOrderQueue.get(record.id);
      const attempts = latest?.attempts ?? record.attempts + 1;
      await offlineDb.offlineOrderQueue.update(record.id, {
        status: 'error_retryable',
        nextAttemptAt: Date.now() + backoffDelay(attempts),
        lastError: errorInfo,
      });
    } else {
      await offlineDb.offlineOrderQueue.update(record.id, {
        status: 'error_permanent',
        lastError: errorInfo,
      });
    }
  }
}

async function processQueuedOrderLocked(
  record: QueuedOfflineOrder,
  notifyOrderCreated: NotifyOrderCreated
): Promise<void> {
  if (typeof navigator === 'undefined' || !('locks' in navigator)) {
    await processQueuedOrder(record, notifyOrderCreated);
    return;
  }

  await navigator.locks.request(`offline-order-sync:${record.id}`, { ifAvailable: true }, async (lock) => {
    if (!lock) return; // another tab already holds it - skip this record this tick
    const fresh = await offlineDb.offlineOrderQueue.get(record.id);
    if (!fresh) return; // already synced (and deleted) by another tab
    await processQueuedOrder(fresh, notifyOrderCreated);
  });
}

let syncInFlight = false;

// Processes every due record (queued, or error_retryable whose backoff has
// elapsed) across ALL stores on this device - sequentially, oldest first,
// so switching stores never strands a queued order and a flaky connection
// isn't hammered with concurrent retries.
export async function triggerOfflineSync(notifyOrderCreated: NotifyOrderCreated): Promise<void> {
  if (syncInFlight || !navigator.onLine) return;
  syncInFlight = true;
  try {
    const now = Date.now();
    const due = (
      await offlineDb.offlineOrderQueue.where('status').anyOf('queued', 'error_retryable').toArray()
    )
      .filter((r) => r.nextAttemptAt === null || r.nextAttemptAt <= now)
      .sort((a, b) => a.queuedAt - b.queuedAt);

    for (const record of due) {
      if (!navigator.onLine) break;
      await processQueuedOrderLocked(record, notifyOrderCreated);
    }
  } finally {
    syncInFlight = false;
  }
}

// Manual retry entry point for the UI - resets the record (including
// error_permanent rows a staff member wants to try again) and syncs it
// immediately rather than waiting for the next scheduler tick.
export async function retryOfflineOrderNow(id: string, notifyOrderCreated: NotifyOrderCreated): Promise<void> {
  await offlineDb.offlineOrderQueue.update(id, { status: 'queued', nextAttemptAt: null, lastError: null });
  const fresh = await offlineDb.offlineOrderQueue.get(id);
  if (fresh) {
    await processQueuedOrderLocked(fresh, notifyOrderCreated);
  }
}

// Mounted once at the app root. Wires the unified sync trigger set: the
// `online` event, tab focus/visibility, and a foreground poll - no
// Background Sync API (unsupported in Safari/iOS, which this app targets).
export const useOfflineOrderSync = () => {
  const { notifyOrderCreated } = useWhatsApp();
  const notifyRef = useRef(notifyOrderCreated);
  notifyRef.current = notifyOrderCreated;

  const runSync = useCallback(() => {
    void triggerOfflineSync(notifyRef.current);
  }, []);

  useEffect(() => {
    runSync();

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') runSync();
    };

    window.addEventListener('online', runSync);
    window.addEventListener('focus', runSync);
    document.addEventListener('visibilitychange', handleVisibility);
    const interval = setInterval(runSync, 30000);

    return () => {
      window.removeEventListener('online', runSync);
      window.removeEventListener('focus', runSync);
      document.removeEventListener('visibilitychange', handleVisibility);
      clearInterval(interval);
    };
  }, [runSync]);

  return { syncNow: runSync };
};
