"use client";

import { useSafeReducedMotion } from "@/lib/use-reduced-motion";
import { motion } from "motion/react";
import { Check } from "lucide-react";
import { duration, easeOut } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { STEPS, type StepIndex } from "./types";

/** Progress indicator. Completed steps are buttons so patients can go back and edit. */
export function StepIndicator({ current, onSelect }: { current: StepIndex; onSelect: (s: StepIndex) => void }) {
  const reduce = useSafeReducedMotion();
  const progress = (current / (STEPS.length - 1)) * 100;
  return (
    <nav aria-label="Booking progress" className="mb-8">
      <p className="mb-3 text-sm font-semibold text-navy-800 sm:hidden">
        Step {current + 1} of {STEPS.length}: <span className="text-brand-700">{STEPS[current]}</span>
      </p>
      <div className="relative h-1.5 overflow-hidden rounded-full bg-navy-50 sm:hidden" role="progressbar" aria-label="Appointment booking progress" aria-valuemin={1} aria-valuemax={STEPS.length} aria-valuenow={current + 1} aria-valuetext={`Step ${current + 1} of ${STEPS.length}: ${STEPS[current]}`}>
        <motion.div
          className="absolute inset-y-0 left-0 rounded-full bg-brand-600"
          animate={{ width: `${Math.max(progress, 6)}%` }}
          transition={{ duration: reduce ? 0 : duration.medium, ease: easeOut }}
        />
      </div>
      <ol className="hidden items-center sm:flex">
        {STEPS.map((label, i) => {
          const done = i < current;
          const active = i === current;
          return (
            <li key={label} className={cn("flex min-w-0 items-center", i < STEPS.length - 1 && "flex-1")}>
              <button
                type="button"
                disabled={!done}
                onClick={() => onSelect(i as StepIndex)}
                aria-current={active ? "step" : undefined}
                className={cn(
                  "group flex min-h-11 shrink-0 items-center gap-2 rounded-full pr-2 text-sm font-semibold transition-colors",
                  done && "cursor-pointer text-navy-800 hover:text-brand-700",
                  active && "text-navy-800",
                  !done && !active && "cursor-default text-navy-300",
                )}
              >
                <span
                  className={cn(
                    "relative grid size-8 place-items-center rounded-full text-xs transition-colors duration-300",
                    done && "bg-brand-600 text-white",
                    active && "bg-navy-800 text-white",
                    !done && !active && "bg-white text-navy-300 ring-1 ring-line",
                  )}
                >
                  {done ? <Check className="size-4" aria-hidden /> : i + 1}
                  {active && (
                    <motion.span
                      layoutId="step-ring"
                      className="absolute -inset-1 rounded-full ring-2 ring-brand-300"
                      transition={{ duration: reduce ? 0 : duration.normal, ease: easeOut }}
                      aria-hidden
                    />
                  )}
                </span>
                <span className="hidden lg:inline">{label}</span>
                {done && <span className="sr-only">(completed, edit)</span>}
              </button>
              {i < STEPS.length - 1 && (
                <span className="mx-2 h-0.5 flex-1 overflow-hidden rounded-full bg-line" aria-hidden>
                  <motion.span
                    className="block h-full bg-brand-600"
                    initial={false}
                    animate={{ width: done ? "100%" : "0%" }}
                    transition={{ duration: reduce ? 0 : duration.medium, ease: easeOut }}
                  />
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
