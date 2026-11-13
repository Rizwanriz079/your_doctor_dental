import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CalendarCheck, Clock3, Info, Wallet } from "lucide-react";
import { Reveal, Stagger, StaggerItem } from "@/components/animations/reveal";
import { DoctorChip, ServiceVisual } from "@/components/public/cards";
import { CtaBand } from "@/components/public/sections";
import { ButtonLink } from "@/components/ui/button";
import { Breadcrumbs, Card } from "@/components/ui/misc";
import { getDoctorsForService, getServiceBySlug, getSettings } from "@/features/public/queries";
import { formatPrice } from "@/lib/utils";

export async function generateMetadata({ params }: PageProps<"/services/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const service = await getServiceBySlug(slug);
  if (!service) return { title: "Service not found" };
  return { title: service.name, description: service.short_description };
}

export default async function ServiceDetailPage({ params }: PageProps<"/services/[slug]">) {
  const { slug } = await params;
  const [service, settings] = await Promise.all([getServiceBySlug(slug), getSettings()]);
  if (!service) notFound();
  const doctors = (await getDoctorsForService(service.id)).filter((d) => d.accepting_bookings);
  const price = service.show_price ? formatPrice(service.price, settings.currency) : null;

  return (
    <>
      <section className="relative -mt-18 overflow-hidden pb-14 pt-28 sm:pt-32">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(100%_90%_at_20%_0%,#dff1f5_0%,#eaf5f8_40%,#ffffff_100%)]" aria-hidden />
        <div className="container-page">
          <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Services", href: "/services" }, { label: service.name }]} />
          <div className="mt-8 grid items-center gap-10 lg:grid-cols-[1.1fr_1fr]">
            <Reveal className="min-w-0">
              <p className="eyebrow">{service.category}</p>
              <h1 className="hero-title mt-3 !text-[clamp(2.1rem,4.6vw,3.75rem)] break-anywhere">{service.name}</h1>
              <p className="mt-5 max-w-xl text-base leading-relaxed text-body sm:text-lg">{service.short_description}</p>
              <dl className="mt-7 flex flex-wrap gap-3">
                {service.duration_minutes && (
                  <div className="flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm ring-1 ring-line">
                    <Clock3 className="size-4 text-brand-600" aria-hidden />
                    <dt className="sr-only">Estimated duration</dt>
                    <dd className="font-semibold text-navy-800">About {service.duration_minutes} minutes</dd>
                  </div>
                )}
                <div className="flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm ring-1 ring-line">
                  <Wallet className="size-4 text-brand-600" aria-hidden />
                  <dt className="sr-only">Price</dt>
                  <dd className="font-semibold text-navy-800">{price ? `From ${price}` : "Contact the clinic for pricing"}</dd>
                </div>
              </dl>
              <div className="mt-8">
                <ButtonLink href={`/book-appointment?service=${service.id}`} size="lg">
                  <CalendarCheck className="size-5" aria-hidden />
                  Book this service
                </ButtonLink>
              </div>
            </Reveal>
            <Reveal delay={0.1} x={24} y={0}>
              <div className="group relative aspect-[4/3] overflow-hidden rounded-[2rem] shadow-soft ring-1 ring-white">
                <ServiceVisual service={service} />
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      <section className="py-14" aria-label="Treatment details">
        <div className="container-page grid gap-10 lg:grid-cols-[1.4fr_1fr]">
          <div className="min-w-0 space-y-10">
            {service.description && (
              <Reveal>
                <h2 className="text-2xl font-bold">About this treatment</h2>
                <p className="mt-4 whitespace-pre-line leading-relaxed">{service.description}</p>
              </Reveal>
            )}
            {service.procedure_details && (
              <Reveal>
                <h2 className="text-2xl font-bold">What the appointment involves</h2>
                <p className="mt-4 whitespace-pre-line leading-relaxed">{service.procedure_details}</p>
              </Reveal>
            )}
            <Reveal>
              <p className="flex gap-3 rounded-2xl bg-sky-soft p-5 text-sm leading-relaxed text-navy-700">
                <Info className="mt-0.5 size-5 shrink-0 text-brand-600" aria-hidden />
                This page is general information, not a diagnosis. Your dentist will assess your individual needs and discuss
                suitable options with you; outcomes vary from person to person.
              </p>
            </Reveal>
          </div>
          <aside className="min-w-0" aria-labelledby="related-doctors">
            <Card className="p-6 lg:sticky lg:top-24">
              <h2 id="related-doctors" className="text-lg font-bold">
                Dentists offering this service
              </h2>
              {doctors.length > 0 ? (
                <Stagger as="ul" className="mt-4 space-y-3">
                  {doctors.map((d) => (
                    <StaggerItem as="li" key={d.id}>
                      <DoctorChip doctor={d} />
                    </StaggerItem>
                  ))}
                </Stagger>
              ) : (
                <p className="mt-3 text-sm text-body">No dentist is currently taking online bookings for this service. Please contact the clinic.</p>
              )}
            </Card>
          </aside>
        </div>
      </section>
      <CtaBand phone={settings.phone} />
    </>
  );
}
