'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import Header from './header';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useRouter } from 'next/navigation';
import {
  Search,
  Clock,
  MapPin,
  Zap,
  Truck,
  PackageCheck,
  ShieldCheck,
  Globe2,
  Timer,
  MessageCircle,
  Plane,
  Mail,
  Facebook,
  Twitter,
  Linkedin,
  Instagram,
  ArrowRight,
  Sparkles,
  TrendingUp,
  Headphones,
  Award,
  CheckCircle2,
  Boxes,
  Warehouse,
} from 'lucide-react';

const ROTATING_WORDS = [
  'Carrier Integrations',
  'Real-Time Tracking',
  'Instant Quotes',
  'Global Delivery',
  'Smart Logistics',
];

const SERVICES = [
  {
    icon: Zap,
    title: 'Express Delivery',
    desc: 'Lightning-fast shipping when every minute counts.',
    bullets: ['Next business day', 'International express', 'Time-definite delivery'],
    gradient: 'from-indigo-500 to-violet-600',
    bgGlow: 'bg-indigo-500/10',
  },
  {
    icon: Truck,
    title: 'Ground Shipping',
    desc: 'Cost-effective ground shipping at scale.',
    bullets: ['1-5 business days', 'Residential delivery', 'Commercial delivery'],
    gradient: 'from-cyan-500 to-sky-600',
    bgGlow: 'bg-cyan-500/10',
  },
  {
    icon: Warehouse,
    title: 'Freight & Logistics',
    desc: 'Less-than-truckload and full freight services.',
    bullets: ['LTL & FTL shipping', 'Freight management', 'Supply chain solutions'],
    gradient: 'from-amber-500 to-orange-500',
    bgGlow: 'bg-amber-500/10',
  },
];

const WHY_CHOOSE = [
  {
    icon: ShieldCheck,
    title: 'Secure & Insured',
    desc: 'End-to-end protection with full-value insurance on every shipment.',
    color: 'text-indigo-600 dark:text-indigo-400',
    bg: 'bg-indigo-100 dark:bg-indigo-900/40',
  },
  {
    icon: Globe2,
    title: 'Worldwide Reach',
    desc: 'Connect to 220+ countries through our global partner network.',
    color: 'text-cyan-600 dark:text-cyan-400',
    bg: 'bg-cyan-100 dark:bg-cyan-900/40',
  },
  {
    icon: Timer,
    title: 'Time-Definite',
    desc: 'Guaranteed delivery windows you can plan your business around.',
    color: 'text-amber-600 dark:text-amber-400',
    bg: 'bg-amber-100 dark:bg-amber-900/40',
  },
  {
    icon: Headphones,
    title: '24/7 Support',
    desc: 'Real humans available around the clock to answer your questions.',
    color: 'text-emerald-600 dark:text-emerald-400',
    bg: 'bg-emerald-100 dark:bg-emerald-900/40',
  },
];

const STATS = [
  { value: '220+', label: 'Countries' },
  { value: '99.9%', label: 'On-time Rate' },
  { value: '24/7', label: 'Support' },
  { value: '5M+', label: 'Shipments' },
];

const STEPS = [
  { num: '01', title: 'Request a Quote', desc: 'Tell us about your shipment in seconds.' },
  { num: '02', title: 'Drop or Pickup', desc: 'Drop at any partner location or schedule a pickup.' },
  { num: '03', title: 'Track Live', desc: 'Watch your shipment move in real time.' },
  { num: '04', title: 'Delivered', desc: 'Signed, sealed, and delivered worldwide.' },
];

