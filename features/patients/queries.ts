import "server-only";
import { sanitizeSearch } from "@/features/appointments/queries";
import { createClient } from "@/lib/supabase/server";

export const PATIENTS_PAGE_SIZE = 20;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function listPatients({ q, page, sort }: { q?: string; page: number; sort: "recent" | "name" | "registered" }) {
  const supabase = await createClient();
  let query = supabase
    .from("patients")
    .select("id, full_name, phone, email, created_at, last_booking_at, appointments(count)", { count: "exact" });
  const term = sanitizeSearch(q);
  if (term) {
    const like = `%${term}%`;
    query = query.or(`full_name.ilike.${like},phone.ilike.${like},email.ilike.${like}`);
  }
  if (sort === "name") query = query.order("full_name");
  else if (sort === "registered") query = query.order("created_at", { ascending: false });
  else query = query.order("last_booking_at", { ascending: false, nullsFirst: false });
  const offset = (page - 1) * PATIENTS_PAGE_SIZE;
  const { data, count, error } = await query.range(offset, offset + PATIENTS_PAGE_SIZE - 1);
  return {
    rows: (data ?? []).map((p) => ({
      ...p,
      appointment_count: (p.appointments as unknown as { count: number }[] | null)?.[0]?.count ?? 0,
    })),
    total: count ?? 0,
    error: error ? "Patients could not be loaded." : null,
  };
}

export async function getPatientDetail(id: string) {
  if (!UUID_RE.test(id)) return null;
  const supabase = await createClient();
  const { data: patient } = await supabase.from("patients").select("*").eq("id", id).maybeSingle();
  if (!patient) return null;
  const { data: appointments } = await supabase
    .from("appointments")
    .select("id, booking_reference, appointment_date, start_time, status, created_at, doctors(full_name), services(name)")
    .eq("patient_id", id)
    .order("appointment_date", { ascending: false })
    .order("start_time", { ascending: false });
  return { patient, appointments: appointments ?? [] };
}
