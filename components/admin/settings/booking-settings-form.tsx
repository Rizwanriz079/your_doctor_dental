"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useMemo, useTransition } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Switch } from "@/components/ui/field";
import { Card } from "@/components/ui/misc";
import { saveBookingSettings } from "@/features/settings/actions";
import { bookingSettingsSchema, type BookingSettingsValues } from "@/features/settings/schema";

const toNumberOrNull = (v: unknown) => (v === "" || v == null ? null : Number(v));

export function BookingSettingsForm({ defaultValues }: { defaultValues: BookingSettingsValues }) {
  const router = useRouter();
  const [saving, startTransition] = useTransition();
  const zones = useMemo(() => {
    try {
      const list = Intl.supportedValuesOf("timeZone");
      return list.includes(defaultValues.timezone) ? list : [defaultValues.timezone, ...list];
    } catch {
      return [defaultValues.timezone];
    }
  }, [defaultValues.timezone]);

  const {
    register,
    control,
    handleSubmit,
    setError,
    formState: { errors, isDirty },
    reset,
  } = useForm<BookingSettingsValues>({ resolver: zodResolver(bookingSettingsSchema), defaultValues });

  function onSubmit(values: BookingSettingsValues) {
    startTransition(async () => {
      const res = await saveBookingSettings(values);
      if (res.ok) {
        toast.success(res.message ?? "Saved");
        reset(values);
        router.refresh();
        return;
      }
      if (res.fieldErrors) {
        for (const [k, msgs] of Object.entries(res.fieldErrors)) {
          if (msgs?.[0]) setError(k as keyof BookingSettingsValues, { message: msgs[0] });
        }
      }
      toast.error(res.message);
    });
  }

  return (
    <Card className="p-5 sm:p-6">
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <h2 className="text-lg font-bold text-navy-800">Booking rules</h2>
        <p className="mt-0.5 text-sm text-body">These rules are enforced by the database for every booking.</p>
        <div className="mt-5 grid gap-5 md:grid-cols-2">
          <Field label="Clinic time zone" hint="Used for “today”, minimum notice and booking windows." error={errors.timezone?.message}>
            {({ id, describedBy, invalid }) => (
              <Select id={id} aria-describedby={describedBy} aria-invalid={invalid} {...register("timezone")}>
                {zones.map((z) => (
                  <option key={z} value={z}>
                    {z.replaceAll("_", " ")}
                  </option>
                ))}
              </Select>
            )}
          </Field>
          <Field label="Currency" hint="3-letter code used for service prices." error={errors.currency?.message}>
            {({ id, describedBy, invalid }) => (
              <Input id={id} maxLength={3} className="uppercase" aria-describedby={describedBy} aria-invalid={invalid} {...register("currency")} />
            )}
          </Field>
          <Field label="Booking window (days)" hint="How far ahead patients can book." error={errors.booking_window_days?.message}>
            {({ id, describedBy, invalid }) => (
              <Input id={id} type="number" min={1} max={365} aria-describedby={describedBy} aria-invalid={invalid} {...register("booking_window_days", { valueAsNumber: true })} />
            )}
          </Field>
          <Field label="Minimum notice (minutes)" hint="e.g. 60 = patients cannot book a slot starting within the next hour." error={errors.min_notice_minutes?.message}>
            {({ id, describedBy, invalid }) => (
              <Input id={id} type="number" min={0} max={10080} aria-describedby={describedBy} aria-invalid={invalid} {...register("min_notice_minutes", { valueAsNumber: true })} />
            )}
          </Field>
          <Field
            label="Pending booking expiry (hours)"
            hint="Leave blank to keep pending bookings until staff confirm or reject them. If set, unconfirmed bookings release their slot after this many hours."
            error={errors.pending_expiry_hours?.message}
          >
            {({ id, describedBy, invalid }) => (
              <Input
                id={id}
                type="number"
                min={1}
                max={720}
                placeholder="Never"
                aria-describedby={describedBy}
                aria-invalid={invalid}
                {...register("pending_expiry_hours", { setValueAs: toNumberOrNull })}
              />
            )}
          </Field>
          <Field
            label="Maximum daily limit per doctor"
            hint="Safety cap for any doctor's default or date-specific daily limit."
            error={errors.max_daily_capacity_limit?.message}
          >
            {({ id, describedBy, invalid }) => (
              <Input id={id} type="number" min={1} max={1000} aria-describedby={describedBy} aria-invalid={invalid} {...register("max_daily_capacity_limit", { valueAsNumber: true })} />
            )}
          </Field>
          <div className="md:col-span-2">
            <Controller
              control={control}
              name="require_email"
              render={({ field }) => (
                <Switch
                  checked={field.value}
                  onChange={field.onChange}
                  label="Require an email address when booking"
                  description="When off, email is optional and a phone number is enough."
                />
              )}
            />
          </div>
        </div>
        <div className="mt-6 flex items-center justify-end gap-3 border-t border-line pt-4">
          {isDirty && <span className="text-sm text-warning-700">Unsaved changes</span>}
          <Button type="submit" variant="navy" loading={saving}>
            Save settings
          </Button>
        </div>
      </form>
    </Card>
  );
}
