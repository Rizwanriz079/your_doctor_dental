"use client";

import { useSafeReducedMotion } from "@/lib/use-reduced-motion";
import { motion } from "motion/react";
import { AlertTriangle, CalendarX2, Gauge, PartyPopper, SlidersHorizontal } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Field, Input } from "@/components/ui/field";
import { removeScheduleOverride, setCapacityOverride, setScheduleOverride, type AvailabilityResult } from "@/features/availability/actions";
import { duration, easeOut } from "@/lib/motion";
import { cn, formatDate, formatTime, WEEKDAYS_SHORT } from "@/lib/utils";
import type { RangeDay } from "./types";

function dayState(d: RangeDay) {
  if (d.holiday) return { label: "Clinic closed", tone: "closed" as const };
  if (d.schedule_override?.is_closed) return { label: "Closed", tone: "closed" as const };
  if (!d.scheduled) return { label: "Not scheduled", tone: "off" as const };
  if (d.over_capacity) return { label: "Over capacity", tone: "over" as const };
  if (d.remaining === 0) return { label: "Fully booked", tone: "full" as const };
  return { label: `${d.remaining} left`, tone: "open" as const };
}

export function AvailabilityGrid({
  days,
  doctorId,
  doctorName,
  defaultCapacity,
  today,
}: {
  days: RangeDay[];
  doctorId: string;
  doctorName: string;
  defaultCapacity: number;
  today: string;
}) {
  const [selected, setSelected] = useState<RangeDay | null>(null);
  const reduce = useSafeReducedMotion();

  return (
    <>
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
        {days.map((d, i) => {
          const s = dayState(d);
          const pct = d.capacity > 0 ? Math.min(100, Math.round((d.booked / d.capacity) * 100)) : 0;
          const past = d.date < today;
          return (
            <motion.li
              key={d.date}
              initial={reduce ? false : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: duration.medium, ease: easeOut, delay: Math.min(i * 0.02, 0.3) }}
            >
              <button
                type="button"
                disabled={past}
                onClick={() => setSelected(d)}
                aria-label={`${formatDate(d.date)}: ${s.label}. ${d.booked} of ${d.capacity} booked. Edit this day.`}
                className={cn(
                  "group flex h-full w-full flex-col gap-2 rounded-2xl border bg-white p-3.5 text-left shadow-soft transition-[box-shadow,transform,border-color] duration-200 hover:-translate-y-0.5 hover:shadow-lift disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-soft",
                  d.date === today ? "border-brand-400 ring-2 ring-brand-100" : "border-line",
                  (s.tone === "closed" || s.tone === "off") && "bg-muted",
                )}
              >
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-xs font-semibold uppercase tracking-wide text-body">{WEEKDAYS_SHORT[d.weekday]}</span>
                  <span className="text-lg font-bold tabular-nums text-navy-800">{Number(d.date.slice(8))}</span>
                </div>
                <p className="min-h-[2.5rem] text-xs leading-snug text-body">
                  {d.holiday ? (
                    <span className="flex items-center gap-1 font-semibold text-danger-700">
                      <PartyPopper className="size-3.5 shrink-0" aria-hidden />
                      <span className="truncate">{d.holiday}</span>
                    </span>
                  ) : d.intervals.length > 0 ? (
                    d.intervals.map((iv) => (
                      <span key={iv.start} className="block">
                        {formatTime(iv.start)}–{formatTime(iv.end)}
                      </span>
                    ))
                  ) : d.schedule_override?.is_closed ? (
                    <span className="flex items-center gap-1 font-semibold text-danger-700">
                      <CalendarX2 className="size-3.5" aria-hidden />
                      {d.schedule_override.reason || "Closed"}
                    </span>
                  ) : (
                    "Day off"
                  )}
                </p>
                {d.scheduled && (
                  <div>
                    <div className="mb-1 flex items-baseline justify-between text-xs">
                      <span className="font-semibold tabular-nums text-navy-800">
                        {d.booked}/{d.capacity}
                      </span>
                      <span
                        className={cn(
                          "font-semibold",
                          s.tone === "over" ? "text-danger-700" : s.tone === "full" ? "text-warning-700" : "text-success-700",
                        )}
                      >
                        {s.label}
                      </span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-navy-50" aria-hidden>
                      <div
                        className={cn(
                          "h-full rounded-full transition-[width] duration-500",
                          s.tone === "over" ? "bg-danger-600" : s.tone === "full" ? "bg-warning-500" : "bg-brand-500",
                        )}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                )}
                {!d.scheduled && <span className="text-xs font-semibold text-body">{s.label}</span>}
                {(d.capacity_override || (d.schedule_override && !d.schedule_override.is_closed)) && (
                  <div className="flex flex-wrap gap-1">
                    {d.capacity_override && (
                      <span className="rounded-full bg-brand-50 px-1.5 py-0.5 text-[0.68rem] font-semibold text-brand-700">Limit set</span>
                    )}
                    {d.schedule_override && !d.schedule_override.is_closed && (
                      <span className="rounded-full bg-navy-50 px-1.5 py-0.5 text-[0.68rem] font-semibold text-navy-700">Special hours</span>
                    )}
                  </div>
                )}
              </button>
            </motion.li>
          );
        })}
      </ul>
      <DayDialog day={selected} onClose={() => setSelected(null)} doctorId={doctorId} doctorName={doctorName} defaultCapacity={defaultCapacity} />
    </>
  );
}

