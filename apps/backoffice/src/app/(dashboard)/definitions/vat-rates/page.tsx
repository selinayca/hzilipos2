'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { useT } from '@/lib/i18n/context';

interface VatRate {
  id: string;
  code: string;
  name: string;
  rateBps: number;
  isActive: boolean;
  sortOrder: number;
}

interface FormState {
  code: string;
  name: string;
  rateBps: string;
  isActive: boolean;
  sortOrder: string;
}

const EMPTY: FormState = { code: '', name: '', rateBps: '1800', isActive: true, sortOrder: '0' };

export default function VatRatesPage() {
  const { t } = useT();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<VatRate | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY);

  const { data = [], isLoading } = useQuery<VatRate[]>({
    queryKey: ['vat-rates'],
    queryFn: async () => (await apiClient.get('/definitions/vat-rates')).data.data,
  });

  const saveMutation = useMutation({
    mutationFn: (payload: object) =>
      editing
        ? apiClient.patch(`/definitions/vat-rates/${editing.id}`, payload)
        : apiClient.post('/definitions/vat-rates', payload),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['vat-rates'] }); close(); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiClient.delete(`/definitions/vat-rates/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['vat-rates'] }),
  });

  function openCreate() { setEditing(null); setForm(EMPTY); setOpen(true); }
  function openEdit(item: VatRate) {
    setEditing(item);
    setForm({ code: item.code, name: item.name, rateBps: String(item.rateBps), isActive: item.isActive, sortOrder: String(item.sortOrder) });
    setOpen(true);
  }
  function close() { setOpen(false); setEditing(null); }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    saveMutation.mutate({ code: form.code, name: form.name, rateBps: Number(form.rateBps), isActive: form.isActive, sortOrder: Number(form.sortOrder) });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t.vat_rates_title}</h1>
          <p className="text-sm text-gray-500 mt-0.5">{t.vat_rates_hint}</p>
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors">
          <Plus size={16} /> {t.vat_rates_add}
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              {[t.code, t.name, t.vat_rates_col_rate, t.sort, t.status, ''].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {isLoading && <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">{t.loading}</td></tr>}
            {data.map((item) => (
              <tr key={item.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-mono text-xs">{item.code}</td>
                <td className="px-4 py-3 font-medium">{item.name}</td>
                <td className="px-4 py-3">%{(item.rateBps / 100).toFixed(0)}</td>
                <td className="px-4 py-3 text-gray-500">{item.sortOrder}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${item.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {item.isActive ? t.active : t.inactive}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <button onClick={() => openEdit(item)} className="text-gray-400 hover:text-blue-600"><Pencil size={14} /></button>
                    <button onClick={() => { if (confirm(t.confirm_delete)) deleteMutation.mutate(item.id); }} className="text-gray-400 hover:text-red-600"><Trash2 size={14} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {open && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <form onSubmit={submit} className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md space-y-4">
            <h2 className="text-lg font-bold">{editing ? t.vat_rates_edit : t.vat_rates_new}</h2>
            <label className="block space-y-1"><span className="text-sm font-medium text-gray-700">{t.code}</span><input required value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} className="input" /></label>
            <label className="block space-y-1"><span className="text-sm font-medium text-gray-700">{t.name}</span><input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input" /></label>
            <label className="block space-y-1"><span className="text-sm font-medium text-gray-700">{t.vat_rates_field_rate}</span><input type="number" min="0" required value={form.rateBps} onChange={(e) => setForm({ ...form, rateBps: e.target.value })} className="input" /></label>
            <label className="block space-y-1"><span className="text-sm font-medium text-gray-700">{t.sort}</span><input type="number" value={form.sortOrder} onChange={(e) => setForm({ ...form, sortOrder: e.target.value })} className="input" /></label>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} />{t.active}</label>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={close} className="px-4 py-2 text-sm rounded-lg border border-gray-300 hover:bg-gray-50">{t.cancel}</button>
              <button type="submit" disabled={saveMutation.isPending} className="px-4 py-2 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60">
                {saveMutation.isPending ? t.saving : t.save}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
