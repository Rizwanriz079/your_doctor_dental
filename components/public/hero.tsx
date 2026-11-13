"use client";

import { useSafeReducedMotion } from "@/lib/use-reduced-motion";
import Image from "next/image";
import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { ArrowRight, CalendarCheck, Check } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { duration, easeOut } from "@/lib/motion";
import type { Benefit } from "@/lib/types";
import { cn } from "@/lib/utils";
import { ToothIllustration } from "./tooth-illustration";

type HeroProps = {
  eyebrow: string;
  heading: string;
  text: string;
  imageUrl: string | null;
  highlights: Benefit[];
  categories: string[];
};

// The entrance animation plays once per visit. Returning to Home via client navigation
// shows the hero immediately instead of replaying the fade-in each time.
let heroHasPlayed = false;

export function Hero({ eyebrow, heading, text, imageUrl, highlights, categories }: HeroProps) {
  const reduce = useSafeReducedMotion();
  const [playIntro] = useState(() => !heroHasPlayed);
  useEffect(() => {
    heroHasPlayed = true;
  }, []);
  // Short staggered fade-up. Props are identical on server and client; under reduced motion
  // MotionConfig drops the movement and the text appears almost instantly.
  const up = (delay: number) => ({
    initial: playIntro ? { opacity: 0, y: 20 } : false,
    animate: { opacity: 1, y: 0 },
    transition: reduce ? { duration: 0 } : { duration: duration.slow, ease: easeOut, delay },
  });

  return (
    <section
      className="relative -mt-18 overflow-hidden pt-18"
      aria-labelledby="hero-title"
    >
      {/* soft clinical atmosphere */}
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(120%_80%_at_15%_0%,#dff1f5_0%,#eaf5f8_35%,#f7fbfc_70%,#ffffff_100%)]" aria-hidden />
      <div className="absolute -right-40 top-10 -z-10 size-[34rem] rounded-full bg-brand-200/35 blur-3xl" aria-hidden />
      <div className="absolute -left-40 bottom-0 -z-10 size-[26rem] rounded-full bg-navy-100/50 blur-3xl" aria-hidden />
      <div
        className="absolute inset-0 -z-10 opacity-[0.35] [background-image:linear-gradient(rgb(15_139_141/0.07)_1px,transparent_1px),linear-gradient(90deg,rgb(15_139_141/0.07)_1px,transparent_1px)] [background-size:44px_44px] [mask-image:radial-gradient(70%_60%_at_60%_40%,black,transparent)]"
        aria-hidden
      />

      <div className="container-page grid items-center gap-10 pb-16 pt-10 md:grid-cols-[1.05fr_1fr] md:gap-8 md:pb-20 lg:pt-16">
        <div className="min-w-0">
          <motion.p className="eyebrow inline-flex items-center gap-2 rounded-full bg-white/70 px-3 py-1.5 ring-1 ring-brand-100 backdrop-blur" {...up(0)}>
            <span className="size-1.5 rounded-full bg-brand-500" aria-hidden />
            {eyebrow}
          </motion.p>
          <motion.h1 id="hero-title" className="hero-title mt-5 text-navy-800" {...up(0.08)}>
            {heading}
          </motion.h1>
          <motion.p className="mt-5 max-w-xl text-base leading-relaxed text-body sm:text-lg" {...up(0.18)}>
            {text}
          </motion.p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <motion.div {...up(0.26)}>
              <ButtonLink href="/book-appointment" size="lg" className="w-full sm:w-auto">
                <CalendarCheck className="size-5" aria-hidden />
                Book an Appointment
              </ButtonLink>
            </motion.div>
            <motion.div {...up(0.32)}>
              <ButtonLink href="/services" variant="secondary" size="lg" className="w-full sm:w-auto">
                Explore Our Services
                <ArrowRight className="size-4" aria-hidden />
              </ButtonLink>
            </motion.div>
          </div>
          {categories.length > 0 && (
            <motion.p className="mt-8 text-xs font-semibold uppercase tracking-[0.18em] text-navy-500" {...up(0.4)}>
              {categories.join("  /  ")}
            </motion.p>
          )}
        </div>

        <motion.div
          className="relative mx-auto w-full max-w-[30rem] md:max-w-none"
          initial={playIntro ? { opacity: 0, x: 32 } : false}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: duration.slow, ease: easeOut, delay: 0.15 }}
        >
          {imageUrl ? (
            <div className="relative aspect-[4/5] overflow-hidden rounded-[2rem] shadow-lift ring-1 ring-white/60">
              <Image
                src={imageUrl}
                alt="Inside our dental clinic"
                fill
                priority
                sizes="(min-width: 768px) 45vw, 92vw"
                className="object-cover transition-transform duration-700 ease-out md:hover:scale-[1.03]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-navy-900/25 via-transparent" aria-hidden />
            </div>
          ) : (
            <div className="relative aspect-[12/13]">
              <div className={cn("absolute inset-0", !reduce && "animate-float")}>
                <ToothIllustration className="h-full w-full" />
              </div>
            </div>
          )}

          {highlights.slice(0, 2).map((h, i) => (
            <motion.div
              key={h.title}
              className={cn(
                "absolute flex max-w-[15rem] items-center gap-3 rounded-2xl px-4 py-3 shadow-soft backdrop-blur-md",
                i === 0
                  ? "left-0 top-[58%] bg-white/80 ring-1 ring-white sm:-left-4"
                  : "right-0 top-[14%] bg-navy-800/85 text-white ring-1 ring-white/10 sm:-right-2",
              )}
              initial={playIntro ? { opacity: 0, y: 12 } : false}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: duration.medium, ease: easeOut, delay: 0.55 + i * 0.12 }}
            >
              <span
                className={cn(
                  "grid size-9 shrink-0 place-items-center rounded-full",
                  i === 0 ? "bg-navy-800 text-white" : "bg-white text-navy-800",
                )}
                aria-hidden
              >
                <Check className="size-4" />
              </span>
              <span className="min-w-0">
                <span className={cn("block text-sm font-bold", i === 0 ? "text-navy-800" : "text-white")}>{h.title}</span>
                <span className={cn("block text-xs", i === 0 ? "text-body" : "text-navy-100")}>{h.text}</span>
              </span>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
