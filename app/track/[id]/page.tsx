import Header from '@/components/header';
import PublicTrackingClient from '@/components/public-tracking-client';

export function generateMetadata({ params }: { params: { id: string } }) {
  const id = params.id?.toUpperCase() ?? '';
  return {
    title: id ? `Tracking ${id} | Shipnix Express` : 'Track Package | Shipnix Express',
    description: id
      ? `Real-time tracking details for shipment ${id}.`
      : 'Real-time tracking details for Shipnix Express shipments.',
    robots: { index: false, follow: false },
  };
}

export default function TrackByIdPage({ params }: { params: { id: string } }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <Header />
      <PublicTrackingClient initialId={params.id} />
    </div>
  );
}
