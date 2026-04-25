# Shipnix-Express - Global Logistics Solutions

## Overview

Shipnix-Express is a comprehensive global logistics and delivery tracking service. The application specializes in fast, dependable logistics solutions—delivering shipments quickly and securely to over 220 countries and territories. It features real-time status updates, delivery notifications, and a responsive React/Next.js frontend with Supabase for auth and database.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Tech Stack
- **Framework**: Next.js 14 (App Router) with TypeScript
- **UI Library**: Radix UI components with shadcn/ui styling system
- **Styling**: Tailwind CSS with custom CSS variables for theming
- **State Management**: TanStack React Query for server state management
- **Authentication**: Supabase Auth (email/password)
- **Database**: Supabase PostgreSQL
- **QR Code Integration**: QR code generation via `qrcode` library

### Key Files
- `app/` — Next.js App Router pages and API routes
- `components/` — Shared React components (shadcn/ui + custom)
- `lib/supabase/` — Supabase client helpers (browser, server, middleware)
- `lib/types.ts` — All shared TypeScript types
- `lib/utils.ts` — Utility functions
- `middleware.ts` — Next.js middleware for auth route protection
- `tailwind.config.ts` — Tailwind configuration
- `next.config.mjs` — Next.js configuration (ESM; required because package.json has `"type": "module"`)
- `supabase-setup.sql` — SQL to run in Supabase dashboard to create tables
- `supabase-cms-migration.sql` — SQL to run for the admin CMS (`site_settings` table + seeds)
- `lib/site-config.ts` — Pure types, defaults, and the `publicConfig` filter (client-safe)
- `lib/site-config.server.ts` — `getSiteConfig()` server-only fetcher (uses `next/headers`)
- `lib/icon-map.ts` — Whitelisted lucide icons admins can pick for service cards
- `components/customization-client.tsx` — Admin Customization tabs (Site Content / Pricing / Services / FAQ / Features)
- `components/maintenance-screen.tsx` — Friendly screens shown when a feature flag is off or maintenance mode is on

### API Routes
All API routes live in `app/api/`. Admin routes use `requireAdmin()` from `lib/auth.ts` to check the role on the `profiles` table.
- `GET/POST /api/packages` — List & create packages (admin)
- `GET/PATCH/DELETE /api/packages/[id]` — Single package operations (admin)
- `PATCH /api/packages/[id]/status` — Update status with state-machine validation + create tracking event (admin)
- `GET /api/quotes` — List quotes (admin)
- `POST /api/quotes` — Submit a quote request (public)
- `GET/PATCH /api/quotes/[id]` — Single quote operations (admin)
- `GET/POST /api/invoices` — List & create invoices (admin)
- `PATCH /api/invoices/[id]/mark-paid` — Mark invoice paid + auto-create package (admin)
- `GET /api/admin/stats` — Aggregated dashboard stats + recent activity (admin)
- `GET /api/track/[id]` — Public tracking endpoint (no auth required)
- `GET /api/auth/callback` — Supabase OAuth callback
- `GET /api/public-config` — Public-facing site settings (enabled-only items)
- `GET /api/site-settings` — Admin: full settings dump including disabled items
- `PUT /api/site-settings/[key]` — Admin: upsert one setting key (RLS also enforces admin-only writes)

### Auth & Roles
- `profiles` table (1:1 with `auth.users`) stores `role` (`customer` | `admin`).
- A trigger in `supabase-setup.sql` auto-creates a `profiles` row on user signup.
- `lib/auth.ts` exposes `requireAdmin()` and `getSessionWithRole()` for API routes.
- `middleware.ts` redirects non-admins away from `/admin/*` pages.
- **Database is locked down with Row-Level Security**: only users whose `profiles.role = 'admin'` can read or write packages, tracking events, quotes (read), and invoices. Anonymous visitors can still look up a package by tracking ID and submit a public quote request. A helper function `public.is_admin()` (SECURITY DEFINER) is used inside RLS policies to avoid recursion. Customers are blocked from changing their own role by the `WITH CHECK` clause on the profile UPDATE policy.
- Make a user an admin by running in the Supabase SQL Editor:
  `update profiles set role = 'admin' where email = 'you@example.com';`
- For an existing project, run `supabase-migration-rls-lockdown.sql` to apply just the RLS lockdown without re-creating tables.
- The admin CMS adds a `site_settings` table with its own RLS: public SELECT, admin-only INSERT/UPDATE/DELETE via the existing `public.is_admin()` helper.

### Package Status State Machine
`PACKAGE_STATUS_TRANSITIONS` in `lib/types.ts` defines which status can follow which. The `/api/packages/[id]/status` endpoint and the package management UI both enforce it. Terminal states: `delivered`, `returned`.

