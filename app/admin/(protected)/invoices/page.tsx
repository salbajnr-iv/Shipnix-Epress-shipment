import InvoiceManagementClient from '@/components/invoice-management-client';

export const metadata = {
  title: 'Invoice Management | Shipnix Admin',
  robots: { index: false, follow: false },
};

export default function InvoicesPage() {
  return <InvoiceManagementClient />;
}
