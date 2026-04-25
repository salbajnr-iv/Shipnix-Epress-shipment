import Header from '@/components/header';
import PublicTrackingClient from '@/components/public-tracking-client';
import { MaintenanceScreen, FeatureDisabledScreen } from '@/components/maintenance-screen';
import { publicConfig } from '@/lib/site-config';
import { getSiteConfig } from '@/lib/site-config.server';

export const metadata = {
  title: 'Track Your Shipment | Shipnix Express',
  description: 'Real-time package tracking. Enter your Shipnix tracking ID to see live status, location, and timeline.',
  openGraph: {
    title: 'Track Your Shipment | Shipnix Express',
    description: 'Real-time package tracking for Shipnix Express shipments.',
  },
};

export default async function TrackPage() {
  const config = publicConfig(await getSiteConfig());
  const flags = config.feature_flags;

  if (flags.maintenance_mode) {
    return <MaintenanceScreen message={flags.maintenance_message} />;
  }
  if (!flags.tracking_enabled) {
    return <FeatureDisabledScreen title="Tracking is temporarily unavailable" />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <Header contact={config.contact} announcement={config.announcement} flags={flags} />
      <PublicTrackingClient />
    </div>
  );
}
