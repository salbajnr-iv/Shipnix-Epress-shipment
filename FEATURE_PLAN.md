# Shipnix Feature Update Plan

This document outlines the approach for each pending feature area. Tackle them in priority order — items 1–3 are quick wins; 4–10 are larger.

---

## 1. Fix Deployment Configuration (Critical)

**Problem:** `.replit` deploy config still references the old Express setup (`node ./dist/index.cjs`). Publishing will fail.

**Approach:**
- Update `.replit` `[deployment]` block:
  - `build = ["npm", "run", "build"]`
  - `run = ["npm", "run", "start"]`
- Confirm `npm run build` succeeds locally before publishing.
- Verify Supabase env vars are set in the Deployments secrets pane (separate from dev secrets).

**Done when:** A trial publish completes and the live URL serves the home page.

---

## 2. Public Tracking Page Polish

**Problem:** Anonymous users need a frictionless way to look up a shipment ID.

**Approach:**
- Audit `app/track/page.tsx` and `app/track/[id]/page.tsx`.
- Confirm the route is unauthenticated (no Supabase session required).
- Add three states to the result view:
  - **Found:** timeline of status events with timestamps and current location.
  - **Not found:** friendly empty state with a "double-check your tracking ID" message and a link back to the tracking form.
  - **Loading:** skeleton placeholder.
- Validate the input on the client (length/pattern) before hitting the API.
- Test with a real package ID and a fake one.

**Done when:** A shipment ID typed by a logged-out user returns a polished result or a clear error.

---

## 3. Admin Dashboard with Real Stats

**Problem:** Admin landing page likely shows static cards.

**Approach:**
- In `components/admin-dashboard-client.tsx`, add four stat cards driven by real data:
  - Total packages (and breakdown by status: pending, in transit, delivered)
  - Open quote requests
  - Unpaid invoices and total outstanding $
  - Packages updated in the last 7 days
- Add one "recent activity" list (last 10 status changes or new quotes).
- Fetch via TanStack Query against existing API routes; add aggregation endpoints under `/api/admin/stats` if needed.
- Use shadcn `Card`, `Skeleton` while loading.

**Done when:** Admin sees live counts that change as data is added.

---

## 4. Quote Request Flow

**Approach:**
- Form (`components/quote-request-client.tsx`):
  - Validate with Zod against the insert schema.
  - On submit, show a success toast + redirect to a confirmation page or inline thank-you.
- Backend (`app/api/quotes/route.ts`):
  - Persist the quote with status = `pending`.
  - Trigger an email notification to admin (see item 7).
- Admin side (`components/quote-management-client.tsx`):
  - Allow status changes: pending → quoted → accepted/declined.
  - Add a "respond" action that emails the customer the price.

**Done when:** Customer submits → admin sees it → admin replies → customer receives reply.

---

## 5. Package Status Workflow

**Approach:**
- Define the status state machine in `shared/schema.ts` (or wherever package types live):
  - `pending → picked_up → in_transit → out_for_delivery → delivered`
  - Optional terminal states: `cancelled`, `returned`
- In `components/package-management-client.tsx`, render a dropdown that only shows valid next states.
- Each status change writes a row to a `package_events` table (timestamp, status, optional location, optional note) so the public tracking page can show a timeline.
- On status change, trigger a customer email (see item 7).

**Done when:** Admin updates a package and the change appears on the public tracking page within seconds.

---

## 6. Invoice & Payment Handling

**Approach (manual mode — fastest):**
- Keep current `mark-paid` endpoint.
- Add a "Generate PDF" button on each invoice using a server-side PDF library (e.g. `@react-pdf/renderer`).
- Add an email-the-invoice action.

**Approach (real payments — larger):**
- Wire Stripe Checkout: customer clicks "Pay" on the invoice, hits a Stripe-hosted page, webhook flips status to paid.
- Requires a Stripe account, env vars, and a webhook route at `/api/webhooks/stripe`.

**Done when:** Either an invoice can be sent and manually marked paid, or a customer can pay online and the invoice updates automatically.

---

## 7. Email Notifications

**Approach:**
- Choose a provider (Resend is simplest with Next.js).
- Add a single helper: `lib/email.ts` exporting `sendEmail({ to, subject, react })`.
- Use React Email templates for: quote received, quote response, package status update, invoice issued, invoice paid.
- Wire into the API routes that already exist; no new endpoints needed.
- Add `RESEND_API_KEY` and `EMAIL_FROM` to env vars.

**Done when:** Each of the five trigger events sends a styled email.

---

## 8. Auth & Roles Hardening

**Approach:**
- Confirm middleware (or per-route checks) blocks non-admins from `/admin/*` and admin API routes.
- Add a `role` column on the user/profile table (values: `customer`, `admin`).
- In every admin API handler, fetch the session, look up the role, return 403 if not admin.
- Add an integration test or manual checklist: log in as customer, attempt to hit `/api/packages` POST → must get 403.

**Done when:** A non-admin cannot reach any admin route or mutate any admin endpoint.

---

## 9. SEO & Metadata

**Approach:**
- For each page in `app/`, export a `metadata` object (Next.js App Router pattern):
  ```ts
  export const metadata = {
    title: "Track Your Shipment | Shipnix",
    description: "Real-time tracking for your Shipnix packages...",
    openGraph: { ... },
  };
  ```
- Add a sitemap at `app/sitemap.ts` and `app/robots.ts`.
- Add favicon + Open Graph image to `public/`.

**Done when:** Each public page has a unique title, description, and shareable preview.

---

## 10. Mobile Polish

**Approach:**
- Test these screens at 375px width:
  - Admin tables (packages, quotes, invoices) — convert to stacked cards on small screens.
  - Tracking timeline — stack vertically.
  - Quote form — confirm fields don't overflow.
- Use the `useIsMobile` hook (already in `hooks/use-mobile.tsx`) where conditional rendering helps.

**Done when:** All key flows work cleanly on a phone-sized viewport.

---

## Suggested Order of Attack

1. Item 1 (deploy config) — unblocks everything else.
2. Item 8 (auth hardening) — ship secure before adding more surface area.
3. Item 5 (package status workflow) — core product value.
4. Item 2 (public tracking) — the customer-facing payoff for item 5.
5. Item 7 (emails) — gives items 4, 5, 6 their notifications.
6. Items 4 & 6 (quotes, invoices) — revenue-side polish.
7. Item 3 (dashboard stats) — looks great in demos, low risk.
8. Items 9 & 10 (SEO, mobile) — final polish before launch.
