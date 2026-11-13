import type { Metadata } from "next";
import { Building2, CheckCircle2, Cpu, Target } from "lucide-react";
import { Reveal, Stagger, StaggerItem } from "@/components/animations/reveal";
import { DoctorChip } from "@/components/public/cards";
import { Gallery } from "@/components/public/gallery";
import { CtaBand, PageIntro, SectionHeading, TextLink } from "@/components/public/sections";
import { Card } from "@/components/ui/misc";
import { getActiveDoctors, getSettings } from "@/features/public/queries";
import type { Benefit, GalleryImage } from "@/lib/types";

export async function generateMetadata(): Promise<Metadata> {
  const s = await getSettings();
  return { title: "About Us", description: s.about_overview.slice(0, 160) || `About ${s.clinic_name}.` };
}

export default async function AboutPage() {
  const [settings, doctors] = await Promise.all([getSettings(), getActiveDoctors()]);
  const values = (settings.clinic_values as Benefit[] | null) ?? [];
  const gallery = (settings.gallery as GalleryImage[] | null) ?? [];
  const blocks = [
    { icon: Target, title: "Our mission", text: settings.mission },
    { icon: Building2, title: "Our facilities", text: settings.facilities },
    { icon: Cpu, title: "Equipment & technology", text: settings.technology },
  ].filter((b) => b.text);

  return (
    <>
      <PageIntro eyebrow="About us" title={settings.about_heading} description={settings.about_overview} />

      {blocks.length > 0 && (
        <section className="py-10" aria-label="Mission, facilities and technology">
          <div className="container-page">
            <Stagger className="grid gap-6 md:grid-cols-3">
              {blocks.map(({ icon: Icon, title, text }) => (
                <StaggerItem key={title} className="min-w-0">
                  <Card className="h-full p-7">
                    <span className="grid size-12 place-items-center rounded-2xl bg-brand-50 text-brand-600">
                      <Icon className="size-5" aria-hidden />
                    </span>
                    <h2 className="mt-5 text-lg font-bold">{title}</h2>
                    <p className="mt-2 text-sm leading-relaxed">{text}</p>
                  </Card>
                </StaggerItem>
              ))}
            </Stagger>
          </div>
        </section>
      )}

      {values.length > 0 && (
        <section className="bg-sky-soft/60 py-18 sm:py-22" aria-labelledby="values-title">
          <div className="container-page">
            <SectionHeading id="values-title" eyebrow="Our values" title="What guides our care" align="center" />
            <Stagger as="ul" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {values.map((v) => (
                <StaggerItem as="li" key={v.title} className="flex gap-4 rounded-2xl bg-white p-6 ring-1 ring-line">
                  <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-brand-600" aria-hidden />
                  <div className="min-w-0">
                    <h3 className="font-bold">{v.title}</h3>
                    <p className="mt-1 text-sm leading-relaxed">{v.text}</p>
                  </div>
                </StaggerItem>
              ))}
            </Stagger>
          </div>
        </section>
      )}

      {doctors.length > 0 && (
        <section className="py-18 sm:py-22" aria-labelledby="team-title">
          <div className="container-page">
            <SectionHeading
              id="team-title"
              eyebrow="Our team"
              title="The people behind your care"
              action={<TextLink href="/doctors">View all profiles</TextLink>}
            />
            <Reveal>
              <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {doctors.map((d) => (
                  <li key={d.id} className="min-w-0">
                    <DoctorChip doctor={d} />
                  </li>
                ))}
              </ul>
            </Reveal>
          </div>
        </section>
      )}

      {gallery.length > 0 && (
        <section className="bg-muted py-18 sm:py-22" aria-labelledby="photos-title">
          <div className="container-page">
            <SectionHeading id="photos-title" eyebrow="Inside the clinic" title="Take a look around" align="center" />
            <Gallery images={gallery} />
          </div>
        </section>
      )}

      <CtaBand phone={settings.phone} />
    </>
  );
}
