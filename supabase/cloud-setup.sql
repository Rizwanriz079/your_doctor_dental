-- Your Dentist Clinic Platform
-- Supabase Cloud Setup SQL
-- Paste this entire script into Supabase SQL Editor and click "Run"
-- Generated: 2026-11-13

-- =====================================================================
-- Dental clinic platform – core schema
-- Tables, constraints, RLS, availability engine, atomic booking,
-- admin workflows, audit trail, storage and realtime configuration.
-- =====================================================================

create extension if not exists btree_gist with schema extensions;

-- ---------------------------------------------------------------------
-- Generic helpers
-- ---------------------------------------------------------------------
create or replace function public._touch_updated_at()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.updated_at := now();
  return new;
end $$;

-- ---------------------------------------------------------------------
-- Profiles & roles
-- ---------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  email text,
  role text not null default 'patient' check (role in ('super_admin', 'staff', 'patient')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger profiles_touch before update on public.profiles
  for each row execute function public._touch_updated_at();

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1)))
  on conflict (id) do nothing;
  return new;
end $$;

create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.profiles where id = auth.uid() and role = 'super_admin'
  );
$$;

-- Role changes are only possible with the service role / SQL, never from the client.
create or replace function public._guard_profile_role()
returns trigger language plpgsql set search_path = '' as $$
begin
  if new.role is distinct from old.role and coalesce(auth.role(), '') <> 'service_role'
     and current_user not in ('postgres', 'supabase_admin') then
    raise exception 'Role changes are not permitted';
  end if;
  return new;
end $$;
create trigger profiles_guard_role before update on public.profiles
  for each row execute function public._guard_profile_role();

-- ---------------------------------------------------------------------
-- Clinic settings (singleton) – content + booking rules
-- ---------------------------------------------------------------------
create table public.clinic_settings (
  id smallint primary key default 1 check (id = 1),
  clinic_name text not null default 'Your Dentist',
  tagline text not null default 'Gentle, modern dentistry',
  logo_path text,
  hero_eyebrow text not null default 'Modern dentistry · Personal care',
  hero_heading text not null default 'Your Smile Deserves the Best Care.',
  hero_text text not null default 'Thoughtful, precise dental care in a calm, modern clinic, from routine check-ups to complete smile makeovers.',
  hero_image_path text,
  hero_highlights jsonb not null default '[]'::jsonb,      -- [{title, text}]
  benefits jsonb not null default '[]'::jsonb,             -- [{title, text, icon}]
  stats jsonb not null default '[]'::jsonb,                -- [{value, suffix, label}] – genuine figures only
  about_heading text not null default 'About our clinic',
  about_overview text not null default '',
  mission text not null default '',
  clinic_values jsonb not null default '[]'::jsonb,        -- [{title, text}]
  facilities text not null default '',
  technology text not null default '',
  gallery jsonb not null default '[]'::jsonb,              -- [{path, alt}]
  phone text not null default '',
  email text not null default '',
  address text not null default '',
  map_url text not null default '',
  map_embed_url text not null default '',
  opening_hours jsonb not null default '[]'::jsonb,        -- [{label, hours}]
  social_links jsonb not null default '{}'::jsonb,         -- {facebook, instagram, x, youtube, linkedin}
  footer_text text not null default '',
  privacy_text text not null default '',
  terms_text text not null default '',
  timezone text not null default 'Asia/Dubai',
  booking_window_days int not null default 60 check (booking_window_days between 1 and 365),
  min_notice_minutes int not null default 60 check (min_notice_minutes between 0 and 10080),
  pending_expiry_hours int check (pending_expiry_hours is null or pending_expiry_hours between 1 and 720),
  max_daily_capacity_limit int not null default 100 check (max_daily_capacity_limit between 1 and 1000),
  require_email boolean not null default false,
  currency text not null default 'AED' check (currency ~ '^[A-Z]{3}$'),
  updated_at timestamptz not null default now()
);
create trigger clinic_settings_touch before update on public.clinic_settings
  for each row execute function public._touch_updated_at();

create table public.clinic_holidays (
  id uuid primary key default gen_random_uuid(),
  holiday_date date not null unique,
  name text not null,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- Services
-- ---------------------------------------------------------------------
create table public.services (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 2 and 120),
  slug text not null unique,
  category text not null default 'General',
  short_description text not null default '',
  description text not null default '',
  procedure_details text not null default '',
  image_path text,
  duration_minutes int check (duration_minutes is null or duration_minutes between 5 and 480),
  price numeric(10, 2) check (price is null or price >= 0),
  show_price boolean not null default false,
  is_active boolean not null default true,
  is_featured boolean not null default false,
  sort_order int not null default 0,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger services_touch before update on public.services
  for each row execute function public._touch_updated_at();

-- ---------------------------------------------------------------------
-- Doctors
-- ---------------------------------------------------------------------
create table public.doctors (
  id uuid primary key default gen_random_uuid(),
  full_name text not null check (char_length(full_name) between 2 and 120),
  slug text not null unique,
  profile_image_path text,
  qualification text not null default '',
  specialization text not null check (char_length(specialization) between 2 and 120),
  experience_years int check (experience_years is null or experience_years between 0 and 70),
  biography text not null default '',
  default_appointment_duration_minutes int not null default 30 check (default_appointment_duration_minutes between 5 and 240),
  buffer_minutes int not null default 0 check (buffer_minutes between 0 and 120),
  default_daily_capacity int not null check (default_daily_capacity > 0),
  status text not null default 'active' check (status in ('active', 'inactive', 'archived')),
  accepting_bookings boolean not null default true,
  show_on_homepage boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz
);
create trigger doctors_touch before update on public.doctors
  for each row execute function public._touch_updated_at();
create index doctors_status_idx on public.doctors (status, accepting_bookings);

-- Contact details kept apart from the public profile.
create table public.doctor_private (
  doctor_id uuid primary key references public.doctors(id) on delete cascade,
  phone text not null default '',
  email text not null default '',
  internal_notes text not null default ''
);

create table public.doctor_services (
  doctor_id uuid not null references public.doctors(id) on delete cascade,
  service_id uuid not null references public.services(id) on delete cascade,
  primary key (doctor_id, service_id)
);
create index doctor_services_service_idx on public.doctor_services (service_id);

-- Weekly recurring working intervals. Several rows per weekday = several sessions
-- (e.g. 09:00–13:00 and 14:00–18:00; the gap is the break).
create table public.doctor_schedules (
  id uuid primary key default gen_random_uuid(),
  doctor_id uuid not null references public.doctors(id) on delete cascade,
  weekday smallint not null check (weekday between 0 and 6), -- 0 = Sunday
  start_time time not null,
  end_time time not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (end_time > start_time),
  exclude using gist (
    doctor_id with =, weekday with =,
    tsrange('2000-01-01'::date + start_time, '2000-01-01'::date + end_time, '[)') with &&
  )
);
create trigger doctor_schedules_touch before update on public.doctor_schedules
  for each row execute function public._touch_updated_at();

-- Date-specific hours or closure (leave, partial day, special hours).
create table public.doctor_schedule_overrides (
  id uuid primary key default gen_random_uuid(),
  doctor_id uuid not null references public.doctors(id) on delete cascade,
  schedule_date date not null,
  is_closed boolean not null default false,
  start_time time,
  end_time time,
  reason text not null default '',
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (doctor_id, schedule_date),
  check (is_closed or (start_time is not null and end_time is not null and end_time > start_time))
);

-- Date-specific capacity overrides.
create table public.doctor_capacity (
  id uuid primary key default gen_random_uuid(),
  doctor_id uuid not null references public.doctors(id) on delete cascade,
  capacity_date date not null,
  max_bookings int not null check (max_bookings >= 0),
  reason text not null default '',
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (doctor_id, capacity_date)
);
create trigger doctor_capacity_touch before update on public.doctor_capacity
  for each row execute function public._touch_updated_at();

-- ---------------------------------------------------------------------
-- Patients & appointments
-- ---------------------------------------------------------------------
create table public.patients (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique references auth.users(id) on delete set null,
  full_name text not null,
  phone text not null unique,          -- normalised; guest de-duplication key
  email text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  last_booking_at timestamptz
);
create trigger patients_touch before update on public.patients
  for each row execute function public._touch_updated_at();

create table public.appointments (
  id uuid primary key default gen_random_uuid(),
  booking_reference text not null unique,
  patient_id uuid references public.patients(id) on delete restrict,
  patient_name text not null,
  patient_phone text not null,
  patient_email text,
  doctor_id uuid not null references public.doctors(id) on delete restrict,
  service_id uuid not null references public.services(id) on delete restrict,
  appointment_date date not null,
  start_time time not null,
  end_time time not null,
  time_range tsrange generated always as (
    tsrange(appointment_date + start_time, appointment_date + end_time, '[)')
  ) stored,
  status text not null default 'pending'
    check (status in ('pending', 'confirmed', 'rejected', 'cancelled', 'completed', 'expired')),
  hold_expires_at timestamptz,
  patient_message text,
  status_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  confirmed_at timestamptz,
  cancelled_at timestamptz,
  completed_at timestamptz,
  check (end_time > start_time),
  -- Hard guarantee: one doctor can never have two active bookings that overlap.
  constraint appointments_no_overlap exclude using gist (
    doctor_id with =, time_range with &&
  ) where (status in ('pending', 'confirmed', 'completed'))
);
create trigger appointments_touch before update on public.appointments
  for each row execute function public._touch_updated_at();
create index appointments_doctor_date_idx on public.appointments (doctor_id, appointment_date);
create index appointments_date_idx on public.appointments (appointment_date);
create index appointments_status_idx on public.appointments (status);
create index appointments_patient_idx on public.appointments (patient_id);
create index appointments_phone_created_idx on public.appointments (patient_phone, created_at);

create table public.appointment_events (
  id bigint generated always as identity primary key,
  appointment_id uuid not null references public.appointments(id) on delete cascade,
  event_type text not null check (event_type in ('created', 'status_changed', 'rescheduled', 'note')),
  from_status text,
  to_status text,
  note text,
  details jsonb not null default '{}'::jsonb,
  actor_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);
create index appointment_events_appt_idx on public.appointment_events (appointment_id, created_at);

-- ---------------------------------------------------------------------
-- Notifications (one row per recipient so read-state is per admin)
-- ---------------------------------------------------------------------
create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  recipient_user_id uuid not null references auth.users(id) on delete cascade,
  appointment_id uuid references public.appointments(id) on delete cascade,
  doctor_id uuid references public.doctors(id) on delete cascade,
  event_type text not null,
  title text not null,
  message text not null,
  data jsonb not null default '{}'::jsonb,
  is_read boolean not null default false,
  created_at timestamptz not null default now(),
  read_at timestamptz
);
create index notifications_recipient_idx on public.notifications (recipient_user_id, created_at desc);
create index notifications_unread_idx on public.notifications (recipient_user_id) where not is_read;

