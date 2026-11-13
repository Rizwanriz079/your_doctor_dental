-- =====================================================================
-- Patient accounts via Supabase Auth only.
-- Patient identity and details (name, email, avatar, phone) live in auth.users
-- (email + user_metadata). No patient profile table: `profiles` is only used
-- to grant staff/admin roles. Bookings are linked to an account by user id.
-- =====================================================================

-- 1. Stop creating a profiles row for every sign-up. Admin/staff rows are created explicitly.
drop trigger if exists on_auth_user_created on auth.users;
drop function if exists public.handle_new_user();

-- 2. Link bookings to the Supabase Auth user who made them (null for guest bookings).
alter table public.appointments
  add column if not exists user_id uuid references auth.users(id) on delete set null;
create index if not exists appointments_user_idx on public.appointments (user_id, appointment_date desc);

-- A booking made while signed in is attached to that account automatically.
-- (Admins acting in the dashboard never attach bookings to themselves.)
create or replace function public._appointments_set_user()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if new.user_id is null and auth.uid() is not null and not public.is_admin() then
    new.user_id := auth.uid();
  end if;
  return new;
end $$;

drop trigger if exists appointments_set_user on public.appointments;
create trigger appointments_set_user before insert on public.appointments
  for each row execute function public._appointments_set_user();

-- 3. Attach earlier guest bookings to the signed-in account, but ONLY when the booking
--    email matches the account's *verified* email (Google emails are verified; email
--    sign-ups after confirming). Never matched by phone number, which is unverified.
create or replace function public.patient_link_bookings()
returns int language plpgsql security definer set search_path = '' as $$
declare
  v_uid uuid := auth.uid();
  v_email text;
  v_confirmed timestamptz;
  v_count int := 0;
begin
  if v_uid is null then
    return 0;
  end if;
  select lower(email), email_confirmed_at into v_email, v_confirmed from auth.users where id = v_uid;
  if v_email is null or v_confirmed is null then
    return 0;
  end if;
  update public.appointments set user_id = v_uid
   where user_id is null and lower(patient_email) = v_email;
  get diagnostics v_count = row_count;
  return v_count;
end $$;

-- 4. The signed-in patient's own bookings (includes names of doctors/services that have
--    since been deactivated, which public RLS would otherwise hide).
create or replace function public.patient_my_appointments()
returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare
  v_uid uuid := auth.uid();
  v_tz text := (select timezone from public.clinic_settings where id = 1);
  v_now timestamp := now() at time zone (select timezone from public.clinic_settings where id = 1);
  v jsonb;
begin
  if v_uid is null then
    raise exception 'Not signed in' using errcode = '42501';
  end if;
  select coalesce(jsonb_agg(jsonb_build_object(
      'id', a.id,
      'reference', a.booking_reference,
      'status', a.status,
      'date', a.appointment_date,
      'start_time', to_char(a.start_time, 'HH24:MI'),
      'end_time', to_char(a.end_time, 'HH24:MI'),
      'doctor_name', d.full_name,
      'doctor_slug', case when d.status = 'active' then d.slug end,
      'doctor_photo', d.profile_image_path,
      'service_name', sv.name,
      'status_reason', case when a.status in ('rejected', 'cancelled') then a.status_reason end,
      'created_at', a.created_at,
      'upcoming', (a.appointment_date + a.start_time) >= v_now,
      'can_cancel', a.status in ('pending', 'confirmed') and (a.appointment_date + a.start_time) > v_now
    ) order by a.appointment_date desc, a.start_time desc), '[]'::jsonb)
    into v
    from public.appointments a
    join public.doctors d on d.id = a.doctor_id
    join public.services sv on sv.id = a.service_id
   where a.user_id = v_uid;
  return v;
end $$;

-- 5. A patient may cancel their own upcoming pending/confirmed booking. Releases capacity
--    (cancelled bookings never count) and notifies the clinic's admins.
create or replace function public.patient_cancel_appointment(p_id uuid, p_reason text default null)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_uid uuid := auth.uid();
  a public.appointments;
  v_now timestamp := now() at time zone (select timezone from public.clinic_settings where id = 1);
  v_reason text := nullif(btrim(coalesce(p_reason, '')), '');
  v_admin record;
  v_doctor text;
begin
  if v_uid is null then
    return jsonb_build_object('ok', false, 'code', 'not_signed_in', 'message', 'Please sign in again.');
  end if;
  if v_reason is not null and char_length(v_reason) > 500 then
    return jsonb_build_object('ok', false, 'code', 'validation', 'message', 'Please keep the reason under 500 characters.');
  end if;
  select * into a from public.appointments where id = p_id and user_id = v_uid for update;
  if not found then
    return jsonb_build_object('ok', false, 'code', 'not_found', 'message', 'Booking not found.');
  end if;
  if a.status not in ('pending', 'confirmed') or (a.appointment_date + a.start_time) <= v_now then
    return jsonb_build_object('ok', false, 'code', 'not_cancellable',
      'message', 'This booking can no longer be cancelled online. Please contact the clinic.');
  end if;

  update public.appointments
     set status = 'cancelled', cancelled_at = now(),
         status_reason = 'Cancelled by patient' || coalesce(': ' || v_reason, '')
   where id = p_id;
  insert into public.appointment_events (appointment_id, event_type, from_status, to_status, note, actor_id)
  values (p_id, 'status_changed', a.status, 'cancelled', 'Cancelled by patient' || coalesce(': ' || v_reason, ''), v_uid);

  select full_name into v_doctor from public.doctors where id = a.doctor_id;
  for v_admin in select id from public.profiles where role = 'super_admin' loop
    insert into public.notifications (recipient_user_id, appointment_id, doctor_id, event_type, title, message, data)
    values (v_admin.id, a.id, a.doctor_id, 'appointment_cancelled', 'Booking cancelled by patient',
      format('%s cancelled their appointment with %s on %s at %s.',
             split_part(a.patient_name, ' ', 1), v_doctor,
             to_char(a.appointment_date, 'FMMonth FMDD'), to_char(a.start_time, 'FMHH12:MI AM')),
      jsonb_build_object('reference', a.booking_reference));
  end loop;

  return jsonb_build_object('ok', true);
end $$;

revoke execute on function public.patient_link_bookings() from public, anon;
revoke execute on function public.patient_my_appointments() from public, anon;
revoke execute on function public.patient_cancel_appointment(uuid, text) from public, anon;
grant execute on function public.patient_link_bookings() to authenticated;
grant execute on function public.patient_my_appointments() to authenticated;
grant execute on function public.patient_cancel_appointment(uuid, text) to authenticated;
