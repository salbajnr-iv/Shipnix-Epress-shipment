'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LogIn, ShieldCheck, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface LoginFormProps {
  adminMode?: boolean;
}

export default function LoginForm({ adminMode = false }: LoginFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const supabase = createClient();

  // If the user got bounced from /admin, look up what the server actually
  // sees them as so we can give an actionable error.
  useEffect(() => {
    const reason = searchParams.get('error');
    if (reason !== 'admin_only') {
      if (reason === 'not_signed_in') setErrorMsg('Please sign in to continue.');
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/auth/me', { cache: 'no-store', credentials: 'include' });
        const me = await res.json();
        if (cancelled) return;
        if (!me.authenticated) {
          setErrorMsg("Your session expired. Please sign in again.");
          return;
        }
        const serverEmail = me.email ?? '';
        setErrorMsg(
          `Server sees this account (${serverEmail}) as role "${me.role}". ` +
          `In the Supabase SQL Editor, run:\n\n` +
          `INSERT INTO public.profiles (id, email, role) ` +
          `SELECT id, email, 'admin' FROM auth.users ` +
          `WHERE LOWER(email) = LOWER('${serverEmail}') ` +
          `ON CONFLICT (id) DO UPDATE SET role = 'admin' RETURNING id, email, role;\n\n` +
          `Confirm it returns one row, sign out fully, then sign in again.`,
        );
      } catch {
        if (!cancelled) {
          setErrorMsg("That account isn't an admin. Promote it in Supabase, then sign in again.");
        }
      }
    })();
    return () => { cancelled = true; };
  }, [searchParams]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    const { data: signInData, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error || !signInData.user) {
      setErrorMsg(error?.message ?? 'Invalid email or password.');
      toast({ title: 'Login failed', description: error?.message ?? 'Invalid credentials', variant: 'destructive' });
      setLoading(false);
      return;
    }

    // Let the middleware handle the role check on the next navigation.
    // If the user isn't admin, middleware will bounce back here with
    // ?error=admin_only, and the useEffect above will then ask the server
    // for a precise diagnostic (cookies are guaranteed set by then).
    router.push(adminMode ? '/admin' : '/');
    router.refresh();
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-gradient-to-br from-indigo-700 via-violet-700 to-cyan-600">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-cyan-400/30 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-amber-400/20 rounded-full blur-3xl animate-float-slow" />
      </div>

      <Card className="w-full max-w-md relative bg-white/95 dark:bg-gray-900/95 backdrop-blur border-0 shadow-2xl rounded-3xl animate-fade-in-up">
        <CardHeader className="text-center pb-4">
          <Link href="/" className="mx-auto mb-4 group flex justify-center">
            <img
              src="/shipnix-logo.svg"
              alt="Shipnix Express"
              className="w-14 h-14 object-contain group-hover:scale-110 transition-transform duration-300"
              data-testid="img-logo"
            />
          </Link>
          {adminMode && (
            <div className="inline-flex items-center gap-1.5 mx-auto bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 px-3 py-1 rounded-full text-xs font-medium mb-2 w-fit">
              <ShieldCheck className="w-3 h-3" /> Admin Portal
            </div>
          )}
          <CardTitle className="text-2xl font-extrabold tracking-tight">
            {adminMode ? 'Admin Sign In' : 'Welcome back'}
          </CardTitle>
          <CardDescription>
            {adminMode
              ? 'Restricted access. Authorized personnel only.'
              : 'Sign in to manage your shipments and dashboard.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {errorMsg && (
            <div
              className="flex items-start gap-2 mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-sm text-red-800 dark:text-red-200"
              data-testid="text-login-error"
              role="alert"
            >
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span className="break-words">{errorMsg}</span>
            </div>
          )}
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                className="rounded-xl h-11"
                required
                data-testid="input-email"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="rounded-xl h-11"
                required
                data-testid="input-password"
              />
            </div>
            <Button
              type="submit"
              className="w-full rounded-full bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white py-6 font-semibold shadow-lg shadow-indigo-500/30 hover:scale-[1.01] transition-all"
              disabled={loading}
              data-testid="button-submit"
            >
              <LogIn className="w-4 h-4 mr-2" />
              {loading ? 'Signing in…' : 'Sign In'}
            </Button>
          </form>
          {!adminMode && (
            <p className="text-center text-sm text-muted-foreground mt-5">
              Don&apos;t have an account?{' '}
              <Link href="/register" className="text-indigo-600 hover:text-indigo-700 font-medium hover:underline">
                Register
              </Link>
            </p>
          )}
          <p className="text-center text-xs text-muted-foreground mt-4">
            <Link href="/" className="hover:text-indigo-600 transition-colors">← Back to homepage</Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
