'use client';

import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Sliders, Megaphone, Mail, FileText, DollarSign, Boxes, HelpCircle, ToggleLeft,
  Save, Plus, Trash2, GripVertical, AlertTriangle, RefreshCw, Loader2, Check,
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/api';
import {
  DEFAULT_CONFIG,
  type SiteConfig,
  type HeroConfig,
  type ContactConfig,
  type AnnouncementConfig,
  type FeatureFlags,
  type PricingConfig,
  type TimeSlot,
  type ServiceItem,
  type FaqItem,
} from '@/lib/site-config';
import { ICON_NAMES } from '@/lib/icon-map';

/* -------------------------------------------------------------------------- */
/*  Shared bits                                                               */
/* -------------------------------------------------------------------------- */

function useSaveSetting<K extends keyof SiteConfig>(key: K, label: string) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (value: SiteConfig[K]) =>
      apiRequest('PUT', `/api/site-settings/${key}`, value),
    onSuccess: () => {
      toast({
        title: `${label} saved`,
        description: 'Changes are live for visitors right now.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/site-settings'] });
      queryClient.invalidateQueries({ queryKey: ['/api/public-config'] });
    },
    onError: (e: any) => {
      toast({
        title: 'Could not save',
        description: e?.message ?? 'Please try again.',
        variant: 'destructive',
      });
    },
  });
}

function SectionCard({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon: any;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="surface-card-elevated p-6 sm:p-7 space-y-5">
      <div className="flex items-start gap-4">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white flex items-center justify-center shadow-md shadow-indigo-500/30 shrink-0">
          <Icon className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">{title}</h3>
          <p className="text-sm text-slate-600 dark:text-slate-400">{description}</p>
        </div>
      </div>
      <div className="space-y-4">{children}</div>
    </div>
  );
}

