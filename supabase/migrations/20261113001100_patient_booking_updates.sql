-- "My appointments" popup: tell the patient what the CLINIC changed on their bookings
-- (confirmed, declined, cancelled, completed, moved to a new time). Adds the latest
-- clinic-made change to each booking. Changes the patient made themselves are ignored.

create or replace function public.patient_my_appointments()
returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare
  v_uid uuid := auth.uid();
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
      'can_cancel', a.status in ('pending', 'confirmed') and (a.appointment_date + a.start_time) > v_now,
      'last_change', (
        select jsonb_build_object('at', e.created_at, 'type', e.event_type, 'to_status', e.to_status,
                                  'from_date', e.details ->> 'from_date', 'from_time', e.details ->> 'from_time')
          from public.appointment_events e
         where e.appointment_id = a.id
           and e.event_type in ('status_changed', 'rescheduled')
           and e.actor_id is distinct from v_uid           -- not the patient's own action
           and not (e.event_type = 'status_changed' and e.to_status = 'expired')
         order by e.created_at desc
         limit 1)
    ) order by a.appointment_date desc, a.start_time desc), '[]'::jsonb)
    into v
    from public.appointments a
    join public.doctors d on d.id = a.doctor_id
    join public.services sv on sv.id = a.service_id
   where a.user_id = v_uid;
  return v;
end $$;

revoke execute on function public.patient_my_appointments() from public, anon;
grant execute on function public.patient_my_appointments() to authenticated;
