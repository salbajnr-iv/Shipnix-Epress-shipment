import QuoteManagementClient from '@/components/quote-management-client';

export const metadata = {
  title: 'Quote Management | Shipnix Admin',
  robots: { index: false, follow: false },
};

export default function QuotesPage() {
  return <QuoteManagementClient />;
}
