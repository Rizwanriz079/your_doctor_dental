"use client";

import { AnimatePresence, motion } from "motion/react";
import { CalendarDays, Clock3, SearchX, Stethoscope, UserRound } from "lucide-react";
import Link from "next/link";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/badge";
import { Field, Input } from "@/components/ui/field";
import { Card } from "@/components/ui/misc";
import { lookupBooking, type LookupResult } from "@/features/booking/actions";
import { duration, easeOut } from "@/lib/motion";
import { formatDate, formatTime } from "@/lib/utils";

const STATUS_HELP: Record<string, string> = {
  pending: "The clinic has received your request and will confirm it shortly.",
  confirmed: "Your appointment is confirmed. Please arrive a few minutes early.",
  completed: "This appointment has been completed. Thank you for visiting us.",
  rejected: "The clinic was unable to accept this request. Please book another time or contact us.",
  cancelled: "This appointment has been cancelled.",
  expired: "This request expired before it was confirmed. Please book again.",
};

export function LookupForm({ initialReference = "" }: { initialReference?: string }) {
  const [reference, setReference] = useState(initialReference);
  const [phone, setPhone] = useState("");
  const [result, setResult] = useState<LookupResult | null>(null);
  const [pending, startTransition] = useTransition();

  const fieldErrors = result && !result.ok ? result.fieldErrors : undefined;

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,26rem)_1fr]">
      <Card className="p-6 sm:p-8">
        <h2 className="text-lg font-bold">Find your booking</h2>
        <p className="mt-1 text-sm">Enter the reference from your confirmation and the phone number you booked with.</p>
        <form
          className="mt-6 space-y-5"
          noValidate
          onSubmit={(e) => {
            e.preventDefault();
            startTransition(async () => setResult(await lookupBooking({ reference, phone })));
          }}
        >
          <Field label="Booking reference" required error={fieldErrors?.reference?.[0]}>
            {({ id, describedBy, invalid }) => (
              <Input
                id={id}
                aria-describedby={describedBy}
                aria-invalid={invalid}
                value={reference}
                onChange={(e) => setReference(e.target.value.toUpperCase())}
                placeholder="YD-1A2B3C4D"
                autoComplete="off"
                spellCheck={false}
                className="font-mono uppercase tracking-wider"
              />
            )}
          </Field>
          <Field label="Phone number" required error={fieldErrors?.phone?.[0]}>
            {({ id, describedBy, invalid }) => (
              <Input
                id={id}
                aria-describedby={describedBy}
                aria-invalid={invalid}
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 98765 43210"
              />
            )}
          </Field>
          <Button type="submit" className="w-full" size="lg" loading={pending}>
            Check status
          </Button>
        </form>
      </Card>

      <div aria-live="polite" className="min-w-0">
        <AnimatePresence mode="wait">
          {result?.ok ? (
            <motion.div
              key={result.appointment.reference}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: duration.medium, ease: easeOut }}
            >
              <Card className="p-6 sm:p-8">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm text-body">Booking reference</p>
                    <p className="font-mono text-xl font-bold tracking-wider text-navy-800">{result.appointment.reference}</p>
                  </div>
                  <StatusBadge status={result.appointment.status} className="text-sm" />
                </div>
                <p className="mt-4 rounded-2xl bg-sky-soft p-4 text-sm text-navy-700">
                  {STATUS_HELP[result.appointment.status] ?? ""}
                  {result.appointment.status_reason && (
                    <span className="mt-1 block">
                      <span className="font-semibold">Note from the clinic:</span> {result.appointment.status_reason}
                    </span>
                  )}
                </p>
                <dl className="mt-6 grid gap-4 sm:grid-cols-2">
                  {[
                    { icon: Stethoscope, label: "Service", value: result.appointment.service_name },
                    { icon: UserRound, label: "Dentist", value: result.appointment.doctor_name },
                    { icon: CalendarDays, label: "Date", value: formatDate(result.appointment.date) },
                    {
                      icon: Clock3,
                      label: "Time",
                      value: `${formatTime(result.appointment.start_time)} – ${formatTime(result.appointment.end_time)}`,
                    },
                  ].map(({ icon: Icon, label, value }) => (
                    <div key={label} className="flex gap-3 rounded-2xl bg-muted p-4">
                      <Icon className="mt-0.5 size-5 shrink-0 text-brand-600" aria-hidden />
                      <div className="min-w-0">
                        <dt className="text-xs font-semibold uppercase tracking-wide text-body">{label}</dt>
                        <dd className="mt-0.5 font-semibold text-navy-800 break-anywhere">{value}</dd>
                      </div>
                    </div>
                  ))}
                </dl>
                <p className="mt-6 text-sm">
                  Need to change this appointment?{" "}
                  <Link href="/contact" className="font-semibold text-brand-700 hover:underline">
                    Contact the clinic
                  </Link>
                  .
                </p>
              </Card>
            </motion.div>
          ) : result && !result.fieldErrors ? (
            <motion.div key="nf" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <Card className="flex gap-4 p-6 sm:p-8">
                <SearchX className="mt-0.5 size-6 shrink-0 text-warning-700" aria-hidden />
                <p role="alert" className="text-sm leading-relaxed text-navy-800">
                  {result.message}
                </p>
              </Card>
            </motion.div>
          ) : (
            <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div className="grid h-full min-h-60 place-items-center rounded-3xl border border-dashed border-navy-100 p-8 text-center">
                <div>
                  <CalendarDays className="mx-auto size-8 text-brand-600" aria-hidden />
                  <p className="mt-3 font-semibold text-navy-800">Your booking details will appear here.</p>
                  <p className="mt-1 text-sm">
                    Don&apos;t have a booking yet?{" "}
                    <Link href="/book-appointment" className="font-semibold text-brand-700 hover:underline">
                      Book an appointment
                    </Link>
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
