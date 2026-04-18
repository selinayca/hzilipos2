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
  ChevronDown,
  Tag,
  Ruler,
  Palette,
  LayoutGrid,
  BookOpen,
  CreditCard,
  TrendingUp,
  ArrowLeftRight,
  BarChart2,
  Zap,
} from 'lucide-react';
import { clsx } from 'clsx';
import { useState } from 'react';
import { useT } from '@/lib/i18n/context';

export function Sidebar() {
  const pathname = usePathname();
  const { t } = useT();
  const [definitionsOpen, setDefinitionsOpen] = useState(pathname.startsWith('/definitions'));

  const NAV_MAIN = [
    { href: '/', label: t.nav_dashboard, icon: LayoutDashboard },
    { href: '/products', label: t.nav_products, icon: Package },
    { href: '/orders', label: t.nav_orders, icon: ShoppingCart },
    { href: '/stock', label: t.nav_stock, icon: Warehouse },
    { href: '/stock-movements', label: t.nav_stock_movements, icon: ArrowLeftRight },
    { href: '/price-changes', label: t.nav_price_changes, icon: TrendingUp },
    { href: '/reports', label: t.nav_reports, icon: BarChart2 },
  ];

  const DEFINITIONS = [
    { href: '/definitions/vat-rates', label: t.nav_vat_rates, icon: Tag },
    { href: '/definitions/units', label: t.nav_units, icon: Ruler },
    { href: '/definitions/stock-groups', label: t.nav_stock_groups, icon: LayoutGrid },
    { href: '/definitions/shelves', label: t.nav_shelves, icon: LayoutGrid },
    { href: '/definitions/warehouses', label: t.nav_warehouses, icon: Warehouse },
    { href: '/definitions/colors', label: t.nav_colors, icon: Palette },
    { href: '/definitions/sizes', label: t.nav_sizes, icon: Ruler },
    { href: '/definitions/cash-registers', label: t.nav_cash_registers, icon: CreditCard },
    { href: '/definitions/payment-types', label: t.nav_payment_types, icon: CreditCard },
    { href: '/definitions/shortcut-groups', label: t.nav_shortcut_groups, icon: Zap },
  ];

  const NAV_BOTTOM = [
    { href: '/users', label: t.nav_staff, icon: Users },
    { href: '/settings', label: t.nav_settings, icon: Settings },
  ];

  const groupActive = DEFINITIONS.some((i) => pathname.startsWith(i.href));
  const open = definitionsOpen || groupActive;

  function NavLink({ href, label, icon: Icon }: { href: string; label: string; icon: React.ElementType }) {
    const active = href === '/' ? pathname === '/' : pathname.startsWith(href);
    return (
      <Link
        href={href}
        className={clsx(
          'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors group',
          active ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900',
        )}
      >
        <Icon size={18} className={active ? 'text-blue-600' : 'text-gray-400 group-hover:text-gray-600'} />
        {label}
        {active && <ChevronRight size={14} className="ml-auto text-blue-400" />}
      </Link>
    );
  }

  return (
    <aside className="w-56 bg-white border-r border-gray-200 flex flex-col shrink-0">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-gray-100">
        <span className="text-xl font-black text-blue-600 tracking-tight">HizliPOS</span>
        <p className="text-xs text-gray-400 mt-0.5">Backoffice</p>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {NAV_MAIN.map((item) => <NavLink key={item.href} {...item} />)}

        {/* Definitions group */}
        <button
          onClick={() => setDefinitionsOpen((v) => !v)}
          className={clsx(
            'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
            groupActive ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900',
          )}
        >
          <BookOpen size={18} className={groupActive ? 'text-blue-600' : 'text-gray-400'} />
          {t.nav_definitions}
          <span className="ml-auto">
            {open ? <ChevronDown size={14} className="text-gray-400" /> : <ChevronRight size={14} className="text-gray-400" />}
          </span>
        </button>

        {open && (
          <div className="ml-4 mt-1 space-y-0.5 border-l border-gray-100 pl-3">
            {DEFINITIONS.map(({ href, label, icon: SubIcon }) => {
              const active = pathname.startsWith(href);
              return (
                <Link
                  key={href}
                  href={href}
                  className={clsx(
                    'flex items-center gap-2.5 px-2 py-2 rounded-lg text-sm transition-colors',
                    active ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-500 hover:bg-gray-100 hover:text-gray-800',
                  )}
                >
                  <SubIcon size={14} className={active ? 'text-blue-500' : 'text-gray-400'} />
                  {label}
                </Link>
              );
            })}
          </div>
        )}

        {NAV_BOTTOM.map((item) => <NavLink key={item.href} {...item} />)}
      </nav>
    </aside>
  );
}
