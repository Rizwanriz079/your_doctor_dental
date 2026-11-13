"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { Bell, BellOff, CalendarPlus, CheckCheck, Stethoscope } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { duration, easeOut } from "@/lib/motion";
import { cn, relativeTime } from "@/lib/utils";
import { notificationHref } from "./notification-href";
import { useNotifications } from "./notifications-provider";

export function NotificationBell() {
  const { items, unread, pulseKey, freshIds, markRead, markAllRead } = useNotifications();
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const ref = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelId = useId();

  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus();
      }
    }
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-controls={panelId}
        aria-label={unread > 0 ? `Notifications, ${unread} unread` : "Notifications"}
        className={cn(
          "relative grid size-11 place-items-center rounded-2xl bg-white text-navy-800 ring-1 ring-line transition-colors hover:bg-muted",
          open && "bg-muted",
        )}
      >
        <Bell className="size-5" aria-hidden />
        {unread > 0 && (
          <motion.span
            key={pulseKey}
            initial={pulseKey > 0 ? { scale: 1 } : false}
            animate={pulseKey > 0 ? { scale: [1, 1.35, 1] } : undefined}
            transition={{ duration: 0.6, ease: easeOut }}
            className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-danger-600 px-1 text-[0.68rem] font-bold leading-none text-white ring-2 ring-white"
            aria-hidden
          >
            {unread > 99 ? "99+" : unread}
          </motion.span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            id={panelId}
            role="dialog"
            aria-label="Notifications"
            initial={{ opacity: 0, scale: 0.96, y: -6 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: -4 }}
            transition={{ duration: duration.normal, ease: easeOut }}
            style={{ transformOrigin: "top right" }}
            className="fixed inset-x-3 top-[4.5rem] z-50 overflow-hidden rounded-2xl border border-line bg-white shadow-lift sm:absolute sm:inset-x-auto sm:right-0 sm:top-full sm:mt-2 sm:w-[24rem]"
          >
            <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-3">
              <div>
                <p className="font-bold text-navy-800">Notifications</p>
                <p className="text-xs text-body">{unread > 0 ? `${unread} unread` : "You're all caught up"}</p>
              </div>
              {unread > 0 && (
                <button
                  type="button"
                  onClick={() => void markAllRead()}
                  className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold text-brand-700 hover:bg-brand-50"
                >
                  <CheckCheck className="size-4" aria-hidden />
                  Mark all as read
                </button>
              )}
            </div>

            {items.length === 0 ? (
              <div className="flex flex-col items-center px-6 py-10 text-center">
                <span className="mb-3 grid size-11 place-items-center rounded-2xl bg-brand-50 text-brand-600">
                  <BellOff className="size-5" aria-hidden />
                </span>
                <p className="font-semibold text-navy-800">No notifications yet</p>
                <p className="mt-1 text-sm text-body">New bookings will appear here instantly.</p>
              </div>
            ) : (
              <ul className="max-h-[min(60dvh,26rem)] divide-y divide-line overflow-y-auto">
                {items.map((n) => {
                  const Icon = n.event_type === "doctor_attention" ? Stethoscope : CalendarPlus;
                  return (
                    <li key={n.id}>
                      <button
                        type="button"
                        onClick={() => {
                          void markRead(n.id);
                          setOpen(false);
                          router.push(notificationHref(n));
                        }}
                        className={cn(
                          "flex w-full items-start gap-3 px-4 py-3 text-left transition-colors duration-700 hover:bg-muted",
                          freshIds.has(n.id) && "bg-brand-50",
                        )}
                      >
                        <span
                          className={cn(
                            "mt-0.5 grid size-9 shrink-0 place-items-center rounded-xl",
                            n.is_read ? "bg-muted text-body" : "bg-brand-50 text-brand-700",
                          )}
                        >
                          <Icon className="size-4" aria-hidden />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="flex items-center gap-2">
                            <span className={cn("truncate text-sm text-navy-800", !n.is_read && "font-bold")}>{n.title}</span>
                            {!n.is_read && (
                              <span className="size-2 shrink-0 rounded-full bg-brand-600">
                                <span className="sr-only">Unread</span>
                              </span>
                            )}
                          </span>
                          <span className="mt-0.5 line-clamp-2 block text-sm text-body">{n.message}</span>
                          <span className="mt-1 block text-xs text-navy-300">{relativeTime(n.created_at)}</span>
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
            <div className="border-t border-line p-2">
              <Link
                href="/admin/notifications"
                onClick={() => setOpen(false)}
                className="block rounded-xl px-3 py-2 text-center text-sm font-semibold text-navy-800 hover:bg-muted"
              >
                View all notifications
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
