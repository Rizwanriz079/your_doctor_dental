import type { Metadata } from "next";
import { CalendarCheck, Clock3, ExternalLink, Mail, MapPin, Phone } from "lucide-react";
import type { ReactNode } from "react";
import { Reveal, Stagger, StaggerItem } from "@/components/animations/reveal";
import { PageIntro } from "@/components/public/sections";
import { SocialIcons } from "@/components/public/social-icons";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/misc";
import { getSettings, getUpcomingHolidays } from "@/features/public/queries";
import type { OpeningHour, SocialLinks } from "@/lib/types";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Contact Us",
  description: "Find our address, opening hours and contact details, or book an appointment online.",
};

function Item({ icon: Icon, title, children }: { icon: typeof Phone; title: string; children: ReactNode }) {
  return (
    <Card className="flex h-full gap-4 p-6">
      <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-brand-50 text-brand-600">
        <Icon className="size-5" aria-hidden />
      </span>
      <div className="min-w-0">
        <h2 className="text-base font-bold">{title}</h2>
        <div className="mt-1 text-sm leading-relaxed">{children}</div>
      </div>
    </Card>
  );
}

export default async function ContactPage() {
  const [s, holidays] = await Promise.all([getSettings(), getUpcomingHolidays()]);
  const hours = (s.opening_hours as OpeningHour[] | null) ?? [];
  const social = (s.social_links as SocialLinks | null) ?? {};
  const safeEmbed = /^https:\/\//.test(s.map_embed_url) ? s.map_embed_url : "";

  return (
    <>
      <PageIntro eyebrow="Contact" title="We're here to help" description="Get in touch with any questions, or book your visit online in a couple of minutes.">
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <ButtonLink href="/book-appointment" size="lg">
            <CalendarCheck className="size-5" aria-hidden />
            Book an Appointment
          </ButtonLink>
          {s.phone && (
            <a
              href={`tel:${s.phone.replace(/\s+/g, "")}`}
              className="inline-flex h-13 items-center justify-center gap-2 rounded-full bg-white px-7 font-semibold text-navy-800 ring-1 ring-line hover:bg-muted"
            >
              <Phone className="size-4" aria-hidden /> Call us
            </a>
          )}
        </div>
      </PageIntro>

      <section className="pb-18 pt-4" aria-label="Contact details">
        <div className="container-page grid gap-6 lg:grid-cols-[1fr_1.15fr]">
          <Stagger className="grid content-start gap-4 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
            {s.address && (
              <StaggerItem className="min-w-0">
                <Item icon={MapPin} title="Address">
                  <p>{s.address}</p>
                  {s.map_url && (
                    <a href={s.map_url} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex min-h-9 items-center gap-1 font-semibold text-brand-700 hover:underline">
                      Open in maps <ExternalLink className="size-3.5" aria-hidden />
                      <span className="sr-only">(opens in a new tab)</span>
                    </a>
                  )}
                </Item>
              </StaggerItem>
            )}
            {s.phone && (
              <StaggerItem className="min-w-0">
                <Item icon={Phone} title="Phone">
                  <a href={`tel:${s.phone.replace(/\s+/g, "")}`} className="font-semibold text-navy-800 hover:text-brand-700">
                    {s.phone}
                  </a>
                </Item>
              </StaggerItem>
            )}
            {s.email && (
              <StaggerItem className="min-w-0">
                <Item icon={Mail} title="Email">
                  <a href={`mailto:${s.email}`} className="break-anywhere font-semibold text-navy-800 hover:text-brand-700">
                    {s.email}
                  </a>
                </Item>
              </StaggerItem>
            )}
            <StaggerItem className="min-w-0">
              <Item icon={Clock3} title="Opening hours">
                {hours.length > 0 ? (
                  <ul className="space-y-1">
                    {hours.map((h) => (
                      <li key={h.label} className="flex flex-wrap justify-between gap-x-4">
                        <span>{h.label}</span>
                        <span className="font-semibold text-navy-800">{h.hours}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p>Please call us for opening hours.</p>
                )}
                {holidays.length > 0 && (
                  <div className="mt-3 border-t border-line pt-3">
                    <p className="font-semibold text-navy-800">Upcoming closures</p>
                    <ul className="mt-1 space-y-0.5">
                      {holidays.map((h) => (
                        <li key={h.holiday_date}>
                          {formatDate(h.holiday_date, "short")} — {h.name}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </Item>
            </StaggerItem>
            {Object.values(social).some(Boolean) && (
              <StaggerItem className="min-w-0 sm:col-span-2 lg:col-span-1 xl:col-span-2">
                <Card className="flex flex-wrap items-center justify-between gap-4 bg-navy-800 p-6">
                  <p className="font-bold text-white">Follow us</p>
                  <SocialIcons links={social} />
                </Card>
              </StaggerItem>
            )}
          </Stagger>

          <Reveal delay={0.1} className="min-w-0">
            <div className="relative aspect-[4/3] min-h-80 overflow-hidden rounded-[2rem] bg-sky-soft ring-1 ring-line lg:aspect-auto lg:h-full">
              {safeEmbed ? (
                <iframe
                  src={safeEmbed}
                  title={`Map showing the location of ${s.clinic_name}`}
                  className="absolute inset-0 h-full w-full border-0"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  allowFullScreen
                />
              ) : (
                <div className="absolute inset-0 grid place-items-center p-8 text-center">
                  <div>
                    <span className="mx-auto grid size-16 place-items-center rounded-full bg-white text-brand-600 shadow-soft">
                      <MapPin className="size-7" aria-hidden />
                    </span>
                    <p className="mt-4 font-semibold text-navy-800">{s.address || s.clinic_name}</p>
                    {s.map_url && (
                      <a
                        href={s.map_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-3 inline-flex min-h-11 items-center gap-1.5 font-semibold text-brand-700 hover:underline"
                      >
                        Get directions <ExternalLink className="size-4" aria-hidden />
                        <span className="sr-only">(opens in a new tab)</span>
                      </a>
                    )}
                  </div>
                </div>
              )}
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
