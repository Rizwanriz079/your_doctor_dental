"use client";

import { Copy, Plus, X } from "lucide-react";
import { AlertCircle } from "lucide-react";
import type { DoctorFormValues } from "@/features/doctors/schema";
import { cn, WEEKDAYS } from "@/lib/utils";

type Week = DoctorFormValues["week"];
type DayErrors = { sessions?: { message?: string } & Record<number, { start_time?: { message?: string }; end_time?: { message?: string } }> };

// Monday-first display order.
const ORDER = [1, 2, 3, 4, 5, 6, 0];

const timeInput =
  "h-10 w-full min-w-0 rounded-lg border border-line bg-white px-2.5 text-sm text-navy-900 focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-100 aria-[invalid=true]:border-danger-600";

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
  function update(weekday: number, fn: (d: Week[number]) => Week[number]) {
    onChange(value.map((d) => (d.weekday === weekday ? fn(d) : d)));
  }

  function copyMonday() {
    const mon = value.find((d) => d.weekday === 1)!;
    onChange(
      value.map((d) =>
        d.weekday >= 2 && d.weekday <= 5 ? { ...d, enabled: mon.enabled, sessions: mon.sessions.map((s) => ({ ...s })) } : d,
      ),
    );
  }

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-body">Add a second session to create a break (for example 09:00–13:00 and 14:00–18:00).</p>
        <button
          type="button"
          onClick={copyMonday}
          className="inline-flex h-9 items-center gap-2 rounded-full px-3 text-sm font-semibold text-brand-700 transition-colors hover:bg-brand-50"
        >
          <Copy className="size-4" aria-hidden />
          Copy Monday to Tue–Fri
        </button>
      </div>
      {rootError && (
        <p role="alert" className="mb-3 flex items-center gap-1.5 text-sm text-danger-700">
          <AlertCircle className="size-4" aria-hidden />
          {rootError}
        </p>
      )}
      <ul className="divide-y divide-line overflow-hidden rounded-2xl border border-line">
        {ORDER.map((weekday) => {
          const day = value.find((d) => d.weekday === weekday)!;
          const err = errors?.[weekday];
          return (
            <li key={weekday} className={cn("grid gap-3 p-3 sm:grid-cols-[10rem_1fr] sm:items-start sm:p-4", !day.enabled && "bg-muted/60")}>
              <label className="flex cursor-pointer items-center gap-3 pt-2">
                <input
                  type="checkbox"
                  className="size-5 cursor-pointer accent-brand-600"
                  checked={day.enabled}
                  onChange={(e) =>
                    update(weekday, (d) => ({
                      ...d,
                      enabled: e.target.checked,
                      sessions: e.target.checked && d.sessions.length === 0 ? [{ start_time: "09:00", end_time: "17:00" }] : d.sessions,
                    }))
                  }
                />
                <span className="font-semibold text-navy-800">{WEEKDAYS[weekday]}</span>
              </label>
              {day.enabled ? (
                <div className="flex min-w-0 flex-col gap-2">
                  {day.sessions.map((s, i) => {
                    const se = err?.sessions?.[i];
                    return (
                      <div key={i} className="min-w-0">
                        <div className="flex items-center gap-2">
                          <input
                            type="time"
                            aria-label={`${WEEKDAYS[weekday]} session ${i + 1} start`}
                            aria-invalid={Boolean(se?.start_time)}
                            className={timeInput}
                            value={s.start_time}
                            onChange={(e) =>
                              update(weekday, (d) => ({
                                ...d,
                                sessions: d.sessions.map((x, k) => (k === i ? { ...x, start_time: e.target.value } : x)),
                              }))
                            }
                          />
                          <span className="text-body" aria-hidden>
                            –
                          </span>
                          <input
                            type="time"
                            aria-label={`${WEEKDAYS[weekday]} session ${i + 1} end`}
                            aria-invalid={Boolean(se?.end_time)}
                            className={timeInput}
                            value={s.end_time}
                            onChange={(e) =>
                              update(weekday, (d) => ({
                                ...d,
                                sessions: d.sessions.map((x, k) => (k === i ? { ...x, end_time: e.target.value } : x)),
                              }))
                            }
                          />
                          <button
                            type="button"
                            aria-label={`Remove ${WEEKDAYS[weekday]} session ${i + 1}`}
                            onClick={() =>
                              update(weekday, (d) => {
                                const sessions = d.sessions.filter((_, k) => k !== i);
                                return { ...d, sessions, enabled: sessions.length > 0 };
                              })
                            }
                            className="grid size-9 shrink-0 place-items-center rounded-lg text-body transition-colors hover:bg-danger-50 hover:text-danger-700"
                          >
                            <X className="size-4" aria-hidden />
                          </button>
                        </div>
                        {(se?.start_time || se?.end_time) && (
                          <p role="alert" className="mt-1 text-sm text-danger-700">
                            {se?.start_time?.message ?? se?.end_time?.message}
                          </p>
                        )}
                      </div>
                    );
                  })}
                  {err?.sessions?.message && <p className="text-sm text-danger-700">{err.sessions.message}</p>}
                  <button
                    type="button"
                    onClick={() => {
                      const last = day.sessions[day.sessions.length - 1];
                      const start = last ? last.end_time : "09:00";
                      update(weekday, (d) => ({ ...d, sessions: [...d.sessions, { start_time: start, end_time: start < "17:00" ? "17:00" : "20:00" }] }));
                    }}
                    className="inline-flex h-8 w-fit items-center gap-1.5 rounded-full px-2.5 text-sm font-semibold text-brand-700 transition-colors hover:bg-brand-50"
                  >
                    <Plus className="size-4" aria-hidden />
                    Add session
                  </button>
                </div>
              ) : (
                <p className="pt-2 text-sm text-body">Not working</p>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
