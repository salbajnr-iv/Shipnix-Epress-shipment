import Header from '@/components/header';
import FAQClient from '@/components/faq-client';

export const metadata = {
  title: 'Help Center & FAQ | Shipnix Express',
  description: 'Answers to common questions about tracking, quotes, deliveries, and Shipnix Express services.',
  openGraph: {
    title: 'Help Center & FAQ | Shipnix Express',
    description: 'Answers to common questions about Shipnix Express services.',
  },
};

export default function FAQPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <Header />
      <FAQClient />
    </div>
  );
}
