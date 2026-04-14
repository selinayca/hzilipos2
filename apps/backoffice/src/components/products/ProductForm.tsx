'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { X } from 'lucide-react';

const schema = z.object({
  name: z.string().min(1, 'Required').max(255),
  barcode: z.string().max(100).optional().or(z.literal('')),
  sku: z.string().max(50).optional().or(z.literal('')),
  priceCents: z.number().int().min(0, 'Must be ≥ 0'),
  taxRateBps: z.number().int().min(0).max(10_000).default(0),
  isActive: z.boolean().default(true),
  trackStock: z.boolean().default(false),
  initialStock: z.number().int().min(0).default(0),
});

type FormValues = z.infer<typeof schema>;

interface Props {
  product: { id: string; name: string; barcode: string | null; priceCents: number; isActive: boolean } | null;
  onClose: () => void;
  onSaved: () => void;
}

export function ProductForm({ product, onClose, onSaved }: Props) {
  const isEdit = !!product;

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: product?.name ?? '',
      barcode: product?.barcode ?? '',
      priceCents: product?.priceCents ?? 0,
      isActive: product?.isActive ?? true,
      taxRateBps: 1800,
      trackStock: false,
      initialStock: 0,
    },
  });

  const mutation = useMutation({
    mutationFn: (values: FormValues) =>
      isEdit
        ? apiClient.patch(`/products/${product!.id}`, values)
        : apiClient.post('/products', values),
    onSuccess: onSaved,
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-bold">{isEdit ? 'Edit Product' : 'New Product'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700"><X size={20} /></button>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit((v) => mutation.mutate(v))}
          className="px-6 py-4 space-y-4"
        >
          {mutation.isError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              {(mutation.error as any)?.response?.data?.message ?? 'Save failed'}
            </div>
          )}

          <Field label="Name *" error={errors.name?.message}>
            <input {...register('name')} className={inputCls(!!errors.name)} />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Barcode" error={errors.barcode?.message}>
              <input {...register('barcode')} className={inputCls(!!errors.barcode)} />
            </Field>
            <Field label="SKU" error={errors.sku?.message}>
              <input {...register('sku')} className={inputCls(!!errors.sku)} />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Price (kuruş) *" error={errors.priceCents?.message}>
              <input
                type="number"
                {...register('priceCents', { valueAsNumber: true })}
                className={inputCls(!!errors.priceCents)}
                placeholder="e.g. 1500 = ₺15.00"
              />
            </Field>
            <Field label="Tax rate (bps)" error={errors.taxRateBps?.message}>
              <input
                type="number"
                {...register('taxRateBps', { valueAsNumber: true })}
                className={inputCls(!!errors.taxRateBps)}
                placeholder="1800 = 18%"
              />
            </Field>
          </div>

          {!isEdit && (
            <Field label="Initial Stock" error={errors.initialStock?.message}>
              <input
                type="number"
                {...register('initialStock', { valueAsNumber: true })}
                className={inputCls(!!errors.initialStock)}
              />
            </Field>
          )}

          <div className="flex gap-6">
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" {...register('isActive')} className="rounded" />
              Active
            </label>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" {...register('trackStock')} className="rounded" />
              Track stock
            </label>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-gray-300 text-sm text-gray-700 hover:bg-gray-50">
              Cancel
            </button>
            <button type="submit" disabled={isSubmitting}
              className="flex-[2] py-2.5 rounded-xl bg-blue-600 text-white font-semibold text-sm hover:bg-blue-700 disabled:opacity-50">
              {isSubmitting ? 'Saving...' : isEdit ? 'Save Changes' : 'Create Product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-700 mb-1">{label}</label>
      {children}
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}

function inputCls(hasError: boolean) {
  return `w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
    hasError ? 'border-red-400' : 'border-gray-300'
  }`;
}
