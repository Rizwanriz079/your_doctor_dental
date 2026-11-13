-- patients.user_id was never filled: bookings attach the account to the APPOINTMENT
-- (appointments.user_id) but not to the PATIENT record. This links the patient record to
-- the signed-in account that booked, fills a missing email from the account, and backfills
-- existing rows. (patients.user_id is unique, so an account is linked to one patient record;
-- extra records for other phone numbers keep user_id empty.)

create or replace function public._patients_link_account()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  v_email text;
begin
  if new.user_id is null or new.patient_id is null then
    return new;
  end if;
  select lower(email) into v_email from auth.users where id = new.user_id;

  update public.patients p
     set user_id = case
           when p.user_id is null and not exists (select 1 from public.patients x where x.user_id = new.user_id)
           then new.user_id else p.user_id end,
         email = coalesce(p.email, nullif(new.patient_email, ''), v_email)
   where p.id = new.patient_id
     and (p.user_id is null or p.email is null);
  return new;
end $$;
revoke execute on function public._patients_link_account() from public, anon, authenticated;

drop trigger if exists appointments_link_patient on public.appointments;
create trigger appointments_link_patient after insert or update of user_id on public.appointments
  for each row execute function public._patients_link_account();

-- Backfill: one patient record per account (the most recently booked one).
with latest as (
  select distinct on (a.user_id) a.user_id, a.patient_id
    from public.appointments a
   where a.user_id is not null and a.patient_id is not null
   order by a.user_id, a.created_at desc
)
update public.patients p
   set user_id = l.user_id
  from latest l
 where p.id = l.patient_id
   and p.user_id is null
   and not exists (select 1 from public.patients x where x.user_id = l.user_id);

-- Backfill missing patient emails from their bookings or linked account.
update public.patients p
   set email = coalesce(
         (select nullif(a.patient_email, '') from public.appointments a
           where a.patient_id = p.id and nullif(a.patient_email, '') is not null
           order by a.created_at desc limit 1),
         (select lower(u.email) from auth.users u where u.id = p.user_id))
 where p.email is null;
