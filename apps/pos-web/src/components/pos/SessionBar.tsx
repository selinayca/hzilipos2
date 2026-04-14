'use client';

import { useLiveQuery } from 'dexie-react-hooks';
import { useAuthStore } from '@/store/auth.store';
import { useCartStore } from '@/store/cart.store';
import { db } from '@/lib/db';
import { formatCents } from '@/lib/format';
import { getLastSyncTime } from '@/lib/db';
import { useEffect, useState } from 'react';
import { Clock, TrendingUp, Receipt } from 'lucide-react';

/**
 * SessionBar — shows the cashier a quick snapshot of their shift:
 *   - Cashier name
 *   - Today's completed sales count (from local synced orders)
 *   - Today's revenue total
 *   - Last sync time
 *
 * All data comes from IndexedDB (no API call) — works fully offline.
 */
export function SessionBar() {
  const user = useAuthStore((s) => s.user);
  const itemCount = useCartStore((s) => s.items.reduce((n, i) => n + i.quantity, 0));

  const [lastSync, setLastSync] = useState<string | null>(null);

  useEffect(() => {
    getLastSyncTime().then(setLastSync);
  }, []);

  // Count today's synced orders from IndexedDB
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const todayOrders = useLiveQuery(
    () =>
      db.pendingOrders
        .where('createdAt')
        .aboveOrEqual(todayStart.toISOString())
        .and((o) => o.status === 'synced')
        .toArray(),
    [],
  );

  const todayRevenue = todayOrders?.reduce((sum, o) => sum + o.totalCents, 0) ?? 0;
  const todayCount = todayOrders?.length ?? 0;

  const syncLabel = lastSync
    ? `Synced ${new Date(lastSync).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}`
    : 'Not synced yet';

  return (
    <div className="flex items-center gap-4 px-4 py-2 bg-slate-850 border-b border-slate-700/60 text-xs shrink-0">
      {/* Cashier */}
      <div className="flex items-center gap-1.5 text-slate-300">
        <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-xs">
          {user?.name?.[0]?.toUpperCase() ?? '?'}
        </div>
        <span>{user?.name ?? 'Cashier'}</span>
      </div>

      <div className="w-px h-4 bg-slate-700" />

      {/* Today's sales */}
      <div className="flex items-center gap-1.5 text-slate-400">
        <Receipt size={13} />
        <span>
          <span className="text-slate-200 font-semibold">{todayCount}</span> sales today
        </span>
      </div>

      {/* Today's revenue */}
      <div className="flex items-center gap-1.5 text-slate-400">
        <TrendingUp size={13} />
        <span>
          <span className="text-slate-200 font-semibold">{formatCents(todayRevenue)}</span>
        </span>
      </div>

      <div className="flex-1" />

      {/* Cart item count indicator */}
      {itemCount > 0 && (
        <span className="px-2 py-0.5 bg-blue-600/30 text-blue-300 rounded-full">
          {itemCount} item{itemCount !== 1 ? 's' : ''} in cart
        </span>
      )}

      {/* Last sync time */}
      <div className="flex items-center gap-1 text-slate-500">
        <Clock size={11} />
        <span>{syncLabel}</span>
      </div>
    </div>
  );
}
