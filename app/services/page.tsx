import Link from 'next/link';
import Header from '@/components/header';
import { Button } from '@/components/ui/button';
import { ArrowRight, CheckCircle2, Globe2, ShieldCheck, Clock, Sparkles } from 'lucide-react';
import { MaintenanceScreen, FeatureDisabledScreen } from '@/components/maintenance-screen';
import { publicConfig } from '@/lib/site-config';
import { getSiteConfig } from '@/lib/site-config.server';
import { getIcon } from '@/lib/icon-map';

export const metadata = {
  title: 'Services — Shipnix Express Shipment',
  description: 'Express, ground, freight, air, and sea — comprehensive logistics solutions for every shipment.',
};

const GRADIENTS = [
  'from-indigo-500 to-violet-600',
  'from-cyan-500 to-sky-600',
  'from-amber-500 to-orange-500',
  'from-violet-500 to-fuchsia-600',
  'from-sky-500 to-blue-700',
  'from-emerald-500 to-teal-600',
];

export default async function ServicesPage() {
  const config = publicConfig(await getSiteConfig());
  const flags = config.feature_flags;

  if (flags.maintenance_mode) {
    return <MaintenanceScreen message={flags.maintenance_message} />;
  }
  if (!flags.services_enabled) {
    return <FeatureDisabledScreen title="Services overview is currently unavailable" />;
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      <Header contact={config.contact} announcement={config.announcement} flags={flags} />

      {/* Hero */}
      <section className="relative py-20 px-4 overflow-hidden bg-gradient-to-br from-indigo-700 via-violet-700 to-cyan-600 text-white">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-amber-400/20 rounded-full blur-3xl animate-float" />
          <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-cyan-400/30 rounded-full blur-3xl animate-float-slow" />
        </div>
        <div className="relative max-w-5xl mx-auto text-center animate-fade-in-up">
          <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur border border-white/20 px-4 py-1.5 rounded-full text-sm mb-5">
            <Sparkles className="w-4 h-4 text-amber-300" /> Our Services
          </div>
          <h1 className="text-4xl md:text-6xl font-extrabold mb-5 tracking-tight">
            One platform.{' '}
            <span className="bg-gradient-to-r from-amber-300 to-cyan-200 bg-clip-text text-transparent">
              Every shipment type.
            </span>
          </h1>
          <p className="text-lg md:text-xl text-indigo-100 max-w-3xl mx-auto">
            From overnight envelopes to full ocean containers — we have the right service for every shipping need.
          </p>
        </div>
      </section>

      {/* Service Cards */}
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          {config.services.length === 0 ? (
            <p className="text-center text-gray-500 dark:text-gray-400">No services have been published yet.</p>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {config.services.map((s, i) => {
                const Icon = getIcon(s.icon);
                const gradient = GRADIENTS[i % GRADIENTS.length];
                return (
                  <div
                    key={`${s.title}-${i}`}
                    className="group relative bg-white dark:bg-gray-900 rounded-3xl p-8 border border-gray-100 dark:border-gray-800 hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 animate-fade-in-up"
                    style={{ animationDelay: `${i * 100}ms` }}
                  >
                    <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center mb-5 shadow-lg group-hover:scale-110 group-hover:rotate-6 transition-all`}>
                      <Icon className="w-8 h-8 text-white" strokeWidth={2} />
                    </div>
                    <h3 className="text-xl font-bold mb-3 text-gray-900 dark:text-white">{s.title}</h3>
                    <p className="text-gray-600 dark:text-gray-300 mb-5">{s.description}</p>
                    <ul className="space-y-2 mb-6">
                      {s.bullets.map(f => (
                        <li key={f} className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                          {f}
                        </li>
                      ))}
                    </ul>
                    {flags.quote_enabled && (
                      <Link href="/quote">
                        <Button variant="outline" className="w-full rounded-full border-gray-200 dark:border-gray-700 group-hover:border-indigo-500 group-hover:text-indigo-600 transition-colors">
                          Get a Quote <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                      </Link>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* Why Us */}
      <section className="py-20 px-4 bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-950">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12 animate-fade-in-up">
            <h2 className="text-3xl md:text-4xl font-extrabold mb-4 text-gray-900 dark:text-white tracking-tight">
              Backed by global infrastructure
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300">
              Whatever you ship, we have the network and expertise to deliver.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { icon: Globe2, title: 'Global Network', desc: '220+ countries with last-mile delivery partners.' },
              { icon: ShieldCheck, title: 'Fully Insured', desc: 'Every shipment is covered up to full declared value.' },
              { icon: Clock, title: 'On-Time Promise', desc: '99.9% on-time delivery with money-back guarantee.' },
            ].map(({ icon: Icon, title, desc }, i) => (
              <div
                key={title}
                className="text-center p-8 rounded-3xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 hover:shadow-xl hover:-translate-y-1 transition-all animate-fade-in-up"
                style={{ animationDelay: `${i * 120}ms` }}
              >
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-cyan-500 flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <Icon className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-lg font-bold mb-2 text-gray-900 dark:text-white">{title}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="rounded-3xl bg-gradient-to-br from-indigo-700 via-violet-700 to-cyan-600 p-10 md:p-14 text-white text-center shadow-2xl relative overflow-hidden">
            <div className="absolute -top-20 -left-20 w-72 h-72 bg-cyan-400/30 rounded-full blur-3xl animate-float" />
            <div className="relative">
              <h2 className="text-3xl md:text-4xl font-extrabold mb-4">Need a custom solution?</h2>
              <p className="text-indigo-100 text-lg mb-6">Talk to our logistics specialists today.</p>
              <div className="flex flex-wrap gap-3 justify-center">
                {flags.quote_enabled && (
                  <Link href="/quote">
                    <Button size="lg" className="rounded-full bg-amber-400 hover:bg-amber-300 text-indigo-900 hover:scale-105 transition-all shadow-xl px-7 font-semibold">
                      Get a Quote
                    </Button>
                  </Link>
                )}
                {flags.contact_enabled && (
                  <Link href="/contact">
                    <Button size="lg" variant="outline" className="rounded-full border-white/40 bg-white/10 backdrop-blur text-white hover:bg-white/20 px-7">
                      Talk to an Expert
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
