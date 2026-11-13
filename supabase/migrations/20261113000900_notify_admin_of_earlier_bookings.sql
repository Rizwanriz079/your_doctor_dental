-- Bookings made before any super admin existed created no notifications (they are only
-- sent to admins who exist at booking time). This:
--  1. backfills a notification for every still-pending upcoming booking, for every admin
--     who does not have one yet (safe to re-run), and
--  2. makes claim_first_admin() do the same for the new admin automatically.

create or replace function public._notify_admin_of_pending(p_admin uuid)
returns int language plpgsql security definer set search_path = '' as $$
declare
  v_count int;
begin
  insert into public.notifications (recipient_user_id, appointment_id, doctor_id, event_type, title, message, data)
  select p_admin, a.id, a.doctor_id, 'appointment_created', 'New appointment booking',
         format('%s has requested an appointment with %s for %s on %s at %s.',
                split_part(a.patient_name, ' ', 1), d.full_name, sv.name,
                to_char(a.appointment_date, 'FMMonth FMDD'), to_char(a.start_time, 'FMHH12:MI AM')),
         jsonb_build_object('reference', a.booking_reference, 'doctor', d.full_name, 'service', sv.name,
                            'date', a.appointment_date, 'time', to_char(a.start_time, 'HH24:MI'))
    from public.appointments a
    join public.doctors d on d.id = a.doctor_id
    join public.services sv on sv.id = a.service_id
   where a.status = 'pending'
     and a.appointment_date >= (now() at time zone (select timezone from public.clinic_settings where id = 1))::date
     and not exists (select 1 from public.notifications n
                      where n.recipient_user_id = p_admin and n.appointment_id = a.id);
  get diagnostics v_count = row_count;
  return v_count;
end $$;
revoke execute on function public._notify_admin_of_pending(uuid) from public, anon, authenticated;

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

  -- Bookings that arrived before there was an admin to notify.
  perform public._notify_admin_of_pending(v_uid);

  return jsonb_build_object('ok', true);
end $$;

-- One-time backfill for admins that already exist.
select public._notify_admin_of_pending(id) from public.profiles where role = 'super_admin';
