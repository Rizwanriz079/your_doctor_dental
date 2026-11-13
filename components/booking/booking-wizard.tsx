"use client";

import { useSafeReducedMotion } from "@/lib/use-reduced-motion";
import { AnimatePresence, motion } from "motion/react";
import { AlertTriangle, ArrowRight, CalendarDays, Check, Clock3, Pencil, Stethoscope, UserRound, UserX } from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Avatar, EmptyState } from "@/components/ui/misc";
import { createBooking } from "@/features/booking/actions";
import { duration, easeOut } from "@/lib/motion";
import type { BookingResult } from "@/lib/types";
import { cn, formatDate, formatTime } from "@/lib/utils";
import { DateStep } from "./date-step";
import { DetailsStep } from "./details-step";
import { StepIndicator } from "./step-indicator";
import { SuccessView } from "./success-view";
import { TimeStep } from "./time-step";
import { STEPS, type PatientDetails, type Slot, type StepIndex, type WizardDoctor, type WizardService } from "./types";

type Props = {
  services: WizardService[];
  doctors: WizardDoctor[];
  today: string;
  windowDays: number;
  requireEmail: boolean;
  initialServiceId?: string;
  initialDoctorId?: string;
};

const RETRY_CODES = new Set(["slot_taken", "fully_booked", "no_slots_left", "invalid_slot"]);

function initialState(p: Props) {
  let serviceId = p.services.some((s) => s.id === p.initialServiceId) ? p.initialServiceId! : null;
  const doctor = p.doctors.find((d) => d.id === p.initialDoctorId);
  let doctorId: string | null = doctor?.id ?? null;
  if (doctor && !serviceId) {
    const offered = p.services.filter((s) => doctor.serviceIds.includes(s.id));
    if (offered.length === 1) serviceId = offered[0].id;
  }
  if (doctor && serviceId && !doctor.serviceIds.includes(serviceId)) doctorId = null;
  if (!doctorId && serviceId) {
    const offering = p.doctors.filter((d) => d.serviceIds.includes(serviceId!));
    if (offering.length === 1) doctorId = offering[0].id;
  }
  const step: StepIndex = !serviceId ? 0 : !doctorId ? 1 : 2;
  return { serviceId, doctorId, step };
}

