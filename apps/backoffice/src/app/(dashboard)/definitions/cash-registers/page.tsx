'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { useT } from '@/lib/i18n/context';

type RegisterType = 'cash' | 'bank_pos' | 'other';

interface CashRegister { id: string; code: string; name: string; type: RegisterType; }
interface FormState { code: string; name: string; type: RegisterType; }
const EMPTY: FormState = { code: '', name: '', type: 'cash' };

const TYPE_COLORS: Record<RegisterType, string> = {
  cash: 'bg-green-100 text-green-700',
  bank_pos: 'bg-blue-100 text-blue-700',
  other: 'bg-gray-100 text-gray-600',
};

export default function CashRegistersPage() {
  const { t } = useT();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<CashRegister | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY);

  const TYPE_LABELS: Record<RegisterType, string> = {
    cash: t.cash_registers_type_cash,
    bank_pos: t.cash_registers_type_bank_pos,
    other: t.cash_registers_type_other,
  };

  const { data = [], isLoading } = useQuery<CashRegister[]>({
    queryKey: ['cash-registers'],
    queryFn: async () => (await apiClient.get('/definitions/cash-registers')).data.data,
  });

  const saveMutation = useMutation({
    mutationFn: (payload: object) =>
      editing ? apiClient.patch(`/definitions/cash-registers/${editing.id}`, payload) : apiClient.post('/definitions/cash-registers', payload),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['cash-registers'] }); close(); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiClient.delete(`/definitions/cash-registers/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['cash-registers'] }),
  });

  function openCreate() { setEditing(null); setForm(EMPTY); setOpen(true); }
  function openEdit(item: CashRegister) { setEditing(item); setForm({ code: item.code, name: item.name, type: item.type }); setOpen(true); }
  function close() { setOpen(false); setEditing(null); }
  function submit(e: React.FormEvent) { e.preventDefault(); saveMutation.mutate(form); }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t.cash_registers_title}</h1>
        <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors">
          <Plus size={16} /> {t.cash_registers_add}
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>{[t.code, t.name, t.cash_registers_col_type, ''].map((h) => <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{h}</th>)}</tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {isLoading && <tr><td colSpan={4} className="px-4 py-8 text-center text-gray-400">{t.loading}</td></tr>}
            {data.map((item) => (
              <tr key={item.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-mono text-xs">{item.code}</td>
                <td className="px-4 py-3 font-medium">{item.name}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${TYPE_COLORS[item.type]}`}>{TYPE_LABELS[item.type]}</span>
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
            <h2 className="text-lg font-bold">{editing ? t.cash_registers_edit : t.cash_registers_new}</h2>
            <label className="block space-y-1"><span className="text-sm font-medium text-gray-700">{t.code}</span><input required value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} className="input" /></label>
            <label className="block space-y-1"><span className="text-sm font-medium text-gray-700">{t.name}</span><input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input" /></label>
            <label className="block space-y-1">
              <span className="text-sm font-medium text-gray-700">{t.cash_registers_field_type}</span>
              <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as RegisterType })} className="select">
                <option value="cash">{t.cash_registers_type_cash}</option>
                <option value="bank_pos">{t.cash_registers_type_bank_pos}</option>
                <option value="other">{t.cash_registers_type_other}</option>
              </select>
            </label>
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
