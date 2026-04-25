-- =====================================================================
-- Shipnix Express — Tracking Flow + Contact Messages Migration
-- Run this in your Supabase SQL Editor at https://app.supabase.com
-- This script is idempotent — safe to re-run.
-- =====================================================================
--
-- It does three things:
--   1. Updates the `packages.current_status` default to the new
--      `order_placed` value.
--   2. Migrates any existing packages still on the legacy 8-status flow
--      onto the new 7-stage flow (and re-stamps tracking_events).
--   3. Adds a `contact_messages` table for the public Contact form,
--      with RLS so anyone can submit but only admins can read/manage.
--
-- New tracking flow (set by admin in /admin/packages):
--   order_placed → packed → in_transit → arrived_at_hub
--                → out_for_delivery → delivered
--   exception (off-ramp, recoverable)
-- =====================================================================


-- ---------------------------------------------------------------------
-- 1. Update default for packages.current_status
-- ---------------------------------------------------------------------
ALTER TABLE packages
  ALTER COLUMN current_status SET DEFAULT 'order_placed';


-- ---------------------------------------------------------------------
-- 2. Migrate legacy statuses on existing rows
--    Old → New mapping:
--      pending_payment   → order_placed
--      created           → order_placed
--      picked_up         → packed
--      failed_delivery   → exception
--      returned          → exception
--    (in_transit, out_for_delivery, delivered keep their names)
-- ---------------------------------------------------------------------
UPDATE packages
   SET current_status = CASE current_status
     WHEN 'pending_payment' THEN 'order_placed'
     WHEN 'created'         THEN 'order_placed'
     WHEN 'picked_up'       THEN 'packed'
     WHEN 'failed_delivery' THEN 'exception'
     WHEN 'returned'        THEN 'exception'
     ELSE current_status
   END
 WHERE current_status IN
       ('pending_payment', 'created', 'picked_up', 'failed_delivery', 'returned');

UPDATE tracking_events
   SET status = CASE status
     WHEN 'pending_payment' THEN 'order_placed'
     WHEN 'created'         THEN 'order_placed'
     WHEN 'picked_up'       THEN 'packed'
     WHEN 'failed_delivery' THEN 'exception'
     WHEN 'returned'        THEN 'exception'
     ELSE status
   END
 WHERE status IN
       ('pending_payment', 'created', 'picked_up', 'failed_delivery', 'returned');


-- ---------------------------------------------------------------------
-- 3. Contact messages table (for the public /contact form)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS contact_messages (
  id          SERIAL PRIMARY KEY,
  name        TEXT NOT NULL,
  email       TEXT NOT NULL,
  subject     TEXT NOT NULL,
  message     TEXT NOT NULL,
  status      TEXT NOT NULL DEFAULT 'new'
              CHECK (status IN ('new', 'read', 'replied', 'archived')),
  admin_notes TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS contact_messages_created_at_idx
  ON contact_messages (created_at DESC);

CREATE INDEX IF NOT EXISTS contact_messages_status_idx
  ON contact_messages (status);

ALTER TABLE contact_messages ENABLE ROW LEVEL SECURITY;

-- Reset any prior policies so the script is idempotent.
DROP POLICY IF EXISTS "Anyone can submit a contact message" ON contact_messages;
DROP POLICY IF EXISTS "Admins read contact messages"        ON contact_messages;
DROP POLICY IF EXISTS "Admins update contact messages"      ON contact_messages;
DROP POLICY IF EXISTS "Admins delete contact messages"      ON contact_messages;

-- Anyone (including anonymous visitors) can submit a message.
CREATE POLICY "Anyone can submit a contact message"
  ON contact_messages FOR INSERT
  WITH CHECK (true);

-- Only admins can list / read / update / delete messages.
CREATE POLICY "Admins read contact messages"
  ON contact_messages FOR SELECT
  TO authenticated
  USING (public.is_admin());

CREATE POLICY "Admins update contact messages"
  ON contact_messages FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins delete contact messages"
  ON contact_messages FOR DELETE
  TO authenticated
  USING (public.is_admin());


-- =====================================================================
-- DONE
-- =====================================================================
-- After running this:
--   • Existing packages will reflect the new 7-stage tracking flow.
--   • New packages will default to `order_placed`.
--   • Public visitors can submit contact messages via /contact.
--   • Admins can manage them at /admin/messages.
-- =====================================================================
