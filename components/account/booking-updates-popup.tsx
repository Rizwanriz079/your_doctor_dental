"use client";

import { CalendarClock, CheckCircle2, CircleCheckBig, XCircle, type LucideIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { markBookingUpdatesSeen } from "@/features/account/actions";
import { cn, formatDate, formatTime } from "@/lib/utils";
import type { MyBooking } from "./my-bookings";

const KIND: Record<string, { title: string; icon: LucideIcon; tone: string }> = {
  confirmed: { title: "Appointment confirmed", icon: CheckCircle2, tone: "bg-brand-50 text-brand-700" },
  rescheduled: { title: "Appointment moved to a new time", icon: CalendarClock, tone: "bg-sky-soft text-navy-800" },
  rejected: { title: "Booking request declined", icon: XCircle, tone: "bg-danger-50 text-danger-700" },
  cancelled: { title: "Appointment cancelled by the clinic", icon: XCircle, tone: "bg-danger-50 text-danger-700" },
  completed: { title: "Visit completed", icon: CircleCheckBig, tone: "bg-success-50 text-success-700" },
};

function kindOf(b: MyBooking) {
  const c = b.last_change;
  if (!c) return null;
  if (c.type === "rescheduled") return "rescheduled";
  return c.to_status && KIND[c.to_status] ? c.to_status : null;
}

/** Popup shown when the patient opens "My appointments" and the clinic has changed a booking since their last visit. */
export function BookingUpdatesPopup({ updates }: { updates: MyBooking[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  const items = updates.filter((b) => kindOf(b));

  // Open after the page has painted, so it feels like a notification rather than a blocker.
  useEffect(() => {
    if (items.length === 0) return;
    const t = window.setTimeout(() => setOpen(true), 400);
    return () => window.clearTimeout(t);
  }, [items.length]);

  if (items.length === 0) return null;

  const dismiss = () =>
    start(async () => {
      await markBookingUpdatesSeen();
      setOpen(false);
      router.refresh();
    });

  return (
    <Dialog
      open={open}
      onClose={dismiss}
      busy={pending}
      title={items.length === 1 ? "Update on your appointment" : `${items.length} updates on your appointments`}
      description="The clinic has made changes since you last checked."
      footer={
        <Button onClick={dismiss} loading={pending} className="w-full sm:w-auto" data-autofocus>
          Got it
        </Button>
      }
    >
      <ul className="space-y-3">
        {items.map((b) => {
          const k = KIND[kindOf(b)!];
          const Icon = k.icon;
          const from = b.last_change?.from_date && b.last_change.from_time
            ? `${formatDate(b.last_change.from_date)} at ${formatTime(b.last_change.from_time)}`
            : null;
          return (
            <li key={b.id} className="flex gap-3 rounded-2xl border border-line p-3.5">
              <span className={cn("grid size-10 shrink-0 place-items-center rounded-xl", k.tone)} aria-hidden>
                <Icon className="size-5" />
              </span>
              <div className="min-w-0 text-sm">
                <p className="font-bold text-navy-800">{k.title}</p>
                <p className="mt-0.5 text-body">
                  {b.service_name} with <span className="font-semibold text-navy-800">{b.doctor_name}</span>
                </p>
                <p className="mt-0.5 font-semibold text-navy-800">
                  {formatDate(b.date)} · {formatTime(b.start_time)}
                </p>
                {from && <p className="mt-0.5 text-xs text-body">Previously {from}</p>}
                {b.status_reason && ["rejected", "cancelled"].includes(b.status) && (
                  <p className="mt-1.5 rounded-lg bg-muted px-2.5 py-1.5 text-xs text-navy-700">Reason: {b.status_reason}</p>
                )}
                <p className="mt-1 text-xs text-body">Ref {b.reference}</p>
              </div>
            </li>
          );
        })}
      </ul>
    </Dialog>
  );
}
