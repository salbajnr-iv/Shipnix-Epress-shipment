'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import {
  ArrowLeft, UserPlus, Truck, Globe2, Sparkles, BarChart3, CheckCircle2,
} from 'lucide-react';

export default function RegisterForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  const supabase = createClient();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    });
    if (error) {
      toast({ title: 'Registration failed', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Account created!', description: 'Check your email to confirm your account.' });
      router.push('/login');
    }
    setLoading(false);
  };

  return (
    <div className="auth-shell">
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
              <Sparkles className="w-3.5 h-3.5 text-amber-300" /> Get started in seconds
            </div>
            <h2 className="text-3xl xl:text-4xl font-extrabold leading-tight tracking-tight mb-4">
              Join the all-in-one shipping platform.
            </h2>
            <p className="text-white/80 leading-relaxed max-w-md">
              Create an account to send instant quotes, track shipments live, and manage every package from one dashboard.
            </p>
          </div>

          <ul className="space-y-3">
            {[
              { icon: Truck, label: 'Instant shipping quotes', sub: 'Pricing in under 30 seconds' },
              { icon: BarChart3, label: 'Live tracking dashboard', sub: 'Updates at every checkpoint' },
              { icon: Globe2, label: 'Worldwide delivery', sub: 'Trusted in 220+ countries' },
            ].map(({ icon: Icon, label, sub }) => (
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

      <section className="auth-form-panel">
        <div className="auth-form-card">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-indigo-600 transition-colors mb-8"
            data-testid="link-back-home"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to homepage
          </Link>

          <div className="lg:hidden flex items-center gap-3 mb-6">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center shadow-md shadow-indigo-500/30">
              <img src="/shipnix-logo.svg" alt="Shipnix Express" className="w-6 h-6 brightness-0 invert" />
            </div>
            <div>
              <p className="font-bold text-slate-900 dark:text-white leading-tight">Shipnix Express</p>
              <p className="text-[11px] uppercase tracking-wider text-slate-500">Carrier Integrations</p>
            </div>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white" data-testid="text-page-title">
            Create your account
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1.5 mb-7">
            Set up your Shipnix Express account in less than a minute.
          </p>

          <form onSubmit={handleRegister} className="space-y-4">
            <div className="form-field">
              <Label htmlFor="name" className="form-label">Full name</Label>
              <Input
                id="name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Jane Doe"
                required
                data-testid="input-name"
              />
            </div>
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
              <Label htmlFor="password" className="form-label">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={6}
                placeholder="At least 6 characters"
                required
                data-testid="input-password"
              />
              <p className="form-help flex items-center gap-1.5">
                <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                Use 6+ characters with a mix of letters and numbers.
              </p>
            </div>

            <Button
              type="submit"
              className="w-full h-12 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-semibold text-sm shadow-lg shadow-indigo-500/25 transition-all"
              disabled={loading}
              data-testid="button-submit"
            >
              <UserPlus className="w-4 h-4 mr-2" />
              {loading ? 'Creating account…' : 'Create Account'}
            </Button>

            <p className="text-[11px] text-center text-slate-400 dark:text-slate-500 leading-relaxed">
              By creating an account, you agree to our Terms of Service and Privacy Policy.
            </p>
          </form>

          <p className="text-center text-sm text-slate-500 dark:text-slate-400 mt-6">
            Already have an account?{' '}
            <Link href="/login" className="text-indigo-600 hover:text-indigo-700 font-semibold" data-testid="link-login">
              Sign in
            </Link>
          </p>
        </div>
      </section>
    </div>
  );
}
