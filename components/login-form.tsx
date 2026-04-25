'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  LogIn, ShieldCheck, AlertCircle, ArrowLeft, Truck, Globe2, BarChart3, Sparkles,
} from 'lucide-react';
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

    router.push(adminMode ? '/admin' : '/');
    router.refresh();
  };

  const highlights = adminMode
    ? [
        { icon: ShieldCheck, label: 'Role-based access control', sub: 'Authorized personnel only' },
        { icon: BarChart3, label: 'Live operations dashboard', sub: 'Track every shipment in real time' },
        { icon: Globe2, label: 'Global network visibility', sub: '220+ countries connected' },
      ]
    : [
        { icon: Truck, label: 'Manage every shipment', sub: 'From pickup to delivery' },
        { icon: BarChart3, label: 'Real-time tracking', sub: 'Live updates at every step' },
        { icon: Globe2, label: 'Global coverage', sub: 'Trusted in 220+ countries' },
      ];

  return (
    <div className="auth-shell">
      {/* Brand panel */}
      <aside className="auth-brand-panel">
        <div className="absolute inset-0 pointer-events-none opacity-30">
          <div className="absolute -top-32 -left-32 w-96 h-96 bg-cyan-300/40 rounded-full blur-3xl animate-float" />
          <div className="absolute bottom-0 right-0 w-[28rem] h-[28rem] bg-amber-300/30 rounded-full blur-3xl animate-float-slow" />
        </div>

        <div className="relative">
          <Link href="/" className="inline-flex items-center gap-3 group">
            <div className="w-12 h-12 rounded-2xl bg-white/15 backdrop-blur border border-white/20 flex items-center justify-center group-hover:scale-105 transition-transform">
              <img src="/shipnix-logo.svg" alt="Shipnix Express" className="w-7 h-7 brightness-0 invert" />
            </div>
            <div>
              <p className="font-bold text-lg leading-tight">Shipnix Express</p>
              <p className="text-xs text-white/70 uppercase tracking-wider">Carrier Integrations</p>
            </div>
          </Link>
        </div>

        <div className="relative space-y-8">
          <div>
            <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur border border-white/20 px-3 py-1.5 rounded-full text-xs font-medium mb-5">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              {adminMode ? 'Operations Console' : 'Customer Portal'}
            </div>
            <h2 className="text-3xl xl:text-4xl font-extrabold leading-tight tracking-tight mb-4">
              {adminMode
                ? 'Run your global logistics from one console.'
                : 'Ship smarter. Track everything in one place.'}
            </h2>
            <p className="text-white/80 leading-relaxed max-w-md">
              {adminMode
                ? 'Centralize quotes, packages, and invoices with a single source of truth your whole team can rely on.'
                : 'Get instant quotes, manage shipments, and track every package in real time — all from a single dashboard.'}
            </p>
          </div>

          <ul className="space-y-3">
            {highlights.map(({ icon: Icon, label, sub }) => (
              <li key={label} className="flex items-start gap-3 p-3 rounded-xl bg-white/5 border border-white/10 backdrop-blur">
                <span className="w-9 h-9 rounded-lg bg-white/15 flex items-center justify-center flex-shrink-0">
                  <Icon className="w-4 h-4" />
                </span>
                <div>
                  <p className="font-semibold text-sm">{label}</p>
                  <p className="text-xs text-white/70">{sub}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-xs text-white/60">
          © {new Date().getFullYear()} Shipnix Express. All rights reserved.
        </p>
      </aside>

      {/* Form panel */}
      <section className="auth-form-panel">
        <div className="auth-form-card">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-indigo-600 transition-colors mb-8"
            data-testid="link-back-home"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to homepage
          </Link>

          {/* Mobile brand */}
          <div className="lg:hidden flex items-center gap-3 mb-6">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center shadow-md shadow-indigo-500/30">
              <img src="/shipnix-logo.svg" alt="Shipnix Express" className="w-6 h-6 brightness-0 invert" />
            </div>
            <div>
              <p className="font-bold text-slate-900 dark:text-white leading-tight">Shipnix Express</p>
              <p className="text-[11px] uppercase tracking-wider text-slate-500">Carrier Integrations</p>
            </div>
          </div>

          {adminMode && (
            <div className="inline-flex items-center gap-1.5 bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 px-3 py-1 rounded-full text-xs font-semibold mb-3">
              <ShieldCheck className="w-3 h-3" /> Admin Portal · Restricted
            </div>
          )}

          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white" data-testid="text-page-title">
            {adminMode ? 'Sign in to admin console' : 'Welcome back'}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1.5 mb-7">
            {adminMode
              ? 'Use your admin credentials to access the operations console.'
              : 'Sign in to manage your shipments, quotes, and invoices.'}
          </p>

          {errorMsg && (
            <div
              className="flex items-start gap-2.5 mb-5 p-3.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 text-sm text-red-800 dark:text-red-200"
              data-testid="text-login-error"
              role="alert"
            >
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span className="break-words whitespace-pre-line">{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="form-field">
              <Label htmlFor="email" className="form-label">Email address</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                required
                data-testid="input-email"
              />
            </div>
            <div className="form-field">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="form-label">Password</Label>
                {!adminMode && (
                  <Link href="#" className="text-xs text-indigo-600 hover:text-indigo-700 font-medium">
                    Forgot password?
                  </Link>
                )}
              </div>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
                data-testid="input-password"
              />
            </div>

            <Button
              type="submit"
              className="w-full h-12 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-semibold text-sm shadow-lg shadow-indigo-500/25 transition-all"
              disabled={loading}
              data-testid="button-submit"
            >
              <LogIn className="w-4 h-4 mr-2" />
              {loading ? 'Signing in…' : 'Sign In'}
            </Button>
          </form>

          {!adminMode && (
            <p className="text-center text-sm text-slate-500 dark:text-slate-400 mt-6">
              Don&apos;t have an account?{' '}
              <Link href="/register" className="text-indigo-600 hover:text-indigo-700 font-semibold" data-testid="link-register">
                Create an account
              </Link>
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
