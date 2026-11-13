"use client";

import { useSafeReducedMotion } from "@/lib/use-reduced-motion";
import { AnimatePresence, motion } from "motion/react";
import { ChevronLeft, ChevronRight, Pause, Play, Quote, Star } from "lucide-react";
import { useEffect, useState } from "react";
import { duration, easeOut } from "@/lib/motion";
import type { Testimonial } from "@/lib/types";
import { cn } from "@/lib/utils";

const AUTOPLAY_MS = 9000;

/** Approved, consented testimonials only. Slow autoplay that stops once the visitor interacts. */
export function Testimonials({ items }: { items: Testimonial[] }) {
  const reduce = useSafeReducedMotion();
  const [index, setIndex] = useState(0);
  const [dir, setDir] = useState(1);
  const [playing, setPlaying] = useState(items.length > 1 && !reduce);
  const [hovered, setHovered] = useState(false);

  useEffect(() => {
    if (!playing || hovered || items.length < 2) return;
    const t = window.setTimeout(() => {
      setDir(1);
      setIndex((i) => (i + 1) % items.length);
    }, AUTOPLAY_MS);
    return () => window.clearTimeout(t);
  }, [playing, hovered, index, items.length]);

  if (items.length === 0) return null;
  const go = (d: number) => {
    setPlaying(false);
    setDir(d);
    setIndex((i) => (i + d + items.length) % items.length);
  };
  const t = items[index];

  return (
    <div
      className="relative mx-auto max-w-3xl"
      role="region"
      aria-roledescription="carousel"
      aria-label="Patient testimonials"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocusCapture={() => setHovered(true)}
      onBlurCapture={() => setHovered(false)}
      onKeyDown={(e) => {
        if (e.key === "ArrowRight") go(1);
        if (e.key === "ArrowLeft") go(-1);
      }}
    >
      <div className="relative min-h-[16rem] overflow-hidden rounded-[2rem] bg-white p-8 shadow-soft ring-1 ring-line sm:p-12">
        <Quote className="absolute right-8 top-8 size-12 text-brand-100" aria-hidden />
        <AnimatePresence mode="wait" custom={dir} initial={false}>
          <motion.figure
            key={t.id}
            custom={dir}
            aria-roledescription="slide"
            aria-label={`${index + 1} of ${items.length}`}
            initial={{ opacity: 0, x: dir * 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: dir * -24 }}
            transition={{ duration: duration.medium, ease: easeOut }}
          >
            {t.rating && (
              <p className="mb-4 flex gap-1 text-warning-500" aria-label={`Rated ${t.rating} out of 5`}>
                {Array.from({ length: 5 }, (_, i) => (
                  <Star key={i} className={cn("size-4", i < t.rating! ? "fill-current" : "opacity-30")} aria-hidden />
                ))}
              </p>
            )}
            <blockquote className="text-lg leading-relaxed text-navy-800 sm:text-xl">&ldquo;{t.content}&rdquo;</blockquote>
            <figcaption className="mt-6 font-semibold text-brand-700">— {t.author_display}</figcaption>
          </motion.figure>
        </AnimatePresence>
      </div>
      {items.length > 1 && (
        <div className="mt-6 flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => go(-1)}
            className="grid size-11 place-items-center rounded-full bg-white text-navy-800 ring-1 ring-line hover:bg-muted"
            aria-label="Previous testimonial"
          >
            <ChevronLeft className="size-5" aria-hidden />
          </button>
          <div className="flex gap-1.5" aria-hidden>
            {items.map((it, i) => (
              <span key={it.id} className={cn("h-1.5 rounded-full transition-all duration-300", i === index ? "w-6 bg-brand-600" : "w-1.5 bg-navy-100")} />
            ))}
          </div>
          <button
            type="button"
            onClick={() => go(1)}
            className="grid size-11 place-items-center rounded-full bg-white text-navy-800 ring-1 ring-line hover:bg-muted"
            aria-label="Next testimonial"
          >
            <ChevronRight className="size-5" aria-hidden />
          </button>
          {!reduce && (
            <button
              type="button"
              onClick={() => setPlaying((p) => !p)}
              className="grid size-11 place-items-center rounded-full text-body hover:bg-muted"
              aria-label={playing ? "Pause automatic rotation" : "Start automatic rotation"}
            >
              {playing ? <Pause className="size-4" aria-hidden /> : <Play className="size-4" aria-hidden />}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
