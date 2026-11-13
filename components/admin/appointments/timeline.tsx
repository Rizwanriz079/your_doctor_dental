import { CalendarClock, CirclePlus, RefreshCw } from "lucide-react";
import { StatusBadge } from "@/components/ui/badge";
import type { AppointmentEvent } from "@/lib/types";
import { formatDate, formatDateTime, formatTime } from "@/lib/utils";

type Event = AppointmentEvent & { actor_name: string | null };

function details(e: Event) {
  const d = (e.details ?? {}) as Record<string, string>;
  if (e.event_type === "rescheduled" && d.from_date) {
    return `${formatDate(d.from_date, "weekday")} ${formatTime(d.from_time)} → ${formatDate(d.to_date, "weekday")} ${formatTime(d.to_time)}`;
  }
  return null;
}

export function AppointmentTimeline({ events }: { events: Event[] }) {
  if (events.length === 0) return <p className="mt-3 text-sm text-body">No history recorded yet.</p>;
  return (
    <ol className="relative mt-4 space-y-5 border-l border-line pl-6">
      {events.map((e) => {
        const Icon = e.event_type === "created" ? CirclePlus : e.event_type === "rescheduled" ? CalendarClock : RefreshCw;
        const label =
          e.event_type === "created" ? "Booking created" : e.event_type === "rescheduled" ? "Rescheduled" : "Status changed";
        const extra = details(e);
        return (
          <li key={e.id} className="relative">
            <span className="absolute -left-[37px] grid size-7 place-items-center rounded-full bg-white text-brand-700 ring-1 ring-line" aria-hidden>
              <Icon className="size-3.5" />
            </span>
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-semibold text-navy-800">{label}</p>
              {e.event_type === "status_changed" && e.from_status && (
                <>
                  <StatusBadge status={e.from_status} />
                  <span className="text-body" aria-label="to">→</span>
                </>
              )}
              {e.to_status && e.event_type !== "rescheduled" && <StatusBadge status={e.to_status} />}
            </div>
            {extra && <p className="mt-1 text-sm text-navy-800">{extra}</p>}
            {e.note && <p className="mt-1 whitespace-pre-line text-sm break-anywhere">“{e.note}”</p>}
            <p className="mt-1 text-xs text-body">
              {e.actor_name ?? (e.event_type === "created" ? "Patient (online)" : "System")} · {formatDateTime(e.created_at)}
            </p>
          </li>
        );
      })}
    </ol>
  );
}
