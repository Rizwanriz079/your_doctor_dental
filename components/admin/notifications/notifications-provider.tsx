"use client";

import { useRouter } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { fetchNotificationSnapshot, markNotificationsRead } from "@/features/notifications/actions";
import { createClient } from "@/lib/supabase/client";
import type { Notification } from "@/lib/types";
import { notificationHref } from "./notification-href";

type Ctx = {
  items: Notification[];
  unread: number;
  /** Increments on every new realtime notification (drives the one-time pulse). */
  pulseKey: number;
  freshIds: Set<string>;
  markRead: (id: string, wasUnread?: boolean) => Promise<void>;
  markAllRead: () => Promise<void>;
  reconcile: () => Promise<void>;
};

const NotificationsContext = createContext<Ctx | null>(null);

export function useNotifications() {
  const ctx = useContext(NotificationsContext);
  if (!ctx) throw new Error("useNotifications must be used inside <NotificationsProvider>");
  return ctx;
}


const MAX_ITEMS = 10;

/**
 * Realtime notification state for the admin shell.
 * The database is the source of truth: realtime only delivers new rows; the snapshot is
 * re-fetched after reconnects and when the tab regains focus.
 */
export function NotificationsProvider({
  userId,
  initialItems,
  initialUnread,
  children,
}: {
  userId: string;
  initialItems: Notification[];
  initialUnread: number;
  children: ReactNode;
}) {
  const router = useRouter();
  const [items, setItems] = useState(initialItems);
  const [unread, setUnread] = useState(initialUnread);
  const [pulseKey, setPulseKey] = useState(0);
  const [freshIds, setFreshIds] = useState<Set<string>>(() => new Set());
  const seen = useRef(new Set(initialItems.map((n) => n.id)));
  const refreshTimer = useRef<number | undefined>(undefined);
  const lastReconcile = useRef(0);

  const reconcile = useCallback(async () => {
    lastReconcile.current = Date.now();
    const res = await fetchNotificationSnapshot();
    if (!res.ok) return;
    res.data.items.forEach((n) => seen.current.add(n.id));
    setItems(res.data.items);
    setUnread(res.data.unread);
  }, []);

  const scheduleRefresh = useCallback(() => {
    window.clearTimeout(refreshTimer.current);
    refreshTimer.current = window.setTimeout(() => router.refresh(), 700);
  }, [router]);

  const handleInsert = useCallback(
    (n: Notification) => {
      if (seen.current.has(n.id)) return; // duplicate realtime delivery
      seen.current.add(n.id);
      setItems((prev) => [n, ...prev.filter((p) => p.id !== n.id)].slice(0, MAX_ITEMS));
      if (!n.is_read) setUnread((u) => u + 1);
      setPulseKey((k) => k + 1);
      setFreshIds((prev) => new Set(prev).add(n.id));
      window.setTimeout(() => {
        setFreshIds((prev) => {
          const next = new Set(prev);
          next.delete(n.id);
          return next;
        });
      }, 6000);
      toast(n.title, {
        description: n.message,
        action: { label: "View", onClick: () => router.push(notificationHref(n)) },
      });
      scheduleRefresh();
    },
    [router, scheduleRefresh],
  );

  useEffect(() => {
    const supabase = createClient();
    let subscribedBefore = false;
    let cancelled = false;
    let channel: ReturnType<typeof supabase.channel> | null = null;

    (async () => {
      const { data } = await supabase.auth.getSession();
      if (cancelled) return;
      if (data.session) await supabase.realtime.setAuth(data.session.access_token);
      channel = supabase
        .channel(`admin-notifications:${userId}`)
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "notifications", filter: `recipient_user_id=eq.${userId}` },
          (payload) => handleInsert(payload.new as Notification),
        )
        .subscribe((status) => {
          if (status === "SUBSCRIBED") {
            // Reconnected: fetch anything missed while disconnected.
            if (subscribedBefore) void reconcile();
            subscribedBefore = true;
          }
        });
    })();

    return () => {
      cancelled = true;
      if (channel) void supabase.removeChannel(channel);
    };
  }, [userId, handleInsert, reconcile]);

  useEffect(() => {
    function onVisible() {
      if (document.visibilityState === "visible" && Date.now() - lastReconcile.current > 15000) void reconcile();
    }
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", onVisible);
    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", onVisible);
      window.clearTimeout(refreshTimer.current);
    };
  }, [reconcile]);

  const markRead = useCallback(
    async (id: string, wasUnread?: boolean) => {
      const inList = items.find((n) => n.id === id);
      const unreadBefore = wasUnread ?? (inList ? !inList.is_read : false);
      if (!unreadBefore) return;
      setItems((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true, read_at: new Date().toISOString() } : n)));
      setUnread((u) => Math.max(0, u - 1));
      const res = await markNotificationsRead([id]);
      if (!res.ok) {
        toast.error(res.message);
        void reconcile();
      }
    },
    [items, reconcile],
  );

  const markAllRead = useCallback(async () => {
    setItems((prev) => prev.map((n) => ({ ...n, is_read: true })));
    setUnread(0);
    const res = await markNotificationsRead(null);
    if (!res.ok) {
      toast.error(res.message);
      void reconcile();
      return;
    }
    router.refresh();
  }, [reconcile, router]);

  const value = useMemo(
    () => ({ items, unread, pulseKey, freshIds, markRead, markAllRead, reconcile }),
    [items, unread, pulseKey, freshIds, markRead, markAllRead, reconcile],
  );

  return <NotificationsContext.Provider value={value}>{children}</NotificationsContext.Provider>;
}
