"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { AlertTriangle, Check } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition, type ReactNode } from "react";
import { Controller, useForm, type FieldErrors } from "react-hook-form";
import { toast } from "sonner";
import { ImageUpload } from "@/components/admin/image-upload";
import { Button, ButtonLink } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Field, Input, Select, Switch, Textarea } from "@/components/ui/field";
import { Card } from "@/components/ui/misc";
import { saveDoctor } from "@/features/doctors/actions";
import { doctorFormSchema, type DoctorFormValues, type DoctorImpact } from "@/features/doctors/schema";
import { cn, formatDate, formatTime } from "@/lib/utils";
import { ScheduleEditor } from "./schedule-editor";

type ServiceOption = { id: string; name: string; category: string; is_active: boolean };

function Section({ title, description, children }: { title: string; description?: string; children: ReactNode }) {
  return (
    <Card className="p-5 sm:p-6">
      <div className="mb-5">
        <h2 className="text-lg font-bold text-navy-800">{title}</h2>
        {description && <p className="mt-0.5 text-sm text-body">{description}</p>}
      </div>
      {children}
    </Card>
  );
}

const toNumberOrNull = (v: unknown) => (v === "" || v == null ? null : Number(v));

export function DoctorForm({
  defaultValues,
  services,
  specializations,
  capacityLimit,
}: {
  defaultValues: DoctorFormValues;
  services: ServiceOption[];
  specializations: string[];
  capacityLimit: number;
}) {
  const router = useRouter();
  const [saving, startTransition] = useTransition();
  const [impact, setImpact] = useState<DoctorImpact | null>(null);
  const isEdit = Boolean(defaultValues.id);

  const {
    register,
    control,
    handleSubmit,
    setError,
    getValues,
    formState: { errors },
  } = useForm<DoctorFormValues>({
    resolver: zodResolver(doctorFormSchema),
    defaultValues,
    mode: "onTouched",
  });

  function submit(values: DoctorFormValues, acknowledge = false) {
    if (values.default_daily_capacity > capacityLimit) {
      setError("default_daily_capacity", { message: `The system limit is ${capacityLimit} per day.` });
      return;
    }
    startTransition(async () => {
      const res = await saveDoctor(values, acknowledge);
      if (res.ok) {
        setImpact(null);
        toast.success(res.message ?? "Saved");
        router.push(`/dentaladmincalicut/doctors/${res.data.id}`);
        router.refresh();
        return;
      }
      if ("code" in res && res.code === "impact" && "details" in res) {
        setImpact(res.details as DoctorImpact);
        return;
      }
      if ("fieldErrors" in res && res.fieldErrors) {
        for (const [k, msgs] of Object.entries(res.fieldErrors)) {
          if (msgs?.[0]) setError(k as keyof DoctorFormValues, { message: msgs[0] });
        }
      }
      toast.error(res.message);
    });
  }

  function onInvalid(errs: FieldErrors<DoctorFormValues>) {
    toast.error("Please fix the highlighted fields.");
    const first = Object.keys(errs)[0];
    if (first) document.querySelector<HTMLElement>(`[name="${first}"]`)?.focus();
  }

  const weekErrors = errors.week as unknown as { message?: string; root?: { message?: string } } & Record<number, unknown>;

  return (
    <form onSubmit={handleSubmit((v) => submit(v), onInvalid)} noValidate className="flex flex-col gap-6">
      <Section title="Profile" description="Shown on the public doctor profile.">
        <div className="mb-6">
          <p className="mb-2 text-sm font-semibold text-navy-800">Profile photo</p>
          <Controller
            control={control}
            name="profile_image_path"
            render={({ field }) => <ImageUpload value={field.value} onChange={field.onChange} folder="doctors" label="Upload photo" />}
          />
        </div>
        <div className="grid gap-5 md:grid-cols-2">
          <Field label="Full name" required error={errors.full_name?.message}>
            {({ id, describedBy, invalid }) => (
              <Input id={id} aria-describedby={describedBy} aria-invalid={invalid} placeholder="Dr. Jane Doe" {...register("full_name")} />
            )}
          </Field>
          <Field label="Specialization" required error={errors.specialization?.message}>
            {({ id, describedBy, invalid }) => (
              <>
                <Input
                  id={id}
                  list="specializations"
                  aria-describedby={describedBy}
                  aria-invalid={invalid}
                  placeholder="e.g. Orthodontics"
                  {...register("specialization")}
                />
                <datalist id="specializations">
                  {specializations.map((s) => (
                    <option key={s} value={s} />
                  ))}
                </datalist>
              </>
            )}
          </Field>
          <Field label="Qualification" hint="Degrees and certifications supplied by the clinic." error={errors.qualification?.message}>
            {({ id, describedBy, invalid }) => (
              <Input id={id} aria-describedby={describedBy} aria-invalid={invalid} placeholder="BDS, MSc" {...register("qualification")} />
            )}
          </Field>
          <Field label="Experience (years)" error={errors.experience_years?.message}>
            {({ id, describedBy, invalid }) => (
              <Input
                id={id}
                type="number"
                inputMode="numeric"
                min={0}
                max={70}
                aria-describedby={describedBy}
                aria-invalid={invalid}
                {...register("experience_years", { setValueAs: toNumberOrNull })}
              />
            )}
          </Field>
          <Field label="Biography" className="md:col-span-2" error={errors.biography?.message}>
            {({ id, describedBy, invalid }) => (
              <Textarea id={id} rows={5} aria-describedby={describedBy} aria-invalid={invalid} {...register("biography")} />
            )}
          </Field>
        </div>
      </Section>

      <Section title="Services" description="Patients can only book this doctor for the services selected here.">
        <Controller
          control={control}
          name="service_ids"
          render={({ field }) => (
            <fieldset>
              <legend className="sr-only">Assigned services</legend>
              {services.length === 0 ? (
                <p className="text-sm text-body">
                  No services exist yet.{" "}
                  <a href="/dentaladmincalicut/services/new" className="font-semibold text-brand-700 underline">
                    Create a service
                  </a>{" "}
                  first.
                </p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {services.map((s) => {
                    const checked = field.value.includes(s.id);
                    return (
                      <label
                        key={s.id}
                        className={cn(
                          "inline-flex cursor-pointer items-center gap-2 rounded-full px-3.5 py-2 text-sm font-medium ring-1 transition-colors focus-within:ring-2 focus-within:ring-brand-400",
                          checked ? "bg-brand-50 text-brand-800 ring-brand-300" : "bg-white text-navy-800 ring-line hover:bg-muted",
                        )}
                      >
                        <input
                          type="checkbox"
                          className="sr-only"
                          checked={checked}
                          onChange={() =>
                            field.onChange(checked ? field.value.filter((x) => x !== s.id) : [...field.value, s.id])
                          }
                        />
                        <span
                          aria-hidden
                          className={cn(
                            "grid size-4 place-items-center rounded-full border",
                            checked ? "border-brand-600 bg-brand-600 text-white" : "border-navy-300",
                          )}
                        >
                          {checked && <Check className="size-3" />}
                        </span>
                        {s.name}
                        {!s.is_active && <span className="text-xs text-body">(inactive)</span>}
                      </label>
                    );
                  })}
                </div>
              )}
              {errors.service_ids && (
                <p role="alert" className="mt-2 text-sm text-danger-700">
                  {errors.service_ids.message}
                </p>
              )}
            </fieldset>
          )}
        />
      </Section>

      <Section title="Schedule & capacity" description="Weekly working hours and how many appointments this doctor can take per day.">
        <div className="mb-6 grid gap-5 sm:grid-cols-3">
          <Field label="Appointment length (min)" required error={errors.default_appointment_duration_minutes?.message}>
            {({ id, describedBy, invalid }) => (
              <Input
                id={id}
                type="number"
                inputMode="numeric"
                min={5}
                max={240}
                step={5}
                aria-describedby={describedBy}
                aria-invalid={invalid}
                {...register("default_appointment_duration_minutes", { valueAsNumber: true })}
              />
            )}
          </Field>
          <Field label="Buffer between (min)" hint="Gap after each appointment." error={errors.buffer_minutes?.message}>
            {({ id, describedBy, invalid }) => (
              <Input
                id={id}
                type="number"
                inputMode="numeric"
                min={0}
                max={120}
                step={5}
                aria-describedby={describedBy}
                aria-invalid={invalid}
                {...register("buffer_minutes", { valueAsNumber: true })}
              />
            )}
          </Field>
          <Field
            label="Default daily limit"
            required
            hint={`Max appointments per working day (1–${capacityLimit}).`}
            error={errors.default_daily_capacity?.message}
          >
            {({ id, describedBy, invalid }) => (
              <Input
                id={id}
                type="number"
                inputMode="numeric"
                min={1}
                max={capacityLimit}
                aria-describedby={describedBy}
                aria-invalid={invalid}
                {...register("default_daily_capacity", { valueAsNumber: true })}
              />
            )}
          </Field>
        </div>
        <p className="mb-5 rounded-xl bg-sky-soft px-4 py-3 text-sm text-navy-700">
          The default limit applies to every future date that has no date-specific override. Date overrides set on the
          Availability page are never rewritten by changing this value. The daily limit does not allow the same time to be
          booked twice: each appointment still needs its own free slot.
        </p>
        <Controller
          control={control}
          name="week"
          render={({ field }) => (
            <ScheduleEditor
              value={field.value}
              onChange={field.onChange}
              errors={errors.week as never}
              rootError={weekErrors?.message ?? weekErrors?.root?.message}
            />
          )}
        />
      </Section>

      <Section title="Visibility & contact">
        <div className="grid gap-6 md:grid-cols-2">
          <div className="flex flex-col gap-5">
            <Field label="Status">
              {({ id }) => (
                <Select id={id} {...register("status")}>
                  <option value="active">Active: shown on the website</option>
                  <option value="inactive">Inactive: hidden, no new bookings</option>
                </Select>
              )}
            </Field>
            <Controller
              control={control}
              name="accepting_bookings"
              render={({ field }) => (
                <Switch
                  checked={field.value}
                  onChange={field.onChange}
                  label="Accepting new bookings"
                  description="Turn off for temporary unavailability. The profile stays visible."
                />
              )}
            />
            <Controller
              control={control}
              name="show_on_homepage"
              render={({ field }) => (
                <Switch checked={field.value} onChange={field.onChange} label="Show on homepage" description="Feature in “Meet our doctors”." />
              )}
            />
          </div>
          <div className="flex flex-col gap-5">
            <p className="rounded-xl bg-muted px-4 py-3 text-sm text-body">Contact details are for internal use and are not shown publicly.</p>
            <Field label="Phone" error={errors.phone?.message}>
              {({ id, describedBy, invalid }) => (
                <Input id={id} type="tel" autoComplete="off" aria-describedby={describedBy} aria-invalid={invalid} {...register("phone")} />
              )}
            </Field>
            <Field label="Email" error={errors.email?.message}>
              {({ id, describedBy, invalid }) => (
                <Input id={id} type="email" autoComplete="off" aria-describedby={describedBy} aria-invalid={invalid} {...register("email")} />
              )}
            </Field>
          </div>
        </div>
      </Section>

      <div className="sticky bottom-3 z-20 rounded-2xl border border-line bg-white/90 shadow-lift backdrop-blur-md">
        <div className="flex items-center justify-end gap-2 px-4 py-3">
          <ButtonLink href={isEdit ? `/dentaladmincalicut/doctors/${defaultValues.id}` : "/dentaladmincalicut/doctors"} variant="secondary">
            Cancel
          </ButtonLink>
          <Button type="submit" variant="navy" loading={saving}>
            {isEdit ? "Save changes" : "Create doctor"}
          </Button>
        </div>
      </div>

      <Dialog
        open={Boolean(impact)}
        onClose={() => setImpact(null)}
        busy={saving}
        size="lg"
        title="This change affects existing bookings"
        description="Nothing will be changed automatically. Existing appointments keep their date and time; review them afterwards and reschedule or cancel if needed."
        footer={
          <>
            <Button variant="secondary" onClick={() => setImpact(null)} disabled={saving}>
              Go back
            </Button>
            <Button variant="danger" loading={saving} onClick={() => submit(getValues(), true)}>
              Save anyway
            </Button>
          </>
        }
      >
        {impact && (
          <div className="flex flex-col gap-5 text-sm">
            {impact.appointments_outside.length > 0 && (
              <div>
                <h3 className="mb-2 flex items-center gap-2 font-bold text-navy-800">
                  <AlertTriangle className="size-4 text-warning-700" aria-hidden />
                  {impact.appointments_outside.length} appointment(s) fall outside the new working hours
                </h3>
                <ul className="divide-y divide-line rounded-xl border border-line">
                  {impact.appointments_outside.map((a) => (
                    <li key={a.id} className="flex flex-wrap items-center justify-between gap-2 px-3 py-2">
                      <span className="font-semibold text-navy-800">{a.reference}</span>
                      <span>{a.patient_name}</span>
                      <span className="text-body">
                        {formatDate(a.date, "weekday")} · {formatTime(a.start_time)}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {impact.over_capacity_dates.length > 0 && (
              <div>
                <h3 className="mb-2 flex items-center gap-2 font-bold text-navy-800">
                  <AlertTriangle className="size-4 text-warning-700" aria-hidden />
                  {impact.over_capacity_dates.length} date(s) already have more bookings than the new daily limit
                </h3>
                <ul className="divide-y divide-line rounded-xl border border-line">
                  {impact.over_capacity_dates.map((d) => (
                    <li key={d.date} className="flex items-center justify-between px-3 py-2">
                      <span>{formatDate(d.date, "weekday")}</span>
                      <span className="font-semibold text-navy-800">
                        {d.booked} booked · new limit {getValues("default_daily_capacity")}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </Dialog>
    </form>
  );
}
