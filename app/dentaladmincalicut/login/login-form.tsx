"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, Eye, EyeOff } from "lucide-react";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { signInAction } from "@/features/auth/actions";

const schema = z.object({
  email: z.email("Enter a valid email address."),
  password: z.string().min(1, "Enter your password."),
});
type Values = z.infer<typeof schema>;

export function LoginForm({ next }: { next?: string }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string>();
  const [show, setShow] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<Values>({ resolver: zodResolver(schema), defaultValues: { email: "", password: "" } });

  const onSubmit = handleSubmit((values) => {
    setError(undefined);
    startTransition(async () => {
      // On success the action redirects; it only returns on failure.
      const result = await signInAction({ ...values, next });
      if (result && !result.ok) setError(result.message);
    });
  });

  return (
    <form onSubmit={onSubmit} className="mt-6 space-y-4" noValidate>
      {error && (
        <div role="alert" className="flex items-start gap-2 rounded-xl bg-danger-50 px-3.5 py-3 text-sm text-danger-700">
          <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
          <span>{error}</span>
        </div>
      )}
      <Field label="Email" error={errors.email?.message} required>
        {({ id, describedBy, invalid }) => (
          <Input
            id={id}
            type="email"
            autoComplete="username"
            aria-describedby={describedBy}
            aria-invalid={invalid}
            {...register("email")}
          />
        )}
      </Field>
      <Field label="Password" error={errors.password?.message} required>
        {({ id, describedBy, invalid }) => (
          <div className="relative">
            <Input
              id={id}
              type={show ? "text" : "password"}
              autoComplete="current-password"
              aria-describedby={describedBy}
              aria-invalid={invalid}
              className="pr-11"
              {...register("password")}
            />
            <button
              type="button"
              onClick={() => setShow((s) => !s)}
              className="absolute right-1.5 top-1/2 grid size-8 -translate-y-1/2 place-items-center rounded-lg text-body hover:bg-muted hover:text-navy-800"
              aria-label={show ? "Hide password" : "Show password"}
            >
              {show ? <EyeOff className="size-4" aria-hidden /> : <Eye className="size-4" aria-hidden />}
            </button>
          </div>
        )}
      </Field>
      <Button type="submit" variant="navy" size="lg" className="w-full" loading={pending}>
        {pending ? "Signing in…" : "Sign in"}
      </Button>
    </form>
  );
}
