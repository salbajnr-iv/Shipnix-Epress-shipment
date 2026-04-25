'use client';

import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Package, FileText, CreditCard, TrendingUp, Plus, Search,
  Truck, CheckCircle2, AlertCircle, Activity, ArrowUpRight,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { formatCurrency, formatStatus } from '@/lib/utils';

type Stats = {
  packages: {
    total: number;
    byStatus: Record<string, number>;
    updatedLast7Days: number;
  };
  quotes: { total: number; open: number };
  invoices: { total: number; unpaidCount: number; outstandingTotal: number };
  recentActivity: Array<{
    type: 'status_change' | 'new_quote';
    id: string;
    timestamp: string;
    title: string;
    detail: string;
  }>;
};

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return 'just now';
  if (min < 60) return `${min}m ago`;
  const hrs = Math.floor(min / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

const QUICK_ACTIONS = [
  { href: '/admin/packages', label: 'New Package', sub: 'Create a shipment', icon: Plus, accent: 'from-indigo-600 to-violet-600', iconBg: 'bg-white/20' },
  { href: '/admin/quotes', label: 'View Quotes', sub: 'Customer requests', icon: FileText, accent: '', iconBg: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400' },
  { href: '/admin/invoices', label: 'Invoices', sub: 'Payments & billing', icon: CreditCard, accent: '', iconBg: 'bg-amber-50 text-amber-600 dark:bg-amber-900/40 dark:text-amber-400' },
  { href: '/track', label: 'Track Package', sub: 'Lookup by ID', icon: Search, accent: '', iconBg: 'bg-cyan-50 text-cyan-600 dark:bg-cyan-900/40 dark:text-cyan-400' },
];

export default function AdminDashboardClient() {
  const { data: stats, isLoading } = useQuery<Stats>({ queryKey: ['/api/admin/stats'] });

  const inTransit = (stats?.packages.byStatus.in_transit ?? 0) +
    (stats?.packages.byStatus.arrived_at_hub ?? 0) +
    (stats?.packages.byStatus.out_for_delivery ?? 0);
  const delivered = stats?.packages.byStatus.delivered ?? 0;
  const pending = (stats?.packages.byStatus.order_placed ?? 0) +
    (stats?.packages.byStatus.packed ?? 0) +
    (stats?.packages.byStatus.exception ?? 0) +
    // Legacy statuses still counted as pending so historical packages remain visible.
    (stats?.packages.byStatus.created ?? 0) +
    (stats?.packages.byStatus.picked_up ?? 0) +
    (stats?.packages.byStatus.pending_payment ?? 0);

  return (
    <div className="page-shell">
      <header className="page-header">
        <div>
          <p className="page-eyebrow">Operations Console</p>
          <h1 className="page-title" data-testid="text-page-title">Dashboard</h1>
          <p className="page-subtitle">Real-time overview of your global logistics network.</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
          Live data · refreshes automatically
        </div>
      </header>

      {/* Stat tiles */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
        <StatTile
          label="Total Packages"
          value={stats?.packages.total}
          loading={isLoading}
          icon={Package}
          iconClass="bg-indigo-50 text-indigo-600 dark:bg-indigo-900/40 dark:text-indigo-400"
          meta={stats ? `${pending} pending · ${inTransit} in transit · ${delivered} delivered` : undefined}
          testId="stat-packages"
        />
        <StatTile
          label="Open Quotes"
          value={stats?.quotes.open}
          loading={isLoading}
          icon={FileText}
          iconClass="bg-emerald-50 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400"
          meta={stats ? `${stats.quotes.total} total quotes` : undefined}
          testId="stat-open-quotes"
        />
        <StatTile
          label="Unpaid Invoices"
          value={stats?.invoices.unpaidCount}
          loading={isLoading}
          icon={CreditCard}
          iconClass="bg-amber-50 text-amber-600 dark:bg-amber-900/40 dark:text-amber-400"
          meta={stats ? `${formatCurrency(stats.invoices.outstandingTotal)} outstanding` : undefined}
          testId="stat-unpaid-invoices"
        />
        <StatTile
          label="Updates (7 days)"
          value={stats?.packages.updatedLast7Days}
          loading={isLoading}
          icon={TrendingUp}
          iconClass="bg-cyan-50 text-cyan-600 dark:bg-cyan-900/40 dark:text-cyan-400"
          meta="Package status changes"
          testId="stat-recent-updates"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Actions */}
        <section className="lg:col-span-1">
          <div className="surface-card p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-slate-900 dark:text-white tracking-tight">
                Quick Actions
              </h2>
              <span className="text-[10px] uppercase tracking-wider text-slate-400 font-medium">
                Shortcuts
              </span>
            </div>
            <div className="space-y-2">
              {QUICK_ACTIONS.map(({ href, label, sub, icon: Icon, accent, iconBg }) => (
                <Link
                  key={href}
                  href={href}
                  data-testid={`link-quick-${label.toLowerCase().replace(/\s+/g, '-')}`}
                  className={
                    accent
                      ? `group flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r ${accent} text-white shadow-sm shadow-indigo-500/20 hover:shadow-md hover:scale-[1.01] transition-all`
                      : 'group flex items-center gap-3 p-3 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-all'
                  }
                >
                  <span className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${iconBg}`}>
                    <Icon className="w-4 h-4" />
                  </span>
                  <span className="flex-1 min-w-0">
                    <span className={`block text-sm font-semibold ${accent ? 'text-white' : 'text-slate-900 dark:text-white'}`}>
                      {label}
                    </span>
                    <span className={`block text-xs ${accent ? 'text-indigo-100' : 'text-slate-500 dark:text-slate-400'}`}>
                      {sub}
                    </span>
                  </span>
                  <ArrowUpRight className={`w-4 h-4 ${accent ? 'text-white/70' : 'text-slate-400'} group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform`} />
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Recent Activity */}
        <section className="lg:col-span-2">
          <div className="surface-card overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-900/40 flex items-center justify-center">
                  <Activity className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                </div>
                <h2 className="text-sm font-semibold text-slate-900 dark:text-white tracking-tight">
                  Recent Activity
                </h2>
              </div>
              <span className="text-[10px] uppercase tracking-wider text-slate-400 font-medium">
                Last 7 days
              </span>
            </div>
            <div className="p-5">
              {isLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : !stats?.recentActivity.length ? (
                <div className="text-center py-10">
                  <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                    <Activity className="w-5 h-5 text-slate-400" />
                  </div>
                  <p className="text-sm text-slate-500 dark:text-slate-400" data-testid="text-no-activity">
                    No activity yet. Create a package or quote to see updates here.
                  </p>
                </div>
              ) : (
                <ul className="space-y-1 -mx-2">
                  {stats.recentActivity.map(item => {
                    const Icon = item.type === 'new_quote' ? FileText
                      : item.title.toLowerCase().includes('delivered') ? CheckCircle2
                      : item.title.toLowerCase().includes('failed') ? AlertCircle
                      : Truck;
                    const iconBg = item.title.toLowerCase().includes('delivered')
                      ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400'
                      : item.title.toLowerCase().includes('failed')
                      ? 'bg-red-50 text-red-600 dark:bg-red-900/40 dark:text-red-400'
                      : item.type === 'new_quote'
                      ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400'
                      : 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/40 dark:text-indigo-400';
                    return (
                      <li
                        key={item.id}
                        className="flex items-start gap-3 px-2 py-2.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors"
                        data-testid={`activity-${item.id}`}
                      >
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${iconBg}`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{item.title}</p>
                          {item.detail && (
                            <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                              {formatActivityDetail(item.detail)}
                            </p>
                          )}
                        </div>
                        <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500 flex-shrink-0 mt-1">
                          {timeAgo(item.timestamp)}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

function formatActivityDetail(detail: string): string {
  return detail.replace(/(?<=→ )([a-z_]+)/g, m => formatStatus(m));
}

function StatTile({
  label, value, meta, loading, icon: Icon, iconClass, testId,
}: {
  label: string;
  value: number | undefined;
  meta?: string;
  loading: boolean;
  icon: any;
  iconClass: string;
  testId: string;
}) {
  return (
    <div className="stat-tile" data-testid={`tile-${testId}`}>
      <div className={`stat-tile-icon ${iconClass}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="stat-tile-label">{label}</p>
        {loading ? (
          <>
            <Skeleton className="h-8 w-16" />
            <Skeleton className="h-3 w-32 mt-2" />
          </>
        ) : (
          <>
            <p className="stat-tile-value" data-testid={testId}>{value ?? 0}</p>
            {meta && <p className="stat-tile-meta">{meta}</p>}
          </>
        )}
      </div>
    </div>
  );
}
