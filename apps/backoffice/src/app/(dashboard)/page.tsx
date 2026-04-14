'use client';

import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { formatCents } from '@/lib/format';
import { ShoppingCart, Package, TrendingUp, AlertTriangle } from 'lucide-react';

interface DashboardStats {
  todayOrderCount: number;
  todayRevenueCents: number;
  lowStockCount: number;
  totalProductCount: number;
}

async function fetchStats(): Promise<DashboardStats> {
  // In MVP, we derive these from the orders/stock endpoints
  const [ordersRes, stockRes, productsRes] = await Promise.all([
    apiClient.get('/orders', { params: { limit: 1, from: new Date().toISOString().split('T')[0] } }),
    apiClient.get('/stock/low'),
    apiClient.get('/products', { params: { limit: 1 } }),
  ]);
  return {
    todayOrderCount: ordersRes.data.data.total,
    todayRevenueCents: 0, // TODO: aggregate endpoint
    lowStockCount: ordersRes.data.data.items.length,
    totalProductCount: productsRes.data.data.total,
  };
}

export default function DashboardPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: fetchStats,
    refetchInterval: 60_000,
  });

  const stats = [
    {
      label: "Today's Orders",
      value: data?.todayOrderCount ?? 0,
      icon: <ShoppingCart size={20} />,
      color: 'text-blue-600 bg-blue-100',
    },
    {
      label: "Today's Revenue",
      value: formatCents(data?.todayRevenueCents ?? 0),
      icon: <TrendingUp size={20} />,
      color: 'text-green-600 bg-green-100',
    },
    {
      label: 'Total Products',
      value: data?.totalProductCount ?? 0,
      icon: <Package size={20} />,
      color: 'text-purple-600 bg-purple-100',
    },
    {
      label: 'Low Stock Alerts',
      value: data?.lowStockCount ?? 0,
      icon: <AlertTriangle size={20} />,
      color: 'text-red-600 bg-red-100',
    },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => (
          <div key={s.label} className="bg-white rounded-xl shadow-sm p-5 flex items-center gap-4">
            <div className={`p-3 rounded-lg ${s.color}`}>{s.icon}</div>
            <div>
              <p className="text-sm text-gray-500">{s.label}</p>
              <p className="text-2xl font-bold text-gray-900">
                {isLoading ? '—' : s.value}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
