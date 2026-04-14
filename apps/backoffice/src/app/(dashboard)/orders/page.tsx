'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { formatCents } from '@/lib/format';

interface Order {
  id: string;
  orderNumber: string;
  status: string;
  paymentMethod: string;
  totalCents: number;
  createdAt: string;
  cashier: { name: string } | null;
}

async function fetchOrders(page: number, from: string, to: string) {
  const { data } = await apiClient.get('/orders', {
    params: { page, limit: 20, from: from || undefined, to: to || undefined },
  });
  return data.data;
}

const STATUS_COLORS: Record<string, string> = {
  paid: 'bg-green-100 text-green-700',
  pending: 'bg-yellow-100 text-yellow-700',
  refunded: 'bg-red-100 text-red-700',
  void: 'bg-gray-100 text-gray-500',
};

const PAYMENT_ICONS: Record<string, string> = {
  cash: '💵',
  card: '💳',
  mixed: '🔀',
};

export default function OrdersPage() {
  const [page, setPage] = useState(1);
  const today = new Date().toISOString().split('T')[0];
  const [from, setFrom] = useState(today);
  const [to, setTo] = useState(today);

  const { data, isLoading } = useQuery({
    queryKey: ['orders', page, from, to],
    queryFn: () => fetchOrders(page, from, to),
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold">Orders</h1>
        <div className="flex items-center gap-2 text-sm">
          <label className="text-gray-500">From</label>
          <input type="date" value={from} onChange={(e) => { setFrom(e.target.value); setPage(1); }}
            className="border border-gray-300 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          <label className="text-gray-500">To</label>
          <input type="date" value={to} onChange={(e) => { setTo(e.target.value); setPage(1); }}
            className="border border-gray-300 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              {['Order #', 'Cashier', 'Payment', 'Total', 'Status', 'Time'].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {isLoading && (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">Loading...</td></tr>
            )}
            {data?.items.map((o: Order) => (
              <tr key={o.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-mono font-semibold text-gray-700">{o.orderNumber}</td>
                <td className="px-4 py-3 text-gray-600">{o.cashier?.name ?? '—'}</td>
                <td className="px-4 py-3">
                  <span className="text-base">{PAYMENT_ICONS[o.paymentMethod] ?? '?'}</span>
                  <span className="ml-1 capitalize text-gray-600">{o.paymentMethod}</span>
                </td>
                <td className="px-4 py-3 font-semibold text-gray-900">{formatCents(o.totalCents)}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${STATUS_COLORS[o.status] ?? 'bg-gray-100'}`}>
                    {o.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-500 text-xs">
                  {new Date(o.createdAt).toLocaleTimeString('tr-TR')}
                </td>
              </tr>
            ))}
            {!isLoading && data?.items.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">No orders found for this date range.</td></tr>
            )}
          </tbody>
        </table>

        {data && data.pages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200">
            <p className="text-xs text-gray-500">{data.total} orders</p>
            <div className="flex gap-1">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
                className="px-3 py-1 text-xs rounded border border-gray-300 disabled:opacity-40 hover:bg-gray-100">Prev</button>
              <button onClick={() => setPage((p) => Math.min(data.pages, p + 1))} disabled={page === data.pages}
                className="px-3 py-1 text-xs rounded border border-gray-300 disabled:opacity-40 hover:bg-gray-100">Next</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
