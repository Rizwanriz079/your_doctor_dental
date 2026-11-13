import "server-only";
import { createClient } from "@/lib/supabase/server";

export const APPOINTMENTS_PAGE_SIZE = 20;

export type AppointmentRange = "upcoming" | "today" | "tomorrow" | "week" | "custom" | "all";
export type AppointmentSort = "date" | "created";

export type AppointmentFilters = {
  range: AppointmentRange;
  from?: string;
  to?: string;
  doctor?: string;
  service?: string;
  status?: string;
  q?: string;
  sort: AppointmentSort;
  page: number;
};

const STATUSES = ["pending", "confirmed", "rejected", "cancelled", "completed", "expired"];
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function first(v: string | string[] | undefined) {
  return Array.isArray(v) ? v[0] : v;
}

/** Strip characters that have meaning inside PostgREST `or=(...)` filters and LIKE patterns. */
export function sanitizeSearch(q: string | undefined) {
  return (q ?? "").replace(/[,()*%_\\"':]/g, " ").replace(/\s+/g, " ").trim().slice(0, 80);
}

export function parseAppointmentFilters(sp: Record<string, string | string[] | undefined>): AppointmentFilters {
  const range = first(sp.range) as AppointmentRange | undefined;
  const status = first(sp.status);
  const doctor = first(sp.doctor);
  const service = first(sp.service);
  const from = first(sp.from);
  const to = first(sp.to);
  const page = Number.parseInt(first(sp.page) ?? "1", 10);
  return {
    range: range && ["upcoming", "today", "tomorrow", "week", "custom", "all"].includes(range) ? range : "upcoming",
    from: from && DATE_RE.test(from) ? from : undefined,
    to: to && DATE_RE.test(to) ? to : undefined,
    doctor: doctor && UUID_RE.test(doctor) ? doctor : undefined,
    service: service && UUID_RE.test(service) ? service : undefined,
    status: status && STATUSES.includes(status) ? status : undefined,
    q: sanitizeSearch(first(sp.q)) || undefined,
    sort: first(sp.sort) === "created" ? "created" : "date",
    page: Number.isFinite(page) && page > 0 ? page : 1,
  };
}

/** Today's date (YYYY-MM-DD) in the clinic's timezone. */
export function todayInTimezone(timezone: string) {
  try {
    return new Intl.DateTimeFormat("en-CA", { timeZone: timezone, year: "numeric", month: "2-digit", day: "2-digit" }).format(
      new Date(),
    );
  } catch {
    return new Date().toISOString().slice(0, 10);
  }
}

export function addDays(date: string, days: number) {
  const [y, m, d] = date.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + days));
  return dt.toISOString().slice(0, 10);
}

/** Resolve a quick range to a concrete [from, to] in clinic time. Week = Monday–Sunday. */
export function resolveRange(f: AppointmentFilters, today: string): { from?: string; to?: string } {
  switch (f.range) {
    case "today":
      return { from: today, to: today };
    case "tomorrow": {
      const t = addDays(today, 1);
      return { from: t, to: t };
    }
    case "week": {
      const [y, m, d] = today.split("-").map(Number);
      const dow = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
      const monday = addDays(today, dow === 0 ? -6 : 1 - dow);
      return { from: monday, to: addDays(monday, 6) };
    }
    case "custom":
      return { from: f.from, to: f.to };
    case "all":
      return {};
    default:
      return { from: today };
  }
}

export async function getClinicTimezone() {
  const supabase = await createClient();
  const { data } = await supabase.from("clinic_settings").select("timezone").eq("id", 1).maybeSingle();
  return data?.timezone ?? "UTC";
}

export async function listAppointments(f: AppointmentFilters, today: string) {
  const supabase = await createClient();
  const { from, to } = resolveRange(f, today);
  let query = supabase
    .from("appointments")
    .select(
      "id, booking_reference, patient_name, patient_phone, appointment_date, start_time, end_time, status, created_at, doctor_id, service_id, doctors(full_name), services(name)",
      { count: "exact" },
    );
  if (from) query = query.gte("appointment_date", from);
  if (to) query = query.lte("appointment_date", to);
  if (f.doctor) query = query.eq("doctor_id", f.doctor);
  if (f.service) query = query.eq("service_id", f.service);
  if (f.status) query = query.eq("status", f.status);
  if (f.q) {
    const term = `%${f.q}%`;
    query = query.or(`patient_name.ilike.${term},patient_phone.ilike.${term},booking_reference.ilike.${term}`);
  }
  if (f.sort === "created") {
    query = query.order("created_at", { ascending: false });
  } else {
    const asc = f.range !== "all";
    query = query.order("appointment_date", { ascending: asc }).order("start_time", { ascending: asc });
  }
  const offset = (f.page - 1) * APPOINTMENTS_PAGE_SIZE;
  query = query.range(offset, offset + APPOINTMENTS_PAGE_SIZE - 1);
  const { data, count, error } = await query;
  return { rows: data ?? [], total: count ?? 0, error: error ? "Appointments could not be loaded." : null };
}

export type AppointmentListRow = Awaited<ReturnType<typeof listAppointments>>["rows"][number];

export async function getFilterOptions() {
  const supabase = await createClient();
  const [doctors, services] = await Promise.all([
    supabase.from("doctors").select("id, full_name, status").order("full_name"),
    supabase.from("services").select("id, name").order("name"),
  ]);
  return {
    doctors: (doctors.data ?? []).map((d) => ({ id: d.id, name: d.full_name, archived: d.status === "archived" })),
    services: (services.data ?? []).map((s) => ({ id: s.id, name: s.name })),
  };
}

export async function getAppointmentDetail(id: string) {
  if (!UUID_RE.test(id)) return null;
  const supabase = await createClient();
  const { data: appt } = await supabase
    .from("appointments")
    .select("*, doctors(id, full_name, slug, specialization), services(id, name, duration_minutes)")
    .eq("id", id)
    .maybeSingle();
  if (!appt) return null;

  const { data: events } = await supabase
    .from("appointment_events")
    .select("*")
    .eq("appointment_id", id)
    .order("created_at", { ascending: true });

  const actorIds = Array.from(new Set((events ?? []).map((e) => e.actor_id).filter((v): v is string => Boolean(v))));
  const actors = new Map<string, string>();
  if (actorIds.length) {
    const { data: profiles } = await supabase.from("profiles").select("id, full_name, email").in("id", actorIds);
    (profiles ?? []).forEach((p) => actors.set(p.id, p.full_name || p.email || "Admin"));
  }

  return {
    appointment: appt,
    events: (events ?? []).map((e) => ({ ...e, actor_name: e.actor_id ? (actors.get(e.actor_id) ?? "Admin") : null })),
  };
}

export type AppointmentDetail = NonNullable<Awaited<ReturnType<typeof getAppointmentDetail>>>;
