import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { Notification } from "@/lib/types";

export type NotificationSnapshot = { items: Notification[]; unread: number };

/** Latest notifications + unread count for the signed-in admin (RLS limits to own rows). */
export async function getNotificationSnapshot(userId: string, limit = 10): Promise<NotificationSnapshot> {
  const supabase = await createClient();
  const [list, unread] = await Promise.all([
    supabase
      .from("notifications")
      .select("*")
      .eq("recipient_user_id", userId)
      .order("created_at", { ascending: false })
      .limit(limit),
    supabase
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .eq("recipient_user_id", userId)
      .eq("is_read", false),
  ]);
  return { items: list.data ?? [], unread: unread.count ?? 0 };
}

export const NOTIFICATIONS_PAGE_SIZE = 20;

export async function listNotifications(userId: string, opts: { page: number; unreadOnly: boolean }) {
  const supabase = await createClient();
  const from = (opts.page - 1) * NOTIFICATIONS_PAGE_SIZE;
  let query = supabase
    .from("notifications")
    .select("*", { count: "exact" })
    .eq("recipient_user_id", userId)
    .order("created_at", { ascending: false })
    .range(from, from + NOTIFICATIONS_PAGE_SIZE - 1);
  if (opts.unreadOnly) query = query.eq("is_read", false);
  const { data, count, error } = await query;
  return { items: data ?? [], total: count ?? 0, error: error ? "Notifications could not be loaded." : null };
}
