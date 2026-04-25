import Header from '@/components/header';
import FAQClient from '@/components/faq-client';
import { MaintenanceScreen, FeatureDisabledScreen } from '@/components/maintenance-screen';
import { publicConfig } from '@/lib/site-config';
import { getSiteConfig } from '@/lib/site-config.server';

export const metadata = {
  title: 'Help Center & FAQ | Shipnix Express',
  description: 'Answers to common questions about tracking, quotes, deliveries, and Shipnix Express services.',
  openGraph: {
    title: 'Help Center & FAQ | Shipnix Express',
    description: 'Answers to common questions about Shipnix Express services.',
  },
};

export default async function FAQPage() {
  const config = publicConfig(await getSiteConfig());
  const flags = config.feature_flags;

  if (flags.maintenance_mode) {
    return <MaintenanceScreen message={flags.maintenance_message} />;
  }
  if (!flags.faq_enabled) {
    return <FeatureDisabledScreen title="FAQ is currently unavailable" />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <Header contact={config.contact} announcement={config.announcement} flags={flags} />
      <FAQClient faqs={config.faqs} />
    </div>
  );
}
