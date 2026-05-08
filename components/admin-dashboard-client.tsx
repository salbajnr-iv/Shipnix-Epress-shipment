'use client';

import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Package, FileText, CreditCard, TrendingUp, Plus, Search,
  Truck, CheckCircle2, AlertCircle, Activity, ArrowUpRight,
  MessageSquare, ReceiptText, PackagePlus, RefreshCw,
} from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { formatCurrency, formatStatus } from '@/lib/utils';
import { Button } from '@/components/ui/button';

type ActivityItem = {
  type: string;
  id: string;
  timestamp: string;
  title: string;
  detail: string;
  href?: string;
};

type Stats = {
  packages: {
    total: number;
    byStatus: Record<string, number>;
    updatedLast7Days: number;
  };
  quotes: { total: number; open: number };
  invoices: { total: number; unpaidCount: number; outstandingTotal: number };
  recentActivity: ActivityItem[];
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

function getActivityMeta(item: ActivityItem): {
  Icon: any;
  iconBg: string;
  badge?: { label: string; className: string };
} {
  const t = item.type;
  const title = item.title.toLowerCase();

  if (t === 'new_package') {
    return {
      Icon: PackagePlus,
      iconBg: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/40 dark:text-indigo-400',
      badge: { label: 'Package', className: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300' },
    };
  }
  if (t === 'status_change') {
    if (title.includes('delivered')) return {
      Icon: CheckCircle2,
      iconBg: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400',
      badge: { label: 'Delivered', className: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300' },
    };
    if (title.includes('exception')) return {
      Icon: AlertCircle,
      iconBg: 'bg-red-50 text-red-600 dark:bg-red-900/40 dark:text-red-400',
      badge: { label: 'Exception', className: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300' },
    };
    return {
      Icon: Truck,
      iconBg: 'bg-sky-50 text-sky-600 dark:bg-sky-900/40 dark:text-sky-400',
      badge: { label: 'Status', className: 'bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300' },
    };
  }
  if (t === 'new_quote') return {
    Icon: FileText,
    iconBg: 'bg-violet-50 text-violet-600 dark:bg-violet-900/40 dark:text-violet-400',
    badge: { label: 'Quote', className: 'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300' },
  };
  if (t === 'quote_approved') return {
    Icon: CheckCircle2,
    iconBg: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400',
    badge: { label: 'Quote', className: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300' },
  };
  if (t === 'quote_expired') return {
    Icon: AlertCircle,
    iconBg: 'bg-amber-50 text-amber-600 dark:bg-amber-900/40 dark:text-amber-400',
    badge: { label: 'Quote', className: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300' },
  };
  if (t === 'quote_converted_to_invoice') return {
    Icon: ReceiptText,
    iconBg: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/40 dark:text-indigo-400',
    badge: { label: 'Converted', className: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300' },
  };
  if (t === 'invoice_paid') return {
    Icon: CheckCircle2,
    iconBg: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400',
    badge: { label: 'Paid', className: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300' },
  };
  if (t === 'new_invoice') return {
    Icon: CreditCard,
    iconBg: 'bg-amber-50 text-amber-600 dark:bg-amber-900/40 dark:text-amber-400',
    badge: { label: 'Invoice', className: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300' },
  };
  if (t === 'new_message') return {
    Icon: MessageSquare,
    iconBg: 'bg-cyan-50 text-cyan-600 dark:bg-cyan-900/40 dark:text-cyan-400',
    badge: { label: 'Message', className: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-300' },
  };
  return {
    Icon: Activity,
    iconBg: 'bg-slate-50 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
  };
}

const QUICK_ACTIONS = [
  { href: '/admin/packages', label: 'New Package', sub: 'Create a shipment', icon: Plus, accent: 'from-indigo-600 to-violet-600', iconBg: 'bg-white/20' },
  { href: '/admin/quotes', label: 'View Quotes', sub: 'Customer requests', icon: FileText, accent: '', iconBg: 'bg-violet-50 text-violet-600 dark:bg-violet-900/40 dark:text-violet-400' },
  { href: '/admin/invoices', label: 'Invoices', sub: 'Payments & billing', icon: CreditCard, accent: '', iconBg: 'bg-amber-50 text-amber-600 dark:bg-amber-900/40 dark:text-amber-400' },
  { href: '/admin/messages', label: 'Messages', sub: 'Customer enquiries', icon: MessageSquare, accent: '', iconBg: 'bg-cyan-50 text-cyan-600 dark:bg-cyan-900/40 dark:text-cyan-400' },
  { href: '/track', label: 'Track Package', sub: 'Lookup by ID', icon: Search, accent: '', iconBg: 'bg-sky-50 text-sky-600 dark:bg-sky-900/40 dark:text-sky-400' },
];

export default function AdminDashboardClient() {
  const qc = useQueryClient();
  const { data: stats, isLoading } = useQuery<Stats>({ queryKey: ['/api/admin/stats'] });

  const inTransit = (stats?.packages.byStatus.in_transit ?? 0) +
    (stats?.packages.byStatus.arrived_at_hub ?? 0) +
    (stats?.packages.byStatus.out_for_delivery ?? 0);
  const delivered = stats?.packages.byStatus.delivered ?? 0;
  const pending = (stats?.packages.byStatus.order_placed ?? 0) +
    (stats?.packages.byStatus.packed ?? 0) +
    (stats?.packages.byStatus.exception ?? 0) +
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
        <div className="flex items-center gap-3">
          <button
            onClick={() => qc.invalidateQueries({ queryKey: ['/api/admin/stats'] })}
            className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh
          </button>
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            Live data
          </div>
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
          href="/admin/packages"
        />
        <StatTile
          label="Open Quotes"
          value={stats?.quotes.open}
          loading={isLoading}
          icon={FileText}
          iconClass="bg-violet-50 text-violet-600 dark:bg-violet-900/40 dark:text-violet-400"
          meta={stats ? `${stats.quotes.total} total quotes` : undefined}
          testId="stat-open-quotes"
          href="/admin/quotes"
        />
        <StatTile
          label="Unpaid Invoices"
          value={stats?.invoices.unpaidCount}
          loading={isLoading}
          icon={CreditCard}
          iconClass="bg-amber-50 text-amber-600 dark:bg-amber-900/40 dark:text-amber-400"
          meta={stats ? `${formatCurrency(stats.invoices.outstandingTotal)} outstanding` : undefined}
          testId="stat-unpaid-invoices"
          href="/admin/invoices"
        />
        <StatTile
          label="Updates (7 days)"
          value={stats?.packages.updatedLast7Days}
          loading={isLoading}
          icon={TrendingUp}
          iconClass="bg-sky-50 text-sky-600 dark:bg-sky-900/40 dark:text-sky-400"
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
                <div>
                  <h2 className="text-sm font-semibold text-slate-900 dark:text-white tracking-tight">
                    Recent Activity
                  </h2>
                  {stats && (
                    <p className="text-[11px] text-slate-400 dark:text-slate-500">
                      {stats.recentActivity.length} events across packages, quotes, invoices & messages
                    </p>
                  )}
                </div>
              </div>
              <button
                onClick={() => qc.invalidateQueries({ queryKey: ['/api/admin/stats'] })}
                className="text-[10px] uppercase tracking-wider text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 font-medium flex items-center gap-1 transition-colors"
              >
                <RefreshCw className="w-3 h-3" />
                Refresh
              </button>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {isLoading ? (
                <div className="p-5 space-y-3">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <Skeleton className="w-8 h-8 rounded-lg flex-shrink-0" />
                      <div className="flex-1 space-y-1.5">
                        <Skeleton className="h-3.5 w-3/4" />
                        <Skeleton className="h-3 w-1/2" />
                      </div>
                      <Skeleton className="h-3 w-10 flex-shrink-0" />
                    </div>
                  ))}
                </div>
              ) : !stats?.recentActivity.length ? (
                <div className="p-10 text-center">
                  <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                    <Activity className="w-5 h-5 text-slate-400" />
                  </div>
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">No activity yet</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400" data-testid="text-no-activity">
                    Create a package, quote, or invoice to see events here.
                  </p>
                </div>
              ) : (
                stats.recentActivity.map(item => {
                  const { Icon, iconBg, badge } = getActivityMeta(item);
                  const row = (
                    <div
                      className="flex items-start gap-3 px-5 py-3.5 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                      data-testid={`activity-${item.id}`}
                    >
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${iconBg}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-medium text-slate-900 dark:text-white leading-snug">
                            {item.title}
                          </p>
                          {badge && (
                            <span className={`text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded-full flex-shrink-0 ${badge.className}`}>
                              {badge.label}
                            </span>
                          )}
                        </div>
                        {item.detail && (
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                            {item.detail}
                          </p>
                        )}
                      </div>
                      <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500 flex-shrink-0 mt-1 whitespace-nowrap">
                        {timeAgo(item.timestamp)}
                      </span>
                    </div>
                  );

                  return item.href ? (
                    <Link key={item.id} href={item.href} className="block group">
                      {row}
                    </Link>
                  ) : (
                    <div key={item.id}>{row}</div>
                  );
                })
              )}
            </div>

            {stats && stats.recentActivity.length > 0 && (
              <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex gap-2 flex-wrap">
                <Link href="/admin/packages" className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-medium">
                  Packages →
                </Link>
                <span className="text-slate-300 dark:text-slate-700">·</span>
                <Link href="/admin/quotes" className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-medium">
                  Quotes →
                </Link>
                <span className="text-slate-300 dark:text-slate-700">·</span>
                <Link href="/admin/invoices" className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-medium">
                  Invoices →
                </Link>
                <span className="text-slate-300 dark:text-slate-700">·</span>
                <Link href="/admin/messages" className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-medium">
                  Messages →
                </Link>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

function StatTile({
  label, value, meta, loading, icon: Icon, iconClass, testId, href,
}: {
  label: string;
  value: number | undefined;
  meta?: string;
  loading: boolean;
  icon: any;
  iconClass: string;
  testId: string;
  href?: string;
}) {
  const inner = (
    <div className={`stat-tile ${href ? 'cursor-pointer' : ''}`} data-testid={`tile-${testId}`}>
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
      {href && !loading && (
        <ArrowUpRight className="w-4 h-4 text-slate-300 dark:text-slate-600 group-hover:text-slate-500 transition-colors self-start mt-1" />
      )}
    </div>
  );

  return href ? (
    <Link href={href} className="group block">
      {inner}
    </Link>
  ) : (
    inner
  );
}
