'use client';

import { useState } from 'react';
import { useCartStore, PaymentMethod } from '@/store/cart.store';
import { useAuthStore } from '@/store/auth.store';
import { db, PendingOrder } from '@/lib/db';
import { syncPendingOrders } from '@/lib/sync';
import { formatCents } from '@/lib/format';
import { generateUUID } from '@/lib/uuid';
import { clsx } from 'clsx';
import { X, CreditCard, Banknote, CheckCircle } from 'lucide-react';

interface Props {
  open: boolean;
  onClose: () => void;
}

type Stage = 'payment' | 'cash' | 'success';

export function CheckoutModal({ open, onClose }: Props) {
  const {
    items,
    subtotalCents,
    discountCents,
    taxCents,
    totalCents,
    paymentMethod,
    cashTenderedCents,
    changeCents,
    setPaymentMethod,
    setCashTendered,
    clear,
  } = useCartStore();

  const user = useAuthStore((s) => s.user);
  const [stage, setStage] = useState<Stage>('payment');
  const [submitting, setSubmitting] = useState(false);
  const [cashInput, setCashInput] = useState('');

  if (!open) return null;

  async function handleConfirm() {
    setSubmitting(true);

    const order: PendingOrder = {
      syncId: generateUUID(),
      tenantId: '', // filled by API from token
      cashierId: user?.id ?? '',
      status: 'pending',
      paymentMethod,
      items: items.map((i) => ({
        productId: i.productId,
        productName: i.productName,
        productBarcode: i.productBarcode,
        unitPriceCents: i.unitPriceCents,
        taxRateBps: i.taxRateBps,
        quantity: i.quantity,
        discountCents: i.discountCents,
        lineTotalCents: i.lineTotalCents,
      })),
      subtotalCents,
      discountCents,
      taxCents,
      totalCents,
      cashTenderedCents,
      changeCents,
      notes: null,
      createdAt: new Date().toISOString(),
      syncedAt: null,
      retryCount: 0,
      serverOrderId: null,
      serverOrderNumber: null,
      errorMessage: null,
    };

    // 1. Persist to IndexedDB immediately — works offline
    await db.pendingOrders.add(order);

    // 2. Attempt immediate sync if online
    if (navigator.onLine) {
      await syncPendingOrders();
    }

    setSubmitting(false);
    setStage('success');
    clear();
  }

  function handleClose() {
    setStage('payment');
    setCashInput('');
    onClose();
  }

  function appendCash(digit: string) {
    const next = (cashInput + digit).replace(/^0+(\d)/, '$1');
    setCashInput(next);
    setCashTendered(parseInt(next || '0', 10) * 100); // input in whole units
  }

  function clearCash() {
    setCashInput('');
    setCashTendered(0);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="bg-slate-800 rounded-2xl shadow-2xl w-full max-w-sm mx-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-700">
          <h2 className="text-lg font-bold">
            {stage === 'success' ? 'Sale Complete' : 'Checkout'}
          </h2>
          <button onClick={handleClose} className="text-slate-400 hover:text-white">
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="px-5 py-4">
          {stage === 'success' ? (
            <SuccessView onClose={handleClose} />
          ) : stage === 'cash' ? (
            <CashView
              totalCents={totalCents}
              cashInput={cashInput}
              changeCents={changeCents}
              onAppend={appendCash}
              onClear={clearCash}
              onBack={() => setStage('payment')}
              onConfirm={handleConfirm}
              submitting={submitting}
            />
          ) : (
            <PaymentView
              totalCents={totalCents}
              paymentMethod={paymentMethod}
              onSelect={setPaymentMethod}
              onCash={() => setStage('cash')}
              onCard={handleConfirm}
              submitting={submitting}
            />
          )}
        </div>
      </div>
    </div>
  );
}

// ── Sub-views ──────────────────────────────────────────────────────────────

