# Lumora Dental: Clinic Website & Appointment Management

A responsive dental clinic website plus a secure Super Admin dashboard, sharing one Supabase (PostgreSQL) backend.

- **Patient website**: home, about, services, doctors, online booking, booking-status lookup, contact.
- **Super Admin**: dashboard and analytics, doctor CRUD, schedules and capacity, appointments, patients, services, live notifications, website content, settings, and an audit log.

Stack: Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS 4 · Motion · Supabase (Postgres, Auth, Realtime, Storage) · React Hook Form + Zod · Recharts · React Day Picker · Lucide · Sonner.

---

## Quick start (local)

Requirements: Node 20+, Docker, and the Supabase CLI.

```bash
npm install
supabase start          # local Postgres/Auth/Realtime/Storage on ports 554xx
supabase db reset       # applies migrations + seed (demo data and a local admin)
npm run dev             # http://localhost:3100
```

`.env.local` already points to the local stack (see `.env.example`).

| | |
|---|---|
| Public site | http://localhost:3100 |
| Admin | http://localhost:3100/admin, login `admin@clinic.local` / `ChangeMe!2026` (**local seed only**) |
| Supabase API | http://127.0.0.1:55421 |

The ports are `554xx` rather than Supabase's default `543xx` so they don't clash with other local Supabase projects.

### Tests

```bash
npm run test:db      # 49 booking-integrity checks against the local DB (capacity, races, RLS, ...)
npm run typecheck
npm run lint
```

---

## Architecture

```
app/
  (public)/            patient website (home, about, services, doctors, book-appointment, my-appointments, contact, privacy, terms)
  admin/login          admin sign-in
  admin/(panel)/       protected admin area (dashboard, appointments, doctors, availability, patients,
                       services, notifications, content, settings)
components/            ui/ (design-system primitives), animations/, public/, booking/, admin/
features/<domain>/     queries.ts (server reads) + actions.ts (server actions, zod-validated)
lib/                   supabase clients, auth guard, types, validation schemas, motion tokens, utils
supabase/migrations/   schema, RLS, availability engine, booking + admin functions
supabase/seed.sql      LOCAL demo data only
tests/db/              SQL-level integrity tests
```

### Security model

- The app **never uses the service-role key**. Every query runs as the visitor (anon) or the signed-in admin, so Row Level Security is always enforced.
- Admin access is checked three times:
  1. `proxy.ts` redirects signed-out users away from `/admin` (convenience only).
  2. `app/admin/(panel)/layout.tsx` and each page and server action call `requireAdmin()` / `assertAdmin()`. These check `profiles.role = 'super_admin'` on the server.
  3. Every table policy and every admin SQL function checks `is_admin()` in the database.
- Public users cannot read appointments, patients, notifications, overrides or private doctor contact details. Booking happens only through the `book_appointment` function.
- Roles cannot be changed from the client (a trigger guards `profiles.role`).
- API roles never get `TRUNCATE`, and table privileges are granted explicitly (`20261113000100_api_grants.sql`).
- Storage bucket `media` is public-read. Only admins can write to it, and it accepts images up to 5 MB.
- Every change to doctors, services, schedules, capacity, settings, holidays, testimonials and patients is written to `audit_logs`. The log records **field names only**, never patient values. Appointment status history is kept in `appointment_events`.
- Booking abuse limits: at most 3 bookings per phone number per hour, plus validation on both client and server.

### Booking engine (spec §7–8)

Everything that decides availability lives in Postgres, so the database is authoritative:

- **Effective schedule** for a date: a clinic holiday means closed. Otherwise a date override (closed, or custom hours) applies, and if there is none, the weekly sessions apply. A day can have several sessions (morning/afternoon), and the gap between them is the break.
- **Effective capacity**: a date-specific override if one exists, otherwise the doctor's default. Unscheduled or blocked dates have capacity 0.
- **Capacity vs. slots**: daily capacity and slot availability are enforced separately. Slots follow the doctor's duration plus buffer, and the service duration sets the appointment length.
- **Which statuses consume capacity**: `pending` (while its hold is valid), `confirmed` and `completed` do. `rejected`, `cancelled` and `expired` do not. This rule is defined once, in `_consumes_capacity()`.
- **Concurrency**: `book_appointment` takes a transaction-level advisory lock per doctor and date, releases expired holds, then re-checks schedule, capacity and slot before inserting. A GiST **exclusion constraint** additionally makes overlapping active bookings for a doctor impossible. Patient record, appointment, status event and admin notifications are written in the same transaction, so a failed booking never produces a notification.
- **Rescheduling** locks both dates in a fixed order, so it cannot deadlock. It validates the new slot (excluding the appointment itself) and updates in one statement. If that fails, the original booking is untouched.
- **Pending expiry** is optional (`pending_expiry_hours` in Settings; blank means holds never expire). Expired holds stop counting immediately. A `pg_cron` job marks them `expired` every 10 minutes, and booking also cleans them up.
- **Admin changes that affect bookings** are refused until the admin explicitly acknowledges them: capacity set below existing bookings, a closed day or shorter hours with bookings, or schedule and default-capacity changes. Existing bookings are never changed silently.
- **Default capacity rule**: the doctor's default applies to every date that has no date-specific override, including future dates. Overrides are never rewritten.

### Patient accounts

v1 uses **guest booking** (spec §12.1, option 1). Patients receive a booking reference and can check their status at `/my-appointments` using the reference plus their phone number. Patient records are de-duplicated by phone number. The `patients.user_id` column is reserved for linking accounts if patient login is added later.

---

## Going to production

1. Create a Supabase project, then `supabase link` and `supabase db push`. Do **not** run `seed.sql` in production.
2. Create the first admin: invite the user in Supabase Auth, then run in SQL:
   `update public.profiles set role = 'super_admin' where email = 'owner@yourclinic.com';`
3. Set `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` and `NEXT_PUBLIC_SITE_URL` in your host.
4. Check that `pg_cron` is enabled (Database → Extensions) so expired holds are marked automatically.
5. Fill in the real clinic content, doctors, services, opening hours and privacy text in the admin panel. Publish only genuine statistics and consented testimonials.
6. Keep public sign-ups disabled in Supabase Auth (admins are invited).

Email or WhatsApp notifications are not part of v1. Add them later as a server-side integration (for example a Supabase Edge Function on `notifications` inserts), and keep provider secrets server-side.
