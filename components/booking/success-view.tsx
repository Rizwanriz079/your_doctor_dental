"use client";

import { useSafeReducedMotion } from "@/lib/use-reduced-motion";
import Link from "next/link";
import { motion } from "motion/react";
import { CalendarDays, Check, Clock3, Copy, Stethoscope, UserRound } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { StatusBadge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { easeOut } from "@/lib/motion";
import type { BookingResult } from "@/lib/types";
import { formatDate, formatTime } from "@/lib/utils";

type Success = Extract<BookingResult, { ok: true }>;

export function SuccessView({ result }: { result: Success }) {
  const reduce = useSafeReducedMotion();
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(result.reference);
      setCopied(true);
      toast.success("Reference copied");
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Couldn't copy — please note the reference down.");
    }
  }

  return (
    <div className="mx-auto max-w-2xl text-center">
      <div className="mx-auto grid size-20 place-items-center rounded-full bg-success-50 ring-8 ring-success-50/50">
        <svg viewBox="0 0 52 52" className="size-12" aria-hidden>
          <motion.circle
            cx="26"
            cy="26"
            r="23"
            fill="none"
            stroke="#16865b"
            strokeWidth="3"
            initial={reduce ? false : { pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.5, ease: easeOut }}
          />
          <motion.path
            d="M15 27l7 7 15-16"
            fill="none"
            stroke="#16865b"
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={reduce ? false : { pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.35, ease: easeOut, delay: 0.4 }}
          />
        </svg>
      </div>
      <h2 className="mt-6 text-2xl font-bold sm:text-3xl" tabIndex={-1} data-step-heading>
        Your booking request has been received
      </h2>
      <p className="mx-auto mt-3 max-w-lg">
        Your appointment is <strong>pending</strong> until the clinic confirms it. We&apos;ll contact you by phone
        {" "}or email shortly. You can check its status at any time using your reference.
      </p>

      <div className="mt-8 rounded-3xl bg-white p-6 text-left ring-1 ring-line sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-line pb-5">
          <div className="min-w-0">
            <p className="text-sm text-body">Booking reference</p>
            <p className="font-mono text-2xl font-bold tracking-wider text-navy-800">{result.reference}</p>
          </div>
          <div className="flex items-center gap-3">
            <StatusBadge status={result.status} />
            <button
              type="button"
              onClick={copy}
              className="inline-flex h-11 items-center gap-2 rounded-full px-4 text-sm font-semibold text-navy-800 ring-1 ring-line hover:bg-muted"
            >
              {copied ? <Check className="size-4 text-success-600" aria-hidden /> : <Copy className="size-4" aria-hidden />}
              {copied ? "Copied" : "Copy"}
            </button>
          </div>
        </div>
        <dl className="mt-5 grid gap-4 sm:grid-cols-2">
          {[
            { icon: Stethoscope, label: "Service", value: result.service_name },
            { icon: UserRound, label: "Dentist", value: result.doctor_name },
            { icon: CalendarDays, label: "Date", value: formatDate(result.date) },
            { icon: Clock3, label: "Time", value: `${formatTime(result.start_time)} – ${formatTime(result.end_time)}` },
          ].map(({ icon: Icon, label, value }) => (
            <div key={label} className="flex gap-3">
              <Icon className="mt-0.5 size-5 shrink-0 text-brand-600" aria-hidden />
              <div className="min-w-0">
                <dt className="text-xs font-semibold uppercase tracking-wide text-body">{label}</dt>
                <dd className="font-semibold text-navy-800 break-anywhere">{value}</dd>
              </div>
            </div>
          ))}
        </dl>
      </div>

      <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
        <ButtonLink href={`/my-appointments?ref=${result.reference}`}>Check booking status</ButtonLink>
        <ButtonLink href="/" variant="secondary">
          Back to home
        </ButtonLink>
      </div>
      <p className="mt-6 text-sm">
        Need to make a change?{" "}
        <Link href="/contact" className="font-semibold text-brand-700 hover:underline">
          Contact the clinic
        </Link>
        .
      </p>
    </div>
  );
}
