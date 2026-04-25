import LoginForm from '@/components/login-form';

export const metadata = {
  title: 'Sign In | Shipnix Express',
  description: 'Sign in to your Shipnix Express account to manage shipments and quotes.',
  robots: { index: false, follow: false },
};

export default function LoginPage() {
  return <LoginForm />;
}
