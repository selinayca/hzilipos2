'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Warehouse,
  Users,
  Settings,
  ChevronRight,
} from 'lucide-react';
import { clsx } from 'clsx';

const NAV = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/products', label: 'Products', icon: Package },
  { href: '/orders', label: 'Orders', icon: ShoppingCart },
  { href: '/stock', label: 'Stock', icon: Warehouse },
  { href: '/users', label: 'Staff', icon: Users },
  { href: '/settings', label: 'Settings', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-56 bg-white border-r border-gray-200 flex flex-col shrink-0">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-gray-100">
        <span className="text-xl font-black text-blue-600 tracking-tight">
          HizliPOS
        </span>
        <p className="text-xs text-gray-400 mt-0.5">Backoffice</p>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active =
            href === '/' ? pathname === '/' : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={clsx(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors group',
                active
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900',
              )}
            >
              <Icon
                size={18}
                className={active ? 'text-blue-600' : 'text-gray-400 group-hover:text-gray-600'}
              />
              {label}
              {active && (
                <ChevronRight size={14} className="ml-auto text-blue-400" />
              )}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
