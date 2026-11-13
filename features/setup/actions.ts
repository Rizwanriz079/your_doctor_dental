"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import type { ActionResult } from "@/lib/types";
import { getSetupState } from "./queries";

/**
 * First-run setup: creates the super admin's account in Supabase Auth, then grants the
 * super_admin role through claim_first_admin(), which the database only allows while no
 * super admin exists. No service-role key is involved.
 */

const setupSchema = z
  .object({
    fullName: z.string().trim().min(2, "Please enter your name.").max(100),
    email: z.string().trim().toLowerCase().pipe(z.email("Please enter a valid email address.")),
    password: z
      .string()
      .min(10, "Use at least 10 characters for the admin password.")
      .max(72)
      .regex(/[A-Za-z]/, "Include at least one letter.")
      .regex(/\d/, "Include at least one number."),
    confirmPassword: z.string(),
  })
  .refine((v) => v.password === v.confirmPassword, { path: ["confirmPassword"], message: "Passwords don't match." });

async function origin() {
  const env = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "");
  if (env) return env;
  const h = await headers();
  return `${h.get("x-forwarded-proto") ?? "http"}://${h.get("x-forwarded-host") ?? h.get("host")}`;
}

async function claim(fullName?: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("claim_first_admin", { p_full_name: fullName });
  const res = data as { ok: boolean; code?: string; message?: string } | null;
  if (error || !res?.ok) return { ok: false, code: res?.code, message: res?.message ?? "Setup could not be completed." };
  return { ok: true };
}

export async function createFirstAdmin(input: unknown): Promise<ActionResult> {
  const setup = await getSetupState();
  if (setup.state !== "needs_admin") {
    return { ok: false, code: setup.state, message: "Setup is not available. An administrator may already exist." };
  }
  const parsed = setupSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: "Please check the highlighted fields.", fieldErrors: z.flattenError(parsed.error).fieldErrors };
  }
  const { fullName, email, password } = parsed.data;
  const supabase = await createClient();

  // Existing account with this email (e.g. created in the Supabase dashboard): sign in instead.
  const signIn = await supabase.auth.signInWithPassword({ email, password });
  if (!signIn.error) {
    const res = await claim(fullName);
    if (!res.ok) return res;
    redirect("/admin/dashboard");
  }
  if (signIn.error.code === "email_not_confirmed") {
    // Account exists but was never confirmed: send a fresh confirmation link.
    const resent = await supabase.auth.resend({
      type: "signup",
      email,
      options: { emailRedirectTo: `${await origin()}/auth/callback?next=/admin/setup/complete` },
    });
    if (resent.error?.code === "over_email_send_rate_limit") {
      return { ok: false, message: "Too many emails sent. Please wait a minute and try again." };
    }
    return { ok: true, message: "check_email" };
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName },
      emailRedirectTo: `${await origin()}/auth/callback?next=/admin/setup/complete`,
    },
  });
  if (error) {
    if (error.code === "user_already_exists") return { ok: false, message: "An account with this email already exists, but the password is different." };
    if (error.code === "over_email_send_rate_limit") return { ok: false, message: "Too many emails sent. Please wait a minute and try again." };
    if (error.code === "weak_password") return { ok: false, message: "Please choose a stronger password." };
    return { ok: false, message: "The account could not be created. Check that email sign-up is enabled in Supabase Auth." };
  }

  if (!data.session) return { ok: true, message: "check_email" }; // "Confirm email" is on in Supabase
  const res = await claim(fullName);
  if (!res.ok) return res;
  redirect("/admin/dashboard");
}

/** Called after the confirmation link signs the new admin in. */
export async function finishFirstAdmin(): Promise<ActionResult> {
  const res = await claim();
  if (!res.ok) return res;
  redirect("/admin/dashboard");
}
