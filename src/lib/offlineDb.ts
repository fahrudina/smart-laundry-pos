import Dexie, { type Table } from 'dexie';
import type { CreateOrderData } from '@/hooks/useOrdersOptimized';
import type { ServiceData } from '@/hooks/useServices';
import type { Customer } from '@/hooks/useCustomers';

// Offline order payload never carries points_redeemed - points redemption is
// disabled entirely for offline-created orders (client can never validate a
// points balance it doesn't have a live read on).
export type OfflineOrderPayload = Omit<CreateOrderData, 'points_redeemed'>;

export type OfflineOrderStep = 'orders' | 'order_items' | 'points_earning' | 'done';
// No terminal 'synced' state: a successfully-synced record is deleted
// outright (see useOfflineOrderSync) rather than kept around - it now
// lives in Supabase and shows up in Order History like any other order.
export type OfflineOrderStatus = 'queued' | 'syncing' | 'error_retryable' | 'error_permanent';

export interface OfflineOrderError {
  step: OfflineOrderStep;
  code: string | null;
  message: string;
  at: number;
}

export interface QueuedOfflineOrder {
  id: string; // == orders.id, crypto.randomUUID() at queue time (Dexie primary key)
  storeId: string;
  payload: OfflineOrderPayload;
  needsPointsEarning: boolean; // captured at queue time from payment_status === 'completed'; re-checked against live enable_points at sync time
  step: OfflineOrderStep;
  status: OfflineOrderStatus;
  attempts: number;
  nextAttemptAt: number | null; // epoch ms; scheduler ignores the record until Date.now() >= this
  // epoch ms set when status becomes 'syncing'. If the tab/app dies mid-sync,
  // this is what lets the scheduler notice a record has been stuck in
  // 'syncing' too long and reclaim it rather than leaving it stranded forever.
  syncStartedAt: number | null;
  lastError: OfflineOrderError | null;
  queuedAt: number; // epoch ms, used for FIFO processing order
  queuedByUserId: string;
}

export interface CachedServices {
  storeId: string; // primary key
  services: ServiceData[];
  cachedAt: number;
}

export interface CachedCustomers {
  storeId: string; // primary key
  customers: Customer[];
  cachedAt: number;
}

class OfflineDatabase extends Dexie {
  offlineOrderQueue!: Table<QueuedOfflineOrder, string>;
  cachedServices!: Table<CachedServices, string>;
  cachedCustomers!: Table<CachedCustomers, string>;

  constructor() {
    super('smart-laundry-pos-offline');
    this.version(1).stores({
      offlineOrderQueue: 'id, storeId, status, nextAttemptAt, queuedAt, [status+nextAttemptAt]',
      cachedServices: 'storeId',
      cachedCustomers: 'storeId',
    });
  }
}

export const offlineDb = new OfflineDatabase();
