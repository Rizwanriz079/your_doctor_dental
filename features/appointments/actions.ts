"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { assertAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { ActionResult, DayAvailability } from "@/lib/types";

type RpcResult = { ok: boolean; code?: string; message?: string };

const idSchema = z.guid();

function revalidateAppointment(id?: string) {
  revalidatePath("/admin/appointments");
  if (id) revalidatePath(`/admin/appointments/${id}`);
  revalidatePath("/admin/dashboard");
  revalidatePath("/admin/patients", "layout");
  // Public availability depends on bookings.
  revalidatePath("/book-appointment");
}

async function guard(): Promise<{ ok: false; message: string; code: string } | null> {
  try {
    await assertAdmin();
    return null;
  } catch {
    return { ok: false, message: "Your session has expired. Please sign in again.", code: "unauthorised" };
  }
}

const statusSchema = z.object({
  id: idSchema,
  status: z.enum(["confirmed", "rejected", "cancelled", "completed"]),
  reason: z.string().trim().max(500, "Reason is too long.").optional().default(""),
});

export async function setAppointmentStatus(input: z.input<typeof statusSchema>): Promise<ActionResult> {
  const denied = await guard();
  if (denied) return denied;
  const parsed = statusSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message ?? "Invalid request." };
  const { id, status, reason } = parsed.data;
  if ((status === "rejected" || status === "cancelled") && !reason) {
    return { ok: false, message: "Please give a reason.", code: "reason_required" };
  }
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("admin_set_appointment_status", {
    p_id: id,
    p_status: status,
    p_reason: reason || undefined,
  });
  if (error) return { ok: false, message: "The status could not be updated. Please try again." };
  const res = data as unknown as RpcResult;
  if (!res.ok) return { ok: false, message: res.message ?? "The status could not be updated.", code: res.code };
  revalidateAppointment(id);
  const labels = { confirmed: "confirmed", rejected: "rejected", cancelled: "cancelled", completed: "marked completed" };
  return { ok: true, message: `Appointment ${labels[status]}.` };
}

const slotsSchema = z.object({
  doctorId: idSchema,
  serviceId: idSchema,
  date: z.iso.date(),
  excludeId: idSchema,
});

export async function getRescheduleSlots(input: z.input<typeof slotsSchema>): Promise<ActionResult<DayAvailability>> {
  const denied = await guard();
  if (denied) return denied;
  const parsed = slotsSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: "Invalid date." };
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("admin_get_slots", {
    p_doctor: parsed.data.doctorId,
    p_service: parsed.data.serviceId,
    p_date: parsed.data.date,
    p_exclude: parsed.data.excludeId,
  });
  if (error || !data) return { ok: false, message: "Availability could not be loaded." };
  return { ok: true, data: data as unknown as DayAvailability };
}

const rescheduleSchema = z.object({
  id: idSchema,
  date: z.iso.date("Choose a date."),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, "Choose a time."),
  reason: z.string().trim().max(500).optional().default(""),
});

export async function rescheduleAppointment(input: z.input<typeof rescheduleSchema>): Promise<ActionResult> {
  const denied = await guard();
  if (denied) return denied;
  const parsed = rescheduleSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message ?? "Invalid request." };
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("admin_reschedule_appointment", {
    p_id: parsed.data.id,
    p_new_date: parsed.data.date,
    p_new_start: parsed.data.startTime,
    p_reason: parsed.data.reason || undefined,
  });
  if (error) return { ok: false, message: "The appointment could not be rescheduled. Please try again." };
  const res = data as unknown as RpcResult;
  if (!res.ok) return { ok: false, message: res.message ?? "That time is not available.", code: res.code };
  revalidateAppointment(parsed.data.id);
  return { ok: true, message: "Appointment rescheduled." };
}

const noteSchema = z.object({
  id: idSchema,
  note: z.string().trim().min(1, "Write a note first.").max(2000, "Notes are limited to 2000 characters."),
});

export async function addAppointmentNote(input: z.input<typeof noteSchema>): Promise<ActionResult> {
  const denied = await guard();
  if (denied) return denied;
  const parsed = noteSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Invalid note.", fieldErrors: z.flattenError(parsed.error).fieldErrors };
  }
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("admin_add_appointment_note", { p_id: parsed.data.id, p_note: parsed.data.note });
  if (error) return { ok: false, message: "The note could not be saved." };
  const res = data as unknown as RpcResult;
  if (!res.ok) return { ok: false, message: res.message ?? "The note could not be saved." };
  revalidatePath(`/admin/appointments/${parsed.data.id}`);
  return { ok: true, message: "Note added." };
}
