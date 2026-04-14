/**
 * Cart Store (Zustand)
 *
 * Manages the in-progress sale:
 *   - Line items (product + qty + price snapshot)
 *   - Discount
 *   - Payment method selection
 *   - Cash tendered / change calculation
 *
 * All money arithmetic uses integer cents to avoid floating point issues.
 * Tax is calculated per-line based on the product's taxRateBps.
 */
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { LocalProduct } from '../lib/db';

export interface CartItem {
  productId: string;
  productName: string;
  productBarcode: string | null;
  unitPriceCents: number;
  taxRateBps: number;
  quantity: number;
  discountCents: number;
  lineTotalCents: number; // (unitPrice * qty) - itemDiscount
}

export type PaymentMethod = 'cash' | 'card' | 'mixed';

interface CartState {
  items: CartItem[];
  discountCents: number;
  paymentMethod: PaymentMethod;
  cashTenderedCents: number;

  // Computed
  subtotalCents: number;
  taxCents: number;
  totalCents: number;
  changeCents: number;

  // Actions
  addItem: (product: LocalProduct) => void;
  removeItem: (productId: string) => void;
  updateQty: (productId: string, qty: number) => void;
  setItemDiscount: (productId: string, discountCents: number) => void;
  setOrderDiscount: (discountCents: number) => void;
  setPaymentMethod: (method: PaymentMethod) => void;
  setCashTendered: (cents: number) => void;
  clear: () => void;
}

function computeTotals(items: CartItem[], discountCents: number, cashTendered: number) {
  const subtotalCents = items.reduce((sum, i) => sum + i.lineTotalCents, 0);
  const taxCents = items.reduce((sum, i) => {
    const lineBeforeTax = i.unitPriceCents * i.quantity - i.discountCents;
    return sum + Math.round(lineBeforeTax * (i.taxRateBps / 10_000));
  }, 0);
  const totalCents = Math.max(0, subtotalCents - discountCents + taxCents);
  const changeCents = Math.max(0, cashTendered - totalCents);
  return { subtotalCents, taxCents, totalCents, changeCents };
}

const initialState = {
  items: [] as CartItem[],
  discountCents: 0,
  paymentMethod: 'cash' as PaymentMethod,
  cashTenderedCents: 0,
  subtotalCents: 0,
  taxCents: 0,
  totalCents: 0,
  changeCents: 0,
};

export const useCartStore = create<CartState>()(
  devtools(
    (set, get) => ({
      ...initialState,

      addItem(product: LocalProduct) {
        const { items, discountCents, cashTenderedCents } = get();
        const existing = items.find((i) => i.productId === product.id);

        let nextItems: CartItem[];
        if (existing) {
          // Increment quantity
          nextItems = items.map((i) =>
            i.productId === product.id
              ? {
                  ...i,
                  quantity: i.quantity + 1,
                  lineTotalCents:
                    i.unitPriceCents * (i.quantity + 1) - i.discountCents,
                }
              : i,
          );
        } else {
          nextItems = [
            ...items,
            {
              productId: product.id,
              productName: product.name,
              productBarcode: product.barcode,
              unitPriceCents: product.priceCents,
              taxRateBps: product.taxRateBps,
              quantity: 1,
              discountCents: 0,
              lineTotalCents: product.priceCents,
            },
          ];
        }

        set({
          items: nextItems,
          ...computeTotals(nextItems, discountCents, cashTenderedCents),
        });
      },

      removeItem(productId: string) {
        const { items, discountCents, cashTenderedCents } = get();
        const nextItems = items.filter((i) => i.productId !== productId);
        set({
          items: nextItems,
          ...computeTotals(nextItems, discountCents, cashTenderedCents),
        });
      },

      updateQty(productId: string, qty: number) {
        if (qty <= 0) {
          get().removeItem(productId);
          return;
        }
        const { items, discountCents, cashTenderedCents } = get();
        const nextItems = items.map((i) =>
          i.productId === productId
            ? {
                ...i,
                quantity: qty,
                lineTotalCents: i.unitPriceCents * qty - i.discountCents,
              }
            : i,
        );
        set({
          items: nextItems,
          ...computeTotals(nextItems, discountCents, cashTenderedCents),
        });
      },

      setItemDiscount(productId: string, discountCents: number) {
        const { items, discountCents: orderDiscount, cashTenderedCents } = get();
        const nextItems = items.map((i) =>
          i.productId === productId
            ? {
                ...i,
                discountCents,
                lineTotalCents: Math.max(
                  0,
                  i.unitPriceCents * i.quantity - discountCents,
                ),
              }
            : i,
        );
        set({
          items: nextItems,
          ...computeTotals(nextItems, orderDiscount, cashTenderedCents),
        });
      },

      setOrderDiscount(discountCents: number) {
        const { items, cashTenderedCents } = get();
        set({
          discountCents,
          ...computeTotals(items, discountCents, cashTenderedCents),
        });
      },

      setPaymentMethod(method: PaymentMethod) {
        set({ paymentMethod: method });
      },

      setCashTendered(cents: number) {
        const { items, discountCents } = get();
        const totals = computeTotals(items, discountCents, cents);
        set({ cashTenderedCents: cents, ...totals });
      },

      clear() {
        set(initialState);
      },
    }),
    { name: 'cart' },
  ),
);
