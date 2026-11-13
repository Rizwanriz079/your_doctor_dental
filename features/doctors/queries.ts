import "server-only";
import { createClient } from "@/lib/supabase/server";
import { clinicToday } from "@/features/availability/date";

export const DOCTOR_PAGE_SIZE = 12;

export type DoctorListParams = {
  q?: string;
  specialization?: string;
  status?: string;
  sort?: string;
  page?: number;
};

export async function listDoctors(params: DoctorListParams) {
  const supabase = await createClient();
  const page = Math.max(1, params.page ?? 1);
  let query = supabase
    .from("doctors")
    .select(
      "id, full_name, slug, profile_image_path, specialization, default_daily_capacity, status, accepting_bookings, created_at, doctor_services(services(id, name)), doctor_schedules(weekday)",
      { count: "exact" },
    );

  if (params.q) query = query.ilike("full_name", `%${params.q.replace(/[%_,]/g, "")}%`);
  if (params.specialization) query = query.eq("specialization", params.specialization);
  switch (params.status) {
    case "active":
      query = query.eq("status", "active");
      break;
    case "inactive":
      query = query.eq("status", "inactive");
      break;
    case "archived":
      query = query.eq("status", "archived");
      break;
    case "not_accepting":
      query = query.neq("status", "archived").eq("accepting_bookings", false);
      break;
    default:
      query = query.neq("status", "archived");
  }
  switch (params.sort) {
    case "name_desc":
      query = query.order("full_name", { ascending: false });
      break;
    case "newest":
      query = query.order("created_at", { ascending: false });
      break;
    case "oldest":
      query = query.order("created_at", { ascending: true });
      break;
    default:
      query = query.order("full_name", { ascending: true });
  }
  const from = (page - 1) * DOCTOR_PAGE_SIZE;
  const { data, count, error } = await query.range(from, from + DOCTOR_PAGE_SIZE - 1);

  const rows = (data ?? []).map((d) => ({
    ...d,
    services: (d.doctor_services ?? []).map((s) => s.services).filter((s): s is { id: string; name: string } => Boolean(s)),
    weekdays: Array.from(new Set((d.doctor_schedules ?? []).map((s) => s.weekday))).sort((a, b) => a - b),
  }));
  return { rows, total: count ?? 0, page, error: error?.message ?? null };
}

export async function getSpecializations() {
  const supabase = await createClient();
  const { data } = await supabase.from("doctors").select("specialization");
  return Array.from(new Set((data ?? []).map((d) => d.specialization))).sort();
}

export async function getAssignableServices() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("services")
    .select("id, name, category, is_active")
    .is("archived_at", null)
    .order("sort_order")
    .order("name");
  return data ?? [];
}

export async function getCapacityLimit() {
  const supabase = await createClient();
  const { data } = await supabase.from("clinic_settings").select("max_daily_capacity_limit, timezone").eq("id", 1).single();
  return { limit: data?.max_daily_capacity_limit ?? 100, timezone: data?.timezone ?? "UTC" };
}

export async function getDoctorForEdit(id: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("doctors")
    .select("*, doctor_private(phone, email), doctor_services(service_id), doctor_schedules(weekday, start_time, end_time)")
    .eq("id", id)
    .maybeSingle();
  return data;
}

export async function getDoctorDetail(id: string) {
  const supabase = await createClient();
  const { timezone } = await getCapacityLimit();
  const today = clinicToday(timezone);

  const [doctorRes, overridesRes, capacityRes, upcomingRes, historyRes] = await Promise.all([
    supabase
      .from("doctors")
      .select(
        "*, doctor_private(phone, email), doctor_services(services(id, name, slug, is_active)), doctor_schedules(weekday, start_time, end_time)",
      )
      .eq("id", id)
      .maybeSingle(),
    supabase
      .from("doctor_schedule_overrides")
      .select("*")
      .eq("doctor_id", id)
      .gte("schedule_date", today)
      .order("schedule_date")
      .limit(30),
    supabase
      .from("doctor_capacity")
      .select("*")
      .eq("doctor_id", id)
      .gte("capacity_date", today)
      .order("capacity_date")
      .limit(30),
    supabase
      .from("appointments")
      .select("id, booking_reference, patient_name, appointment_date, start_time, status, services(name)")
      .eq("doctor_id", id)
      .gte("appointment_date", today)
      .in("status", ["pending", "confirmed"])
      .order("appointment_date")
      .order("start_time")
      .limit(25),
    supabase
      .from("appointments")
      .select("id, booking_reference, patient_name, appointment_date, start_time, status, services(name)")
      .eq("doctor_id", id)
      .or(`appointment_date.lt.${today},status.in.(completed,cancelled,rejected,expired)`)
      .order("appointment_date", { ascending: false })
      .order("start_time", { ascending: false })
      .limit(25),
  ]);

  return {
    today,
    doctor: doctorRes.data,
    overrides: overridesRes.data ?? [],
    capacity: capacityRes.data ?? [],
    upcoming: upcomingRes.data ?? [],
    history: historyRes.data ?? [],
  };
}
