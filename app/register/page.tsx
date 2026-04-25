import RegisterForm from '@/components/register-form';

export const metadata = {
  title: 'Create Your Account | Shipnix Express',
  description: 'Register for a Shipnix Express account to track shipments and request quotes.',
  robots: { index: false, follow: false },
};

export default function RegisterPage() {
  return <RegisterForm />;
}
