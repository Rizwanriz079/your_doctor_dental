import "server-only";
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import type { ClinicSettings, DoctorWithServices, Service, Testimonial } from "@/lib/types";

/**
 * Public read layer. Uses the visitor's (anon) session, so RLS guarantees that only
 * active doctors, active services and approved testimonials can ever be returned.
 */

export const getSettings = cache(async (): Promise<ClinicSettings> => {
  const supabase = await createClient();
  const { data, error } = await supabase.from("clinic_settings").select("*").eq("id", 1).single();
  if (error || !data) throw new Error("Clinic settings are missing. Run the database migrations and seed.");
  return data;
});

export const getActiveServices = cache(async (opts?: { featuredOnly?: boolean }): Promise<Service[]> => {
  const supabase = await createClient();
  let query = supabase
    .from("services")
    .select("*")
    .eq("is_active", true)
    .is("archived_at", null)
    .order("sort_order")
    .order("name");
  if (opts?.featuredOnly) query = query.eq("is_featured", true);
  const { data } = await query;
  return data ?? [];
});

export const getServiceBySlug = cache(async (slug: string) => {
  const supabase = await createClient();
  const { data } = await supabase
    .from("services")
    .select("*")
    .eq("slug", slug)
    .eq("is_active", true)
    .is("archived_at", null)
    .maybeSingle();
  return data;
});

const DOCTOR_SELECT =
  "*, doctor_services(services(id, name, slug, is_active, archived_at)), doctor_schedules(weekday, start_time, end_time)";

type DoctorRow = Awaited<ReturnType<typeof fetchDoctors>>[number];

async function fetchDoctors() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("doctors")
    .select(DOCTOR_SELECT)
    .eq("status", "active")
    .is("archived_at", null)
    .order("sort_order")
    .order("full_name");
  return data ?? [];
}

function shapeDoctor(row: DoctorRow): DoctorWithServices {
  const { doctor_services, doctor_schedules, ...doctor } = row;
  return {
    ...doctor,
    services: (doctor_services ?? [])
      .map((ds) => ds.services)
      .filter((s): s is NonNullable<typeof s> => Boolean(s && s.is_active && !s.archived_at))
      .map(({ id, name, slug }) => ({ id, name, slug })),
    schedules: (doctor_schedules ?? []).sort((a, b) => a.weekday - b.weekday || a.start_time.localeCompare(b.start_time)),
  };
}

/** Active doctors. `bookableOnly` also requires accepting_bookings. */
export const getActiveDoctors = cache(async (opts?: { bookableOnly?: boolean; homepageOnly?: boolean }) => {
  const rows = await fetchDoctors();
  return rows
    .filter((d) => (opts?.bookableOnly ? d.accepting_bookings : true))
    .filter((d) => (opts?.homepageOnly ? d.show_on_homepage : true))
    .map(shapeDoctor);
});

export const getDoctorBySlug = cache(async (slug: string) => {
  const supabase = await createClient();
  const { data } = await supabase
    .from("doctors")
    .select(DOCTOR_SELECT)
    .eq("slug", slug)
    .eq("status", "active")
    .is("archived_at", null)
    .maybeSingle();
  return data ? shapeDoctor(data) : null;
});

export const getDoctorsForService = cache(async (serviceId: string) => {
  const doctors = await getActiveDoctors();
  return doctors.filter((d) => d.services.some((s) => s.id === serviceId));
});

export const getApprovedTestimonials = cache(async (): Promise<Testimonial[]> => {
  const supabase = await createClient();
  const { data } = await supabase
    .from("testimonials")
    .select("*")
    .eq("is_approved", true)
    .order("sort_order")
    .order("created_at", { ascending: false });
  return data ?? [];
});

export const getUpcomingHolidays = cache(async () => {
  const supabase = await createClient();
  const today = new Date().toISOString().slice(0, 10);
  const { data } = await supabase
    .from("clinic_holidays")
    .select("holiday_date, name")
    .gte("holiday_date", today)
    .order("holiday_date")
    .limit(10);
  return data ?? [];
});
