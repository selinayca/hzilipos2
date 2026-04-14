'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';
import { clsx } from 'clsx';

/**
 * POS Login page.
 *
 * Tenant is resolved automatically from the subdomain by the backend middleware.
 * The POS user just enters email + password — no need to enter a tenant slug.
 */
export default function LoginPage() {
  const router = useRouter();
  const login = useAuthStore((s) => s.login);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email.trim().toLowerCase(), password);
      router.replace('/');
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ??
        err?.message ??
        'Login failed. Check your credentials.';
      setError(Array.isArray(msg) ? msg.join(', ') : msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-black text-blue-400 tracking-tight">
            HizliPOS
          </h1>
          <p className="text-slate-400 mt-1 text-sm">Sign in to start your shift</p>
        </div>

        {/* Card */}
        <form
          onSubmit={handleSubmit}
          className="bg-slate-800 rounded-2xl p-6 space-y-4 shadow-2xl border border-slate-700"
        >
          {error && (
            <div className="p-3 rounded-lg bg-red-900/40 border border-red-700/50 text-red-300 text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="username"
              placeholder="cashier@yourstore.com"
              className="w-full px-3 py-2.5 rounded-lg bg-slate-700 border border-slate-600
                         text-slate-100 placeholder-slate-500
                         focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                         text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              placeholder="••••••••"
              className="w-full px-3 py-2.5 rounded-lg bg-slate-700 border border-slate-600
                         text-slate-100 placeholder-slate-500
                         focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                         text-sm"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className={clsx(
              'w-full py-3 rounded-xl font-bold text-sm transition-all',
              loading
                ? 'bg-blue-700 opacity-60 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-500 active:scale-95',
              'text-white',
            )}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <p className="text-center text-xs text-slate-600 mt-6">
          HizliPOS · Point of Sale
        </p>
      </div>
    </div>
  );
}
