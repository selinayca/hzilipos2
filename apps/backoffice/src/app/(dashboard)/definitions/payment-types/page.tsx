'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { useT } from '@/lib/i18n/context';

interface CashRegister { id: string; name: string; }
interface PaymentType { id: string; code: string; name: string; commissionBps: number; cashRegister: CashRegister | null; }
interface FormState { code: string; name: string; commissionBps: string; cashRegisterId: string; }
const EMPTY: FormState = { code: '', name: '', commissionBps: '0', cashRegisterId: '' };

export default function PaymentTypesPage() {
  const { t } = useT();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<PaymentType | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY);

  const { data = [], isLoading } = useQuery<PaymentType[]>({
    queryKey: ['payment-types'],
    queryFn: async () => (await apiClient.get('/definitions/payment-types')).data.data,
  });

  const { data: cashRegisters = [] } = useQuery<CashRegister[]>({
    queryKey: ['cash-registers'],
    queryFn: async () => (await apiClient.get('/definitions/cash-registers')).data.data,
  });

  const saveMutation = useMutation({
    mutationFn: (payload: object) =>
      editing ? apiClient.patch(`/definitions/payment-types/${editing.id}`, payload) : apiClient.post('/definitions/payment-types', payload),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['payment-types'] }); close(); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiClient.delete(`/definitions/payment-types/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['payment-types'] }),
  });

  function openCreate() { setEditing(null); setForm(EMPTY); setOpen(true); }
  function openEdit(item: PaymentType) {
    setEditing(item);
    setForm({ code: item.code, name: item.name, commissionBps: String(item.commissionBps), cashRegisterId: item.cashRegister?.id ?? '' });
    setOpen(true);
  }
  function close() { setOpen(false); setEditing(null); }
  function submit(e: React.FormEvent) {
    e.preventDefault();
    saveMutation.mutate({ code: form.code, name: form.name, commissionBps: Number(form.commissionBps), cashRegisterId: form.cashRegisterId || undefined });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t.payment_types_title}</h1>
          <p className="text-sm text-gray-500 mt-0.5">{t.payment_types_hint}</p>
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors">
          <Plus size={16} /> {t.payment_types_add}
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>{[t.code, t.name, t.payment_types_col_commission, t.payment_types_col_register, ''].map((h) => <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{h}</th>)}</tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {isLoading && <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400">{t.loading}</td></tr>}
            {data.map((item) => (
              <tr key={item.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-mono text-xs">{item.code}</td>
                <td className="px-4 py-3 font-medium">{item.name}</td>
                <td className="px-4 py-3 text-gray-600">%{(item.commissionBps / 100).toFixed(2)}</td>
                <td className="px-4 py-3 text-gray-600">{item.cashRegister?.name ?? '—'}</td>
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
            <h2 className="text-lg font-bold">{editing ? t.payment_types_edit : t.payment_types_new}</h2>
            <label className="block space-y-1"><span className="text-sm font-medium text-gray-700">{t.code}</span><input required value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} className="input" /></label>
            <label className="block space-y-1"><span className="text-sm font-medium text-gray-700">{t.name}</span><input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input" /></label>
            <label className="block space-y-1"><span className="text-sm font-medium text-gray-700">{t.payment_types_field_commission}</span><input type="number" min="0" value={form.commissionBps} onChange={(e) => setForm({ ...form, commissionBps: e.target.value })} className="input" /></label>
            <label className="block space-y-1">
              <span className="text-sm font-medium text-gray-700">{t.payment_types_field_register}</span>
              <select value={form.cashRegisterId} onChange={(e) => setForm({ ...form, cashRegisterId: e.target.value })} className="select">
                <option value="">{t.none}</option>
                {cashRegisters.map((cr) => <option key={cr.id} value={cr.id}>{cr.name}</option>)}
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
