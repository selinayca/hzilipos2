'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { formatCents } from '@/lib/format';
import { useT } from '@/lib/i18n/context';
import { BarChart2, ShoppingBag, TrendingUp, CreditCard } from 'lucide-react';

interface DailyRow { day: string; orderCount: number; revenueCents: number; }
interface TopProduct { productName: string; qty: number; revenueCents: number; }
interface PaymentRow { paymentMethod: string; orderCount: number; revenueCents: number; }

interface Summary {
  from: string;
  to: string;
  totalOrders: number;
  totalRevenueCents: number;
  averageOrderCents: number;
  byDay: DailyRow[];
  topProducts: TopProduct[];
  byPaymentMethod: PaymentRow[];
}

function todayStr() {
  return new Date().toISOString().split('T')[0];
}
function daysAgoStr(n: number) {
  return new Date(Date.now() - n * 86400_000).toISOString().split('T')[0];
}

export default function ReportsPage() {
  const { t } = useT();
  const [from, setFrom] = useState(daysAgoStr(29));
  const [to, setTo] = useState(todayStr());
  const [appliedFrom, setAppliedFrom] = useState(from);
  const [appliedTo, setAppliedTo] = useState(to);

  const { data, isLoading } = useQuery<Summary>({
    queryKey: ['reports-summary', appliedFrom, appliedTo],
    queryFn: async () => {
      const { data } = await apiClient.get('/reports/summary', { params: { from: appliedFrom, to: appliedTo } });
      return data.data ?? data;
    },
  });

  function apply() {
    setAppliedFrom(from);
    setAppliedTo(to);
  }

  const paymentLabel = (method: string) => {
    if (method === 'cash') return t.reports_payment_cash;
    if (method === 'card') return t.reports_payment_card;
    if (method === 'mixed') return t.reports_payment_mixed;
    return method;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t.reports_title}</h1>
      </div>

      {/* Date range */}
      <div className="flex items-center gap-3 flex-wrap bg-white rounded-xl border border-gray-200 px-5 py-3">
        <div className="flex items-center gap-2">
          <label className="text-xs font-medium text-gray-600">{t.reports_from}</label>
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="text-sm border border-gray-300 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs font-medium text-gray-600">{t.reports_to}</label>
          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="text-sm border border-gray-300 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <button
          onClick={apply}
          className="px-4 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
        >
          {t.reports_apply}
        </button>
        {isLoading && <span className="text-xs text-gray-400">{t.loading}</span>}
      </div>

      {/* Summary cards */}
      {data && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatCard
              icon={<ShoppingBag size={20} className="text-blue-500" />}
              label={t.reports_total_orders}
              value={String(data.totalOrders)}
            />
            <StatCard
              icon={<TrendingUp size={20} className="text-green-500" />}
              label={t.reports_total_revenue}
              value={formatCents(data.totalRevenueCents)}
            />
            <StatCard
              icon={<BarChart2 size={20} className="text-purple-500" />}
              label={t.reports_avg_order}
              value={formatCents(data.averageOrderCents)}
            />
          </div>

          {data.totalOrders === 0 && (
            <p className="text-center text-gray-400 py-10">{t.reports_no_data}</p>
          )}

          {data.totalOrders > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Daily breakdown */}
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="px-5 py-3 border-b border-gray-100">
                  <h2 className="font-semibold text-sm">{t.reports_daily_breakdown}</h2>
                </div>
                <div className="overflow-auto max-h-80">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 sticky top-0">
                      <tr>
                        {[t.reports_col_day, t.reports_col_orders, t.reports_col_revenue].map((h) => (
                          <th key={h} className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {data.byDay.map((row) => (
                        <tr key={row.day} className="hover:bg-gray-50">
                          <td className="px-4 py-2 font-mono text-xs">{row.day}</td>
                          <td className="px-4 py-2">{row.orderCount}</td>
                          <td className="px-4 py-2 font-semibold text-blue-600">{formatCents(row.revenueCents)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Top products */}
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="px-5 py-3 border-b border-gray-100">
                  <h2 className="font-semibold text-sm">{t.reports_top_products}</h2>
                </div>
                <div className="overflow-auto max-h-80">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 sticky top-0">
                      <tr>
                        {[t.reports_col_product, t.reports_col_qty, t.reports_col_revenue].map((h) => (
                          <th key={h} className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {data.topProducts.map((row, i) => (
                        <tr key={i} className="hover:bg-gray-50">
                          <td className="px-4 py-2">{row.productName}</td>
                          <td className="px-4 py-2 font-semibold">{row.qty}</td>
                          <td className="px-4 py-2 text-blue-600">{formatCents(row.revenueCents)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Payment method breakdown */}
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="px-5 py-3 border-b border-gray-100">
                  <h2 className="font-semibold text-sm">{t.reports_by_payment}</h2>
                </div>
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      {[t.reports_col_method, t.reports_col_count, t.reports_col_revenue].map((h) => (
                        <th key={h} className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {data.byPaymentMethod.map((row) => (
                      <tr key={row.paymentMethod} className="hover:bg-gray-50">
                        <td className="px-4 py-2 flex items-center gap-2">
                          <CreditCard size={14} className="text-gray-400" />
                          {paymentLabel(row.paymentMethod)}
                        </td>
                        <td className="px-4 py-2">{row.orderCount}</td>
                        <td className="px-4 py-2 font-semibold text-blue-600">{formatCents(row.revenueCents)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 px-5 py-4 flex items-center gap-4">
      <div className="p-2 rounded-lg bg-gray-50">{icon}</div>
      <div>
        <p className="text-xs text-gray-500">{label}</p>
        <p className="text-xl font-bold text-gray-900">{value}</p>
      </div>
    </div>
  );
}
