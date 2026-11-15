"use client";

import { useId, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { ArrowRight, CalendarCheck, Clock3, Search, Sparkles } from "lucide-react";
import { useSafeReducedMotion } from "@/lib/use-reduced-motion";
import { formatPrice } from "@/lib/utils";
import type { Service } from "@/lib/types";
import { SectionHeading } from "./sections";

type FinderService = Pick<Service, "id" | "name" | "slug" | "category" | "short_description" | "duration_minutes" | "show_price" | "price">;

/** A catalogue explorer, not a diagnosis or treatment recommendation. */
export function CareFinder({ services, currency }: { services: FinderService[]; currency: string }) {
  const [category, setCategory] = useState("All");
  const [query, setQuery] = useState("");
  const reduce = useSafeReducedMotion();
  const id = useId();
  const categories = Array.from(new Set(services.map((s) => s.category))).sort();
  const matches = services.filter((s) => (category === "All" || s.category === category) &&
    `${s.name} ${s.category} ${s.short_description}`.toLowerCase().includes(query.trim().toLowerCase()));
  if (!services.length) return null;
  return (
    <section id="care-finder" className="bg-sky-soft/50 py-18 sm:py-24" aria-labelledby={`${id}-title`}>
      <div className="container-page">
        <SectionHeading id={`${id}-title`} eyebrow="Find your care" title="A little clarity. A confident next step."
          description="Explore our treatments and go straight to booking. Your dentist will help you choose the right care at your consultation." />
        <div className="grid overflow-hidden rounded-[2rem] bg-white shadow-soft ring-1 ring-line lg:grid-cols-[0.8fr_1.2fr]">
          <div className="relative overflow-hidden bg-navy-800 p-6 text-white sm:p-10">
            <Sparkles className="mb-6 size-8 text-brand-200" aria-hidden />
            <h3 className="text-2xl font-bold !text-white">What would you like to explore?</h3>
            <label htmlFor={`${id}-search`} className="mt-6 block text-sm font-semibold text-navy-100">Search treatments</label>
            <div className="relative mt-2">
              <Search className="absolute left-4 top-3.5 size-5 text-brand-200" aria-hidden />
              <input id={`${id}-search`} type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Try cleaning or aligners"
                className="h-12 w-full rounded-xl border border-white/30 bg-white/10 pl-12 pr-4 text-white placeholder:text-navy-100" />
            </div>
            <div role="group" aria-label="Treatment categories" className="mt-5 flex flex-wrap gap-2">
              {["All", ...categories].map((item) => <button key={item} type="button" aria-pressed={category === item} onClick={() => setCategory(item)}
                className={`min-h-11 rounded-full px-4 text-sm font-semibold transition-colors ${category === item ? "bg-white text-navy-800" : "bg-white/10 text-white hover:bg-white/20"}`}>{item}</button>)}
            </div>
            <p className="mt-8 text-sm leading-relaxed text-navy-100">Not sure where to start? <Link href="/contact" className="font-semibold underline underline-offset-4">Talk to our team</Link> before booking.</p>
          </div>
          <div className="p-6 sm:p-10">
            <p className="mb-4 text-sm font-semibold text-brand-700" role="status">{matches.length} {matches.length === 1 ? "treatment" : "treatments"} to explore</p>
            <AnimatePresence mode="wait" initial={false}>
              <motion.div key={`${category}-${query.trim().toLowerCase()}`} initial={{ opacity: 0, y: reduce ? 0 : 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: reduce ? 0 : 0.15 }}>
                <div className="max-h-[28rem] space-y-3 overflow-y-auto p-1">
                  {matches.map((service) => (
                    <article key={service.id} className="rounded-2xl border border-line p-5 transition-colors hover:border-brand-300">
                      <p className="eyebrow">{service.category}</p>
                      <h3 className="mt-2 text-lg font-bold"><Link href={`/services/${service.slug}`} className="hover:text-brand-700">{service.name}</Link></h3>
                      <p className="mt-2 text-sm leading-relaxed">{service.short_description}</p>
                      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                        <span className="flex flex-wrap items-center gap-3 text-xs font-semibold text-navy-700">
                          {service.duration_minutes && <span className="inline-flex items-center gap-1"><Clock3 className="size-3.5" aria-hidden />{service.duration_minutes} min</span>}
                          {service.show_price && service.price != null && <span>From {formatPrice(service.price, currency)}</span>}
                        </span>
                        <Link href={`/book-appointment?service=${encodeURIComponent(service.id)}`} className="inline-flex min-h-11 items-center gap-2 rounded-full bg-brand-50 px-4 text-sm font-semibold text-brand-700 hover:bg-brand-100" aria-label={`Book ${service.name}`}><CalendarCheck className="size-4" aria-hidden />Book<ArrowRight className="size-4" aria-hidden /></Link>
                      </div>
                    </article>
                  ))}
                  {!matches.length && <div className="py-10 text-center"><h3 className="font-bold">No matching treatments</h3><p className="mt-2 text-sm">Try another word or view all treatments.</p><button type="button" onClick={() => { setCategory("All"); setQuery(""); }} className="mt-4 min-h-11 rounded-full bg-brand-50 px-5 font-semibold text-brand-700">Clear filters</button></div>}
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
}
