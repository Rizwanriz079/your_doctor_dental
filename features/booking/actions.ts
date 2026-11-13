"use server";

import { headers } from "next/headers";
import { z } from "zod";
import { getPatient } from "@/lib/patient";
import { createClient } from "@/lib/supabase/server";
import type { BookingResult, CalendarDay, DayAvailability } from "@/lib/types";
import { bookingSchema, lookupSchema } from "@/lib/validation/booking";

const idsSchema = z.object({ doctorId: z.guid(), serviceId: z.guid() });

/** Per-day status for the calendar (one visible month, max 62 days). */
export async function getCalendar(input: {
  doctorId: string;
  serviceId: string;
  from: string;
  to: string;
}): Promise<{ ok: true; days: CalendarDay[] } | { ok: false; message: string }> {
  const parsed = idsSchema.extend({ from: z.iso.date(), to: z.iso.date() }).safeParse(input);
  if (!parsed.success) return { ok: false, message: "Invalid request." };
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_doctor_calendar", {
    p_doctor: parsed.data.doctorId,
    p_service: parsed.data.serviceId,
    p_from: parsed.data.from,
    p_to: parsed.data.to,
  });
  if (error) return { ok: false, message: "We couldn't load availability. Please try again." };
  return { ok: true, days: (data ?? []) as unknown as CalendarDay[] };
}

/** Slots and remaining capacity for one doctor/service/date. */
export async function getSlots(input: {
  doctorId: string;
  serviceId: string;
  date: string;
}): Promise<{ ok: true; availability: DayAvailability } | { ok: false; message: string }> {
  const parsed = idsSchema.extend({ date: z.iso.date() }).safeParse(input);
  if (!parsed.success) return { ok: false, message: "Invalid request." };
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_available_slots", {
    p_doctor: parsed.data.doctorId,
    p_service: parsed.data.serviceId,
    p_date: parsed.data.date,
  });
  if (error || !data) return { ok: false, message: "We couldn't load available times. Please try again." };
  return { ok: true, availability: data as unknown as DayAvailability };
}

// Best-effort per-IP throttle (per server instance). The database also limits bookings per phone number.
const attempts = new Map<string, number[]>();
function throttled(key: string, limit = 10, windowMs = 10 * 60 * 1000) {
  const now = Date.now();
  const recent = (attempts.get(key) ?? []).filter((t) => now - t < windowMs);
  recent.push(now);
  attempts.set(key, recent);
  if (attempts.size > 5000) attempts.clear();
  return recent.length > limit;
}

async function clientKey() {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "unknown";
}

export async function createBooking(input: unknown): Promise<BookingResult> {
  const parsed = bookingSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, code: "validation", message: parsed.error.issues[0]?.message ?? "Please check your details." };
  }
  if (throttled(`book:${await clientKey()}`)) {
    return { ok: false, code: "rate_limited", message: "Too many booking attempts. Please wait a few minutes and try again." };
  }
  if (!(await getPatient())) {
    return { ok: false, code: "not_signed_in", message: "Please sign in to book an appointment." };
  }
  const b = parsed.data;
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("book_appointment", {
    p_service_id: b.serviceId,
    p_doctor_id: b.doctorId,
    p_date: b.date,
    p_start_time: b.startTime,
    p_patient_name: b.fullName,
    p_patient_phone: b.phone,
    p_patient_email: b.email ?? "",
    p_message: b.message ?? "",
    p_consent: b.consent,
  });
  if (error || !data) {
    return { ok: false, code: "server_error", message: "Something went wrong while booking. Please try again." };
  }
  return data as unknown as BookingResult;
}

export type LookupResult =
  | {
      ok: true;
      appointment: {
        reference: string;
        status: string;
        date: string;
        start_time: string;
        end_time: string;
        doctor_name: string;
        service_name: string;
        patient_first_name: string;
        status_reason: string | null;
      };
    }
  | { ok: false; message: string; fieldErrors?: Record<string, string[] | undefined> };

export async function lookupBooking(input: { reference: string; phone: string }): Promise<LookupResult> {
  const parsed = lookupSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: "Please check the details below.", fieldErrors: z.flattenError(parsed.error).fieldErrors };
  }
  if (throttled(`lookup:${await clientKey()}`, 20)) {
    return { ok: false, message: "Too many attempts. Please wait a few minutes and try again." };
  }
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("lookup_appointment", {
    p_reference: parsed.data.reference,
    p_phone: parsed.data.phone,
  });
  if (error) return { ok: false, message: "We couldn't check your booking right now. Please try again." };
  if (!data) {
    return {
      ok: false,
      message: "We couldn't find a booking matching those details. Check the reference and phone number, or contact the clinic.",
    };
  }
  return { ok: true, appointment: data as LookupResult extends { ok: true; appointment: infer A } ? A : never };
}
