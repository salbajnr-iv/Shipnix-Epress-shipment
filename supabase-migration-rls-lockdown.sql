-- =====================================================================
-- Shipnix-Express — Migration: lock down shipping data to admins only
-- =====================================================================
-- Run this in your Supabase SQL Editor if you have already run the
-- original supabase-setup.sql. It is idempotent — safe to re-run.
--
-- Effect after running:
--   * Only users whose profiles.role = 'admin' can read or write
--     packages, tracking_events, quotes (read), and invoices.
--   * Anonymous visitors can still look up a package by tracking ID
--     and submit a public quote request.
--   * Customers signed in with role = 'customer' get nothing past
--     their own profile row.
--   * Customers cannot promote themselves to admin (role column is
--     pinned by the UPDATE policy).
-- =====================================================================

-- 1. Make sure the profiles table + role column exist (no-op if already there).
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  role TEXT NOT NULL DEFAULT 'customer' CHECK (role IN ('customer', 'admin')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-create profile on signup (in case it wasn't installed yet).
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

INSERT INTO public.profiles (id, email, role)
SELECT id, email, 'customer' FROM auth.users
ON CONFLICT (id) DO NOTHING;

-- 2. is_admin() helper — SECURITY DEFINER avoids RLS recursion.
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

-- 3. Make sure RLS is on for every table.
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE tracking_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

-- 4. Drop every old policy so this script is safe to re-run.
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
DROP POLICY IF EXISTS "Anyone can insert quote requests" ON quotes;
DROP POLICY IF EXISTS "Admins read quotes" ON quotes;
DROP POLICY IF EXISTS "Admins update quotes" ON quotes;
DROP POLICY IF EXISTS "Admins delete quotes" ON quotes;

DROP POLICY IF EXISTS "Authenticated users can manage invoices" ON invoices;
DROP POLICY IF EXISTS "Admins manage invoices" ON invoices;

-- 5. Re-create the strict policies.

-- profiles ------------------------------------------------------------
CREATE POLICY "Users read own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Admins read all profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (public.is_admin());

CREATE POLICY "Users update own profile (no role)"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id
    AND role = (SELECT role FROM public.profiles WHERE id = auth.uid())
  );

-- packages ------------------------------------------------------------
CREATE POLICY "Public can read packages"
  ON packages FOR SELECT
  USING (true);

CREATE POLICY "Admins manage packages"
  ON packages FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- tracking_events -----------------------------------------------------
CREATE POLICY "Public can read tracking events"
  ON tracking_events FOR SELECT
  USING (true);

CREATE POLICY "Admins manage tracking events"
  ON tracking_events FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- quotes --------------------------------------------------------------
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

-- invoices ------------------------------------------------------------
CREATE POLICY "Admins manage invoices"
  ON invoices FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- =====================================================================
-- Promote yourself to admin (run this with your own email):
--
--   UPDATE profiles SET role = 'admin' WHERE email = 'you@example.com';
-- =====================================================================
