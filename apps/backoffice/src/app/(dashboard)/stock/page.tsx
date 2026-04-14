'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { formatCents } from '@/lib/format';
import { AlertTriangle, Plus, Minus, RefreshCw } from 'lucide-react';
import { clsx } from 'clsx';

interface StockItem {
  id: string;
  productId: string;
  quantity: number;
  lowStockThreshold: number;
  product: {
    id: string;
    name: string;
    barcode: string | null;
    priceCents: number;
    isActive: boolean;
    category: { name: string } | null;
  };
}

async function fetchLowStock(): Promise<StockItem[]> {
  const { data } = await apiClient.get('/stock/low');
  return data.data;
}

async function fetchAllStock(): Promise<{ items: StockItem[]; total: number }> {
  // Products endpoint includes stock relation
  const { data } = await apiClient.get('/products', { params: { limit: 200 } });
  const items = data.data.items
    .filter((p: any) => p.trackStock)
    .map((p: any) => ({
      id: p.stock?.id ?? '',
      productId: p.id,
      quantity: p.stock?.quantity ?? 0,
      lowStockThreshold: p.stock?.lowStockThreshold ?? 5,
      product: {
        id: p.id,
        name: p.name,
        barcode: p.barcode,
        priceCents: p.priceCents,
        isActive: p.isActive,
        category: p.category,
      },
    }));
  return { items, total: items.length };
}

type ViewMode = 'all' | 'low';

export default function StockPage() {
  const qc = useQueryClient();
  const [viewMode, setViewMode] = useState<ViewMode>('all');
  const [adjusting, setAdjusting] = useState<{ productId: string; name: string } | null>(null);
  const [delta, setDelta] = useState('');
  const [adjustError, setAdjustError] = useState('');

  const { data: allData, isLoading: allLoading } = useQuery({
    queryKey: ['stock', 'all'],
    queryFn: fetchAllStock,
  });

  const { data: lowData, isLoading: lowLoading } = useQuery({
    queryKey: ['stock', 'low'],
    queryFn: fetchLowStock,
  });

  const adjustMutation = useMutation({
    mutationFn: ({ productId, delta }: { productId: string; delta: number }) =>
      apiClient.patch(`/stock/${productId}/adjust`, { delta }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['stock'] });
      setAdjusting(null);
      setDelta('');
      setAdjustError('');
    },
    onError: (err: any) => {
      setAdjustError(err?.response?.data?.message ?? 'Adjustment failed');
    },
  });

  const displayItems = viewMode === 'low' ? lowData ?? [] : allData?.items ?? [];
  const isLoading = viewMode === 'low' ? lowLoading : allLoading;
  const lowCount = lowData?.length ?? 0;

  function submitAdjust(sign: 1 | -1) {
    if (!adjusting || !delta) return;
    const val = parseInt(delta, 10);
    if (isNaN(val) || val <= 0) {
      setAdjustError('Enter a positive number');
      return;
    }
    adjustMutation.mutate({ productId: adjusting.productId, delta: sign * val });
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">Stock</h1>
          {lowCount > 0 && (
            <p className="text-sm text-red-600 flex items-center gap-1 mt-0.5">
              <AlertTriangle size={14} />
              {lowCount} product{lowCount !== 1 ? 's' : ''} below threshold
            </p>
          )}
        </div>
        <button
          onClick={() => qc.invalidateQueries({ queryKey: ['stock'] })}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 border border-gray-300 px-3 py-1.5 rounded-lg"
        >
          <RefreshCw size={14} />
          Refresh
        </button>
      </div>

      {/* View toggle */}
      <div className="flex gap-1 bg-gray-100 rounded-lg p-1 w-fit">
        {(['all', 'low'] as ViewMode[]).map((v) => (
          <button
            key={v}
            onClick={() => setViewMode(v)}
            className={clsx(
              'px-4 py-1.5 rounded-md text-sm font-medium transition-all capitalize',
              viewMode === v
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700',
            )}
          >
            {v === 'low' ? `Low Stock${lowCount > 0 ? ` (${lowCount})` : ''}` : 'All Products'}
          </button>
        ))}
      </div>

      {/* Stock table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              {['Product', 'Category', 'Price', 'In Stock', 'Threshold', 'Status', 'Adjust'].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {isLoading && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-gray-400">
                  Loading...
                </td>
              </tr>
            )}
            {!isLoading && displayItems.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-gray-400">
                  {viewMode === 'low'
                    ? 'All products are well-stocked.'
                    : 'No tracked products found.'}
                </td>
              </tr>
            )}
            {displayItems.map((item: StockItem) => {
              const isLow = item.quantity <= item.lowStockThreshold;
              const isOut = item.quantity === 0;
              return (
                <tr key={item.productId} className={clsx('hover:bg-gray-50', isLow && 'bg-red-50/40')}>
                  <td className="px-4 py-3">
                    <div>
                      <p className="font-medium text-gray-900">{item.product.name}</p>
                      {item.product.barcode && (
                        <p className="text-xs text-gray-400 font-mono">{item.product.barcode}</p>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">
                    {item.product.category?.name ?? '—'}
                  </td>
                  <td className="px-4 py-3 text-blue-600 font-semibold">
                    {formatCents(item.product.priceCents)}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={clsx(
                        'text-lg font-bold font-mono',
                        isOut ? 'text-red-600' : isLow ? 'text-orange-500' : 'text-gray-800',
                      )}
                    >
                      {item.quantity}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500 font-mono text-sm">
                    {item.lowStockThreshold}
                  </td>
                  <td className="px-4 py-3">
                    {isOut ? (
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">
                        Out of stock
                      </span>
                    ) : isLow ? (
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-700">
                        Low stock
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                        OK
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => {
                        setAdjusting({ productId: item.productId, name: item.product.name });
                        setDelta('');
                        setAdjustError('');
                      }}
                      className="text-xs px-2.5 py-1 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors"
                    >
                      Adjust
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Adjust modal */}
      {adjusting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-xs mx-4 p-6 space-y-4">
            <h3 className="font-bold text-gray-900">Adjust Stock</h3>
            <p className="text-sm text-gray-500 truncate">{adjusting.name}</p>

            {adjustError && (
              <p className="text-sm text-red-600">{adjustError}</p>
            )}

            <input
              type="number"
              min="1"
              value={delta}
              onChange={(e) => setDelta(e.target.value)}
              placeholder="Quantity"
              autoFocus
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => submitAdjust(1)}
                disabled={adjustMutation.isPending}
                className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-green-600 hover:bg-green-700 text-white text-sm font-semibold disabled:opacity-50"
              >
                <Plus size={15} />
                Receive
              </button>
              <button
                onClick={() => submitAdjust(-1)}
                disabled={adjustMutation.isPending}
                className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold disabled:opacity-50"
              >
                <Minus size={15} />
                Deduct
              </button>
            </div>

            <button
              onClick={() => setAdjusting(null)}
              className="w-full py-2 text-sm text-gray-500 hover:text-gray-800 border border-gray-200 rounded-xl"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
