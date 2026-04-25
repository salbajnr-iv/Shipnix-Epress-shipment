import Header from '@/components/header';
import PublicTrackingClient from '@/components/public-tracking-client';

export const metadata = {
  title: 'Track Your Shipment | Shipnix Express',
  description: 'Real-time package tracking. Enter your Shipnix tracking ID to see live status, location, and timeline.',
  openGraph: {
    title: 'Track Your Shipment | Shipnix Express',
    description: 'Real-time package tracking for Shipnix Express shipments.',
  },
};

export default function TrackPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <Header />
      <PublicTrackingClient />
    </div>
  );
}
