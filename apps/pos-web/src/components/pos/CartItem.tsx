'use client';

import { CartItem as CartItemType, useCartStore } from '@/store/cart.store';
import { formatCents } from '@/lib/format';
import { Minus, Plus, X } from 'lucide-react';

interface Props {
  item: CartItemType;
}

export function CartItem({ item }: Props) {
  const { updateQty, removeItem } = useCartStore();

  return (
    <div className="flex items-center gap-2 py-2 border-b border-slate-700/50 last:border-0">
      {/* Item details */}
      <div className="flex-1 min-w-0">
        <p className="text-xs text-slate-200 truncate">{item.productName}</p>
        <p className="text-xs text-slate-500">{formatCents(item.unitPriceCents)} each</p>
      </div>

      {/* Qty controls */}
      <div className="flex items-center gap-1 shrink-0">
        <button
          onClick={() => updateQty(item.productId, item.quantity - 1)}
          className="w-6 h-6 rounded-md bg-slate-700 hover:bg-slate-600
                     flex items-center justify-center transition-colors"
        >
          <Minus size={12} />
        </button>
        <span className="w-6 text-center text-sm font-mono">{item.quantity}</span>
        <button
          onClick={() => updateQty(item.productId, item.quantity + 1)}
          className="w-6 h-6 rounded-md bg-slate-700 hover:bg-slate-600
                     flex items-center justify-center transition-colors"
        >
          <Plus size={12} />
        </button>
      </div>

      {/* Line total */}
      <span className="text-sm font-semibold text-right w-16 shrink-0">
        {formatCents(item.lineTotalCents)}
      </span>

      {/* Remove */}
      <button
        onClick={() => removeItem(item.productId)}
        className="text-slate-600 hover:text-red-400 transition-colors shrink-0"
      >
        <X size={14} />
      </button>
    </div>
  );
}
