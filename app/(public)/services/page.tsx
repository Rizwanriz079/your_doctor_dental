import type { Metadata } from "next";
import { Stethoscope } from "lucide-react";
import { Reveal } from "@/components/animations/reveal";
import { ServicesBrowser } from "@/components/public/browsers";
import { CtaBand, PageIntro } from "@/components/public/sections";
import { EmptyState } from "@/components/ui/misc";
import { getActiveServices, getSettings } from "@/features/public/queries";

export const metadata: Metadata = {
  title: "Dental Services",
  description: "Explore our preventive, restorative, cosmetic and orthodontic dental services.",
};

export default async function ServicesPage() {
  const [settings, services] = await Promise.all([getSettings(), getActiveServices()]);
  return (
    <>
      <PageIntro
        eyebrow="Services"
        title="Dental care, explained clearly"
        description="Every treatment begins with an assessment and an honest conversation about your options."
      />
      <section className="pb-8 pt-4" aria-label="All services">
        <div className="container-page">
          {services.length > 0 ? (
            <Reveal>
              <ServicesBrowser services={services} currency={settings.currency} />
            </Reveal>
          ) : (
            <EmptyState icon={Stethoscope} title="No services are currently available." description="Please contact the clinic for more information." />
          )}
        </div>
      </section>
      <CtaBand phone={settings.phone} />
    </>
  );
}
