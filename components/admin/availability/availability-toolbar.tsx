"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Select } from "@/components/ui/field";
import { addDays } from "@/features/availability/date";
import { cn, formatDate } from "@/lib/utils";

export function AvailabilityToolbar({
  doctors,
  doctorId,
  from,
  days,
  today,
}: {
  doctors: { id: string; full_name: string; status: string }[];
  doctorId: string;
  from: string;
  days: number;
  today: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const to = addDays(from, days - 1);

  function go(next: { doctor?: string; from?: string; days?: number }) {
    const qs = new URLSearchParams({
      doctor: next.doctor ?? doctorId,
      from: next.from ?? from,
      days: String(next.days ?? days),
    });
    startTransition(() => router.push(`/dentaladmincalicut/availability?${qs}`, { scroll: false }));
  }

  const navBtn =
    "grid size-10 place-items-center rounded-full bg-white text-navy-800 ring-1 ring-line transition-colors hover:bg-muted disabled:opacity-40";

  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between" aria-busy={pending}>
      <div className="w-full min-w-0 sm:max-w-xs">
        <label htmlFor="availability-doctor" className="mb-1.5 block text-sm font-semibold text-navy-800">
          Doctor
        </label>
        <Select id="availability-doctor" value={doctorId} onChange={(e) => go({ doctor: e.target.value })}>
          {doctors.map((d) => (
            <option key={d.id} value={d.id}>
              {d.full_name}
              {d.status !== "active" ? " (inactive)" : ""}
            </option>
          ))}
        </Select>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <div role="group" aria-label="Range length" className="flex rounded-full bg-white p-1 ring-1 ring-line">
          {[14, 28].map((n) => (
            <button
              key={n}
              type="button"
              aria-pressed={days === n}
              onClick={() => go({ days: n })}
              className={cn(
                "h-8 rounded-full px-3 text-sm font-semibold transition-colors",
                days === n ? "bg-navy-800 text-white" : "text-navy-800 hover:bg-muted",
              )}
            >
              {n} days
            </button>
          ))}
        </div>
        <button type="button" className={navBtn} aria-label="Previous range" onClick={() => go({ from: addDays(from, -days) })}>
          <ChevronLeft className="size-4" aria-hidden />
        </button>
        <button
          type="button"
          onClick={() => go({ from: today })}
          disabled={from === today}
          className="h-10 rounded-full bg-white px-4 text-sm font-semibold text-navy-800 ring-1 ring-line transition-colors hover:bg-muted disabled:opacity-50"
        >
          Today
        </button>
        <button type="button" className={navBtn} aria-label="Next range" onClick={() => go({ from: addDays(from, days) })}>
          <ChevronRight className="size-4" aria-hidden />
        </button>
        <p className="w-full text-sm font-medium text-body sm:w-auto" aria-live="polite">
          {formatDate(from, "short")} – {formatDate(to, "short")}
        </p>
      </div>
    </div>
  );
}
