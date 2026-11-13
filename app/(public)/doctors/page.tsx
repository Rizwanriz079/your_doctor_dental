import type { Metadata } from "next";
import { Users } from "lucide-react";
import { Reveal } from "@/components/animations/reveal";
import { DoctorsBrowser } from "@/components/public/browsers";
import { CtaBand, PageIntro } from "@/components/public/sections";
import { EmptyState } from "@/components/ui/misc";
import { getActiveDoctors, getSettings } from "@/features/public/queries";

export const metadata: Metadata = {
  title: "Our Dentists",
  description: "Meet our dental team and book an appointment with the dentist of your choice.",
};

export default async function DoctorsPage() {
  const [settings, doctors] = await Promise.all([getSettings(), getActiveDoctors()]);
  return (
    <>
      <PageIntro
        eyebrow="Our team"
        title="Meet our dentists"
        description="Choose the dentist who's right for you, view their profile and book online."
      />
      <section className="pb-8 pt-4" aria-label="All doctors">
        <div className="container-page">
          {doctors.length > 0 ? (
            <Reveal>
              <DoctorsBrowser doctors={doctors} />
            </Reveal>
          ) : (
            <EmptyState icon={Users} title="No doctors are listed yet." description="Please contact the clinic to arrange an appointment." />
          )}
        </div>
      </section>
      <CtaBand phone={settings.phone} />
    </>
  );
}
