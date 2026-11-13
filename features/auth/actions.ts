"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import type { ActionResult } from "@/lib/types";

const signInSchema = z.object({
  email: z.email("Enter a valid email address.").max(200),
  password: z.string().min(1, "Enter your password.").max(200),
  next: z.string().max(300).optional(),
});

const GENERIC_ERROR = "The email or password is incorrect, or this account does not have admin access.";

/** Only allow redirects to internal admin pages (prevents open redirects). */
function safeNext(next: string | undefined) {
  if (!next || !next.startsWith("/admin") || next.startsWith("//") || next.startsWith("/admin/login")) {
    return "/admin/dashboard";
  }
  return next;
}

export async function signInAction(input: z.input<typeof signInSchema>): Promise<ActionResult> {
  const parsed = signInSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: "Please check the highlighted fields.", fieldErrors: z.flattenError(parsed.error).fieldErrors };
  }
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });
  if (error || !data.user) return { ok: false, message: GENERIC_ERROR };

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", data.user.id).maybeSingle();
  if (profile?.role !== "super_admin") {
    await supabase.auth.signOut();
    return { ok: false, message: GENERIC_ERROR };
  }

  redirect(safeNext(parsed.data.next));
}

export async function signOutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/admin/login");
}
