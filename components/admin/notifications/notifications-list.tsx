"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { BellOff, CalendarPlus, Check, CheckCheck, Stethoscope } from "lucide-react";
import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/misc";
import type { Notification } from "@/lib/types";
import { cn, formatDateTime, relativeTime } from "@/lib/utils";
import { notificationHref } from "./notification-href";
import { useNotifications } from "./notifications-provider";

export function NotificationsList({ items, unreadOnly }: { items: Notification[]; unreadOnly: boolean }) {
  const { markRead, markAllRead, unread } = useNotifications();
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  if (items.length === 0) {
    return (
      <EmptyState
        icon={BellOff}
        title={unreadOnly ? "No unread notifications" : "No notifications yet"}
        description={unreadOnly ? "You're all caught up." : "When a patient books an appointment, you'll be notified here instantly."}
        action={
          unreadOnly ? (
            <Link href="/dentaladmincalicut/notifications" className="text-sm font-semibold text-brand-700 hover:underline">
              View all notifications
            </Link>
          ) : undefined
        }
      />
    );
  }

  return (
    <>
      {unread > 0 && (
        <div className="flex justify-end border-b border-line px-4 py-2">
          <Button
            variant="ghost"
            size="sm"
            loading={pending}
            onClick={() => startTransition(async () => markAllRead())}
          >
            <CheckCheck className="size-4" aria-hidden />
            Mark all as read
          </Button>
        </div>
      )}
      <ul className="divide-y divide-line">
        {items.map((n) => {
          const Icon = n.event_type === "doctor_attention" ? Stethoscope : CalendarPlus;
          return (
            <li key={n.id} className={cn("flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:px-5", !n.is_read && "bg-brand-50/40")}>
              <div className="flex min-w-0 flex-1 items-start gap-3">
                <span
                  className={cn(
                    "grid size-10 shrink-0 place-items-center rounded-xl",
                    n.is_read ? "bg-muted text-body" : "bg-brand-50 text-brand-700",
                  )}
                >
                  <Icon className="size-4.5" aria-hidden />
                </span>
                <div className="min-w-0">
                  <p className="flex flex-wrap items-center gap-2">
                    <span className={cn("text-sm text-navy-800", !n.is_read && "font-bold")}>{n.title}</span>
                    {!n.is_read && (
                      <span className="rounded-full bg-brand-600 px-2 py-0.5 text-[0.68rem] font-bold uppercase tracking-wide text-white">
                        New
                      </span>
                    )}
                  </p>
                  <p className="mt-0.5 text-sm text-body">{n.message}</p>
                  <p className="mt-1 text-xs text-navy-300">
                    <time dateTime={n.created_at} title={formatDateTime(n.created_at)}>
                      {relativeTime(n.created_at)}
                    </time>
                  </p>
                </div>
              </div>
              <div className="flex shrink-0 gap-2 pl-13 sm:pl-0">
                {!n.is_read && (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() =>
                      startTransition(async () => {
                        await markRead(n.id, true);
                        router.refresh();
                      })
                    }
                  >
                    <Check className="size-4" aria-hidden />
                    Mark read
                  </Button>
                )}
                <Link
                  href={notificationHref(n)}
                  onClick={() => {
                    if (!n.is_read) void markRead(n.id, true);
                  }}
                  className="inline-flex h-9 items-center rounded-full bg-navy-800 px-4 text-sm font-semibold text-white hover:bg-navy-900"
                >
                  Open
                </Link>
              </div>
            </li>
          );
        })}
      </ul>
    </>
  );
}
