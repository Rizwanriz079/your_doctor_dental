import Link from "next/link";
import {
  ArrowRight,
  CalendarCheck,
  HeartHandshake,
  Phone,
  ScanLine,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  type LucideIcon,
} from "lucide-react";
import type { ReactNode } from "react";
import { Reveal, Stagger, StaggerItem } from "@/components/animations/reveal";
import { ButtonLink } from "@/components/ui/button";
import type { Benefit } from "@/lib/types";
import { cn } from "@/lib/utils";

const ICONS: Record<string, LucideIcon> = {
  stethoscope: Stethoscope,
  scan: ScanLine,
  calendar: CalendarCheck,
  heart: HeartHandshake,
  shield: ShieldCheck,
  sparkles: Sparkles,
};

export function benefitIcon(name?: string): LucideIcon {
  return (name && ICONS[name]) || Sparkles;
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "left",
  action,
  id,
}: {
  eyebrow?: string;
  title: string;
  description?: ReactNode;
  align?: "left" | "center";
  action?: ReactNode;
  id?: string;
}) {
  return (
    <Reveal
      className={cn(
        "mb-10 flex flex-col gap-4 md:mb-12",
        align === "center" ? "items-center text-center" : "md:flex-row md:items-end md:justify-between",
      )}
    >
      <div className={cn("min-w-0", align === "center" ? "max-w-2xl" : "max-w-2xl")}>
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h2 id={id} className="section-title mt-3">
          {title}
        </h2>
        {description && <p className="mt-4 text-base leading-relaxed text-body sm:text-lg">{description}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </Reveal>
  );
}

export function PageIntro({ eyebrow, title, description, children }: { eyebrow?: string; title: string; description?: ReactNode; children?: ReactNode }) {
  return (
    <section className="clinic-page-intro relative -mt-18 overflow-hidden pb-12 pt-30 sm:pb-16 sm:pt-36">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(100%_90%_at_20%_0%,#dff1f5_0%,#eaf5f8_40%,#ffffff_100%)]" aria-hidden />
      <div className="absolute -right-24 -top-10 -z-10 size-80 rounded-full bg-brand-200/30 blur-3xl" aria-hidden />
      <div className="container-page">
        <Reveal className="max-w-3xl">
          {eyebrow && <p className="eyebrow">{eyebrow}</p>}
          <h1 className="hero-title mt-3 !text-[clamp(2.1rem,4.6vw,3.75rem)]">{title}</h1>
          {description && <p className="mt-5 max-w-2xl text-base leading-relaxed text-body sm:text-lg">{description}</p>}
          {children}
        </Reveal>
      </div>
    </section>
  );
}

export function BenefitsStrip({ benefits }: { benefits: Benefit[] }) {
  if (benefits.length === 0) return null;
  return (
    <section aria-label="Why patients choose us" className="relative z-10 -mt-6 pb-6">
      <div className="container-page">
        <Stagger className="grid gap-px overflow-hidden rounded-3xl bg-line shadow-soft ring-1 ring-line sm:grid-cols-2 lg:grid-cols-4">
          {benefits.map((b) => {
            const Icon = benefitIcon(b.icon);
            return (
              <StaggerItem key={b.title} className="flex gap-4 bg-white p-6">
                <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-brand-50 text-brand-600">
                  <Icon className="size-5" aria-hidden />
                </span>
                <div className="min-w-0">
                  <h3 className="text-base font-bold">{b.title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-body">{b.text}</p>
                </div>
              </StaggerItem>
            );
          })}
        </Stagger>
      </div>
    </section>
  );
}

export function CtaBand({ phone }: { phone?: string }) {
  return (
    <section className="py-16 sm:py-20" aria-labelledby="cta-title">
      <div className="container-page">
        <Reveal className="relative overflow-hidden rounded-[2rem] bg-navy-800 px-6 py-12 text-center sm:px-12 sm:py-16">
          <div className="pointer-events-none absolute -left-20 -top-24 size-72 rounded-full bg-brand-500/35 blur-3xl" aria-hidden />
          <div className="pointer-events-none absolute -bottom-28 -right-16 size-80 rounded-full bg-brand-300/20 blur-3xl" aria-hidden />
          <div className="relative mx-auto max-w-2xl">
            <h2 id="cta-title" className="section-title !text-white">
              Ready for a healthier, brighter smile?
            </h2>
            <p className="mt-4 text-base text-navy-100 sm:text-lg">
              Choose a service, pick a dentist and a time that suits you. We&apos;ll confirm your appointment shortly after.
            </p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <ButtonLink href="/book-appointment" size="lg" className="bg-white !text-navy-800 shadow-none hover:bg-brand-50">
                <CalendarCheck className="size-5" aria-hidden />
                Book an Appointment
              </ButtonLink>
              {phone && (
                <a
                  href={`tel:${phone.replace(/\s+/g, "")}`}
                  className="inline-flex h-13 items-center justify-center gap-2 rounded-full px-7 font-semibold text-white ring-1 ring-white/40 transition-colors hover:bg-white/10"
                >
                  <Phone className="size-4" aria-hidden />
                  Call {phone}
                </a>
              )}
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

export function TextLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link href={href} className="group inline-flex min-h-11 items-center gap-1.5 font-semibold text-brand-700 hover:text-brand-800">
      {children}
      <ArrowRight className="size-4 transition-transform duration-200 group-hover:translate-x-0.5" aria-hidden />
    </Link>
  );
}
