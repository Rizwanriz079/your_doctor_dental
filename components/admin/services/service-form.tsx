"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Check } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition, type ReactNode } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { ImageUpload } from "@/components/admin/image-upload";
import { Button, ButtonLink } from "@/components/ui/button";
import { Field, Input, Switch, Textarea } from "@/components/ui/field";
import { Avatar, Card } from "@/components/ui/misc";
import { saveService } from "@/features/services/actions";
import { serviceFormSchema, slugify, type ServiceFormValues } from "@/features/services/schema";
import { cn } from "@/lib/utils";

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

export function ServiceForm({
  defaultValues,
  doctors,
  categories,
  currency,
}: {
  defaultValues: ServiceFormValues;
  doctors: { id: string; full_name: string; profile_image_path: string | null; status: string }[];
  categories: string[];
  currency: string;
}) {
  const router = useRouter();
  const [saving, startTransition] = useTransition();
  const isEdit = Boolean(defaultValues.id);
  const {
    register,
    control,
    handleSubmit,
    setError,
    setValue,
    getFieldState,
    formState: { errors },
  } = useForm<ServiceFormValues>({ resolver: zodResolver(serviceFormSchema), defaultValues, mode: "onTouched" });

  const nameField = register("name");

  function onSubmit(values: ServiceFormValues) {
    startTransition(async () => {
      const res = await saveService(values);
      if (res.ok) {
        toast.success(res.message ?? "Saved");
        router.push("/dentaladmincalicut/services");
        router.refresh();
        return;
      }
      if (res.fieldErrors) {
        for (const [k, msgs] of Object.entries(res.fieldErrors)) {
          if (msgs?.[0]) setError(k as keyof ServiceFormValues, { message: msgs[0] });
        }
      }
      toast.error(res.message);
    });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit, () => toast.error("Please fix the highlighted fields."))} noValidate className="flex flex-col gap-6">
      <Section title="Details" description="Shown on the services page and the service detail page.">
        <div className="grid gap-5 md:grid-cols-2">
          <Field label="Service name" required error={errors.name?.message}>
            {({ id, describedBy, invalid }) => (
              <Input
                id={id}
                aria-describedby={describedBy}
                aria-invalid={invalid}
                {...nameField}
                onChange={(e) => {
                  void nameField.onChange(e);
                  if (!isEdit && !getFieldState("slug").isDirty) setValue("slug", slugify(e.target.value));
                }}
              />
            )}
          </Field>
          <Field label="URL slug" required hint="Used in the web address: /services/your-slug" error={errors.slug?.message}>
            {({ id, describedBy, invalid }) => (
              <Input id={id} aria-describedby={describedBy} aria-invalid={invalid} {...register("slug", { setValueAs: (v: string) => slugify(v) || v })} />
            )}
          </Field>
          <Field label="Category" required error={errors.category?.message}>
            {({ id, describedBy, invalid }) => (
              <>
                <Input id={id} list="service-categories" aria-describedby={describedBy} aria-invalid={invalid} {...register("category")} />
                <datalist id="service-categories">
                  {categories.map((c) => (
                    <option key={c} value={c} />
                  ))}
                </datalist>
              </>
            )}
          </Field>
          <Field label="Display order" hint="Lower numbers appear first." error={errors.sort_order?.message}>
            {({ id, describedBy, invalid }) => (
              <Input id={id} type="number" min={0} aria-describedby={describedBy} aria-invalid={invalid} {...register("sort_order", { valueAsNumber: true })} />
            )}
          </Field>
          <Field label="Short summary" className="md:col-span-2" hint="One or two sentences for service cards." error={errors.short_description?.message}>
            {({ id, describedBy, invalid }) => (
              <Textarea id={id} rows={2} aria-describedby={describedBy} aria-invalid={invalid} {...register("short_description")} />
            )}
          </Field>
          <Field label="Description" className="md:col-span-2" error={errors.description?.message}>
            {({ id, describedBy, invalid }) => (
              <Textarea id={id} rows={5} aria-describedby={describedBy} aria-invalid={invalid} {...register("description")} />
            )}
          </Field>
          <Field
            label="What the treatment involves"
            className="md:col-span-2"
            hint="Describe the steps. Do not promise outcomes or give a diagnosis."
            error={errors.procedure_details?.message}
          >
            {({ id, describedBy, invalid }) => (
              <Textarea id={id} rows={4} aria-describedby={describedBy} aria-invalid={invalid} {...register("procedure_details")} />
            )}
          </Field>
        </div>
        <div className="mt-6">
          <p className="mb-2 text-sm font-semibold text-navy-800">Image</p>
          <Controller
            control={control}
            name="image_path"
            render={({ field }) => <ImageUpload value={field.value} onChange={field.onChange} folder="services" aspect="aspect-[4/3]" />}
          />
        </div>
      </Section>

      <Section title="Booking & price">
        <div className="grid gap-5 md:grid-cols-2">
          <Field
            label="Appointment length (minutes)"
            hint="Leave blank to use each doctor's default length."
            error={errors.duration_minutes?.message}
          >
            {({ id, describedBy, invalid }) => (
              <Input
                id={id}
                type="number"
                min={5}
                max={480}
                step={5}
                aria-describedby={describedBy}
                aria-invalid={invalid}
                {...register("duration_minutes", { setValueAs: toNumberOrNull })}
              />
            )}
          </Field>
          <Field label={`Price (${currency})`} hint="Optional. Leave blank to show “Contact the clinic”." error={errors.price?.message}>
            {({ id, describedBy, invalid }) => (
              <Input
                id={id}
                type="number"
                min={0}
                step="0.01"
                aria-describedby={describedBy}
                aria-invalid={invalid}
                {...register("price", { setValueAs: toNumberOrNull })}
              />
            )}
          </Field>
        </div>
        <div className="mt-6 grid gap-5 md:grid-cols-3">
          <Controller
            control={control}
            name="show_price"
            render={({ field }) => <Switch checked={field.value} onChange={field.onChange} label="Show price publicly" />}
          />
          <Controller
            control={control}
            name="is_active"
            render={({ field }) => (
              <Switch checked={field.value} onChange={field.onChange} label="Active" description="Inactive services cannot be booked." />
            )}
          />
          <Controller
            control={control}
            name="is_featured"
            render={({ field }) => <Switch checked={field.value} onChange={field.onChange} label="Feature on homepage" />}
          />
        </div>
      </Section>

      <Section title="Doctors" description="Patients choosing this service can book any of the selected doctors.">
        <Controller
          control={control}
          name="doctor_ids"
          render={({ field }) =>
            doctors.length === 0 ? (
              <p className="text-sm text-body">No doctors yet. You can assign doctors later.</p>
            ) : (
              <fieldset className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                <legend className="sr-only">Assigned doctors</legend>
                {doctors.map((d) => {
                  const checked = field.value.includes(d.id);
                  return (
                    <label
                      key={d.id}
                      className={cn(
                        "flex cursor-pointer items-center gap-3 rounded-xl border p-2.5 transition-colors focus-within:ring-2 focus-within:ring-brand-400",
                        checked ? "border-brand-300 bg-brand-50/60" : "border-line hover:bg-muted",
                      )}
                    >
                      <input
                        type="checkbox"
                        className="sr-only"
                        checked={checked}
                        onChange={() => field.onChange(checked ? field.value.filter((x) => x !== d.id) : [...field.value, d.id])}
                      />
                      <Avatar name={d.full_name} path={d.profile_image_path} size={36} />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-semibold text-navy-800">{d.full_name}</span>
                        {d.status !== "active" && <span className="text-xs text-body">Inactive</span>}
                      </span>
                      <span
                        aria-hidden
                        className={cn(
                          "grid size-5 place-items-center rounded-md border",
                          checked ? "border-brand-600 bg-brand-600 text-white" : "border-navy-300",
                        )}
                      >
                        {checked && <Check className="size-3.5" />}
                      </span>
                    </label>
                  );
                })}
              </fieldset>
            )
          }
        />
      </Section>

      <div className="sticky bottom-3 z-20 rounded-2xl border border-line bg-white/90 shadow-lift backdrop-blur-md">
        <div className="flex items-center justify-end gap-2 px-4 py-3">
          <ButtonLink href="/dentaladmincalicut/services" variant="secondary">
            Cancel
          </ButtonLink>
          <Button type="submit" variant="navy" loading={saving}>
            {isEdit ? "Save changes" : "Create service"}
          </Button>
        </div>
      </div>
    </form>
  );
}