export default function LandingPage() {
  const [trackingInput, setTrackingInput] = useState('');
  const [isTracking, setIsTracking] = useState(false);
  const [wordIndex, setWordIndex] = useState(0);
  const router = useRouter();

  useEffect(() => {
    const id = setInterval(() => {
      setWordIndex(i => (i + 1) % ROTATING_WORDS.length);
    }, 2600);
    return () => clearInterval(id);
  }, []);

  const handleTrack = (e: React.FormEvent) => {
    e.preventDefault();
    const first = trackingInput.split('\n').map(s => s.trim()).find(Boolean);
    if (!first) return;
    setIsTracking(true);
    router.push(`/track/${first.toUpperCase()}`);
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 overflow-hidden">
      <Header />

      {/* Hero Section */}
      <section className="relative bg-white dark:bg-gray-950 pt-12 pb-16 lg:pt-20 lg:pb-24 px-4">
        {/* Soft decorative background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-24 -left-24 w-[28rem] h-[28rem] bg-indigo-200/40 dark:bg-indigo-900/20 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-0 w-[22rem] h-[22rem] bg-cyan-200/40 dark:bg-cyan-900/20 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-7xl mx-auto z-10">
          <div className="grid lg:grid-cols-3 gap-8 lg:gap-5 items-center">
            {/* Left: copy */}
            <div className="order-2 lg:order-1 lg:col-span-2 animate-fade-in-up">
              <div className="flex flex-col space-y-6 lg:px-10">
                <h1
                  className="font-extrabold text-gray-900 dark:text-white text-3xl md:text-5xl lg:text-6xl leading-[1.1] tracking-tight"
                  data-testid="text-hero-title"
                >
                  Streamline your shipping with our all-in-one solution for{' '}
                  <span
                    key={wordIndex}
                    className="inline-block text-indigo-600 dark:text-indigo-400 animate-word-rotate"
                  >
                    {ROTATING_WORDS[wordIndex]}
                  </span>
                </h1>

                <p className="tracking-wide text-gray-600 dark:text-gray-300 text-base md:text-lg max-w-2xl">
                  A custom-built, cloud-based logistics platform designed to save you time, effort,
                  and money while you grow your business. Handle every shipment with ease using
                  Shipnix.
                </p>

                <div className="flex flex-wrap gap-3 pt-2">
                  <Link href="/register">
                    <Button
                      size="lg"
                      className="rounded-md bg-indigo-600 hover:bg-indigo-500 text-white px-7 py-6 text-sm tracking-wide font-medium shadow-lg shadow-indigo-500/30 transition-all"
                      data-testid="button-get-started"
                    >
                      Get Started For Free <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </Link>
                  <Link href="/track">
                    <Button
                      size="lg"
                      variant="outline"
                      className="rounded-md border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 hover:border-indigo-500 hover:text-indigo-600 px-7 py-6 text-sm tracking-wide font-medium"
                      data-testid="button-track-shipment"
                    >
                      Track a Shipment
                    </Button>
                  </Link>
                </div>

                <div className="grid grid-cols-2 gap-6 pt-4 max-w-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center shrink-0">
                      <Clock className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900 dark:text-white text-sm">Next-Day</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">Delivery Available</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-cyan-100 dark:bg-cyan-900/40 flex items-center justify-center shrink-0">
                      <MapPin className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900 dark:text-white text-sm">220+ Countries</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">Worldwide Coverage</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: SVG illustration */}
            <div className="order-1 lg:order-2 lg:col-span-1 animate-fade-in-up delay-200">
              <div className="flex items-center justify-center lg:-translate-x-4">
                <Image
                  src="/shipnix-hero.svg"
                  alt="Shipnix shipping illustration"
                  width={720}
                  height={706}
                  priority
                  className="w-full h-auto max-w-md lg:max-w-none animate-float-slow"
                  data-testid="img-hero-illustration"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-12 px-4 bg-white dark:bg-gray-950">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {STATS.map((s, i) => (
              <div
                key={s.label}
                className={`text-center p-6 rounded-3xl bg-gradient-to-br from-gray-50 to-white dark:from-gray-900 dark:to-gray-900 border border-gray-100 dark:border-gray-800 hover:shadow-lg hover:-translate-y-1 transition-all animate-fade-in-up`}
                style={{ animationDelay: `${i * 100}ms` }}
              >
                <div className="text-3xl md:text-4xl font-extrabold bg-gradient-to-r from-indigo-600 to-cyan-500 bg-clip-text text-transparent">
                  {s.value}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400 mt-2 font-medium">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Tracking Section */}
      <section className="py-20 px-4 bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-950">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12 animate-fade-in-up">
            <div className="inline-flex items-center gap-2 bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 px-4 py-1.5 rounded-full text-sm font-medium mb-4">
              <Search className="w-4 h-4" /> Live Tracking
            </div>
            <h2 className="text-3xl md:text-5xl font-extrabold mb-4 text-gray-900 dark:text-white tracking-tight">
              Track Your Shipment
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Enter your tracking number for real-time status updates and complete delivery history.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-xl shadow-indigo-500/5 p-8 border border-gray-100 dark:border-gray-800 hover:shadow-2xl transition-shadow animate-fade-in-up">
              <h3 className="text-xl font-bold mb-6 text-gray-900 dark:text-white flex items-center gap-2">
                <PackageCheck className="w-5 h-5 text-indigo-600" />
                Enter Tracking Information
              </h3>
              <form onSubmit={handleTrack} className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-4 top-4 w-4 h-4 text-gray-400" />
                  <Textarea
                    value={trackingInput}
                    onChange={e => setTrackingInput(e.target.value)}
                    placeholder="Enter your tracking number(s) — one per line"
                    className="w-full pl-11 pt-3.5 min-h-32 resize-none rounded-2xl border-gray-200 dark:border-gray-700 focus-visible:ring-indigo-500"
                    data-testid="input-tracking"
                  />
                </div>
                <Button
                  type="submit"
                  disabled={isTracking || !trackingInput.trim()}
                  className="w-full rounded-full bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white py-6 text-base font-semibold shadow-lg shadow-indigo-500/30 hover:scale-[1.02] transition-all"
                  data-testid="button-track"
                >
                  {isTracking ? 'Tracking…' : 'Track Now'} <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </form>

              <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-800 grid grid-cols-2 gap-3">
                <Link href="/track">
                  <Button variant="outline" className="w-full rounded-full border-gray-200 dark:border-gray-700 hover:border-indigo-500 hover:text-indigo-600 transition-colors" data-testid="button-track-reference">
                    By Reference
                  </Button>
                </Link>
                <Link href="/track">
                  <Button variant="outline" className="w-full rounded-full border-gray-200 dark:border-gray-700 hover:border-indigo-500 hover:text-indigo-600 transition-colors" data-testid="button-track-doortag">
                    By Door Tag
                  </Button>
                </Link>
              </div>
            </div>

            <div className="bg-gradient-to-br from-indigo-600 via-violet-600 to-cyan-600 rounded-3xl p-8 text-white shadow-xl shadow-indigo-500/20 flex flex-col justify-center relative overflow-hidden animate-fade-in-up delay-200">
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-2xl" />
              <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-cyan-300/20 rounded-full blur-2xl" />

              <div className="relative">
                <div className="w-14 h-14 rounded-2xl bg-white/15 backdrop-blur flex items-center justify-center mb-5 animate-float">
                  <TrendingUp className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-2xl font-bold mb-3">Real-Time Visibility</h3>
                <p className="text-indigo-100 mb-6 leading-relaxed">
                  Watch your packages move across cities, hubs, and continents — with instant push updates the moment something changes.
                </p>
                <ul className="space-y-2.5 mb-6 text-sm">
                  {['Live GPS-style status updates', 'Email & SMS notifications', 'Full delivery history & proof'].map(item => (
                    <li key={item} className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-amber-300 shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
                <Link href="/track">
                  <Button className="rounded-full bg-white text-indigo-700 hover:bg-amber-300 hover:scale-105 transition-all" data-testid="button-go-tracking">
                    Open Full Tracking <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Free to Use — featured panel */}
      <section className="relative bg-gray-900 dark:bg-black overflow-hidden">
        <div className="max-w-7xl mx-auto px-5 lg:px-20 pt-8 lg:pt-12">
          <div className="grid grid-cols-7 gap-2 items-end">
            {/* Left character */}
            <div className="relative col-span-2 lg:col-span-2 flex items-end justify-start">
              <div className="absolute bottom-10 left-0 z-0 hidden h-56 w-40 -skew-y-[30deg] bg-gradient-to-b from-gray-700/60 to-transparent lg:block" />
              <Image
                src="/section4-character.svg"
                alt="Shipnix character"
                width={96}
                height={445}
                className="relative z-10 w-20 sm:w-24 md:w-28 lg:w-auto lg:h-[22rem] h-auto"
                data-testid="img-free-character"
              />
            </div>

            {/* Center card */}
            <div className="col-span-3 lg:col-span-3">
              <div className="rounded-2xl rounded-b-none p-[1px] bg-gradient-to-b from-gray-600 to-gray-900">
                <div className="rounded-2xl rounded-b-none p-5 sm:p-6 lg:p-8 bg-gray-900 dark:bg-black space-y-5 lg:space-y-6">
                  <div className="flex flex-col space-y-3 lg:space-y-4">
                    <h2
                      className="font-bold text-white text-xl sm:text-2xl md:text-3xl lg:text-4xl leading-tight tracking-tight"
                      data-testid="text-free-headline"
                    >
                      Shipnix is free to use
                    </h2>
                    <p className="text-gray-300 text-xs sm:text-sm md:text-base leading-relaxed">
                      By leveraging the shipping volume directed to our partner carriers, we offer
                      Shipnix to our users free of charge — empowering businesses like yours to
                      gain a competitive advantage.
                    </p>
                  </div>

                  <div className="flex flex-col items-center space-y-4">
                    <div className="grid w-full grid-cols-1 gap-2 lg:gap-3 rounded-xl border border-gray-700 p-3 sm:p-4 sm:grid-cols-2">
                      {[
                        'Unlimited users',
                        'No monthly cost',
                        'Unlimited orders',
                        'No label limits',
                      ].map(feature => (
                        <div key={feature} className="flex items-center space-x-2">
                          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-indigo-500">
                            <CheckCircle2 className="w-3 h-3 text-gray-300" strokeWidth={2.5} />
                          </span>
                          <span className="tracking-wide text-white text-xs sm:text-sm">
                            {feature}
                          </span>
                        </div>
                      ))}
                    </div>

                    <Link href="/register">
                      <Button
                        className="rounded-md bg-indigo-500 hover:bg-indigo-400 text-white px-8 py-5 text-sm tracking-wide"
                        data-testid="button-start-shipping"
                      >
                        Start shipping
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            </div>

            {/* Right illustration */}
            <div className="col-span-2 lg:col-span-2 flex items-end justify-end animate-fade-in-up">
              <Image
                src="/section4-illustration.svg"
                alt="Shipnix is free to use"
                width={456}
                height={300}
                className="w-auto h-44 sm:h-56 md:h-64 lg:h-72 max-w-full"
                data-testid="img-free-illustration"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Services */}
      <section className="py-20 px-4 bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-950">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14 animate-fade-in-up">
            <div className="inline-flex items-center gap-2 bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 px-4 py-1.5 rounded-full text-sm font-medium mb-4">
              <Award className="w-4 h-4" /> Our Services
            </div>
            <h2 className="text-3xl md:text-5xl font-extrabold mb-4 text-gray-900 dark:text-white tracking-tight">
              Built for Every Shipment
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300">
              Whether it's a single envelope or a full container, we have you covered.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 mb-16">
            {SERVICES.map(({ icon: Icon, title, desc, bullets, gradient, bgGlow }, i) => (
              <div
                key={title}
                className="group relative bg-white dark:bg-gray-900 rounded-3xl p-8 border border-gray-100 dark:border-gray-800 hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 animate-fade-in-up"
                style={{ animationDelay: `${i * 120}ms` }}
                data-testid={`card-service-${title.toLowerCase().replace(/\s+/g, '-')}`}
              >
                <div className={`absolute inset-0 ${bgGlow} rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity blur-xl`} />
                <div className="relative">
                  <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center mb-5 shadow-lg group-hover:scale-110 group-hover:rotate-6 transition-all duration-300`}>
                    <Icon className="w-8 h-8 text-white" strokeWidth={2} />
                  </div>
                  <h3 className="text-xl font-bold mb-3 text-gray-900 dark:text-white">{title}</h3>
                  <p className="text-gray-600 dark:text-gray-300 mb-5">{desc}</p>
                  <ul className="space-y-2 mb-6">
                    {bullets.map(b => (
                      <li key={b} className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                        {b}
                      </li>
                    ))}
                  </ul>
                  <Link href="/services">
                    <Button variant="outline" className="w-full rounded-full border-gray-200 dark:border-gray-700 group-hover:border-indigo-500 group-hover:text-indigo-600 transition-colors">
                      Learn More <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>

          {/* Why Choose Us */}
          <div className="text-center mb-12 animate-fade-in-up">
            <h3 className="text-2xl md:text-3xl font-extrabold text-gray-900 dark:text-white mb-3">Why Choose Shipnix</h3>
            <p className="text-gray-600 dark:text-gray-300">Reasons businesses ship with us every day.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {WHY_CHOOSE.map(({ icon: Icon, title, desc, color, bg }, i) => (
              <div
                key={title}
                className="text-center p-6 rounded-3xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 hover:shadow-lg hover:-translate-y-1 transition-all animate-fade-in-up"
                style={{ animationDelay: `${i * 100}ms` }}
              >
                <div className={`w-14 h-14 rounded-2xl ${bg} flex items-center justify-center mx-auto mb-4`}>
                  <Icon className={`w-7 h-7 ${color}`} strokeWidth={2} />
                </div>
                <h4 className="text-lg font-bold mb-2 text-gray-900 dark:text-white">{title}</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-700 via-violet-700 to-cyan-600 p-10 md:p-14 text-white shadow-2xl">
            <div className="absolute -top-20 -right-20 w-72 h-72 bg-amber-400/20 rounded-full blur-3xl animate-float" />
            <div className="absolute -bottom-20 -left-20 w-72 h-72 bg-cyan-400/30 rounded-full blur-3xl animate-float-slow" />
            <div className="relative grid md:grid-cols-2 gap-8 items-center">
              <div>
                <h2 className="text-3xl md:text-4xl font-extrabold mb-4 leading-tight">
                  Ready to ship with confidence?
                </h2>
                <p className="text-indigo-100 text-lg mb-6">
                  Get an instant quote in under 60 seconds — no signup required.
                </p>
                <div className="flex flex-wrap gap-3">
                  <Link href="/quote">
                    <Button size="lg" className="rounded-full bg-amber-400 hover:bg-amber-300 text-indigo-900 hover:scale-105 transition-all shadow-xl px-7 font-semibold" data-testid="button-cta-quote">
                      Get Instant Quote
                    </Button>
                  </Link>
                  <Link href="/contact">
                    <Button size="lg" variant="outline" className="rounded-full border-white/40 bg-white/10 backdrop-blur text-white hover:bg-white/20 hover:scale-105 transition-all px-7" data-testid="button-cta-contact">
                      Talk to Sales
                    </Button>
                  </Link>
                </div>
              </div>
              <div className="hidden md:flex justify-center">
                <div className="relative">
                  <div className="w-48 h-48 rounded-full bg-white/10 backdrop-blur border border-white/20 flex items-center justify-center animate-float">
                    <PackageCheck className="w-24 h-24 text-amber-300" strokeWidth={1.5} />
                  </div>
                  <div className="absolute -top-4 -right-4 w-16 h-16 rounded-full bg-cyan-400/30 backdrop-blur border border-cyan-300/40 flex items-center justify-center animate-bounce-slow">
                    <Plane className="w-8 h-8 text-cyan-100" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-950 text-gray-300 pt-16 pb-8 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
            <div>
              <Link href="/" className="flex items-center gap-2 mb-4 group">
                <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 via-violet-600 to-cyan-500 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                  <PackageCheck className="w-5 h-5 text-white" strokeWidth={2.5} />
                </div>
                <div className="text-lg font-extrabold">
                  <span className="bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">Shipnix</span>{' '}
                  <span className="text-white">Express</span>
                </div>
              </Link>
              <p className="text-gray-400 mb-4 text-sm leading-relaxed">
                Connecting people and possibilities around the world with reliable, modern logistics.
              </p>
              <p className="text-gray-400 text-sm mb-4 flex items-center gap-2">
                <Mail className="w-4 h-4 text-indigo-400" />
                support@shipnix-express.com
              </p>
              <div className="flex gap-2">
                {[
                  { Icon: Facebook, label: 'Facebook' },
                  { Icon: Twitter, label: 'Twitter' },
                  { Icon: Linkedin, label: 'LinkedIn' },
                  { Icon: Instagram, label: 'Instagram' },
                ].map(({ Icon, label }) => (
                  <a
                    key={label}
                    href="#"
                    aria-label={label}
                    className="w-9 h-9 bg-gray-800 hover:bg-indigo-600 rounded-full flex items-center justify-center transition-colors hover:scale-110 transform duration-200"
                  >
                    <Icon className="w-4 h-4" />
                  </a>
                ))}
              </div>
            </div>

            <div>
              <h4 className="font-bold mb-4 text-white">Company</h4>
              <ul className="space-y-2.5 text-sm">
                <li><Link href="/about" className="hover:text-indigo-400 transition-colors">About Us</Link></li>
                <li><Link href="/services" className="hover:text-indigo-400 transition-colors">Services</Link></li>
                <li><Link href="/contact" className="hover:text-indigo-400 transition-colors">Contact</Link></li>
                <li><Link href="/faq" className="hover:text-indigo-400 transition-colors">FAQ</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold mb-4 text-white">Solutions</h4>
              <ul className="space-y-2.5 text-sm">
                <li><Link href="/services" className="hover:text-indigo-400 transition-colors">Express Delivery</Link></li>
                <li><Link href="/services" className="hover:text-indigo-400 transition-colors">Ground Shipping</Link></li>
                <li><Link href="/services" className="hover:text-indigo-400 transition-colors">Freight & Logistics</Link></li>
                <li><Link href="/quote" className="hover:text-indigo-400 transition-colors">Get a Quote</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold mb-4 text-white">Support</h4>
              <ul className="space-y-2.5 text-sm">
                <li><Link href="/track" className="hover:text-indigo-400 transition-colors">Track Shipment</Link></li>
                <li><Link href="/faq" className="hover:text-indigo-400 transition-colors">Help Center</Link></li>
                <li><Link href="/contact" className="hover:text-indigo-400 transition-colors">Customer Care</Link></li>
                <li><a href="https://wa.me/14093823874" target="_blank" rel="noopener noreferrer" className="hover:text-indigo-400 transition-colors">WhatsApp Us</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-gray-400">
            <div>© {new Date().getFullYear()} Shipnix Express Shipment. All rights reserved.</div>
            <div className="flex flex-wrap gap-5">
              <Link href="/about" className="hover:text-white transition-colors">About</Link>
              <Link href="/contact" className="hover:text-white transition-colors">Contact</Link>
              <Link href="/faq" className="hover:text-white transition-colors">FAQ</Link>
            </div>
          </div>
        </div>
      </footer>

      {/* Floating WhatsApp */}
      <a
        href="https://wa.me/14093823874"
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 z-50 group"
        aria-label="Chat on WhatsApp"
        data-testid="link-whatsapp-float"
      >
        <span className="absolute inset-0 rounded-full bg-emerald-400/40 animate-pulse-ring" />
        <span className="relative w-14 h-14 bg-emerald-500 hover:bg-emerald-600 rounded-full flex items-center justify-center text-white shadow-2xl group-hover:scale-110 transition-transform">
          <MessageCircle className="w-7 h-7" />
        </span>
      </a>
    </div>
  );
}
