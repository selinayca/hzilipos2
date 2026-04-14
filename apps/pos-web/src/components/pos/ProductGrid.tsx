'use client';

import { useState, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, LocalProduct, LocalCategory } from '@/lib/db';
import { useCartStore } from '@/store/cart.store';
import { formatCents } from '@/lib/format';
import { clsx } from 'clsx';

export function ProductGrid() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const addItem = useCartStore((s) => s.addItem);

  // Reactive queries from IndexedDB — updates automatically when data changes
  const categories = useLiveQuery<LocalCategory[]>(
    () => db.categories.orderBy('sortOrder').toArray(),
    [],
  );

  const products = useLiveQuery<LocalProduct[]>(
    () => {
      let q = db.products.where('isActive').equals(1 as any); // Dexie bool index
      return q.toArray();
    },
    [],
  );

  const filtered = useMemo(() => {
    if (!products) return [];
    let result = products;

    if (selectedCategory) {
      result = result.filter((p) => p.categoryId === selectedCategory);
    }

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          (p.barcode ?? '').includes(q),
      );
    }

    return result;
  }, [products, selectedCategory, search]);

  return (
    <div className="flex flex-col h-full gap-3 pos-no-select">
      {/* Search bar */}
      <input
        type="search"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search or scan barcode..."
        className="w-full px-3 py-2 rounded-lg bg-slate-700 border border-slate-600
                   text-slate-100 placeholder-slate-400 focus:outline-none
                   focus:ring-2 focus:ring-blue-500 text-sm"
      />

      {/* Category filter */}
      {categories && categories.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-1 shrink-0">
          <CategoryChip
            label="All"
            active={selectedCategory === null}
            onClick={() => setSelectedCategory(null)}
          />
          {categories.map((c) => (
            <CategoryChip
              key={c.id}
              label={c.name}
              active={selectedCategory === c.id}
              color={c.colorHex ?? undefined}
              onClick={() =>
                setSelectedCategory(selectedCategory === c.id ? null : c.id)
              }
            />
          ))}
        </div>
      )}

      {/* Product grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 overflow-y-auto">
        {filtered.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            onAdd={() => addItem(product)}
          />
        ))}

        {filtered.length === 0 && (
          <div className="col-span-full text-center py-12 text-slate-500 text-sm">
            {search ? 'No products match your search.' : 'No products available.'}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Sub-components ─────────────────────────────────────────────────────────

function CategoryChip({
  label,
  active,
  color,
  onClick,
}: {
  label: string;
  active: boolean;
  color?: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={clsx(
        'shrink-0 px-3 py-1 rounded-full text-xs font-medium transition-colors',
        active
          ? 'bg-blue-600 text-white'
          : 'bg-slate-700 text-slate-300 hover:bg-slate-600',
      )}
      style={active && color ? { backgroundColor: color } : undefined}
    >
      {label}
    </button>
  );
}

function ProductCard({
  product,
  onAdd,
}: {
  product: LocalProduct;
  onAdd: () => void;
}) {
  const outOfStock = product.trackStock && product.stockQty <= 0;

  return (
    <button
      onClick={onAdd}
      disabled={outOfStock}
      className={clsx(
        'relative flex flex-col items-start p-3 rounded-xl border transition-all',
        'text-left active:scale-95',
        outOfStock
          ? 'border-slate-700 bg-slate-800/50 opacity-50 cursor-not-allowed'
          : 'border-slate-600 bg-slate-800 hover:border-blue-500 hover:bg-slate-750 cursor-pointer',
      )}
    >
      {/* Product image or placeholder */}
      <div className="w-full aspect-square rounded-lg bg-slate-700 mb-2 overflow-hidden">
        {product.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={product.imageUrl}
            alt={product.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-3xl select-none">
            🛒
          </div>
        )}
      </div>

      <span className="text-xs text-slate-300 leading-tight line-clamp-2 mb-1">
        {product.name}
      </span>
      <span className="text-sm font-bold text-blue-400">
        {formatCents(product.priceCents)}
      </span>

      {product.trackStock && (
        <span
          className={clsx(
            'absolute top-2 right-2 text-xs px-1.5 py-0.5 rounded-full font-mono',
            product.stockQty <= 5
              ? 'bg-red-900/80 text-red-300'
              : 'bg-slate-700 text-slate-400',
          )}
        >
          {product.stockQty}
        </span>
      )}
    </button>
  );
}
