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
- `next.config.cjs` — Next.js configuration
- `supabase-setup.sql` — SQL to run in Supabase dashboard to create tables

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

### Auth & Roles
- `profiles` table (1:1 with `auth.users`) stores `role` (`customer` | `admin`).
- A trigger in `supabase-setup.sql` auto-creates a `profiles` row on user signup.
- `lib/auth.ts` exposes `requireAdmin()` and `getSessionWithRole()` for API routes.
- `middleware.ts` redirects non-admins away from `/admin/*` pages.
- **Database is locked down with Row-Level Security**: only users whose `profiles.role = 'admin'` can read or write packages, tracking events, quotes (read), and invoices. Anonymous visitors can still look up a package by tracking ID and submit a public quote request. A helper function `public.is_admin()` (SECURITY DEFINER) is used inside RLS policies to avoid recursion. Customers are blocked from changing their own role by the `WITH CHECK` clause on the profile UPDATE policy.
- Make a user an admin by running in the Supabase SQL Editor:
  `update profiles set role = 'admin' where email = 'you@example.com';`
- For an existing project, run `supabase-migration-rls-lockdown.sql` to apply just the RLS lockdown without re-creating tables.

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
