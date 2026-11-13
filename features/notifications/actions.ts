"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { assertAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { ActionResult } from "@/lib/types";
import { getNotificationSnapshot, type NotificationSnapshot } from "./queries";

/** Used by the bell to reconcile after reconnects / tab focus. */
export async function fetchNotificationSnapshot(): Promise<ActionResult<NotificationSnapshot>> {
  try {
    const admin = await assertAdmin();
    return { ok: true, data: await getNotificationSnapshot(admin.userId) };
  } catch {
    return { ok: false, message: "Not authorised" };
  }
}

const idsSchema = z.array(z.guid()).max(200).nullable();

/** Mark specific notifications (or all, when ids is null) as read for the current admin. */
export async function markNotificationsRead(ids: string[] | null): Promise<ActionResult<{ updated: number }>> {
  try {
    await assertAdmin();
  } catch {
    return { ok: false, message: "Not authorised" };
  }
  const parsed = idsSchema.safeParse(ids);
  if (!parsed.success) return { ok: false, message: "Invalid notification selection." };
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("admin_mark_notifications_read", parsed.data ? { p_ids: parsed.data } : {});
  if (error) return { ok: false, message: "Could not update notifications. Please try again." };
  revalidatePath("/dentaladmincalicut/notifications");
  revalidatePath("/dentaladmincalicut/dashboard");
  return { ok: true, data: { updated: data ?? 0 } };
}
