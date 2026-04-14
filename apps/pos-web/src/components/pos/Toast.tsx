'use client';

import { useEffect } from 'react';
import { create } from 'zustand';
import { clsx } from 'clsx';
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react';

// ── Toast store ────────────────────────────────────────────────────────────

export type ToastType = 'success' | 'error' | 'info';

export interface Toast {
  id: string;
  type: ToastType;
  message: string;
}

interface ToastState {
  toasts: Toast[];
  add: (type: ToastType, message: string) => void;
  remove: (id: string) => void;
}

export const useToastStore = create<ToastState>()((set) => ({
  toasts: [],
  add(type, message) {
    const id = Math.random().toString(36).slice(2);
    set((s) => ({ toasts: [...s.toasts, { id, type, message }] }));
    // Auto-dismiss after 3.5 seconds
    setTimeout(() => {
      set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }));
    }, 3500);
  },
  remove(id) {
    set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }));
  },
}));

// Convenience helpers
export const toast = {
  success: (msg: string) => useToastStore.getState().add('success', msg),
  error:   (msg: string) => useToastStore.getState().add('error', msg),
  info:    (msg: string) => useToastStore.getState().add('info', msg),
};

// ── Toast container ────────────────────────────────────────────────────────

export function ToastContainer() {
  const { toasts, remove } = useToastStore();

  return (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} onDismiss={() => remove(t.id)} />
      ))}
    </div>
  );
}

function ToastItem({ toast: t, onDismiss }: { toast: Toast; onDismiss: () => void }) {
  const styles: Record<ToastType, string> = {
    success: 'bg-green-800/90 border-green-600/50 text-green-100',
    error:   'bg-red-900/90 border-red-700/50 text-red-100',
    info:    'bg-slate-700/90 border-slate-600/50 text-slate-100',
  };

  const icons: Record<ToastType, React.ReactNode> = {
    success: <CheckCircle size={16} className="text-green-400 shrink-0" />,
    error:   <AlertCircle size={16} className="text-red-400 shrink-0" />,
    info:    <Info size={16} className="text-slate-400 shrink-0" />,
  };

  return (
    <div
      className={clsx(
        'pointer-events-auto flex items-center gap-2.5 px-4 py-3 rounded-xl border shadow-lg',
        'text-sm max-w-xs animate-in slide-in-from-bottom-2 duration-200',
        styles[t.type],
      )}
    >
      {icons[t.type]}
      <span className="flex-1">{t.message}</span>
      <button onClick={onDismiss} className="opacity-60 hover:opacity-100 transition-opacity ml-1">
        <X size={14} />
      </button>
    </div>
  );
}
