'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Rocket, LogIn, ShieldCheck, AlertCircle } from 'lucide-react';
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

  // Surface the bounced-from-middleware reason so the user understands.
  useEffect(() => {
    const reason = searchParams.get('error');
    if (reason === 'admin_only') {
      setErrorMsg("That account isn't an admin. Ask an existing admin to promote it in Supabase.");
    } else if (reason === 'not_signed_in') {
      setErrorMsg('Please sign in to continue.');
    }
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

    if (adminMode) {
      // Verify role on the SERVER (cache: 'no-store' avoids any stale read,
      // and the server uses fresh cookies so it sees the just-issued JWT).
      let role: string = 'customer';
      let serverEmail: string | null = null;
      try {
        const meRes = await fetch('/api/auth/me', { cache: 'no-store', credentials: 'include' });
        const me = await meRes.json();
        if (!me.authenticated) {
          setErrorMsg("Sign-in succeeded but the server can't see your session yet. Refresh the page and try again.");
          setLoading(false);
          return;
        }
        role = me.role ?? 'customer';
        serverEmail = me.email ?? null;
      } catch {
        setErrorMsg("Couldn't verify your role with the server. Please retry.");
        setLoading(false);
        return;
      }

      if (role !== 'admin') {
        setErrorMsg(
          `Server sees this account (${serverEmail ?? email}) as role "${role}". ` +
          `In the Supabase SQL Editor, run:\n\n` +
          `INSERT INTO public.profiles (id, email, role) ` +
          `SELECT id, email, 'admin' FROM auth.users ` +
          `WHERE LOWER(email) = LOWER('${serverEmail ?? email}') ` +
          `ON CONFLICT (id) DO UPDATE SET role = 'admin' RETURNING id, email, role;\n\n` +
          `Confirm it returns one row, then sign in again.`,
        );
        await supabase.auth.signOut();
        setLoading(false);
        return;
      }
    }

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
          <Link href="/" className="mx-auto mb-4 group">
            <div className="w-14 h-14 bg-gradient-to-br from-indigo-600 via-violet-600 to-cyan-500 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/30 group-hover:scale-110 group-hover:rotate-6 transition-all">
              <Rocket className="w-7 h-7 text-white" strokeWidth={2.5} />
            </div>
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
