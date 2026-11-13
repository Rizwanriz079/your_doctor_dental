"use client";

import { AlertCircle, CopyCheck, Plus, Trash2 } from "lucide-react";
import type { DoctorFormValues } from "@/features/doctors/schema";
import { cn, WEEKDAYS } from "@/lib/utils";

type Week = DoctorFormValues["week"];
type Day = Week[number];
type Session = Day["sessions"][number];
type DayErrors = { sessions?: { message?: string } & Record<number, { start_time?: { message?: string }; end_time?: { message?: string } }> };

// Monday-first display order.
const ORDER = [1, 2, 3, 4, 5, 6, 0];

// Timeline spans 06:00–22:00.
const DAY_START = 6 * 60;
const DAY_END = 22 * 60;

const PRESETS: { label: string; sessions: Session[] }[] = [
  { label: "Full day", sessions: [{ start_time: "09:00", end_time: "13:00" }, { start_time: "14:00", end_time: "18:00" }] },
  { label: "Morning", sessions: [{ start_time: "09:00", end_time: "13:00" }] },
  { label: "Evening", sessions: [{ start_time: "14:00", end_time: "19:00" }] },
];

const toMin = (t: string) => {
  const [h, m] = t.split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
};
const toTime = (min: number) => `${String(Math.floor(min / 60)).padStart(2, "0")}:${String(min % 60).padStart(2, "0")}`;

/** 06:00 → 23:00 in 15-minute steps (plus the current value if it is off-grid). */
const BASE_OPTIONS = Array.from({ length: (23 * 60 - DAY_START) / 15 + 1 }, (_, i) => toTime(DAY_START + i * 15));
function timeOptions(current: string) {
  const v = current.slice(0, 5);
  return BASE_OPTIONS.includes(v) ? BASE_OPTIONS : [...BASE_OPTIONS, v].sort();
}
function label12(t: string) {
  const m = toMin(t);
  const h = Math.floor(m / 60);
  const suffix = h >= 12 ? "PM" : "AM";
  return `${((h + 11) % 12) + 1}:${String(m % 60).padStart(2, "0")} ${suffix}`;
}

function minutesWorked(day: Day) {
  if (!day.enabled) return 0;
  return day.sessions.reduce((sum, s) => sum + Math.max(0, toMin(s.end_time) - toMin(s.start_time)), 0);
}
function formatHours(min: number) {
  if (min === 0) return "0h";
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m ? `${h}h ${m}m` : `${h}h`;
}

const SHORT = ["S", "M", "T", "W", "T", "F", "S"];

const select =
  "h-9 w-full min-w-0 cursor-pointer appearance-none rounded-lg border border-line bg-white bg-[length:14px] bg-[right_0.5rem_center] bg-no-repeat pl-2.5 pr-7 text-sm font-medium text-navy-900 tabular-nums transition-colors hover:border-brand-300 focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-100 aria-[invalid=true]:border-danger-600";
const chevron =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%2352616b' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")";

/** Visual 06:00–22:00 bar: teal blocks are working sessions, gaps are breaks. */
function Timeline({ day }: { day: Day }) {
  return (
    <div className="relative h-2.5 w-full overflow-hidden rounded-full bg-navy-50" aria-hidden>
      {day.enabled &&
        day.sessions.map((s, i) => {
          const a = Math.max(DAY_START, Math.min(DAY_END, toMin(s.start_time)));
          const b = Math.max(DAY_START, Math.min(DAY_END, toMin(s.end_time)));
          if (b <= a) return null;
          return (
            <span
              key={i}
              className="absolute inset-y-0 rounded-full bg-gradient-to-r from-brand-500 to-brand-600"
              style={{ left: `${((a - DAY_START) / (DAY_END - DAY_START)) * 100}%`, width: `${((b - a) / (DAY_END - DAY_START)) * 100}%` }}
            />
          );
        })}
    </div>
  );
}

function Switch({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors duration-200 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-100",
        checked ? "bg-brand-600" : "bg-navy-300",
      )}
    >
      <span className={cn("inline-block size-5 rounded-full bg-white shadow-sm transition-transform duration-200", checked ? "translate-x-5.5" : "translate-x-0.5")} />
    </button>
  );
}

