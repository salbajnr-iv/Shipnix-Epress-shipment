// Pure types + defaults — safe to import from BOTH client and server components.
// The server-side fetcher lives in `lib/site-config.server.ts` to keep
// `next/headers` (and the supabase server client) out of client bundles.

export type HeroConfig = {
  title_prefix: string;
  rotating_words: string[];
  subtitle: string;
  primary_cta_label: string;
  primary_cta_href: string;
  secondary_cta_label: string;
  secondary_cta_href: string;
  badge1_title: string;
  badge1_label: string;
  badge2_title: string;
  badge2_label: string;
};

export type ContactConfig = {
  email: string;
  phone: string;
  phone_href: string;
  whatsapp_label: string;
  whatsapp_url: string;
  address_line1: string;
  address_line2: string;
  address_city: string;
  hours_weekday: string;
  hours_saturday: string;
  hours_sunday: string;
};

export type AnnouncementConfig = {
  enabled: boolean;
  message: string;
  link: string;
  link_label: string;
};

export type FeatureFlags = {
  quote_enabled: boolean;
  register_enabled: boolean;
  tracking_enabled: boolean;
  faq_enabled: boolean;
  contact_enabled: boolean;
  services_enabled: boolean;
  maintenance_mode: boolean;
  maintenance_message: string;
};

export type PricingConfig = {
  base_min: number;
  per_kg_rate: number;
  currency: string;
};

export type TimeSlot = {
  value: string;
  label: string;
  fee: number;
  enabled: boolean;
};

export type ServiceItem = {
  title: string;
  description: string;
  bullets: string[];
  icon: string;
  enabled: boolean;
};

export type FaqItem = {
  q: string;
  a: string;
  enabled: boolean;
};

export type SiteConfig = {
  hero: HeroConfig;
  contact: ContactConfig;
  announcement: AnnouncementConfig;
  feature_flags: FeatureFlags;
  pricing: PricingConfig;
  time_slots: TimeSlot[];
  services: ServiceItem[];
  faqs: FaqItem[];
};

