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
    recentPackagesRes,
    recentQuotesRes,
    recentInvoicesRes,
    recentMessagesRes,
  ] = await Promise.all([
    // Stats aggregates
    session.supabase
      .from('packages')
      .select('id, current_status, updated_at, created_at'),
    session.supabase
      .from('quotes')
      .select('id, status, created_at'),
    session.supabase
      .from('invoices')
      .select('id, payment_status, total_amount, due_date'),

    // Recent activity sources
    session.supabase
      .from('tracking_events')
      .select('id, status, location, description, timestamp, package_id, packages(tracking_id, recipient_name)')
      .order('timestamp', { ascending: false })
      .limit(15),
    session.supabase
      .from('packages')
      .select('id, tracking_id, sender_name, recipient_name, current_status, shipping_cost, created_at')
      .order('created_at', { ascending: false })
      .limit(10),
    session.supabase
      .from('quotes')
      .select('id, quote_number, sender_name, recipient_name, total_cost, status, created_at, updated_at')
      .order('updated_at', { ascending: false })
      .limit(10),
    session.supabase
      .from('invoices')
      .select('id, invoice_number, customer_name, total_amount, payment_status, paid_at, created_at, updated_at')
      .order('updated_at', { ascending: false })
      .limit(10),
    session.supabase
      .from('contact_messages')
      .select('id, name, subject, status, created_at')
      .order('created_at', { ascending: false })
      .limit(10),
  ]);

  // ── Aggregate stats ──
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

  // ── Build unified activity feed ──
  const activityItems: Array<{
    type: string;
    id: string;
    timestamp: string;
    title: string;
    detail: string;
    href?: string;
  }> = [];

  // Package status changes (tracking events)
  for (const e of recentEventsRes.data ?? []) {
    const pkg = e.packages as any;
    activityItems.push({
      type: 'status_change',
      id: `event-${e.id}`,
      timestamp: e.timestamp,
      title: `${pkg?.tracking_id ?? `Package #${e.package_id}`} → ${e.status}`,
      detail: [e.location, e.description].filter(Boolean).join(' · '),
      href: '/admin/packages',
    });
  }

  // New packages created
  for (const p of recentPackagesRes.data ?? []) {
    activityItems.push({
      type: 'new_package',
      id: `pkg-${p.id}`,
      timestamp: p.created_at,
      title: `New package created: ${p.tracking_id}`,
      detail: `${p.sender_name} → ${p.recipient_name}${p.shipping_cost ? ` · $${parseFloat(p.shipping_cost).toFixed(2)}` : ''}`,
      href: '/admin/packages',
    });
  }

  // Quote events (new + status updates)
  for (const q of recentQuotesRes.data ?? []) {
    const isNew = q.created_at === q.updated_at ||
      Math.abs(new Date(q.created_at).getTime() - new Date(q.updated_at).getTime()) < 2000;

    if (isNew) {
      activityItems.push({
        type: 'new_quote',
        id: `quote-new-${q.id}`,
        timestamp: q.created_at,
        title: `New quote request: ${q.quote_number}`,
        detail: `${q.sender_name} → ${q.recipient_name} · $${parseFloat(q.total_cost).toFixed(2)}`,
        href: '/admin/quotes',
      });
    } else {
      const statusLabel =
        q.status === 'approved' ? 'Quote approved' :
        q.status === 'expired' ? 'Quote expired' :
        q.status === 'converted_to_invoice' ? 'Quote converted to invoice' :
        `Quote updated`;
      activityItems.push({
        type: `quote_${q.status}`,
        id: `quote-upd-${q.id}`,
        timestamp: q.updated_at,
        title: `${statusLabel}: ${q.quote_number}`,
        detail: `${q.sender_name} · $${parseFloat(q.total_cost).toFixed(2)}`,
        href: '/admin/quotes',
      });
    }
  }

  // Invoice events
  for (const inv of recentInvoicesRes.data ?? []) {
    if (inv.paid_at) {
      activityItems.push({
        type: 'invoice_paid',
        id: `inv-paid-${inv.id}`,
        timestamp: inv.paid_at,
        title: `Invoice paid: ${inv.invoice_number}`,
        detail: `${inv.customer_name} · $${parseFloat(inv.total_amount).toFixed(2)}`,
        href: '/admin/invoices',
      });
    }
    activityItems.push({
      type: 'new_invoice',
      id: `inv-new-${inv.id}`,
      timestamp: inv.created_at,
      title: `Invoice created: ${inv.invoice_number}`,
      detail: `${inv.customer_name} · $${parseFloat(inv.total_amount).toFixed(2)} · ${inv.payment_status ?? 'pending'}`,
      href: '/admin/invoices',
    });
  }

  // Contact messages
  for (const m of recentMessagesRes.data ?? []) {
    activityItems.push({
      type: 'new_message',
      id: `msg-${m.id}`,
      timestamp: m.created_at,
      title: `New message from ${m.name}`,
      detail: m.subject,
      href: '/admin/messages',
    });
  }

  // Sort by timestamp descending, deduplicate IDs, return top 20
  const seen = new Set<string>();
  const recentActivity = activityItems
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .filter(item => {
      if (seen.has(item.id)) return false;
      seen.add(item.id);
      return true;
    })
    .slice(0, 20);

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
