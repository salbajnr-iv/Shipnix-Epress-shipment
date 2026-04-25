'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Search, Package, MapPin, Clock, CheckCircle, Truck, AlertCircle,
  PackageX, ArrowLeft, Sparkles, User, Calendar, Hash,
  ClipboardCheck, PackageCheck, Warehouse,
} from 'lucide-react';
import { formatStatus } from '@/lib/utils';

interface TrackingResult {
  tracking_id: string;
  current_status: string;
  current_location?: string;
  estimated_delivery?: string;
  actual_delivery?: string;
  recipient_name: string;
  recipient_address: string;
  sender_name: string;
  package_description?: string;
  shipping_cost?: string;
  created_at: string;
  trackingEvents: Array<{
    id: number;
    status: string;
    location?: string;
    description?: string;
    timestamp: string;
  }>;
}

const STATUS_ICONS: Record<string, any> = {
  order_placed: ClipboardCheck,
  packed: PackageCheck,
  in_transit: Truck,
  arrived_at_hub: Warehouse,
  out_for_delivery: Truck,
  delivered: CheckCircle,
  exception: AlertCircle,
  // Legacy fallbacks
  created: Package,
  picked_up: Package,
  pending_payment: ClipboardCheck,
  failed_delivery: AlertCircle,
  returned: AlertCircle,
};

const STATUS_COLORS: Record<string, string> = {
  order_placed: 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900/50',
  packed: 'bg-cyan-100 text-cyan-800 border-cyan-200 dark:bg-cyan-950/40 dark:text-cyan-300 dark:border-cyan-900/50',
  in_transit: 'bg-indigo-100 text-indigo-800 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-900/50',
  arrived_at_hub: 'bg-sky-100 text-sky-800 border-sky-200 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-900/50',
  out_for_delivery: 'bg-violet-100 text-violet-800 border-violet-200 dark:bg-violet-950/40 dark:text-violet-300 dark:border-violet-900/50',
  delivered: 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900/50',
  exception: 'bg-red-100 text-red-800 border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-900/50',
  // Legacy fallbacks
  pending_payment: 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900/50',
  created: 'bg-slate-100 text-slate-800 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
  picked_up: 'bg-cyan-100 text-cyan-800 border-cyan-200 dark:bg-cyan-950/40 dark:text-cyan-300 dark:border-cyan-900/50',
  failed_delivery: 'bg-red-100 text-red-800 border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-900/50',
  returned: 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900/50',
};

const TRACKING_PATTERN = /^ST-[A-Z0-9]{6,12}$/;

type FetchState =
  | { kind: 'idle' }
  | { kind: 'loading' }
  | { kind: 'found'; result: TrackingResult }
  | { kind: 'not_found'; query: string }
  | { kind: 'error'; message: string };

