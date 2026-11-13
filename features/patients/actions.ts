"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { assertAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { ActionResult } from "@/lib/types";

import { patientContactSchema } from "./schema";

export async function updatePatientContact(input: z.input<typeof patientContactSchema>): Promise<ActionResult> {
  try {
    await assertAdmin();
  } catch {
    return { ok: false, message: "Your session has expired. Please sign in again." };
  }
  const parsed = patientContactSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: "Please correct the highlighted fields.", fieldErrors: z.flattenError(parsed.error).fieldErrors };
  }
  const { id, fullName, phone, email } = parsed.data;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("patients")
    .update({ full_name: fullName, phone, email: email || null })
    .eq("id", id)
    .select("id")
    .maybeSingle();
  if (error) {
    if (error.code === "23505") {
      return {
        ok: false,
        message: "Another patient record already uses this phone number.",
        fieldErrors: { phone: ["Another patient record already uses this phone number."] },
      };
    }
    return { ok: false, message: "The patient details could not be saved. Please try again." };
  }
  if (!data) return { ok: false, message: "Patient not found." };
  revalidatePath("/admin/patients");
  revalidatePath(`/admin/patients/${id}`);
  return { ok: true, message: "Patient details updated." };
}