-- ---------------------------------------------------------------------
-- Testimonials & audit log
-- ---------------------------------------------------------------------
create table public.testimonials (
  id uuid primary key default gen_random_uuid(),
  author_display text not null,          -- name or initials, only with consent
  content text not null check (char_length(content) between 5 and 1200),
  rating smallint check (rating is null or rating between 1 and 5),
  consent_confirmed boolean not null default false,
  is_approved boolean not null default false,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (not is_approved or consent_confirmed)
);
create trigger testimonials_touch before update on public.testimonials
  for each row execute function public._touch_updated_at();

create table public.audit_logs (
  id bigint generated always as identity primary key,
  actor_id uuid references auth.users(id) on delete set null,
  action text not null,
  table_name text not null,
  record_id text,
  changed_fields text[] not null default '{}',
  created_at timestamptz not null default now()
);
create index audit_logs_created_idx on public.audit_logs (created_at desc);

-- Records who changed which fields – field names only, never patient values.
create or replace function public._audit()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  v_old jsonb := case when tg_op in ('UPDATE', 'DELETE') then to_jsonb(old) else '{}'::jsonb end;
  v_new jsonb := case when tg_op in ('UPDATE', 'INSERT') then to_jsonb(new) else '{}'::jsonb end;
  v_fields text[];
begin
  select coalesce(array_agg(k order by k), '{}') into v_fields
  from (select jsonb_object_keys(v_old || v_new) as k) keys
  where k not in ('updated_at', 'created_at', 'time_range')
    and (v_old -> k) is distinct from (v_new -> k);
  if tg_op = 'UPDATE' and cardinality(v_fields) = 0 then
    return new;
  end if;
  insert into public.audit_logs (actor_id, action, table_name, record_id, changed_fields)
  values (auth.uid(), lower(tg_op), tg_table_name,
          coalesce(v_new ->> 'id', v_old ->> 'id', v_new ->> 'doctor_id', v_old ->> 'doctor_id'), v_fields);
  return coalesce(new, old);
end $$;

create trigger audit_doctors after insert or update or delete on public.doctors for each row execute function public._audit();
create trigger audit_doctor_private after insert or update or delete on public.doctor_private for each row execute function public._audit();
create trigger audit_services after insert or update or delete on public.services for each row execute function public._audit();
create trigger audit_schedules after insert or update or delete on public.doctor_schedules for each row execute function public._audit();
create trigger audit_overrides after insert or update or delete on public.doctor_schedule_overrides for each row execute function public._audit();
create trigger audit_capacity after insert or update or delete on public.doctor_capacity for each row execute function public._audit();
create trigger audit_settings after update on public.clinic_settings for each row execute function public._audit();
create trigger audit_holidays after insert or update or delete on public.clinic_holidays for each row execute function public._audit();
create trigger audit_testimonials after insert or update or delete on public.testimonials for each row execute function public._audit();
create trigger audit_patients after update or delete on public.patients for each row execute function public._audit();

-- =====================================================================
-- Availability engine
-- =====================================================================

-- Single authoritative rule for which bookings consume capacity / block a slot.
create or replace function public._consumes_capacity(p_status text, p_hold_expires_at timestamptz)
returns boolean language sql stable set search_path = '' as $$
  select p_status in ('confirmed', 'completed')
      or (p_status = 'pending' and (p_hold_expires_at is null or p_hold_expires_at > now()));
$$;

create or replace function public._doctor_intervals(p_doctor uuid, p_date date)
returns table (start_time time, end_time time)
language plpgsql stable security definer set search_path = '' as $$
declare
  o public.doctor_schedule_overrides;
begin
  if exists (select 1 from public.clinic_holidays h where h.holiday_date = p_date) then
    return;
  end if;
  select * into o from public.doctor_schedule_overrides x
   where x.doctor_id = p_doctor and x.schedule_date = p_date;
  if found then
    if o.is_closed then
      return;
    end if;
    return query select o.start_time, o.end_time;
    return;
  end if;
  return query
    select s.start_time, s.end_time from public.doctor_schedules s
     where s.doctor_id = p_doctor and s.weekday = extract(dow from p_date)::int
     order by s.start_time;
end $$;

create or replace function public._effective_capacity(p_doctor uuid, p_date date)
returns int language plpgsql stable security definer set search_path = '' as $$
declare
  v int;
begin
  if not exists (select 1 from public._doctor_intervals(p_doctor, p_date)) then
    return 0;
  end if;
  select c.max_bookings into v from public.doctor_capacity c
   where c.doctor_id = p_doctor and c.capacity_date = p_date;
  if found then
    return v;
  end if;
  select d.default_daily_capacity into v from public.doctors d where d.id = p_doctor;
  return coalesce(v, 0);
end $$;

create or replace function public._booked_count(p_doctor uuid, p_date date, p_exclude uuid default null)
returns int language sql stable security definer set search_path = '' as $$
  select count(*)::int from public.appointments a
   where a.doctor_id = p_doctor and a.appointment_date = p_date
     and a.id is distinct from p_exclude
     and public._consumes_capacity(a.status, a.hold_expires_at);
$$;

-- Full availability picture for one doctor/service/date.
create or replace function public._compute_slots(
  p_doctor uuid, p_service uuid, p_date date, p_exclude uuid default null, p_admin boolean default false
) returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare
  s public.clinic_settings;
  d public.doctors;
  sv public.services;
  v_now timestamp;
  v_today date;
  v_len int;
  v_step int;
  v_capacity int := 0;
  v_booked int := 0;
  v_remaining int := 0;
  v_slots jsonb := '[]'::jsonb;
  v_scheduled boolean := false;
  v_blocked boolean := false;
  v_reason text := null;
  v_any_available boolean := false;
  r record;
  t timestamp;
  t_end timestamp;
  v_avail boolean;
begin
  select * into s from public.clinic_settings where id = 1;
  v_now := now() at time zone s.timezone;
  v_today := v_now::date;
  select * into d from public.doctors where id = p_doctor;
  select * into sv from public.services where id = p_service;

  if d.id is null or d.status <> 'active' or not d.accepting_bookings then
    v_reason := 'doctor_unavailable';
  elsif sv.id is null or not sv.is_active or sv.archived_at is not null then
    v_reason := 'service_unavailable';
  elsif not exists (select 1 from public.doctor_services ds where ds.doctor_id = p_doctor and ds.service_id = p_service) then
    v_reason := 'service_not_offered';
  elsif p_date is null or p_date < v_today then
    v_reason := 'date_in_past';
  elsif not p_admin and p_date > v_today + s.booking_window_days then
    v_reason := 'beyond_booking_window';
  end if;

  if v_reason is null then
    v_blocked := exists (select 1 from public.clinic_holidays h where h.holiday_date = p_date)
      or exists (select 1 from public.doctor_schedule_overrides o
                  where o.doctor_id = p_doctor and o.schedule_date = p_date and o.is_closed);
    v_scheduled := exists (select 1 from public._doctor_intervals(p_doctor, p_date));
    if v_blocked then
      v_reason := 'date_blocked';
    elsif not v_scheduled then
      v_reason := 'not_scheduled';
    end if;
  end if;

  if v_reason is null then
    v_capacity := public._effective_capacity(p_doctor, p_date);
    v_booked := public._booked_count(p_doctor, p_date, p_exclude);
    v_remaining := greatest(v_capacity - v_booked, 0);
    v_len := coalesce(sv.duration_minutes, d.default_appointment_duration_minutes);
    v_step := d.default_appointment_duration_minutes + d.buffer_minutes;

    for r in select * from public._doctor_intervals(p_doctor, p_date) loop
      t := p_date + r.start_time;
      while t + make_interval(mins => v_len) <= p_date + r.end_time loop
        t_end := t + make_interval(mins => v_len);
        v_avail := v_remaining > 0
          and (p_admin or t >= v_now + make_interval(mins => s.min_notice_minutes))
          and t >= v_now
          and not exists (
            select 1 from public.appointments a
             where a.doctor_id = p_doctor
               and a.id is distinct from p_exclude
               and public._consumes_capacity(a.status, a.hold_expires_at)
               and a.time_range && tsrange(t, t_end, '[)')
          );
        v_any_available := v_any_available or v_avail;
        v_slots := v_slots || jsonb_build_object(
          'start', to_char(t, 'HH24:MI'), 'end', to_char(t_end, 'HH24:MI'), 'available', v_avail);
        t := t + make_interval(mins => v_step);
      end loop;
    end loop;

    if v_remaining = 0 then
      v_reason := 'fully_booked';
    elsif not v_any_available then
      v_reason := 'no_slots_left';
    end if;
  end if;

  return jsonb_build_object(
    'date', p_date,
    'bookable', v_reason is null,
    'reason', v_reason,
    'scheduled', v_scheduled,
    'blocked', v_blocked,
    'capacity', v_capacity,
    'booked', v_booked,
    'remaining', v_remaining,
    'fully_booked', v_reason = 'fully_booked',
    'duration_minutes', v_len,
    'slots', v_slots
  );
