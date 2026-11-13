"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, CheckCircle2, Eye, EyeOff, MailCheck } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { forwardRef, useState, useTransition, type ComponentProps } from "react";
import { useForm, type FieldValues, type Path, type UseFormSetError } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import {
  registerWithEmail,
  requestPasswordReset,
  signInWithPassword,
  updatePassword,
} from "@/features/account/actions";
import {
  forgotSchema,
  registerSchema,
  resetSchema,
  signInSchema,
  type ForgotInput,
  type RegisterInput,
  type ResetInput,
  type SignInInput,
} from "@/features/account/schema";
import type { ActionResult } from "@/lib/types";

function FormAlert({ tone = "error", children }: { tone?: "error" | "success"; children: React.ReactNode }) {
  const Icon = tone === "error" ? AlertCircle : CheckCircle2;
  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={
        tone === "error"
          ? "flex items-start gap-2 rounded-xl bg-danger-50 px-3.5 py-3 text-sm text-danger-700"
          : "flex items-start gap-2 rounded-xl bg-success-50 px-3.5 py-3 text-sm text-success-700"
      }
    >
      <Icon className="mt-0.5 size-4 shrink-0" aria-hidden />
      <span>{children}</span>
    </div>
  );
}

const PasswordInput = forwardRef<HTMLInputElement, ComponentProps<"input">>(function PasswordInput(props, ref) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <Input ref={ref} type={show ? "text" : "password"} className="pr-11" {...props} />
      <button
        type="button"
        onClick={() => setShow((s) => !s)}
        className="absolute right-1.5 top-1/2 grid size-8 -translate-y-1/2 place-items-center rounded-lg text-body hover:bg-muted hover:text-navy-800"
        aria-label={show ? "Hide password" : "Show password"}
      >
        {show ? <EyeOff className="size-4" aria-hidden /> : <Eye className="size-4" aria-hidden />}
      </button>
    </div>
  );
});

/** Copies server-side field errors onto the form. */
function applyFieldErrors<T extends FieldValues>(res: ActionResult, setError: UseFormSetError<T>) {
  if (res.ok || !res.fieldErrors) return;
  for (const [name, messages] of Object.entries(res.fieldErrors)) {
    if (messages?.[0]) setError(name as Path<T>, { message: messages[0] });
  }
}

export function SignInForm({ next }: { next?: string }) {
  const [pending, start] = useTransition();
  const [error, setFormError] = useState<string>();
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<SignInInput>({ resolver: zodResolver(signInSchema), defaultValues: { email: "", password: "" } });

  const onSubmit = handleSubmit((values) => {
    setFormError(undefined);
    start(async () => {
      const res = await signInWithPassword(values, next); // redirects on success
      if (res && !res.ok) {
        setFormError(res.message);
        applyFieldErrors(res, setError);
      }
    });
  });

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      {error && <FormAlert>{error}</FormAlert>}
      <Field label="Email" error={errors.email?.message} required>
        {({ id, describedBy, invalid }) => (
          <Input id={id} type="email" autoComplete="email" aria-describedby={describedBy} aria-invalid={invalid} {...register("email")} />
        )}
      </Field>
      <Field label="Password" error={errors.password?.message} required>
        {({ id, describedBy, invalid }) => (
          <PasswordInput id={id} autoComplete="current-password" aria-describedby={describedBy} aria-invalid={invalid} {...register("password")} />
        )}
      </Field>
      <div className="flex justify-end">
        <Link href="/forgot-password" className="text-sm font-semibold text-brand-700 hover:underline">
          Forgot password?
        </Link>
      </div>
      <Button type="submit" size="lg" className="w-full" loading={pending}>
        Sign in
      </Button>
    </form>
  );
}

