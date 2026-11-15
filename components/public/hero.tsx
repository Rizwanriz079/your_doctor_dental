"use client";

import Image from "next/image";
import { motion } from "motion/react";
import { ArrowDown, ArrowUpRight, CalendarCheck, ShieldCheck, Sparkles } from "lucide-react";
import { useSafeReducedMotion } from "@/lib/use-reduced-motion";
import { ButtonLink } from "@/components/ui/button";
import { ToothIllustration } from "./tooth-illustration";
import type { Benefit } from "@/lib/types";

type Props = { eyebrow: string; heading: string; text: string; imageUrl: string | null; highlights: Benefit[]; categories: string[] };
export function Hero({ eyebrow, heading, text, imageUrl, highlights, categories }: Props) {
  const reduce = useSafeReducedMotion();
  const enter = (delay: number) => ({initial: {opacity: 0, y: reduce ? 0 : 28}, animate: {opacity: 1, y: 0}, transition: {duration: reduce ? 0 : .75, delay: reduce ? 0 : delay}});
  return <section className="clinic-hero" aria-labelledby="hero-title">
    <div className="container-page clinic-hero-grid">
      <div className="clinic-hero-copy">
        <motion.p {...enter(.05)} className="clinic-kicker"><span />{eyebrow}</motion.p>
        <motion.h1 {...enter(.15)} id="hero-title">{heading}</motion.h1>
        <motion.p {...enter(.25)} className="clinic-hero-description">{text}</motion.p>
        <motion.div {...enter(.35)} className="clinic-hero-actions"><ButtonLink href="/book-appointment" size="lg"><CalendarCheck className="size-5" aria-hidden />Book your visit<ArrowUpRight className="size-4" aria-hidden /></ButtonLink><a href="/services" className="clinic-text-link">Explore treatments <ArrowUpRight className="size-4" aria-hidden /></a></motion.div>
        <motion.div {...enter(.45)} className="clinic-hero-note"><ShieldCheck className="size-5" aria-hidden /><span>Personal care. Clear advice. Confident smiles.</span></motion.div>
      </div>
      <motion.div {...enter(.2)} className="clinic-hero-art">
        <div className="clinic-orbit clinic-orbit-a" aria-hidden /><div className="clinic-orbit clinic-orbit-b" aria-hidden />
        <span className="clinic-art-label">A HEALTHIER SMILE STARTS HERE</span>
        {imageUrl ? <div className="clinic-hero-photo"><Image src={imageUrl} alt="Inside our dental clinic" fill priority sizes="(min-width: 900px) 45vw, 90vw" className="object-cover" /></div> : <div className="clinic-tooth"><ToothIllustration className="h-full w-full" /></div>}
        <div className="clinic-art-card"><span className="clinic-art-icon"><Sparkles className="size-5" aria-hidden /></span><div><strong>{highlights[0]?.title || "Thoughtful dentistry"}</strong><p>{highlights[0]?.text || "Care designed around you"}</p></div></div>
        <span className="clinic-art-caption">PRECISION MEETS COMFORT</span>
      </motion.div>
    </div>
    <div className="container-page clinic-hero-bottom"><span>{categories.length ? categories.join("  /  ") : "Preventive / Restorative / Cosmetic"}</span><a href="#care-finder">Find your care <ArrowDown className="size-4" aria-hidden /></a></div>
  </section>;
}