function SaveBar({
  isPending,
  onSave,
  dirty,
}: {
  isPending: boolean;
  onSave: () => void;
  dirty: boolean;
}) {
  return (
    <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
      {dirty ? (
        <span className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
          <AlertTriangle className="w-3.5 h-3.5" /> Unsaved changes
        </span>
      ) : (
        <span className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
          <Check className="w-3.5 h-3.5" /> All changes saved
        </span>
      )}
      <Button
        onClick={onSave}
        disabled={isPending || !dirty}
        className="bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white shadow-md shadow-indigo-500/30"
        data-testid="button-save"
      >
        {isPending ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving…
          </>
        ) : (
          <>
            <Save className="w-4 h-4 mr-2" /> Save changes
          </>
        )}
      </Button>
    </div>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="form-field">
      <label className="form-label">{label}</label>
      {children}
      {hint && <p className="form-help">{hint}</p>}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Tab: Site Content (Hero + Announcement + Contact)                         */
/* -------------------------------------------------------------------------- */

function HeroSection({ initial }: { initial: HeroConfig }) {
  const [v, setV] = useState<HeroConfig>(initial);
  const [dirty, setDirty] = useState(false);
  useEffect(() => { setV(initial); setDirty(false); }, [initial]);
  const update = <K extends keyof HeroConfig>(k: K, val: HeroConfig[K]) => {
    setV((prev) => ({ ...prev, [k]: val }));
    setDirty(true);
  };
  const save = useSaveSetting('hero', 'Homepage hero');

  return (
    <SectionCard
      icon={Sliders}
      title="Homepage Hero"
      description="The big headline, rotating words, and call-to-action buttons at the top of your landing page."
    >
      <Field label="Title prefix" hint="The static text before the rotating word.">
        <Input
          value={v.title_prefix}
          onChange={(e) => update('title_prefix', e.target.value)}
          data-testid="input-hero-title"
        />
      </Field>
      <Field label="Rotating words" hint="One per line. They cycle every couple of seconds.">
        <Textarea
          rows={5}
          value={v.rotating_words.join('\n')}
          onChange={(e) =>
            update(
              'rotating_words',
              e.target.value.split('\n').map((s) => s.trim()).filter(Boolean),
            )
          }
          data-testid="input-hero-rotating-words"
        />
      </Field>
      <Field label="Subtitle">
        <Textarea
          rows={3}
          value={v.subtitle}
          onChange={(e) => update('subtitle', e.target.value)}
          data-testid="input-hero-subtitle"
        />
      </Field>
      <div className="grid sm:grid-cols-2 gap-4">
        <Field label="Primary button label">
          <Input value={v.primary_cta_label} onChange={(e) => update('primary_cta_label', e.target.value)} />
        </Field>
        <Field label="Primary button link">
          <Input value={v.primary_cta_href} onChange={(e) => update('primary_cta_href', e.target.value)} />
        </Field>
        <Field label="Secondary button label">
          <Input value={v.secondary_cta_label} onChange={(e) => update('secondary_cta_label', e.target.value)} />
        </Field>
        <Field label="Secondary button link">
          <Input value={v.secondary_cta_href} onChange={(e) => update('secondary_cta_href', e.target.value)} />
        </Field>
      </div>
      <div className="grid sm:grid-cols-2 gap-4">
        <Field label="Badge 1 — title">
          <Input value={v.badge1_title} onChange={(e) => update('badge1_title', e.target.value)} />
        </Field>
        <Field label="Badge 1 — subtitle">
          <Input value={v.badge1_label} onChange={(e) => update('badge1_label', e.target.value)} />
        </Field>
        <Field label="Badge 2 — title">
          <Input value={v.badge2_title} onChange={(e) => update('badge2_title', e.target.value)} />
        </Field>
        <Field label="Badge 2 — subtitle">
          <Input value={v.badge2_label} onChange={(e) => update('badge2_label', e.target.value)} />
        </Field>
      </div>
      <SaveBar isPending={save.isPending} dirty={dirty} onSave={() => save.mutate(v, { onSuccess: () => setDirty(false) })} />
    </SectionCard>
  );
}

function AnnouncementSection({ initial }: { initial: AnnouncementConfig }) {
  const [v, setV] = useState<AnnouncementConfig>(initial);
  const [dirty, setDirty] = useState(false);
  useEffect(() => { setV(initial); setDirty(false); }, [initial]);
  const update = <K extends keyof AnnouncementConfig>(k: K, val: AnnouncementConfig[K]) => {
    setV((prev) => ({ ...prev, [k]: val }));
    setDirty(true);
  };
  const save = useSaveSetting('announcement', 'Announcement banner');

  return (
    <SectionCard
      icon={Megaphone}
      title="Announcement Banner"
      description="A thin banner shown above the header on every public page. Use it for outages, holiday delays, or promos."
    >
      <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700">
        <div>
          <p className="font-semibold text-slate-900 dark:text-white">Show banner</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">Toggle on to display sitewide.</p>
        </div>
        <Switch
          checked={v.enabled}
          onCheckedChange={(c) => update('enabled', c)}
          data-testid="switch-announcement-enabled"
        />
      </div>
      <Field label="Message">
        <Textarea
          rows={2}
          value={v.message}
          onChange={(e) => update('message', e.target.value)}
          data-testid="input-announcement-message"
        />
      </Field>
      <div className="grid sm:grid-cols-2 gap-4">
        <Field label="Link URL" hint="Optional — leave blank for no link.">
          <Input value={v.link} onChange={(e) => update('link', e.target.value)} />
        </Field>
        <Field label="Link label">
          <Input value={v.link_label} onChange={(e) => update('link_label', e.target.value)} />
        </Field>
      </div>
      <SaveBar isPending={save.isPending} dirty={dirty} onSave={() => save.mutate(v, { onSuccess: () => setDirty(false) })} />
    </SectionCard>
  );
}

function ContactSection({ initial }: { initial: ContactConfig }) {
  const [v, setV] = useState<ContactConfig>(initial);
  const [dirty, setDirty] = useState(false);
  useEffect(() => { setV(initial); setDirty(false); }, [initial]);
  const update = <K extends keyof ContactConfig>(k: K, val: ContactConfig[K]) => {
    setV((prev) => ({ ...prev, [k]: val }));
    setDirty(true);
  };
  const save = useSaveSetting('contact', 'Contact info');

  return (
    <SectionCard
      icon={Mail}
      title="Contact Information"
      description="Email, phone, WhatsApp, address, and business hours shown on the contact page, header, and footer."
    >
      <div className="grid sm:grid-cols-2 gap-4">
        <Field label="Support email">
          <Input value={v.email} onChange={(e) => update('email', e.target.value)} />
        </Field>
        <Field label="Phone (display)">
          <Input value={v.phone} onChange={(e) => update('phone', e.target.value)} />
        </Field>
        <Field label="Phone (tel: link)" hint="Like tel:+18007447649">
          <Input value={v.phone_href} onChange={(e) => update('phone_href', e.target.value)} />
        </Field>
        <Field label="WhatsApp number (display)">
          <Input value={v.whatsapp_label} onChange={(e) => update('whatsapp_label', e.target.value)} />
        </Field>
        <Field label="WhatsApp link" hint="Like https://wa.me/14093823874">
          <Input value={v.whatsapp_url} onChange={(e) => update('whatsapp_url', e.target.value)} />
        </Field>
      </div>
      <div className="grid sm:grid-cols-3 gap-4">
        <Field label="Address line 1">
          <Input value={v.address_line1} onChange={(e) => update('address_line1', e.target.value)} />
        </Field>
        <Field label="Address line 2">
          <Input value={v.address_line2} onChange={(e) => update('address_line2', e.target.value)} />
        </Field>
        <Field label="City / region / postcode">
          <Input value={v.address_city} onChange={(e) => update('address_city', e.target.value)} />
        </Field>
      </div>
      <div className="grid sm:grid-cols-3 gap-4">
        <Field label="Hours — Mon–Fri">
          <Input value={v.hours_weekday} onChange={(e) => update('hours_weekday', e.target.value)} />
        </Field>
        <Field label="Hours — Saturday">
          <Input value={v.hours_saturday} onChange={(e) => update('hours_saturday', e.target.value)} />
        </Field>
        <Field label="Hours — Sunday">
          <Input value={v.hours_sunday} onChange={(e) => update('hours_sunday', e.target.value)} />
        </Field>
      </div>
      <SaveBar isPending={save.isPending} dirty={dirty} onSave={() => save.mutate(v, { onSuccess: () => setDirty(false) })} />
    </SectionCard>
  );
}

/* -------------------------------------------------------------------------- */
/*  Tab: Pricing & Time Slots                                                 */
/* -------------------------------------------------------------------------- */

function PricingSection({ initial }: { initial: PricingConfig }) {
  const [v, setV] = useState<PricingConfig>(initial);
  const [dirty, setDirty] = useState(false);
  useEffect(() => { setV(initial); setDirty(false); }, [initial]);
  const save = useSaveSetting('pricing', 'Pricing');

  return (
    <SectionCard
      icon={DollarSign}
      title="Quote Pricing"
      description="The math used by the public quote form. Total = max(base minimum, weight × per-kg rate) + delivery fee."
    >
      <div className="grid sm:grid-cols-3 gap-4">
        <Field label="Currency symbol">
          <Input
            value={v.currency}
            onChange={(e) => { setV({ ...v, currency: e.target.value }); setDirty(true); }}
          />
        </Field>
        <Field label="Base minimum charge">
          <Input
            type="number"
            step="0.01"
            value={v.base_min}
            onChange={(e) => { setV({ ...v, base_min: parseFloat(e.target.value) || 0 }); setDirty(true); }}
            data-testid="input-base-min"
          />
        </Field>
        <Field label="Per-kg rate">
          <Input
            type="number"
            step="0.01"
            value={v.per_kg_rate}
            onChange={(e) => { setV({ ...v, per_kg_rate: parseFloat(e.target.value) || 0 }); setDirty(true); }}
            data-testid="input-per-kg-rate"
          />
        </Field>
      </div>
      <SaveBar isPending={save.isPending} dirty={dirty} onSave={() => save.mutate(v, { onSuccess: () => setDirty(false) })} />
    </SectionCard>
  );
}

function TimeSlotsSection({ initial }: { initial: TimeSlot[] }) {
  const [items, setItems] = useState<TimeSlot[]>(initial);
  const [dirty, setDirty] = useState(false);
  useEffect(() => { setItems(initial); setDirty(false); }, [initial]);
  const save = useSaveSetting('time_slots', 'Time slots');

  const updateAt = (i: number, patch: Partial<TimeSlot>) => {
    setItems(items.map((s, idx) => (idx === i ? { ...s, ...patch } : s)));
    setDirty(true);
  };
  const remove = (i: number) => {
    setItems(items.filter((_, idx) => idx !== i));
    setDirty(true);
  };
  const add = () => {
    setItems([...items, { value: `slot-${Date.now()}`, label: 'New slot', fee: 0, enabled: true }]);
    setDirty(true);
  };

  return (
    <SectionCard
      icon={Boxes}
      title="Delivery Time Slots"
      description="Slots customers can pick on the quote form. The fee is added to the base price."
    >
      <div className="space-y-3">
        {items.map((slot, i) => (
          <div
            key={i}
            className="grid grid-cols-12 gap-3 items-end p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700"
            data-testid={`row-time-slot-${i}`}
          >
            <div className="col-span-12 sm:col-span-3">
              <Label className="form-label">Value (id)</Label>
              <Input
                value={slot.value}
                onChange={(e) => updateAt(i, { value: e.target.value })}
                placeholder="morning"
              />
            </div>
            <div className="col-span-12 sm:col-span-5">
              <Label className="form-label">Label shown to customers</Label>
              <Input value={slot.label} onChange={(e) => updateAt(i, { label: e.target.value })} />
            </div>
            <div className="col-span-6 sm:col-span-2">
              <Label className="form-label">Fee</Label>
              <Input
                type="number"
                step="0.01"
                value={slot.fee}
                onChange={(e) => updateAt(i, { fee: parseFloat(e.target.value) || 0 })}
              />
            </div>
            <div className="col-span-6 sm:col-span-2 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Switch checked={slot.enabled} onCheckedChange={(c) => updateAt(i, { enabled: c })} />
                <span className="text-xs text-slate-500 dark:text-slate-400">On</span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => remove(i)}
                className="text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40"
                data-testid={`button-remove-slot-${i}`}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        ))}
        <Button
          variant="outline"
          onClick={add}
          className="w-full border-dashed"
          data-testid="button-add-slot"
        >
          <Plus className="w-4 h-4 mr-2" /> Add a time slot
        </Button>
      </div>
      <SaveBar isPending={save.isPending} dirty={dirty} onSave={() => save.mutate(items, { onSuccess: () => setDirty(false) })} />
    </SectionCard>
  );
}

