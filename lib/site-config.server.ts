import 'server-only';
import { createClient } from '@/lib/supabase/server';
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

/**
 * Fetch every site setting from Supabase and merge with defaults so the app
 * still renders if the migration hasn't been run yet or a key is missing.
 *
 * SERVER ONLY — uses next/headers via the Supabase server client.
 */
export async function getSiteConfig(): Promise<SiteConfig> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.from('site_settings').select('key, value');

    if (error || !data) return DEFAULT_CONFIG;

    const map = new Map<string, unknown>(data.map((row) => [row.key, row.value]));
    return {
      hero: { ...DEFAULT_CONFIG.hero, ...((map.get('hero') as Partial<HeroConfig>) ?? {}) },
      contact: { ...DEFAULT_CONFIG.contact, ...((map.get('contact') as Partial<ContactConfig>) ?? {}) },
      announcement: { ...DEFAULT_CONFIG.announcement, ...((map.get('announcement') as Partial<AnnouncementConfig>) ?? {}) },
      feature_flags: { ...DEFAULT_CONFIG.feature_flags, ...((map.get('feature_flags') as Partial<FeatureFlags>) ?? {}) },
      pricing: { ...DEFAULT_CONFIG.pricing, ...((map.get('pricing') as Partial<PricingConfig>) ?? {}) },
      time_slots: (map.get('time_slots') as TimeSlot[] | undefined) ?? DEFAULT_CONFIG.time_slots,
      services: (map.get('services') as ServiceItem[] | undefined) ?? DEFAULT_CONFIG.services,
      faqs: (map.get('faqs') as FaqItem[] | undefined) ?? DEFAULT_CONFIG.faqs,
    };
  } catch {
    return DEFAULT_CONFIG;
  }
}
