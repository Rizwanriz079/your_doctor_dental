-- Explicit, minimal Data API privileges. RLS policies still apply on top of these.
-- TRUNCATE bypasses RLS, so it is never granted to API roles.
revoke all on all tables in schema public from anon, authenticated;

-- Public (anon + signed-in) read access; RLS limits rows to active/approved content.
grant select on public.clinic_settings, public.clinic_holidays, public.services, public.doctors,
  public.doctor_services, public.doctor_schedules, public.testimonials
  to anon, authenticated;

-- Signed-in users; every policy below additionally requires is_admin() (or own rows).
grant select, update on public.profiles to authenticated;
grant update on public.clinic_settings to authenticated;
grant insert, update, delete on public.clinic_holidays, public.services, public.doctors,
  public.doctor_services, public.doctor_schedules, public.testimonials to authenticated;
grant select, insert, update, delete on public.doctor_private, public.doctor_schedule_overrides,
  public.doctor_capacity to authenticated;
grant select, update on public.patients to authenticated;
grant select on public.appointments, public.appointment_events, public.notifications, public.audit_logs
  to authenticated;

alter default privileges in schema public revoke all on tables from anon, authenticated;
