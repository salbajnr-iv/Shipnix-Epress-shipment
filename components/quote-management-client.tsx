'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { FileText, CheckCircle, XCircle, ArrowRight, Calendar, MapPin, DollarSign } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { formatCurrency, formatStatus } from '@/lib/utils';
import type { Quote } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900/50',
  approved: 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900/50',
  expired: 'bg-red-100 text-red-800 border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-900/50',
  converted_to_invoice: 'bg-indigo-100 text-indigo-800 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-900/50',
};

export default function QuoteManagementClient() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null);

  const { data: quotesRaw, isLoading } = useQuery<Quote[]>({ queryKey: ['/api/quotes'] });
  const quotes = Array.isArray(quotesRaw) ? quotesRaw : [];

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: any) => apiRequest('PATCH', `/api/quotes/${id}`, data),
    onSuccess: () => {
      toast({ title: 'Quote Updated' });
      qc.invalidateQueries({ queryKey: ['/api/quotes'] });
    },
    onError: (e: any) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });

  const convertMutation = useMutation({
    mutationFn: (quoteId: number) => apiRequest('POST', `/api/invoices`, {
      customer_name: selectedQuote?.sender_name,
      customer_email: selectedQuote?.sender_email,
      total_amount: selectedQuote?.total_cost,
      tax_amount: '0',
      payment_method: 'card',
      payment_status: 'pending',
      due_date: new Date(Date.now() + 7 * 86400000).toISOString(),
      items: [{ description: selectedQuote?.package_description ?? 'Shipping', amount: selectedQuote?.total_cost }],
      quote_id: quoteId,
    }),
    onSuccess: (invoice) => {
      if (selectedQuote) {
        updateMutation.mutate({ id: selectedQuote.id, data: { status: 'converted_to_invoice' } });
      }
      toast({ title: 'Invoice Created', description: `Invoice ${invoice.invoice_number} created` });
      qc.invalidateQueries({ queryKey: ['/api/invoices'] });
    },
    onError: (e: any) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });

  const pending = quotes.filter(q => q.status === 'pending').length;
  const approved = quotes.filter(q => q.status === 'approved').length;
  const converted = quotes.filter(q => q.status === 'converted_to_invoice').length;

  return (
    <div className="page-shell">
      <header className="page-header">
        <div>
          <p className="page-eyebrow">Sales Pipeline</p>
          <h1 className="page-title" data-testid="text-page-title">Quote Management</h1>
          <p className="page-subtitle">Review customer requests and convert approved quotes into invoices.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <span className="meta-chip" data-testid="chip-pending">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" /> {pending} pending
          </span>
          <span className="meta-chip" data-testid="chip-approved">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> {approved} approved
          </span>
          <span className="meta-chip" data-testid="chip-converted">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" /> {converted} converted
          </span>
        </div>
      </header>

      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-36 w-full rounded-2xl" />
          ))}
        </div>
      ) : quotes.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No quotes yet"
          subtitle="Quotes will appear here when customers request them through the public form."
        />
      ) : (
        <div className="space-y-4">
          {quotes.map((q) => {
            const isExpired = new Date(q.valid_until) < new Date() && q.status === 'pending';
            return (
              <article
                key={q.id}
                className="surface-card overflow-hidden transition-shadow hover:shadow-md"
                data-testid={`quote-${q.id}`}
              >
                <div className="p-5 sm:p-6 flex flex-col lg:flex-row lg:items-stretch gap-5">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-3 flex-wrap">
                      <span className="text-xs font-mono font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 px-2 py-1 rounded-md">
                        {q.quote_number}
                      </span>
                      <span className={`status-pill ${STATUS_COLORS[q.status] ?? 'bg-slate-100 text-slate-800'}`}>
                        {formatStatus(q.status)}
                      </span>
                      {isExpired && (
                        <span className="status-pill bg-red-100 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-900/50">
                          Expired
                        </span>
                      )}
                    </div>

                    <div className="grid sm:grid-cols-2 gap-3 mb-3">
                      <div className="flex items-start gap-2">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 mt-0.5 flex-shrink-0" />
                        <div className="min-w-0">
                          <p className="text-[10px] uppercase tracking-wider font-semibold text-slate-500">From</p>
                          <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{q.sender_name}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 mt-0.5 flex-shrink-0" />
                        <div className="min-w-0">
                          <p className="text-[10px] uppercase tracking-wider font-semibold text-slate-500">To</p>
                          <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{q.recipient_name}</p>
                        </div>
                      </div>
                    </div>

                    {q.package_description && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 mb-3 line-clamp-2">{q.package_description}</p>
                    )}

                    <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400 flex-wrap">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        Valid until {new Date(q.valid_until).toLocaleDateString()}
                      </span>
                      <span>·</span>
                      <span>Created {new Date(q.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>

                  {/* Pricing & actions */}
                  <div className="flex flex-row lg:flex-col items-stretch gap-3 lg:w-56 lg:border-l lg:border-slate-200 dark:lg:border-slate-800 lg:pl-5">
                    <div className="flex-1 lg:flex-none p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 flex flex-col justify-center">
                      <p className="text-[10px] uppercase tracking-wider font-semibold text-slate-500 mb-1 flex items-center gap-1">
                        <DollarSign className="w-3 h-3" /> Total
                      </p>
                      <p className="text-lg font-extrabold text-emerald-600 dark:text-emerald-400">
                        {formatCurrency(q.total_cost)}
                      </p>
                      <p className="text-[10px] text-slate-500">Base {formatCurrency(q.base_cost)}</p>
                    </div>

                    <div className="flex flex-col gap-2 flex-1 lg:flex-none">
                      {q.status === 'pending' && (
                        <>
                          <Button
                            size="sm"
                            className="bg-emerald-600 hover:bg-emerald-700 rounded-lg h-9"
                            onClick={() => updateMutation.mutate({ id: q.id, data: { status: 'approved' } })}
                            data-testid={`button-approve-${q.id}`}
                          >
                            <CheckCircle className="w-3.5 h-3.5 mr-1.5" />Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="rounded-lg h-9 border-red-200 text-red-700 hover:bg-red-50 dark:border-red-900/50 dark:text-red-400 dark:hover:bg-red-950/40"
                            onClick={() => updateMutation.mutate({ id: q.id, data: { status: 'expired' } })}
                            data-testid={`button-decline-${q.id}`}
                          >
                            <XCircle className="w-3.5 h-3.5 mr-1.5" />Decline
                          </Button>
                        </>
                      )}
                      {q.status === 'approved' && (
                        <Button
                          size="sm"
                          className="bg-indigo-600 hover:bg-indigo-700 rounded-lg h-9"
                          onClick={() => { setSelectedQuote(q); convertMutation.mutate(q.id); }}
                          data-testid={`button-convert-${q.id}`}
                        >
                          <ArrowRight className="w-3.5 h-3.5 mr-1.5" />Convert
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}

function EmptyState({ icon: Icon, title, subtitle }: { icon: any; title: string; subtitle: string }) {
  return (
    <div className="surface-card p-12 text-center">
      <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
        <Icon className="w-6 h-6 text-slate-400" />
      </div>
      <h3 className="font-semibold text-slate-900 dark:text-white mb-1">{title}</h3>
      <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mx-auto">{subtitle}</p>
    </div>
  );
}
