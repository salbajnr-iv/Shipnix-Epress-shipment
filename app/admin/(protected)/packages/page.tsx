import PackageManagementClient from '@/components/package-management-client';

export const metadata = {
  title: 'Package Management | Shipnix Admin',
  robots: { index: false, follow: false },
};

export default function PackagesPage() {
  return <PackageManagementClient />;
}
