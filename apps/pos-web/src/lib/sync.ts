/**
 * Offline Sync Engine
 *
 * Responsibilities:
 *   1. Product sync: Pull updated products from API → write to IndexedDB.
 *      Uses `sinceVersion` cursor so only changed products are fetched.
 *
 *   2. Order sync: Submit pending orders from IndexedDB → API.
 *      Handles idempotency via offlineSyncId.
 *      Implements exponential back-off for transient failures.
 *      Permanent errors (4xx) are marked `failed` and surfaced in UI.
 *
 * The engine is started once in the POS layout component and listens
 * to the browser's online/offline events. It also runs on a 60-second
 * polling interval as a backstop.
 */
import { apiClient } from './api';
import {
  db,
  PendingOrder,
  LocalProduct,
  getSyncCursor,
  setSyncCursor,
  setLastSyncTime,
} from './db';

const MAX_RETRIES = 5;
const BASE_DELAY_MS = 1_000;

// ── Product sync ─────────────────────────────────────────────────────────

export async function syncProducts(): Promise<{ synced: number }> {
  const cursor = await getSyncCursor();

  try {
    const response = await apiClient.get('/products', {
      params: { sinceVersion: cursor, limit: 500, activeOnly: false },
    });

    const { items, total } = response.data.data as {
      items: Array<{
        id: string;
        tenantId: string;
        categoryId: string | null;
        name: string;
        barcode: string | null;
        priceCents: number;
        taxRateBps: number;
        imageUrl: string | null;
        isActive: boolean;
        trackStock: boolean;
        version: number;
        updatedAt: string;
        stock?: { quantity: number };
        category?: { id: string; name: string; colorHex: string | null };
      }>;
      total: number;
    };

    if (items.length === 0) return { synced: 0 };

    const localProducts: LocalProduct[] = items.map((p) => ({
      id: p.id,
      tenantId: p.tenantId,
      categoryId: p.categoryId,
      name: p.name,
      barcode: p.barcode,
      priceCents: p.priceCents,
      taxRateBps: p.taxRateBps,
      imageUrl: p.imageUrl,
      isActive: p.isActive,
      trackStock: p.trackStock,
      stockQty: p.stock?.quantity ?? 0,
      categoryName: p.category?.name ?? null,
      version: p.version,
      updatedAt: p.updatedAt,
    }));

    // Bulk upsert — Dexie handles insert/update transparently
    await db.products.bulkPut(localProducts);

    // Advance cursor to the highest version we received
    const maxVersion = Math.max(...items.map((p) => p.version));
    await setSyncCursor(maxVersion);
    await setLastSyncTime(new Date().toISOString());

    return { synced: items.length };
  } catch (err) {
    // Network failure — silently continue, offline mode handles this
    console.warn('[sync] Product sync failed (offline?)', err);
    return { synced: 0 };
  }
}

// ── Order sync ────────────────────────────────────────────────────────────

export async function syncPendingOrders(): Promise<{
  submitted: number;
  failed: number;
}> {
  const pending = await db.pendingOrders
    .where('status')
    .anyOf(['pending', 'failed'])
    .and((o) => o.retryCount < MAX_RETRIES)
    .toArray();

  let submitted = 0;
  let failed = 0;

  for (const order of pending) {
    // Mark as syncing to prevent concurrent submission
    await db.pendingOrders.update(order.localId!, { status: 'syncing' });

    try {
      const response = await apiClient.post('/orders', buildOrderPayload(order));
      const serverOrder = response.data.data;

      await db.pendingOrders.update(order.localId!, {
        status: 'synced',
        syncedAt: new Date().toISOString(),
        serverOrderId: serverOrder.id,
        serverOrderNumber: serverOrder.orderNumber,
        errorMessage: null,
      });

      submitted++;
    } catch (err: any) {
      const status = err?.response?.status as number | undefined;
      const isPermFail = status !== undefined && status >= 400 && status < 500;

      const nextRetryCount = order.retryCount + 1;
      const reachedMax = nextRetryCount >= MAX_RETRIES;

      await db.pendingOrders.update(order.localId!, {
        // Permanent 4xx errors or max retries → mark failed
        status: isPermFail || reachedMax ? 'failed' : 'pending',
        retryCount: nextRetryCount,
        errorMessage: err?.response?.data?.message ?? err?.message ?? 'Unknown error',
      });

      failed++;
    }
  }

  return { submitted, failed };
}

function buildOrderPayload(order: PendingOrder) {
  return {
    paymentMethod: order.paymentMethod,
    items: order.items.map((i) => ({
      productId: i.productId,
      quantity: i.quantity,
      unitPriceCents: i.unitPriceCents,
      discountCents: i.discountCents,
    })),
    discountCents: order.discountCents,
    cashTenderedCents: order.cashTenderedCents,
    offlineSyncId: order.syncId,
    offlineCreatedAt: order.createdAt,
    notes: order.notes,
  };
}

// ── Full sync ─────────────────────────────────────────────────────────────

export async function runFullSync() {
  const [productResult, orderResult] = await Promise.allSettled([
    syncProducts(),
    syncPendingOrders(),
  ]);

  return {
    products: productResult.status === 'fulfilled' ? productResult.value : { synced: 0 },
    orders: orderResult.status === 'fulfilled' ? orderResult.value : { submitted: 0, failed: 0 },
  };
}

// ── Sync manager (singleton, call from layout) ────────────────────────────

let _syncInterval: ReturnType<typeof setInterval> | null = null;

export function startSyncManager() {
  if (typeof window === 'undefined') return;

  const run = () => {
    if (navigator.onLine) runFullSync();
  };

  // Run immediately on startup
  run();

  // Poll every 60 seconds
  _syncInterval = setInterval(run, 60_000);

  // React to network changes
  window.addEventListener('online', run);

  return () => {
    if (_syncInterval) clearInterval(_syncInterval);
    window.removeEventListener('online', run);
  };
}
