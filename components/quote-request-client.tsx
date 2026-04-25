'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  CheckCircle, Calculator, MapPin, Package as PackageIcon, Sparkles,
  Clock, ShieldCheck, ArrowRight, RotateCcw,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import { DEFAULT_CONFIG, type SiteConfig } from '@/lib/site-config';

export default function QuoteRequestClient() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const { data: cfg } = useQuery<SiteConfig>({ queryKey: ['/api/public-config'] });
  const TIME_SLOTS = (cfg?.time_slots ?? DEFAULT_CONFIG.time_slots).filter(s => s.enabled);
  const defaultSlot = TIME_SLOTS[0]?.value ?? 'morning';

  const [form, setForm] = useState({
    sender_name: '', sender_email: '', sender_phone: '', sender_address: '',
    recipient_name: '', recipient_email: '', recipient_phone: '', recipient_address: '',
    package_description: '', weight: '', dimensions: '', delivery_time_slot: defaultSlot,
  });

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.sender_name || !form.sender_address || !form.recipient_name || !form.recipient_address) {
      toast({ title: 'Please fill in all required fields', variant: 'destructive' });
      return;
    }
    setLoading(true);
    try {
      const data = await apiRequest('POST', '/api/quotes', form);
      setResult(data);
      toast({ title: 'Quote Generated!', description: `Quote ${data.quote_number} created successfully` });
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  if (result) {
    return (
      <div className="bg-slate-50 dark:bg-slate-950 min-h-[80vh] py-12 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="surface-card-elevated overflow-hidden animate-fade-in-up">
            <div className="bg-gradient-to-br from-emerald-500 to-teal-600 p-8 text-white text-center relative overflow-hidden">
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-2xl" />
              <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-amber-300/20 rounded-full blur-2xl" />
              <div className="relative">
                <div className="w-16 h-16 mx-auto mb-3 rounded-2xl bg-white/15 backdrop-blur border border-white/20 flex items-center justify-center">
                  <CheckCircle className="w-8 h-8" />
                </div>
                <h2 className="text-2xl font-extrabold tracking-tight" data-testid="text-quote-success">Your Quote is Ready</h2>
                <p className="text-emerald-50 text-sm mt-1">Reviewed and confirmed by our pricing engine.</p>
              </div>
            </div>

            <div className="p-6 sm:p-8 space-y-6">
              <div className="rounded-xl border-2 border-dashed border-emerald-200 dark:border-emerald-900/50 bg-emerald-50/50 dark:bg-emerald-950/20 p-5 text-center">
                <p className="text-[10px] uppercase tracking-[0.18em] text-emerald-700 dark:text-emerald-400 font-semibold mb-1">
                  Quote Reference
                </p>
                <p className="text-2xl font-mono font-bold text-emerald-700 dark:text-emerald-400" data-testid="text-quote-number">
                  {result.quote_number}
                </p>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900">
                  <p className="text-[10px] uppercase tracking-wider font-semibold text-slate-500 mb-1">Base Cost</p>
                  <p className="font-bold text-base text-slate-900 dark:text-white">{formatCurrency(result.base_cost)}</p>
                </div>
                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900">
                  <p className="text-[10px] uppercase tracking-wider font-semibold text-slate-500 mb-1">Delivery Fee</p>
                  <p className="font-bold text-base text-slate-900 dark:text-white">{formatCurrency(result.delivery_fee)}</p>
                </div>
                <div className="p-4 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-500/30">
                  <p className="text-[10px] uppercase tracking-wider font-semibold text-indigo-100 mb-1">Total</p>
                  <p className="font-extrabold text-base">{formatCurrency(result.total_cost)}</p>
                </div>
              </div>

              <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 text-xs text-amber-800 dark:text-amber-300">
                <Clock className="w-3.5 h-3.5 flex-shrink-0" />
                Valid until {new Date(result.valid_until).toLocaleDateString()} — our team will reach out to confirm.
              </div>

              <Button
                onClick={() => setResult(null)}
                variant="outline"
                className="w-full h-11 rounded-xl border-slate-300 dark:border-slate-700"
                data-testid="button-new-quote"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Request Another Quote
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

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
            <Sparkles className="w-3.5 h-3.5 text-amber-300" /> Instant Pricing
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold mb-3 tracking-tight" data-testid="text-page-title">
            Get a shipping quote in seconds
          </h1>
          <p className="text-indigo-100 text-base sm:text-lg max-w-xl mx-auto">
            Tell us about your shipment and our pricing engine will calculate your total instantly.
          </p>
        </div>
      </section>

      {/* Form + sidebar */}
      <section className="py-12 px-4 -mt-10 relative z-10">
        <div className="max-w-6xl mx-auto grid lg:grid-cols-3 gap-6">
          {/* Form card */}
          <div className="lg:col-span-2 surface-card-elevated p-6 sm:p-8">
            <form onSubmit={handleSubmit}>
              <FormSection
                step={1}
                icon={MapPin}
                title="Sender Details"
                subtitle="Who is sending the package?"
              >
                <div className="form-grid">
                  <div className="form-field">
                    <Label htmlFor="sender_name" className="form-label">Full Name *</Label>
                    <Input id="sender_name" value={form.sender_name} onChange={e => set('sender_name', e.target.value)} placeholder="Jane Doe" data-testid="input-sender-name" />
                  </div>
                  <div className="form-field">
                    <Label htmlFor="sender_email" className="form-label">Email</Label>
                    <Input id="sender_email" type="email" value={form.sender_email} onChange={e => set('sender_email', e.target.value)} placeholder="jane@company.com" data-testid="input-sender-email" />
                  </div>
                  <div className="form-field">
                    <Label htmlFor="sender_phone" className="form-label">Phone</Label>
                    <Input id="sender_phone" value={form.sender_phone} onChange={e => set('sender_phone', e.target.value)} placeholder="+1 (555) 000-0000" data-testid="input-sender-phone" />
                  </div>
                  <div className="form-field form-grid-full">
                    <Label htmlFor="sender_address" className="form-label">Pickup Address *</Label>
                    <Textarea id="sender_address" value={form.sender_address} onChange={e => set('sender_address', e.target.value)} rows={2} placeholder="Street, city, postal code, country" data-testid="input-sender-address" />
                  </div>
                </div>
              </FormSection>

              <FormSection
                step={2}
                icon={MapPin}
                title="Recipient Details"
                subtitle="Where is the package going?"
              >
                <div className="form-grid">
                  <div className="form-field">
                    <Label htmlFor="recipient_name" className="form-label">Full Name *</Label>
                    <Input id="recipient_name" value={form.recipient_name} onChange={e => set('recipient_name', e.target.value)} placeholder="John Smith" data-testid="input-recipient-name" />
                  </div>
                  <div className="form-field">
                    <Label htmlFor="recipient_email" className="form-label">Email</Label>
                    <Input id="recipient_email" type="email" value={form.recipient_email} onChange={e => set('recipient_email', e.target.value)} placeholder="john@example.com" data-testid="input-recipient-email" />
                  </div>
                  <div className="form-field">
                    <Label htmlFor="recipient_phone" className="form-label">Phone</Label>
                    <Input id="recipient_phone" value={form.recipient_phone} onChange={e => set('recipient_phone', e.target.value)} placeholder="+1 (555) 000-0000" data-testid="input-recipient-phone" />
                  </div>
                  <div className="form-field form-grid-full">
                    <Label htmlFor="recipient_address" className="form-label">Delivery Address *</Label>
                    <Textarea id="recipient_address" value={form.recipient_address} onChange={e => set('recipient_address', e.target.value)} rows={2} placeholder="Street, city, postal code, country" data-testid="input-recipient-address" />
                  </div>
                </div>
              </FormSection>

              <FormSection
                step={3}
                icon={PackageIcon}
                title="Package Details"
                subtitle="Tell us about what you're shipping."
              >
                <div className="form-grid">
                  <div className="form-field form-grid-full">
                    <Label htmlFor="package_description" className="form-label">Description</Label>
                    <Textarea id="package_description" value={form.package_description} onChange={e => set('package_description', e.target.value)} rows={2} placeholder="e.g. Electronics, fragile, signature on delivery" data-testid="input-description" />
                  </div>
                  <div className="form-field">
                    <Label htmlFor="weight" className="form-label">Weight (kg)</Label>
                    <Input id="weight" type="number" value={form.weight} onChange={e => set('weight', e.target.value)} placeholder="2.5" data-testid="input-weight" />
                  </div>
                  <div className="form-field">
                    <Label htmlFor="dimensions" className="form-label">Dimensions (cm)</Label>
                    <Input id="dimensions" value={form.dimensions} onChange={e => set('dimensions', e.target.value)} placeholder="L x W x H" data-testid="input-dimensions" />
                  </div>
                  <div className="form-field form-grid-full">
                    <Label className="form-label">Delivery Time Slot</Label>
                    <Select value={form.delivery_time_slot} onValueChange={v => set('delivery_time_slot', v)}>
                      <SelectTrigger className="h-11 rounded-lg border-slate-300 dark:border-slate-700" data-testid="select-time-slot">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {TIME_SLOTS.length === 0 ? (
                          <SelectItem value="morning">Morning</SelectItem>
                        ) : (
                          TIME_SLOTS.map(s => (
                            <SelectItem key={s.value} value={s.value}>
                              {s.label} {s.fee > 0 ? `(+$${s.fee})` : '(free)'}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </FormSection>

              <Button
                type="submit"
                className="w-full h-12 mt-8 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-semibold shadow-lg shadow-indigo-500/25"
                disabled={loading}
                data-testid="button-submit-quote"
              >
                <Calculator className="w-4 h-4 mr-2" />
                {loading ? 'Calculating…' : 'Get Instant Quote'}
                {!loading && <ArrowRight className="w-4 h-4 ml-2" />}
              </Button>
            </form>
          </div>

          {/* Side info */}
          <aside className="space-y-4 lg:sticky lg:top-6 lg:self-start">
            <div className="surface-card p-5">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-3">
                <Sparkles className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-900 dark:text-white mb-1">Why use Shipnix?</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
                Trusted by businesses shipping worldwide.
              </p>
              <ul className="space-y-3 text-sm">
                {[
                  { icon: Clock, label: 'Real-time tracking', sub: 'Live updates 24/7' },
                  { icon: ShieldCheck, label: 'Insured shipments', sub: 'Coverage up to $5,000' },
                  { icon: CheckCircle, label: 'No hidden fees', sub: 'Transparent pricing' },
                ].map(({ icon: Icon, label, sub }) => (
                  <li key={label} className="flex items-start gap-3">
                    <span className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Icon className="w-3.5 h-3.5" />
                    </span>
                    <div>
                      <p className="font-semibold text-slate-900 dark:text-white text-sm">{label}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{sub}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-2xl p-5 bg-gradient-to-br from-indigo-600 to-violet-700 text-white shadow-lg shadow-indigo-500/20 relative overflow-hidden">
              <div className="absolute -top-8 -right-8 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
              <p className="relative text-xs uppercase tracking-wider text-indigo-100 font-semibold mb-1">
                Need help?
              </p>
              <h3 className="relative font-bold text-base mb-1">Talk to a logistics expert</h3>
              <p className="relative text-sm text-indigo-100 mb-3">
                Our team is available to help structure complex shipments.
              </p>
              <a
                href="/contact"
                className="relative inline-flex items-center gap-1.5 bg-white text-indigo-700 hover:bg-amber-50 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors"
                data-testid="link-contact-support"
              >
                Contact us <ArrowRight className="w-3.5 h-3.5" />
              </a>
            </div>
          </aside>
        </div>
      </section>
    </div>
  );
}

function FormSection({
  step, icon: Icon, title, subtitle, children,
}: {
  step: number;
  icon: any;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="form-section">
      <div className="form-section-title">
        <span className="form-section-step">{step}</span>
        <div className="flex items-center gap-2">
          <Icon className="w-4 h-4 text-indigo-600" />
          <h3 className="form-section-heading">{title}</h3>
        </div>
      </div>
      {subtitle && <p className="form-section-sub">{subtitle}</p>}
      {children}
    </div>
  );
}
