/**
 * useAddItemByBarcode — looks up a product in IndexedDB by barcode
 * and adds it to the cart. Called by the barcode scan hook.
 */
import { useCallback } from 'react';
import { db } from '@/lib/db';
import { useCartStore } from '@/store/cart.store';
import { toast } from '@/components/pos/Toast';

export function useAddItemByBarcode() {
  const addItem = useCartStore((s) => s.addItem);

  return useCallback(
    async (barcode: string) => {
      const product = await db.products
        .where('barcode')
        .equals(barcode)
        .and((p) => !!p.isActive)
        .first();

      if (!product) {
        toast.error(`Barcode not found: ${barcode}`);
        return;
      }

      addItem(product);
      toast.success(`${product.name} added`);
    },
    [addItem],
  );
}
