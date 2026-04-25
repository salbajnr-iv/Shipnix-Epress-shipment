import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';

export async function GET() {
  const session = await requireAdmin();
  if (!session.ok) return session.response;

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const [
    packagesRes,
    quotesRes,
    invoicesRes,
    recentEventsRes,
    recentQuotesRes,
  ] = await Promise.all([
    session.supabase
      .from('packages')
      .select('id, current_status, updated_at, created_at'),
    session.supabase
      .from('quotes')
      .select('id, status, created_at'),
    session.supabase
      .from('invoices')
      .select('id, payment_status, total_amount, due_date'),
    session.supabase
      .from('tracking_events')
      .select('id, status, location, description, timestamp, package_id, packages(tracking_id)')
      .order('timestamp', { ascending: false })
      .limit(10),
    session.supabase
      .from('quotes')
      .select('id, quote_number, sender_name, total_cost, status, created_at')
      .order('created_at', { ascending: false })
      .limit(5),
  ]);

  const packages = packagesRes.data ?? [];
  const quotes = quotesRes.data ?? [];
  const invoices = invoicesRes.data ?? [];

  const statusBreakdown: Record<string, number> = {};
  for (const p of packages) {
    const s = p.current_status as string;
    statusBreakdown[s] = (statusBreakdown[s] ?? 0) + 1;
  }

  const updatedLast7Days = packages.filter(
    p => (p.updated_at ?? p.created_at) >= sevenDaysAgo,
  ).length;

  const openQuotes = quotes.filter(q => q.status === 'pending').length;

  const unpaidInvoices = invoices.filter(i => (i.payment_status ?? 'pending') !== 'paid');
  const outstanding = unpaidInvoices.reduce(
    (sum, i) => sum + parseFloat(String(i.total_amount ?? '0')),
    0,
  );

  const recentActivity = [
    ...(recentEventsRes.data ?? []).map((e: any) => ({
      type: 'status_change' as const,
      id: `event-${e.id}`,
      timestamp: e.timestamp,
      title: `Package ${e.packages?.tracking_id ?? `#${e.package_id}`} → ${e.status}`,
      detail: e.description ?? e.location ?? '',
    })),
    ...(recentQuotesRes.data ?? []).map((q: any) => ({
      type: 'new_quote' as const,
      id: `quote-${q.id}`,
      timestamp: q.created_at,
      title: `New quote ${q.quote_number} from ${q.sender_name}`,
      detail: `$${parseFloat(q.total_cost).toFixed(2)} · ${q.status}`,
    })),
  ]
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 10);

  return NextResponse.json({
    packages: {
      total: packages.length,
      byStatus: statusBreakdown,
      updatedLast7Days,
    },
    quotes: {
      total: quotes.length,
      open: openQuotes,
    },
    invoices: {
      total: invoices.length,
      unpaidCount: unpaidInvoices.length,
      outstandingTotal: outstanding,
    },
    recentActivity,
  });
}
