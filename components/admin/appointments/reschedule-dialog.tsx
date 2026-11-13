"use client";

import { AnimatePresence, motion } from "motion/react";
import { CalendarClock, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { DayPicker } from "react-day-picker";
import "react-day-picker/style.css";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Field, Textarea } from "@/components/ui/field";
import { getRescheduleSlots, rescheduleAppointment } from "@/features/appointments/actions";
import { promptWhatsApp } from "./whatsapp-panel";
import type { DayAvailability } from "@/lib/types";
import { cn, formatDate, formatTime, parseDateOnly, toDateOnly } from "@/lib/utils";

const REASONS: Record<string, string> = {
  doctor_unavailable: "This doctor is not currently accepting bookings.",
  service_unavailable: "This service is no longer active.",
  service_not_offered: "The doctor no longer offers this service.",
  date_in_past: "This date is in the past.",
  date_blocked: "The clinic or doctor is closed on this date.",
  not_scheduled: "The doctor is not scheduled to work on this date.",
  fully_booked: "The doctor is fully booked on this date.",
  no_slots_left: "No free times remain on this date.",
};

type AppointmentRef = {
  id: string;
  doctor_id: string;
  service_id: string;
  appointment_date: string;
  start_time: string;
  today: string;
};

type Loaded = { key: string; availability: DayAvailability | null; error: string | null };

export function RescheduleDialog({ open, onClose, appointment }: { open: boolean; onClose: () => void; appointment: AppointmentRef }) {
  const [saving, setSaving] = useState(false);
  return (
    <Dialog
      open={open}
      onClose={onClose}
      busy={saving}
      size="lg"
      title="Reschedule appointment"
      description="Choose a new date and time. The original booking stays unchanged unless the new slot is reserved successfully."
    >
      {/* Mounted only while open, so every opening starts fresh. */}
      <RescheduleBody appointment={appointment} onClose={onClose} saving={saving} setSaving={setSaving} />
    </Dialog>
  );
}