/** Weekly working pattern: each weekday can have several sessions (gaps are breaks). */
export function ScheduleEditor({
  value,
  onChange,
  errors,
  rootError,
}: {
  value: Week;
  onChange: (week: Week) => void;
  errors?: (DayErrors | undefined)[];
  rootError?: string;
}) {
  const get = (weekday: number) => value.find((d) => d.weekday === weekday)!;

  function update(weekday: number, fn: (d: Day) => Day) {
    onChange(value.map((d) => (d.weekday === weekday ? fn(d) : d)));
  }

  function toggle(weekday: number, enabled: boolean) {
    update(weekday, (d) => ({
      ...d,
      enabled,
      sessions: enabled && d.sessions.length === 0 ? PRESETS[0].sessions.map((s) => ({ ...s })) : d.sessions,
    }));
  }

  function copyToWorkingDays(from: number) {
    const src = get(from);
    onChange(value.map((d) => (d.weekday !== from && d.enabled ? { ...d, sessions: src.sessions.map((s) => ({ ...s })) } : d)));
  }

  const totalMin = value.reduce((sum, d) => sum + minutesWorked(d), 0);
  const workingDays = value.filter((d) => d.enabled).length;

  return (
    <div>
      {/* Week strip */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-muted/70 p-3 sm:p-4">
        <div className="flex gap-1.5" role="group" aria-label="Working days">
          {ORDER.map((weekday) => {
            const on = get(weekday).enabled;
            return (
              <button
                key={weekday}
                type="button"
                aria-pressed={on}
                aria-label={`${WEEKDAYS[weekday]}: ${on ? "working" : "day off"}`}
                onClick={() => toggle(weekday, !on)}
                className={cn(
                  "grid size-9 place-items-center rounded-full text-sm font-bold transition-all duration-200 sm:size-10",
                  on ? "bg-brand-600 text-white shadow-sm" : "bg-white text-body ring-1 ring-line hover:ring-brand-300",
                )}
              >
                {SHORT[weekday]}
              </button>
            );
          })}
        </div>
        <p className="text-sm text-body">
          <span className="font-bold text-navy-800">{workingDays}</span> working days ·{" "}
          <span className="font-bold text-navy-800">{formatHours(totalMin)}</span> per week
        </p>
      </div>

      {rootError && (
        <p role="alert" className="mb-3 flex items-center gap-1.5 text-sm text-danger-700">
          <AlertCircle className="size-4" aria-hidden />
          {rootError}
        </p>
      )}

      <ul className="space-y-2.5">
        {ORDER.map((weekday) => {
          const day = get(weekday);
          const err = errors?.[weekday];
          const worked = minutesWorked(day);
          return (
            <li
              key={weekday}
              className={cn(
                "rounded-2xl border p-3 transition-colors sm:p-4",
                day.enabled ? "border-line bg-white" : "border-dashed border-line bg-muted/40",
              )}
            >
              {/* Day header: switch, name, timeline, hours */}
              <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 sm:grid-cols-[auto_7rem_minmax(0,1fr)_4.5rem]">
                <Switch checked={day.enabled} onChange={(v) => toggle(weekday, v)} label={`${WEEKDAYS[weekday]} working`} />
                <span className={cn("font-semibold", day.enabled ? "text-navy-800" : "text-body")}>{WEEKDAYS[weekday]}</span>
                <div className="col-span-3 row-start-2 sm:col-span-1 sm:row-start-auto">
                  {day.enabled ? <Timeline day={day} /> : <p className="text-sm text-body">Day off</p>}
                </div>
                <span className="col-start-3 row-start-1 text-right text-sm font-semibold tabular-nums text-navy-700 sm:col-start-auto sm:row-start-auto">
                  {day.enabled ? formatHours(worked) : "—"}
                </span>
              </div>

              {day.enabled && (
                <div className="mt-3 space-y-2 sm:pl-14">
                  {day.sessions.map((s, i) => {
                    const se = err?.sessions?.[i];
                    const next = day.sessions[i + 1];
                    const breakMin = next ? toMin(next.start_time) - toMin(s.end_time) : 0;
                    return (
                      <div key={i}>
                        <div className="flex items-center gap-2">
                          <span className="w-16 shrink-0 text-xs font-semibold uppercase tracking-wide text-body">Session {i + 1}</span>
                          <div className="grid min-w-0 flex-1 grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2 sm:max-w-xs">
                            {(["start_time", "end_time"] as const).map((key, k) => (
                              <span key={key} className={cn("contents")}>
                                {k === 1 && (
                                  <span className="text-xs text-body" aria-hidden>
                                    to
                                  </span>
                                )}
                                <select
                                  aria-label={`${WEEKDAYS[weekday]} session ${i + 1} ${key === "start_time" ? "start" : "end"}`}
                                  aria-invalid={Boolean(se?.[key])}
                                  className={select}
                                  style={{ backgroundImage: chevron }}
                                  value={s[key].slice(0, 5)}
                                  onChange={(e) =>
                                    update(weekday, (d) => ({
                                      ...d,
                                      sessions: d.sessions.map((x, j) => (j === i ? { ...x, [key]: e.target.value } : x)),
                                    }))
                                  }
                                >
                                  {timeOptions(s[key]).map((t) => (
                                    <option key={t} value={t}>
                                      {label12(t)}
                                    </option>
                                  ))}
                                </select>
                              </span>
                            ))}
                          </div>
                          <button
                            type="button"
                            aria-label={`Remove ${WEEKDAYS[weekday]} session ${i + 1}`}
                            onClick={() =>
                              update(weekday, (d) => {
                                const sessions = d.sessions.filter((_, j) => j !== i);
                                return { ...d, sessions, enabled: sessions.length > 0 };
                              })
                            }
                            className="grid size-9 shrink-0 place-items-center rounded-lg text-body transition-colors hover:bg-danger-50 hover:text-danger-700"
                          >
                            <Trash2 className="size-4" aria-hidden />
                          </button>
                        </div>
                        {(se?.start_time || se?.end_time) && (
                          <p role="alert" className="mt-1 text-sm text-danger-700 sm:pl-[4.5rem]">
                            {se?.start_time?.message ?? se?.end_time?.message}
                          </p>
                        )}
                        {breakMin > 0 && (
                          <p className="mt-2 flex items-center gap-2 text-xs text-body sm:pl-[4.5rem]">
                            <span className="h-px w-6 bg-line" aria-hidden />
                            {formatHours(breakMin)} break
                          </p>
                        )}
                      </div>
                    );
                  })}
                  {err?.sessions?.message && <p className="text-sm text-danger-700">{err.sessions.message}</p>}

                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        const last = day.sessions[day.sessions.length - 1];
                        const start = last ? Math.min(toMin(last.end_time) + 60, 22 * 60) : 9 * 60;
                        const end = Math.min(start + 4 * 60, 23 * 60);
                        update(weekday, (d) => ({ ...d, sessions: [...d.sessions, { start_time: toTime(start), end_time: toTime(end) }] }));
                      }}
                      className="inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-sm font-semibold text-brand-700 ring-1 ring-brand-100 transition-colors hover:bg-brand-50"
                    >
                      <Plus className="size-3.5" aria-hidden />
                      Add session
                    </button>
                    {PRESETS.map((p) => (
                      <button
                        key={p.label}
                        type="button"
                        onClick={() => update(weekday, (d) => ({ ...d, sessions: p.sessions.map((s) => ({ ...s })) }))}
                        className="inline-flex h-8 items-center rounded-full px-3 text-xs font-semibold text-navy-700 ring-1 ring-line transition-colors hover:bg-muted"
                      >
                        {p.label}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => copyToWorkingDays(weekday)}
                      className="ml-auto inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-xs font-semibold text-brand-700 transition-colors hover:bg-brand-50"
                    >
                      <CopyCheck className="size-3.5" aria-hidden />
                      Copy to all working days
                    </button>
                  </div>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
