-- Apply after 038 and 039 in the existing Yourcipe project.
-- Removes table-wide privileges unused by either frontend; keeps SELECT,
-- INSERT, UPDATE, DELETE, RLS, RPCs, data and service_role access unchanged.
-- TRUNCATE and REFERENCES are not governed by row-level security.
begin;
revoke truncate, references, trigger on all tables in schema public
  from public, anon, authenticated;

-- The view must retain the caller's RLS, including for personal products.
-- This is already set by Yourcipe 024; explicitly preserve it here.
alter view public.products_with_price_freshness set (security_invoker=true);

-- Prevent the same grants on future tables created by the executing owner
-- (normally postgres in the Supabase SQL Editor). Other creating roles have
-- their own default privileges and must be reviewed separately.
alter default privileges in schema public
  revoke truncate, references, trigger on tables from public, anon, authenticated;
commit;
