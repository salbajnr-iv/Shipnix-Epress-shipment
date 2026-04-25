import AdminDashboardClient from '@/components/admin-dashboard-client';

export const metadata = {
  title: 'Admin Dashboard | Shipnix Admin',
  robots: { index: false, follow: false },
};

export default function AdminPage() {
  return <AdminDashboardClient />;
}
