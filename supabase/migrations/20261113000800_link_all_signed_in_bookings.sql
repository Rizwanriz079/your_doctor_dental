-- Fix: bookings made while signed in as an admin/staff account were saved with user_id = null,
-- so they showed on the confirmation screen but never in "My appointments" after a refresh.
-- appointments are only ever inserted through book_appointment() (no dashboard insert path),
-- so every booking made with a session belongs to that account.
create or replace function public._appointments_set_user()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if new.user_id is null and auth.uid() is not null then
    new.user_id := auth.uid();
  end if;
  return new;
end $$;

drop trigger if exists appointments_set_user on public.appointments;
create trigger appointments_set_user before insert on public.appointments
  for each row execute function public._appointments_set_user();
