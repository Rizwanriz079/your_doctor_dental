"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, Check, Database, MailCheck, RefreshCw, ShieldCheck, UserPlus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { createFirstAdmin } from "@/features/setup/actions";
import type { SetupState } from "@/features/setup/queries";
import { cn } from "@/lib/utils";

const schema = z
  .object({
    fullName: z.string().trim().min(2, "Please enter your name.").max(100),
    email: z.email("Please enter a valid email address."),
    password: z
      .string()
      .min(10, "Use at least 10 characters for the admin password.")
      .regex(/[A-Za-z]/, "Include at least one letter.")
      .regex(/\d/, "Include at least one number."),
    confirmPassword: z.string(),
  })
  .refine((v) => v.password === v.confirmPassword, { path: ["confirmPassword"], message: "Passwords don't match." });
type Values = z.infer<typeof schema>;

const STEPS = ["Connect Supabase", "Create admin", "Done"] as const;

function StepBar({ current }: { current: number }) {
  return (
    <ol className="mb-8 grid grid-cols-3 gap-2" aria-label="Setup progress">
      {STEPS.map((label, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <li key={label} className="min-w-0">
            <div className={cn("h-1.5 rounded-full transition-colors duration-300", done || active ? "bg-brand-600" : "bg-navy-100")} />
            <p
              className={cn("mt-2 flex items-center gap-1.5 text-xs font-semibold", active ? "text-navy-800" : done ? "text-brand-700" : "text-body")}
              aria-current={active ? "step" : undefined}
            >
              {done && <Check className="size-3.5 shrink-0" aria-hidden />}
              <span className="truncate">{label}</span>
            </p>
          </li>
        );
      })}
    </ol>
  );
}

function StatusRow({ ok, title, text }: { ok: boolean; title: string; text: string }) {
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-line p-4">
      <span
        className={cn("grid size-8 shrink-0 place-items-center rounded-full", ok ? "bg-success-50 text-success-700" : "bg-warning-50 text-warning-700")}
        aria-hidden
      >
        {ok ? <Check className="size-4" /> : <AlertCircle className="size-4" />}
      </span>
      <div className="min-w-0">
        <p className="font-semibold text-navy-800">{title}</p>
        <p className="mt-0.5 text-sm text-body break-anywhere">{text}</p>
      </div>
    </div>
  );
}

export function SetupWizard({ setup, host }: { setup: SetupState; host: string | null }) {
  const router = useRouter();
  const [checking, startCheck] = useTransition();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string>();
  const [sentTo, setSentTo] = useState<string>();
  const {
    register,
    handleSubmit,
    setError: setFieldError,
    formState: { errors },
  } = useForm<Values>({ resolver: zodResolver(schema), defaultValues: { fullName: "", email: "", password: "", confirmPassword: "" } });

  const connected = setup.state === "needs_admin" || setup.state === "database_missing";
  const step = sentTo ? 2 : setup.state === "needs_admin" ? 1 : 0;

  const onSubmit = handleSubmit((values) => {
    setError(undefined);
    start(async () => {
      const res = await createFirstAdmin(values); // redirects to the dashboard when finished
      if (!res) return;
      if (res.ok && res.message === "check_email") setSentTo(values.email);
      else if (!res.ok) {
        setError(res.message);
        if (res.fieldErrors) {
          for (const [name, msgs] of Object.entries(res.fieldErrors)) {
            if (msgs?.[0]) setFieldError(name as keyof Values, { message: msgs[0] });
          }
        }
        if (res.code === "ready") router.refresh();
      }
    });
  });

  return (
    <div>
      <StepBar current={step} />

      {step === 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-bold">Connect Supabase</h2>
          <StatusRow
            ok={setup.state !== "not_configured"}
            title="Supabase project"
            text={
              setup.state === "not_configured"
                ? "Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY to the website's environment settings, then restart it."
                : setup.state === "unreachable"
                  ? `Can't reach ${host ?? "the project"}: ${setup.detail}`
                  : `Connected to ${host}`
            }
          />
          {setup.state !== "not_configured" && (
            <StatusRow
              ok={connected && setup.state !== "database_missing"}
              title="Clinic database"
              text={
                setup.state === "database_missing"
                  ? "Not installed yet. In Supabase, open SQL Editor → New query, paste the clinic setup SQL and click Run."
                  : setup.state === "unreachable"
                    ? "Waiting for the connection."
                    : "Installed"
              }
            />
          )}
          <Button variant="secondary" className="w-full" loading={checking} onClick={() => startCheck(() => router.refresh())}>
            <RefreshCw className="size-4" aria-hidden /> Check again
          </Button>
        </div>
      )}

      {step === 1 && (
        <>
          <div className="mb-5 space-y-3">
            <StatusRow ok title="Supabase connected" text={`${host} · clinic database installed`} />
          </div>
          <h2 className="flex items-center gap-2 text-lg font-bold">
            <UserPlus className="size-5 text-brand-600" aria-hidden /> Create the super admin
          </h2>
          <p className="mt-1 text-sm text-body">
            This account is created in your project&apos;s <strong>Supabase Auth</strong> and gets full access to the dashboard. You can
            only do this once.
          </p>
          <form onSubmit={onSubmit} className="mt-5 space-y-4" noValidate>
            {error && (
              <div role="alert" className="flex items-start gap-2 rounded-xl bg-danger-50 px-3.5 py-3 text-sm text-danger-700">
                <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
                <span>{error}</span>
              </div>
            )}
            <Field label="Your name" error={errors.fullName?.message} required>
              {({ id, describedBy, invalid }) => (
                <Input id={id} autoComplete="name" aria-describedby={describedBy} aria-invalid={invalid} {...register("fullName")} />
              )}
            </Field>
            <Field label="Admin email" error={errors.email?.message} required>
              {({ id, describedBy, invalid }) => (
                <Input id={id} type="email" autoComplete="email" aria-describedby={describedBy} aria-invalid={invalid} {...register("email")} />
              )}
            </Field>
            <Field label="Password" error={errors.password?.message} hint="At least 10 characters, with a letter and a number." required>
              {({ id, describedBy, invalid }) => (
                <Input id={id} type="password" autoComplete="new-password" aria-describedby={describedBy} aria-invalid={invalid} {...register("password")} />
              )}
            </Field>
            <Field label="Confirm password" error={errors.confirmPassword?.message} required>
              {({ id, describedBy, invalid }) => (
                <Input id={id} type="password" autoComplete="new-password" aria-describedby={describedBy} aria-invalid={invalid} {...register("confirmPassword")} />
              )}
            </Field>
            <Button type="submit" variant="navy" size="lg" className="w-full" loading={pending}>
              <ShieldCheck className="size-4" aria-hidden /> Create super admin
            </Button>
          </form>
        </>
      )}

      {step === 2 && (
        <div className="text-center">
          <div className="mx-auto grid size-14 place-items-center rounded-2xl bg-brand-50 text-brand-600">
            <MailCheck className="size-7" aria-hidden />
          </div>
          <h2 className="mt-4 text-lg font-bold">Confirm your email</h2>
          <p className="mt-2 text-sm text-body">
            Supabase sent a confirmation link to <span className="font-semibold text-navy-800 break-anywhere">{sentTo}</span>. Open it on
            this device to finish setup and go to your dashboard.
          </p>
          <p className="mt-4 flex items-center justify-center gap-2 text-xs text-body">
            <Database className="size-3.5" aria-hidden /> Not arriving? Check spam, or confirm the user in Supabase → Authentication → Users,
            then sign in here again.
          </p>
        </div>
      )}
    </div>
  );
}
