"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { assertAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { ActionResult } from "@/lib/types";
import { bookingSettingsSchema, type BookingSettingsValues } from "./schema";

export async function saveBookingSettings(input: BookingSettingsValues): Promise<ActionResult> {
  try {
    await assertAdmin();
  } catch {
    return { ok: false, message: "Your session has expired. Please sign in again." };
  }
  const parsed = bookingSettingsSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: "Please fix the highlighted fields.", fieldErrors: z.flattenError(parsed.error).fieldErrors };
  }
  const supabase = await createClient();

  // The system limit cannot be lower than a doctor's current default daily limit.
  const { data: over } = await supabase
    .from("doctors")
    .select("full_name, default_daily_capacity")
    .neq("status", "archived")
    .gt("default_daily_capacity", parsed.data.max_daily_capacity_limit)
    .order("default_daily_capacity", { ascending: false })
    .limit(5);
  if (over && over.length > 0) {
    const names = over.map((d) => `${d.full_name} (${d.default_daily_capacity})`).join(", ");
    return {
      ok: false,
      message: "Some doctors have a higher default daily limit.",
      fieldErrors: { max_daily_capacity_limit: [`Lower these doctors' limits first: ${names}.`] },
    };
  }

  const { error } = await supabase.from("clinic_settings").update(parsed.data).eq("id", 1);
  if (error) return { ok: false, message: "Settings could not be saved. Please try again." };
  revalidatePath("/admin/settings");
  revalidatePath("/", "layout");
  return { ok: true, message: "Booking settings saved" };
}

const adminProfileSchema = z.object({
  fullName: z.string().trim().min(2, "Please enter your name.").max(100, "Name is too long."),
  avatarPath: z
    .string()
    .regex(/^avatars\/[0-9a-f-]{36}\.[a-z0-9]{2,5}$/, "Invalid photo.")
    .nullable(),
});

/** The signed-in admin's own display name and photo (stored on their Supabase Auth account). */
export async function updateAdminProfile(input: { fullName: string; avatarPath: string | null }): Promise<ActionResult> {
  let admin;
  try {
    admin = await assertAdmin();
  } catch {
    return { ok: false, message: "Your session has expired. Please sign in again." };
  }
  const parsed = adminProfileSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: "Please fix the highlighted fields.", fieldErrors: z.flattenError(parsed.error).fieldErrors };
  }
  const { fullName, avatarPath } = parsed.data;
  const supabase = await createClient();

  const { error: authError } = await supabase.auth.updateUser({ data: { full_name: fullName, avatar_url: avatarPath } });
  if (authError) return { ok: false, message: "Your profile could not be saved. Please try again." };
  // Name shown in the dashboard and the audit log.
  await supabase.from("profiles").update({ full_name: fullName }).eq("id", admin.userId);
  // Re-issue the session so the new photo/name are in the signed-in token straight away.
  await supabase.auth.refreshSession();

  revalidatePath("/admin", "layout");
  return { ok: true, message: "Profile updated" };
}