export function RegisterForm({ next }: { next?: string }) {
  const [pending, start] = useTransition();
  const [error, setFormError] = useState<string>();
  const [sentTo, setSentTo] = useState<string>();
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: { fullName: "", email: "", password: "", confirmPassword: "" },
  });

  const onSubmit = handleSubmit((values) => {
    setFormError(undefined);
    start(async () => {
      const res = await registerWithEmail(values, next); // redirects if no confirmation is needed
      if (!res) return;
      if (res.ok) setSentTo(String(values.email));
      else {
        setFormError(res.message);
        applyFieldErrors(res, setError);
      }
    });
  });

  if (sentTo) {
    return (
      <div className="text-center">
        <div className="mx-auto grid size-14 place-items-center rounded-2xl bg-brand-50 text-brand-600">
          <MailCheck className="size-7" aria-hidden />
        </div>
        <h2 className="mt-4 text-lg font-bold">Check your email</h2>
        <p className="mt-2 text-sm text-body">
          We&apos;ve sent a confirmation link to <span className="font-semibold text-navy-800 break-anywhere">{sentTo}</span>. Open it to
          activate your account, then you&apos;ll be signed in automatically.
        </p>
        <p className="mt-4 text-xs text-body">Didn&apos;t get it? Check your spam folder, or try again in a minute.</p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      {error && <FormAlert>{error}</FormAlert>}
      <Field label="Full name" error={errors.fullName?.message} required>
        {({ id, describedBy, invalid }) => (
          <Input id={id} autoComplete="name" aria-describedby={describedBy} aria-invalid={invalid} {...register("fullName")} />
        )}
      </Field>
      <Field label="Email" error={errors.email?.message} required>
        {({ id, describedBy, invalid }) => (
          <Input id={id} type="email" autoComplete="email" aria-describedby={describedBy} aria-invalid={invalid} {...register("email")} />
        )}
      </Field>
      <Field label="Password" error={errors.password?.message} hint="At least 8 characters, with a letter and a number." required>
        {({ id, describedBy, invalid }) => (
          <PasswordInput id={id} autoComplete="new-password" aria-describedby={describedBy} aria-invalid={invalid} {...register("password")} />
        )}
      </Field>
      <Field label="Confirm password" error={errors.confirmPassword?.message} required>
        {({ id, describedBy, invalid }) => (
          <PasswordInput id={id} autoComplete="new-password" aria-describedby={describedBy} aria-invalid={invalid} {...register("confirmPassword")} />
        )}
      </Field>
      <p className="text-xs text-body">
        By creating an account you agree to our{" "}
        <Link href="/privacy" className="font-semibold text-brand-700 hover:underline">
          privacy notice
        </Link>
        .
      </p>
      <Button type="submit" size="lg" className="w-full" loading={pending}>
        Create account
      </Button>
    </form>
  );
}

export function ForgotPasswordForm() {
  const [pending, start] = useTransition();
  const [done, setDone] = useState<string>();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotInput>({ resolver: zodResolver(forgotSchema), defaultValues: { email: "" } });

  const onSubmit = handleSubmit((values) =>
    start(async () => {
      const res = await requestPasswordReset(values);
      if (res.ok) setDone(res.message);
    }),
  );

  if (done) return <FormAlert tone="success">{done}</FormAlert>;
  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      <Field label="Email" error={errors.email?.message} required>
        {({ id, describedBy, invalid }) => (
          <Input id={id} type="email" autoComplete="email" aria-describedby={describedBy} aria-invalid={invalid} {...register("email")} />
        )}
      </Field>
      <Button type="submit" size="lg" className="w-full" loading={pending}>
        Send reset link
      </Button>
    </form>
  );
}

export function ResetPasswordForm() {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setFormError] = useState<string>();
  const [done, setDone] = useState(false);
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<ResetInput>({ resolver: zodResolver(resetSchema), defaultValues: { password: "", confirmPassword: "" } });

  const onSubmit = handleSubmit((values) =>
    start(async () => {
      setFormError(undefined);
      const res = await updatePassword(values);
      if (res.ok) {
        setDone(true);
        window.setTimeout(() => router.push("/my-appointments"), 1500);
      } else {
        setFormError(res.message);
        applyFieldErrors(res, setError);
      }
    }),
  );

  if (done) return <FormAlert tone="success">Your password has been updated. Taking you to your bookings…</FormAlert>;
  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      {error && <FormAlert>{error}</FormAlert>}
      <Field label="New password" error={errors.password?.message} hint="At least 8 characters, with a letter and a number." required>
        {({ id, describedBy, invalid }) => (
          <PasswordInput id={id} autoComplete="new-password" aria-describedby={describedBy} aria-invalid={invalid} {...register("password")} />
        )}
      </Field>
      <Field label="Confirm new password" error={errors.confirmPassword?.message} required>
        {({ id, describedBy, invalid }) => (
          <PasswordInput id={id} autoComplete="new-password" aria-describedby={describedBy} aria-invalid={invalid} {...register("confirmPassword")} />
        )}
      </Field>
      <Button type="submit" size="lg" className="w-full" loading={pending}>
        Save new password
      </Button>
    </form>
  );
}
