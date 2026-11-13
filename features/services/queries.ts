import "server-only";
import { createClient } from "@/lib/supabase/server";

export async function listServices(params: { q?: string; status?: string }) {
  const supabase = await createClient();
  let query = supabase
    .from("services")
    .select("id, name, slug, category, image_path, duration_minutes, price, show_price, is_active, is_featured, archived_at, sort_order, doctor_services(doctor_id)")
    .order("sort_order")
    .order("name");
  if (params.q) query = query.ilike("name", `%${params.q.replace(/[%_,]/g, "")}%`);
  switch (params.status) {
    case "active":
      query = query.eq("is_active", true).is("archived_at", null);
      break;
    case "inactive":
      query = query.eq("is_active", false).is("archived_at", null);
      break;
    case "featured":
      query = query.eq("is_featured", true).is("archived_at", null);
      break;
    case "archived":
      query = query.not("archived_at", "is", null);
      break;
    default:
      query = query.is("archived_at", null);
  }
  const { data, error } = await query;
  return {
    rows: (data ?? []).map(({ doctor_services, ...s }) => ({ ...s, doctor_count: doctor_services?.length ?? 0 })),
    error: error?.message ?? null,
  };
}

export async function getServiceFormData(id?: string) {
  const supabase = await createClient();
  const [serviceRes, doctorsRes, categoriesRes, settingsRes] = await Promise.all([
    id
      ? supabase.from("services").select("*, doctor_services(doctor_id)").eq("id", id).maybeSingle()
      : Promise.resolve({ data: null }),
    supabase.from("doctors").select("id, full_name, profile_image_path, status").neq("status", "archived").order("full_name"),
    supabase.from("services").select("category"),
    supabase.from("clinic_settings").select("currency").eq("id", 1).single(),
  ]);
  return {
    service: serviceRes.data,
    doctors: doctorsRes.data ?? [],
    categories: Array.from(new Set((categoriesRes.data ?? []).map((c) => c.category))).sort(),
    currency: settingsRes.data?.currency ?? "AED",
  };
}
