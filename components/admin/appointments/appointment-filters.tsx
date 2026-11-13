"use client";

import { CalendarDays, Filter, RotateCcw, Search, Stethoscope, Tag, ArrowUpDown } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState, useTransition, type ReactNode } from "react";
import { APPOINTMENT_STATUSES } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type Option = { id: string; name: string; archived?: boolean };

const RANGES = [
  { value: "upcoming", label: "Upcoming" },
  { value: "today", label: "Today" },
  { value: "tomorrow", label: "Tomorrow" },
  { value: "week", label: "This week" },
  { value: "custom", label: "Custom" },
  { value: "all", label: "All" },
] as const;

function PillSelect({
  icon,
  label,
  value,
  onChange,
  children,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  onChange: (v: string) => void;
  children: ReactNode;
}) {
  return (
    <label className="relative flex h-10 min-w-0 items-center gap-2 rounded-xl bg-white pl-3 pr-2 text-sm text-navy-800 ring-1 ring-line transition-shadow focus-within:ring-2 focus-within:ring-brand-300">
      <span className="text-body" aria-hidden>
        {icon}
      </span>
      <span className="sr-only">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-full min-w-0 max-w-[11rem] flex-1 cursor-pointer appearance-none bg-transparent pr-1 font-medium focus:outline-none"
      >
        {children}
      </select>
    </label>
  );
}

export function AppointmentFilters({ doctors, services }: { doctors: Option[]; services: Option[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [pending, startTransition] = useTransition();
  const [q, setQ] = useState(params.get("q") ?? "");
  const firstRender = useRef(true);

  const range = params.get("range") ?? "upcoming";

  function update(patch: Record<string, string | null>) {
    const next = new URLSearchParams(params.toString());
    Object.entries(patch).forEach(([k, v]) => (v ? next.set(k, v) : next.delete(k)));
    next.delete("page");
    startTransition(() => router.replace(`${pathname}?${next.toString()}`, { scroll: false }));
  }

  // Debounced search
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    const t = window.setTimeout(() => {
      if ((params.get("q") ?? "") !== q.trim()) update({ q: q.trim() || null });
    }, 350);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  const hasFilters = ["q", "doctor", "service", "status", "from", "to", "sort"].some((k) => params.get(k)) || range !== "upcoming";

  return (
    <div className="space-y-3" aria-busy={pending}>
      <div role="group" aria-label="Date range" className="-mx-1 flex gap-1 relative overflow-x-auto px-1 pb-1">
        {RANGES.map((r) => (
          <button
            key={r.value}
            type="button"
            onClick={() => update({ range: r.value === "upcoming" ? null : r.value, ...(r.value !== "custom" ? { from: null, to: null } : {}) })}
            aria-pressed={range === r.value}
            className={cn(
              "h-9 shrink-0 rounded-full px-4 text-sm font-semibold transition-colors duration-200",
              range === r.value ? "bg-navy-800 text-white" : "bg-white text-navy-700 ring-1 ring-line hover:bg-muted",
            )}
          >
            {r.label}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-2 lg:flex-row lg:flex-wrap lg:items-center">
        <label className="relative flex h-10 min-w-0 flex-1 items-center rounded-xl bg-white ring-1 ring-line focus-within:ring-2 focus-within:ring-brand-300 lg:max-w-sm">
          <Search className="pointer-events-none absolute left-3 size-4 text-body" aria-hidden />
          <span className="sr-only">Search appointments</span>
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search patient, phone or reference"
            className="h-full w-full min-w-0 bg-transparent pl-9 pr-3 text-sm text-navy-900 placeholder:text-navy-300 focus:outline-none"
          />
        </label>

        <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
          <PillSelect icon={<Stethoscope className="size-4" />} label="Doctor" value={params.get("doctor") ?? ""} onChange={(v) => update({ doctor: v || null })}>
            <option value="">All doctors</option>
            {doctors.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
                {d.archived ? " (archived)" : ""}
              </option>
            ))}
          </PillSelect>
          <PillSelect icon={<Tag className="size-4" />} label="Service" value={params.get("service") ?? ""} onChange={(v) => update({ service: v || null })}>
            <option value="">All services</option>
            {services.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </PillSelect>
          <PillSelect icon={<Filter className="size-4" />} label="Status" value={params.get("status") ?? ""} onChange={(v) => update({ status: v || null })}>
            <option value="">All statuses</option>
            {APPOINTMENT_STATUSES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </PillSelect>
          <PillSelect icon={<ArrowUpDown className="size-4" />} label="Sort" value={params.get("sort") ?? "date"} onChange={(v) => update({ sort: v === "date" ? null : v })}>
            <option value="date">Appointment date</option>
            <option value="created">Newest booked</option>
          </PillSelect>
        </div>

        {hasFilters && (
          <button
            type="button"
            onClick={() => {
              setQ("");
              startTransition(() => router.replace(pathname, { scroll: false }));
            }}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl px-3 text-sm font-semibold text-brand-700 transition-colors hover:bg-brand-50"
          >
            <RotateCcw className="size-4" aria-hidden />
            Clear filters
          </button>
        )}
      </div>

      {range === "custom" && (
        <div className="flex flex-wrap items-end gap-3">
          {(["from", "to"] as const).map((k) => (
            <label key={k} className="flex flex-col gap-1 text-sm font-semibold text-navy-800">
              {k === "from" ? "From" : "To"}
              <span className="relative flex items-center">
                <CalendarDays className="pointer-events-none absolute left-3 size-4 text-body" aria-hidden />
                <input
                  type="date"
                  value={params.get(k) ?? ""}
                  onChange={(e) => update({ [k]: e.target.value || null, range: "custom" })}
                  className="h-10 rounded-xl bg-white pl-9 pr-3 text-sm font-medium ring-1 ring-line focus:outline-none focus:ring-2 focus:ring-brand-300"
                />
              </span>
            </label>
          ))}
        </div>
      )}
    </div>
  );
}
