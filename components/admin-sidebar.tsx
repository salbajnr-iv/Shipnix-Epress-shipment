'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  FileText, CreditCard, LayoutDashboard, LogOut, Sun, Moon, Package,
  ShieldCheck, ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';
import { useTheme } from 'next-themes';
import type { User } from '@supabase/supabase-js';

const NAV_GROUPS: Array<{
  label: string;
  items: Array<{ href: string; label: string; icon: any; description?: string }>;
}> = [
  {
    label: 'Overview',
    items: [
      { href: '/admin', label: 'Dashboard', icon: LayoutDashboard, description: 'Operations summary' },
    ],
  },
  {
    label: 'Operations',
    items: [
      { href: '/admin/packages', label: 'Packages', icon: Package, description: 'Shipments & tracking' },
      { href: '/admin/quotes', label: 'Quotes', icon: FileText, description: 'Customer requests' },
      { href: '/admin/invoices', label: 'Invoices', icon: CreditCard, description: 'Billing & payments' },
    ],
  },
];

export default function AdminSidebar({ user }: { user: User }) {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, setTheme } = useTheme();

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/');
    router.refresh();
  };

  const initials = (user.email ?? '?').slice(0, 2).toUpperCase();

  return (
    <aside className="hidden md:flex w-72 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex-col flex-shrink-0">
      {/* Brand */}
      <div className="p-5 border-b border-slate-200 dark:border-slate-800">
        <Link href="/" className="flex items-center gap-3 group" data-testid="link-sidebar-home">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center shadow-md shadow-indigo-500/30 group-hover:scale-105 transition-transform">
            <img
              src="/shipnix-logo.svg"
              alt="Shipnix Express"
              className="w-6 h-6 object-contain brightness-0 invert"
              data-testid="img-logo-sidebar"
            />
          </div>
          <div className="min-w-0">
            <p className="font-bold text-slate-900 dark:text-white leading-tight">Shipnix</p>
            <p className="text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-400 font-medium">
              Operations Console
            </p>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-3 space-y-6">
        {NAV_GROUPS.map((group) => (
          <div key={group.label}>
            <p className="px-3 mb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">
              {group.label}
            </p>
            <ul className="space-y-1">
              {group.items.map(({ href, label, icon: Icon, description }) => {
                const active = pathname === href || (href !== '/admin' && pathname.startsWith(href));
                return (
                  <li key={href}>
                    <Link
                      href={href}
                      data-testid={`link-nav-${label.toLowerCase()}`}
                      className={cn(
                        'group relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all',
                        active
                          ? 'bg-gradient-to-r from-indigo-50 to-violet-50 dark:from-indigo-900/40 dark:to-violet-900/40 text-indigo-700 dark:text-indigo-200 shadow-sm'
                          : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white',
                      )}
                    >
                      {active && (
                        <span className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-1 rounded-r-full bg-indigo-600" />
                      )}
                      <span
                        className={cn(
                          'w-8 h-8 rounded-lg flex items-center justify-center transition-colors',
                          active
                            ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-500/30'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 group-hover:bg-white dark:group-hover:bg-slate-700',
                        )}
                      >
                        <Icon className="w-4 h-4" />
                      </span>
                      <span className="flex-1 min-w-0">
                        <span className="block truncate">{label}</span>
                        {description && (
                          <span className="block text-[11px] font-normal text-slate-500 dark:text-slate-500 truncate">
                            {description}
                          </span>
                        )}
                      </span>
                      {active && <ChevronRight className="w-3.5 h-3.5 opacity-60" />}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* User card */}
      <div className="p-3 border-t border-slate-200 dark:border-slate-800 space-y-2">
        <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
          <div
            className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 text-white text-xs font-bold flex items-center justify-center shadow-sm"
            data-testid="text-user-initials"
          >
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-slate-900 dark:text-white truncate" data-testid="text-user-email">
              {user.email}
            </p>
            <p className="text-[10px] uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-medium">
              <ShieldCheck className="w-3 h-3" /> Admin
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="flex items-center justify-center gap-2 px-2 py-2 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            data-testid="button-toggle-theme"
          >
            {theme === 'dark' ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
            {theme === 'dark' ? 'Light' : 'Dark'}
          </button>
          <button
            onClick={handleLogout}
            className="flex items-center justify-center gap-2 px-2 py-2 rounded-lg text-xs font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 border border-red-100 dark:border-red-900/40 hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors"
            data-testid="button-logout"
          >
            <LogOut className="w-3.5 h-3.5" />
            Sign Out
          </button>
        </div>
      </div>
    </aside>
  );
}
