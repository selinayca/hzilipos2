'use client';

import { Bell, LogOut } from 'lucide-react';
import { apiClient } from '@/lib/api';
import { useRouter } from 'next/navigation';
import { useT } from '@/lib/i18n/context';
import { clsx } from 'clsx';

export function Header() {
  const router = useRouter();
  const { lang, setLang, t } = useT();

  async function handleLogout() {
    await apiClient.post('/auth/logout').catch(() => {});
    router.push('/login');
  }

  return (
    <header className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-6 shrink-0">
      <div /> {/* breadcrumb placeholder */}
      <div className="flex items-center gap-3">
        {/* Language switcher */}
        <div className="flex items-center rounded-lg border border-gray-200 overflow-hidden text-xs font-semibold">
          <button
            onClick={() => setLang('tr')}
            className={clsx(
              'px-3 py-1.5 transition-colors',
              lang === 'tr' ? 'bg-blue-600 text-white' : 'text-gray-500 hover:bg-gray-50',
            )}
          >
            TR
          </button>
          <button
            onClick={() => setLang('en')}
            className={clsx(
              'px-3 py-1.5 transition-colors',
              lang === 'en' ? 'bg-blue-600 text-white' : 'text-gray-500 hover:bg-gray-50',
            )}
          >
            EN
          </button>
        </div>

        <button className="relative p-2 text-gray-400 hover:text-gray-600 transition-colors">
          <Bell size={18} />
        </button>
        <button
          onClick={handleLogout}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-red-600 transition-colors"
        >
          <LogOut size={16} />
          {t.logout}
        </button>
      </div>
    </header>
  );
}
