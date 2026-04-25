import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export type AuthSuccess = {
  ok: true;
  userId: string;
  email: string | null;
  role: 'admin' | 'customer';
  supabase: Awaited<ReturnType<typeof createClient>>;
};

export type AuthFailure = {
  ok: false;
  response: NextResponse;
};

/**
 * Resolve the current session and load the role from the profiles table.
 * Returns either an `ok: true` payload or an `ok: false` payload with a NextResponse to return.
 */
export async function getSessionWithRole(): Promise<AuthSuccess | AuthFailure> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return {
      ok: false,
      response: NextResponse.json({ message: 'Unauthorized' }, { status: 401 }),
    };
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();

  const role = (profile?.role as 'admin' | 'customer' | undefined) ?? 'customer';

  return {
    ok: true,
    userId: user.id,
    email: user.email ?? null,
    role,
    supabase,
  };
}

/**
 * Require an authenticated admin. Returns either the auth payload or a NextResponse
 * (401 if not signed in, 403 if not admin) to short-circuit the route handler.
 */
export async function requireAdmin(): Promise<AuthSuccess | AuthFailure> {
  const session = await getSessionWithRole();
  if (!session.ok) return session;

  if (session.role !== 'admin') {
    return {
      ok: false,
      response: NextResponse.json({ message: 'Forbidden' }, { status: 403 }),
    };
  }

  return session;
}

/**
 * Look up the role for an arbitrary user ID using the same supabase client.
 */
export async function getRoleForUser(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
): Promise<'admin' | 'customer'> {
  const { data } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .maybeSingle();
  return (data?.role as 'admin' | 'customer' | undefined) ?? 'customer';
}
