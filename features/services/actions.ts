"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { assertAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { ActionResult } from "@/lib/types";
import { serviceFormSchema, type ServiceFormValues } from "./schema";

function revalidateServicePaths(id?: string) {
  revalidatePath("/admin/services");
  if (id) revalidatePath(`/admin/services/${id}/edit`);
  revalidatePath("/admin/doctors", "layout");
  revalidatePath("/");
  revalidatePath("/services");
  revalidatePath("/services/[slug]", "page");
  revalidatePath("/doctors");
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

export async function saveService(input: ServiceFormValues): Promise<ActionResult<{ id: string }>> {
  const denied = await guard();
  if (denied) return denied;
  const parsed = serviceFormSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: "Please fix the highlighted fields.", fieldErrors: z.flattenError(parsed.error).fieldErrors };
  }
  const { id } = parsed.data;
  const supabase = await createClient();

  // Service row + doctor assignments are written atomically by the database function.
  const { data, error } = await supabase.rpc("admin_save_service", { p: parsed.data });
  const result = data as { ok: boolean; id?: string; code?: string; message?: string } | null;
  if (error || !result?.ok || !result.id) {
    if (result?.code === "slug_taken") {
      return { ok: false, message: result.message ?? "Slug in use.", fieldErrors: { slug: ["This slug is already in use."] } };
    }
    return { ok: false, message: result?.message ?? "The service could not be saved. Please try again." };
  }
  const serviceId = result.id;

  revalidateServicePaths(serviceId);
  return { ok: true, data: { id: serviceId }, message: id ? "Service updated" : "Service created" };
}

const lifecycleSchema = z.object({
  id: z.guid(),
  action: z.enum(["activate", "deactivate", "archive", "restore", "delete"]),
});

export async function serviceLifecycle(input: z.input<typeof lifecycleSchema>): Promise<ActionResult> {
  const denied = await guard();
  if (denied) return denied;
  const parsed = lifecycleSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: "Invalid request." };
  const { id, action } = parsed.data;
  const supabase = await createClient();

  if (action === "delete") {
    const { error } = await supabase.from("services").delete().eq("id", id);
    if (error) {
      if (error.code === "23503") {
        return {
          ok: false,
          code: "has_history",
          message: "This service has appointment history and cannot be deleted. Archive it instead to keep records intact.",
        };
      }
      return { ok: false, message: "The service could not be deleted. Please try again." };
    }
    revalidateServicePaths();
    return { ok: true, message: "Service deleted" };
  }

  const patch =
    action === "activate"
      ? { is_active: true }
      : action === "deactivate"
        ? { is_active: false }
        : action === "archive"
          ? { is_active: false, is_featured: false, archived_at: new Date().toISOString() }
          : { archived_at: null };
  const { error } = await supabase.from("services").update(patch).eq("id", id);
  if (error) return { ok: false, message: "The service could not be updated. Please try again." };
  revalidateServicePaths(id);
  const messages = {
    activate: "Service activated",
    deactivate: "Service deactivated. It is hidden from new bookings.",
    archive: "Service archived",
    restore: "Service restored as inactive",
  } as const;
  return { ok: true, message: messages[action] };
}