end $$;

-- PUBLIC: slots for a day (no patient data is exposed).
create or replace function public.get_available_slots(p_doctor uuid, p_service uuid, p_date date)
returns jsonb language sql stable security definer set search_path = '' as $$
  select public._compute_slots(p_doctor, p_service, p_date, null, false);
$$;

-- PUBLIC: per-day status for a calendar month view.
create or replace function public.get_doctor_calendar(p_doctor uuid, p_service uuid, p_from date, p_to date)
returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare
  v_day date;
  v_res jsonb;
  v_out jsonb := '[]'::jsonb;
  v_status text;
begin
  if p_from is null or p_to is null or p_to < p_from or p_to - p_from > 62 then
    raise exception 'Invalid date range';
  end if;
  v_day := p_from;
  while v_day <= p_to loop
    v_res := public._compute_slots(p_doctor, p_service, v_day, null, false);
    v_status := case
      when (v_res ->> 'bookable')::boolean then 'available'
      when v_res ->> 'reason' = 'fully_booked' then 'full'
      when v_res ->> 'reason' = 'no_slots_left' then 'full'
      when v_res ->> 'reason' in ('date_blocked', 'not_scheduled') then 'closed'
      when v_res ->> 'reason' in ('date_in_past', 'beyond_booking_window') then 'out_of_range'
      else 'unavailable' end;
    v_out := v_out || jsonb_build_object('date', v_day, 'status', v_status,
                                         'remaining', (v_res ->> 'remaining')::int);
    v_day := v_day + 1;
  end loop;
  return v_out;
end $$;

-- Release pending holds whose expiry has passed.
create or replace function public.expire_stale_holds(p_doctor uuid default null, p_date date default null)
returns int language plpgsql security definer set search_path = '' as $$
declare
  v_count int := 0;
  r record;
begin
  for r in
    update public.appointments a set status = 'expired', status_reason = 'Pending hold expired'
     where a.status = 'pending' and a.hold_expires_at is not null and a.hold_expires_at <= now()
       and (p_doctor is null or a.doctor_id = p_doctor)
       and (p_date is null or a.appointment_date = p_date)
    returning a.id
  loop
    insert into public.appointment_events (appointment_id, event_type, from_status, to_status, note)
    values (r.id, 'status_changed', 'pending', 'expired', 'Pending hold expired automatically');
    v_count := v_count + 1;
  end loop;
  return v_count;
end $$;

-- =====================================================================
-- Atomic booking
-- =====================================================================
create or replace function public.book_appointment(
  p_service_id uuid,
  p_doctor_id uuid,
  p_date date,
  p_start_time text,
  p_patient_name text,
  p_patient_phone text,
  p_patient_email text,
  p_message text,
  p_consent boolean
) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  s public.clinic_settings;
  d public.doctors;
  sv public.services;
  v_name text := btrim(coalesce(p_patient_name, ''));
  v_phone text := regexp_replace(coalesce(p_patient_phone, ''), '[^0-9+]', '', 'g');
  v_email text := nullif(lower(btrim(coalesce(p_patient_email, ''))), '');
  v_message text := nullif(btrim(coalesce(p_message, '')), '');
  v_start time;
  v_avail jsonb;
  v_slot jsonb;
  v_patient_id uuid;
  v_ref text;
  v_appt public.appointments;
  v_admin record;
  v_first text;
begin
  select * into s from public.clinic_settings where id = 1;

  -- 1. Input validation (mirrors client-side Zod schema)
  if char_length(v_name) < 2 or char_length(v_name) > 100 then
    return jsonb_build_object('ok', false, 'code', 'invalid_name', 'message', 'Please enter your full name.');
  end if;
  if v_phone !~ '^\+?[0-9]{7,15}$' then
    return jsonb_build_object('ok', false, 'code', 'invalid_phone', 'message', 'Please enter a valid phone number.');
  end if;
  if v_email is not null and v_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then
    return jsonb_build_object('ok', false, 'code', 'invalid_email', 'message', 'Please enter a valid email address.');
  end if;
  if s.require_email and v_email is null then
    return jsonb_build_object('ok', false, 'code', 'invalid_email', 'message', 'An email address is required.');
  end if;
  if v_message is not null and char_length(v_message) > 1000 then
    return jsonb_build_object('ok', false, 'code', 'invalid_message', 'message', 'Message is too long.');
  end if;
  if not coalesce(p_consent, false) then
    return jsonb_build_object('ok', false, 'code', 'consent_required', 'message', 'Please accept the privacy notice.');
  end if;
  begin
    v_start := p_start_time::time;
  exception when others then
    return jsonb_build_object('ok', false, 'code', 'invalid_time', 'message', 'Please choose a valid time.');
  end;

  -- 2. Abuse protection: limit bookings per phone number per hour.
  if (select count(*) from public.appointments a
       where a.patient_phone = v_phone and a.created_at > now() - interval '1 hour') >= 3 then
    return jsonb_build_object('ok', false, 'code', 'rate_limited',
      'message', 'Too many booking attempts. Please call the clinic or try again later.');
  end if;

  -- 3. Serialise all bookings for this doctor/date.
  perform pg_advisory_xact_lock(hashtextextended(p_doctor_id::text || ':' || p_date::text, 0));

  -- 4. Release expired holds before counting.
  perform public.expire_stale_holds(p_doctor_id, p_date);

  -- 5. Re-check doctor, service, schedule, capacity and slot conflicts.
  v_avail := public._compute_slots(p_doctor_id, p_service_id, p_date, null, false);
  if not (v_avail ->> 'bookable')::boolean then
    return jsonb_build_object('ok', false, 'code', v_avail ->> 'reason',
      'message', case v_avail ->> 'reason'
        when 'fully_booked' then 'This doctor is fully booked on the selected date.'
        when 'no_slots_left' then 'There are no remaining times on this date.'
        when 'doctor_unavailable' then 'This doctor is not accepting bookings.'
        when 'service_unavailable' then 'This service is not currently available.'
        when 'service_not_offered' then 'This doctor does not offer the selected service.'
        when 'date_blocked' then 'The clinic is closed on the selected date.'
        when 'not_scheduled' then 'The doctor is not working on the selected date.'
        else 'The selected date is not available.' end);
  end if;

  select x into v_slot from jsonb_array_elements(v_avail -> 'slots') x
   where x ->> 'start' = to_char(v_start, 'HH24:MI');
  if v_slot is null then
    return jsonb_build_object('ok', false, 'code', 'invalid_slot', 'message', 'That time is outside the doctor''s schedule.');
  end if;
  if not (v_slot ->> 'available')::boolean then
    return jsonb_build_object('ok', false, 'code', 'slot_taken',
      'message', 'Sorry, that time was just taken. Please choose another time.');
  end if;

  select * into d from public.doctors where id = p_doctor_id;
  select * into sv from public.services where id = p_service_id;

  -- 6. Find or create the patient record (de-duplicated by phone).
  insert into public.patients (full_name, phone, email, last_booking_at)
  values (v_name, v_phone, v_email, now())
  on conflict (phone) do update
    set last_booking_at = now(),
        email = coalesce(public.patients.email, excluded.email)
  returning id into v_patient_id;

  -- 7. Create the appointment with a unique reference.
  loop
    v_ref := 'YD-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8));
    exit when not exists (select 1 from public.appointments where booking_reference = v_ref);
  end loop;

  begin
    insert into public.appointments (
      booking_reference, patient_id, patient_name, patient_phone, patient_email,
      doctor_id, service_id, appointment_date, start_time, end_time, status,
      hold_expires_at, patient_message)
    values (
      v_ref, v_patient_id, v_name, v_phone, v_email,
      p_doctor_id, p_service_id, p_date, v_start, (v_slot ->> 'end')::time, 'pending',
      case when s.pending_expiry_hours is null then null
           else now() + make_interval(hours => s.pending_expiry_hours) end,
      v_message)
    returning * into v_appt;
  exception when exclusion_violation then
    return jsonb_build_object('ok', false, 'code', 'slot_taken',
      'message', 'Sorry, that time was just taken. Please choose another time.');
  end;

  insert into public.appointment_events (appointment_id, event_type, to_status, note)
  values (v_appt.id, 'created', 'pending', 'Booked online');

  -- 8. Notify every super admin, in the same transaction as the booking.
  v_first := split_part(v_name, ' ', 1);
  for v_admin in select id from public.profiles where role = 'super_admin' loop
    insert into public.notifications (recipient_user_id, appointment_id, doctor_id, event_type, title, message, data)
    values (
      v_admin.id, v_appt.id, d.id, 'appointment_created', 'New appointment booking',
      format('%s has requested an appointment with %s for %s on %s at %s.',
             v_first, d.full_name, sv.name,
             to_char(p_date, 'FMMonth FMDD'), to_char(v_start, 'FMHH12:MI AM')),
      jsonb_build_object('reference', v_ref, 'doctor', d.full_name, 'service', sv.name,
                         'date', p_date, 'time', to_char(v_start, 'HH24:MI')));
  end loop;

  return jsonb_build_object(
    'ok', true,
    'reference', v_ref,
    'status', 'pending',
    'doctor_name', d.full_name,
    'service_name', sv.name,
    'date', p_date,
    'start_time', to_char(v_start, 'HH24:MI'),
    'end_time', v_slot ->> 'end');
end $$;

-- PUBLIC: guest booking status lookup (reference + phone must both match).
create or replace function public.lookup_appointment(p_reference text, p_phone text)
returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare
  v_phone text := regexp_replace(coalesce(p_phone, ''), '[^0-9+]', '', 'g');
  v jsonb;
