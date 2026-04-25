import LandingPage from '@/components/landing-page';
import { MaintenanceScreen } from '@/components/maintenance-screen';
import { getSiteConfig } from '@/lib/site-config.server';

export const metadata = {
  title: 'Shipnix Express — Global Logistics & Real-Time Tracking',
  description:
    'Fast, dependable shipping to 220+ countries. Track packages in real time, request instant quotes, and manage logistics with Shipnix Express.',
  openGraph: {
    title: 'Shipnix Express — Global Logistics & Real-Time Tracking',
    description:
      'Fast, dependable shipping to 220+ countries. Track packages in real time, request instant quotes, and manage logistics with Shipnix Express.',
    type: 'website',
  },
};

export default async function Home() {
  const config = await getSiteConfig();
  if (config.feature_flags.maintenance_mode) {
    return <MaintenanceScreen message={config.feature_flags.maintenance_message} />;
  }
  return <LandingPage siteConfig={config} />;
}
