"use client";

import { AlertTriangle, RotateCcw } from "lucide-react";
import { Button, ButtonLink } from "@/components/ui/button";

export default function AdminError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center py-20 text-center" role="alert">
      <span className="mb-4 grid size-14 place-items-center rounded-2xl bg-danger-50 text-danger-700">
        <AlertTriangle className="size-6" aria-hidden />
      </span>
      <h1 className="text-xl font-bold">Something went wrong</h1>
      <p className="mt-2 text-sm text-body">
        This page could not be loaded. Your data is safe — please try again, or go back to the dashboard.
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-2">
        <Button onClick={reset}>
          <RotateCcw className="size-4" aria-hidden />
          Try again
        </Button>
        <ButtonLink href="/dentaladmincalicut/dashboard" variant="secondary">
          Dashboard
        </ButtonLink>
      </div>
    </div>
  );
}
