-- Shipnix-Express Supabase Database Setup
-- Run this in your Supabase SQL Editor at https://app.supabase.com
-- This script is idempotent — safe to re-run.

-- =====================================================================
-- TABLES
-- =====================================================================

-- Packages table
CREATE TABLE IF NOT EXISTS packages (
  id SERIAL PRIMARY KEY,
  tracking_id TEXT UNIQUE NOT NULL,
  sender_name TEXT NOT NULL,
  sender_address TEXT NOT NULL,
  sender_phone TEXT,
  sender_email TEXT,
  recipient_name TEXT NOT NULL,
  recipient_address TEXT NOT NULL,
  recipient_phone TEXT,
  recipient_email TEXT,
  package_description TEXT,
  weight TEXT,
  dimensions TEXT,
  shipping_cost TEXT,
  payment_method TEXT,
  payment_status TEXT DEFAULT 'pending',
  estimated_delivery TIMESTAMPTZ,
  actual_delivery TIMESTAMPTZ,
  scheduled_delivery_date TIMESTAMPTZ,
  scheduled_time_slot TEXT,
  delivery_price_adjustment TEXT,
  qr_code TEXT,
  current_status TEXT NOT NULL DEFAULT 'created',
  current_location TEXT,
  delivery_instructions TEXT,
  signature_required BOOLEAN DEFAULT FALSE,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tracking events table
CREATE TABLE IF NOT EXISTS tracking_events (
  id SERIAL PRIMARY KEY,
  package_id INTEGER REFERENCES packages(id) ON DELETE CASCADE,
  status TEXT NOT NULL,
  location TEXT,
  description TEXT,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Quotes table
CREATE TABLE IF NOT EXISTS quotes (
  id SERIAL PRIMARY KEY,
  quote_number TEXT UNIQUE NOT NULL,
  sender_name TEXT NOT NULL,
  sender_email TEXT,
  sender_phone TEXT,
  sender_address TEXT NOT NULL,
  recipient_name TEXT NOT NULL,
  recipient_email TEXT,
  recipient_phone TEXT,
  recipient_address TEXT NOT NULL,
  package_description TEXT,
  weight TEXT,
  dimensions TEXT,
  delivery_time_slot TEXT,
  base_cost TEXT NOT NULL,
  delivery_fee TEXT DEFAULT '0',
  total_cost TEXT NOT NULL,
  valid_until TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Invoices table
CREATE TABLE IF NOT EXISTS invoices (
  id SERIAL PRIMARY KEY,
  invoice_number TEXT UNIQUE NOT NULL,
  quote_id INTEGER REFERENCES quotes(id),
  package_id INTEGER REFERENCES packages(id),
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_address TEXT,
  total_amount TEXT NOT NULL,
  tax_amount TEXT DEFAULT '0',
  payment_method TEXT NOT NULL DEFAULT 'card',
  payment_status TEXT DEFAULT 'pending',
  paid_at TIMESTAMPTZ,
  due_date TIMESTAMPTZ NOT NULL,
  items JSONB DEFAULT '[]',
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Profiles table (1:1 with auth.users) — holds the role
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  role TEXT NOT NULL DEFAULT 'customer' CHECK (role IN ('customer', 'admin')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================================
-- AUTH TRIGGERS
-- =====================================================================

-- Auto-create a profile row whenever a new auth.user is added
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role)
  VALUES (NEW.id, NEW.email, 'customer')
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Backfill profiles for users who already exist
INSERT INTO public.profiles (id, email, role)
SELECT id, email, 'customer' FROM auth.users
ON CONFLICT (id) DO NOTHING;

-- =====================================================================
-- ROLE HELPER
-- =====================================================================
-- SECURITY DEFINER so it can read profiles even when called from an RLS
-- policy on another table (avoids infinite recursion).
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT role = 'admin' FROM public.profiles WHERE id = auth.uid()),
    false
  );
$$;

-- =====================================================================
-- ROW LEVEL SECURITY
-- =====================================================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE tracking_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

-- Drop any prior permissive policies so the script is idempotent.
DROP POLICY IF EXISTS "Users read own profile" ON profiles;
DROP POLICY IF EXISTS "Users update own profile" ON profiles;
DROP POLICY IF EXISTS "Users update own profile (no role)" ON profiles;
DROP POLICY IF EXISTS "Admins read all profiles" ON profiles;

DROP POLICY IF EXISTS "Authenticated users can manage packages" ON packages;
DROP POLICY IF EXISTS "Public can read packages by tracking_id" ON packages;
DROP POLICY IF EXISTS "Admins manage packages" ON packages;
DROP POLICY IF EXISTS "Public can read packages" ON packages;

DROP POLICY IF EXISTS "Authenticated users can manage tracking events" ON tracking_events;
DROP POLICY IF EXISTS "Public can read tracking events" ON tracking_events;
DROP POLICY IF EXISTS "Admins manage tracking events" ON tracking_events;

DROP POLICY IF EXISTS "Authenticated users can manage quotes" ON quotes;
DROP POLICY IF EXISTS "Anyone can submit quote requests" ON quotes;
DROP POLICY IF EXISTS "Admins read quotes" ON quotes;
DROP POLICY IF EXISTS "Admins update quotes" ON quotes;
DROP POLICY IF EXISTS "Admins delete quotes" ON quotes;
DROP POLICY IF EXISTS "Anyone can insert quote requests" ON quotes;

DROP POLICY IF EXISTS "Authenticated users can manage invoices" ON invoices;
DROP POLICY IF EXISTS "Admins manage invoices" ON invoices;

-- ---------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------
-- Users can read their own profile (so the app can look up their role).
CREATE POLICY "Users read own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Admins can read every profile (for user management later).
CREATE POLICY "Admins read all profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (public.is_admin());

-- Users can update their own profile but CANNOT change their role
-- (the WITH CHECK forces the new role to equal the existing one).
CREATE POLICY "Users update own profile (no role)"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id
    AND role = (SELECT role FROM public.profiles WHERE id = auth.uid())
  );

-- ---------------------------------------------------------------------
-- packages — admins only for writes; admins + anon for reads
-- ---------------------------------------------------------------------
-- Public tracking lookup (the /api/track endpoint runs as anon).
CREATE POLICY "Public can read packages"
  ON packages FOR SELECT
  USING (true);

-- All write ops require admin.
CREATE POLICY "Admins manage packages"
  ON packages FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ---------------------------------------------------------------------
-- tracking_events — admins only for writes; everyone for reads
-- ---------------------------------------------------------------------
CREATE POLICY "Public can read tracking events"
  ON tracking_events FOR SELECT
  USING (true);

CREATE POLICY "Admins manage tracking events"
  ON tracking_events FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ---------------------------------------------------------------------
-- quotes — public can submit requests (INSERT only), admins manage rest
-- ---------------------------------------------------------------------
CREATE POLICY "Anyone can insert quote requests"
  ON quotes FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admins read quotes"
  ON quotes FOR SELECT
  TO authenticated
  USING (public.is_admin());

CREATE POLICY "Admins update quotes"
  ON quotes FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins delete quotes"
  ON quotes FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- ---------------------------------------------------------------------
-- invoices — admins only, full stop
-- ---------------------------------------------------------------------
CREATE POLICY "Admins manage invoices"
  ON invoices FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- =====================================================================
-- HOW TO PROMOTE A USER TO ADMIN
-- =====================================================================
-- After the user signs up, run:
--
--   UPDATE profiles SET role = 'admin' WHERE email = 'you@example.com';
--
-- Only run this from the Supabase SQL Editor (which uses the service role
-- and bypasses RLS). Regular customers cannot promote themselves because
-- the "Users update own profile (no role)" policy blocks role changes.