function RescheduleBody({
  appointment,
  onClose,
  saving,
  setSaving,
}: {
  appointment: AppointmentRef;
  onClose: () => void;
  saving: boolean;
  setSaving: (v: boolean) => void;
}) {
  const router = useRouter();
  const [date, setDate] = useState<Date | undefined>(() => parseDateOnly(appointment.appointment_date));
  const [reloadToken, setReloadToken] = useState(0);
  const [loaded, setLoaded] = useState<Loaded | null>(null);
  const [slot, setSlot] = useState<string | null>(null);
  const [reason, setReason] = useState("");

  const dateKey = date ? toDateOnly(date) : null;
  const requestKey = dateKey ? `${dateKey}#${reloadToken}` : null;
  const loading = Boolean(requestKey) && loaded?.key !== requestKey;
  const availability = !loading ? (loaded?.availability ?? null) : null;
  const loadError = !loading ? (loaded?.error ?? null) : null;

  useEffect(() => {
    if (!dateKey || !requestKey) return;
    let cancelled = false;
    getRescheduleSlots({
      doctorId: appointment.doctor_id,
      serviceId: appointment.service_id,
      date: dateKey,
      excludeId: appointment.id,
    }).then((res) => {
      if (cancelled) return;
      setLoaded(res.ok ? { key: requestKey, availability: res.data, error: null } : { key: requestKey, availability: null, error: res.message });
    });
    return () => {
      cancelled = true;
    };
  }, [dateKey, requestKey, appointment.doctor_id, appointment.service_id, appointment.id]);

  async function submit() {
    if (!dateKey || !slot) return;
    setSaving(true);
    const res = await rescheduleAppointment({ id: appointment.id, date: dateKey, startTime: slot, reason });
    setSaving(false);
    if (res.ok) {
      toast.success(res.message ?? "Appointment rescheduled.", {
        description: "Let the patient know their new time on WhatsApp.",
        duration: 12000,
        action: { label: "Send WhatsApp", onClick: () => promptWhatsApp("rescheduled", { date: dateKey, startTime: slot }) },
      });
      onClose();
      router.refresh();
    } else {
      toast.error(res.message);
      if (res.code === "slot_taken" || res.code === "fully_booked" || res.code === "no_slots_left") {
        setSlot(null);
        setReloadToken((t) => t + 1);
      }
    }
  }

  const isCurrent = (start: string) => dateKey === appointment.appointment_date && start === appointment.start_time.slice(0, 5);

  return (
    <>
      <div className="grid gap-6 md:grid-cols-[auto_1fr]">
        <div className="mx-auto md:mx-0">
          <DayPicker
            mode="single"
            selected={date}
            onSelect={(d) => {
              setDate(d);
              setSlot(null);
            }}
            disabled={{ before: parseDateOnly(appointment.today) }}
            defaultMonth={date}
            weekStartsOn={1}
            className="text-sm [--rdp-accent-background-color:var(--color-brand-50)] [--rdp-accent-color:var(--color-brand-600)] [--rdp-day-height:2.5rem] [--rdp-day-width:2.5rem] [--rdp-day_button-height:2.4rem] [--rdp-day_button-width:2.4rem]"
          />
        </div>

        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-navy-800">{dateKey ? formatDate(dateKey) : "Select a date"}</h3>
          {loading ? (
            <div className="flex items-center gap-2 py-8 text-sm text-body" role="status">
              <Loader2 className="size-4 animate-spin" aria-hidden /> Checking availability…
            </div>
          ) : loadError ? (
            <p className="mt-3 rounded-xl bg-danger-50 p-3 text-sm text-danger-700">{loadError}</p>
          ) : availability ? (
            <>
              <p className="mt-1 text-sm text-body">
                {availability.capacity > 0 ? (
                  <>
                    Capacity {availability.capacity} · {availability.booked} booked ·{" "}
                    <span className="font-semibold text-navy-800">{availability.remaining} remaining</span>
                  </>
                ) : (
                  "No capacity on this date."
                )}
              </p>
              {!availability.bookable && availability.reason && (
                <p className="mt-3 rounded-xl bg-warning-50 p-3 text-sm text-warning-700">
                  {REASONS[availability.reason] ?? "This date is not available."}
                </p>
              )}
              {availability.slots.length > 0 && (
                <div role="radiogroup" aria-label="Available times" className="mt-4 grid grid-cols-[repeat(auto-fill,minmax(6.25rem,1fr))] gap-2">
                  {availability.slots.map((s) => {
                    const selected = slot === s.start;
                    const current = isCurrent(s.start);
                    return (
                      <button
                        key={s.start}
                        type="button"
                        role="radio"
                        aria-checked={selected}
                        disabled={!s.available}
                        onClick={() => setSlot(s.start)}
                        className={cn(
                          "relative h-11 rounded-xl text-sm font-semibold ring-1 transition-[background-color,box-shadow,color] duration-200",
                          selected
                            ? "bg-brand-600 text-white ring-brand-600"
                            : s.available
                              ? "bg-white text-navy-800 ring-line hover:bg-brand-50 hover:ring-brand-300"
                              : "cursor-not-allowed bg-muted text-navy-300 line-through ring-transparent",
                        )}
                      >
                        {formatTime(s.start)}
                        {current && <span className="sr-only"> (current time)</span>}
                        {current && !selected && <span className="absolute right-1.5 top-1.5 size-1.5 rounded-full bg-warning-500" aria-hidden />}
                      </button>
                    );
                  })}
                </div>
              )}
              <AnimatePresence>
                {slot && (
                  <motion.p initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mt-3 text-sm text-navy-800">
                    New time: <strong>{formatTime(slot)}</strong>
                  </motion.p>
                )}
              </AnimatePresence>
            </>
          ) : null}

          <Field label="Reason (optional)" className="mt-5">
            {({ id }) => (
              <Textarea
                id={id}
                rows={2}
                value={reason}
                maxLength={500}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g. Patient requested a later time"
              />
            )}
          </Field>
        </div>
      </div>

      <div className="mt-6 flex flex-col-reverse gap-2 border-t border-line pt-4 sm:flex-row sm:justify-end">
        <Button variant="secondary" onClick={onClose} disabled={saving}>
          Cancel
        </Button>
        <Button onClick={submit} loading={saving} disabled={!slot}>
          <CalendarClock className="size-4" aria-hidden />
          Move appointment
        </Button>
      </div>
    </>
  );
}
