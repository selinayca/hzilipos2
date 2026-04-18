'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { Plus, Eye } from 'lucide-react';
import { formatCents } from '@/lib/format';
import { useT } from '@/lib/i18n/context';

interface Product { id: string; name: string; priceCents: number; }

interface PriceChange {
  id: string;
  documentNumber: string;
  description: string | null;
  personnelName: string | null;
  occurredAt: string;
  lines: PriceChangeLine[];
}

interface PriceChangeLine {
  productId: string;
  productName: string;
  oldPriceCents: number;
  newPriceCents: number;
  purchasePriceCents: number | null;
  taxRateBps: number | null;
}

interface PriceChangePage { items: PriceChange[]; total: number; page: number; pages: number; }
interface LineForm { productId: string; productName: string; oldPriceCents: string; newPriceCents: string; purchasePriceCents: string; taxRateBps: string; }

export default function PriceChangesPage() {
  const { t } = useT();
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [createOpen, setCreateOpen] = useState(false);
  const [detailItem, setDetailItem] = useState<PriceChange | null>(null);

  const [description, setDescription] = useState('');
  const [personnelName, setPersonnelName] = useState('');
  const [occurredAt, setOccurredAt] = useState(() => new Date().toISOString().slice(0, 16));
  const [lines, setLines] = useState<LineForm[]>([{ productId: '', productName: '', oldPriceCents: '0', newPriceCents: '0', purchasePriceCents: '', taxRateBps: '' }]);

  const { data, isLoading } = useQuery<PriceChangePage>({
    queryKey: ['price-changes', page],
    queryFn: async () => (await apiClient.get('/price-changes', { params: { page, limit: 20 } })).data.data,
  });

  const { data: products = [] } = useQuery<Product[]>({
    queryKey: ['products-all'],
    queryFn: async () => (await apiClient.get('/products', { params: { limit: 500 } })).data.data.items,
    enabled: createOpen,
  });

  const createMutation = useMutation({
    mutationFn: (payload: object) => apiClient.post('/price-changes', payload),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['price-changes'] }); setCreateOpen(false); resetForm(); },
  });

  function resetForm() {
    setDescription(''); setPersonnelName(''); setOccurredAt(new Date().toISOString().slice(0, 16));
    setLines([{ productId: '', productName: '', oldPriceCents: '0', newPriceCents: '0', purchasePriceCents: '', taxRateBps: '' }]);
  }

  function addLine() { setLines([...lines, { productId: '', productName: '', oldPriceCents: '0', newPriceCents: '0', purchasePriceCents: '', taxRateBps: '' }]); }
  function removeLine(i: number) { setLines(lines.filter((_, idx) => idx !== i)); }
  function updateLine(i: number, field: keyof LineForm, value: string) {
    const updated = [...lines];
    updated[i] = { ...updated[i], [field]: value };
    if (field === 'productId') {
      const p = products.find((x) => x.id === value);
      if (p) { updated[i].productName = p.name; updated[i].oldPriceCents = String(p.priceCents); }
    }
    setLines(updated);
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    createMutation.mutate({
      description: description || undefined,
      personnelName: personnelName || undefined,
      occurredAt: new Date(occurredAt).toISOString(),
      lines: lines.map((l) => ({
        productId: l.productId,
        productName: l.productName,
        oldPriceCents: Number(l.oldPriceCents),
        newPriceCents: Number(l.newPriceCents),
        purchasePriceCents: l.purchasePriceCents ? Number(l.purchasePriceCents) : undefined,
        taxRateBps: l.taxRateBps ? Number(l.taxRateBps) : undefined,
      })),
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t.price_changes_title}</h1>
        <button onClick={() => setCreateOpen(true)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors">
          <Plus size={16} /> {t.price_changes_new_btn}
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              {[t.price_changes_col_doc, t.price_changes_col_desc, t.price_changes_col_personnel, t.price_changes_col_date, t.price_changes_col_products, ''].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {isLoading && <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">{t.loading}</td></tr>}
            {data?.items.map((item) => (
              <tr key={item.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-mono text-xs font-semibold">{item.documentNumber}</td>
                <td className="px-4 py-3 text-gray-600">{item.description ?? '—'}</td>
                <td className="px-4 py-3 text-gray-600">{item.personnelName ?? '—'}</td>
                <td className="px-4 py-3 text-gray-500">{new Date(item.occurredAt).toLocaleDateString()}</td>
                <td className="px-4 py-3 text-gray-600">{item.lines?.length ?? '—'}</td>
                <td className="px-4 py-3">
                  <button onClick={() => setDetailItem(item)} className="text-gray-400 hover:text-blue-600"><Eye size={14} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {data && data.pages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200">
            <p className="text-xs text-gray-500">{t.items_total(data.total, t.price_changes_total)}, {t.page_of(data.page, data.pages)}</p>
            <div className="flex gap-1">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1 text-xs rounded border border-gray-300 disabled:opacity-40 hover:bg-gray-100">{t.prev}</button>
              <button onClick={() => setPage((p) => Math.min(data.pages, p + 1))} disabled={page === data.pages} className="px-3 py-1 text-xs rounded border border-gray-300 disabled:opacity-40 hover:bg-gray-100">{t.next}</button>
            </div>
          </div>
        )}
      </div>

      {/* Create Modal */}
      {createOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-start justify-center z-50 overflow-y-auto py-8">
          <form onSubmit={submit} className="bg-white rounded-xl shadow-xl p-6 w-full max-w-2xl space-y-4 mx-4">
            <h2 className="text-lg font-bold">{t.price_changes_new}</h2>

            <div className="grid grid-cols-2 gap-4">
              <label className="block space-y-1 col-span-2">
                <span className="text-sm font-medium text-gray-700">{t.price_changes_field_desc}</span>
                <input value={description} onChange={(e) => setDescription(e.target.value)} className="input" />
              </label>
              <label className="block space-y-1">
                <span className="text-sm font-medium text-gray-700">{t.price_changes_field_personnel}</span>
                <input value={personnelName} onChange={(e) => setPersonnelName(e.target.value)} className="input" />
              </label>
              <label className="block space-y-1">
                <span className="text-sm font-medium text-gray-700">{t.price_changes_field_date}</span>
                <input type="datetime-local" value={occurredAt} onChange={(e) => setOccurredAt(e.target.value)} className="input" />
              </label>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-gray-700">{t.price_changes_products_section}</span>
                <button type="button" onClick={addLine} className="text-xs text-blue-600 hover:text-blue-700 font-medium">{t.price_changes_add_product}</button>
              </div>
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <table className="w-full text-xs">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-3 py-2 text-left font-medium text-gray-500">{t.stock_movements_col_product}</th>
                      <th className="px-3 py-2 text-left font-medium text-gray-500">{t.price_changes_col_old_price}</th>
                      <th className="px-3 py-2 text-left font-medium text-gray-500">{t.price_changes_col_new_price}</th>
                      <th className="px-3 py-2 text-left font-medium text-gray-500">{t.price_changes_col_purchase}</th>
                      <th className="px-3 py-2" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {lines.map((line, i) => (
                      <tr key={i}>
                        <td className="px-3 py-2">
                          <select value={line.productId} onChange={(e) => updateLine(i, 'productId', e.target.value)} required className="select text-xs py-1">
                            <option value="">{t.price_changes_select_product}</option>
                            {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                          </select>
                        </td>
                        <td className="px-3 py-2"><input type="number" min="0" value={line.oldPriceCents} onChange={(e) => updateLine(i, 'oldPriceCents', e.target.value)} className="input text-xs py-1 w-24" /></td>
                        <td className="px-3 py-2"><input type="number" min="0" required value={line.newPriceCents} onChange={(e) => updateLine(i, 'newPriceCents', e.target.value)} className="input text-xs py-1 w-24" /></td>
                        <td className="px-3 py-2"><input type="number" min="0" value={line.purchasePriceCents} onChange={(e) => updateLine(i, 'purchasePriceCents', e.target.value)} placeholder={t.optional} className="input text-xs py-1 w-24" /></td>
                        <td className="px-3 py-2">
                          {lines.length > 1 && <button type="button" onClick={() => removeLine(i)} className="text-red-400 hover:text-red-600 text-xs">✕</button>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => { setCreateOpen(false); resetForm(); }} className="px-4 py-2 text-sm rounded-lg border border-gray-300 hover:bg-gray-50">{t.cancel}</button>
              <button type="submit" disabled={createMutation.isPending} className="px-4 py-2 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60">{createMutation.isPending ? t.saving : t.price_changes_create_btn}</button>
            </div>
          </form>
        </div>
      )}

      {/* Detail Modal */}
      {detailItem && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-lg space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold">{detailItem.documentNumber}</h2>
              <button onClick={() => setDetailItem(null)} className="text-gray-400 hover:text-gray-600 text-lg">✕</button>
            </div>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
              <dt className="text-gray-500">{t.price_changes_col_desc}</dt><dd>{detailItem.description ?? '—'}</dd>
              <dt className="text-gray-500">{t.price_changes_col_personnel}</dt><dd>{detailItem.personnelName ?? '—'}</dd>
              <dt className="text-gray-500">{t.price_changes_col_date}</dt><dd>{new Date(detailItem.occurredAt).toLocaleString()}</dd>
            </dl>
            <table className="w-full text-xs border border-gray-200 rounded-lg overflow-hidden">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-3 py-2 text-left font-medium text-gray-500">{t.stock_movements_col_product}</th>
                  <th className="px-3 py-2 text-left font-medium text-gray-500">{t.price_changes_col_old_price}</th>
                  <th className="px-3 py-2 text-left font-medium text-gray-500">{t.price_changes_col_new_price}</th>
                  <th className="px-3 py-2 text-left font-medium text-gray-500">{t.price_changes_col_change}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {detailItem.lines?.map((l, i) => {
                  const diff = l.newPriceCents - l.oldPriceCents;
                  return (
                    <tr key={i}>
                      <td className="px-3 py-2">{l.productName}</td>
                      <td className="px-3 py-2 text-gray-500">{formatCents(l.oldPriceCents)}</td>
                      <td className="px-3 py-2 font-semibold">{formatCents(l.newPriceCents)}</td>
                      <td className={`px-3 py-2 font-medium ${diff > 0 ? 'text-red-600' : diff < 0 ? 'text-green-600' : 'text-gray-500'}`}>
                        {diff > 0 ? '+' : ''}{formatCents(diff)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
