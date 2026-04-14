'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { formatCents } from '@/lib/format';
import { ProductForm } from '@/components/products/ProductForm';
import { Plus, Search, Pencil, Trash2 } from 'lucide-react';

interface Product {
  id: string;
  name: string;
  barcode: string | null;
  priceCents: number;
  isActive: boolean;
  category: { name: string } | null;
  stock: { quantity: number } | null;
}

interface ProductPage {
  items: Product[];
  total: number;
  page: number;
  pages: number;
}

async function fetchProducts(search: string, page: number): Promise<ProductPage> {
  const { data } = await apiClient.get('/products', {
    params: { search: search || undefined, page, limit: 20 },
  });
  return data.data;
}

export default function ProductsPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['products', search, page],
    queryFn: () => fetchProducts(search, page),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiClient.delete(`/products/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['products'] }),
  });

  function openCreate() { setEditing(null); setFormOpen(true); }
  function openEdit(p: Product) { setEditing(p); setFormOpen(true); }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Products</h1>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus size={16} />
          Add Product
        </button>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="search"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          placeholder="Search by name or barcode..."
          className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              {['Name', 'Barcode', 'Category', 'Price', 'Stock', 'Status', ''].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {isLoading && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-gray-400">Loading...</td>
              </tr>
            )}
            {data?.items.map((p) => (
              <tr key={p.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium">{p.name}</td>
                <td className="px-4 py-3 font-mono text-xs text-gray-500">{p.barcode ?? '—'}</td>
                <td className="px-4 py-3 text-gray-600">{p.category?.name ?? '—'}</td>
                <td className="px-4 py-3 font-semibold text-blue-600">{formatCents(p.priceCents)}</td>
                <td className="px-4 py-3 text-gray-600">{p.stock?.quantity ?? '—'}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${p.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {p.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <button onClick={() => openEdit(p)} className="text-gray-400 hover:text-blue-600">
                      <Pencil size={14} />
                    </button>
                    <button
                      onClick={() => { if (confirm('Delete this product?')) deleteMutation.mutate(p.id); }}
                      className="text-gray-400 hover:text-red-600"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Pagination */}
        {data && data.pages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200">
            <p className="text-xs text-gray-500">
              {data.total} products, page {data.page} of {data.pages}
            </p>
            <div className="flex gap-1">
              <PageBtn onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} label="Prev" />
              <PageBtn onClick={() => setPage((p) => Math.min(data.pages, p + 1))} disabled={page === data.pages} label="Next" />
            </div>
          </div>
        )}
      </div>

      {formOpen && (
        <ProductForm
          product={editing}
          onClose={() => setFormOpen(false)}
          onSaved={() => { setFormOpen(false); qc.invalidateQueries({ queryKey: ['products'] }); }}
        />
      )}
    </div>
  );
}

function PageBtn({ onClick, disabled, label }: { onClick: () => void; disabled: boolean; label: string }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="px-3 py-1 text-xs rounded border border-gray-300 disabled:opacity-40 hover:bg-gray-100 transition-colors"
    >
      {label}
    </button>
  );
}