### SEO
- `app/sitemap.ts` and `app/robots.ts` produce `/sitemap.xml` and `/robots.txt`.
- Set `NEXT_PUBLIC_SITE_URL` in deployment to the canonical site URL (defaults to `https://shipnix.example.com` in dev).
- Each public page exports a unique `metadata` object; admin pages use `robots: { index: false }`.

### Pages
- `/` — Landing page
- `/login` — Admin login
- `/register` — User registration
- `/track` — Public package tracking
- `/track/[id]` — Track specific package
- `/quote` — Public quote request
- `/faq` — FAQ page
- `/admin` — Admin dashboard (protected)
- `/admin/packages` — Package management (protected)
- `/admin/quotes` — Quote management (protected)
- `/admin/invoices` — Invoice management (protected)
- `/admin/customization` — Site CMS: hero, contact, announcement, FAQ, services, pricing, time slots, feature flags & maintenance mode (protected)

### Admin CMS (Customization)
The admin Customization page (`/admin/customization`) lets admins control what regular visitors see — without redeploying. Settings are stored as JSONB in the `site_settings` table (key-value), with public read + admin-only write enforced by RLS.

- **Hero** — title prefix, rotating words, subtitle, both CTAs, and the two trust badges.
- **Announcement banner** — sitewide banner (toggle, message, optional link).
- **Contact info** — email, phone, WhatsApp, address, business hours; rendered on `/contact`, in the header utility bar, and in the footer.
- **Pricing** — `base_min` and `per_kg_rate` used by the public quote API. The math is `total = max(base_min, weight × per_kg_rate) + slot.fee`.
- **Time slots** — list of delivery slots (value, label, fee, enabled) shown on the quote form. The fee is added server-side from `/api/quotes`.
- **Services** — cards displayed on the homepage and `/services`. Each has a title, description, bullets, lucide icon (whitelisted in `lib/icon-map.ts`), and an enabled flag.
- **FAQ** — questions/answers shown on `/faq` (enabled-only).
- **Feature flags** — page toggles (`quote`, `register`, `tracking`, `faq`, `contact`, `services`) plus `maintenance_mode` and `maintenance_message`. Disabled pages render a friendly notice (not a 404). Maintenance mode shows a sitewide screen on every public page.

Server pages call `getSiteConfig()` from `lib/site-config.server.ts`, then pass the relevant slices to client components (`Header`, `LandingPage`, `FAQClient`, etc.). The pricing API (`/api/quotes`) also enforces the maintenance and quote-enabled flags server-side. If the migration hasn't been run yet, every site falls back to `DEFAULT_CONFIG` from `lib/site-config.ts`.

**To enable the CMS**, run `supabase-cms-migration.sql` in the Supabase SQL Editor.

## Setup Required

### Supabase Credentials
Add these environment secrets for the app to connect to Supabase:
- `NEXT_PUBLIC_SUPABASE_URL` — Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Your Supabase anon/public key

### Database Tables
Run `supabase-setup.sql` in the Supabase SQL Editor to create all necessary tables and RLS policies.

## Workflow

The app runs via the "Start application" workflow using `next dev -p 5000`.

## Features
- Public package tracking (no login needed)
- Admin dashboard for full logistics management
- Quote request system with instant pricing
- Quote → Invoice → Payment → Package workflow
- QR code generation for each package
- Real-time status updates
- Dark/light theme toggle
- FAQ page with search
- 7-stage delivery status tracking

## Design System

All public and admin pages share a single design vocabulary defined in `app/globals.css`. Use these utility classes to keep new screens consistent.

**Surfaces & layout**
- `app-shell` — the dashboard background (slate base + radial accents)
- `page-shell` — max-width content wrapper with responsive padding
- `page-header` / `page-eyebrow` / `page-title` / `page-subtitle` — page header pattern
- `surface-card` / `surface-card-elevated` — solid (non-transparent) card containers

**Forms**
- `form-section` (auto-divides with siblings), `form-section-title`, `form-section-step` (numbered circles), `form-section-heading`, `form-section-sub`
- `form-grid` (responsive 2-col grid) + `form-grid-full`, `form-field`, `form-label`, `form-help`

**Auth (login/register)**
- `auth-shell` — split layout with brand panel + form panel
- `auth-brand-panel` — gradient brand panel with bullets
- `auth-form-panel` / `auth-form-card` — solid form card

**Data display**
- `stat-tile` / `stat-tile-icon` / `stat-tile-value` / `stat-tile-label` / `stat-tile-meta` — dashboard stat cards
- `status-pill` — colored pill for statuses (combine with bg/text colors)
- `meta-chip` — small slate chip for counts/filters

**Brand palette**
- Primary gradient: `from-indigo-600 to-violet-600`
- Status colors: emerald (success/paid), amber (pending), red (error/decline), cyan (info), indigo/violet (active/in-transit)
- Neutrals: `slate-*` (replaces ad-hoc gray-*)
- Hero gradients: `from-indigo-700 via-violet-700 to-cyan-600` with amber/cyan blob overlays
