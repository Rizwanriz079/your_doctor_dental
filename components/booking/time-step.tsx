"use client";

import { AlertCircle, CalendarX2, Check, Loader2, RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/misc";
import { getSlots } from "@/features/booking/actions";
import type { DayAvailability } from "@/lib/types";
import { cn, formatDate, formatTime } from "@/lib/utils";
import type { Slot } from "./types";

const REASONS: Record<string, string> = {
  fully_booked: "This dentist is fully booked on this date.",
  no_slots_left: "There are no remaining times on this date.",
  date_blocked: "The clinic or dentist is closed on this date.",
  not_scheduled: "The dentist isn't working on this date.",
  date_in_past: "This date has already passed.",
  beyond_booking_window: "This date is too far ahead to book online.",
  doctor_unavailable: "This dentist is not taking bookings right now.",
  service_unavailable: "This service is not currently available.",
  service_not_offered: "This dentist doesn't offer the selected service.",
};

function period(start: string) {
  const h = Number(start.slice(0, 2));
  return h < 12 ? "Morning" : h < 17 ? "Afternoon" : "Evening";
}

export function TimeStep({
  doctorId,
  serviceId,
  date,
  selected,
  onSelect,
  refreshKey,
  onChangeDate,
  onChangeDoctor,
}: {
  doctorId: string;
  serviceId: string;
  date: string;
  selected: Slot | null;
  onSelect: (slot: Slot | null) => void;
  refreshKey: number;
  onChangeDate: () => void;
  onChangeDoctor: () => void;
}) {
  const [reload, setReload] = useState(0);
  const requestKey = `${doctorId}|${serviceId}|${date}|${refreshKey}|${reload}`;
  const [result, setResult] = useState<{ key: string; data?: DayAvailability; error?: string } | null>(null);
  const loading = result?.key !== requestKey;
  const data = result?.data ?? null;
  const error = !loading ? (result?.error ?? null) : null;

  useEffect(() => {
    let ignore = false;
    getSlots({ doctorId, serviceId, date }).then((res) => {
      if (ignore) return;
      if (!res.ok) {
        setResult({ key: requestKey, error: res.message });
        return;
      }
      setResult({ key: requestKey, data: res.availability });
      // Drop a previously chosen slot that is no longer free.
      if (selected && !res.availability.slots.some((s) => s.start === selected.start && s.available)) onSelect(null);
    });
    return () => {
      ignore = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- refetch only when the request key changes
  }, [requestKey]);

  if (loading && !data) {
    return (
      <div role="status" aria-label="Loading available times" className="space-y-4">
        <Skeleton className="h-16 w-full" />
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6">
          {Array.from({ length: 12 }, (_, i) => (
            <Skeleton key={i} className="h-12" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div role="alert" className="rounded-3xl bg-danger-50 p-6 text-danger-700">
        <p className="flex gap-2 font-semibold">
          <AlertCircle className="mt-0.5 size-5 shrink-0" aria-hidden /> {error}
        </p>
        <Button variant="secondary" className="mt-4" onClick={() => setReload((r) => r + 1)}>
          <RefreshCw className="size-4" aria-hidden /> Try again
        </Button>
      </div>
    );
  }
  if (!data) return null;

  const groups = data.slots.reduce<Record<string, DayAvailability["slots"]>>((acc, s) => {
    (acc[period(s.start)] ??= []).push(s);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 rounded-3xl bg-sky-soft p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="text-sm text-body">Selected date</p>
          <p className="font-bold text-navy-800">{formatDate(date)}</p>
        </div>
        <p
          className={cn(
            "inline-flex items-center gap-2 self-start rounded-full px-3.5 py-1.5 text-sm font-semibold sm:self-auto",
            data.bookable ? "bg-white text-success-700 ring-1 ring-success-600/20" : "bg-white text-danger-700 ring-1 ring-danger-600/20",
          )}
          role="status"
        >
          {loading && <Loader2 className="size-3.5 animate-spin" aria-hidden />}
          {data.fully_booked
            ? "Fully booked"
            : data.bookable
              ? `${data.remaining} appointment${data.remaining === 1 ? "" : "s"} remaining`
              : "No times available"}
        </p>
      </div>

      {!data.bookable ? (
        <div className="rounded-3xl p-6 text-center ring-1 ring-line">
          <CalendarX2 className="mx-auto size-8 text-warning-700" aria-hidden />
          <p className="mt-3 font-semibold text-navy-800">{REASONS[data.reason ?? ""] ?? "No times are available on this date."}</p>
          <p className="mt-1 text-sm">Please choose another date or another dentist.</p>
          <div className="mt-5 flex flex-col justify-center gap-2 sm:flex-row">
            <Button variant="primary" onClick={onChangeDate}>
              Choose another date
            </Button>
            <Button variant="secondary" onClick={onChangeDoctor}>
              Choose another dentist
            </Button>
          </div>
        </div>
      ) : (
        <fieldset className="space-y-5">
          <legend className="sr-only">Available times on {formatDate(date)}</legend>
          {Object.entries(groups).map(([label, slots]) => (
            <div key={label}>
              <h3 className="mb-2.5 text-sm font-bold text-navy-800">{label}</h3>
              <div className="grid grid-cols-[repeat(auto-fill,minmax(6.25rem,1fr))] gap-2">
                {slots.map((s) => {
                  const isSel = selected?.start === s.start;
                  return (
                    <button
                      key={s.start}
                      type="button"
                      disabled={!s.available}
                      onClick={() => onSelect(isSel ? null : { start: s.start, end: s.end })}
                      aria-pressed={isSel}
                      aria-label={`${formatTime(s.start)}${s.available ? "" : ", unavailable"}${isSel ? ", selected" : ""}`}
                      className={cn(
                        "relative flex min-h-12 items-center justify-center gap-1.5 rounded-xl px-2 text-sm font-semibold transition-[background-color,color,box-shadow,transform] duration-150 active:scale-[0.97]",
                        isSel
                          ? "bg-brand-600 text-white shadow-[0_6px_16px_-6px_rgb(11_122_124/0.7)] ring-2 ring-brand-300 ring-offset-2"
                          : s.available
                            ? "bg-white text-navy-800 ring-1 ring-line hover:bg-brand-50 hover:ring-brand-200"
                            : "cursor-not-allowed bg-muted text-navy-300 line-through",
                      )}
                    >
                      {isSel && <Check className="size-4" aria-hidden />}
                      {formatTime(s.start)}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
          {data.duration_minutes && <p className="text-sm text-body">Appointments last about {data.duration_minutes} minutes.</p>}
        </fieldset>
      )}
    </div>
  );
}
