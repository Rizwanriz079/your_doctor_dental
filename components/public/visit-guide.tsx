"use client";

import { useId, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { CalendarCheck, ChevronDown, ClipboardList, HeartHandshake } from "lucide-react";
import { Reveal, Stagger, StaggerItem } from "@/components/animations/reveal";
import { useSafeReducedMotion } from "@/lib/use-reduced-motion";
import { SectionHeading } from "./sections";

const journey = [
  { icon: CalendarCheck, title: "Choose your visit", text: "Pick a service, dentist and available time. Send your appointment request online." },
  { icon: ClipboardList, title: "Get confirmation", text: "The clinic reviews your request. Check your booking status before you travel." },
  { icon: HeartHandshake, title: "Meet. Discuss. Plan.", text: "Share your questions with your dentist and understand your options before deciding." },
];
const checklist = ["Note the questions you want to ask", "Have your current medication list ready", "Gather any previous dental records", "Check your appointment confirmation"];
const faqs = [
  { q: "How do I book an appointment?", a: "Choose a service, pick a dentist and select an available date and time. Enter your contact details, review the information and send your request. Your appointment stays pending until the clinic confirms it." },
  { q: "How can I check my booking?", a: "Use Check a booking in the footer or open My bookings from your account. Follow the lookup instructions to see the latest status of your appointment." },
  { q: "What if I am unsure which service to choose?", a: "Explore the treatment information or contact the clinic before booking. The team can help you arrange a suitable consultation; your dentist will discuss your options during the visit." },
  { q: "Can I choose my dentist?", a: "Yes. View the doctor profiles and select Book on the dentist you prefer. The booking form shows the services and appointment times available for that dentist." },
  { q: "What if I need to change my appointment?", a: "Contact the clinic with your booking reference and preferred new date. The team can explain the available options. A change is only confirmed once the clinic updates your booking." },
];

export function VisitGuide() {
  const [checked, setChecked] = useState<number[]>([]);
  return (
    <section className="py-18 sm:py-24" aria-labelledby="visit-guide-title">
      <div className="container-page">
        <SectionHeading id="visit-guide-title" eyebrow="Your first visit, simplified" title="Feel prepared before you arrive." align="center" />
        <Stagger className="grid gap-5 md:grid-cols-3">
          {journey.map(({ icon: Icon, title, text }, i) => <StaggerItem key={title} className="journey-card relative rounded-3xl border border-line bg-white p-7">
            <div className="flex items-center justify-between"><span className="grid size-12 place-items-center rounded-2xl bg-brand-50 text-brand-700"><Icon className="size-6" aria-hidden /></span><span className="text-4xl font-bold text-brand-100" aria-hidden>0{i + 1}</span></div>
            <h3 className="mt-6 text-xl font-bold">{title}</h3><p className="mt-3 text-sm leading-relaxed">{text}</p>
          </StaggerItem>)}
        </Stagger>
        <Reveal className="mt-8 grid gap-7 rounded-3xl bg-sky-soft/70 p-6 sm:p-8 lg:grid-cols-[0.7fr_1.3fr]">
          <div><p className="eyebrow">Your visit checklist</p><h3 className="mt-3 text-2xl font-bold">A few things to have ready.</h3><p className="mt-3 text-sm">Tick these off as you prepare. This checklist stays on this page and is not sent to the clinic.</p><p className="mt-5 text-sm font-semibold text-brand-700" role="status">{checked.length} of {checklist.length} ready{checked.length === checklist.length ? " — you're all set!" : ""}</p>
            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white" aria-hidden><div className="h-full rounded-full bg-brand-600 transition-[width] duration-500" style={{ width: `${checked.length / checklist.length * 100}%` }} /></div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">{checklist.map((item, i) => <label key={item} className={`flex cursor-pointer items-start gap-3 rounded-2xl border p-4 transition-colors ${checked.includes(i) ? "border-brand-300 bg-brand-50" : "border-white bg-white"}`}>
            <input type="checkbox" checked={checked.includes(i)} onChange={(e) => setChecked((old) => e.target.checked ? [...old, i] : old.filter((value) => value !== i))} className="mt-0.5 size-5 shrink-0 accent-[#0b7a7c]" /><span className="text-sm font-semibold text-navy-800">{item}</span>
          </label>)}</div>
        </Reveal>
      </div>
    </section>
  );
}

export function DentalFaq() {
  const [open, setOpen] = useState<number | null>(0);
  const id = useId();
  const reduce = useSafeReducedMotion();
  return (
    <section className="bg-muted py-18 sm:py-24" aria-labelledby={`${id}-title`}>
      <div className="container-page grid gap-8 lg:grid-cols-[0.7fr_1.3fr] lg:gap-16">
        <SectionHeading id={`${id}-title`} eyebrow="A little reassurance" title="Questions? Let's make it simple." description="A few useful answers before your appointment." />
        <div className="space-y-3">{faqs.map(({ q, a }, i) => <div key={q} className="overflow-hidden rounded-2xl border border-line bg-white">
          <h3><button type="button" id={`${id}-question-${i}`} aria-expanded={open === i} aria-controls={`${id}-answer-${i}`} onClick={() => setOpen(open === i ? null : i)} className="flex min-h-16 w-full items-center justify-between gap-5 p-5 text-left font-semibold text-navy-800 sm:p-6">{q}<ChevronDown aria-hidden className={`size-5 shrink-0 text-brand-700 transition-transform ${open === i ? "rotate-180" : ""}`} /></button></h3>
          <div id={`${id}-answer-${i}`} role="region" aria-labelledby={`${id}-question-${i}`}>
            <AnimatePresence initial={false}>{open === i && <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: reduce ? 0 : 0.25 }}><p className="px-5 pb-6 text-sm leading-relaxed sm:px-6">{a}</p></motion.div>}</AnimatePresence>
          </div>
        </div>)}</div>
      </div>
    </section>
  );
}
