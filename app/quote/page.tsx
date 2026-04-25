import Header from '@/components/header';
import QuoteRequestClient from '@/components/quote-request-client';

export const metadata = {
  title: 'Get an Instant Shipping Quote | Shipnix Express',
  description: 'Request a free, instant quote for global shipping. Transparent pricing in seconds.',
  openGraph: {
    title: 'Instant Shipping Quote | Shipnix Express',
    description: 'Free, instant quotes for shipments to 220+ countries.',
  },
};

export default function QuotePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <Header />
      <QuoteRequestClient />
    </div>
  );
}
