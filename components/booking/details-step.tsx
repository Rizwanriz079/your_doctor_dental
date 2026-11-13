"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useMemo } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Checkbox, Field, FieldError, Input, Textarea } from "@/components/ui/field";
import { patientDetailsSchema } from "@/lib/validation/booking";
import type { PatientDetails } from "./types";

export function DetailsStep({
  defaultValues,
  requireEmail,
  onSubmit,
  onBack,
}: {
  defaultValues: PatientDetails | null;
  requireEmail: boolean;
  onSubmit: (details: PatientDetails) => void;
  onBack: () => void;
}) {
  const schema = useMemo(
    () =>
      requireEmail
        ? patientDetailsSchema.refine((v) => Boolean(v.email), { path: ["email"], message: "Please enter your email address." })
        : patientDetailsSchema,
    [requireEmail],
  );
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    mode: "onTouched",
    defaultValues: {
      fullName: defaultValues?.fullName ?? "",
      phone: defaultValues?.phone ?? "",
      email: defaultValues?.email ?? "",
      message: defaultValues?.message ?? "",
      consent: (defaultValues?.consent ?? false) as true,
    },
  });

  return (
    <form
      noValidate
      onSubmit={handleSubmit((v) =>
        onSubmit({ fullName: v.fullName, phone: v.phone, email: v.email ?? "", message: v.message ?? "", consent: true }),
      )}
      className="space-y-5"
    >
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Full name" required error={errors.fullName?.message} className="sm:col-span-2">
          {({ id, describedBy, invalid }) => (
            <Input id={id} aria-describedby={describedBy} aria-invalid={invalid} autoComplete="name" {...register("fullName")} />
          )}
        </Field>
        <Field label="Phone number" required error={errors.phone?.message} hint="Include your country code, e.g. +91.">
          {({ id, describedBy, invalid }) => (
            <Input
              id={id}
              aria-describedby={describedBy}
              aria-invalid={invalid}
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              placeholder="+91 98765 43210"
              {...register("phone")}
            />
          )}
        </Field>
        <Field
          label={requireEmail ? "Email address" : "Email address (optional)"}
          required={requireEmail}
          error={errors.email?.message}
        >
          {({ id, describedBy, invalid }) => (
            <Input id={id} aria-describedby={describedBy} aria-invalid={invalid} type="email" autoComplete="email" {...register("email")} />
          )}
        </Field>
        <Field
          label="Message (optional)"
          error={errors.message?.message}
          hint="Anything the clinic should know to arrange your visit. Please don't include detailed medical information."
          className="sm:col-span-2"
        >
          {({ id, describedBy, invalid }) => (
            <Textarea id={id} aria-describedby={describedBy} aria-invalid={invalid} rows={3} maxLength={1000} {...register("message")} />
          )}
        </Field>
      </div>
      <div className="rounded-2xl bg-muted p-4">
        <Checkbox
          aria-invalid={Boolean(errors.consent)}
          aria-describedby={errors.consent ? "consent-error" : undefined}
          label={
            <>
              I have read the{" "}
              <Link href="/privacy" target="_blank" className="font-semibold text-brand-700 underline">
                privacy notice
                <span className="sr-only"> (opens in a new tab)</span>
              </Link>{" "}
              and agree to the clinic using my details to arrange this appointment.
            </>
          }
          {...register("consent")}
        />
        <FieldError id="consent-error" message={errors.consent?.message} />
      </div>
      <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-between">
        <Button variant="secondary" onClick={onBack}>
          Back
        </Button>
        <Button type="submit">
          Review booking <ArrowRight className="size-4" aria-hidden />
        </Button>
      </div>
    </form>
  );
}
