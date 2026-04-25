import LandingPage from '@/components/landing-page';

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

export default function Home() {
  return <LandingPage />;
}
