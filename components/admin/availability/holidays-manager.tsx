"use client";

import { AlertTriangle, CalendarX2, Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Field, Input } from "@/components/ui/field";
import { EmptyState } from "@/components/ui/misc";
import { addHoliday, deleteHoliday, type AvailabilityResult } from "@/features/availability/actions";
import { formatDate, formatTime } from "@/lib/utils";

type Holiday = { id: string; holiday_date: string; name: string };

export function HolidaysManager({ holidays, today }: { holidays: Holiday[]; today: string }) {
  const router = useRouter();
  const [busy, startTransition] = useTransition();
  const [date, setDate] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState<string>();
  const [warning, setWarning] = useState<Extract<AvailabilityResult, { ok: false }> | null>(null);
  const [toDelete, setToDelete] = useState<Holiday | null>(null);

  function add(force = false) {
    setError(undefined);
    startTransition(async () => {
      const res = await addHoliday({ date, name, force });
      if (res.ok) {
        toast.success(res.message ?? "Saved");
        setDate("");
        setName("");
        setWarning(null);
        router.refresh();
      } else if (res.code === "impact") {
        setWarning(res);
      } else {
        setError(res.message);
      }
    });
  }

  function remove() {
    if (!toDelete) return;
    startTransition(async () => {
      const res = await deleteHoliday(toDelete.id);
      setToDelete(null);
      if (res.ok) {
        toast.success(res.message ?? "Removed");
        router.refresh();
      } else toast.error(res.message);
    });
  }

  return (
    <div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          add();
        }}
        className="grid gap-3 sm:grid-cols-[11rem_1fr_auto] sm:items-end"
      >
        <Field label="Date">
          {({ id }) => <Input id={id} type="date" min={today} required value={date} onChange={(e) => setDate(e.target.value)} />}
        </Field>
        <Field label="Name" error={error}>
          {({ id, describedBy, invalid }) => (
            <Input
              id={id}
              required
              maxLength={120}
              aria-describedby={describedBy}
              aria-invalid={invalid}
              placeholder="e.g. National Day"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          )}
        </Field>
        <Button type="submit" variant="navy" loading={busy && !warning} className={error ? "sm:mb-7" : undefined}>
          <Plus className="size-4" aria-hidden />
          Add closure
        </Button>
      </form>

      {warning && (
        <div role="alert" className="mt-4 rounded-2xl border border-warning-500/40 bg-warning-50 p-4 text-sm">
          <p className="flex items-start gap-2 font-semibold text-warning-700">
            <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden />
            {warning.message}
          </p>
          <ul className="mt-2 max-h-48 overflow-y-auto">
            {warning.affected?.map((a) => (
              <li key={a.id} className="flex justify-between gap-2 py-1">
                <span className="font-semibold text-navy-800">{a.reference}</span>
                <span>{a.patient_name}</span>
                <span className="text-body">{formatTime(a.start_time)}</span>
              </li>
            ))}
          </ul>
          <div className="mt-3 flex justify-end gap-2">
            <Button size="sm" variant="secondary" onClick={() => setWarning(null)}>
              Go back
            </Button>
            <Button size="sm" variant="danger" loading={busy} onClick={() => add(true)}>
              Close clinic anyway
            </Button>
          </div>
        </div>
      )}

      {holidays.length === 0 ? (
        <EmptyState icon={CalendarX2} title="No upcoming clinic closures" description="Closures block bookings for every doctor on that date." className="py-8" />
      ) : (
        <ul className="mt-5 divide-y divide-line rounded-2xl border border-line">
          {holidays.map((h) => (
            <li key={h.id} className="flex items-center justify-between gap-3 px-4 py-3">
              <div className="min-w-0">
                <p className="font-semibold text-navy-800">{h.name}</p>
                <p className="text-sm text-body">{formatDate(h.holiday_date)}</p>
              </div>
              <button
                type="button"
                onClick={() => setToDelete(h)}
                aria-label={`Remove closure ${h.name}`}
                className="grid size-9 shrink-0 place-items-center rounded-lg text-body transition-colors hover:bg-danger-50 hover:text-danger-700"
              >
                <Trash2 className="size-4" aria-hidden />
              </button>
            </li>
          ))}
        </ul>
      )}

      <ConfirmDialog
        open={Boolean(toDelete)}
        onClose={() => setToDelete(null)}
        onConfirm={remove}
        title="Remove this clinic closure?"
        description={toDelete ? `${toDelete.name} on ${formatDate(toDelete.holiday_date)} will become bookable again where doctors are scheduled.` : undefined}
        confirmLabel="Remove closure"
        tone="danger"
        loading={busy}
      />
    </div>
  );
}
