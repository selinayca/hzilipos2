'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { apiClient } from '@/lib/api';
import { CheckCircle } from 'lucide-react';

interface TenantSettings {
  id: string;
  slug: string;
  name: string;
  logoUrl: string | null;
  planTier: string;
  settings: {
    currency?: string;
    locale?: string;
    taxRate?: number;
    receiptFooter?: string;
  };
}

async function fetchSettings(): Promise<TenantSettings> {
  const { data } = await apiClient.get('/tenant/settings');
  return data.data;
}

const schema = z.object({
  name: z.string().min(2, 'At least 2 characters').max(255),
  logoUrl: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  currency: z.string().length(3, 'Must be 3 letters (e.g. TRY)').toUpperCase(),
  locale: z.string().min(2),
  taxRatePercent: z.number().min(0).max(100),
  receiptFooter: z.string().max(500).optional().or(z.literal('')),
});

type FormValues = z.infer<typeof schema>;

export default function SettingsPage() {
  const qc = useQueryClient();
  const [saved, setSaved] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['tenant-settings'],
    queryFn: fetchSettings,
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: '',
      logoUrl: '',
      currency: 'TRY',
      locale: 'tr-TR',
      taxRatePercent: 18,
      receiptFooter: '',
    },
  });

  // Populate form once data loads
  useEffect(() => {
    if (data) {
      reset({
        name: data.name,
        logoUrl: data.logoUrl ?? '',
        currency: (data.settings.currency as string) ?? 'TRY',
        locale: (data.settings.locale as string) ?? 'tr-TR',
        taxRatePercent: data.settings.taxRate ? data.settings.taxRate * 100 : 18,
        receiptFooter: (data.settings.receiptFooter as string) ?? '',
      });
    }
  }, [data, reset]);

  const mutation = useMutation({
    mutationFn: (values: FormValues) =>
      apiClient.patch('/tenant/settings', {
        name: values.name,
        logoUrl: values.logoUrl || null,
        settings: {
          currency: values.currency,
          locale: values.locale,
          taxRate: values.taxRatePercent / 100,
          receiptFooter: values.receiptFooter || '',
        },
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tenant-settings'] });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-40 text-gray-400 text-sm">
        Loading settings...
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-sm text-gray-500 mt-1">
          Configure your store — changes apply to both Backoffice and POS.
        </p>
      </div>

      {/* Plan badge */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-blue-800">Current Plan</p>
          <p className="text-xs text-blue-600 mt-0.5 capitalize">{data?.planTier} tier</p>
        </div>
        <span className="text-xs text-blue-500">
          Subdomain: <code className="font-mono font-bold">{data?.slug}</code>
        </span>
      </div>

      <form onSubmit={handleSubmit((v) => mutation.mutate(v))} className="space-y-6">
        {mutation.isError && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
            {(mutation.error as any)?.response?.data?.message ?? 'Save failed'}
          </div>
        )}

        {saved && (
          <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700 flex items-center gap-2">
            <CheckCircle size={16} />
            Settings saved successfully.
          </div>
        )}

        {/* ── Store info ────────────────────────────────────────────── */}
        <Section title="Store Information">
          <Field label="Store Name *" error={errors.name?.message}>
            <input
              {...register('name')}
              className={inputCls(!!errors.name)}
              placeholder="My Awesome Market"
            />
          </Field>
          <Field label="Logo URL" error={errors.logoUrl?.message}>
            <input
              {...register('logoUrl')}
              className={inputCls(!!errors.logoUrl)}
              placeholder="https://cdn.example.com/logo.png"
            />
          </Field>
        </Section>

        {/* ── Regional ─────────────────────────────────────────────── */}
        <Section title="Regional">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Currency (ISO 4217)" error={errors.currency?.message}>
              <input
                {...register('currency')}
                className={inputCls(!!errors.currency)}
                placeholder="TRY"
                maxLength={3}
              />
            </Field>
            <Field label="Locale" error={errors.locale?.message}>
              <input
                {...register('locale')}
                className={inputCls(!!errors.locale)}
                placeholder="tr-TR"
              />
            </Field>
          </div>
          <Field label="Default Tax Rate (%)" error={errors.taxRatePercent?.message}>
            <div className="relative w-40">
              <input
                type="number"
                step="0.1"
                min="0"
                max="100"
                {...register('taxRatePercent', { valueAsNumber: true })}
                className={inputCls(!!errors.taxRatePercent)}
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">%</span>
            </div>
            <p className="text-xs text-gray-400 mt-1">
              Used as a default for new products. Individual products can override this.
            </p>
          </Field>
        </Section>

        {/* ── Receipt ──────────────────────────────────────────────── */}
        <Section title="Receipt">
          <Field label="Receipt Footer Message" error={errors.receiptFooter?.message}>
            <textarea
              {...register('receiptFooter')}
              rows={3}
              className={`${inputCls(!!errors.receiptFooter)} resize-none`}
              placeholder="Thank you for your purchase!"
            />
          </Field>
        </Section>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={isSubmitting || !isDirty}
            className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm transition-colors disabled:opacity-40"
          >
            {isSubmitting ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="px-5 py-3 border-b border-gray-100 bg-gray-50">
        <h2 className="text-sm font-semibold text-gray-700">{title}</h2>
      </div>
      <div className="px-5 py-4 space-y-4">{children}</div>
    </div>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-700 mb-1.5">{label}</label>
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
