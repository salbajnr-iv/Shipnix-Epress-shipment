import AdminSidebar from '@/components/admin-sidebar';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabaseConfigured = !!(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  if (!supabaseConfigured) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-950 p-8">
        <div className="surface-card-elevated p-8 max-w-md w-full text-center">
          <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 flex items-center justify-center text-2xl">
            ⚙️
          </div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Setup Required</h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
            Add your Supabase credentials to enable authentication.
          </p>
          <div className="text-left bg-slate-50 dark:bg-slate-800 rounded-lg p-4 text-xs font-mono space-y-1 border border-slate-200 dark:border-slate-700">
            <p className="text-indigo-600 dark:text-indigo-400">NEXT_PUBLIC_SUPABASE_URL</p>
            <p className="text-indigo-600 dark:text-indigo-400">NEXT_PUBLIC_SUPABASE_ANON_KEY</p>
          </div>
          <p className="text-xs text-slate-500 mt-4">
            Add these in the Secrets/Environment panel, then reload.
          </p>
        </div>
      </div>
    );
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  return (
    <div className="flex min-h-screen app-shell">
      <AdminSidebar user={user} />
      <main className="flex-1 min-w-0 overflow-x-hidden">
        {children}
      </main>
    </div>
  );
}