export const DEFAULT_CONFIG: SiteConfig = {
  hero: {
    title_prefix: 'Streamline your shipping with our all-in-one solution for',
    rotating_words: [
      'Carrier Integrations',
      'Real-Time Tracking',
      'Instant Quotes',
      'Global Delivery',
      'Smart Logistics',
    ],
    subtitle:
      'A custom-built, cloud-based logistics platform designed to save you time, effort, and money while you grow your business. Handle every shipment with ease using Shipnix.',
    primary_cta_label: 'Get Started For Free',
    primary_cta_href: '/register',
    secondary_cta_label: 'Track a Shipment',
    secondary_cta_href: '/track',
    badge1_title: 'Next-Day',
    badge1_label: 'Delivery Available',
    badge2_title: '220+ Countries',
    badge2_label: 'Worldwide Coverage',
  },
  contact: {
    email: 'support@shipnix-express.com',
    phone: '+1 (800) SHIPNIX',
    phone_href: 'tel:+18007447649',
    whatsapp_label: '+1 (409) 382-3874',
    whatsapp_url: 'https://wa.me/14093823874',
    address_line1: '100 Logistics Way',
    address_line2: 'Suite 4200',
    address_city: 'London, UK EC1A 1BB',
    hours_weekday: '8:00 – 20:00',
    hours_saturday: '9:00 – 17:00',
    hours_sunday: 'Closed',
  },
  announcement: {
    enabled: false,
    message:
      'Holiday delays in effect — please allow an extra 1–2 days on international shipments.',
    link: '/contact',
    link_label: 'Contact us',
  },
  feature_flags: {
    quote_enabled: true,
    register_enabled: true,
    tracking_enabled: true,
    faq_enabled: true,
    contact_enabled: true,
    services_enabled: true,
    maintenance_mode: false,
    maintenance_message:
      "Shipnix Express is undergoing scheduled maintenance. We'll be back shortly.",
  },
  pricing: {
    base_min: 15,
    per_kg_rate: 8.5,
    currency: '$',
  },
  time_slots: [
    { value: 'morning',   label: 'Morning (8 AM – 12 PM)',   fee: 0,  enabled: true },
    { value: 'afternoon', label: 'Afternoon (12 PM – 5 PM)', fee: 5,  enabled: true },
    { value: 'evening',   label: 'Evening (5 PM – 9 PM)',    fee: 15, enabled: true },
    { value: 'express',   label: 'Express Same-Day',         fee: 25, enabled: true },
    { value: 'weekend',   label: 'Weekend Delivery',         fee: 20, enabled: true },
  ],
  services: [
    {
      title: 'Express Delivery',
      description: 'Lightning-fast shipping when every minute counts.',
      bullets: ['Next business day', 'International express', 'Time-definite delivery'],
      icon: 'Zap',
      enabled: true,
    },
    {
      title: 'Ground Shipping',
      description: 'Cost-effective ground shipping at scale.',
      bullets: ['1-5 business days', 'Residential delivery', 'Commercial delivery'],
      icon: 'Truck',
      enabled: true,
    },
    {
      title: 'Freight & Logistics',
      description: 'Less-than-truckload and full freight services.',
      bullets: ['LTL & FTL shipping', 'Freight management', 'Supply chain solutions'],
      icon: 'Warehouse',
      enabled: true,
    },
  ],
  faqs: [
    { q: 'How do I track my shipment?', a: "Enter your tracking ID on the Track page or go to /track/[your-tracking-id]. You'll see real-time status updates and your full delivery timeline.", enabled: true },
    { q: 'How long does delivery take?', a: 'Delivery times vary by destination. Domestic shipments typically take 2-5 business days. International shipments take 5-14 business days depending on the country.', enabled: true },
    { q: 'What countries do you ship to?', a: 'We deliver to over 220 countries and territories worldwide. Use our quote calculator to get pricing for your specific destination.', enabled: true },
    { q: 'How is shipping cost calculated?', a: 'Costs are based on package weight, dimensions, destination, and delivery speed. Use our instant quote tool to get an exact price before shipping.', enabled: true },
    { q: 'What payment methods are accepted?', a: 'We accept credit/debit cards, bank transfers, PayPal, and cryptocurrencies including Bitcoin, Ethereum, and USDC.', enabled: true },
    { q: 'Can I change delivery address after shipping?', a: 'Address changes may be possible before the package is dispatched. Contact our support team as soon as possible with your tracking ID.', enabled: true },
    { q: 'What happens if my package is lost or damaged?', a: 'All shipments are insured. If your package is lost or damaged, contact our support team within 7 days with your tracking ID and photos of any damage.', enabled: true },
    { q: 'Do you offer express delivery?', a: 'Yes! We offer same-day express delivery for an additional fee. Select the Express time slot when requesting a quote.', enabled: true },
    { q: 'How do I request a refund?', a: 'Refunds are processed within 5-10 business days. Contact support with your tracking ID and reason for the refund request.', enabled: true },
    { q: 'What items are prohibited?', a: 'Prohibited items include hazardous materials, illegal substances, firearms, and certain perishables. Check our full prohibited items list on our website.', enabled: true },
  ],
};

export const SETTING_KEYS = [
  'hero',
  'contact',
  'announcement',
  'feature_flags',
  'pricing',
  'time_slots',
  'services',
  'faqs',
] as const;

export type SettingKey = (typeof SETTING_KEYS)[number];

/** Strip an array down to enabled-only items for public consumption. Pure — safe for client. */
export function publicConfig(cfg: SiteConfig): SiteConfig {
  return {
    ...cfg,
    time_slots: cfg.time_slots.filter((s) => s.enabled),
    services: cfg.services.filter((s) => s.enabled),
    faqs: cfg.faqs.filter((f) => f.enabled),
  };
}