export default function PublicTrackingClient({ initialId }: { initialId?: string }) {
  const [trackingId, setTrackingId] = useState(initialId ?? '');
  const [state, setState] = useState<FetchState>({ kind: 'idle' });
  const [validationError, setValidationError] = useState('');
  const router = useRouter();

  useEffect(() => {
    if (initialId) handleTrack(initialId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialId]);

  const handleTrack = async (id?: string) => {
    const searchId = (id ?? trackingId).trim().toUpperCase();
    setValidationError('');

    if (!searchId) {
      setValidationError('Please enter a tracking ID.');
      return;
    }
    if (!TRACKING_PATTERN.test(searchId)) {
      setValidationError('Tracking IDs look like ST-XXXXXXXXX (letters and digits only).');
      return;
    }

    setState({ kind: 'loading' });
    try {
      const res = await fetch(`/api/track/${searchId}`);
      if (res.status === 404) {
        setState({ kind: 'not_found', query: searchId });
        return;
      }
      if (!res.ok) {
        setState({ kind: 'error', message: `Lookup failed (status ${res.status}). Please try again.` });
        return;
      }
      const data = (await res.json()) as TrackingResult;
      setState({ kind: 'found', result: data });
    } catch {
      setState({ kind: 'error', message: 'Network error. Please check your connection and try again.' });
    }
  };

  const reset = () => {
    setState({ kind: 'idle' });
    setTrackingId('');
    setValidationError('');
    router.push('/track');
  };

  return (
    <div className="bg-slate-50 dark:bg-slate-950 min-h-screen">
      {/* Hero */}
      <section className="relative py-14 px-4 overflow-hidden bg-gradient-to-br from-indigo-700 via-violet-700 to-cyan-600 text-white">
        <div className="absolute inset-0 pointer-events-none opacity-30">
          <div className="absolute top-0 right-0 w-96 h-96 bg-amber-300/30 rounded-full blur-3xl animate-float" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-cyan-300/40 rounded-full blur-3xl animate-float-slow" />
        </div>
        <div className="relative max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur border border-white/20 px-3 py-1.5 rounded-full text-xs font-medium mb-4">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" /> Real-time Tracking
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold mb-3 tracking-tight" data-testid="text-page-title">
            Track your shipment
          </h1>
          <p className="text-indigo-100 text-base sm:text-lg max-w-xl mx-auto">
            Enter your tracking ID to see live delivery updates from pickup to door.
          </p>
        </div>
      </section>

      <section className="py-10 px-4 -mt-10 relative z-10">
        <div className="max-w-3xl mx-auto space-y-6">
          {/* Search bar */}
          <div className="surface-card-elevated p-5 sm:p-6">
            <Label className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2 block">
              Tracking ID
            </Label>
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  value={trackingId}
                  onChange={e => setTrackingId(e.target.value.toUpperCase())}
                  placeholder="ST-ABC123456"
                  className="pl-9 font-mono"
                  onKeyDown={e => e.key === 'Enter' && handleTrack()}
                  data-testid="input-tracking-id"
                  aria-invalid={!!validationError}
                />
              </div>
              <Button
                onClick={() => handleTrack()}
                className="h-11 rounded-lg px-6 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-semibold shadow-md shadow-indigo-500/25"
                disabled={state.kind === 'loading'}
                data-testid="button-track"
              >
                <Search className="w-4 h-4 mr-2" />
                {state.kind === 'loading' ? 'Searching…' : 'Track Shipment'}
              </Button>
            </div>
            {validationError && (
              <p className="text-red-600 dark:text-red-400 text-xs mt-3 flex items-center gap-1.5" data-testid="text-validation-error">
                <AlertCircle className="w-3.5 h-3.5" /> {validationError}
              </p>
            )}
            {!validationError && state.kind === 'idle' && (
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-3">
                Need help? Contact our support team or check your shipping confirmation email.
              </p>
            )}
          </div>

          {state.kind === 'loading' && <TrackingSkeleton />}

          {state.kind === 'not_found' && (
            <div className="surface-card p-10 text-center" data-testid="card-not-found">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                <PackageX className="w-7 h-7 text-slate-400" />
              </div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                We couldn’t find that shipment
              </h2>
              <p className="text-slate-500 dark:text-slate-400 text-sm mb-1">
                No package matches <span className="font-mono font-semibold text-slate-700 dark:text-slate-300">{state.query}</span>.
              </p>
              <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">
                Double-check the tracking ID for any typos and try again.
              </p>
              <Button variant="outline" onClick={reset} className="rounded-xl" data-testid="button-reset-tracking">
                <ArrowLeft className="w-4 h-4 mr-2" /> Try a different ID
              </Button>
            </div>
          )}

          {state.kind === 'error' && (
            <div className="surface-card border-red-200 dark:border-red-900/50 p-8 text-center" data-testid="card-error">
              <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-red-50 dark:bg-red-950/40 flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-red-500" />
              </div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white mb-1">
                Something went wrong
              </h2>
              <p className="text-slate-500 dark:text-slate-400 text-sm mb-5">{state.message}</p>
              <Button onClick={() => handleTrack()} className="rounded-xl bg-indigo-600 hover:bg-indigo-700">
                Try again
              </Button>
            </div>
          )}

          {state.kind === 'found' && <FoundResult result={state.result} />}
        </div>
      </section>
    </div>
  );
}

function FoundResult({ result }: { result: TrackingResult }) {
  return (
    <div className="space-y-5" data-testid="card-found">
      {/* Status banner */}
      <div className="surface-card-elevated overflow-hidden">
        <div className="bg-gradient-to-r from-indigo-600 to-violet-600 p-1" />
        <div className="p-6">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-5">
            <div className="min-w-0 flex-1">
              <p className="text-[10px] uppercase tracking-[0.18em] font-semibold text-slate-500 dark:text-slate-400 mb-1">
                Tracking ID
              </p>
              <p
                className="text-xl sm:text-2xl font-bold font-mono text-slate-900 dark:text-white"
                data-testid="text-tracking-id"
              >
                {result.tracking_id}
              </p>
            </div>
            <span
              className={`status-pill text-sm px-3.5 py-1.5 ${STATUS_COLORS[result.current_status] ?? STATUS_COLORS.created}`}
              data-testid="text-current-status"
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-current opacity-50" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-current" />
              </span>
              {formatStatus(result.current_status)}
            </span>
          </div>

          <div className="grid sm:grid-cols-2 gap-4 text-sm">
            <DetailRow icon={User} label="Sender">
              <p className="font-semibold text-slate-900 dark:text-white">{result.sender_name}</p>
            </DetailRow>
            <DetailRow icon={User} label="Recipient">
              <p className="font-semibold text-slate-900 dark:text-white">{result.recipient_name}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">{result.recipient_address}</p>
            </DetailRow>
            {result.current_location && (
              <DetailRow icon={MapPin} label="Current Location">
                <p className="font-semibold text-slate-900 dark:text-white">{result.current_location}</p>
              </DetailRow>
            )}
            {result.estimated_delivery && (
              <DetailRow icon={Calendar} label="Estimated Delivery">
                <p className="font-semibold text-slate-900 dark:text-white">
                  {new Date(result.estimated_delivery).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                </p>
              </DetailRow>
            )}
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div className="surface-card overflow-hidden">
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <Clock className="w-4 h-4 text-indigo-600" />
            Tracking History
          </h3>
          <span className="text-[10px] uppercase tracking-wider text-slate-400 font-medium">
            {result.trackingEvents.length} {result.trackingEvents.length === 1 ? 'event' : 'events'}
          </span>
        </div>
        <div className="p-5">
          {result.trackingEvents.length === 0 ? (
            <p className="text-slate-500 dark:text-slate-400 text-sm text-center py-6">
              No tracking events yet — updates will appear here as your package moves.
            </p>
          ) : (
            <div className="relative" data-testid="list-tracking-events">
              {result.trackingEvents.map((event, i) => {
                const Icon = STATUS_ICONS[event.status] ?? Package;
                const isFirst = i === 0;
                return (
                  <div key={event.id} className="flex gap-4 pb-5 last:pb-0" data-testid={`event-${event.id}`}>
                    <div className="flex flex-col items-center">
                      <div
                        className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 border-2 ${
                          isFirst
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-500/40'
                            : 'bg-white dark:bg-slate-900 text-slate-400 border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      {i < result.trackingEvents.length - 1 && (
                        <div className="w-0.5 flex-1 bg-slate-200 dark:bg-slate-800 mt-2" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0 pt-1">
                      <div className="flex items-start justify-between gap-3 flex-wrap">
                        <p className={`font-semibold text-sm ${isFirst ? 'text-slate-900 dark:text-white' : 'text-slate-700 dark:text-slate-300'}`}>
                          {formatStatus(event.status)}
                        </p>
                        <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 whitespace-nowrap">
                          {new Date(event.timestamp).toLocaleString()}
                        </p>
                      </div>
                      {event.description && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{event.description}</p>
                      )}
                      {event.location && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-1">
                          <MapPin className="w-3 h-3" />
                          {event.location}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function DetailRow({ icon: Icon, label, children }: { icon: any; label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2.5 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-200/50 dark:border-slate-800">
      <div className="w-8 h-8 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex items-center justify-center flex-shrink-0">
        <Icon className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] uppercase tracking-wider font-semibold text-slate-500 dark:text-slate-400 mb-0.5">{label}</p>
        {children}
      </div>
    </div>
  );
}

function Label({ className, children }: { className?: string; children: React.ReactNode }) {
  return <p className={className}>{children}</p>;
}

function TrackingSkeleton() {
  return (
    <div className="space-y-5" data-testid="card-loading">
      <div className="surface-card p-6">
        <div className="flex items-center justify-between flex-wrap gap-3 mb-5">
          <div>
            <Skeleton className="h-3 w-24 mb-2" />
            <Skeleton className="h-7 w-48" />
          </div>
          <Skeleton className="h-9 w-32 rounded-full" />
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-lg" />
          ))}
        </div>
      </div>
      <div className="surface-card p-5 space-y-4">
        <Skeleton className="h-5 w-40" />
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex gap-4">
            <Skeleton className="w-9 h-9 rounded-full flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-3/4" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