type Warning = { kind: "capacity" | "hours" | "remove"; message: string; booked?: number; affected?: Extract<AvailabilityResult, { ok: false }>["affected"] };

function DayDialog({
  day,
  onClose,
  doctorId,
  doctorName,
  defaultCapacity,
}: {
  day: RangeDay | null;
  onClose: () => void;
  doctorId: string;
  doctorName: string;
  defaultCapacity: number;
}) {
  return (
    <Dialog
      open={Boolean(day)}
      onClose={onClose}
      size="lg"
      title={day ? formatDate(day.date) : ""}
      description={day ? `${doctorName} · ${day.booked} active booking(s)` : undefined}
    >
      {day && <DayEditor key={day.date} day={day} onClose={onClose} doctorId={doctorId} defaultCapacity={defaultCapacity} />}
    </Dialog>
  );
}

function DayEditor({
  day,
  onClose,
  doctorId,
  defaultCapacity,
}: {
  day: RangeDay;
  onClose: () => void;
  doctorId: string;
  defaultCapacity: number;
}) {
  const router = useRouter();
  const [busy, startTransition] = useTransition();
  const [warning, setWarning] = useState<Warning | null>(null);
  const [capacity, setCapacity] = useState(String(day.capacity_override?.max_bookings ?? ""));
  const [capReason, setCapReason] = useState(day.capacity_override?.reason ?? "");
  const so = day.schedule_override;
  const [mode, setMode] = useState<"regular" | "closed" | "custom">(so ? (so.is_closed ? "closed" : "custom") : "regular");
  const [start, setStart] = useState(so?.start_time ?? day.intervals[0]?.start ?? "09:00");
  const [end, setEnd] = useState(so?.end_time ?? day.intervals[day.intervals.length - 1]?.end ?? "17:00");
  const [hoursReason, setHoursReason] = useState(so?.reason ?? "");
  const [capError, setCapError] = useState<string>();

  function done(res: AvailabilityResult, kind: Warning["kind"]) {
    if (res.ok) {
      toast.success(res.message ?? "Saved");
      setWarning(null);
      onClose();
      router.refresh();
      return;
    }
    if (res.code === "below_booked" || res.code === "impact") {
      setWarning({ kind, message: res.message, booked: res.booked, affected: res.affected });
      return;
    }
    toast.error(res.message);
  }

  function saveCapacity(force = false, remove = false) {
    const max = remove ? null : Number(capacity);
    if (!remove && (capacity.trim() === "" || !Number.isInteger(max) || (max as number) < 0)) {
      setCapError("Enter a whole number, 0 or more.");
      return;
    }
    startTransition(async () => {
      done(await setCapacityOverride({ doctorId, date: day.date, max, reason: capReason, force }), "capacity");
    });
  }

  function saveHours(force = false) {
    startTransition(async () => {
      if (mode === "regular") {
        if (!so) {
          onClose();
          return;
        }
        done(await removeScheduleOverride({ doctorId, date: day.date, force }), "remove");
        return;
      }
      done(
        await setScheduleOverride({ doctorId, date: day.date, closed: mode === "closed", start, end, reason: hoursReason, force }),
        "hours",
      );
    });
  }

  const radio = (value: typeof mode, label: string, hint: string) => (
    <label
      className={cn(
        "flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition-colors",
        mode === value ? "border-brand-400 bg-brand-50/60" : "border-line hover:bg-muted",
      )}
    >
      <input type="radio" name="hours-mode" className="mt-1 accent-brand-600" checked={mode === value} onChange={() => setMode(value)} />
      <span>
        <span className="block text-sm font-semibold text-navy-800">{label}</span>
        <span className="block text-xs text-body">{hint}</span>
      </span>
    </label>
  );

  return (
    <div className="flex flex-col gap-6">
      {day.holiday && (
        <p className="flex items-center gap-2 rounded-xl bg-danger-50 px-4 py-3 text-sm text-danger-700">
          <PartyPopper className="size-4 shrink-0" aria-hidden />
          The whole clinic is closed for “{day.holiday}”. Remove the clinic closure to open this day.
        </p>
      )}

      {warning && (
        <div role="alert" className="rounded-2xl border border-warning-500/40 bg-warning-50 p-4 text-sm">
          <p className="flex items-start gap-2 font-semibold text-warning-700">
            <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden />
            {warning.message}
          </p>
          {warning.affected && warning.affected.length > 0 && (
            <ul className="mt-3 divide-y divide-warning-500/20 rounded-xl bg-white">
              {warning.affected.map((a) => (
                <li key={a.id} className="flex flex-wrap justify-between gap-2 px-3 py-2">
                  <a href={`/admin/appointments/${a.id}`} className="font-semibold text-navy-800 underline-offset-2 hover:underline">
                    {a.reference}
                  </a>
                  <span>{a.patient_name}</span>
                  <span className="text-body">{formatTime(a.start_time)}</span>
                </li>
              ))}
            </ul>
          )}
          <p className="mt-3 text-body">Existing bookings are kept. Review them afterwards and reschedule or cancel if needed.</p>
          <div className="mt-3 flex flex-wrap justify-end gap-2">
            <Button size="sm" variant="secondary" onClick={() => setWarning(null)} disabled={busy}>
              Go back
            </Button>
            <Button
              size="sm"
              variant="danger"
              loading={busy}
              onClick={() => (warning.kind === "capacity" ? saveCapacity(true) : saveHours(true))}
            >
              Save anyway
            </Button>
          </div>
        </div>
      )}

      <section aria-labelledby="cap-heading" className="rounded-2xl border border-line p-4 sm:p-5">
        <h3 id="cap-heading" className="mb-1 flex items-center gap-2 font-bold text-navy-800">
          <Gauge className="size-4 text-brand-600" aria-hidden />
          Daily booking limit
        </h3>
        <p className="mb-4 text-sm text-body">
          Default for this doctor: <strong className="text-navy-800">{defaultCapacity}</strong>. Effective today:{" "}
          <strong className="text-navy-800">{day.capacity}</strong>
          {day.capacity_override ? (
            <Badge tone="brand" className="ml-2">
              Override
            </Badge>
          ) : null}
        </p>
        <div className="grid gap-4 sm:grid-cols-[10rem_1fr]">
          <Field label="Limit for this date" error={capError}>
            {({ id, describedBy, invalid }) => (
              <Input
                id={id}
                type="number"
                min={0}
                inputMode="numeric"
                placeholder={String(defaultCapacity)}
                aria-describedby={describedBy}
                aria-invalid={invalid}
                value={capacity}
                onChange={(e) => {
                  setCapacity(e.target.value);
                  setCapError(undefined);
                }}
              />
            )}
          </Field>
          <Field label="Reason (optional)">
            {({ id }) => <Input id={id} value={capReason} maxLength={200} onChange={(e) => setCapReason(e.target.value)} placeholder="e.g. Training in the afternoon" />}
          </Field>
        </div>
        <div className="mt-4 flex flex-wrap justify-end gap-2">
          {day.capacity_override && (
            <Button variant="ghost" size="sm" onClick={() => saveCapacity(false, true)} disabled={busy}>
              Use default ({defaultCapacity})
            </Button>
          )}
          <Button size="sm" variant="navy" onClick={() => saveCapacity(false)} loading={busy && !warning}>
            Save limit
          </Button>
        </div>
      </section>

      <section aria-labelledby="hours-heading" className="rounded-2xl border border-line p-4 sm:p-5">
        <h3 id="hours-heading" className="mb-4 flex items-center gap-2 font-bold text-navy-800">
          <SlidersHorizontal className="size-4 text-brand-600" aria-hidden />
          Working hours on this date
        </h3>
        <fieldset className="grid gap-2 sm:grid-cols-3">
          <legend className="sr-only">Hours for this date</legend>
          {radio("regular", "Regular hours", "Use the weekly schedule")}
          {radio("closed", "Closed / leave", "No bookings this day")}
          {radio("custom", "Special hours", "Different times")}
        </fieldset>
        {mode === "custom" && (
          <div className="mt-4 grid grid-cols-2 gap-4">
            <Field label="Start">{({ id }) => <Input id={id} type="time" value={start} onChange={(e) => setStart(e.target.value)} />}</Field>
            <Field label="End">{({ id }) => <Input id={id} type="time" value={end} onChange={(e) => setEnd(e.target.value)} />}</Field>
          </div>
        )}
        {mode !== "regular" && (
          <Field label="Reason (internal)" className="mt-4">
            {({ id }) => (
              <Input id={id} value={hoursReason} maxLength={200} onChange={(e) => setHoursReason(e.target.value)} placeholder="e.g. Annual leave" />
            )}
          </Field>
        )}
        <div className="mt-4 flex justify-end">
          <Button size="sm" variant="navy" onClick={() => saveHours(false)} loading={busy && !warning}>
            Save hours
          </Button>
        </div>
      </section>
    </div>
  );
}
