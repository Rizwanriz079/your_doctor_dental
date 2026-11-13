"use client";

import { AlertCircle, ShieldCheck } from "lucide-react";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { signOut } from "@/features/account/actions";
import { finishFirstAdmin } from "@/features/setup/actions";

export function FinishSetup({ email, signedIn = false }: { email: string; signedIn?: boolean }) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string>();
  return (
    <div className="text-center">
      <div className="mx-auto grid size-14 place-items-center rounded-2xl bg-success-50 text-success-700">
        <ShieldCheck className="size-7" aria-hidden />
      </div>
      <h2 className="mt-4 text-lg font-bold">{signedIn ? "You're signed in" : "Email confirmed"}</h2>
      <p className="mt-2 text-sm text-body">
        Make <span className="font-semibold text-navy-800 break-anywhere">{email}</span> the clinic&apos;s super admin?
      </p>
      {error && (
        <p role="alert" className="mt-4 flex items-start gap-2 rounded-xl bg-danger-50 px-3.5 py-3 text-left text-sm text-danger-700">
          <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
          {error}
        </p>
      )}
      <Button
        variant="navy"
        size="lg"
        className="mt-6 w-full"
        loading={pending}
        onClick={() =>
          start(async () => {
            const res = await finishFirstAdmin(); // redirects to the dashboard on success
            if (res && !res.ok) setError(res.message);
          })
        }
      >
        Finish setup and open dashboard
      </Button>
      {signedIn && (
        <form action={signOut.bind(null, "/admin/setup")} className="mt-3">
          <button type="submit" className="text-sm font-semibold text-brand-700 hover:underline">
            Use a different account
          </button>
        </form>
      )}
    </div>
  );
}
