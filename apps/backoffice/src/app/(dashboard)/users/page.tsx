'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { apiClient } from '@/lib/api';
import { Plus, UserCheck, UserX, KeyRound, X } from 'lucide-react';
import { clsx } from 'clsx';

interface StaffUser {
  id: string;
  email: string;
  name: string;
  role: 'tenant_admin' | 'cashier';
  isActive: boolean;
  lastLoginAt: string | null;
  createdAt: string;
}

async function fetchUsers(): Promise<StaffUser[]> {
  const { data } = await apiClient.get('/users');
  return data.data;
}

const createSchema = z.object({
  name: z.string().min(2).max(255),
  email: z.string().email(),
  password: z.string().min(8, 'At least 8 characters'),
  role: z.enum(['tenant_admin', 'cashier']),
});

const resetSchema = z.object({
  newPassword: z.string().min(8, 'At least 8 characters'),
});

type CreateValues = z.infer<typeof createSchema>;
type ResetValues = z.infer<typeof resetSchema>;

const ROLE_LABELS: Record<string, string> = {
  tenant_admin: 'Admin',
  cashier: 'Cashier',
};

const ROLE_COLORS: Record<string, string> = {
  tenant_admin: 'bg-purple-100 text-purple-700',
  cashier: 'bg-blue-100 text-blue-700',
};

export default function UsersPage() {
  const qc = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [resetTarget, setResetTarget] = useState<StaffUser | null>(null);

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: fetchUsers,
  });

  const toggleMutation = useMutation({
    mutationFn: (id: string) => apiClient.patch(`/users/${id}/toggle-active`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['users'] }),
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Staff</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Manage cashiers and admin accounts for your store.
          </p>
        </div>
        <button
          onClick={() => setCreateOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus size={16} />
          Add Staff
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              {['Name', 'Email', 'Role', 'Last Login', 'Status', 'Actions'].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {isLoading && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-gray-400">Loading...</td>
              </tr>
            )}
            {users.map((u) => (
              <tr key={u.id} className={clsx('hover:bg-gray-50', !u.isActive && 'opacity-60')}>
                <td className="px-4 py-3 font-medium text-gray-900">{u.name}</td>
                <td className="px-4 py-3 text-gray-500">{u.email}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${ROLE_COLORS[u.role] ?? 'bg-gray-100 text-gray-600'}`}>
                    {ROLE_LABELS[u.role] ?? u.role}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-400 text-xs">
                  {u.lastLoginAt
                    ? new Date(u.lastLoginAt).toLocaleDateString('tr-TR')
                    : 'Never'}
                </td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${u.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {u.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => toggleMutation.mutate(u.id)}
                      title={u.isActive ? 'Deactivate' : 'Activate'}
                      className="text-gray-400 hover:text-blue-600 transition-colors"
                    >
                      {u.isActive ? <UserX size={15} /> : <UserCheck size={15} />}
                    </button>
                    <button
                      onClick={() => setResetTarget(u)}
                      title="Reset password"
                      className="text-gray-400 hover:text-orange-500 transition-colors"
                    >
                      <KeyRound size={15} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {createOpen && (
        <CreateUserModal
          onClose={() => setCreateOpen(false)}
          onSaved={() => { setCreateOpen(false); qc.invalidateQueries({ queryKey: ['users'] }); }}
        />
      )}

      {resetTarget && (
        <ResetPasswordModal
          user={resetTarget}
          onClose={() => setResetTarget(null)}
          onSaved={() => setResetTarget(null)}
        />
      )}
    </div>
  );
}

// ── Create User Modal ──────────────────────────────────────────────────────

function CreateUserModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<CreateValues>({ resolver: zodResolver(createSchema), defaultValues: { role: 'cashier' } });

  async function onSubmit(values: CreateValues) {
    try {
      await apiClient.post('/users', values);
      onSaved();
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? 'Failed to create user';
      setError('root', { message: Array.isArray(msg) ? msg.join(', ') : msg });
    }
  }

  return (
    <Modal title="Add Staff Member" onClose={onClose}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {errors.root && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
            {errors.root.message}
          </div>
        )}
        <Field label="Full Name *" error={errors.name?.message}>
          <input {...register('name')} className={inputCls(!!errors.name)} placeholder="Jane Smith" />
        </Field>
        <Field label="Email *" error={errors.email?.message}>
          <input type="email" {...register('email')} className={inputCls(!!errors.email)} placeholder="jane@store.com" />
        </Field>
        <Field label="Password *" error={errors.password?.message}>
          <input type="password" {...register('password')} className={inputCls(!!errors.password)} placeholder="Min 8 characters" />
        </Field>
        <Field label="Role *" error={errors.role?.message}>
          <select {...register('role')} className={inputCls(!!errors.role)}>
            <option value="cashier">Cashier</option>
            <option value="tenant_admin">Admin</option>
          </select>
        </Field>
        <ModalActions onClose={onClose} loading={isSubmitting} label="Create Staff" />
      </form>
    </Modal>
  );
}

// ── Reset Password Modal ───────────────────────────────────────────────────

function ResetPasswordModal({ user, onClose, onSaved }: { user: StaffUser; onClose: () => void; onSaved: () => void }) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<ResetValues>({ resolver: zodResolver(resetSchema) });

  async function onSubmit(values: ResetValues) {
    try {
      await apiClient.patch(`/users/${user.id}/reset-password`, values);
      onSaved();
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? 'Failed to reset password';
      setError('root', { message: Array.isArray(msg) ? msg.join(', ') : msg });
    }
  }

  return (
    <Modal title={`Reset password — ${user.name}`} onClose={onClose}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {errors.root && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
            {(errors.root as any).message}
          </div>
        )}
        <Field label="New Password *" error={errors.newPassword?.message}>
          <input
            type="password"
            {...register('newPassword')}
            className={inputCls(!!errors.newPassword)}
            placeholder="Min 8 characters"
            autoFocus
          />
        </Field>
        <ModalActions onClose={onClose} loading={isSubmitting} label="Reset Password" />
      </form>
    </Modal>
  );
}

// ── Shared modal primitives ────────────────────────────────────────────────

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-bold">{title}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700"><X size={20} /></button>
        </div>
        <div className="px-6 py-4">{children}</div>
      </div>
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

function ModalActions({ onClose, loading, label }: { onClose: () => void; loading: boolean; label: string }) {
  return (
    <div className="flex gap-3 pt-2">
      <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-gray-300 text-sm text-gray-700 hover:bg-gray-50">
        Cancel
      </button>
      <button type="submit" disabled={loading} className="flex-[2] py-2.5 rounded-xl bg-blue-600 text-white font-semibold text-sm hover:bg-blue-700 disabled:opacity-50">
        {loading ? 'Saving...' : label}
      </button>
    </div>
  );
}

function inputCls(hasError: boolean) {
  return `w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${hasError ? 'border-red-400' : 'border-gray-300'}`;
}
