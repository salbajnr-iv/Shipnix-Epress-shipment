'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { CreditCard, CheckCircle, Calendar, Mail, User, DollarSign } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { formatCurrency, formatStatus } from '@/lib/utils';
import type { Invoice } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900/50',
  paid: 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900/50',
  failed: 'bg-red-100 text-red-800 border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-900/50',
  refunded: 'bg-slate-100 text-slate-800 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
};

export default function InvoiceManagementClient() {
  const { toast } = useToast();
  const qc = useQueryClient();

  const { data: invoicesRaw, isLoading } = useQuery<Invoice[]>({ queryKey: ['/api/invoices'] });
  const invoices = Array.isArray(invoicesRaw) ? invoicesRaw : [];

  const markPaidMutation = useMutation({
    mutationFn: (id: number) => apiRequest('PATCH', `/api/invoices/${id}/mark-paid`),
    onSuccess: (data) => {
      toast({
        title: 'Payment Confirmed',
        description: data.trackingId ? `Package created: ${data.trackingId}` : 'Payment marked as received',
      });
      qc.invalidateQueries({ queryKey: ['/api/invoices'] });
      qc.invalidateQueries({ queryKey: ['/api/packages'] });
    },
    onError: (e: any) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });

  const pending = invoices.filter(i => i.payment_status === 'pending').length;
  const paid = invoices.filter(i => i.payment_status === 'paid').length;
  const outstanding = invoices
    .filter(i => i.payment_status === 'pending')
    .reduce((sum, i) => sum + Number(i.total_amount ?? 0), 0);

  return (
    <div className="page-shell">
      <header className="page-header">
        <div>
          <p className="page-eyebrow">Billing</p>
          <h1 className="page-title" data-testid="text-page-title">Invoice Management</h1>
          <p className="page-subtitle">Track customer payments and manage billing across your shipments.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <span className="meta-chip" data-testid="chip-pending">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" /> {pending} pending
          </span>
          <span className="meta-chip" data-testid="chip-paid">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> {paid} paid
          </span>
          <span className="meta-chip text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/50 bg-emerald-50 dark:bg-emerald-950/30">
            <DollarSign className="w-3 h-3" /> {formatCurrency(outstanding)} outstanding
          </span>
        </div>
      </header>

      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-32 w-full rounded-2xl" />
          ))}
        </div>
      ) : invoices.length === 0 ? (
        <div className="surface-card p-12 text-center">
          <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
            <CreditCard className="w-6 h-6 text-slate-400" />
          </div>
          <h3 className="font-semibold text-slate-900 dark:text-white mb-1">No invoices yet</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Invoices will appear here when created from approved quotes.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {invoices.map((inv) => (
            <article
              key={inv.id}
              className="surface-card overflow-hidden transition-shadow hover:shadow-md"
              data-testid={`invoice-${inv.id}`}
            >
              <div className="p-5 sm:p-6 flex flex-col lg:flex-row lg:items-stretch gap-5">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-3 flex-wrap">
                    <span className="text-xs font-mono font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 px-2 py-1 rounded-md">
                      {inv.invoice_number}
                    </span>
                    <span className={`status-pill ${STATUS_COLORS[inv.payment_status ?? 'pending'] ?? 'bg-slate-100 text-slate-800'}`}>
                      {formatStatus(inv.payment_status ?? 'pending')}
                    </span>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-3 mb-3">
                    <div className="flex items-start gap-2">
                      <User className="w-3.5 h-3.5 text-slate-400 mt-0.5 flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="text-[10px] uppercase tracking-wider font-semibold text-slate-500">Customer</p>
                        <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{inv.customer_name}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <Mail className="w-3.5 h-3.5 text-slate-400 mt-0.5 flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="text-[10px] uppercase tracking-wider font-semibold text-slate-500">Email</p>
                        <p className="text-sm text-slate-700 dark:text-slate-300 truncate">{inv.customer_email}</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 flex-wrap">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      Due {new Date(inv.due_date).toLocaleDateString()}
                    </span>
                    {inv.paid_at && (
                      <>
                        <span>·</span>
                        <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-medium">
                          <CheckCircle className="w-3 h-3" /> Paid {new Date(inv.paid_at).toLocaleDateString()}
                        </span>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex flex-row lg:flex-col items-stretch gap-3 lg:w-56 lg:border-l lg:border-slate-200 dark:lg:border-slate-800 lg:pl-5">
                  <div className="flex-1 lg:flex-none p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 flex flex-col justify-center">
                    <p className="text-[10px] uppercase tracking-wider font-semibold text-slate-500 mb-1">Amount</p>
                    <p className="text-lg font-extrabold text-emerald-600 dark:text-emerald-400">
                      {formatCurrency(inv.total_amount)}
                    </p>
                  </div>

                  {inv.payment_status === 'pending' && (
                    <Button
                      size="sm"
                      className="bg-emerald-600 hover:bg-emerald-700 rounded-lg h-9 lg:w-full"
                      onClick={() => markPaidMutation.mutate(inv.id)}
                      disabled={markPaidMutation.isPending}
                      data-testid={`button-mark-paid-${inv.id}`}
                    >
                      <CheckCircle className="w-3.5 h-3.5 mr-1.5" />Mark Paid
                    </Button>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
