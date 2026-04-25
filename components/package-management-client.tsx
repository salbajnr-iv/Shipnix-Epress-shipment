'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Package, Plus, MapPin, Truck, Copy, Mail, CheckCircle2, Link2, User, DollarSign, ArrowRight,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  type Package as PackageType,
  type PackageStatus,
  PACKAGE_STATUS_TRANSITIONS,
  PACKAGE_TERMINAL_STATUSES,
} from '@/lib/types';
import { formatCurrency, formatStatus } from '@/lib/utils';

const STATUS_COLORS: Record<string, string> = {
  order_placed: 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900/50',
  packed: 'bg-cyan-100 text-cyan-800 border-cyan-200 dark:bg-cyan-950/40 dark:text-cyan-300 dark:border-cyan-900/50',
  in_transit: 'bg-indigo-100 text-indigo-800 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-900/50',
  arrived_at_hub: 'bg-sky-100 text-sky-800 border-sky-200 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-900/50',
  out_for_delivery: 'bg-violet-100 text-violet-800 border-violet-200 dark:bg-violet-950/40 dark:text-violet-300 dark:border-violet-900/50',
  delivered: 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900/50',
  exception: 'bg-red-100 text-red-800 border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-900/50',
  // Legacy fallbacks for any historical packages still using the old keys.
  pending_payment: 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900/50',
  created: 'bg-slate-100 text-slate-800 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
  picked_up: 'bg-cyan-100 text-cyan-800 border-cyan-200 dark:bg-cyan-950/40 dark:text-cyan-300 dark:border-cyan-900/50',
  failed_delivery: 'bg-red-100 text-red-800 border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-900/50',
  returned: 'bg-slate-100 text-slate-800 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
};

function nextStatusOptions(current: string | undefined): PackageStatus[] {
  if (!current) return [];
  const transitions = PACKAGE_STATUS_TRANSITIONS as Record<string, PackageStatus[]>;
  const allowed = transitions[current] ?? [];
  // Always include the current value so the Select stays controlled, even if
  // the package is sitting on a legacy status that's no longer in the flow.
  const seen = new Set<PackageStatus>();
  const result: PackageStatus[] = [];
  for (const s of [current as PackageStatus, ...allowed]) {
    if (!seen.has(s)) {
      seen.add(s);
      result.push(s);
    }
  }
  return result;
}

const EMPTY_FORM = {
  sender_name: '', sender_address: '', sender_email: '', sender_phone: '',
  recipient_name: '', recipient_address: '', recipient_email: '', recipient_phone: '',
  package_description: '', weight: '', dimensions: '', shipping_cost: '',
  estimated_delivery: '', payment_status: 'paid',
};

