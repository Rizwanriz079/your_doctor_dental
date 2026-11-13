"use client";

import { AlertCircle, Loader2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { DayPicker, type ClassNames } from "react-day-picker";
import { Button } from "@/components/ui/button";
import { getCalendar } from "@/features/booking/actions";
import type { CalendarDay } from "@/lib/types";
import { cn, parseDateOnly, toDateOnly } from "@/lib/utils";

const STATUS_LABEL: Record<CalendarDay["status"], string> = {
  available: "available",
  full: "fully booked",
  closed: "closed",
  out_of_range: "not bookable",
  unavailable: "unavailable",
};

const classNames: Partial<ClassNames> = {
  root: "relative w-full",
  months: "w-full",
  month: "w-full",
  month_caption: "mb-3 flex h-11 items-center px-1",
  caption_label: "text-base font-bold text-navy-800",
  nav: "absolute right-0 top-0 z-10 flex gap-1.5",
  button_previous:
    "grid size-11 place-items-center rounded-full bg-white ring-1 ring-line transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-35",
  button_next:
    "grid size-11 place-items-center rounded-full bg-white ring-1 ring-line transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-35",
  chevron: "size-4 fill-navy-800",
  month_grid: "w-full border-collapse",
  weekday: "pb-2 text-center text-xs font-semibold uppercase tracking-wide text-body",
  day: "p-0.5 text-center align-middle",
  day_button:
    "relative mx-auto grid size-9 place-items-center rounded-full text-sm font-semibold text-navy-800 transition-[background-color,color,box-shadow] duration-200 sm:size-11 disabled:cursor-not-allowed",
  selected: "[&>button]:!bg-brand-600 [&>button]:!text-white [&>button]:shadow-[0_6px_16px_-6px_rgb(11_122_124/0.7)]",
  today: "[&>button]:ring-2 [&>button]:ring-navy-300",
  disabled: "[&>button]:text-navy-300",
  outside: "invisible",
};

export function DateStep({
  doctorId,
  serviceId,
  today,
  windowDays,
  selected,
  onSelect,
}: {
  doctorId: string;
  serviceId: string;
  today: string;
  windowDays: number;
  selected: string | null;
  onSelect: (date: string) => void;
}) {
  const todayDate = useMemo(() => parseDateOnly(today), [today]);
  const maxDate = useMemo(() => {
    const d = parseDateOnly(today);
    d.setDate(d.getDate() + windowDays);
    return d;
  }, [today, windowDays]);
  const [month, setMonth] = useState<Date>(() => {
    const base = selected ? parseDateOnly(selected) : todayDate;
    return new Date(base.getFullYear(), base.getMonth(), 1);
  });
  const [days, setDays] = useState<Record<string, CalendarDay>>({});
  const [loadedMonths, setLoadedMonths] = useState<Record<string, "done" | "error">>({});
  const [retry, setRetry] = useState(0);

  const monthKey = `${month.getFullYear()}-${month.getMonth()}`;
  const range = useMemo(() => {
    const first = new Date(month.getFullYear(), month.getMonth(), 1);
    const last = new Date(month.getFullYear(), month.getMonth() + 1, 0);
    const from = first < todayDate ? todayDate : first;
    const to = last > maxDate ? maxDate : last;
    return from > to ? null : { from: toDateOnly(from), to: toDateOnly(to) };
  }, [month, todayDate, maxDate]);
  const state = (!range ? "done" : (loadedMonths[monthKey] ?? "loading")) as "loading" | "done" | "error";

  useEffect(() => {
    if (!range || loadedMonths[monthKey]) return;
    let ignore = false;
    getCalendar({ doctorId, serviceId, from: range.from, to: range.to }).then((res) => {
      if (ignore) return;
      if (res.ok) {
        setDays((prev) => {
          const next = { ...prev };
          res.days.forEach((d) => (next[d.date] = d));
          return next;
        });
      }
      setLoadedMonths((m) => ({ ...m, [monthKey]: res.ok ? "done" : "error" }));
    });
    return () => {
      ignore = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- loadedMonths is a cache, not a trigger
  }, [monthKey, range, doctorId, serviceId, retry]);

  const statusOf = (d: Date) => days[toDateOnly(d)]?.status;
  const monthDays = Object.values(days).filter((d) => {
    const dt = parseDateOnly(d.date);
    return dt.getFullYear() === month.getFullYear() && dt.getMonth() === month.getMonth();
  });
  const noneAvailable = state === "done" && monthDays.length > 0 && !monthDays.some((d) => d.status === "available");

  return (
    <div className="grid gap-6 md:grid-cols-[minmax(0,1fr)_14rem]">
      <div className="relative min-w-0 rounded-3xl bg-white p-3 ring-1 ring-line sm:p-5">
        <DayPicker
          mode="single"
          selected={selected ? parseDateOnly(selected) : undefined}
          onSelect={(d) => d && onSelect(toDateOnly(d))}
          month={month}
          onMonthChange={setMonth}
          startMonth={todayDate}
          endMonth={maxDate}
          showOutsideDays={false}
          disabled={(d) => statusOf(d) !== "available"}
          modifiers={{
            available: (d) => statusOf(d) === "available",
            full: (d) => statusOf(d) === "full",
          }}
          modifiersClassNames={{
            available: "[&>button]:bg-brand-50 [&>button]:text-brand-800 [&>button:hover]:bg-brand-100",
            full: "[&>button]:bg-danger-50 [&>button]:!text-danger-700/70 [&>button]:line-through",
          }}
          labels={{
            labelDayButton: (date, modifiers) => {
              const base = new Intl.DateTimeFormat("en-GB", { weekday: "long", day: "numeric", month: "long" }).format(date);
              const st = statusOf(date);
              return `${base}${st ? `, ${STATUS_LABEL[st]}` : ""}${modifiers.selected ? ", selected" : ""}`;
            },
            labelNext: () => "Next month",
            labelPrevious: () => "Previous month",
          }}
          classNames={classNames}
        />
        {state === "loading" && (
          <div className="absolute inset-0 grid place-items-center rounded-3xl bg-white/60" role="status">
            <span className="flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-navy-800 shadow-soft">
              <Loader2 className="size-4 animate-spin text-brand-600" aria-hidden />
              Checking availability…
            </span>
          </div>
        )}
      </div>

      <div className="space-y-4">
        <div className="rounded-3xl bg-muted p-5">
          <h3 className="text-sm font-bold text-navy-800">Key</h3>
          <ul className="mt-3 space-y-2.5 text-sm">
            <li className="flex items-center gap-3">
              <span className="grid size-7 place-items-center rounded-full bg-brand-50 text-xs font-semibold text-brand-800 ring-1 ring-brand-100">12</span>
              Available
            </li>
            <li className="flex items-center gap-3">
              <span className="grid size-7 place-items-center rounded-full bg-danger-50 text-xs font-semibold text-danger-700/70 line-through">12</span>
              Fully booked
            </li>
            <li className="flex items-center gap-3">
              <span className="grid size-7 place-items-center rounded-full text-xs font-semibold text-navy-300 ring-1 ring-line">12</span>
              Closed / unavailable
            </li>
            <li className="flex items-center gap-3">
              <span className="grid size-7 place-items-center rounded-full bg-brand-600 text-xs font-semibold text-white">12</span>
              Selected
            </li>
          </ul>
        </div>
        {state === "error" && (
          <div role="alert" className="rounded-2xl bg-danger-50 p-4 text-sm text-danger-700">
            <p className="flex gap-2">
              <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
              We couldn&apos;t load availability for this month.
            </p>
            <Button
              variant="secondary"
              size="sm"
              className="mt-3"
              onClick={() => {
                setLoadedMonths((m) => {
                  const next = { ...m };
                  delete next[monthKey];
                  return next;
                });
                setRetry((r) => r + 1);
              }}
            >
              Try again
            </Button>
          </div>
        )}
        {noneAvailable && (
          <p className={cn("rounded-2xl bg-warning-50 p-4 text-sm text-warning-700")} role="status">
            No dates are available this month. Try the next month or choose another dentist.
          </p>
        )}
      </div>
    </div>
  );
}
