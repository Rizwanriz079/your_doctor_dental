"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { assertAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { ActionResult } from "@/lib/types";
import { contentSchemas, testimonialSchema, type ContentSection, type TestimonialValues } from "./schema";

async function guard() {
  try {
    await assertAdmin();
    return null;
  } catch {
    return { ok: false as const, message: "Your session has expired. Please sign in again." };
  }
}

function issuesToErrors(error: z.ZodError) {
  const out: Record<string, string[]> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "_";
    (out[key] ??= []).push(issue.message);
  }
  return out;
}

function revalidatePublicSite() {
  revalidatePath("/admin/content");
  // Clinic name, contact details and footer appear on every public page.
  revalidatePath("/", "layout");
}

export async function saveContent(section: ContentSection, input: unknown): Promise<ActionResult> {
  const denied = await guard();
  if (denied) return denied;
  const schema = contentSchemas[section];
  if (!schema) return { ok: false, message: "Unknown section." };
  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: "Please fix the highlighted fields.", fieldErrors: issuesToErrors(parsed.error) };
  }
  const supabase = await createClient();
  const { error } = await supabase.from("clinic_settings").update(parsed.data as never).eq("id", 1);
  if (error) return { ok: false, message: "The changes could not be saved. Please try again." };
  revalidatePublicSite();
  return { ok: true, message: "Changes saved and published" };
}

export async function saveTestimonial(input: TestimonialValues): Promise<ActionResult> {
  const denied = await guard();
  if (denied) return denied;
  const parsed = testimonialSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: "Please fix the highlighted fields.", fieldErrors: issuesToErrors(parsed.error) };
  const { id, ...row } = parsed.data;
  const supabase = await createClient();
  const { error } = id
    ? await supabase.from("testimonials").update(row).eq("id", id)
    : await supabase.from("testimonials").insert(row);
  if (error) return { ok: false, message: "The testimonial could not be saved. Please try again." };
  revalidatePublicSite();
  return { ok: true, message: id ? "Testimonial updated" : "Testimonial added" };
}

export async function deleteTestimonial(id: string): Promise<ActionResult> {
  const denied = await guard();
  if (denied) return denied;
  if (!z.guid().safeParse(id).success) return { ok: false, message: "Invalid request." };
  const supabase = await createClient();
  const { error } = await supabase.from("testimonials").delete().eq("id", id);
  if (error) return { ok: false, message: "The testimonial could not be deleted. Please try again." };
  revalidatePublicSite();
  return { ok: true, message: "Testimonial deleted" };
}
