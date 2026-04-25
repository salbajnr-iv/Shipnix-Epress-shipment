'use client';

import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Package, FileText, CreditCard, TrendingUp, Plus, Search,
  Truck, CheckCircle2, AlertCircle, Activity,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
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

export default function AdminDashboardClient() {
  const { data: stats, isLoading } = useQuery<Stats>({ queryKey: ['/api/admin/stats'] });

  const inTransit = (stats?.packages.byStatus.in_transit ?? 0) +
    (stats?.packages.byStatus.out_for_delivery ?? 0);
  const delivered = stats?.packages.byStatus.delivered ?? 0;
  const pending = (stats?.packages.byStatus.created ?? 0) +
    (stats?.packages.byStatus.picked_up ?? 0) +
    (stats?.packages.byStatus.pending_payment ?? 0);

  return (
    <div className="p-4 sm:p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Global Logistics Management</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          title="Total Packages"
          icon={<Package className="h-4 w-4 text-blue-600" />}
          loading={isLoading}
          value={stats?.packages.total}
          subtitle={
            stats
              ? `${pending} pending · ${inTransit} in transit · ${delivered} delivered`
              : undefined
          }
          testId="stat-packages"
        />
        <StatCard
          title="Open Quote Requests"
          icon={<FileText className="h-4 w-4 text-green-600" />}
          loading={isLoading}
          value={stats?.quotes.open}
          subtitle={stats ? `${stats.quotes.total} total quotes` : undefined}
          testId="stat-open-quotes"
        />
        <StatCard
          title="Unpaid Invoices"
          icon={<CreditCard className="h-4 w-4 text-purple-600" />}
          loading={isLoading}
          value={stats?.invoices.unpaidCount}
          subtitle={
            stats
              ? `${formatCurrency(stats.invoices.outstandingTotal)} outstanding`
              : undefined
          }
          testId="stat-unpaid-invoices"
        />
        <StatCard
          title="Updated (last 7 days)"
          icon={<TrendingUp className="h-4 w-4 text-orange-600" />}
          loading={isLoading}
          value={stats?.packages.updatedLast7Days}
          subtitle="Package status changes"
          testId="stat-recent-updates"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-3">
            <Link href="/admin/packages" data-testid="link-new-package">
              <Button className="w-full bg-blue-600 hover:bg-blue-700" size="sm">
                <Plus className="w-4 h-4 mr-2" /> New Package
              </Button>
            </Link>
            <Link href="/admin/quotes" data-testid="link-view-quotes">
              <Button variant="outline" className="w-full" size="sm">
                <FileText className="w-4 h-4 mr-2" /> View Quotes
              </Button>
            </Link>
            <Link href="/admin/invoices" data-testid="link-invoices">
              <Button variant="outline" className="w-full" size="sm">
                <CreditCard className="w-4 h-4 mr-2" /> Invoices
              </Button>
            </Link>
            <Link href="/track" data-testid="link-track-package">
              <Button variant="outline" className="w-full" size="sm">
                <Search className="w-4 h-4 mr-2" /> Track Package
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Activity className="w-4 h-4 text-blue-600" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : !stats?.recentActivity.length ? (
              <p className="text-sm text-muted-foreground py-6 text-center" data-testid="text-no-activity">
                No activity yet. Create a package or quote to see updates here.
              </p>
            ) : (
              <ul className="divide-y divide-gray-100 dark:divide-gray-800">
                {stats.recentActivity.map(item => {
                  const Icon = item.type === 'new_quote' ? FileText
                    : item.title.toLowerCase().includes('delivered') ? CheckCircle2
                    : item.title.toLowerCase().includes('failed') ? AlertCircle
                    : Truck;
                  return (
                    <li
                      key={item.id}
                      className="flex items-start gap-3 py-3"
                      data-testid={`activity-${item.id}`}
                    >
                      <Icon className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{item.title}</p>
                        {item.detail && (
                          <p className="text-xs text-muted-foreground truncate">
                            {formatActivityDetail(item.detail)}
                          </p>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground flex-shrink-0">
                        {timeAgo(item.timestamp)}
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function formatActivityDetail(detail: string): string {
  // Friendly: turn snake_case status fragments into spaced text in details too.
  return detail.replace(/(?<=→ )([a-z_]+)/g, m => formatStatus(m));
}

function StatCard({
  title, icon, loading, value, subtitle, testId,
}: {
  title: string;
  icon: React.ReactNode;
  loading: boolean;
  value: number | undefined;
  subtitle?: string;
  testId: string;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        {loading ? (
          <>
            <Skeleton className="h-9 w-20" />
            <Skeleton className="h-3 w-32 mt-2" />
          </>
        ) : (
          <>
            <div className="text-3xl font-bold" data-testid={testId}>{value ?? 0}</div>
            {subtitle && (
              <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