begin
  select jsonb_build_object(
    'reference', a.booking_reference, 'status', a.status,
    'date', a.appointment_date, 'start_time', to_char(a.start_time, 'HH24:MI'),
    'end_time', to_char(a.end_time, 'HH24:MI'),
    'doctor_name', d.full_name, 'service_name', sv.name,
    'patient_first_name', split_part(a.patient_name, ' ', 1),
    'status_reason', case when a.status in ('rejected', 'cancelled') then a.status_reason end)
  into v
  from public.appointments a
  join public.doctors d on d.id = a.doctor_id
  join public.services sv on sv.id = a.service_id
  where a.booking_reference = upper(btrim(coalesce(p_reference, ''))) and a.patient_phone = v_phone;
  return v;
end $$;

-- =====================================================================
-- Admin workflows (all re-check is_admin())
-- =====================================================================
create or replace function public._require_admin()
returns void language plpgsql stable security definer set search_path = '' as $$
begin
  if not public.is_admin() then
    raise exception 'Not authorised' using errcode = '42501';
  end if;
end $$;

create or replace function public.admin_set_appointment_status(p_id uuid, p_status text, p_reason text default null)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  a public.appointments;
  v_reason text := nullif(btrim(coalesce(p_reason, '')), '');
  v_allowed boolean;
begin
  perform public._require_admin();
  select * into a from public.appointments where id = p_id for update;
  if not found then
    return jsonb_build_object('ok', false, 'code', 'not_found', 'message', 'Appointment not found.');
  end if;

  v_allowed := case a.status
    when 'pending' then p_status in ('confirmed', 'rejected', 'cancelled')
    when 'confirmed' then p_status in ('completed', 'cancelled')
    else false end;
  if not v_allowed then
    return jsonb_build_object('ok', false, 'code', 'invalid_transition',
      'message', format('Cannot change a %s appointment to %s.', a.status, p_status));
  end if;
  if p_status in ('rejected', 'cancelled') and v_reason is null then
    return jsonb_build_object('ok', false, 'code', 'reason_required', 'message', 'Please give a reason.');
  end if;
  if a.status = 'pending' and p_status = 'confirmed'
     and a.hold_expires_at is not null and a.hold_expires_at <= now() then
    perform public.expire_stale_holds(a.doctor_id, a.appointment_date);
    return jsonb_build_object('ok', false, 'code', 'hold_expired',
      'message', 'This pending booking has expired and its slot was released.');
  end if;

  update public.appointments set
    status = p_status,
    status_reason = coalesce(v_reason, status_reason),
    hold_expires_at = case when p_status = 'confirmed' then null else hold_expires_at end,
    confirmed_at = case when p_status = 'confirmed' then now() else confirmed_at end,
    cancelled_at = case when p_status in ('cancelled', 'rejected') then now() else cancelled_at end,
    completed_at = case when p_status = 'completed' then now() else completed_at end
  where id = p_id;

  insert into public.appointment_events (appointment_id, event_type, from_status, to_status, note, actor_id)
  values (p_id, 'status_changed', a.status, p_status, v_reason, auth.uid());

  return jsonb_build_object('ok', true, 'status', p_status);
end $$;

create or replace function public.admin_reschedule_appointment(
  p_id uuid, p_new_date date, p_new_start text, p_reason text default null
) returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  a public.appointments;
  v_start time;
  v_avail jsonb;
  v_slot jsonb;
  k1 bigint;
  k2 bigint;
begin
  perform public._require_admin();
  begin
    v_start := p_new_start::time;
  exception when others then
    return jsonb_build_object('ok', false, 'code', 'invalid_time', 'message', 'Invalid time.');
  end;

  select * into a from public.appointments where id = p_id;
  if not found then
    return jsonb_build_object('ok', false, 'code', 'not_found', 'message', 'Appointment not found.');
  end if;
  if a.status not in ('pending', 'confirmed') then
    return jsonb_build_object('ok', false, 'code', 'invalid_transition',
      'message', 'Only pending or confirmed appointments can be rescheduled.');
  end if;

  -- Lock old and new doctor/date in a stable order to avoid deadlocks.
  k1 := hashtextextended(a.doctor_id::text || ':' || a.appointment_date::text, 0);
  k2 := hashtextextended(a.doctor_id::text || ':' || p_new_date::text, 0);
  perform pg_advisory_xact_lock(least(k1, k2));
  if k1 <> k2 then
    perform pg_advisory_xact_lock(greatest(k1, k2));
  end if;
  select * into a from public.appointments where id = p_id for update;

  perform public.expire_stale_holds(a.doctor_id, p_new_date);
  v_avail := public._compute_slots(a.doctor_id, a.service_id, p_new_date, a.id, true);
  if not (v_avail ->> 'bookable')::boolean then
    return jsonb_build_object('ok', false, 'code', v_avail ->> 'reason',
      'message', 'The doctor has no capacity or schedule on that date.');
  end if;
  select x into v_slot from jsonb_array_elements(v_avail -> 'slots') x
   where x ->> 'start' = to_char(v_start, 'HH24:MI');
  if v_slot is null or not (v_slot ->> 'available')::boolean then
    return jsonb_build_object('ok', false, 'code', 'slot_taken', 'message', 'That time is not available.');
  end if;

  begin
    update public.appointments
       set appointment_date = p_new_date, start_time = v_start, end_time = (v_slot ->> 'end')::time
     where id = p_id;
  exception when exclusion_violation then
    return jsonb_build_object('ok', false, 'code', 'slot_taken', 'message', 'That time is not available.');
  end;

  insert into public.appointment_events (appointment_id, event_type, from_status, to_status, note, details, actor_id)
  values (p_id, 'rescheduled', a.status, a.status, nullif(btrim(coalesce(p_reason, '')), ''),
          jsonb_build_object('from_date', a.appointment_date, 'from_time', to_char(a.start_time, 'HH24:MI'),
                             'to_date', p_new_date, 'to_time', to_char(v_start, 'HH24:MI')),
          auth.uid());
  return jsonb_build_object('ok', true);
end $$;

create or replace function public.admin_get_slots(p_doctor uuid, p_service uuid, p_date date, p_exclude uuid default null)
returns jsonb language plpgsql stable security definer set search_path = '' as $$
begin
  perform public._require_admin();
  return public._compute_slots(p_doctor, p_service, p_date, p_exclude, true);
end $$;

create or replace function public.admin_add_appointment_note(p_id uuid, p_note text)
returns jsonb language plpgsql security definer set search_path = '' as $$
begin
  perform public._require_admin();
  if char_length(btrim(coalesce(p_note, ''))) < 1 or char_length(p_note) > 2000 then
    return jsonb_build_object('ok', false, 'message', 'Note must be 1–2000 characters.');
  end if;
  insert into public.appointment_events (appointment_id, event_type, note, actor_id)
  values (p_id, 'note', btrim(p_note), auth.uid());
  return jsonb_build_object('ok', true);
end $$;

-- What would a schedule / default-capacity change affect?
create or replace function public._doctor_change_impact(p_doctor uuid, p_schedules jsonb, p_capacity int)
returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare
  v_today date := (now() at time zone (select timezone from public.clinic_settings where id = 1))::date;
  v_outside jsonb;
  v_over jsonb;
begin
  select coalesce(jsonb_agg(jsonb_build_object(
           'id', a.id, 'reference', a.booking_reference, 'date', a.appointment_date,
           'start_time', to_char(a.start_time, 'HH24:MI'), 'patient_name', a.patient_name)
         order by a.appointment_date, a.start_time), '[]'::jsonb)
    into v_outside
    from public.appointments a
   where a.doctor_id = p_doctor and a.appointment_date >= v_today
     and public._consumes_capacity(a.status, a.hold_expires_at) and a.status <> 'completed'
     and not exists (select 1 from public.doctor_schedule_overrides o
                      where o.doctor_id = p_doctor and o.schedule_date = a.appointment_date)
     and not exists (
       select 1 from jsonb_array_elements(coalesce(p_schedules, '[]'::jsonb)) x
        where (x ->> 'weekday')::int = extract(dow from a.appointment_date)::int
          and (x ->> 'start_time')::time <= a.start_time
          and (x ->> 'end_time')::time >= a.end_time);

  select coalesce(jsonb_agg(jsonb_build_object('date', q.appointment_date, 'booked', q.n)
         order by q.appointment_date), '[]'::jsonb)
    into v_over
    from (
      select a.appointment_date, count(*) n
        from public.appointments a
       where a.doctor_id = p_doctor and a.appointment_date >= v_today
         and public._consumes_capacity(a.status, a.hold_expires_at)
         and not exists (select 1 from public.doctor_capacity c
                          where c.doctor_id = p_doctor and c.capacity_date = a.appointment_date)
       group by a.appointment_date
      having count(*) > p_capacity) q;

  return jsonb_build_object('appointments_outside', v_outside, 'over_capacity_dates', v_over,
    'has_impact', jsonb_array_length(v_outside) > 0 or jsonb_array_length(v_over) > 0);
end $$;

create or replace function public._slugify(p text)
returns text language sql immutable set search_path = '' as $$
  select trim(both '-' from regexp_replace(lower(coalesce(p, '')), '[^a-z0-9]+', '-', 'g'));
$$;

-- Create or update a doctor with services and weekly schedule in one transaction.
create or replace function public.admin_save_doctor(p jsonb)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  s public.clinic_settings;
  v_id uuid := nullif(p ->> 'id', '')::uuid;
  v_name text := btrim(coalesce(p ->> 'full_name', ''));
  v_spec text := btrim(coalesce(p ->> 'specialization', ''));
  v_capacity int := (p ->> 'default_daily_capacity')::int;
  v_duration int := (p ->> 'default_appointment_duration_minutes')::int;
  v_status text := coalesce(p ->> 'status', 'active');
  v_schedules jsonb := coalesce(p -> 'schedules', '[]'::jsonb);
  v_services jsonb := coalesce(p -> 'service_ids', '[]'::jsonb);
  v_impact jsonb;
  v_slug text;
  v_base text;
  v_n int := 1;
  x jsonb;
