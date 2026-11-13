"use client";

import { CalendarDays, CalendarPlus, Clock, Stethoscope, Tag } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { StatusBadge } from "@/components/ui/badge";
import { ButtonLink, Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Avatar, EmptyState } from "@/components/ui/misc";
import { cancelMyAppointment } from "@/features/account/actions";
import { cn, formatDate, formatTime } from "@/lib/utils";

export type MyBooking = {
  id: string;
  reference: string;
  status: string;
  date: string;
  start_time: string;
  end_time: string;
  doctor_name: string;
  doctor_slug: string | null;
  doctor_photo: string | null;
  service_name: string;
  status_reason: string | null;
  created_at: string;
  upcoming: boolean;
  can_cancel: boolean;
};

export function MyBookings({ bookings }: { bookings: MyBooking[] }) {
  const router = useRouter();
  const upcoming = bookings.filter((b) => b.upcoming && ["pending", "confirmed"].includes(b.status)).reverse(); // soonest first
  const past = bookings.filter((b) => !upcoming.includes(b));
  const [tab, setTab] = useState<"upcoming" | "past">(upcoming.length || !past.length ? "upcoming" : "past");
  const [cancelling, setCancelling] = useState<MyBooking | null>(null);
  const [pending, start] = useTransition();
  const list = tab === "upcoming" ? upcoming : past;

  function cancel(reason: string) {
    if (!cancelling) return;
    start(async () => {
      const res = await cancelMyAppointment({ id: cancelling.id, reason: reason || undefined });
      if (res.ok) {
        toast.success(res.message ?? "Appointment cancelled.");
        setCancelling(null);
        router.refresh();
      } else toast.error(res.message);
    });
  }

  return (
    <div>
      <div role="tablist" aria-label="Bookings" className="inline-flex rounded-full bg-muted p-1 ring-1 ring-line">
        {(["upcoming", "past"] as const).map((t) => (
          <button
            key={t}
            role="tab"
            type="button"
            aria-selected={tab === t}
            onClick={() => setTab(t)}
            className={cn(
              "rounded-full px-4 py-2 text-sm font-semibold transition-colors",
              tab === t ? "bg-white text-navy-800 shadow-soft" : "text-body hover:text-navy-800",
            )}
          >
            {t === "upcoming" ? `Upcoming (${upcoming.length})` : `Past & cancelled (${past.length})`}
          </button>
        ))}
      </div>

      {list.length === 0 ? (
        <EmptyState
          icon={CalendarDays}
          title={tab === "upcoming" ? "No upcoming appointments" : "No past appointments yet"}
          description={tab === "upcoming" ? "When you book an appointment while signed in, it will appear here." : undefined}
          action={
            tab === "upcoming" && (
              <ButtonLink href="/book-appointment">
                <CalendarPlus className="size-4" aria-hidden /> Book an appointment
              </ButtonLink>
            )
          }
        />
      ) : (
        <ul className="mt-5 grid gap-4">
          {list.map((b) => (
            <li key={b.id} className="rounded-2xl border border-line bg-white p-4 shadow-soft sm:p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <Avatar name={b.doctor_name} path={b.doctor_photo} size={48} />
                  <div className="min-w-0">
                    <p className="font-bold text-navy-800 break-anywhere">{b.service_name}</p>
                    <p className="text-sm text-body">
                      {b.doctor_slug ? (
                        <Link href={`/doctors/${b.doctor_slug}`} className="hover:text-brand-700 hover:underline">
                          {b.doctor_name}
                        </Link>
                      ) : (
                        b.doctor_name
                      )}
                    </p>
                  </div>
                </div>
                <StatusBadge status={b.status} />
              </div>
              <dl className="mt-4 grid gap-2 text-sm sm:grid-cols-3">
                <div className="flex items-center gap-2">
                  <CalendarDays className="size-4 text-brand-600" aria-hidden />
                  <dt className="sr-only">Date</dt>
                  <dd className="font-semibold text-navy-800">{formatDate(b.date)}</dd>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="size-4 text-brand-600" aria-hidden />
                  <dt className="sr-only">Time</dt>
                  <dd className="font-semibold text-navy-800">
                    {formatTime(b.start_time)} – {formatTime(b.end_time)}
                  </dd>
                </div>
                <div className="flex items-center gap-2">
                  <Tag className="size-4 text-brand-600" aria-hidden />
                  <dt className="sr-only">Reference</dt>
                  <dd className="font-mono text-navy-800">{b.reference}</dd>
                </div>
              </dl>
              {b.status === "pending" && (
                <p className="mt-3 flex items-center gap-2 text-sm text-warning-700">
                  <Stethoscope className="size-4" aria-hidden /> Waiting for the clinic to confirm.
                </p>
              )}
              {b.status_reason && (
                <p className="mt-3 rounded-xl bg-muted p-3 text-sm break-anywhere">
                  <span className="font-semibold text-navy-800">Note: </span>
                  {b.status_reason}
                </p>
              )}
              {b.can_cancel && (
                <div className="mt-4 flex justify-end border-t border-line pt-4">
                  <Button variant="danger-soft" size="sm" onClick={() => setCancelling(b)}>
                    Cancel appointment
                  </Button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      <ConfirmDialog
        open={Boolean(cancelling)}
        onClose={() => !pending && setCancelling(null)}
        onConfirm={cancel}
        loading={pending}
        tone="danger"
        title="Cancel this appointment?"
        description={
          cancelling
            ? `${cancelling.service_name} with ${cancelling.doctor_name} on ${formatDate(cancelling.date)} at ${formatTime(cancelling.start_time)}. The time will be released for other patients.`
            : undefined
        }
        confirmLabel="Cancel appointment"
        reason={{ label: "Reason (optional)", placeholder: "Let the clinic know why, if you like" }}
      />
    </div>
  );
}
