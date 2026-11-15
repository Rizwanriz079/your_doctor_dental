import { DentalFaq } from "@/components/public/visit-guide";
import Image from "next/image";
import { CheckCircle2, ScanLine } from "lucide-react";
import { Reveal, Stagger, StaggerItem } from "@/components/animations/reveal";
import { DoctorCard, ServiceCard } from "@/components/public/cards";
import { Gallery } from "@/components/public/gallery";
import { Hero } from "@/components/public/hero";
import { BenefitsStrip, CtaBand, SectionHeading, TextLink } from "@/components/public/sections";
import { StatsStrip } from "@/components/public/stats-strip";
import { Testimonials } from "@/components/public/testimonials";
import { ToothIllustration } from "@/components/public/tooth-illustration";
import { EmptyState } from "@/components/ui/misc";
import { getActiveDoctors, getActiveServices, getApprovedTestimonials, getSettings } from "@/features/public/queries";
import type { Benefit, GalleryImage, Stat } from "@/lib/types";
import { mediaUrl } from "@/lib/utils";

export default async function HomePage() {
  const [settings, featured, allServices, doctors, testimonials] = await Promise.all([
    getSettings(),
    getActiveServices({ featuredOnly: true }),
    getActiveServices(),
    getActiveDoctors({ homepageOnly: true }),
    getApprovedTestimonials(),
  ]);
  const services = featured.length > 0 ? featured : allServices.slice(0, 6);
  const highlights = (settings.hero_highlights as Benefit[] | null) ?? [];
  const benefits = (settings.benefits as Benefit[] | null) ?? [];
  const stats = (settings.stats as Stat[] | null) ?? [];
  const values = (settings.clinic_values as Benefit[] | null) ?? [];
  const gallery = (settings.gallery as GalleryImage[] | null) ?? [];
  const categories = Array.from(new Set(allServices.map((s) => s.category))).slice(0, 3);
  const galleryLead = gallery[0] ? mediaUrl(gallery[0].path) : null;

  return (
    <>
      <Hero
        eyebrow={settings.hero_eyebrow}
        heading={settings.hero_heading}
        text={settings.hero_text}
        imageUrl={mediaUrl(settings.hero_image_path)}
        highlights={highlights}
        categories={categories}
      />

      <BenefitsStrip benefits={benefits} />
      <StatsStrip stats={stats} />


      <section id="treatments" className="py-18 sm:py-24" aria-labelledby="services-title">
        <div className="container-page">
          <SectionHeading
            id="services-title"
            eyebrow="Our services"
            title="Care for every stage of your smile"
            description="From routine check-ups to restorative and cosmetic treatment, every plan starts with a clear conversation."
            action={<TextLink href="/services">View all services</TextLink>}
          />
          {services.length > 0 ? (
            <Stagger className="card-grid">
              {services.map((s) => (
                <StaggerItem key={s.id} className="min-w-0">
                  <ServiceCard service={s} currency={settings.currency} />
                </StaggerItem>
              ))}
            </Stagger>
          ) : (
            <EmptyState title="No services are currently available." description="Please contact the clinic for more information." />
          )}
        </div>
      </section>


      <section className="bg-sky-soft/60 py-18 sm:py-24" aria-labelledby="why-title">
        <div className="container-page grid items-center gap-12 lg:grid-cols-2">
          <Reveal x={-24} y={0} className="relative order-last lg:order-first">
            <div className="relative aspect-[5/4] overflow-hidden rounded-[2rem] bg-gradient-to-br from-white via-sky-soft to-brand-100 ring-1 ring-white">
              {galleryLead ? (
                <Image src={galleryLead} alt={gallery[0].alt || "Our clinic"} fill sizes="(min-width: 1024px) 45vw, 92vw" className="object-cover" />
              ) : (
                <ToothIllustration className="absolute inset-0 m-auto h-[88%] w-[88%]" />
              )}
            </div>
            {settings.technology && (
              <div className="absolute -bottom-6 right-4 max-w-xs rounded-2xl bg-white p-4 shadow-lift ring-1 ring-line sm:right-8">
                <p className="flex items-center gap-2 text-sm font-bold text-navy-800">
                  <ScanLine className="size-4 text-brand-600" aria-hidden />
                  Modern technology
                </p>
                <p className="mt-1 line-clamp-3 text-sm text-body">{settings.technology}</p>
              </div>
            )}
          </Reveal>
          <div className="min-w-0">
            <SectionHeading id="why-title" eyebrow="Why choose us" title={`Why patients choose ${settings.clinic_name}`} description={settings.about_overview} />
            {values.length > 0 && (
              <Stagger as="ul" className="-mt-4 space-y-4">
                {values.map((v) => (
                  <StaggerItem as="li" key={v.title} className="flex gap-4 rounded-2xl bg-white p-5 ring-1 ring-line">
                    <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-brand-600" aria-hidden />
                    <div className="min-w-0">
                      <h3 className="font-bold">{v.title}</h3>
                      <p className="mt-0.5 text-sm leading-relaxed text-body">{v.text}</p>
                    </div>
                  </StaggerItem>
                ))}
              </Stagger>
            )}
            <div className="mt-6">
              <TextLink href="/about">More about our clinic</TextLink>
            </div>
          </div>
        </div>
      </section>

      <section className="py-18 sm:py-24" aria-labelledby="doctors-title">
        <div className="container-page">
          <SectionHeading
            id="doctors-title"
            eyebrow="Meet our dentists"
            title="Experienced, caring hands"
            description="Get to know the team and book directly with the dentist you prefer."
            action={<TextLink href="/doctors">All doctors</TextLink>}
          />
          {doctors.length > 0 ? (
            <Stagger className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {doctors.slice(0, 8).map((d) => (
                <StaggerItem key={d.id} className="min-w-0">
                  <DoctorCard doctor={d} />
                </StaggerItem>
              ))}
            </Stagger>
          ) : (
            <EmptyState title="Our team profiles are coming soon." description="Please contact the clinic to arrange an appointment." />
          )}
        </div>
      </section>

      {gallery.length > 0 && (
        <section className="bg-muted py-18 sm:py-24" aria-labelledby="gallery-title">
          <div className="container-page">
            <SectionHeading id="gallery-title" eyebrow="Our clinic" title="A calm space designed around you" align="center" />
            <Gallery images={gallery} />
          </div>
        </section>
      )}

      {testimonials.length > 0 && (
        <section className="py-18 sm:py-24" aria-labelledby="testimonials-title">
          <div className="container-page">
            <SectionHeading id="testimonials-title" eyebrow="Patient stories" title="In our patients' words" align="center" />
            <Reveal>
              <Testimonials items={testimonials} />
            </Reveal>
          </div>
        </section>
      )}

      <DentalFaq />
      <CtaBand phone={settings.phone} />
    </>
  );
}
