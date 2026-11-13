"use client";

import { useSafeReducedMotion } from "@/lib/use-reduced-motion";
import { animate, useInView } from "motion/react";
import { useEffect, useRef, useState } from "react";
import type { Stat } from "@/lib/types";

function CountUp({ value, suffix }: { value: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.6 });
  const reduce = useSafeReducedMotion();
  const [display, setDisplay] = useState(reduce ? value : 0);

  useEffect(() => {
    if (!inView || reduce) return;
    const controls = animate(0, value, {
      duration: 1.2,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (v) => setDisplay(Math.round(v)),
    });
    return () => controls.stop();
  }, [inView, reduce, value]);

  return (
    <span ref={ref} className="tabular-nums">
      {/* Screen readers always get the final value. */}
      <span aria-hidden>{(reduce ? value : display).toLocaleString("en")}</span>
      <span className="sr-only">{value.toLocaleString("en")}</span>
      {suffix}
    </span>
  );
}

/** Only rendered when the clinic has entered genuine figures in the admin. */
export function StatsStrip({ stats }: { stats: Stat[] }) {
  if (stats.length === 0) return null;
  return (
    <section aria-label="Clinic at a glance" className="py-10">
      <div className="container-page">
        <dl className="grid grid-cols-2 gap-6 md:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label} className="flex min-w-0 flex-col-reverse text-center md:text-left">
              <dt className="mt-1 text-sm text-body">{s.label}</dt>
              <dd className="text-3xl font-bold tracking-tight text-navy-800 sm:text-4xl">
                <CountUp value={Number(s.value) || 0} suffix={s.suffix} />
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
