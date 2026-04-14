'use client';

import { ProductGrid } from '@/components/pos/ProductGrid';
import { Cart } from '@/components/pos/Cart';
import { SessionBar } from '@/components/pos/SessionBar';
import { useBarcodeScan } from '@/hooks/useBarcodeScan';
import { useAddItemByBarcode } from '@/hooks/useAddItemByBarcode';

/**
 * POS main screen.
 *
 * Layout (landscape):
 *   [Product Grid — 60%] | [Cart — 40%]
 *
 * Barcode scanners: handled globally via useBarcodeScan — no focus needed.
 */
export default function PosPage() {
  const addItemByBarcode = useAddItemByBarcode();
  useBarcodeScan(addItemByBarcode);

  return (
    <>
      {/* Product panel */}
      <section className="flex flex-col flex-1 overflow-hidden">
        <SessionBar />
        <div className="flex-1 overflow-y-auto pos-grid-scroll p-3">
          <ProductGrid />
        </div>
      </section>

      {/* Cart panel */}
      <aside className="w-80 lg:w-96 flex flex-col bg-slate-800 border-l border-slate-700 shrink-0">
        <Cart />
      </aside>
    </>
  );
}
