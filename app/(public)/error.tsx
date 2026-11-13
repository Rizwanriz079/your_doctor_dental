"use client";

import { RefreshCw, TriangleAlert } from "lucide-react";
import { Button, ButtonLink } from "@/components/ui/button";

export default function PublicError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <section className="container-page grid min-h-[60dvh] place-items-center py-20 text-center">
      <div className="max-w-md">
        <span className="mx-auto grid size-16 place-items-center rounded-2xl bg-warning-50 text-warning-700">
          <TriangleAlert className="size-7" aria-hidden />
        </span>
        <h1 className="mt-6 text-2xl font-bold">Something went wrong</h1>
        <p className="mt-2">We couldn&apos;t load this page. Please try again, or contact the clinic if the problem continues.</p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Button onClick={reset}>
            <RefreshCw className="size-4" aria-hidden /> Try again
          </Button>
          <ButtonLink href="/" variant="secondary">
            Back to home
          </ButtonLink>
        </div>
      </div>
    </section>
  );
}