begin
  perform public._require_admin();
  select * into s from public.clinic_settings where id = 1;

  if char_length(v_name) < 2 then
    return jsonb_build_object('ok', false, 'code', 'validation', 'message', 'Full name is required.');
  end if;
  if char_length(v_spec) < 2 then
    return jsonb_build_object('ok', false, 'code', 'validation', 'message', 'Specialization is required.');
  end if;
  if v_capacity is null or v_capacity < 1 or v_capacity > s.max_daily_capacity_limit then
    return jsonb_build_object('ok', false, 'code', 'validation',
      'message', format('Daily capacity must be between 1 and %s.', s.max_daily_capacity_limit));
  end if;
  if v_duration is null or v_duration < 5 or v_duration > 240 then
    return jsonb_build_object('ok', false, 'code', 'validation', 'message', 'Duration must be 5–240 minutes.');
  end if;
  if v_status not in ('active', 'inactive') then
    return jsonb_build_object('ok', false, 'code', 'validation', 'message', 'Invalid status.');
  end if;
  if jsonb_array_length(v_services) = 0 then
    return jsonb_build_object('ok', false, 'code', 'validation', 'message', 'Assign at least one service.');
  end if;
  if jsonb_array_length(v_schedules) = 0 then
    return jsonb_build_object('ok', false, 'code', 'validation', 'message', 'Add at least one working day.');
  end if;
  for x in select * from jsonb_array_elements(v_schedules) loop
    if (x ->> 'end_time')::time <= (x ->> 'start_time')::time then
      return jsonb_build_object('ok', false, 'code', 'validation', 'message', 'Each session must end after it starts.');
    end if;
  end loop;

  if v_id is not null then
    if not exists (select 1 from public.doctors where id = v_id) then
      return jsonb_build_object('ok', false, 'code', 'not_found', 'message', 'Doctor not found.');
    end if;
    v_impact := public._doctor_change_impact(v_id, v_schedules, v_capacity);
    if (v_impact ->> 'has_impact')::boolean and not coalesce((p ->> 'acknowledge_impact')::boolean, false) then
      return jsonb_build_object('ok', false, 'code', 'impact', 'impact', v_impact,
        'message', 'This change affects existing bookings. Review and confirm to continue.');
    end if;
    update public.doctors set
      full_name = v_name, specialization = v_spec,
      qualification = coalesce(p ->> 'qualification', ''),
      experience_years = nullif(p ->> 'experience_years', '')::int,
      biography = coalesce(p ->> 'biography', ''),
      profile_image_path = nullif(p ->> 'profile_image_path', ''),
      default_appointment_duration_minutes = v_duration,
      buffer_minutes = coalesce((p ->> 'buffer_minutes')::int, 0),
      default_daily_capacity = v_capacity,
      status = case when status = 'archived' then status else v_status end,
      accepting_bookings = coalesce((p ->> 'accepting_bookings')::boolean, true),
      show_on_homepage = coalesce((p ->> 'show_on_homepage')::boolean, true)
    where id = v_id;
  else
    v_base := nullif(public._slugify(v_name), '');
    v_base := coalesce(v_base, 'doctor');
    v_slug := v_base;
    while exists (select 1 from public.doctors where slug = v_slug) loop
      v_n := v_n + 1;
      v_slug := v_base || '-' || v_n;
    end loop;
    insert into public.doctors (full_name, slug, specialization, qualification, experience_years, biography,
      profile_image_path, default_appointment_duration_minutes, buffer_minutes, default_daily_capacity,
      status, accepting_bookings, show_on_homepage)
    values (v_name, v_slug, v_spec, coalesce(p ->> 'qualification', ''),
      nullif(p ->> 'experience_years', '')::int, coalesce(p ->> 'biography', ''),
      nullif(p ->> 'profile_image_path', ''), v_duration, coalesce((p ->> 'buffer_minutes')::int, 0),
      v_capacity, v_status, coalesce((p ->> 'accepting_bookings')::boolean, true),
      coalesce((p ->> 'show_on_homepage')::boolean, true))
    returning id into v_id;
  end if;

  insert into public.doctor_private (doctor_id, phone, email)
  values (v_id, coalesce(p ->> 'phone', ''), coalesce(p ->> 'email', ''))
  on conflict (doctor_id) do update set phone = excluded.phone, email = excluded.email;

  delete from public.doctor_services where doctor_id = v_id;
  insert into public.doctor_services (doctor_id, service_id)
  select v_id, sv.id from public.services sv
   where sv.id in (select (jsonb_array_elements_text(v_services))::uuid);

  delete from public.doctor_schedules where doctor_id = v_id;
  insert into public.doctor_schedules (doctor_id, weekday, start_time, end_time)
  select v_id, (x2 ->> 'weekday')::smallint, (x2 ->> 'start_time')::time, (x2 ->> 'end_time')::time
    from jsonb_array_elements(v_schedules) x2;

  return jsonb_build_object('ok', true, 'id', v_id);
exception
  when exclusion_violation then
    return jsonb_build_object('ok', false, 'code', 'validation', 'message', 'Sessions on the same day must not overlap.');
end $$;

create or replace function public.admin_doctor_impact(p_doctor uuid, p_schedules jsonb, p_capacity int)
returns jsonb language plpgsql stable security definer set search_path = '' as $$
begin
  perform public._require_admin();
  return public._doctor_change_impact(p_doctor, p_schedules, p_capacity);
end $$;

create or replace function public.admin_set_doctor_status(p_id uuid, p_status text, p_accepting boolean)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  d public.doctors;
  v_today date := (now() at time zone (select timezone from public.clinic_settings where id = 1))::date;
  v_upcoming int;
  v_admin record;
begin
  perform public._require_admin();
  select * into d from public.doctors where id = p_id for update;
  if not found then
    return jsonb_build_object('ok', false, 'message', 'Doctor not found.');
  end if;
  if p_status not in ('active', 'inactive', 'archived') then
    return jsonb_build_object('ok', false, 'message', 'Invalid status.');
  end if;

  update public.doctors set
    status = p_status,
    accepting_bookings = case when p_status = 'archived' then false else coalesce(p_accepting, accepting_bookings) end,
    archived_at = case when p_status = 'archived' then coalesce(archived_at, now()) else null end
  where id = p_id;

  select count(*) into v_upcoming from public.appointments a
   where a.doctor_id = p_id and a.appointment_date >= v_today and a.status in ('pending', 'confirmed');

  if v_upcoming > 0 and (p_status <> 'active' or not coalesce(p_accepting, true)) then
    for v_admin in select id from public.profiles where role = 'super_admin' loop
      insert into public.notifications (recipient_user_id, doctor_id, event_type, title, message, data)
      values (v_admin.id, p_id, 'doctor_attention', 'Upcoming bookings need attention',
        format('%s is now %s with %s upcoming appointment(s) that may need rescheduling.',
               d.full_name, case when p_status = 'active' then 'not accepting bookings' else p_status end, v_upcoming),
        jsonb_build_object('upcoming', v_upcoming));
    end loop;
  end if;
  return jsonb_build_object('ok', true, 'upcoming', v_upcoming);
end $$;

create or replace function public.admin_delete_doctor(p_id uuid)
returns jsonb language plpgsql security definer set search_path = '' as $$
begin
  perform public._require_admin();
  if exists (select 1 from public.appointments where doctor_id = p_id) then
    return jsonb_build_object('ok', false, 'code', 'has_history',
      'message', 'This doctor has appointment history. Archive the doctor instead of deleting.');
  end if;
  delete from public.doctors where id = p_id;
  return jsonb_build_object('ok', true);
end $$;

create or replace function public.admin_set_capacity_override(
  p_doctor uuid, p_date date, p_max int, p_reason text default '', p_force boolean default false
) returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_booked int;
  v_limit int := (select max_daily_capacity_limit from public.clinic_settings where id = 1);
begin
  perform public._require_admin();
  if p_max is null then
    delete from public.doctor_capacity where doctor_id = p_doctor and capacity_date = p_date;
    return jsonb_build_object('ok', true, 'removed', true);
  end if;
  if p_max < 0 or p_max > v_limit then
    return jsonb_build_object('ok', false, 'code', 'validation',
      'message', format('Capacity must be between 0 and %s.', v_limit));
  end if;
  v_booked := public._booked_count(p_doctor, p_date);
  if v_booked > p_max and not coalesce(p_force, false) then
    return jsonb_build_object('ok', false, 'code', 'below_booked', 'booked', v_booked,
      'message', format('%s bookings already exist on this date, more than the new limit of %s. Existing bookings will not be cancelled automatically.', v_booked, p_max));
  end if;
  insert into public.doctor_capacity (doctor_id, capacity_date, max_bookings, reason, created_by)
  values (p_doctor, p_date, p_max, coalesce(p_reason, ''), auth.uid())
  on conflict (doctor_id, capacity_date) do update
    set max_bookings = excluded.max_bookings, reason = excluded.reason, created_by = excluded.created_by;
  return jsonb_build_object('ok', true, 'booked', v_booked);
end $$;

create or replace function public.admin_set_schedule_override(
  p_doctor uuid, p_date date, p_closed boolean, p_start text, p_end text,
  p_reason text default '', p_force boolean default false
) returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_start time := nullif(p_start, '')::time;
  v_end time := nullif(p_end, '')::time;
  v_affected jsonb;
