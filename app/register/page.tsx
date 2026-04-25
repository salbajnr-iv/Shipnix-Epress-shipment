import RegisterForm from '@/components/register-form';
import { MaintenanceScreen, FeatureDisabledScreen } from '@/components/maintenance-screen';
import { getSiteConfig } from '@/lib/site-config.server';

export const metadata = {
  title: 'Create Your Account | Shipnix Express',
  description: 'Register for a Shipnix Express account to track shipments and request quotes.',
  robots: { index: false, follow: false },
};

export default async function RegisterPage() {
  const flags = (await getSiteConfig()).feature_flags;
  if (flags.maintenance_mode) {
    return <MaintenanceScreen message={flags.maintenance_message} />;
  }
  if (!flags.register_enabled) {
    return <FeatureDisabledScreen title="Sign-ups are temporarily disabled" />;
  }
  return <RegisterForm />;
}
