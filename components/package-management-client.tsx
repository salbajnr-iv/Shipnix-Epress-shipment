'use client';

import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Package, Plus, MapPin, Truck, Copy, Mail, CheckCircle2, Link2, User,
  DollarSign, ArrowRight, Search, ChevronDown, ChevronUp, Clock,
  ClipboardCheck, PackageCheck, Warehouse, AlertTriangle, Filter, X,
  Calendar, Hash, Phone, RefreshCw, Building2, Globe, PenLine,
  ShieldCheck, CreditCard, PackageOpen,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  type Package as PackageType,
  type PackageStatus,
  PACKAGE_STATUS_FLOW,
  PACKAGE_STATUS_TRANSITIONS,
  PACKAGE_TERMINAL_STATUSES,
} from '@/lib/types';
import { formatCurrency, formatStatus } from '@/lib/utils';

/* ─────────────────────────────────────────────────────── constants ── */

const STATUS_COLORS: Record<string, string> = {
  order_placed:     'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900/50',
  packed:           'bg-cyan-100 text-cyan-800 border-cyan-200 dark:bg-cyan-950/40 dark:text-cyan-300 dark:border-cyan-900/50',
  in_transit:       'bg-indigo-100 text-indigo-800 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-900/50',
  arrived_at_hub:   'bg-sky-100 text-sky-800 border-sky-200 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-900/50',
  out_for_delivery: 'bg-violet-100 text-violet-800 border-violet-200 dark:bg-violet-950/40 dark:text-violet-300 dark:border-violet-900/50',
  delivered:        'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900/50',
  exception:        'bg-red-100 text-red-800 border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-900/50',
  pending_payment:  'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900/50',
  created:          'bg-slate-100 text-slate-800 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
  picked_up:        'bg-cyan-100 text-cyan-800 border-cyan-200 dark:bg-cyan-950/40 dark:text-cyan-300 dark:border-cyan-900/50',
  failed_delivery:  'bg-red-100 text-red-800 border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-900/50',
  returned:         'bg-slate-100 text-slate-800 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
};

const STATUS_ICONS: Record<string, any> = {
  order_placed:     ClipboardCheck,
  packed:           PackageCheck,
  in_transit:       Truck,
  arrived_at_hub:   Warehouse,
  out_for_delivery: Truck,
  delivered:        CheckCircle2,
  exception:        AlertTriangle,
};

const STATUS_DESCRIPTIONS: Record<string, string> = {
  order_placed:     'Order placed and being processed',
  packed:           'Package packed and ready to ship',
  in_transit:       'Shipped and currently in transit',
  arrived_at_hub:   'Arrived at sorting facility / hub',
  out_for_delivery: 'Out for delivery with local courier',
  delivered:        'Successfully delivered',
  exception:        'Shipment encountered an issue',
};

const MAIN_FLOW: PackageStatus[] = [
  'order_placed', 'packed', 'in_transit', 'arrived_at_hub', 'out_for_delivery', 'delivered',
];

const EMPTY_FORM = {
  // Sender (lean)
  sender_name: '', sender_phone: '', sender_address: '',
  // Recipient (structured)
  recipient_name: '', recipient_email: '', recipient_phone: '',
  recipient_street: '', recipient_apt: '', recipient_city: '',
  recipient_state: '', recipient_zip: '', recipient_country: '',
  delivery_instructions: '', signature_required: false as boolean,
  // Package
  package_description: '', package_type: 'parcel', weight: '', dimensions: '',
  // Shipping
  shipping_cost: '', payment_method: 'card', payment_status: 'paid',
  estimated_delivery: '', current_status: 'order_placed', current_location: '',
};

type TrackingEvent = {
  id: number; status: string; location?: string; description?: string; timestamp: string;
};

/* ─────────────────────────────────────────────────────── helpers ── */

