'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { useT } from '@/lib/i18n/context';

interface StockGroup { id: string; mainCode: string; mainName: string; subCode: string | null; subName: string | null; }
interface FormState { mainCode: string; mainName: string; subCode: string; subName: string; }
const EMPTY: FormState = { mainCode: '', mainName: '', subCode: '', subName: '' };

export default function StockGroupsPage() {
  const { t } = useT();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<StockGroup | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY);

  const { data = [], isLoading } = useQuery<StockGroup[]>({
    queryKey: ['stock-groups'],
    queryFn: async () => (await apiClient.get('/definitions/stock-groups')).data.data,
  });

  const saveMutation = useMutation({
    mutationFn: (payload: object) =>
      editing ? apiClient.patch(`/definitions/stock-groups/${editing.id}`, payload) : apiClient.post('/definitions/stock-groups', payload),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['stock-groups'] }); close(); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiClient.delete(`/definitions/stock-groups/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['stock-groups'] }),
  });

  function openCreate() { setEditing(null); setForm(EMPTY); setOpen(true); }
  function openEdit(item: StockGroup) {
    setEditing(item);
    setForm({ mainCode: item.mainCode, mainName: item.mainName, subCode: item.subCode ?? '', subName: item.subName ?? '' });
    setOpen(true);
  }
  function close() { setOpen(false); setEditing(null); }
  function submit(e: React.FormEvent) {
    e.preventDefault();
    saveMutation.mutate({ mainCode: form.mainCode, mainName: form.mainName, subCode: form.subCode || undefined, subName: form.subName || undefined });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t.stock_groups_title}</h1>
        <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors">
          <Plus size={16} /> {t.stock_groups_add}
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>{[t.stock_groups_col_main_code, t.stock_groups_col_main_name, t.stock_groups_col_sub_code, t.stock_groups_col_sub_name, ''].map((h) => <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{h}</th>)}</tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {isLoading && <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400">{t.loading}</td></tr>}
            {data.map((item) => (
              <tr key={item.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-mono text-xs">{item.mainCode}</td>
                <td className="px-4 py-3 font-medium">{item.mainName}</td>
                <td className="px-4 py-3 font-mono text-xs text-gray-500">{item.subCode ?? '—'}</td>
                <td className="px-4 py-3 text-gray-600">{item.subName ?? '—'}</td>
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
            <h2 className="text-lg font-bold">{editing ? t.stock_groups_edit : t.stock_groups_new}</h2>
            <label className="block space-y-1"><span className="text-sm font-medium text-gray-700">{t.stock_groups_field_main_code}</span><input required value={form.mainCode} onChange={(e) => setForm({ ...form, mainCode: e.target.value })} className="input" /></label>
            <label className="block space-y-1"><span className="text-sm font-medium text-gray-700">{t.stock_groups_field_main_name}</span><input required value={form.mainName} onChange={(e) => setForm({ ...form, mainName: e.target.value })} className="input" /></label>
            <label className="block space-y-1"><span className="text-sm font-medium text-gray-700">{t.stock_groups_field_sub_code}</span><input value={form.subCode} onChange={(e) => setForm({ ...form, subCode: e.target.value })} className="input" /></label>
            <label className="block space-y-1"><span className="text-sm font-medium text-gray-700">{t.stock_groups_field_sub_name}</span><input value={form.subName} onChange={(e) => setForm({ ...form, subName: e.target.value })} className="input" /></label>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={close} className="px-4 py-2 text-sm rounded-lg border border-gray-300 hover:bg-gray-50">{t.cancel}</button>
              <button type="submit" disabled={saveMutation.isPending} className="px-4 py-2 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60">{saveMutation.isPending ? t.saving : t.save}</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
