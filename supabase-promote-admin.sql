-- =====================================================================
-- Shipnix-Express — diagnose & promote a user to admin
-- =====================================================================
-- Run this in your Supabase SQL Editor (which bypasses RLS via the
-- service_role). Replace YOUR_EMAIL on the marked line.
-- =====================================================================

-- 1. Show current state — auth.users joined to profiles.
--    If `profile_email` or `role` is NULL, no profiles row exists yet.
SELECT
  u.id                           AS user_id,
  u.email                        AS auth_email,
  p.email                        AS profile_email,
  p.role                         AS current_role,
  u.created_at                   AS user_created_at
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
ORDER BY u.created_at DESC;

-- 2. Backfill any missing profiles rows for existing auth users.
--    Safe to re-run — uses ON CONFLICT DO NOTHING.
INSERT INTO public.profiles (id, email, role)
SELECT u.id, u.email, 'customer'
FROM auth.users u
ON CONFLICT (id) DO NOTHING;

-- 3. Make sure profiles.email mirrors the current auth.users.email
--    (in case it changed or was NULL when the row was created).
UPDATE public.profiles p
SET email = u.email
FROM auth.users u
WHERE p.id = u.id
  AND (p.email IS DISTINCT FROM u.email);

-- 4. Promote a user to admin by matching against auth.users.email
--    (case-insensitive). >>> CHANGE THE EMAIL ON THE NEXT LINE <<<
WITH target AS (
  SELECT id FROM auth.users WHERE LOWER(email) = LOWER('YOUR_EMAIL@example.com')
)
UPDATE public.profiles
SET role = 'admin', updated_at = NOW()
WHERE id IN (SELECT id FROM target)
RETURNING id, email, role;

-- 5. Confirm — should show your account with role = 'admin'.
SELECT
  u.email AS auth_email,
  p.email AS profile_email,
  p.role  AS role
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
WHERE p.role = 'admin';