begin
  perform public._require_admin();
  if not p_closed and (v_start is null or v_end is null or v_end <= v_start) then
    return jsonb_build_object('ok', false, 'code', 'validation', 'message', 'Enter a valid start and end time.');
  end if;
  select coalesce(jsonb_agg(jsonb_build_object('id', a.id, 'reference', a.booking_reference,
           'start_time', to_char(a.start_time, 'HH24:MI'), 'patient_name', a.patient_name)), '[]'::jsonb)
    into v_affected
    from public.appointments a
   where a.doctor_id = p_doctor and a.appointment_date = p_date and a.status in ('pending', 'confirmed')
     and (p_closed or a.start_time < v_start or a.end_time > v_end);
  if jsonb_array_length(v_affected) > 0 and not coalesce(p_force, false) then
    return jsonb_build_object('ok', false, 'code', 'impact', 'affected', v_affected,
      'message', 'Existing bookings fall outside these hours. They will not be changed automatically.');
  end if;
  insert into public.doctor_schedule_overrides (doctor_id, schedule_date, is_closed, start_time, end_time, reason, created_by)
  values (p_doctor, p_date, p_closed, case when p_closed then null else v_start end,
          case when p_closed then null else v_end end, coalesce(p_reason, ''), auth.uid())
  on conflict (doctor_id, schedule_date) do update set
    is_closed = excluded.is_closed, start_time = excluded.start_time, end_time = excluded.end_time,
    reason = excluded.reason, created_by = excluded.created_by;
  return jsonb_build_object('ok', true, 'affected', v_affected);
end $$;

create or replace function public.admin_day_overview(p_date date)
returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare
  v jsonb;
begin
  perform public._require_admin();
  select coalesce(jsonb_agg(jsonb_build_object(
      'doctor_id', d.id, 'full_name', d.full_name, 'status', d.status,
      'accepting_bookings', d.accepting_bookings,
      'scheduled', exists (select 1 from public._doctor_intervals(d.id, p_date)),
      'capacity', public._effective_capacity(d.id, p_date),
      'has_override', exists (select 1 from public.doctor_capacity c where c.doctor_id = d.id and c.capacity_date = p_date),
      'booked', public._booked_count(d.id, p_date)) order by d.full_name), '[]'::jsonb)
    into v
    from public.doctors d where d.status <> 'archived';
  return v;
end $$;

create or replace function public.admin_mark_notifications_read(p_ids uuid[] default null)
returns int language plpgsql security definer set search_path = '' as $$
declare
  v int;
begin
  perform public._require_admin();
  update public.notifications set is_read = true, read_at = now()
   where recipient_user_id = auth.uid() and not is_read
     and (p_ids is null or id = any (p_ids));
  get diagnostics v = row_count;
  return v;
end $$;

-- =====================================================================
-- Row Level Security
-- =====================================================================
alter table public.profiles enable row level security;
alter table public.clinic_settings enable row level security;
alter table public.clinic_holidays enable row level security;
alter table public.services enable row level security;
alter table public.doctors enable row level security;
alter table public.doctor_private enable row level security;
alter table public.doctor_services enable row level security;
alter table public.doctor_schedules enable row level security;
alter table public.doctor_schedule_overrides enable row level security;
alter table public.doctor_capacity enable row level security;
alter table public.patients enable row level security;
alter table public.appointments enable row level security;
alter table public.appointment_events enable row level security;
alter table public.notifications enable row level security;
alter table public.testimonials enable row level security;
alter table public.audit_logs enable row level security;

create policy "own profile" on public.profiles for select using (id = auth.uid() or public.is_admin());
create policy "update own profile" on public.profiles for update using (id = auth.uid()) with check (id = auth.uid());

create policy "public read settings" on public.clinic_settings for select using (true);
create policy "admin update settings" on public.clinic_settings for update using (public.is_admin()) with check (public.is_admin());

create policy "public read holidays" on public.clinic_holidays for select using (true);
create policy "admin manage holidays" on public.clinic_holidays for all using (public.is_admin()) with check (public.is_admin());

create policy "public read active services" on public.services for select
  using ((is_active and archived_at is null) or public.is_admin());
create policy "admin manage services" on public.services for all using (public.is_admin()) with check (public.is_admin());

create policy "public read active doctors" on public.doctors for select
  using ((status = 'active' and archived_at is null) or public.is_admin());
create policy "admin manage doctors" on public.doctors for all using (public.is_admin()) with check (public.is_admin());

create policy "admin manage doctor_private" on public.doctor_private for all using (public.is_admin()) with check (public.is_admin());

create policy "public read doctor services" on public.doctor_services for select using (true);
create policy "admin manage doctor services" on public.doctor_services for all using (public.is_admin()) with check (public.is_admin());

create policy "public read schedules" on public.doctor_schedules for select using (true);
create policy "admin manage schedules" on public.doctor_schedules for all using (public.is_admin()) with check (public.is_admin());

create policy "admin manage overrides" on public.doctor_schedule_overrides for all using (public.is_admin()) with check (public.is_admin());
create policy "admin manage capacity" on public.doctor_capacity for all using (public.is_admin()) with check (public.is_admin());

create policy "admin read patients" on public.patients for select using (public.is_admin() or user_id = auth.uid());
create policy "admin update patients" on public.patients for update using (public.is_admin()) with check (public.is_admin());

create policy "admin read appointments" on public.appointments for select using (public.is_admin());
create policy "admin read events" on public.appointment_events for select using (public.is_admin());

create policy "own notifications" on public.notifications for select
  using (recipient_user_id = auth.uid() and public.is_admin());

create policy "public read approved testimonials" on public.testimonials for select using (is_approved or public.is_admin());
create policy "admin manage testimonials" on public.testimonials for all using (public.is_admin()) with check (public.is_admin());

create policy "admin read audit" on public.audit_logs for select using (public.is_admin());

-- Booking-relevant writes only happen through security-definer functions.
revoke insert, update, delete on public.appointments, public.appointment_events, public.notifications, public.audit_logs from anon, authenticated;
revoke insert, delete on public.patients from anon, authenticated;
revoke all on public.patients, public.appointments, public.appointment_events, public.doctor_private,
  public.doctor_capacity, public.doctor_schedule_overrides, public.audit_logs from anon;

-- Function execution: internal helpers are not callable from the API.
revoke execute on all functions in schema public from public, anon, authenticated;
grant execute on function public.get_available_slots(uuid, uuid, date) to anon, authenticated;
grant execute on function public.get_doctor_calendar(uuid, uuid, date, date) to anon, authenticated;
grant execute on function public.book_appointment(uuid, uuid, date, text, text, text, text, text, boolean) to anon, authenticated;
grant execute on function public.lookup_appointment(text, text) to anon, authenticated;
grant execute on function public.is_admin() to anon, authenticated;
grant execute on function public.admin_set_appointment_status(uuid, text, text) to authenticated;
grant execute on function public.admin_reschedule_appointment(uuid, date, text, text) to authenticated;
grant execute on function public.admin_get_slots(uuid, uuid, date, uuid) to authenticated;
grant execute on function public.admin_add_appointment_note(uuid, text) to authenticated;
grant execute on function public.admin_save_doctor(jsonb) to authenticated;
grant execute on function public.admin_doctor_impact(uuid, jsonb, int) to authenticated;
grant execute on function public.admin_set_doctor_status(uuid, text, boolean) to authenticated;
grant execute on function public.admin_delete_doctor(uuid) to authenticated;
grant execute on function public.admin_set_capacity_override(uuid, date, int, text, boolean) to authenticated;
grant execute on function public.admin_set_schedule_override(uuid, date, boolean, text, text, text, boolean) to authenticated;
grant execute on function public.admin_day_overview(date) to authenticated;
grant execute on function public.admin_mark_notifications_read(uuid[]) to authenticated;
grant execute on function public.expire_stale_holds(uuid, date) to service_role;
-- RLS policies call these internally.
grant execute on function public._touch_updated_at() to anon, authenticated;
grant execute on function public._consumes_capacity(text, timestamptz) to authenticated;
alter default privileges in schema public revoke execute on functions from public, anon, authenticated;

-- =====================================================================
-- Storage: public-read media bucket, admin-only writes
-- =====================================================================
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('media', 'media', true, 5242880, array['image/jpeg', 'image/png', 'image/webp', 'image/avif'])
on conflict (id) do update set public = excluded.public, file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy "admin upload media" on storage.objects for insert to authenticated
  with check (bucket_id = 'media' and public.is_admin());
create policy "admin update media" on storage.objects for update to authenticated
  using (bucket_id = 'media' and public.is_admin());
create policy "admin delete media" on storage.objects for delete to authenticated
  using (bucket_id = 'media' and public.is_admin());

-- =====================================================================
-- Realtime
-- =====================================================================
alter publication supabase_realtime add table public.notifications;
alter publication supabase_realtime add table public.appointments;

-- =====================================================================
-- Scheduled release of expired pending holds (if pg_cron is available)
-- =====================================================================
do $$
begin
  create extension if not exists pg_cron;
  perform cron.schedule('expire-stale-holds', '*/10 * * * *', 'select public.expire_stale_holds()');
exception when others then
  raise notice 'pg_cron not available; expired holds are released on booking and admin actions.';
end $$;
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
-- Per-date availability summary for one doctor across a date range (admin availability grid).
create or replace function public.admin_doctor_range(p_doctor uuid, p_from date, p_to date)
returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare
  v_day date;
  v_out jsonb := '[]'::jsonb;
  v_cap public.doctor_capacity;
  v_ovr public.doctor_schedule_overrides;
  v_hol public.clinic_holidays;
  v_intervals jsonb;
  v_capacity int;
  v_booked int;
