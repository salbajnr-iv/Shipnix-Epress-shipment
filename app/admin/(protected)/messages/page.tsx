import MessagesManagementClient from '@/components/messages-management-client';

export const metadata = {
  title: 'Contact Inbox | Shipnix Admin',
  robots: { index: false, follow: false },
};

export default function MessagesPage() {
  return <MessagesManagementClient />;
}
