'use client';

import { useEffect, useRef } from 'react';
import { startSyncManager } from '@/lib/sync';
import { useSyncStore } from '@/store/sync.store';
import { db } from '@/lib/db';
import { SyncIndicator } from '@/components/pos/SyncIndicator';
import { ToastContainer } from '@/components/pos/Toast';

/**
 * POS Layout
 * - Starts the sync manager (product pull + pending order push)
 * - Renders the full-height POS shell
 */
export default function PosLayout({ children }: { children: React.ReactNode }) {
  const { setStatus, setPendingOrderCount } = useSyncStore();
  const cleanupRef = useRef<(() => void) | undefined>(undefined);

  useEffect(() => {
    // Register service worker (PWA offline shell caching)
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js', { scope: '/' })
        .then((reg) => console.log('[SW] Registered, scope:', reg.scope))
        .catch((err) => console.warn('[SW] Registration failed:', err));
    }

    // Track online/offline
    const onOnline = () => setStatus('idle');
    const onOffline = () => setStatus('offline');
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    if (!navigator.onLine) setStatus('offline');

    // Kick off sync manager
    const cleanup = startSyncManager();
    if (cleanup) cleanupRef.current = cleanup;

    // Watch pending order count for the indicator badge
    db.pendingOrders
      .where('status')
      .anyOf(['pending', 'failed'])
      .count()
      .then(setPendingOrderCount);

    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
      cleanupRef.current?.();
    };
  }, []);

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-slate-900">
      {/* Top bar */}
      <header className="flex items-center justify-between px-4 py-2 bg-slate-800 border-b border-slate-700 shrink-0">
        <span className="text-lg font-bold text-blue-400 tracking-tight">HizliPOS</span>
        <SyncIndicator />
      </header>

      {/* Main content */}
      <main className="flex flex-1 overflow-hidden">
        {children}
      </main>

      {/* Global toast notifications */}
      <ToastContainer />
    </div>
  );
}
