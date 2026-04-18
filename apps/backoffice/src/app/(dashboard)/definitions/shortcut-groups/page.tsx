'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { useT } from '@/lib/i18n/context';
import { Plus, Pencil, Trash2, X, GripVertical } from 'lucide-react';

interface ShortcutGroupItem {
  id: string;
  productId: string;
  sortOrder: number;
  product: { id: string; name: string; priceCents: number };
}

interface ShortcutGroup {
  id: string;
  name: string;
  colorHex: string | null;
  sortOrder: number;
  items: ShortcutGroupItem[];
}

interface Product {
  id: string;
  name: string;
  priceCents: number;
}

export default function ShortcutGroupsPage() {
  const { t } = useT();
  const qc = useQueryClient();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<ShortcutGroup | null>(null);

  const { data: groups = [], isLoading } = useQuery<ShortcutGroup[]>({
    queryKey: ['shortcut-groups'],
    queryFn: async () => {
      const { data } = await apiClient.get('/shortcut-groups');
      return data.data ?? data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiClient.delete(`/shortcut-groups/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['shortcut-groups'] }),
  });

  function openCreate() { setEditing(null); setFormOpen(true); }
  function openEdit(g: ShortcutGroup) { setEditing(g); setFormOpen(true); }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t.shortcut_groups_title}</h1>
          <p className="text-sm text-gray-500 mt-0.5">{t.shortcut_groups_hint}</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus size={16} />
          {t.shortcut_groups_add}
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              {[t.shortcut_groups_col_name, t.shortcut_groups_col_color, t.shortcut_groups_col_items, t.sort, ''].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {isLoading && (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400">{t.loading}</td></tr>
            )}
            {groups.map((g) => (
              <tr key={g.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium flex items-center gap-2">
                  <GripVertical size={14} className="text-gray-300" />
                  {g.name}
                </td>
                <td className="px-4 py-3">
                  {g.colorHex ? (
                    <span className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full border border-gray-200" style={{ backgroundColor: g.colorHex }} />
                      <span className="font-mono text-xs text-gray-500">{g.colorHex}</span>
                    </span>
                  ) : <span className="text-gray-400">—</span>}
                </td>
                <td className="px-4 py-3 text-gray-600">{g.items.length}</td>
                <td className="px-4 py-3 text-gray-500">{g.sortOrder}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <button onClick={() => openEdit(g)} className="text-gray-400 hover:text-blue-600"><Pencil size={14} /></button>
                    <button
                      onClick={() => { if (confirm(t.confirm_delete)) deleteMutation.mutate(g.id); }}
                      className="text-gray-400 hover:text-red-600"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {!isLoading && groups.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400">{t.none}</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {formOpen && (
        <ShortcutGroupForm
          group={editing}
          onClose={() => setFormOpen(false)}
          onSaved={() => { setFormOpen(false); qc.invalidateQueries({ queryKey: ['shortcut-groups'] }); }}
        />
      )}
    </div>
  );
}

// ── Form modal ────────────────────────────────────────────────────────────────

function ShortcutGroupForm({
  group,
  onClose,
  onSaved,
}: {
  group: ShortcutGroup | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { t } = useT();
  const isEdit = !!group;

  const [name, setName] = useState(group?.name ?? '');
  const [colorHex, setColorHex] = useState(group?.colorHex ?? '');
  const [sortOrder, setSortOrder] = useState(group?.sortOrder ?? 0);
  const [items, setItems] = useState<Array<{ productId: string; sortOrder: number }>>(
    group?.items.map((i) => ({ productId: i.productId, sortOrder: i.sortOrder })) ?? [],
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const { data: products = [] } = useQuery<Product[]>({
    queryKey: ['products-all'],
    queryFn: async () => {
      const { data } = await apiClient.get('/products', { params: { limit: 500 } });
      return (data.data?.items ?? data.data ?? []) as Product[];
    },
  });

  function addItem() {
    setItems((prev) => [...prev, { productId: '', sortOrder: prev.length }]);
  }

  function removeItem(idx: number) {
    setItems((prev) => prev.filter((_, i) => i !== idx));
  }

  function setItemProduct(idx: number, productId: string) {
    setItems((prev) => prev.map((item, i) => i === idx ? { ...item, productId } : item));
  }

  async function handleSave() {
    if (!name.trim()) { setError('Name is required'); return; }
    setSaving(true);
    setError('');
    try {
      const payload = {
        name: name.trim(),
        colorHex: colorHex || undefined,
        sortOrder,
        items: items.filter((i) => i.productId).map((i, idx) => ({ productId: i.productId, sortOrder: idx })),
      };
      if (isEdit) {
        await apiClient.patch(`/shortcut-groups/${group!.id}`, payload);
      } else {
        await apiClient.post('/shortcut-groups', payload);
      }
      onSaved();
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 shrink-0">
          <h2 className="text-lg font-bold">{isEdit ? t.shortcut_groups_edit : t.shortcut_groups_new}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700"><X size={20} /></button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto px-6 py-4 space-y-4 flex-1">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>
          )}

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">{t.shortcut_groups_field_name}</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">{t.shortcut_groups_field_color}</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={colorHex || '#3b82f6'}
                  onChange={(e) => setColorHex(e.target.value)}
                  className="w-9 h-9 rounded-lg border border-gray-300 cursor-pointer p-0.5"
                />
                <input
                  value={colorHex}
                  onChange={(e) => setColorHex(e.target.value)}
                  placeholder="#3b82f6"
                  className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                />
                {colorHex && (
                  <button onClick={() => setColorHex('')} className="text-gray-400 hover:text-gray-600"><X size={14} /></button>
                )}
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">{t.shortcut_groups_field_sort}</label>
              <input
                type="number"
                value={sortOrder}
                onChange={(e) => setSortOrder(Number(e.target.value))}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Products */}
          <div>
            <p className="text-xs font-medium text-gray-700 mb-2">{t.shortcut_groups_products_section}</p>
            <div className="space-y-2">
              {items.map((item, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <select
                    value={item.productId}
                    onChange={(e) => setItemProduct(idx, e.target.value)}
                    className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    <option value="">{t.shortcut_groups_select_product}</option>
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                  <button onClick={() => removeItem(idx)} className="text-gray-400 hover:text-red-500"><X size={16} /></button>
                </div>
              ))}
            </div>
            <button
              onClick={addItem}
              className="mt-2 text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              {t.shortcut_groups_add_product}
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-6 py-4 border-t border-gray-200 shrink-0">
          <button type="button" onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-gray-300 text-sm text-gray-700 hover:bg-gray-50">
            {t.cancel}
          </button>
          <button onClick={handleSave} disabled={saving}
            className="flex-[2] py-2.5 rounded-xl bg-blue-600 text-white font-semibold text-sm hover:bg-blue-700 disabled:opacity-50">
            {saving ? t.saving : isEdit ? t.shortcut_groups_save_btn : t.shortcut_groups_create_btn}
          </button>
        </div>
      </div>
    </div>
  );
}
