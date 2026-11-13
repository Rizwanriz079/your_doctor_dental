"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { assertAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { ActionResult } from "@/lib/types";

type Affected = { id: string; reference: string; start_time: string; patient_name: string };
type RpcResult = { ok: boolean; code?: string; message?: string; booked?: number; affected?: Affected[] };

export type AvailabilityResult =
  | { ok: true; message?: string }
  | { ok: false; message: string; code?: string; booked?: number; affected?: Affected[] };

const date = z.iso.date("Choose a valid date.");
const time = z.string().regex(/^\d{2}:\d{2}$/, "Use HH:MM");

function revalidateAll() {
  revalidatePath("/dentaladmincalicut/availability");
  revalidatePath("/dentaladmincalicut/doctors/[id]", "page");
  revalidatePath("/dentaladmincalicut/dashboard");
  revalidatePath("/doctors/[slug]", "page");
  revalidatePath("/book-appointment");
}

async function guard() {
  try {
    await assertAdmin();
    return null;
  } catch {
    return { ok: false as const, message: "Your session has expired. Please sign in again." };
  }
}

const capacitySchema = z.object({
  doctorId: z.guid(),
  date,
  max: z.number().int().min(0).max(1000).nullable(),
  reason: z.string().trim().max(200).default(""),
  force: z.boolean().default(false),
});

/** Set (or remove with max=null) a date-specific capacity override. */
export async function setCapacityOverride(input: z.input<typeof capacitySchema>): Promise<AvailabilityResult> {
  const denied = await guard();
  if (denied) return denied;
  const parsed = capacitySchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message ?? "Invalid input." };
  const v = parsed.data;
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("admin_set_capacity_override", {
    p_doctor: v.doctorId,
    p_date: v.date,
    p_max: v.max as number,
    p_reason: v.reason,
    p_force: v.force,
  });
  if (error) return { ok: false, message: "The limit could not be saved. Please try again." };
  const res = data as RpcResult;
  if (!res.ok) return { ok: false, code: res.code, message: res.message ?? "The limit could not be saved.", booked: res.booked };
  revalidateAll();
  return { ok: true, message: v.max === null ? "Override removed. The default limit applies." : "Daily limit saved" };
}

const hoursSchema = z
  .object({
    doctorId: z.guid(),
    date,
    closed: z.boolean(),
    start: z.string().default(""),
    end: z.string().default(""),
    reason: z.string().trim().max(200).default(""),
    force: z.boolean().default(false),
  })
  .refine((v) => v.closed || (time.safeParse(v.start).success && time.safeParse(v.end).success && v.end > v.start), {
    message: "Enter a start and end time, with the end after the start.",
  });

export async function setScheduleOverride(input: z.input<typeof hoursSchema>): Promise<AvailabilityResult> {
  const denied = await guard();
  if (denied) return denied;
  const parsed = hoursSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message ?? "Invalid input." };
  const v = parsed.data;
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("admin_set_schedule_override", {
    p_doctor: v.doctorId,
    p_date: v.date,
    p_closed: v.closed,
    p_start: v.closed ? "" : v.start,
    p_end: v.closed ? "" : v.end,
    p_reason: v.reason,
    p_force: v.force,
  });
  if (error) return { ok: false, message: "The hours could not be saved. Please try again." };
  const res = data as RpcResult;
  if (!res.ok) return { ok: false, code: res.code, message: res.message ?? "The hours could not be saved.", affected: res.affected };
  revalidateAll();
  return { ok: true, message: v.closed ? "Day marked as closed" : "Special hours saved" };
}

const removeSchema = z.object({ doctorId: z.guid(), date, force: z.boolean().default(false) });

/**
 * Remove a day's hours override so the weekly schedule applies again. Warns first when active
 * bookings on that day would fall outside the weekly hours (they are never changed automatically).
 */
export async function removeScheduleOverride(input: z.input<typeof removeSchema>): Promise<AvailabilityResult> {
  const denied = await guard();
  if (denied) return denied;
  const parsed = removeSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: "Invalid input." };
  const v = parsed.data;
  const supabase = await createClient();

  if (!v.force) {
    const weekday = new Date(`${v.date}T00:00:00Z`).getUTCDay();
    const [{ data: sessions }, { data: appts }] = await Promise.all([
      supabase.from("doctor_schedules").select("start_time, end_time").eq("doctor_id", v.doctorId).eq("weekday", weekday),
      supabase
        .from("appointments")
        .select("id, booking_reference, start_time, end_time, patient_name")
        .eq("doctor_id", v.doctorId)
        .eq("appointment_date", v.date)
        .in("status", ["pending", "confirmed"]),
    ]);
    const outside = (appts ?? []).filter(
      (a) => !(sessions ?? []).some((s) => s.start_time <= a.start_time && s.end_time >= a.end_time),
    );
    if (outside.length > 0) {
      return {
        ok: false,
        code: "impact",
        message: "Some bookings on this day fall outside the regular weekly hours. They will not be changed automatically.",
        affected: outside.map((a) => ({
          id: a.id,
          reference: a.booking_reference,
          start_time: a.start_time.slice(0, 5),
          patient_name: a.patient_name,
        })),
      };
    }
  }

  const { error } = await supabase
    .from("doctor_schedule_overrides")
    .delete()
    .eq("doctor_id", v.doctorId)
    .eq("schedule_date", v.date);
  if (error) return { ok: false, message: "The override could not be removed. Please try again." };
  revalidateAll();
  return { ok: true, message: "Regular weekly hours restored" };
}

const holidaySchema = z.object({
  date,
  name: z.string().trim().min(2, "Enter a name for the closure.").max(120),
  force: z.boolean().default(false),
});

export async function addHoliday(input: z.input<typeof holidaySchema>): Promise<AvailabilityResult> {
  const denied = await guard();
  if (denied) return denied;
  const parsed = holidaySchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message ?? "Invalid input." };
  const v = parsed.data;
  const supabase = await createClient();

  if (!v.force) {
    const { data: appts } = await supabase
      .from("appointments")
      .select("id, booking_reference, start_time, patient_name")
      .eq("appointment_date", v.date)
      .in("status", ["pending", "confirmed"])
      .order("start_time");
    if (appts && appts.length > 0) {
      return {
        ok: false,
        code: "impact",
        message: `${appts.length} booking(s) already exist on this date. Closing the clinic will not cancel them automatically.`,
        affected: appts.map((a) => ({
          id: a.id,
          reference: a.booking_reference,
          start_time: a.start_time.slice(0, 5),
          patient_name: a.patient_name,
        })),
      };
    }
  }

  const { error } = await supabase.from("clinic_holidays").insert({ holiday_date: v.date, name: v.name });
  if (error) {
    if (error.code === "23505") return { ok: false, message: "A closure already exists on that date." };
    return { ok: false, message: "The closure could not be saved. Please try again." };
  }
  revalidateAll();
  revalidatePath("/");
  return { ok: true, message: "Clinic closure added" };
}

export async function deleteHoliday(id: string): Promise<ActionResult> {
  const denied = await guard();
  if (denied) return denied;
  if (!z.guid().safeParse(id).success) return { ok: false, message: "Invalid request." };
  const supabase = await createClient();
  const { error } = await supabase.from("clinic_holidays").delete().eq("id", id);
  if (error) return { ok: false, message: "The closure could not be removed. Please try again." };
  revalidateAll();
  revalidatePath("/");
  return { ok: true, message: "Clinic closure removed" };
}