begin
  perform public._require_admin();
  if p_from is null or p_to is null or p_to < p_from or p_to - p_from > 92 then
    raise exception 'Invalid date range (max 93 days)';
  end if;
  v_day := p_from;
  while v_day <= p_to loop
    select * into v_cap from public.doctor_capacity where doctor_id = p_doctor and capacity_date = v_day;
    select * into v_ovr from public.doctor_schedule_overrides where doctor_id = p_doctor and schedule_date = v_day;
    select * into v_hol from public.clinic_holidays where holiday_date = v_day;
    select coalesce(jsonb_agg(jsonb_build_object('start', to_char(i.start_time, 'HH24:MI'), 'end', to_char(i.end_time, 'HH24:MI'))), '[]'::jsonb)
      into v_intervals from public._doctor_intervals(p_doctor, v_day) i;
    v_capacity := public._effective_capacity(p_doctor, v_day);
    v_booked := public._booked_count(p_doctor, v_day);
    v_out := v_out || jsonb_build_object(
      'date', v_day,
      'weekday', extract(dow from v_day)::int,
      'scheduled', jsonb_array_length(v_intervals) > 0,
      'intervals', v_intervals,
      'capacity', v_capacity,
      'booked', v_booked,
      'remaining', greatest(v_capacity - v_booked, 0),
      'over_capacity', v_booked > v_capacity,
      'capacity_override', case when v_cap.id is null then null else jsonb_build_object(
          'max_bookings', v_cap.max_bookings, 'reason', v_cap.reason) end,
      'schedule_override', case when v_ovr.id is null then null else jsonb_build_object(
          'is_closed', v_ovr.is_closed, 'start_time', to_char(v_ovr.start_time, 'HH24:MI'),
          'end_time', to_char(v_ovr.end_time, 'HH24:MI'), 'reason', v_ovr.reason) end,
      'holiday', case when v_hol.id is null then null else v_hol.name end);
    v_day := v_day + 1;
  end loop;
  return v_out;
end $$;

revoke execute on function public.admin_doctor_range(uuid, date, date) from public, anon;
grant execute on function public.admin_doctor_range(uuid, date, date) to authenticated;
-- Create/update a service and replace its doctor assignments in one transaction.
create or replace function public.admin_save_service(p jsonb)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_id uuid := nullif(p ->> 'id', '')::uuid;
begin
  perform public._require_admin();
  if v_id is not null then
    update public.services set
      name = p ->> 'name', slug = p ->> 'slug', category = p ->> 'category',
      short_description = coalesce(p ->> 'short_description', ''),
      description = coalesce(p ->> 'description', ''),
      procedure_details = coalesce(p ->> 'procedure_details', ''),
      image_path = nullif(p ->> 'image_path', ''),
      duration_minutes = nullif(p ->> 'duration_minutes', '')::int,
      price = nullif(p ->> 'price', '')::numeric,
      show_price = coalesce((p ->> 'show_price')::boolean, false),
      is_active = coalesce((p ->> 'is_active')::boolean, true),
      is_featured = coalesce((p ->> 'is_featured')::boolean, false),
      sort_order = coalesce((p ->> 'sort_order')::int, 0)
    where id = v_id;
    if not found then
      return jsonb_build_object('ok', false, 'code', 'not_found', 'message', 'Service not found.');
    end if;
  else
    insert into public.services (name, slug, category, short_description, description, procedure_details,
      image_path, duration_minutes, price, show_price, is_active, is_featured, sort_order)
    values (p ->> 'name', p ->> 'slug', p ->> 'category', coalesce(p ->> 'short_description', ''),
      coalesce(p ->> 'description', ''), coalesce(p ->> 'procedure_details', ''), nullif(p ->> 'image_path', ''),
      nullif(p ->> 'duration_minutes', '')::int, nullif(p ->> 'price', '')::numeric,
      coalesce((p ->> 'show_price')::boolean, false), coalesce((p ->> 'is_active')::boolean, true),
      coalesce((p ->> 'is_featured')::boolean, false), coalesce((p ->> 'sort_order')::int, 0))
    returning id into v_id;
  end if;

  delete from public.doctor_services where service_id = v_id;
  insert into public.doctor_services (doctor_id, service_id)
  select d.id, v_id from public.doctors d
   where d.id in (select (jsonb_array_elements_text(coalesce(p -> 'doctor_ids', '[]'::jsonb)))::uuid);

  return jsonb_build_object('ok', true, 'id', v_id);
exception
  when unique_violation then
    return jsonb_build_object('ok', false, 'code', 'slug_taken', 'message', 'That URL slug is already used by another service.');
  when check_violation then
    return jsonb_build_object('ok', false, 'code', 'validation', 'message', 'Some values are out of range.');
end $$;

revoke execute on function public.admin_save_service(jsonb) from public, anon;
grant execute on function public.admin_save_service(jsonb) to authenticated;
-- Clinic is based in Calicut (Kozhikode), Kerala: default to Indian time zone and currency.
alter table public.clinic_settings alter column timezone set default 'Asia/Kolkata';
alter table public.clinic_settings alter column currency set default 'INR';
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
-- =====================================================================
-- LOCAL DEVELOPMENT SEED ONLY.
-- Demo doctors/services so the UI can be exercised. Replace with the
-- clinic's real data through the admin dashboard before going live.
-- No testimonials or statistics are seeded: only publish verified ones.
-- =====================================================================

insert into public.clinic_settings (id, clinic_name, tagline, phone, email, address, map_url, map_embed_url,
  timezone, currency, opening_hours,
  social_links, footer_text, about_overview, mission, facilities, technology, clinic_values, benefits, hero_highlights)
values (1, 'Your Dentist', 'Gentle, modern dentistry in Calicut',
  '+91 495 000 0000', 'hello@yourdentist.example', 'Mavoor Road, Kozhikode (Calicut), Kerala 673004, India',
  'https://www.google.com/maps/search/?api=1&query=Mavoor+Road%2C+Kozhikode%2C+Kerala',
  'https://maps.google.com/maps?q=Mavoor%20Road%2C%20Kozhikode%2C%20Kerala&z=14&output=embed',
  'Asia/Kolkata', 'INR',
  '[{"label":"Monday – Saturday","hours":"9:00 AM – 7:00 PM"},{"label":"Sunday","hours":"Closed"}]',
  '{"instagram":"https://instagram.com","facebook":"https://facebook.com"}',
  'Calm, precise dental care for the whole family.',
  'Your Dentist is a modern dental clinic in Calicut focused on preventive, restorative and cosmetic dentistry. We take time to explain every option so you can make confident decisions about your care.',
  'To deliver careful, honest dentistry in a calm environment, and to help every patient feel comfortable from the moment they arrive.',
  'Private treatment rooms, a dedicated sterilisation area, and a quiet waiting lounge.',
  'Digital imaging and intraoral scanning help us plan treatment precisely and show you exactly what we see.',
  '[{"title":"Clarity","text":"Clear explanations and transparent treatment plans."},{"title":"Comfort","text":"Unhurried appointments and gentle techniques."},{"title":"Care","text":"Strict hygiene and sterilisation standards."}]',
  '[{"title":"Experienced team","text":"Dentists across general, cosmetic and specialist care.","icon":"stethoscope"},{"title":"Modern equipment","text":"Digital imaging and precise treatment planning.","icon":"scan"},{"title":"Convenient booking","text":"Choose a doctor and time that suits you online.","icon":"calendar"},{"title":"Patient-focused","text":"Time to talk through every option with you.","icon":"heart"}]',
  '[{"title":"Precision","text":"Digital smile planning"},{"title":"Comfort","text":"Gentle, patient-first care"}]')
on conflict (id) do update set clinic_name = excluded.clinic_name;

insert into public.services (id, name, slug, category, short_description, description, procedure_details, duration_minutes, price, show_price, is_featured, sort_order) values
 ('11111111-0000-0000-0000-000000000001', 'Check-up & Cleaning', 'check-up-cleaning', 'Preventive',
  'A thorough examination and professional cleaning to keep teeth and gums healthy.',
  'Regular check-ups help catch problems early. Your dentist examines your teeth, gums and bite, and a professional clean removes plaque and tartar that brushing can miss.',
  'Examination, scaling and polishing, and personalised home-care advice. X-rays are taken only when clinically needed.', 30, null, false, true, 1),
 ('11111111-0000-0000-0000-000000000002', 'Teeth Whitening', 'teeth-whitening', 'Cosmetic',
  'Professional whitening tailored to your smile, after a suitability assessment.',
  'Whitening can lighten natural tooth colour. We first check that whitening is suitable for you and talk through realistic expectations.',
  'Shade assessment, protection of gums, and application of a professional whitening gel.', 60, null, false, true, 2),
 ('11111111-0000-0000-0000-000000000003', 'Dental Implants', 'dental-implants', 'Restorative',
  'A consultation to discuss replacing missing teeth with implants.',
  'Implants are one option for replacing missing teeth. A consultation assesses your bone, gums and general health to find out whether implants suit you.',
  'Consultation, imaging where needed, and a written treatment plan with alternatives.', 45, null, false, true, 3),
 ('11111111-0000-0000-0000-000000000004', 'Orthodontics & Aligners', 'orthodontics-aligners', 'Orthodontic',
  'Assessment for braces or clear aligners to straighten teeth.',
  'Orthodontic treatment can improve the alignment of teeth and bite. We assess your teeth and explain the options available.',
  'Orthodontic assessment, photographs and digital scan where appropriate.', 45, null, false, true, 4),
 ('11111111-0000-0000-0000-000000000005', 'Root Canal Treatment', 'root-canal-treatment', 'Restorative',
  'Treatment to save a tooth with an infected or inflamed nerve.',
  'Root canal treatment removes infected or inflamed tissue from inside a tooth, cleans the canals and seals them.',
  'Local anaesthetic, cleaning and shaping of the canals, and a temporary or permanent seal.', 60, null, false, false, 5),
 ('11111111-0000-0000-0000-000000000006', 'Children''s Dentistry', 'childrens-dentistry', 'Preventive',
  'Gentle, friendly check-ups designed for children.',
  'We help children feel at ease with the dentist, with check-ups and preventive care suited to their age.',
  'Gentle examination, cleaning and preventive advice for parents.', 30, null, false, false, 6)
on conflict (id) do nothing;

