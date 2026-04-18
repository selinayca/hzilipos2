'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { useT } from '@/lib/i18n/context';

interface Shelf { id: string; code: string; name: string; isActive: boolean; sortOrder: number; }
interface FormState { code: string; name: string; isActive: boolean; sortOrder: string; }
const EMPTY: FormState = { code: '', name: '', isActive: true, sortOrder: '0' };

export default function ShelvesPage() {
  const { t } = useT();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Shelf | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY);

  const { data = [], isLoading } = useQuery<Shelf[]>({
    queryKey: ['shelves'],
    queryFn: async () => (await apiClient.get('/definitions/shelves')).data.data,
  });

  const saveMutation = useMutation({
    mutationFn: (payload: object) =>
      editing ? apiClient.patch(`/definitions/shelves/${editing.id}`, payload) : apiClient.post('/definitions/shelves', payload),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['shelves'] }); close(); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiClient.delete(`/definitions/shelves/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['shelves'] }),
  });

  function openCreate() { setEditing(null); setForm(EMPTY); setOpen(true); }
  function openEdit(item: Shelf) { setEditing(item); setForm({ code: item.code, name: item.name, isActive: item.isActive, sortOrder: String(item.sortOrder) }); setOpen(true); }
  function close() { setOpen(false); setEditing(null); }
  function submit(e: React.FormEvent) { e.preventDefault(); saveMutation.mutate({ code: form.code, name: form.name, isActive: form.isActive, sortOrder: Number(form.sortOrder) }); }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t.shelves_title}</h1>
        <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors">
          <Plus size={16} /> {t.shelves_add}
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>{[t.code, t.name, t.sort, t.status, ''].map((h) => <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{h}</th>)}</tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {isLoading && <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400">{t.loading}</td></tr>}
            {data.map((item) => (
              <tr key={item.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-mono text-xs">{item.code}</td>
                <td className="px-4 py-3 font-medium">{item.name}</td>
                <td className="px-4 py-3 text-gray-500">{item.sortOrder}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${item.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>{item.isActive ? t.active : t.inactive}</span>
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
            <h2 className="text-lg font-bold">{editing ? t.shelves_edit : t.shelves_new}</h2>
            <label className="block space-y-1"><span className="text-sm font-medium text-gray-700">{t.code}</span><input required value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} className="input" /></label>
            <label className="block space-y-1"><span className="text-sm font-medium text-gray-700">{t.name}</span><input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input" /></label>
            <label className="block space-y-1"><span className="text-sm font-medium text-gray-700">{t.sort}</span><input type="number" value={form.sortOrder} onChange={(e) => setForm({ ...form, sortOrder: e.target.value })} className="input" /></label>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} />{t.active}</label>
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
