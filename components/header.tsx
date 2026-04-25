'use client';

import Link from 'next/link';
import { useTheme } from 'next-themes';
import { Sun, Moon, Search, Globe, Mail, MessageCircle, Menu, X, Megaphone, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { DEFAULT_CONFIG, type ContactConfig, type AnnouncementConfig, type FeatureFlags } from '@/lib/site-config';

const NAV_LINKS = [
  { href: '/track',    label: 'Track',     flag: 'tracking_enabled' as const },
  { href: '/services', label: 'Services',  flag: 'services_enabled' as const },
  { href: '/quote',    label: 'Get Quote', flag: 'quote_enabled' as const },
  { href: '/about',    label: 'About',     flag: null },
  { href: '/contact',  label: 'Contact',   flag: 'contact_enabled' as const },
  { href: '/faq',      label: 'Support',   flag: 'faq_enabled' as const },
];

export type HeaderProps = {
  contact?: ContactConfig;
  announcement?: AnnouncementConfig;
  flags?: FeatureFlags;
};

export default function Header({ contact, announcement, flags }: HeaderProps) {
  const { theme, setTheme } = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  const c = contact ?? DEFAULT_CONFIG.contact;
  const a = announcement ?? DEFAULT_CONFIG.announcement;
  const f = flags ?? DEFAULT_CONFIG.feature_flags;

  const visibleLinks = NAV_LINKS.filter((l) => !l.flag || f[l.flag]);

  return (
    <header className="sticky top-0 z-50 border-b bg-white/80 dark:bg-gray-950/80 backdrop-blur-xl supports-[backdrop-filter]:bg-white/60">
      {/* Announcement Banner */}
      {a.enabled && a.message && (
        <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500 text-white text-sm">
          <div className="max-w-7xl mx-auto px-4 py-2 flex items-center justify-center gap-2 flex-wrap text-center">
            <Megaphone className="w-4 h-4 shrink-0" />
            <span className="font-medium">{a.message}</span>
            {a.link && a.link_label && (
              <Link
                href={a.link}
                className="inline-flex items-center gap-1 underline underline-offset-2 hover:opacity-80"
                data-testid="link-announcement"
              >
                {a.link_label}
                <ArrowRight className="w-3 h-3" />
              </Link>
            )}
          </div>
        </div>
      )}

      {/* Top Utility Bar */}
      <div className="bg-gradient-to-r from-indigo-50 via-sky-50 to-cyan-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-900 py-2 border-b border-gray-100 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 flex justify-between items-center text-sm">
          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
            <Globe className="w-4 h-4" />
            <span>English (US)</span>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            {f.contact_enabled && (
              <Link href="/contact" className="hidden sm:inline text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                Contact
              </Link>
            )}
            {f.tracking_enabled && (
              <Link href="/track" className="hidden md:inline text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                Find Locations
              </Link>
            )}
            <a
              href={`mailto:${c.email}`}
              className="flex items-center gap-1.5 bg-indigo-600 text-white px-3 py-1.5 rounded-full text-xs hover:bg-indigo-700 hover:scale-105 transition-all shadow-sm"
              data-testid="link-email-support"
            >
              <Mail className="w-3 h-3" /> Email
            </a>
            <a
              href={c.whatsapp_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 bg-emerald-500 text-white px-3 py-1.5 rounded-full text-xs hover:bg-emerald-600 hover:scale-105 transition-all shadow-sm"
              data-testid="link-whatsapp"
            >
              <MessageCircle className="w-3 h-3" /> WhatsApp
            </a>
          </div>
        </div>
      </div>

      {/* Main Header */}
      <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center gap-4">
        <Link href="/" className="flex items-center gap-2.5 shrink-0 group" data-testid="link-home">
          <div className="relative">
            <img
              src="/shipnix-logo.svg"
              alt="Shipnix Express Logo"
              className="w-10 h-10 object-contain group-hover:scale-110 transition-transform duration-300"
              data-testid="img-logo"
            />
          </div>
          <div className="text-lg sm:text-xl font-extrabold leading-tight tracking-tight">
            <span className="bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">Shipnix</span>{' '}
            <span className="bg-gradient-to-r from-cyan-500 to-sky-500 bg-clip-text text-transparent">Express</span>
            <span className="hidden sm:inline text-gray-700 dark:text-gray-200"> Shipment</span>
          </div>
        </Link>

        <nav className="hidden lg:flex items-center gap-1">
          {visibleLinks.map(link => {
            const active = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`px-3 py-2 rounded-full text-sm font-medium transition-all ${
                  active
                    ? 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300'
                    : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-indigo-600 dark:hover:text-indigo-400'
                }`}
                data-testid={`link-nav-${link.label.toLowerCase().replace(/\s+/g, '-')}`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          <div className="relative hidden xl:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Search..."
              className="pl-9 pr-3 py-2 w-44 h-10 text-sm rounded-full border-gray-200 focus-visible:ring-indigo-500"
              data-testid="input-search"
            />
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            data-testid="button-theme-toggle"
            className="rounded-full h-10 w-10"
          >
            <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          </Button>

          {f.quote_enabled && (
            <Link href="/quote" className="hidden sm:block">
              <Button
                size="sm"
                className="rounded-full bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white shadow-md shadow-indigo-500/30 hover:shadow-lg hover:scale-105 transition-all px-5"
                data-testid="button-get-started"
              >
                Get a Quote
              </Button>
            </Link>
          )}

          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden rounded-full h-10 w-10"
            onClick={() => setMobileOpen(o => !o)}
            data-testid="button-mobile-menu"
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile Nav */}
      {mobileOpen && (
        <div className="lg:hidden border-t bg-white dark:bg-gray-950 animate-fade-in">
          <nav className="max-w-7xl mx-auto px-4 py-4 flex flex-col gap-1">
            {visibleLinks.map(link => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="px-4 py-3 rounded-xl text-base font-medium text-gray-700 dark:text-gray-200 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 hover:text-indigo-600 transition-colors"
                data-testid={`link-mobile-${link.label.toLowerCase().replace(/\s+/g, '-')}`}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
}
