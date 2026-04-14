'use client';

import { useSyncStore } from '@/store/sync.store';
import { clsx } from 'clsx';
import { Wifi, WifiOff, RefreshCw, AlertCircle } from 'lucide-react';

export function SyncIndicator() {
  const { status, pendingOrderCount } = useSyncStore();

  const iconMap = {
    idle: <Wifi size={14} className="text-green-400" />,
    syncing: <RefreshCw size={14} className="text-blue-400 animate-spin" />,
    error: <AlertCircle size={14} className="text-yellow-400" />,
    offline: <WifiOff size={14} className="text-red-400" />,
  };

  const labelMap = {
    idle: 'Online',
    syncing: 'Syncing...',
    error: 'Sync error',
    offline: 'Offline',
  };

  return (
    <div className="flex items-center gap-2">
      {pendingOrderCount > 0 && (
        <span className="text-xs bg-yellow-700/60 text-yellow-300 px-2 py-0.5 rounded-full">
          {pendingOrderCount} pending
        </span>
      )}
      <div
        className={clsx(
          'flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full',
          {
            idle: 'bg-green-900/40 text-green-400',
            syncing: 'bg-blue-900/40 text-blue-400',
            error: 'bg-yellow-900/40 text-yellow-400',
            offline: 'bg-red-900/40 text-red-400',
          }[status],
        )}
      >
        {iconMap[status]}
        <span>{labelMap[status]}</span>
      </div>
    </div>
  );
}