/* -------------------------------------------------------------------------- */
/*  Tab: Services                                                             */
/* -------------------------------------------------------------------------- */

function ServicesSection({ initial }: { initial: ServiceItem[] }) {
  const [items, setItems] = useState<ServiceItem[]>(initial);
  const [dirty, setDirty] = useState(false);
  useEffect(() => { setItems(initial); setDirty(false); }, [initial]);
  const save = useSaveSetting('services', 'Services list');

  const updateAt = (i: number, patch: Partial<ServiceItem>) => {
    setItems(items.map((s, idx) => (idx === i ? { ...s, ...patch } : s)));
    setDirty(true);
  };
  const remove = (i: number) => {
    setItems(items.filter((_, idx) => idx !== i));
    setDirty(true);
  };
  const add = () => {
    setItems([
      ...items,
      { title: 'New Service', description: '', bullets: [], icon: 'Package', enabled: true },
    ]);
    setDirty(true);
  };

  return (
    <SectionCard
      icon={Boxes}
      title="Services"
      description="Cards shown on the homepage and Services page. Disable to hide without deleting."
    >
      <div className="space-y-4">
        {items.map((s, i) => (
          <div
            key={i}
            className="p-5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 space-y-3"
            data-testid={`row-service-${i}`}
          >
            <div className="flex items-start gap-3">
              <GripVertical className="w-5 h-5 text-slate-400 mt-2" />
              <div className="flex-1 grid sm:grid-cols-2 gap-3">
                <Field label="Title">
                  <Input value={s.title} onChange={(e) => updateAt(i, { title: e.target.value })} />
                </Field>
                <Field label="Icon">
                  <Select value={s.icon} onValueChange={(v) => updateAt(i, { icon: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ICON_NAMES.map((n) => (
                        <SelectItem key={n} value={n}>{n}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                <div className="sm:col-span-2">
                  <Field label="Description">
                    <Textarea
                      rows={2}
                      value={s.description}
                      onChange={(e) => updateAt(i, { description: e.target.value })}
                    />
                  </Field>
                </div>
                <div className="sm:col-span-2">
                  <Field label="Bullet points" hint="One per line.">
                    <Textarea
                      rows={3}
                      value={s.bullets.join('\n')}
                      onChange={(e) =>
                        updateAt(i, {
                          bullets: e.target.value.split('\n').map((b) => b.trim()).filter(Boolean),
                        })
                      }
                    />
                  </Field>
                </div>
              </div>
              <div className="flex flex-col items-center gap-2 pt-1">
                <Switch checked={s.enabled} onCheckedChange={(c) => updateAt(i, { enabled: c })} />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => remove(i)}
                  className="text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        ))}
        <Button variant="outline" onClick={add} className="w-full border-dashed" data-testid="button-add-service">
          <Plus className="w-4 h-4 mr-2" /> Add a service
        </Button>
      </div>
      <SaveBar isPending={save.isPending} dirty={dirty} onSave={() => save.mutate(items, { onSuccess: () => setDirty(false) })} />
    </SectionCard>
  );
}

/* -------------------------------------------------------------------------- */
/*  Tab: FAQ                                                                  */
/* -------------------------------------------------------------------------- */

function FaqSection({ initial }: { initial: FaqItem[] }) {
  const [items, setItems] = useState<FaqItem[]>(initial);
  const [dirty, setDirty] = useState(false);
  useEffect(() => { setItems(initial); setDirty(false); }, [initial]);
  const save = useSaveSetting('faqs', 'FAQ items');

  const updateAt = (i: number, patch: Partial<FaqItem>) => {
    setItems(items.map((f, idx) => (idx === i ? { ...f, ...patch } : f)));
    setDirty(true);
  };
  const remove = (i: number) => {
    setItems(items.filter((_, idx) => idx !== i));
    setDirty(true);
  };
  const add = () => {
    setItems([...items, { q: 'New question', a: '', enabled: true }]);
    setDirty(true);
  };

  return (
    <SectionCard
      icon={HelpCircle}
      title="FAQ Items"
      description="Questions and answers shown on the public FAQ page. Disable to hide without deleting."
    >
      <div className="space-y-3">
        {items.map((f, i) => (
          <div
            key={i}
            className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 space-y-3"
            data-testid={`row-faq-${i}`}
          >
            <div className="flex items-start gap-3">
              <div className="flex-1 space-y-3">
                <Field label="Question">
                  <Input value={f.q} onChange={(e) => updateAt(i, { q: e.target.value })} />
                </Field>
                <Field label="Answer">
                  <Textarea rows={3} value={f.a} onChange={(e) => updateAt(i, { a: e.target.value })} />
                </Field>
              </div>
              <div className="flex flex-col items-center gap-2 pt-1">
                <Switch checked={f.enabled} onCheckedChange={(c) => updateAt(i, { enabled: c })} />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => remove(i)}
                  className="text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        ))}
        <Button variant="outline" onClick={add} className="w-full border-dashed" data-testid="button-add-faq">
          <Plus className="w-4 h-4 mr-2" /> Add a question
        </Button>
      </div>
      <SaveBar isPending={save.isPending} dirty={dirty} onSave={() => save.mutate(items, { onSuccess: () => setDirty(false) })} />
    </SectionCard>
  );
}

/* -------------------------------------------------------------------------- */
/*  Tab: Feature Flags                                                        */
/* -------------------------------------------------------------------------- */

function FeatureFlagsSection({ initial }: { initial: FeatureFlags }) {
  const [v, setV] = useState<FeatureFlags>(initial);
  const [dirty, setDirty] = useState(false);
  useEffect(() => { setV(initial); setDirty(false); }, [initial]);
  const update = <K extends keyof FeatureFlags>(k: K, val: FeatureFlags[K]) => {
    setV((prev) => ({ ...prev, [k]: val }));
    setDirty(true);
  };
  const save = useSaveSetting('feature_flags', 'Feature flags');

  const toggles: Array<{ key: keyof FeatureFlags; label: string; description: string }> = [
    { key: 'quote_enabled',     label: 'Quote page',         description: '/quote — public quote request form.' },
    { key: 'register_enabled',  label: 'User registration',  description: '/register — let new users sign up.' },
    { key: 'tracking_enabled',  label: 'Public tracking',    description: '/track — package tracking lookup.' },
    { key: 'faq_enabled',       label: 'FAQ page',           description: '/faq — help center.' },
    { key: 'contact_enabled',   label: 'Contact page',       description: '/contact — contact form & info.' },
    { key: 'services_enabled',  label: 'Services page',      description: '/services — services overview.' },
  ];

  return (
    <div className="space-y-6">
      <SectionCard
        icon={ToggleLeft}
        title="Page Toggles"
        description="Turn entire pages on or off. Disabled pages show a friendly 'unavailable' notice instead of 404."
      >
        <div className="grid sm:grid-cols-2 gap-3">
          {toggles.map(({ key, label, description }) => (
            <div
              key={key}
              className="flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700"
            >
              <div className="min-w-0 pr-3">
                <p className="font-semibold text-slate-900 dark:text-white truncate">{label}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{description}</p>
              </div>
              <Switch
                checked={v[key] as boolean}
                onCheckedChange={(c) => update(key, c as any)}
                data-testid={`switch-flag-${key}`}
              />
            </div>
          ))}
        </div>
        <SaveBar isPending={save.isPending} dirty={dirty} onSave={() => save.mutate(v, { onSuccess: () => setDirty(false) })} />
      </SectionCard>

      <SectionCard
        icon={AlertTriangle}
        title="Maintenance Mode"
        description="When on, every public page (except admin login) shows a maintenance screen. Use sparingly."
      >
        <div className="flex items-center justify-between p-4 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50">
          <div>
            <p className="font-semibold text-amber-900 dark:text-amber-200">Site maintenance mode</p>
            <p className="text-xs text-amber-700 dark:text-amber-300">All public pages will show the message below.</p>
          </div>
          <Switch
            checked={v.maintenance_mode}
            onCheckedChange={(c) => update('maintenance_mode', c)}
            data-testid="switch-maintenance"
          />
        </div>
        <Field label="Maintenance message">
          <Textarea
            rows={3}
            value={v.maintenance_message}
            onChange={(e) => update('maintenance_message', e.target.value)}
            data-testid="input-maintenance-message"
          />
        </Field>
        <SaveBar isPending={save.isPending} dirty={dirty} onSave={() => save.mutate(v, { onSuccess: () => setDirty(false) })} />
      </SectionCard>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Page                                                                      */
/* -------------------------------------------------------------------------- */

export default function CustomizationClient() {
  const queryClient = useQueryClient();
  const { data: cfg, isLoading, isError } = useQuery<SiteConfig>({
    queryKey: ['/api/site-settings'],
  });

  const config = cfg ?? DEFAULT_CONFIG;

  return (
    <div className="page-shell">
      <header className="page-header">
        <p className="page-eyebrow">Site Customization</p>
        <h1 className="page-title">What your customers see</h1>
        <p className="page-subtitle">
          Edit homepage copy, contact info, FAQ, services, pricing, and feature flags. Changes go
          live immediately — no deploy required.
        </p>
        <div className="flex items-center gap-2 mt-3">
          <Button
            size="sm"
            variant="outline"
            onClick={() => queryClient.invalidateQueries({ queryKey: ['/api/site-settings'] })}
            data-testid="button-refresh"
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          {isError && (
            <span className="meta-chip text-red-600">
              Couldn&rsquo;t load — using defaults. Did you run the migration?
            </span>
          )}
        </div>
      </header>

      {isLoading ? (
        <div className="surface-card p-12 flex items-center justify-center text-slate-500">
          <Loader2 className="w-5 h-5 mr-2 animate-spin" /> Loading settings…
        </div>
      ) : (
        <Tabs defaultValue="content" className="space-y-6">
          <TabsList className="grid grid-cols-2 sm:grid-cols-5 h-auto p-1.5 bg-slate-100 dark:bg-slate-800/60 rounded-2xl gap-1">
            <TabsTrigger value="content" className="flex items-center gap-2 py-2.5" data-testid="tab-content">
              <FileText className="w-4 h-4" /> Site Content
            </TabsTrigger>
            <TabsTrigger value="pricing" className="flex items-center gap-2 py-2.5" data-testid="tab-pricing">
              <DollarSign className="w-4 h-4" /> Pricing
            </TabsTrigger>
            <TabsTrigger value="services" className="flex items-center gap-2 py-2.5" data-testid="tab-services">
              <Boxes className="w-4 h-4" /> Services
            </TabsTrigger>
            <TabsTrigger value="faq" className="flex items-center gap-2 py-2.5" data-testid="tab-faq">
              <HelpCircle className="w-4 h-4" /> FAQ
            </TabsTrigger>
            <TabsTrigger value="flags" className="flex items-center gap-2 py-2.5" data-testid="tab-flags">
              <ToggleLeft className="w-4 h-4" /> Features
            </TabsTrigger>
          </TabsList>

          <TabsContent value="content" className="space-y-6 mt-0">
            <HeroSection initial={config.hero} />
            <AnnouncementSection initial={config.announcement} />
            <ContactSection initial={config.contact} />
          </TabsContent>

          <TabsContent value="pricing" className="space-y-6 mt-0">
            <PricingSection initial={config.pricing} />
            <TimeSlotsSection initial={config.time_slots} />
          </TabsContent>

          <TabsContent value="services" className="mt-0">
            <ServicesSection initial={config.services} />
          </TabsContent>

          <TabsContent value="faq" className="mt-0">
            <FaqSection initial={config.faqs} />
          </TabsContent>

          <TabsContent value="flags" className="mt-0">
            <FeatureFlagsSection initial={config.feature_flags} />
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