export default function PackageManagementClient() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [showStatus, setShowStatus] = useState(false);
  const [createdPkg, setCreatedPkg] = useState<PackageType | null>(null);
  const [selectedPkg, setSelectedPkg] = useState<PackageType | null>(null);
  const [statusForm, setStatusForm] = useState({ status: '', location: '', description: '' });
  const [form, setForm] = useState(EMPTY_FORM);

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
      `Hi ${pkg.recipient_name || 'there'},\n\n` +
      `Your shipment from ${pkg.sender_name} is on its way.\n\n` +
      `Tracking ID: ${pkg.tracking_id}\n` +
      `Track it live: ${link}\n\n` +
      `Thanks,\nShipnix Express`
    );
    const to = pkg.recipient_email ?? '';
    return `mailto:${to}?subject=${subject}&body=${body}`;
  };

  const { data: packagesRaw, isLoading } = useQuery<PackageType[]>({
    queryKey: ['/api/packages'],
  });
  const packages = Array.isArray(packagesRaw) ? packagesRaw : [];

  const createMutation = useMutation({
    mutationFn: (data: any) => apiRequest('POST', '/api/packages', data),
    onSuccess: (pkg: PackageType) => {
      qc.invalidateQueries({ queryKey: ['/api/packages'] });
      setShowCreate(false);
      setForm(EMPTY_FORM);
      setCreatedPkg(pkg);
    },
    onError: (e: any) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, data }: any) => apiRequest('PATCH', `/api/packages/${id}/status`, data),
    onSuccess: () => {
      toast({ title: 'Status Updated' });
      qc.invalidateQueries({ queryKey: ['/api/packages'] });
      setShowStatus(false);
    },
    onError: (e: any) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });

  const handleCreate = () => {
    if (!form.sender_name || !form.sender_address || !form.recipient_name || !form.recipient_address) {
      toast({ title: 'Validation Error', description: 'Sender and recipient name/address are required', variant: 'destructive' });
      return;
    }
    createMutation.mutate(form);
  };

  const handleStatusUpdate = () => {
    if (!selectedPkg || !statusForm.status) return;
    statusMutation.mutate({ id: selectedPkg.id, data: statusForm });
  };

  const setF = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  const inTransit = packages.filter(p => p.current_status === 'in_transit' || p.current_status === 'out_for_delivery').length;
  const delivered = packages.filter(p => p.current_status === 'delivered').length;

  return (
    <div className="page-shell">
      <header className="page-header">
        <div>
          <p className="page-eyebrow">Operations</p>
          <h1 className="page-title" data-testid="text-page-title">Package Management</h1>
          <p className="page-subtitle">Create shipments, generate tracking IDs, and update status in real time.</p>
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          <span className="meta-chip" data-testid="chip-total">
            <Package className="w-3 h-3" /> {packages.length} packages
          </span>
          <span className="meta-chip">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" /> {inTransit} in transit
          </span>
          <span className="meta-chip">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> {delivered} delivered
          </span>
          <Dialog open={showCreate} onOpenChange={setShowCreate}>
            <DialogTrigger asChild>
              <Button
                className="h-10 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-semibold shadow-md shadow-indigo-500/25 px-4"
                data-testid="button-create-package"
              >
                <Plus className="w-4 h-4 mr-1.5" />New Package
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[88vh] overflow-y-auto bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 p-0">
              <DialogHeader className="p-6 pb-4 border-b border-slate-200 dark:border-slate-800">
                <DialogTitle className="text-xl font-bold text-slate-900 dark:text-white">Create New Package</DialogTitle>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                  We'll generate a tracking ID and a public tracking link automatically.
                </p>
              </DialogHeader>
              <div className="p-6">
                <FormSection step={1} title="Sender Details" icon={User}>
                  <div className="form-grid">
                    <Field label="Sender Name *">
                      <Input value={form.sender_name} onChange={setF('sender_name')} placeholder="Jane Doe" data-testid="input-sender-name" />
                    </Field>
                    <Field label="Sender Email">
                      <Input value={form.sender_email} onChange={setF('sender_email')} placeholder="jane@company.com" data-testid="input-sender-email" />
                    </Field>
                    <Field label="Sender Phone" full>
                      <Input value={form.sender_phone} onChange={setF('sender_phone')} placeholder="+1 (555) 000-0000" data-testid="input-sender-phone" />
                    </Field>
                    <Field label="Sender Address *" full>
                      <Textarea value={form.sender_address} onChange={setF('sender_address')} rows={2} placeholder="Street, city, postal code" data-testid="input-sender-address" />
                    </Field>
                  </div>
                </FormSection>

                <FormSection step={2} title="Recipient Details" icon={MapPin}>
                  <div className="form-grid">
                    <Field label="Recipient Name *">
                      <Input value={form.recipient_name} onChange={setF('recipient_name')} placeholder="John Smith" data-testid="input-recipient-name" />
                    </Field>
                    <Field label="Recipient Email">
                      <Input value={form.recipient_email} onChange={setF('recipient_email')} placeholder="john@example.com" data-testid="input-recipient-email" />
                    </Field>
                    <Field label="Recipient Phone" full>
                      <Input value={form.recipient_phone} onChange={setF('recipient_phone')} placeholder="+1 (555) 000-0000" data-testid="input-recipient-phone" />
                    </Field>
                    <Field label="Recipient Address *" full>
                      <Textarea value={form.recipient_address} onChange={setF('recipient_address')} rows={2} placeholder="Street, city, postal code" data-testid="input-recipient-address" />
                    </Field>
                  </div>
                </FormSection>

                <FormSection step={3} title="Package Details" icon={Package}>
                  <div className="form-grid">
                    <Field label="Description" full>
                      <Textarea value={form.package_description} onChange={setF('package_description')} rows={2} placeholder="e.g. Electronics, fragile" data-testid="input-description" />
                    </Field>
                    <Field label="Weight (kg)">
                      <Input type="number" value={form.weight} onChange={setF('weight')} placeholder="2.5" data-testid="input-weight" />
                    </Field>
                    <Field label="Dimensions">
                      <Input value={form.dimensions} onChange={setF('dimensions')} placeholder="L x W x H" data-testid="input-dimensions" />
                    </Field>
                    <Field label="Shipping Cost ($) *">
                      <Input type="number" value={form.shipping_cost} onChange={setF('shipping_cost')} placeholder="29.99" data-testid="input-shipping-cost" />
                    </Field>
                    <Field label="Estimated Delivery">
                      <Input type="date" value={form.estimated_delivery} onChange={setF('estimated_delivery')} data-testid="input-estimated-delivery" />
                    </Field>
                  </div>
                </FormSection>

                <div className="flex gap-3 mt-6 pt-5 border-t border-slate-200 dark:border-slate-800">
                  <Button variant="outline" onClick={() => setShowCreate(false)} className="rounded-xl h-11">Cancel</Button>
                  <Button
                    onClick={handleCreate}
                    className="flex-1 h-11 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-semibold shadow-md shadow-indigo-500/25"
                    disabled={createMutation.isPending}
                    data-testid="button-submit-package"
                  >
                    {createMutation.isPending ? 'Creating…' : 'Create Package & Generate Tracking ID'}
                    {!createMutation.isPending && <ArrowRight className="w-4 h-4 ml-2" />}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </header>

      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-32 w-full rounded-2xl" />
          ))}
        </div>
      ) : packages.length === 0 ? (
        <div className="surface-card p-12 text-center">
          <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
            <Package className="w-6 h-6 text-slate-400" />
          </div>
          <h3 className="font-semibold text-slate-900 dark:text-white mb-1">No packages yet</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Create your first package using the button above.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {packages.map((pkg) => (
            <article
              key={pkg.id}
              className="surface-card overflow-hidden transition-shadow hover:shadow-md"
              data-testid={`package-${pkg.id}`}
            >
              <div className="p-5 sm:p-6 flex flex-col lg:flex-row lg:items-stretch gap-5">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-3 flex-wrap">
                    <span className="text-xs font-mono font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 px-2 py-1 rounded-md">
                      {pkg.tracking_id}
                    </span>
                    <span className={`status-pill ${STATUS_COLORS[pkg.current_status] ?? 'bg-slate-100 text-slate-800'}`}>
                      {formatStatus(pkg.current_status)}
                    </span>
                    {pkg.shipping_cost && (
                      <span className="meta-chip">
                        <DollarSign className="w-3 h-3" /> {formatCurrency(pkg.shipping_cost)}
                      </span>
                    )}
                  </div>

                  <div className="grid sm:grid-cols-2 gap-3 mb-3">
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

                  {pkg.package_description && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1 mb-2">
                      <Package className="w-3 h-3 inline mr-1 opacity-60" />
                      {pkg.package_description}
                    </p>
                  )}

                  {pkg.current_location && (
                    <p className="text-xs text-slate-600 dark:text-slate-400 flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-indigo-500" />
                      <span className="font-medium">{pkg.current_location}</span>
                    </p>
                  )}
                </div>

                <div className="flex flex-row lg:flex-col items-stretch gap-3 lg:w-44 lg:border-l lg:border-slate-200 dark:lg:border-slate-800 lg:pl-5">
                  {pkg.qr_code && (
                    <div className="hidden sm:block p-2 bg-white border border-slate-200 dark:border-slate-700 rounded-lg flex-shrink-0">
                      <img src={pkg.qr_code} alt="QR Code" className="w-16 h-16" />
                    </div>
                  )}
                  <div className="flex flex-col gap-2 flex-1">
                    <Button
                      size="sm"
                      variant="outline"
                      className="rounded-lg h-9 border-slate-300 dark:border-slate-700"
                      onClick={() => copy(trackingUrlFor(pkg.tracking_id), 'Tracking link')}
                      data-testid={`button-copy-link-${pkg.id}`}
                    >
                      <Link2 className="w-3.5 h-3.5 mr-1.5" />Copy Link
                    </Button>
                    <Button
                      size="sm"
                      className="bg-indigo-600 hover:bg-indigo-700 rounded-lg h-9"
                      onClick={() => {
                        setSelectedPkg(pkg);
                        setStatusForm({ status: pkg.current_status, location: pkg.current_location ?? '', description: '' });
                        setShowStatus(true);
                      }}
                      data-testid={`button-update-status-${pkg.id}`}
                    >
                      <Truck className="w-3.5 h-3.5 mr-1.5" />Update
                    </Button>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {/* Created package modal */}
      <Dialog open={!!createdPkg} onOpenChange={(open) => !open && setCreatedPkg(null)}>
        <DialogContent className="max-w-lg bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800" data-testid="dialog-tracking-created">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-slate-900 dark:text-white">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              Package created
            </DialogTitle>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Share this tracking ID with the recipient.
            </p>
          </DialogHeader>
          {createdPkg && (
            <div className="space-y-4 mt-2">
              <div className="rounded-xl border-2 border-dashed border-emerald-200 dark:border-emerald-900/50 bg-emerald-50/50 dark:bg-emerald-950/20 p-5 text-center">
                <p className="text-[10px] uppercase tracking-[0.18em] text-emerald-700 dark:text-emerald-400 font-semibold mb-1">
                  Tracking ID
                </p>
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
                  <Input
                    readOnly
                    value={trackingUrlFor(createdPkg.tracking_id)}
                    className="font-mono text-xs"
                    onFocus={(e) => e.currentTarget.select()}
                    data-testid="input-tracking-link"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="flex-shrink-0 h-11 w-11 rounded-lg border-slate-300 dark:border-slate-700"
                    onClick={() => copy(trackingUrlFor(createdPkg.tracking_id), 'Tracking link')}
                    title="Copy link"
                    data-testid="button-copy-link"
                  >
                    <Link2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  className="rounded-lg h-10 border-slate-300 dark:border-slate-700"
                  onClick={() => copy(createdPkg.tracking_id, 'Tracking ID')}
                  data-testid="button-copy-tracking-id"
                >
                  <Copy className="w-4 h-4 mr-2" />Copy ID
                </Button>
                <a href={buildShareEmail(createdPkg)} className="block">
                  <Button variant="outline" className="w-full rounded-lg h-10 border-slate-300 dark:border-slate-700" data-testid="button-share-email">
                    <Mail className="w-4 h-4 mr-2" />Email Recipient
                  </Button>
                </a>
              </div>

              <div className="flex gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                <Button
                  variant="ghost"
                  className="flex-1 rounded-lg h-10"
                  onClick={() => {
                    setSelectedPkg(createdPkg);
                    setStatusForm({ status: createdPkg.current_status, location: createdPkg.current_location ?? '', description: '' });
                    setCreatedPkg(null);
                    setShowStatus(true);
                  }}
                  data-testid="button-update-status-now"
                >
                  <Truck className="w-4 h-4 mr-2" />Update Status
                </Button>
                <Button
                  className="flex-1 rounded-lg h-10 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white"
                  onClick={() => setCreatedPkg(null)}
                  data-testid="button-done"
                >
                  Done
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Update status dialog */}
      <Dialog open={showStatus} onOpenChange={setShowStatus}>
        <DialogContent className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
          <DialogHeader>
            <DialogTitle className="text-slate-900 dark:text-white">Update Package Status</DialogTitle>
            {selectedPkg && (
              <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">{selectedPkg.tracking_id}</p>
            )}
          </DialogHeader>
          {selectedPkg && (
            <div className="space-y-4 mt-2">
              <div className="form-field">
                <Label className="form-label">New Status</Label>
                <Select value={statusForm.status} onValueChange={v => setStatusForm(f => ({ ...f, status: v }))}>
                  <SelectTrigger className="h-11 rounded-lg border-slate-300 dark:border-slate-700" data-testid="select-package-status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {nextStatusOptions(selectedPkg.current_status).map(s => (
                      <SelectItem key={s} value={s} data-testid={`option-status-${s}`}>
                        {formatStatus(s)}{s === selectedPkg.current_status ? ' (current)' : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {PACKAGE_TERMINAL_STATUSES.includes(selectedPkg.current_status as PackageStatus) && (
                  <p className="form-help">
                    This package is in a final state. Updates will only re-stamp the current status.
                  </p>
                )}
              </div>
              <div className="form-field">
                <Label className="form-label">Current Location</Label>
                <Input
                  value={statusForm.location}
                  onChange={e => setStatusForm(f => ({ ...f, location: e.target.value }))}
                  placeholder="e.g. New York Distribution Center"
                  data-testid="input-status-location"
                />
              </div>
              <div className="form-field">
                <Label className="form-label">Notes</Label>
                <Textarea
                  value={statusForm.description}
                  onChange={e => setStatusForm(f => ({ ...f, description: e.target.value }))}
                  rows={2}
                  placeholder="Optional context for this update"
                  data-testid="input-status-notes"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <Button variant="outline" onClick={() => setShowStatus(false)} className="rounded-xl h-11">Cancel</Button>
                <Button
                  onClick={handleStatusUpdate}
                  className="flex-1 h-11 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-semibold"
                  disabled={statusMutation.isPending}
                  data-testid="button-submit-status"
                >
                  {statusMutation.isPending ? 'Updating…' : 'Update Status'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function FormSection({ step, title, icon: Icon, children }: { step: number; title: string; icon: any; children: React.ReactNode }) {
  return (
    <div className="form-section">
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