function nextStatusOptions(current: string | undefined): PackageStatus[] {
  if (!current) return [];
  const transitions = PACKAGE_STATUS_TRANSITIONS as Record<string, PackageStatus[]>;
  const allowed = transitions[current] ?? [];
  const seen = new Set<PackageStatus>();
  const result: PackageStatus[] = [];
  for (const s of [current as PackageStatus, ...allowed]) {
    if (!seen.has(s)) { seen.add(s); result.push(s); }
  }
  return result;
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

/* ─────────────────────────────────────────────── StatusStepper ── */

function StatusStepper({
  current, selected, onSelect, disabled,
}: {
  current: string; selected: string; onSelect: (s: PackageStatus) => void; disabled: boolean;
}) {
  const allowed = nextStatusOptions(current);
  const isDelivered = current === 'delivered';

  return (
    <div className="space-y-3">
      {/* Main flow */}
      <div className="relative">
        {/* connecting line */}
        <div className="absolute left-5 top-5 bottom-5 w-0.5 bg-slate-200 dark:bg-slate-700 z-0" />
        <div className="space-y-2 relative z-10">
          {MAIN_FLOW.map((s, i) => {
            const Icon = STATUS_ICONS[s] ?? Package;
            const isCurrent = s === current;
            const isSelected = s === selected;
            const isReachable = allowed.includes(s) || isCurrent;
            const isPast = MAIN_FLOW.indexOf(current as PackageStatus) > i && !isCurrent;

            let ringClass = 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-400';
            if (isSelected && !isCurrent) ringClass = 'border-indigo-600 bg-indigo-600 text-white shadow-md shadow-indigo-500/30';
            else if (isCurrent) ringClass = 'border-emerald-500 bg-emerald-500 text-white shadow-md shadow-emerald-500/30';
            else if (isPast) ringClass = 'border-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400';

            return (
              <button
                key={s}
                type="button"
                disabled={disabled || isDelivered || !isReachable || isCurrent}
                onClick={() => isReachable && !isCurrent && onSelect(s)}
                className={`w-full flex items-center gap-3 p-2.5 rounded-xl text-left transition-all
                  ${isSelected && !isCurrent ? 'bg-indigo-50 dark:bg-indigo-950/30 ring-2 ring-indigo-500/40' : ''}
                  ${isCurrent ? 'bg-emerald-50 dark:bg-emerald-950/20' : ''}
                  ${isReachable && !isCurrent && !isDelivered ? 'hover:bg-slate-50 dark:hover:bg-slate-800/60 cursor-pointer' : 'cursor-default'}
                `}
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 border-2 transition-all ${ringClass}`}>
                  {isPast && !isCurrent ? <CheckCircle2 className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-sm font-semibold ${isCurrent ? 'text-emerald-700 dark:text-emerald-400' : isSelected ? 'text-indigo-700 dark:text-indigo-300' : 'text-slate-700 dark:text-slate-300'}`}>
                      {formatStatus(s)}
                    </span>
                    {isCurrent && (
                      <span className="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400">
                        Current
                      </span>
                    )}
                    {isSelected && !isCurrent && (
                      <span className="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300">
                        Selected
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{STATUS_DESCRIPTIONS[s]}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Exception off-ramp */}
      {current !== 'delivered' && current !== 'exception' && (
        <div className="pt-2 border-t border-dashed border-slate-200 dark:border-slate-700">
          <button
            type="button"
            disabled={disabled}
            onClick={() => onSelect('exception')}
            className={`w-full flex items-center gap-3 p-2.5 rounded-xl text-left transition-all
              ${'exception' === selected ? 'bg-red-50 dark:bg-red-950/20 ring-2 ring-red-400/40' : 'hover:bg-red-50/60 dark:hover:bg-red-950/10'}
              cursor-pointer`}
          >
            <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 border-2 transition-all ${
              'exception' === selected
                ? 'border-red-500 bg-red-500 text-white shadow-md shadow-red-500/30'
                : 'border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/30 text-red-500'
            }`}>
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className={`text-sm font-semibold ${'exception' === selected ? 'text-red-700 dark:text-red-400' : 'text-red-600 dark:text-red-400'}`}>
                  Exception / Delayed
                </span>
                {'exception' === selected && (
                  <span className="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400">
                    Selected
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Flag this shipment as delayed or problematic</p>
            </div>
          </button>
        </div>
      )}

      {/* Exception → recover */}
      {current === 'exception' && (
        <div className="pt-2 border-t border-dashed border-slate-200 dark:border-slate-700">
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-2 px-1">Resolve exception — move back into the flow:</p>
          <div className="flex flex-wrap gap-2">
            {nextStatusOptions(current).map(s => {
              if (s === 'exception') return null;
              const Icon = STATUS_ICONS[s] ?? Package;
              return (
                <button
                  key={s}
                  type="button"
                  disabled={disabled}
                  onClick={() => onSelect(s)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all
                    ${selected === s
                      ? 'bg-indigo-600 border-indigo-600 text-white shadow-sm'
                      : 'border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/30'
                    }`}
                >
                  <Icon className="w-3 h-3" /> {formatStatus(s)}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {isDelivered && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/50">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <p className="text-xs text-emerald-700 dark:text-emerald-400 font-medium">
            This package has been delivered. No further status changes are possible.
          </p>
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────── PackageDetailPanel ── */

function PackageDetailPanel({ pkg, onClose }: { pkg: PackageType; onClose: () => void }) {
  const { data: rawEvents, isLoading } = useQuery<TrackingEvent[]>({
    queryKey: [`/api/packages/${pkg.id}/events`],
  });
  const events = Array.isArray(rawEvents) ? rawEvents : [];

  return (
    <div className="border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50">
      <div className="p-5 sm:p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left: full package info */}
        <div className="space-y-4">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Shipment Details</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {pkg.weight && (
              <InfoRow label="Weight">{pkg.weight} kg</InfoRow>
            )}
            {pkg.dimensions && (
              <InfoRow label="Dimensions">{pkg.dimensions}</InfoRow>
            )}
            {pkg.shipping_cost && (
              <InfoRow label="Shipping Cost">{formatCurrency(pkg.shipping_cost)}</InfoRow>
            )}
            {pkg.payment_status && (
              <InfoRow label="Payment">
                <span className={`capitalize font-semibold ${pkg.payment_status === 'paid' ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>
                  {pkg.payment_status}
                </span>
              </InfoRow>
            )}
            {pkg.estimated_delivery && (
              <InfoRow label="Est. Delivery">
                {new Date(pkg.estimated_delivery).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
              </InfoRow>
            )}
            {pkg.actual_delivery && (
              <InfoRow label="Delivered On">
                {new Date(pkg.actual_delivery).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
              </InfoRow>
            )}
            {pkg.sender_email && (
              <InfoRow label="Sender Email">{pkg.sender_email}</InfoRow>
            )}
            {pkg.sender_phone && (
              <InfoRow label="Sender Phone">{pkg.sender_phone}</InfoRow>
            )}
            {pkg.recipient_email && (
              <InfoRow label="Recipient Email">{pkg.recipient_email}</InfoRow>
            )}
            {pkg.recipient_phone && (
              <InfoRow label="Recipient Phone">{pkg.recipient_phone}</InfoRow>
            )}
          </div>
          {pkg.package_description && (
            <div className="p-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
              <p className="text-[10px] uppercase tracking-wider font-semibold text-slate-500 mb-1">Description</p>
              <p className="text-sm text-slate-700 dark:text-slate-300">{pkg.package_description}</p>
            </div>
          )}
          <InfoRow label="Created">{new Date(pkg.created_at).toLocaleString()}</InfoRow>
        </div>

        {/* Right: tracking history */}
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-4">
            Tracking History
          </h4>
          {isLoading ? (
            <div className="space-y-3">
              {[1,2,3].map(i => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}
            </div>
          ) : events.length === 0 ? (
            <div className="text-center py-8 text-slate-400 dark:text-slate-600">
              <Clock className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p className="text-sm">No tracking events yet</p>
            </div>
          ) : (
            <div className="relative">
              <div className="absolute left-4 top-4 bottom-4 w-0.5 bg-slate-200 dark:bg-slate-700" />
              <div className="space-y-3">
                {events.map((ev, i) => {
                  const Icon = STATUS_ICONS[ev.status] ?? Package;
                  const isFirst = i === 0;
                  return (
                    <div key={ev.id} className="flex gap-3 relative">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 border-2 z-10 ${
                        isFirst
                          ? 'bg-indigo-600 border-indigo-600 text-white shadow-sm'
                          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-400'
                      }`}>
                        <Icon className="w-3.5 h-3.5" />
                      </div>
                      <div className="flex-1 min-w-0 pb-3">
                        <div className="flex items-start justify-between gap-2 flex-wrap">
                          <p className={`text-sm font-semibold ${isFirst ? 'text-slate-900 dark:text-white' : 'text-slate-700 dark:text-slate-300'}`}>
                            {formatStatus(ev.status)}
                          </p>
                          <p className="text-[11px] text-slate-400 whitespace-nowrap">{timeAgo(ev.timestamp)}</p>
                        </div>
                        {ev.location && (
                          <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
                            <MapPin className="w-3 h-3" />{ev.location}
                          </p>
                        )}
                        {ev.description && (
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{ev.description}</p>
                        )}
                        <p className="text-[11px] text-slate-400 mt-1">{new Date(ev.timestamp).toLocaleString()}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function InfoRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wider font-semibold text-slate-500 dark:text-slate-400 mb-0.5">{label}</p>
      <p className="text-sm text-slate-800 dark:text-slate-200">{children}</p>
    </div>
  );
}

/* ─────────────────────────────────────────── Main component ── */

const ALL_STATUSES = ['order_placed','packed','in_transit','arrived_at_hub','out_for_delivery','delivered','exception'] as const;

export default function PackageManagementClient() {
  const { toast } = useToast();
  const qc = useQueryClient();

  const [showCreate, setShowCreate] = useState(false);
  const [showStatus, setShowStatus] = useState(false);
  const [createdPkg, setCreatedPkg] = useState<PackageType | null>(null);
  const [selectedPkg, setSelectedPkg] = useState<PackageType | null>(null);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [statusForm, setStatusForm] = useState({ status: '', location: '', description: '' });
  const [form, setForm] = useState(EMPTY_FORM);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const trackingUrlFor = (id: string) =>
    typeof window === 'undefined' ? `/track/${id}` : `${window.location.origin}/track/${id}`;

  const copy = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({ title: 'Copied', description: `${label} copied to clipboard.` });
    } catch {
      toast({ title: 'Copy failed', description: 'Please copy it manually.', variant: 'destructive' });
    }
  };

  const buildShareEmail = (pkg: PackageType) => {
    const link = trackingUrlFor(pkg.tracking_id);
    const subject = encodeURIComponent(`Your Shipnix Express tracking ID: ${pkg.tracking_id}`);
    const body = encodeURIComponent(
      `Hi ${pkg.recipient_name || 'there'},\n\nYour shipment from ${pkg.sender_name} is on its way.\n\n` +
      `Tracking ID: ${pkg.tracking_id}\nTrack it live: ${link}\n\nThanks,\nShipnix Express`
    );
    return `mailto:${pkg.recipient_email ?? ''}?subject=${subject}&body=${body}`;
  };

  const { data: packagesRaw, isLoading, refetch } = useQuery<PackageType[]>({
    queryKey: ['/api/packages'],
  });
  const packages = Array.isArray(packagesRaw) ? packagesRaw : [];

  const filtered = useMemo(() => {
    let list = packages;
    if (filterStatus !== 'all') list = list.filter(p => p.current_status === filterStatus);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(p =>
        p.tracking_id.toLowerCase().includes(q) ||
        p.sender_name.toLowerCase().includes(q) ||
        p.recipient_name.toLowerCase().includes(q) ||
        (p.sender_address ?? '').toLowerCase().includes(q) ||
        (p.recipient_address ?? '').toLowerCase().includes(q)
      );
    }
    return list;
  }, [packages, search, filterStatus]);

  const createMutation = useMutation({
    mutationFn: (data: any) => apiRequest('POST', '/api/packages', data),
    onSuccess: (pkg: PackageType) => {
      qc.invalidateQueries({ queryKey: ['/api/packages'] });
      setShowCreate(false);
      setForm(EMPTY_FORM);
      setCreatedPkg(pkg);
    },
    onError: (e: any) => toast({ title: 'Error creating package', description: e.message, variant: 'destructive' }),
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, data }: any) => apiRequest('PATCH', `/api/packages/${id}/status`, data),
    onSuccess: (updated: PackageType) => {
      toast({ title: 'Status updated', description: `Package moved to ${formatStatus(updated.current_status)}.` });
      qc.invalidateQueries({ queryKey: ['/api/packages'] });
      qc.invalidateQueries({ queryKey: [`/api/packages/${updated.id}/events`] });
      setShowStatus(false);
    },
    onError: (e: any) => toast({ title: 'Update failed', description: e.message, variant: 'destructive' }),
  });

  const openStatusEditor = (pkg: PackageType) => {
    setSelectedPkg(pkg);
    setStatusForm({ status: pkg.current_status, location: pkg.current_location ?? '', description: '' });
    setShowStatus(true);
  };

  const handleCreate = () => {
    if (!form.sender_name || !form.sender_address) {
      toast({ title: 'Validation error', description: 'Sender name and pickup address are required.', variant: 'destructive' });
      return;
    }
    if (!form.recipient_name || !form.recipient_street || !form.recipient_city || !form.recipient_country) {
      toast({ title: 'Validation error', description: 'Recipient name, street, city and country are required.', variant: 'destructive' });
      return;
    }
    // Compose structured recipient address into a single line
    const recipientAddress = [
      form.recipient_street,
      form.recipient_apt,
      form.recipient_city,
      form.recipient_state,
      form.recipient_zip,
      form.recipient_country,
    ].filter(Boolean).join(', ');

    const { recipient_street, recipient_apt, recipient_city, recipient_state, recipient_zip, recipient_country, package_type, current_status, ...rest } = form;

    createMutation.mutate({
      ...rest,
      recipient_address: recipientAddress,
      current_status: current_status || 'order_placed',
    });
  };

  const handleStatusUpdate = () => {
    if (!selectedPkg || !statusForm.status || statusForm.status === selectedPkg.current_status) return;
    statusMutation.mutate({ id: selectedPkg.id, data: statusForm });
  };

  const setF = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const p of packages) counts[p.current_status] = (counts[p.current_status] ?? 0) + 1;
    return counts;
  }, [packages]);

  const inTransit = (statusCounts.in_transit ?? 0) + (statusCounts.out_for_delivery ?? 0);
  const delivered = statusCounts.delivered ?? 0;
  const exceptions = statusCounts.exception ?? 0;

  const hasChangedStatus = selectedPkg && statusForm.status && statusForm.status !== selectedPkg.current_status;

  return (
    <div className="page-shell">
      {/* ── Header ── */}
      <header className="page-header">
        <div>
          <p className="page-eyebrow">Operations</p>
          <h1 className="page-title" data-testid="text-page-title">Package Management</h1>
          <p className="page-subtitle">Create shipments, manage statuses, and track deliveries in real time.</p>
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          <span className="meta-chip" data-testid="chip-total"><Package className="w-3 h-3" /> {packages.length} total</span>
          <span className="meta-chip"><span className="w-1.5 h-1.5 rounded-full bg-indigo-500" /> {inTransit} in transit</span>
          <span className="meta-chip"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> {delivered} delivered</span>
          {exceptions > 0 && (
            <span className="meta-chip text-red-700 dark:text-red-400 border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/30">
              <AlertTriangle className="w-3 h-3" /> {exceptions} exception{exceptions > 1 ? 's' : ''}
            </span>
          )}
          <Button
            variant="outline"
            size="sm"
            className="h-8 rounded-lg"
            onClick={() => refetch()}
          >
            <RefreshCw className="w-3.5 h-3.5 mr-1.5" />Refresh
          </Button>
          <Dialog open={showCreate} onOpenChange={setShowCreate}>
            <DialogTrigger asChild>
              <Button
                className="h-10 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-semibold shadow-md shadow-indigo-500/25 px-4"
                data-testid="button-create-package"
              >
                <Plus className="w-4 h-4 mr-1.5" />New Package
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 p-0">
              <DialogHeader className="p-6 pb-4 border-b border-slate-200 dark:border-slate-800 sticky top-0 bg-white dark:bg-slate-900 z-10">
                <DialogTitle className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center">
                    <PackageOpen className="w-4 h-4 text-white" />
                  </div>
                  Create New Shipment
                </DialogTitle>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                  A unique tracking ID and QR code will be generated automatically.
                </p>
              </DialogHeader>

              <div className="p-6 space-y-0">

                {/* ── Section 1: Sender ── */}
                <FormSection step={1} title="Sender (Pickup)" icon={User}>
                  <div className="form-grid">
                    <Field label="Full Name *">
                      <Input value={form.sender_name} onChange={setF('sender_name')} placeholder="Jane Doe" data-testid="input-sender-name" />
                    </Field>
                    <Field label="Phone Number">
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                        <Input value={form.sender_phone} onChange={setF('sender_phone')} placeholder="+1 (555) 000-0000" className="pl-9" data-testid="input-sender-phone" />
                      </div>
                    </Field>
                    <Field label="Pickup Address *" full>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-3 w-3.5 h-3.5 text-slate-400" />
                        <Textarea value={form.sender_address} onChange={setF('sender_address')} rows={2} placeholder="Full pickup address including city, state and postal code" className="pl-9 resize-none" data-testid="input-sender-address" />
                      </div>
                    </Field>
                  </div>
                </FormSection>

                {/* ── Section 2: Recipient ── */}
                <FormSection step={2} title="Recipient & Delivery Address" icon={MapPin}>
                  {/* Contact info */}
                  <div className="form-grid mb-4">
                    <Field label="Full Name *">
                      <Input value={form.recipient_name} onChange={setF('recipient_name')} placeholder="John Smith" data-testid="input-recipient-name" />
                    </Field>
                    <Field label="Email Address *">
                      <Input type="email" value={form.recipient_email} onChange={setF('recipient_email')} placeholder="john@example.com" data-testid="input-recipient-email" />
                    </Field>
                    <Field label="Phone Number *" full>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                        <Input value={form.recipient_phone} onChange={setF('recipient_phone')} placeholder="+1 (555) 000-0000" className="pl-9" data-testid="input-recipient-phone" />
                      </div>
                    </Field>
                  </div>

                  {/* Structured address */}
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-3">
                    <p className="text-[10px] uppercase tracking-wider font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                      <Building2 className="w-3 h-3" /> Delivery Address
                    </p>
                    <div className="form-grid">
                      <Field label="Street Address *" full>
                        <Input value={form.recipient_street} onChange={setF('recipient_street')} placeholder="123 Main Street" data-testid="input-recipient-street" />
                      </Field>
                      <Field label="Apt / Suite / Floor">
                        <Input value={form.recipient_apt} onChange={setF('recipient_apt')} placeholder="Apt 4B (optional)" data-testid="input-recipient-apt" />
                      </Field>
                      <Field label="City *">
                        <Input value={form.recipient_city} onChange={setF('recipient_city')} placeholder="New York" data-testid="input-recipient-city" />
                      </Field>
                      <Field label="State / Province">
                        <Input value={form.recipient_state} onChange={setF('recipient_state')} placeholder="NY" data-testid="input-recipient-state" />
                      </Field>
                      <Field label="Postal Code">
                        <Input value={form.recipient_zip} onChange={setF('recipient_zip')} placeholder="10001" data-testid="input-recipient-zip" />
                      </Field>
                      <Field label="Country *">
                        <div className="relative">
                          <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                          <Input value={form.recipient_country} onChange={setF('recipient_country')} placeholder="United States" className="pl-9" data-testid="input-recipient-country" />
                        </div>
                      </Field>
                    </div>
                  </div>

                  {/* Delivery options */}
                  <div className="mt-4 space-y-3">
                    <Field label="Delivery Instructions" full>
                      <div className="relative">
                        <PenLine className="absolute left-3 top-3 w-3.5 h-3.5 text-slate-400" />
                        <Textarea
                          value={form.delivery_instructions}
                          onChange={setF('delivery_instructions')}
                          rows={2}
                          placeholder="e.g. Leave with doorman, ring buzzer #42, do not leave without signature…"
                          className="pl-9 resize-none"
                          data-testid="input-delivery-instructions"
                        />
                      </div>
                    </Field>
                    <label className="flex items-start gap-3 cursor-pointer p-3 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors">
                      <div className="relative flex-shrink-0 mt-0.5">
                        <input
                          type="checkbox"
                          checked={form.signature_required}
                          onChange={e => setForm(f => ({ ...f, signature_required: e.target.checked }))}
                          className="sr-only peer"
                          data-testid="input-signature-required"
                        />
                        <div className="w-5 h-5 rounded border-2 border-slate-300 dark:border-slate-600 peer-checked:bg-indigo-600 peer-checked:border-indigo-600 transition-all flex items-center justify-center">
                          {form.signature_required && <CheckCircle2 className="w-3 h-3 text-white" />}
                        </div>
                      </div>
                      <div>
                        <span className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                          <ShieldCheck className="w-3.5 h-3.5 text-indigo-500" /> Signature Required
                        </span>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                          Recipient must sign upon delivery. Suitable for high-value or sensitive items.
                        </p>
                      </div>
                    </label>
                  </div>
                </FormSection>

                {/* ── Section 3: Package ── */}
                <FormSection step={3} title="Package Details" icon={Package}>
                  <div className="form-grid">
                    <Field label="Package Type" full>
                      <Select value={form.package_type} onValueChange={v => setForm(f => ({ ...f, package_type: v }))}>
                        <SelectTrigger className="h-10 rounded-lg border-slate-300 dark:border-slate-700" data-testid="select-package-type">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="parcel">📦 Parcel / Box</SelectItem>
                          <SelectItem value="envelope">✉️ Document / Envelope</SelectItem>
                          <SelectItem value="pallet">🪵 Pallet / Freight</SelectItem>
                          <SelectItem value="fragile">⚠️ Fragile Item</SelectItem>
                          <SelectItem value="oversized">📐 Oversized</SelectItem>
                          <SelectItem value="perishable">🌡️ Perishable / Cold Chain</SelectItem>
                        </SelectContent>
                      </Select>
                    </Field>
                    <Field label="Contents / Description">
                      <Input value={form.package_description} onChange={setF('package_description')} placeholder="e.g. Laptop, clothing, documents" data-testid="input-description" />
                    </Field>
                    <Field label="Weight (kg)">
                      <div className="relative">
                        <Input type="number" min="0" step="0.1" value={form.weight} onChange={setF('weight')} placeholder="2.5" data-testid="input-weight" />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-medium">kg</span>
                      </div>
                    </Field>
                    <Field label="Dimensions (cm)">
                      <Input value={form.dimensions} onChange={setF('dimensions')} placeholder="L × W × H" data-testid="input-dimensions" />
                    </Field>
                  </div>
                </FormSection>

                {/* ── Section 4: Shipping & Payment ── */}
                <FormSection step={4} title="Shipping & Payment" icon={CreditCard} last>
                  <div className="form-grid">
                    <Field label="Shipping Cost ($)">
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                        <Input type="number" min="0" step="0.01" value={form.shipping_cost} onChange={setF('shipping_cost')} placeholder="29.99" className="pl-9" data-testid="input-shipping-cost" />
                      </div>
                    </Field>
                    <Field label="Payment Method">
                      <Select value={form.payment_method} onValueChange={v => setForm(f => ({ ...f, payment_method: v }))}>
                        <SelectTrigger className="h-10 rounded-lg border-slate-300 dark:border-slate-700" data-testid="select-payment-method">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="card">💳 Credit / Debit Card</SelectItem>
                          <SelectItem value="cash">💵 Cash on Delivery</SelectItem>
                          <SelectItem value="bank_transfer">🏦 Bank Transfer</SelectItem>
                          <SelectItem value="invoice">🧾 Invoice (Net 30)</SelectItem>
                        </SelectContent>
                      </Select>
                    </Field>
                    <Field label="Payment Status">
                      <Select value={form.payment_status} onValueChange={v => setForm(f => ({ ...f, payment_status: v }))}>
                        <SelectTrigger className="h-10 rounded-lg border-slate-300 dark:border-slate-700" data-testid="select-payment-status">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="paid">✅ Paid</SelectItem>
                          <SelectItem value="pending">⏳ Pending</SelectItem>
                          <SelectItem value="overdue">🚨 Overdue</SelectItem>
                        </SelectContent>
                      </Select>
                    </Field>
                    <Field label="Estimated Delivery">
                      <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                        <Input type="date" value={form.estimated_delivery} onChange={setF('estimated_delivery')} className="pl-9" data-testid="input-estimated-delivery" />
                      </div>
                    </Field>
                    <Field label="Initial Status">
                      <Select value={form.current_status} onValueChange={v => setForm(f => ({ ...f, current_status: v }))}>
                        <SelectTrigger className="h-10 rounded-lg border-slate-300 dark:border-slate-700" data-testid="select-initial-status">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {MAIN_FLOW.map(s => (
                            <SelectItem key={s} value={s}>{formatStatus(s)}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </Field>
                    <Field label="Current Location">
                      <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                        <Input value={form.current_location} onChange={setF('current_location')} placeholder="e.g. Los Angeles Hub" className="pl-9" data-testid="input-current-location" />
                      </div>
                    </Field>
                  </div>
                </FormSection>

                <div className="flex gap-3 pt-5 border-t border-slate-200 dark:border-slate-800">
                  <Button variant="outline" onClick={() => { setShowCreate(false); setForm(EMPTY_FORM); }} className="rounded-xl h-11">Cancel</Button>
                  <Button
                    onClick={handleCreate}
                    className="flex-1 h-11 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-semibold shadow-md shadow-indigo-500/25"
                    disabled={createMutation.isPending}
                    data-testid="button-submit-package"
                  >
                    {createMutation.isPending ? 'Creating…' : 'Create Shipment & Generate Tracking ID'}
                    {!createMutation.isPending && <ArrowRight className="w-4 h-4 ml-2" />}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </header>

      {/* ── Search + Filter bar ── */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by tracking ID, sender, or recipient…"
            className="pl-9 h-10 rounded-xl border-slate-300 dark:border-slate-700"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="h-10 w-full sm:w-52 rounded-xl border-slate-300 dark:border-slate-700">
            <Filter className="w-3.5 h-3.5 mr-2 text-slate-400" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses ({packages.length})</SelectItem>
            {ALL_STATUSES.map(s => (
              statusCounts[s] ? (
                <SelectItem key={s} value={s}>
                  {formatStatus(s)} ({statusCounts[s]})
                </SelectItem>
              ) : null
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* ── Package list ── */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-36 w-full rounded-2xl" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="surface-card p-12 text-center">
          <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
            <Package className="w-6 h-6 text-slate-400" />
          </div>
          <h3 className="font-semibold text-slate-900 dark:text-white mb-1">
            {packages.length === 0 ? 'No packages yet' : 'No packages match your search'}
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {packages.length === 0
              ? 'Create your first package using the button above.'
              : 'Try adjusting your search or filter.'}
          </p>
          {(search || filterStatus !== 'all') && (
            <Button variant="outline" className="mt-4 rounded-xl" onClick={() => { setSearch(''); setFilterStatus('all'); }}>
              Clear filters
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((pkg) => {
            const isExpanded = expandedId === pkg.id;
            const isTerminal = PACKAGE_TERMINAL_STATUSES.includes(pkg.current_status as PackageStatus);
            return (
              <article
                key={pkg.id}
                className="surface-card overflow-hidden transition-shadow hover:shadow-md"
                data-testid={`package-${pkg.id}`}
              >
                {/* Main row */}
                <div className="p-5 sm:p-6 flex flex-col lg:flex-row lg:items-center gap-5">
                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-3 flex-wrap">
                      <span className="text-xs font-mono font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 px-2 py-1 rounded-md">
                        {pkg.tracking_id}
                      </span>
                      <span className={`status-pill ${STATUS_COLORS[pkg.current_status] ?? 'bg-slate-100 text-slate-800'}`}>
                        {formatStatus(pkg.current_status)}
                      </span>
                      {pkg.shipping_cost && (
                        <span className="meta-chip"><DollarSign className="w-3 h-3" /> {formatCurrency(pkg.shipping_cost)}</span>
                      )}
                      {pkg.current_status === 'exception' && (
                        <span className="text-xs text-red-600 dark:text-red-400 font-semibold flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" /> Needs attention
                        </span>
                      )}
                    </div>

                    <div className="grid sm:grid-cols-2 gap-3 mb-2">
                      <div className="flex items-start gap-2">
                        <User className="w-3.5 h-3.5 text-slate-400 mt-0.5 flex-shrink-0" />
                        <div className="min-w-0">
                          <p className="text-[10px] uppercase tracking-wider font-semibold text-slate-500">From</p>
                          <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{pkg.sender_name}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{pkg.sender_address}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 mt-0.5 flex-shrink-0" />
                        <div className="min-w-0">
                          <p className="text-[10px] uppercase tracking-wider font-semibold text-slate-500">To</p>
                          <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{pkg.recipient_name}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{pkg.recipient_address}</p>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 flex-wrap text-xs text-slate-500 dark:text-slate-400">
                      {pkg.current_location && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-indigo-500" />
                          <span className="font-medium text-slate-700 dark:text-slate-300">{pkg.current_location}</span>
                        </span>
                      )}
                      {pkg.estimated_delivery && (
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          Est. {new Date(pkg.estimated_delivery).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Hash className="w-3 h-3" />
                        {timeAgo(pkg.updated_at)}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-row lg:flex-col items-stretch gap-2 lg:w-40 flex-shrink-0">
                    {pkg.qr_code && (
                      <div className="hidden sm:block lg:self-center p-1.5 bg-white border border-slate-200 dark:border-slate-700 rounded-lg">
                        <img src={pkg.qr_code} alt="QR" className="w-14 h-14 lg:w-16 lg:h-16" />
                      </div>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      className="rounded-lg h-9 flex-1 lg:flex-none border-slate-300 dark:border-slate-700 text-xs"
                      onClick={() => copy(trackingUrlFor(pkg.tracking_id), 'Tracking link')}
                      data-testid={`button-copy-link-${pkg.id}`}
                    >
                      <Link2 className="w-3.5 h-3.5 mr-1.5" />Copy Link
                    </Button>
                    <Button
                      size="sm"
                      className={`rounded-lg h-9 flex-1 lg:flex-none text-xs ${
                        isTerminal
                          ? 'bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400 cursor-not-allowed'
                          : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                      }`}
                      onClick={() => !isTerminal && openStatusEditor(pkg)}
                      disabled={isTerminal}
                      data-testid={`button-update-status-${pkg.id}`}
                    >
                      <Truck className="w-3.5 h-3.5 mr-1.5" />
                      {isTerminal ? 'Delivered' : 'Update Status'}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="rounded-lg h-9 flex-1 lg:flex-none text-xs text-slate-500 dark:text-slate-400"
                      onClick={() => setExpandedId(isExpanded ? null : pkg.id)}
                      data-testid={`button-expand-${pkg.id}`}
                    >
                      {isExpanded ? <ChevronUp className="w-3.5 h-3.5 mr-1.5" /> : <ChevronDown className="w-3.5 h-3.5 mr-1.5" />}
                      {isExpanded ? 'Collapse' : 'Details'}
                    </Button>
                  </div>
                </div>

                {/* Expandable detail */}
                {isExpanded && (
                  <PackageDetailPanel pkg={pkg} onClose={() => setExpandedId(null)} />
                )}
              </article>
            );
          })}
        </div>
      )}

      {/* ── Created package success modal ── */}
      <Dialog open={!!createdPkg} onOpenChange={(open) => !open && setCreatedPkg(null)}>
        <DialogContent className="max-w-lg bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800" data-testid="dialog-tracking-created">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-slate-900 dark:text-white">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              Package created successfully
            </DialogTitle>
            <p className="text-sm text-slate-500 dark:text-slate-400">Share this tracking ID with the recipient.</p>
          </DialogHeader>
          {createdPkg && (
            <div className="space-y-4 mt-2">
              <div className="rounded-xl border-2 border-dashed border-emerald-200 dark:border-emerald-900/50 bg-emerald-50/50 dark:bg-emerald-950/20 p-5 text-center">
                <p className="text-[10px] uppercase tracking-[0.18em] text-emerald-700 dark:text-emerald-400 font-semibold mb-1">Tracking ID</p>
                <p className="text-2xl font-mono font-bold text-emerald-700 dark:text-emerald-400 break-all" data-testid="text-new-tracking-id">
                  {createdPkg.tracking_id}
                </p>
                {createdPkg.recipient_name && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                    For <span className="font-semibold text-slate-700 dark:text-slate-300">{createdPkg.recipient_name}</span>
                    {createdPkg.recipient_email && ` · ${createdPkg.recipient_email}`}
                  </p>
                )}
              </div>
              <div className="form-field">
                <Label className="form-label">Public tracking link</Label>
                <div className="flex gap-2">
                  <Input readOnly value={trackingUrlFor(createdPkg.tracking_id)} className="font-mono text-xs" onFocus={e => e.currentTarget.select()} data-testid="input-tracking-link" />
                  <Button type="button" variant="outline" size="icon" className="flex-shrink-0 h-11 w-11 rounded-lg border-slate-300 dark:border-slate-700" onClick={() => copy(trackingUrlFor(createdPkg.tracking_id), 'Tracking link')}>
                    <Link2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" className="rounded-lg h-10 border-slate-300 dark:border-slate-700" onClick={() => copy(createdPkg.tracking_id, 'Tracking ID')} data-testid="button-copy-tracking-id">
                  <Copy className="w-4 h-4 mr-2" />Copy ID
                </Button>
                <a href={buildShareEmail(createdPkg)} className="block">
                  <Button variant="outline" className="w-full rounded-lg h-10 border-slate-300 dark:border-slate-700" data-testid="button-share-email">
                    <Mail className="w-4 h-4 mr-2" />Email Recipient
                  </Button>
                </a>
              </div>
              <div className="flex gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                <Button variant="ghost" className="flex-1 rounded-lg h-10" onClick={() => { openStatusEditor(createdPkg); setCreatedPkg(null); }} data-testid="button-update-status-now">
                  <Truck className="w-4 h-4 mr-2" />Update Status
                </Button>
                <Button className="flex-1 rounded-lg h-10 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white" onClick={() => setCreatedPkg(null)} data-testid="button-done">
                  Done
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ── Status update dialog ── */}
      <Dialog open={showStatus} onOpenChange={open => { if (!open) setShowStatus(false); }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 p-0">
          <DialogHeader className="p-6 pb-4 border-b border-slate-200 dark:border-slate-800">
            <DialogTitle className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Truck className="w-5 h-5 text-indigo-600" />
              Update Shipment Status
            </DialogTitle>
            {selectedPkg && (
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <span className="text-xs font-mono text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 px-2 py-0.5 rounded">
                  {selectedPkg.tracking_id}
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  {selectedPkg.recipient_name} · {selectedPkg.recipient_address.split(',')[0]}
                </span>
              </div>
            )}
          </DialogHeader>

          {selectedPkg && (
            <div className="p-6 space-y-6">
              {/* Visual status stepper */}
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">
                  Select New Status
                </p>
                <StatusStepper
                  current={selectedPkg.current_status}
                  selected={statusForm.status}
                  onSelect={s => setStatusForm(f => ({ ...f, status: s }))}
                  disabled={statusMutation.isPending}
                />
              </div>

              {/* Location + notes — only shown when a new status is selected */}
              {hasChangedStatus && (
                <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-800">
                  <div className="form-field">
                    <Label className="form-label flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-indigo-500" />Current Location
                    </Label>
                    <Input
                      value={statusForm.location}
                      onChange={e => setStatusForm(f => ({ ...f, location: e.target.value }))}
                      placeholder="e.g. New York Distribution Center"
                      className="h-10 rounded-lg border-slate-300 dark:border-slate-700"
                      data-testid="input-status-location"
                    />
                  </div>
                  <div className="form-field">
                    <Label className="form-label">Notes <span className="font-normal text-slate-400">(optional)</span></Label>
                    <Textarea
                      value={statusForm.description}
                      onChange={e => setStatusForm(f => ({ ...f, description: e.target.value }))}
                      rows={2}
                      placeholder="e.g. Delayed due to weather conditions"
                      className="rounded-lg border-slate-300 dark:border-slate-700 resize-none"
                      data-testid="input-status-notes"
                    />
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <Button variant="outline" onClick={() => setShowStatus(false)} className="rounded-xl h-11 flex-shrink-0">
                  Cancel
                </Button>
                <Button
                  onClick={handleStatusUpdate}
                  disabled={!hasChangedStatus || statusMutation.isPending}
                  className="flex-1 h-11 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                  data-testid="button-submit-status"
                >
                  {statusMutation.isPending
                    ? 'Updating…'
                    : hasChangedStatus
                      ? `Move to ${formatStatus(statusForm.status)}`
                      : 'Select a new status above'
                  }
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ─────────────────────────────────────────────── sub-components ── */

function FormSection({ step, title, icon: Icon, children, last }: { step: number; title: string; icon: any; children: React.ReactNode; last?: boolean }) {
  return (
    <div className={`form-section ${last ? 'border-b-0 pb-0' : ''}`}>
      <div className="form-section-title">
        <span className="form-section-step">{step}</span>
        <div className="flex items-center gap-2">
          <Icon className="w-4 h-4 text-indigo-600" />
          <h3 className="form-section-heading">{title}</h3>
        </div>
      </div>
      {children}
    </div>
  );
}

function Field({ label, children, full }: { label: string; children: React.ReactNode; full?: boolean }) {
  return (
    <div className={`form-field ${full ? 'form-grid-full' : ''}`}>
      <Label className="form-label">{label}</Label>
      {children}
    </div>
  );
}
