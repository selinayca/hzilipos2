import { create } from 'zustand';

export type SyncStatus = 'idle' | 'syncing' | 'error' | 'offline';

interface SyncState {
  status: SyncStatus;
  lastSyncAt: string | null;
  pendingOrderCount: number;
  setStatus: (status: SyncStatus) => void;
  setLastSyncAt: (iso: string) => void;
  setPendingOrderCount: (count: number) => void;
}

export const useSyncStore = create<SyncState>()((set) => ({
  status: 'idle',
  lastSyncAt: null,
  pendingOrderCount: 0,
  setStatus: (status) => set({ status }),
  setLastSyncAt: (iso) => set({ lastSyncAt: iso }),
  setPendingOrderCount: (count) => set({ pendingOrderCount: count }),
}));
