import { useLiveQuery } from 'dexie-react-hooks';
import { offlineDb, type OfflineOrderPayload, type QueuedOfflineOrder } from '@/lib/offlineDb';
import { authService } from '@/services/authService';

export class OfflineSessionExpiredError extends Error {
  constructor() {
    super('Sesi Anda telah berakhir. Silakan login ulang untuk membuat pesanan offline baru.');
    this.name = 'OfflineSessionExpiredError';
  }
}

// Session expiry is checked here only as a courtesy gate on creating NEW
// offline orders (an unattended terminal shouldn't be able to keep taking
// orders past its session window). It has no bearing on whether an
// already-queued order can sync - Supabase never sees this app-level
// session at all (static anon key, RLS disabled), so sync proceeds
// regardless of session state.
export async function queueOfflineOrder(
  storeId: string,
  payload: OfflineOrderPayload
): Promise<string> {
  if (!authService.isAuthenticated()) {
    throw new OfflineSessionExpiredError();
  }

  const id = crypto.randomUUID();
  const record: QueuedOfflineOrder = {
    id,
    storeId,
    payload,
    needsPointsEarning: payload.payment_status === 'completed',
    step: 'orders',
    status: 'queued',
    attempts: 0,
    nextAttemptAt: null,
    lastError: null,
    queuedAt: Date.now(),
    queuedByUserId: authService.getCurrentUser()?.id ?? 'unknown',
    syncedAt: null,
  };

  await offlineDb.offlineOrderQueue.add(record);
  return id;
}

// Resets a record to 'queued' so the scheduler (or an immediate manual
// sync trigger) picks it up again - used for both a normal retryable
// bump and a manual "try again" on an error_permanent row.
export async function retryQueuedOrder(id: string): Promise<void> {
  await offlineDb.offlineOrderQueue.update(id, {
    status: 'queued',
    nextAttemptAt: null,
    lastError: null,
  });
}

export const usePendingOrders = (storeId?: string) => {
  const records = useLiveQuery(
    () =>
      storeId
        ? offlineDb.offlineOrderQueue.where('storeId').equals(storeId).sortBy('queuedAt')
        : offlineDb.offlineOrderQueue.orderBy('queuedAt').toArray(),
    [storeId]
  );
  return records ?? [];
};
