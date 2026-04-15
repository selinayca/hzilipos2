'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient, setToken } from '@/lib/api';
import { useT } from '@/lib/i18n/context';
import { clsx } from 'clsx';

export default function LoginPage() {
  const router = useRouter();
  const { lang, setLang, t } = useT();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { data } = await apiClient.post('/auth/login', {
        email: email.trim().toLowerCase(),
        password,
      });
      const { accessToken } = data.data;
      setToken(accessToken);
      document.cookie = 'bo_authenticated=1; path=/; SameSite=Strict';
      router.replace('/');
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? err?.message ?? 'Login failed';
      setError(Array.isArray(msg) ? msg.join(', ') : msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm">
        {/* Language switcher */}
        <div className="flex justify-end mb-4">
          <div className="flex items-center rounded-lg border border-gray-200 overflow-hidden text-xs font-semibold">
            <button
              onClick={() => setLang('tr')}
              className={clsx('px-3 py-1.5 transition-colors', lang === 'tr' ? 'bg-blue-600 text-white' : 'text-gray-500 hover:bg-gray-50')}
            >
              TR
            </button>
            <button
              onClick={() => setLang('en')}
              className={clsx('px-3 py-1.5 transition-colors', lang === 'en' ? 'bg-blue-600 text-white' : 'text-gray-500 hover:bg-gray-50')}
            >
              EN
            </button>
          </div>
        </div>

        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-black text-blue-600">HizliPOS</h1>
          <p className="text-gray-500 mt-1 text-sm">{t.login_title}</p>
        </div>

        {/* Card */}
        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-2xl shadow-sm border border-gray-200 p-7 space-y-4"
        >
          {error && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1.5">
              {t.login_email}
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="username"
              placeholder="admin@yourstore.com"
              className="w-full px-3 py-2.5 rounded-lg border border-gray-300 text-sm
                         focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1.5">
              {t.login_password}
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              placeholder="••••••••"
              className="w-full px-3 py-2.5 rounded-lg border border-gray-300 text-sm
                         focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700
                       text-white font-semibold text-sm transition-colors disabled:opacity-50"
          >
            {loading ? t.login_signing_in : t.login_button}
          </button>
        </form>

        <p className="text-center text-xs text-gray-400 mt-6">
          HizliPOS · Backoffice Management
        </p>
      </div>
    </div>
  );
}
