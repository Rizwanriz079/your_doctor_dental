"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Save } from "lucide-react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { updatePatientContact } from "@/features/patients/actions";
import { patientContactSchema, type PatientContactInput } from "@/features/patients/schema";

export function PatientForm({ patient }: { patient: { id: string; full_name: string; phone: string; email: string | null } }) {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    setError,
    reset,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<PatientContactInput>({
    resolver: zodResolver(patientContactSchema),
    defaultValues: { id: patient.id, fullName: patient.full_name, phone: patient.phone, email: patient.email ?? "" },
  });

  async function onSubmit(values: PatientContactInput) {
    const res = await updatePatientContact(values);
    if (!res.ok) {
      Object.entries(res.fieldErrors ?? {}).forEach(([k, v]) => {
        if (v?.[0]) setError(k as keyof PatientContactInput, { message: v[0] });
      });
      toast.error(res.message);
      return;
    }
    toast.success(res.message ?? "Saved.");
    reset(values);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
      <input type="hidden" {...register("id")} />
      <Field label="Full name" required error={errors.fullName?.message}>
        {({ id, describedBy, invalid }) => (
          <Input id={id} aria-describedby={describedBy} aria-invalid={invalid} autoComplete="off" {...register("fullName")} />
        )}
      </Field>
      <Field label="Phone" required error={errors.phone?.message} hint="Used to match future online bookings to this patient.">
        {({ id, describedBy, invalid }) => (
          <Input id={id} type="tel" inputMode="tel" aria-describedby={describedBy} aria-invalid={invalid} autoComplete="off" {...register("phone")} />
        )}
      </Field>
      <Field label="Email" error={errors.email?.message}>
        {({ id, describedBy, invalid }) => (
          <Input id={id} type="email" aria-describedby={describedBy} aria-invalid={invalid} autoComplete="off" {...register("email")} />
        )}
      </Field>
      <div className="flex justify-end">
        <Button type="submit" loading={isSubmitting} disabled={!isDirty}>
          <Save className="size-4" aria-hidden />
          Save changes
        </Button>
      </div>
    </form>
  );
}
