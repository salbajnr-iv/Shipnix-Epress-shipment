import Link from 'next/link';
import { Wrench, Lock, Home } from 'lucide-react';

export function MaintenanceScreen({ message }: { message: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-br from-slate-50 via-indigo-50/40 to-cyan-50/40 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <div className="surface-card-elevated max-w-lg w-full p-10 text-center">
        <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/30">
          <Wrench className="w-8 h-8 text-white" />
        </div>
        <p className="text-[11px] uppercase tracking-[0.2em] font-semibold text-amber-600 dark:text-amber-400 mb-2">
          Scheduled Maintenance
        </p>
        <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white mb-3">
          We&rsquo;ll be right back
        </h1>
        <p className="text-slate-600 dark:text-slate-300 leading-relaxed">{message}</p>
      </div>
    </div>
  );
}

export function FeatureDisabledScreen({
  title = 'This page is currently unavailable',
  message = 'This feature has been temporarily disabled. Please check back later.',
}: {
  title?: string;
  message?: string;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-br from-slate-50 via-indigo-50/40 to-cyan-50/40 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <div className="surface-card-elevated max-w-lg w-full p-10 text-center">
        <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-gradient-to-br from-slate-600 to-slate-800 flex items-center justify-center shadow-lg">
          <Lock className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white mb-3">
          {title}
        </h1>
        <p className="text-slate-600 dark:text-slate-300 leading-relaxed mb-6">{message}</p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-sm font-medium shadow-lg shadow-indigo-500/30 hover:scale-105 transition-transform"
        >
          <Home className="w-4 h-4" />
          Back to Home
        </Link>
      </div>
    </div>
  );
}
