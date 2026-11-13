"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { assertAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { ActionResult } from "@/lib/types";
import { doctorFormSchema, weekToSchedules, type DoctorFormValues, type DoctorImpact } from "./schema";

type RpcResult = { ok: boolean; code?: string; message?: string; id?: string; impact?: DoctorImpact; upcoming?: number };

function revalidateDoctorPaths(id?: string) {
  revalidatePath("/admin/doctors");
  if (id) revalidatePath(`/admin/doctors/${id}`);
  revalidatePath("/admin/availability");
  revalidatePath("/");
  revalidatePath("/doctors");
  revalidatePath("/doctors/[slug]", "page");
  revalidatePath("/services/[slug]", "page");
  revalidatePath("/book-appointment");
}

async function guard(): Promise<{ ok: false; message: string } | null> {
  try {
    await assertAdmin();
    return null;
  } catch {
    return { ok: false, message: "Your session has expired. Please sign in again." };
  }
}

export async function saveDoctor(
  input: DoctorFormValues,
  acknowledgeImpact = false,
): Promise<ActionResult<{ id: string }> | { ok: false; code: "impact"; message: string; details: DoctorImpact }> {
  const denied = await guard();
  if (denied) return denied;

  const parsed = doctorFormSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: "Please fix the highlighted fields.", fieldErrors: z.flattenError(parsed.error).fieldErrors };
  }
  const v = parsed.data;
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("admin_save_doctor", {
    p: {
      id: v.id ?? null,
      full_name: v.full_name,
      qualification: v.qualification,
      specialization: v.specialization,
      experience_years: v.experience_years,
      biography: v.biography,
      profile_image_path: v.profile_image_path,
      default_appointment_duration_minutes: v.default_appointment_duration_minutes,
      buffer_minutes: v.buffer_minutes,
      default_daily_capacity: v.default_daily_capacity,
      status: v.status,
      accepting_bookings: v.accepting_bookings,
      show_on_homepage: v.show_on_homepage,
      phone: v.phone,
      email: v.email,
      service_ids: v.service_ids,
      schedules: weekToSchedules(v.week),
      acknowledge_impact: acknowledgeImpact,
    },
  });
  if (error) return { ok: false, message: "The doctor could not be saved. Please try again." };
  const res = data as RpcResult;
  if (!res.ok) {
    if (res.code === "impact" && res.impact) {
      return { ok: false, code: "impact", message: res.message ?? "This change affects existing bookings.", details: res.impact };
    }
    return { ok: false, code: res.code, message: res.message ?? "The doctor could not be saved." };
  }
  revalidateDoctorPaths(res.id);
  return { ok: true, data: { id: res.id! }, message: v.id ? "Doctor updated" : "Doctor created" };
}

const statusSchema = z.object({
  id: z.guid(),
  status: z.enum(["active", "inactive", "archived"]),
  accepting: z.boolean(),
});

export async function setDoctorStatus(input: z.input<typeof statusSchema>): Promise<ActionResult<{ upcoming: number }>> {
  const denied = await guard();
  if (denied) return denied;
  const parsed = statusSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: "Invalid request." };
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("admin_set_doctor_status", {
    p_id: parsed.data.id,
    p_status: parsed.data.status,
    p_accepting: parsed.data.accepting,
  });
  if (error) return { ok: false, message: "The status could not be changed. Please try again." };
  const res = data as RpcResult;
  if (!res.ok) return { ok: false, message: res.message ?? "The status could not be changed." };
  revalidateDoctorPaths(parsed.data.id);
  return { ok: true, data: { upcoming: res.upcoming ?? 0 } };
}

export async function deleteDoctor(id: string): Promise<ActionResult> {
  const denied = await guard();
  if (denied) return denied;
  if (!z.guid().safeParse(id).success) return { ok: false, message: "Invalid request." };
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("admin_delete_doctor", { p_id: id });
  if (error) return { ok: false, message: "The doctor could not be deleted. Please try again." };
  const res = data as RpcResult;
  if (!res.ok) return { ok: false, code: res.code, message: res.message ?? "The doctor could not be deleted." };
  revalidateDoctorPaths();
  return { ok: true, message: "Doctor deleted" };
}
