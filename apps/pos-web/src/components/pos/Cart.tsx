'use client';

import { useState } from 'react';
import { useCartStore } from '@/store/cart.store';
import { CartItem } from '@/components/pos/CartItem';
import { CheckoutModal } from '@/components/pos/CheckoutModal';
import { formatCents } from '@/lib/format';
import { ShoppingCart, Trash2 } from 'lucide-react';

export function Cart() {
  const { items, subtotalCents, taxCents, discountCents, totalCents, clear } =
    useCartStore();
  const [checkoutOpen, setCheckoutOpen] = useState(false);

  const isEmpty = items.length === 0;

  return (
    <>
      <div className="flex flex-col h-full">
        {/* Cart header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700 shrink-0">
          <div className="flex items-center gap-2">
            <ShoppingCart size={18} className="text-blue-400" />
            <span className="font-semibold text-sm">
              Cart
              {items.length > 0 && (
                <span className="ml-1.5 text-xs bg-blue-600 text-white rounded-full px-1.5 py-0.5">
                  {items.length}
                </span>
              )}
            </span>
          </div>
          {!isEmpty && (
            <button
              onClick={clear}
              className="text-slate-400 hover:text-red-400 transition-colors"
              title="Clear cart"
            >
              <Trash2 size={16} />
            </button>
          )}
        </div>

        {/* Cart items */}
        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1">
          {isEmpty ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-500 text-sm gap-2">
              <ShoppingCart size={36} strokeWidth={1} />
              <span>Cart is empty</span>
              <span className="text-xs">Tap a product to add it</span>
            </div>
          ) : (
            items.map((item) => <CartItem key={item.productId} item={item} />)
          )}
        </div>

        {/* Totals + checkout */}
        {!isEmpty && (
          <div className="border-t border-slate-700 px-4 py-3 space-y-1 shrink-0">
            <div className="flex justify-between text-sm text-slate-400">
              <span>Subtotal</span>
              <span>{formatCents(subtotalCents)}</span>
            </div>
            {discountCents > 0 && (
              <div className="flex justify-between text-sm text-green-400">
                <span>Discount</span>
                <span>- {formatCents(discountCents)}</span>
              </div>
            )}
            {taxCents > 0 && (
              <div className="flex justify-between text-sm text-slate-400">
                <span>Tax</span>
                <span>{formatCents(taxCents)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-base pt-1 border-t border-slate-700">
              <span>TOTAL</span>
              <span className="text-blue-400">{formatCents(totalCents)}</span>
            </div>

            <button
              onClick={() => setCheckoutOpen(true)}
              className="mt-2 w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500
                         text-white font-bold text-sm transition-colors active:scale-95"
            >
              Charge {formatCents(totalCents)}
            </button>
          </div>
        )}
      </div>

      <CheckoutModal
        open={checkoutOpen}
        onClose={() => setCheckoutOpen(false)}
      />
    </>
  );
}