function PaymentView({
  totalCents,
  paymentMethod,
  onSelect,
  onCash,
  onCard,
  submitting,
}: {
  totalCents: number;
  paymentMethod: PaymentMethod;
  onSelect: (m: PaymentMethod) => void;
  onCash: () => void;
  onCard: () => void;
  submitting: boolean;
}) {
  return (
    <div className="space-y-4">
      <div className="text-center">
        <p className="text-sm text-slate-400">Total</p>
        <p className="text-4xl font-bold text-blue-400">{formatCents(totalCents)}</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <PaymentButton
          icon={<Banknote size={24} />}
          label="Cash"
          active={paymentMethod === 'cash'}
          onClick={() => { onSelect('cash'); onCash(); }}
        />
        <PaymentButton
          icon={<CreditCard size={24} />}
          label="Card"
          active={paymentMethod === 'card'}
          onClick={() => { onSelect('card'); onCard(); }}
          loading={submitting && paymentMethod === 'card'}
        />
      </div>
    </div>
  );
}

function PaymentButton({
  icon,
  label,
  active,
  onClick,
  loading,
}: {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
  loading?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className={clsx(
        'flex flex-col items-center gap-2 py-5 rounded-xl border-2 font-semibold transition-all',
        active
          ? 'border-blue-500 bg-blue-600/20 text-blue-400'
          : 'border-slate-600 bg-slate-700 text-slate-300 hover:border-blue-600',
      )}
    >
      {icon}
      {loading ? 'Processing...' : label}
    </button>
  );
}

function CashView({
  totalCents,
  cashInput,
  changeCents,
  onAppend,
  onClear,
  onBack,
  onConfirm,
  submitting,
}: {
  totalCents: number;
  cashInput: string;
  changeCents: number;
  onAppend: (d: string) => void;
  onClear: () => void;
  onBack: () => void;
  onConfirm: () => void;
  submitting: boolean;
}) {
  const numpad = ['7','8','9','4','5','6','1','2','3','0','00','C'];

  return (
    <div className="space-y-3">
      <div className="text-center space-y-1">
        <p className="text-sm text-slate-400">Total: {formatCents(totalCents)}</p>
        <p className="text-3xl font-bold font-mono text-white">
          {cashInput ? `${cashInput}.00` : '0.00'}
        </p>
        {changeCents > 0 && (
          <p className="text-lg text-green-400 font-semibold">
            Change: {formatCents(changeCents)}
          </p>
        )}
      </div>

      <div className="grid grid-cols-3 gap-2">
        {numpad.map((k) => (
          <button
            key={k}
            onClick={() => k === 'C' ? onClear() : onAppend(k)}
            className={clsx(
              'py-3 rounded-xl text-lg font-mono font-semibold transition-all active:scale-95',
              k === 'C'
                ? 'bg-red-900/50 text-red-400 hover:bg-red-800/60'
                : 'bg-slate-700 text-slate-200 hover:bg-slate-600',
            )}
          >
            {k}
          </button>
        ))}
      </div>

      <div className="flex gap-2 pt-1">
        <button
          onClick={onBack}
          className="flex-1 py-2.5 rounded-xl border border-slate-600 text-slate-300 text-sm"
        >
          Back
        </button>
        <button
          onClick={onConfirm}
          disabled={submitting}
          className="flex-[2] py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500
                     text-white font-bold text-sm transition-colors disabled:opacity-50"
        >
          {submitting ? 'Processing...' : 'Complete Sale'}
        </button>
      </div>
    </div>
  );
}

function SuccessView({ onClose }: { onClose: () => void }) {
  return (
    <div className="flex flex-col items-center gap-4 py-4">
      <CheckCircle size={64} className="text-green-400" strokeWidth={1.5} />
      <div className="text-center">
        <p className="text-xl font-bold text-green-400">Sale Complete!</p>
        <p className="text-sm text-slate-400 mt-1">
          {navigator.onLine ? 'Synced to server.' : 'Saved offline — will sync when online.'}
        </p>
      </div>
      <button
        onClick={onClose}
        className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold"
      >
        New Sale
      </button>
    </div>
  );
}
