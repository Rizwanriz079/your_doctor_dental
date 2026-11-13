"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getPatient, safeNext } from "@/lib/patient";
import { createClient } from "@/lib/supabase/server";
import type { ActionResult } from "@/lib/types";
import { forgotSchema, profileSchema, registerSchema, resetSchema, signInSchema } from "./schema";

/**
 * Patient authentication. Everything goes through Supabase Auth: accounts, passwords,
 * Google sign-in, email confirmation and password reset are handled by Supabase, and
 * patient details are stored in the auth user's metadata (no patient table).
 */

async function siteOrigin() {
  const env = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "");
  if (env) return env;
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  const proto = h.get("x-forwarded-proto") ?? "http";
  return `${proto}://${host}`;
}

function fieldErrors(error: z.ZodError) {
  return z.flattenError(error).fieldErrors as Record<string, string[] | undefined>;
}

function refreshAccountViews() {
  revalidatePath("/", "layout");
}

export async function signInWithPassword(input: unknown, next?: string): Promise<ActionResult> {
  const parsed = signInSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: "Please check the highlighted fields.", fieldErrors: fieldErrors(parsed.error) };
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) {
    if (error.code === "email_not_confirmed") {
      return { ok: false, code: "email_not_confirmed", message: "Please confirm your email first — check your inbox for the link we sent." };
    }
    return { ok: false, message: "That email and password don't match. Please try again." };
  }
  await supabase.rpc("patient_link_bookings");
  refreshAccountViews();
  redirect(safeNext(next));
}

export async function registerWithEmail(input: unknown, next?: string): Promise<ActionResult> {
  const parsed = registerSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: "Please check the highlighted fields.", fieldErrors: fieldErrors(parsed.error) };
  const origin = await siteOrigin();
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: { full_name: parsed.data.fullName },
      emailRedirectTo: `${origin}/auth/callback?next=${encodeURIComponent(safeNext(next))}`,
    },
  });
  if (error) {
    if (error.code === "weak_password") return { ok: false, message: "Please choose a stronger password." };
    if (error.code === "over_email_send_rate_limit") return { ok: false, message: "Too many attempts. Please wait a minute and try again." };
    return { ok: false, message: "We couldn't create your account. Please try again." };
  }
  // Email confirmation on: no session until the link is clicked. (Supabase also returns this
  // shape for an already-registered email, so we never reveal whether an account exists.)
  if (!data.session) return { ok: true, message: "check_email" };
  await supabase.rpc("patient_link_bookings");
  refreshAccountViews();
  redirect(safeNext(next));
}

export async function signInWithGoogle(next?: string): Promise<ActionResult> {
  const origin = await siteOrigin();
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: `${origin}/auth/callback?next=${encodeURIComponent(safeNext(next))}` },
  });
  if (error || !data.url) return { ok: false, message: "Google sign-in isn't available right now. Please use email instead." };
  redirect(data.url);
}

export async function signOut(to?: string | FormData): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  refreshAccountViews();
  redirect(to === "/admin/setup" ? to : "/");
}

export async function requestPasswordReset(input: unknown): Promise<ActionResult> {
  const parsed = forgotSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: "Please enter a valid email address.", fieldErrors: fieldErrors(parsed.error) };
  const origin = await siteOrigin();
  const supabase = await createClient();
  await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${origin}/auth/callback?next=/reset-password`,
  });
  // Same response whether or not the email exists.
  return { ok: true, message: "If an account exists for that email, we've sent a link to reset your password." };
}

export async function updatePassword(input: unknown): Promise<ActionResult> {
  const parsed = resetSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: "Please check the highlighted fields.", fieldErrors: fieldErrors(parsed.error) };
  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) {
    if (error.code === "same_password") return { ok: false, message: "Please choose a password you haven't used before." };
    return { ok: false, message: "Your reset link may have expired. Please request a new one." };
  }
  return { ok: true, message: "Your password has been updated." };
}

/** Name and phone are kept in the Supabase Auth user's metadata and used to pre-fill bookings. */
export async function updateMyDetails(input: unknown): Promise<ActionResult> {
  if (!(await getPatient())) return { ok: false, message: "Please sign in again." };
  const parsed = profileSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: "Please check the highlighted fields.", fieldErrors: fieldErrors(parsed.error) };
  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ data: { full_name: parsed.data.fullName, phone: parsed.data.phone } });
  if (error) return { ok: false, message: "Your details could not be saved. Please try again." };
  refreshAccountViews();
  return { ok: true, message: "Your details have been saved." };
}

const cancelSchema = z.object({ id: z.guid(), reason: z.string().trim().max(500).optional() });

export async function cancelMyAppointment(input: unknown): Promise<ActionResult> {
  if (!(await getPatient())) return { ok: false, message: "Please sign in again." };
  const parsed = cancelSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: "Invalid request." };
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("patient_cancel_appointment", {
    p_id: parsed.data.id,
    p_reason: parsed.data.reason ?? undefined,
  });
  const res = data as { ok: boolean; message?: string } | null;
  if (error || !res?.ok) return { ok: false, message: res?.message ?? "The booking could not be cancelled. Please contact the clinic." };
  revalidatePath("/my-appointments");
  revalidatePath("/admin/appointments", "layout");
  revalidatePath("/admin/dashboard");
  return { ok: true, message: "Your appointment has been cancelled." };
}
