import Link from "next/link";
import { Clock3, Mail, MapPin, Phone } from "lucide-react";
import { Reveal } from "@/components/animations/reveal";
import type { ClinicSettings, OpeningHour, SocialLinks } from "@/lib/types";
import { ToothMark } from "./logo";
import { SocialIcons } from "./social-icons";

export function SiteFooter({ settings }: { settings: ClinicSettings }) {
  const hours = (settings.opening_hours as OpeningHour[] | null) ?? [];
  const social = (settings.social_links as SocialLinks | null) ?? {};
  const year = new Date().getFullYear();
  return (
    <footer className="relative overflow-hidden bg-navy-900 text-navy-100">
      <div
        className="pointer-events-none absolute -right-32 -top-32 size-96 rounded-full bg-brand-500/20 blur-3xl"
        aria-hidden
      />
      <Reveal className="container-page relative grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-[1.3fr_1fr_1fr_1.1fr] lg:py-18">
        <div className="min-w-0">
          <Link href="/" className="inline-flex items-center gap-2.5 rounded-lg">
            <ToothMark className="size-9" />
            <span className="text-lg font-bold text-white">{settings.clinic_name}</span>
          </Link>
          {settings.footer_text && <p className="mt-4 max-w-xs text-sm leading-relaxed text-navy-100/80">{settings.footer_text}</p>}
          <SocialIcons links={social} className="mt-6 flex flex-wrap gap-2" />
        </div>

        <nav aria-label="Footer" className="min-w-0">
          <h2 className="text-sm font-bold uppercase tracking-wider text-white">Explore</h2>
          <ul className="mt-4 space-y-1 text-sm">
            {[
              ["/about", "About us"],
              ["/services", "Services"],
              ["/doctors", "Our doctors"],
              ["/book-appointment", "Book an appointment"],
              ["/my-appointments", "Check a booking"],
              ["/contact", "Contact"],
            ].map(([href, label]) => (
              <li key={href}>
                <Link href={href} className="inline-flex min-h-9 items-center transition-colors hover:text-white">
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="min-w-0">
          <h2 className="text-sm font-bold uppercase tracking-wider text-white">Opening hours</h2>
          {hours.length > 0 ? (
            <ul className="mt-4 space-y-2.5 text-sm">
              {hours.map((h) => (
                <li key={h.label} className="flex flex-col">
                  <span className="text-navy-100/70">{h.label}</span>
                  <span className="font-semibold text-white">{h.hours}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-4 flex gap-2 text-sm">
              <Clock3 className="size-4 shrink-0" aria-hidden /> Please contact the clinic for opening hours.
            </p>
          )}
        </div>

        <div className="min-w-0">
          <h2 className="text-sm font-bold uppercase tracking-wider text-white">Contact</h2>
          <ul className="mt-4 space-y-3 text-sm">
            {settings.address && (
              <li className="flex gap-3">
                <MapPin className="mt-0.5 size-4 shrink-0 text-brand-300" aria-hidden />
                {settings.map_url ? (
                  <a href={settings.map_url} target="_blank" rel="noopener noreferrer" className="hover:text-white">
                    {settings.address}
                    <span className="sr-only"> (opens map in a new tab)</span>
                  </a>
                ) : (
                  <span>{settings.address}</span>
                )}
              </li>
            )}
            {settings.phone && (
              <li className="flex gap-3">
                <Phone className="mt-0.5 size-4 shrink-0 text-brand-300" aria-hidden />
                <a href={`tel:${settings.phone.replace(/\s+/g, "")}`} className="hover:text-white">
                  {settings.phone}
                </a>
              </li>
            )}
            {settings.email && (
              <li className="flex gap-3">
                <Mail className="mt-0.5 size-4 shrink-0 text-brand-300" aria-hidden />
                <a href={`mailto:${settings.email}`} className="break-anywhere hover:text-white">
                  {settings.email}
                </a>
              </li>
            )}
          </ul>
        </div>
      </Reveal>
      <div className="relative border-t border-white/10">
        <div className="container-page flex flex-col gap-3 py-6 text-sm text-navy-100/70 sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {year} {settings.clinic_name}. All rights reserved.
          </p>
          <ul className="flex gap-5">
            <li>
              <Link href="/privacy" className="hover:text-white">
                Privacy
              </Link>
            </li>
            <li>
              <Link href="/terms" className="hover:text-white">
                Terms
              </Link>
            </li>
          </ul>
        </div>
      </div>
    </footer>
  );
}