export function BookingWizard(props: Props) {
  const { services, doctors, today, windowDays, requireEmail } = props;
  const reduce = useSafeReducedMotion();
  const [init] = useState(() => initialState(props));
  const [step, setStep] = useState<StepIndex>(init.step);
  const [dir, setDir] = useState(1);
  const [serviceId, setServiceId] = useState<string | null>(init.serviceId);
  const [doctorId, setDoctorId] = useState<string | null>(init.doctorId);
  const [date, setDate] = useState<string | null>(null);
  const [slot, setSlot] = useState<Slot | null>(null);
  const [details, setDetails] = useState<PatientDetails | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [conflict, setConflict] = useState<string | null>(null);
  const [slotsRefresh, setSlotsRefresh] = useState(0);
  const [result, setResult] = useState<Extract<BookingResult, { ok: true }> | null>(null);
  const submitLock = useRef(false);
  const headingRef = useRef<HTMLDivElement>(null);
  const mounted = useRef(false);

  const service = services.find((s) => s.id === serviceId) ?? null;
  const doctor = doctors.find((d) => d.id === doctorId) ?? null;
  const preferredDoctor = doctors.find((d) => d.id === props.initialDoctorId);
  const serviceOptions = preferredDoctor && step === 0 && !serviceId
    ? services.filter((s) => preferredDoctor.serviceIds.includes(s.id))
    : services;
  const doctorOptions = serviceId ? doctors.filter((d) => d.serviceIds.includes(serviceId)) : [];

  // Move focus/scroll to the step heading when the step changes (not on first render).
  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      return;
    }
    const el = headingRef.current;
    if (!el) return;
    const top = el.getBoundingClientRect().top;
    if (top < 80 || top > window.innerHeight * 0.6) {
      el.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
    }
    el.querySelector<HTMLElement>("[data-step-heading]")?.focus({ preventScroll: true });
  }, [step, result, reduce]);

  function go(next: StepIndex) {
    setDir(next > step ? 1 : -1);
    setStep(next);
  }

  function chooseService(id: string) {
    setServiceId(id);
    if (doctorId && !doctors.find((d) => d.id === doctorId)?.serviceIds.includes(id)) setDoctorId(null);
    setDate(null);
    setSlot(null);
    const offering = doctors.filter((d) => d.serviceIds.includes(id));
    const keepDoctor = doctorId && offering.some((d) => d.id === doctorId);
    if (!keepDoctor && offering.length === 1) setDoctorId(offering[0].id);
    go(1);
  }

  function chooseDoctor(id: string) {
    if (id !== doctorId) {
      setDate(null);
      setSlot(null);
    }
    setDoctorId(id);
    go(2);
  }

  async function submit() {
    if (submitLock.current || !service || !doctor || !date || !slot || !details) return;
    submitLock.current = true;
    setSubmitting(true);
    setConflict(null);
    try {
      const res = await createBooking({
        serviceId: service.id,
        doctorId: doctor.id,
        date,
        startTime: slot.start,
        ...details,
      });
      if (res.ok) {
        setResult(res);
        toast.success("Booking request sent");
        return;
      }
      if (RETRY_CODES.has(res.code)) {
        setConflict(res.message);
        setSlot(null);
        setSlotsRefresh((n) => n + 1);
        toast.error("That time is no longer available");
        go(3);
      } else {
        toast.error(res.message);
        setConflict(res.message);
      }
    } catch {
      toast.error("We couldn't send your booking. Please check your connection and try again.");
    } finally {
      submitLock.current = false;
      setSubmitting(false);
    }
  }

  if (services.length === 0) {
    return (
      <EmptyState
        icon={Stethoscope}
        title="Online booking is unavailable right now"
        description="No services are currently open for online booking. Please contact the clinic to arrange your appointment."
      />
    );
  }

  const titles: Record<StepIndex, { title: string; text: string }> = {
    0: { title: "Which service do you need?", text: "Choose the treatment you'd like to book." },
    1: { title: "Choose your dentist", text: service ? `Dentists who offer ${service.name}.` : "" },
    2: { title: "Pick a date", text: doctor ? `Dates when ${doctor.full_name} has availability.` : "" },
    3: { title: "Choose a time", text: "Times are shown in the clinic's local time." },
    4: { title: "Your details", text: "We only ask for what we need to arrange your visit." },
    5: { title: "Review and confirm", text: "Please check everything before sending your request." },
  };

  return (
    <div className="mx-auto max-w-5xl">
      {result ? (
        <div ref={headingRef} className="scroll-mt-24">
          <SuccessView result={result} />
        </div>
      ) : (
        <>
          <StepIndicator current={step} onSelect={go} />
          <div className="overflow-hidden rounded-[2rem] bg-white p-5 shadow-soft ring-1 ring-line sm:p-8">
            <div ref={headingRef} className="mb-6 scroll-mt-24">
              <h2 tabIndex={-1} data-step-heading className="text-xl font-bold outline-none sm:text-2xl">
                {titles[step].title}
              </h2>
              {titles[step].text && <p className="mt-1 text-sm sm:text-base">{titles[step].text}</p>}
            </div>
            <AnimatePresence mode="wait" initial={false} custom={dir}>
              <motion.div
                key={step}
                custom={dir}
                initial={{ opacity: 0, x: dir * 24 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: dir * -24 }}
                transition={{ duration: duration.normal, ease: easeOut }}
                className="min-h-64"
              >
                {step === 0 && (
                  <ul className="grid gap-3 sm:grid-cols-2">
                    {serviceOptions.map((s) => (
                      <li key={s.id} className="min-w-0">
                        <OptionCard selected={s.id === serviceId} onClick={() => chooseService(s.id)}>
                          <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-brand-50 text-brand-600">
                            <Stethoscope className="size-5" aria-hidden />
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block font-bold text-navy-800 break-anywhere">{s.name}</span>
                            <span className="mt-0.5 line-clamp-2 block text-sm text-body">{s.short_description}</span>
                            {s.duration_minutes && (
                              <span className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-navy-700">
                                <Clock3 className="size-3.5" aria-hidden /> About {s.duration_minutes} min
                              </span>
                            )}
                          </span>
                        </OptionCard>
                      </li>
                    ))}
                  </ul>
                )}

                {step === 1 &&
                  (doctorOptions.length > 0 ? (
                    <ul className="grid gap-3 sm:grid-cols-2">
                      {doctorOptions.map((d) => (
                        <li key={d.id} className="min-w-0">
                          <OptionCard selected={d.id === doctorId} onClick={() => chooseDoctor(d.id)}>
                            <Avatar name={d.full_name} path={d.profile_image_path} size={56} className="rounded-2xl" />
                            <span className="min-w-0 flex-1">
                              <span className="block font-bold text-navy-800 break-anywhere">{d.full_name}</span>
                              <span className="block text-sm text-brand-700">{d.specialization}</span>
                              {d.qualification && <span className="block text-sm text-body">{d.qualification}</span>}
                            </span>
                          </OptionCard>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <EmptyState
                      icon={UserX}
                      title="No dentist is taking bookings for this service"
                      description="Please choose another service or contact the clinic."
                      action={<Button variant="secondary" onClick={() => go(0)}>Choose another service</Button>}
                    />
                  ))}

                {step === 2 && service && doctor && (
                  <>
                    <DateStep
                      key={`${doctor.id}-${service.id}`}
                      doctorId={doctor.id}
                      serviceId={service.id}
                      today={today}
                      windowDays={windowDays}
                      selected={date}
                      onSelect={(d) => {
                        if (d !== date) setSlot(null);
                        setDate(d);
                        setConflict(null);
                        go(3);
                      }}
                    />
                    <StepNav onBack={() => go(1)} />
                  </>
                )}

                {step === 3 && service && doctor && date && (
                  <>
                    {conflict && (
                      <p role="alert" className="mb-5 flex gap-3 rounded-2xl bg-warning-50 p-4 text-sm text-warning-700 ring-1 ring-warning-500/25">
                        <AlertTriangle className="mt-0.5 size-5 shrink-0" aria-hidden />
                        <span>
                          {conflict} Available times have been refreshed below — your details are saved.
                        </span>
                      </p>
                    )}
                    <TimeStep
                      doctorId={doctor.id}
                      serviceId={service.id}
                      date={date}
                      selected={slot}
                      onSelect={setSlot}
                      refreshKey={slotsRefresh}
                      onChangeDate={() => go(2)}
                      onChangeDoctor={() => go(1)}
                    />
                    <StepNav
                      onBack={() => go(2)}
                      onNext={() => go(details ? 5 : 4)}
                      nextDisabled={!slot}
                      nextLabel={details ? "Review booking" : "Continue"}
                    />
                  </>
                )}

                {step === 4 && (
                  <DetailsStep
                    defaultValues={details}
                    requireEmail={requireEmail}
                    onBack={() => go(3)}
                    onSubmit={(d) => {
                      setDetails(d);
                      go(5);
                    }}
                  />
                )}

                {step === 5 && service && doctor && date && slot && details && (
                  <div>
                    <dl className="grid gap-3 sm:grid-cols-2">
                      <ReviewItem icon={Stethoscope} label="Service" value={service.name} onEdit={() => go(0)} />
                      <ReviewItem icon={UserRound} label="Dentist" value={doctor.full_name} onEdit={() => go(1)} />
                      <ReviewItem icon={CalendarDays} label="Date" value={formatDate(date)} onEdit={() => go(2)} />
                      <ReviewItem
                        icon={Clock3}
                        label="Time"
                        value={`${formatTime(slot.start)} – ${formatTime(slot.end)}`}
                        onEdit={() => go(3)}
                      />
                      <ReviewItem
                        icon={UserRound}
                        label="Your details"
                        value={
                          <>
                            {details.fullName}
                            <span className="block font-normal text-body">{details.phone}</span>
                            {details.email && <span className="block font-normal text-body break-anywhere">{details.email}</span>}
                          </>
                        }
                        onEdit={() => go(4)}
                        wide
                      />
                    </dl>
                    {details.message && (
                      <p className="mt-3 rounded-2xl bg-muted p-4 text-sm">
                        <span className="font-semibold text-navy-800">Your message: </span>
                        {details.message}
                      </p>
                    )}
                    {conflict && (
                      <p role="alert" className="mt-4 rounded-2xl bg-danger-50 p-4 text-sm text-danger-700">
                        {conflict}
                      </p>
                    )}
                    <p className="mt-5 text-sm">
                      Your request will be <strong>pending</strong> until the clinic confirms it.
                    </p>
                    <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
                      <Button variant="secondary" onClick={() => go(4)} disabled={submitting}>
                        Back
                      </Button>
                      <Button size="lg" onClick={submit} loading={submitting}>
                        {submitting ? "Sending request…" : "Confirm booking"}
                        {!submitting && <Check className="size-4" aria-hidden />}
                      </Button>
                    </div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
          <p className="sr-only" aria-live="polite">
            Step {step + 1} of {STEPS.length}: {STEPS[step]}
          </p>
        </>
      )}
    </div>
  );
}

function OptionCard({ selected, onClick, children }: { selected: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={cn(
        "group relative flex h-full w-full items-start gap-4 rounded-2xl p-4 text-left transition-[box-shadow,background-color,transform] duration-200 active:scale-[0.99]",
        selected ? "bg-brand-50 ring-2 ring-brand-600" : "bg-white ring-1 ring-line hover:bg-muted hover:ring-navy-100",
      )}
    >
      {children}
      <span
        className={cn(
          "grid size-6 shrink-0 place-items-center rounded-full transition-colors",
          selected ? "bg-brand-600 text-white" : "text-navy-300 ring-1 ring-line group-hover:text-brand-600",
        )}
        aria-hidden
      >
        {selected ? <Check className="size-3.5" /> : <ArrowRight className="size-3.5" />}
      </span>
    </button>
  );
}

function StepNav({
  onBack,
  onNext,
  nextDisabled,
  nextLabel = "Continue",
}: {
  onBack: () => void;
  onNext?: () => void;
  nextDisabled?: boolean;
  nextLabel?: string;
}) {
  return (
    <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
      <Button variant="secondary" onClick={onBack}>
        Back
      </Button>
      {onNext && (
        <Button onClick={onNext} disabled={nextDisabled}>
          {nextLabel} <ArrowRight className="size-4" aria-hidden />
        </Button>
      )}
    </div>
  );
}

function ReviewItem({
  icon: Icon,
  label,
  value,
  onEdit,
  wide,
}: {
  icon: typeof Stethoscope;
  label: string;
  value: ReactNode;
  onEdit: () => void;
  wide?: boolean;
}) {
  return (
    <div className={cn("flex gap-3 rounded-2xl bg-muted p-4", wide && "sm:col-span-2")}>
      <Icon className="mt-0.5 size-5 shrink-0 text-brand-600" aria-hidden />
      <div className="min-w-0 flex-1">
        <dt className="text-xs font-semibold uppercase tracking-wide text-body">{label}</dt>
        <dd className="mt-0.5 font-semibold text-navy-800 break-anywhere">{value}</dd>
      </div>
      <button
        type="button"
        onClick={onEdit}
        className="inline-flex h-9 shrink-0 items-center gap-1 self-start rounded-full px-3 text-sm font-semibold text-brand-700 hover:bg-white"
        aria-label={`Edit ${label.toLowerCase()}`}
      >
        <Pencil className="size-3.5" aria-hidden /> Edit
      </button>
    </div>
  );
}
