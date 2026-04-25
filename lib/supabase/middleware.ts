import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function updateSession(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.next({ request });
  }

  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        );
      },
    },
  });

  const { data: { user } } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;
  const publicAdminRoutes = ['/admin/login'];
  const protectedRoutes = ['/admin'];
  const isPublicAdmin = publicAdminRoutes.some(r => pathname === r || pathname.startsWith(r + '/'));
  const isProtected = !isPublicAdmin && protectedRoutes.some(r => pathname.startsWith(r));

  if (isProtected) {
    if (!user) {
      const url = request.nextUrl.clone();
      url.pathname = '/admin/login';
      return NextResponse.redirect(url);
    }

    // Check the role for any /admin/* page.
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle();

    if ((profile?.role ?? 'customer') !== 'admin') {
      const url = request.nextUrl.clone();
      url.pathname = '/';
      url.searchParams.set('error', 'admin_only');
      return NextResponse.redirect(url);
    }
  }

  return supabaseResponse;
}