-- Photos: free Unsplash stock placeholders in public/images/doctors (see CREDITS.md).
insert into public.doctors (id, full_name, slug, profile_image_path, qualification, specialization, experience_years, biography,
  default_appointment_duration_minutes, buffer_minutes, default_daily_capacity, status, accepting_bookings, sort_order) values
 ('22222222-0000-0000-0000-000000000001', 'Dr. Anjali Menon', 'dr-anjali-menon', '/images/doctors/dr-anjali-menon.jpg',
  'BDS, MDS Conservative Dentistry', 'Restorative Dentistry', 12,
  'Demo profile. Dr. Menon focuses on restorative and implant dentistry and enjoys helping patients rebuild confidence in their smile.',
  30, 0, 25, 'active', true, 1),
 ('22222222-0000-0000-0000-000000000002', 'Dr. Arjun Nair', 'dr-arjun-nair', '/images/doctors/dr-arjun-nair.jpg',
  'BDS, MDS Prosthodontics', 'Cosmetic Dentistry', 8,
  'Demo profile. Dr. Nair practises cosmetic and general dentistry with a calm, detail-focused approach.',
  30, 0, 10, 'active', true, 2),
 ('22222222-0000-0000-0000-000000000003', 'Dr. Rahul Krishnan', 'dr-rahul-krishnan', '/images/doctors/dr-rahul-krishnan.jpg',
  'BDS, MDS Orthodontics', 'Orthodontics', 10,
  'Demo profile. Dr. Krishnan provides orthodontic assessments and treatment with braces and clear aligners.',
  45, 0, 15, 'active', true, 3),
 ('22222222-0000-0000-0000-000000000004', 'Dr. Fathima Rahman', 'dr-fathima-rahman', '/images/doctors/dr-fathima-rahman.jpg',
  'BDS, MDS Paediatric Dentistry', 'Paediatric Dentistry', 6,
  'Demo profile. Dr. Rahman looks after younger patients and focuses on prevention and positive first visits.',
  30, 0, 12, 'active', true, 4)
on conflict (id) do nothing;

insert into public.doctor_private (doctor_id) select id from public.doctors on conflict do nothing;

insert into public.doctor_services (doctor_id, service_id) values
 ('22222222-0000-0000-0000-000000000001', '11111111-0000-0000-0000-000000000001'),
 ('22222222-0000-0000-0000-000000000001', '11111111-0000-0000-0000-000000000003'),
 ('22222222-0000-0000-0000-000000000001', '11111111-0000-0000-0000-000000000005'),
 ('22222222-0000-0000-0000-000000000002', '11111111-0000-0000-0000-000000000001'),
 ('22222222-0000-0000-0000-000000000002', '11111111-0000-0000-0000-000000000002'),
 ('22222222-0000-0000-0000-000000000003', '11111111-0000-0000-0000-000000000004'),
 ('22222222-0000-0000-0000-000000000003', '11111111-0000-0000-0000-000000000001'),
 ('22222222-0000-0000-0000-000000000004', '11111111-0000-0000-0000-000000000006'),
 ('22222222-0000-0000-0000-000000000004', '11111111-0000-0000-0000-000000000001')
on conflict do nothing;

-- Weekly sessions (0 = Sunday; clinic closed Sundays). Morning + afternoon with a lunch break.
insert into public.doctor_schedules (doctor_id, weekday, start_time, end_time)
select d.id, w.wd, s.st, s.et
from public.doctors d
cross join (values (1), (2), (3), (4), (5), (6)) w(wd)
cross join (values ('09:00'::time, '13:00'::time), ('14:00'::time, '18:00'::time)) s(st, et)
where d.id in ('22222222-0000-0000-0000-000000000001', '22222222-0000-0000-0000-000000000003');

insert into public.doctor_schedules (doctor_id, weekday, start_time, end_time)
select d.id, w.wd, '10:00', '16:00'
from public.doctors d
cross join (values (1), (2), (4), (6)) w(wd)
where d.id in ('22222222-0000-0000-0000-000000000002', '22222222-0000-0000-0000-000000000004');

-- ---------------------------------------------------------------------
-- Service photos and additional demo doctors (images in public/images, see CREDITS.md)
-- ---------------------------------------------------------------------
update public.services set image_path = '/images/services/' || slug || '.jpg'
 where slug in ('check-up-cleaning', 'teeth-whitening', 'dental-implants', 'orthodontics-aligners',
                'root-canal-treatment', 'childrens-dentistry')
   and image_path is null;

insert into public.doctors (id, full_name, slug, profile_image_path, qualification, specialization, experience_years, biography,
  default_appointment_duration_minutes, buffer_minutes, default_daily_capacity, status, accepting_bookings, sort_order) values
 ('22222222-0000-0000-0000-000000000005', 'Dr. Vivek Pillai', 'dr-vivek-pillai', '/images/doctors/dr-vivek-pillai.jpg',
  'BDS, MDS Conservative Dentistry & Endodontics', 'Endodontics', 14,
  'Demo profile. Dr. Pillai specialises in root canal treatment and saving natural teeth, with a gentle, step-by-step approach.',
  45, 0, 12, 'active', true, 5),
 ('22222222-0000-0000-0000-000000000006', 'Dr. Muhammed Shafeeq', 'dr-muhammed-shafeeq', '/images/doctors/dr-muhammed-shafeeq.jpg',
  'BDS, MDS Oral & Maxillofacial Surgery', 'Oral & Maxillofacial Surgery', 11,
  'Demo profile. Dr. Shafeeq handles extractions, wisdom teeth and implant surgery, and takes time to explain every step.',
  45, 15, 8, 'active', true, 6),
 ('22222222-0000-0000-0000-000000000007', 'Dr. Sneha Thomas', 'dr-sneha-thomas', '/images/doctors/dr-sneha-thomas.jpg',
  'BDS, MDS Periodontology', 'Periodontics', 9,
  'Demo profile. Dr. Thomas focuses on gum health, deep cleaning and long-term prevention.',
  30, 0, 16, 'active', true, 7),
 ('22222222-0000-0000-0000-000000000008', 'Dr. Divya Raj', 'dr-divya-raj', '/images/doctors/dr-divya-raj.jpg',
  'BDS', 'General Dentistry', 5,
  'Demo profile. Dr. Raj provides friendly everyday dental care for the whole family, from check-ups to whitening.',
  30, 0, 20, 'active', true, 8)
on conflict (id) do nothing;

insert into public.doctor_private (doctor_id) select id from public.doctors on conflict do nothing;

insert into public.doctor_services (doctor_id, service_id) values
 ('22222222-0000-0000-0000-000000000005', '11111111-0000-0000-0000-000000000005'),
 ('22222222-0000-0000-0000-000000000005', '11111111-0000-0000-0000-000000000001'),
 ('22222222-0000-0000-0000-000000000006', '11111111-0000-0000-0000-000000000003'),
 ('22222222-0000-0000-0000-000000000006', '11111111-0000-0000-0000-000000000005'),
 ('22222222-0000-0000-0000-000000000007', '11111111-0000-0000-0000-000000000001'),
 ('22222222-0000-0000-0000-000000000007', '11111111-0000-0000-0000-000000000003'),
 ('22222222-0000-0000-0000-000000000008', '11111111-0000-0000-0000-000000000001'),
 ('22222222-0000-0000-0000-000000000008', '11111111-0000-0000-0000-000000000002'),
 ('22222222-0000-0000-0000-000000000008', '11111111-0000-0000-0000-000000000006')
on conflict do nothing;

-- Schedules only for doctors that have none yet (keeps the seed re-runnable).
insert into public.doctor_schedules (doctor_id, weekday, start_time, end_time)
select v.d::uuid, v.w, v.st::time, v.et::time
from (values
  -- Dr. Pillai: Mon–Fri, morning + afternoon
  ('22222222-0000-0000-0000-000000000005', 1, '09:00', '13:00'), ('22222222-0000-0000-0000-000000000005', 1, '14:00', '17:00'),
  ('22222222-0000-0000-0000-000000000005', 2, '09:00', '13:00'), ('22222222-0000-0000-0000-000000000005', 2, '14:00', '17:00'),
  ('22222222-0000-0000-0000-000000000005', 3, '09:00', '13:00'), ('22222222-0000-0000-0000-000000000005', 3, '14:00', '17:00'),
  ('22222222-0000-0000-0000-000000000005', 4, '09:00', '13:00'), ('22222222-0000-0000-0000-000000000005', 4, '14:00', '17:00'),
  ('22222222-0000-0000-0000-000000000005', 5, '09:00', '13:00'), ('22222222-0000-0000-0000-000000000005', 5, '14:00', '17:00'),
  -- Dr. Shafeeq: Tue, Thu, Sat surgery days
  ('22222222-0000-0000-0000-000000000006', 2, '10:00', '17:00'),
  ('22222222-0000-0000-0000-000000000006', 4, '10:00', '17:00'),
  ('22222222-0000-0000-0000-000000000006', 6, '10:00', '15:00'),
  -- Dr. Thomas: Mon, Wed, Fri, Sat
  ('22222222-0000-0000-0000-000000000007', 1, '11:00', '19:00'),
  ('22222222-0000-0000-0000-000000000007', 3, '11:00', '19:00'),
  ('22222222-0000-0000-0000-000000000007', 5, '11:00', '19:00'),
  ('22222222-0000-0000-0000-000000000007', 6, '09:00', '14:00'),
  -- Dr. Raj: Mon–Sat evenings
  ('22222222-0000-0000-0000-000000000008', 1, '13:00', '19:00'), ('22222222-0000-0000-0000-000000000008', 2, '13:00', '19:00'),
  ('22222222-0000-0000-0000-000000000008', 3, '13:00', '19:00'), ('22222222-0000-0000-0000-000000000008', 4, '13:00', '19:00'),
  ('22222222-0000-0000-0000-000000000008', 5, '13:00', '19:00'), ('22222222-0000-0000-0000-000000000008', 6, '13:00', '19:00')
) v(d, w, st, et)
where not exists (select 1 from public.doctor_schedules s where s.doctor_id = v.d::uuid);


-- Booking requires a signed-in Supabase Auth account, so every appointment is
-- linked to a patient (appointments.user_id) and shows in their history.
-- Anonymous visitors can still browse doctors and see availability.
revoke execute on function public.book_appointment(uuid, uuid, date, text, text, text, text, text, boolean) from public, anon;
grant execute on function public.book_appointment(uuid, uuid, date, text, text, text, text, text, boolean) to authenticated;
