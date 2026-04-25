import Header from '@/components/header';
import QuoteRequestClient from '@/components/quote-request-client';
import { MaintenanceScreen, FeatureDisabledScreen } from '@/components/maintenance-screen';
import { publicConfig } from '@/lib/site-config';
import { getSiteConfig } from '@/lib/site-config.server';

export const metadata = {
  title: 'Get an Instant Shipping Quote | Shipnix Express',
  description: 'Request a free, instant quote for global shipping. Transparent pricing in seconds.',
  openGraph: {
    title: 'Instant Shipping Quote | Shipnix Express',
    description: 'Free, instant quotes for shipments to 220+ countries.',
  },
};

export default async function QuotePage() {
  const config = publicConfig(await getSiteConfig());
  const flags = config.feature_flags;

  if (flags.maintenance_mode) {
    return <MaintenanceScreen message={flags.maintenance_message} />;
  }
  if (!flags.quote_enabled) {
    return <FeatureDisabledScreen title="Quote requests are temporarily unavailable" />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <Header contact={config.contact} announcement={config.announcement} flags={flags} />
      <QuoteRequestClient />
    </div>
  );
}
