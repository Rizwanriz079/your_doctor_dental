-- =====================================================================
-- First-run setup wizard: create the first super admin from the website.
-- The account itself is a normal Supabase Auth user; this only grants the
-- super_admin role, and only while NO super admin exists yet. Once one
-- exists, setup is permanently closed (enforced here, not in the UI).
-- =====================================================================

-- PUBLIC: does this installation still need its first admin?
create or replace function public.setup_status()
returns jsonb language sql stable security definer set search_path = '' as $$
  select jsonb_build_object(
    'database_ready', true,
    'needs_admin', not exists (select 1 from public.profiles where role = 'super_admin'));
$$;

-- SIGNED-IN: make the current Supabase Auth user the first super admin.
create or replace function public.claim_first_admin(p_full_name text default null)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_uid uuid := auth.uid();
  v_email text;
  v_confirmed timestamptz;
  v_name text := nullif(btrim(coalesce(p_full_name, '')), '');
begin
  if v_uid is null then
    return jsonb_build_object('ok', false, 'code', 'not_signed_in', 'message', 'Please sign in to finish setup.');
  end if;

  -- Serialise concurrent attempts so only one account can ever win.
  perform pg_advisory_xact_lock(hashtextextended('claim_first_admin', 0));

  if exists (select 1 from public.profiles where role = 'super_admin') then
    return jsonb_build_object('ok', false, 'code', 'already_set_up',
      'message', 'This clinic already has an administrator. Ask them to give you access.');
  end if;

  select email, email_confirmed_at into v_email, v_confirmed from auth.users where id = v_uid;
  if v_confirmed is null then
    return jsonb_build_object('ok', false, 'code', 'email_not_confirmed',
      'message', 'Please confirm your email address first, using the link we sent you.');
  end if;

  insert into public.profiles (id, email, full_name, role)
  values (v_uid, v_email, coalesce(v_name, split_part(v_email, '@', 1)), 'super_admin')
  on conflict (id) do update set role = 'super_admin', full_name = coalesce(v_name, public.profiles.full_name);

  return jsonb_build_object('ok', true);
end $$;

revoke execute on function public.setup_status() from public;
revoke execute on function public.claim_first_admin(text) from public, anon;
grant execute on function public.setup_status() to anon, authenticated;
grant execute on function public.claim_first_admin(text) to authenticated;
