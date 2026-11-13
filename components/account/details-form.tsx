"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { updateMyDetails } from "@/features/account/actions";
import { profileSchema, type ProfileInput } from "@/features/account/schema";

/** Saved in the Supabase Auth user's metadata; used to pre-fill future bookings. */
export function DetailsForm({ email, fullName, phone }: { email: string; fullName: string; phone: string }) {
  const [pending, start] = useTransition();
  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    reset,
  } = useForm<ProfileInput>({ resolver: zodResolver(profileSchema), defaultValues: { fullName, phone } });

  const onSubmit = handleSubmit((values) =>
    start(async () => {
      const res = await updateMyDetails(values);
      if (res.ok) {
        toast.success(res.message ?? "Saved.");
        reset(values);
      } else toast.error(res.message);
    }),
  );

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      <Field label="Email">{({ id }) => <Input id={id} value={email} disabled readOnly />}</Field>
      <Field label="Full name" error={errors.fullName?.message} required>
        {({ id, describedBy, invalid }) => (
          <Input id={id} autoComplete="name" aria-describedby={describedBy} aria-invalid={invalid} {...register("fullName")} />
        )}
      </Field>
      <Field label="Phone number" error={errors.phone?.message} hint="Used to pre-fill your bookings. Include your country code, e.g. +91.">
        {({ id, describedBy, invalid }) => (
          <Input
            id={id}
            type="tel"
            autoComplete="tel"
            placeholder="+91 98765 43210"
            aria-describedby={describedBy}
            aria-invalid={invalid}
            {...register("phone")}
          />
        )}
      </Field>
      <Button type="submit" variant="navy" className="w-full" loading={pending} disabled={!isDirty}>
        Save details
      </Button>
    </form>
  );
}
