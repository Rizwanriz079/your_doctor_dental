import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Award, BriefcaseMedical, CalendarCheck, CalendarX2, Clock3, GraduationCap } from "lucide-react";
import { Reveal } from "@/components/animations/reveal";
import { CtaBand } from "@/components/public/sections";
import { ButtonLink } from "@/components/ui/button";
import { Breadcrumbs, Card } from "@/components/ui/misc";
import { getDoctorBySlug, getSettings } from "@/features/public/queries";
import { cn, formatTime, initials, mediaUrl, WEEKDAYS } from "@/lib/utils";

export async function generateMetadata({ params }: PageProps<"/doctors/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const doctor = await getDoctorBySlug(slug);
  if (!doctor) return { title: "Doctor not found" };
  return {
    title: `${doctor.full_name} – ${doctor.specialization}`,
    description: doctor.biography.slice(0, 160) || `${doctor.full_name}, ${doctor.specialization}.`,
  };
}

// Display order Monday → Sunday.
const ORDER = [1, 2, 3, 4, 5, 6, 0];

export default async function DoctorProfilePage({ params }: PageProps<"/doctors/[slug]">) {
  const { slug } = await params;
  const [doctor, settings] = await Promise.all([getDoctorBySlug(slug), getSettings()]);
  if (!doctor) notFound();
  const photo = mediaUrl(doctor.profile_image_path);
  const schedules = doctor.schedules ?? [];
  const bookHref = `/book-appointment?doctor=${doctor.id}${doctor.services.length === 1 ? `&service=${doctor.services[0].id}` : ""}`;

  return (
    <>
      <section className="relative -mt-18 overflow-hidden pb-12 pt-28 sm:pt-32">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(100%_90%_at_20%_0%,#dff1f5_0%,#eaf5f8_40%,#ffffff_100%)]" aria-hidden />
        <div className="container-page">
          <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Doctors", href: "/doctors" }, { label: doctor.full_name }]} />
          <div className="mt-8 grid gap-10 md:grid-cols-[minmax(0,22rem)_1fr] md:items-center">
            <Reveal x={-20} y={0}>
              <div className="relative aspect-[4/5] overflow-hidden rounded-[2rem] bg-gradient-to-br from-brand-50 via-sky-soft to-navy-50 shadow-soft ring-1 ring-white">
                {photo ? (
                  <Image src={photo} alt={`Portrait of ${doctor.full_name}`} fill priority sizes="(min-width: 768px) 22rem, 92vw" className="object-cover" />
                ) : (
                  <div className="grid h-full place-items-center" aria-hidden>
                    <span className="grid size-32 place-items-center rounded-[2rem] bg-white/85 text-4xl font-bold text-brand-700 shadow-soft">
                      {initials(doctor.full_name)}
                    </span>
                  </div>
                )}
              </div>
            </Reveal>
            <Reveal className="min-w-0">
              <p className="eyebrow">{doctor.specialization}</p>
              <h1 className="hero-title mt-3 !text-[clamp(2.1rem,4.6vw,3.5rem)] break-anywhere">{doctor.full_name}</h1>
              <ul className="mt-6 flex flex-wrap gap-3 text-sm">
                {doctor.qualification && (
                  <li className="flex items-center gap-2 rounded-full bg-white px-4 py-2 ring-1 ring-line">
                    <GraduationCap className="size-4 text-brand-600" aria-hidden />
                    <span className="font-semibold text-navy-800">{doctor.qualification}</span>
                  </li>
                )}
                {doctor.experience_years != null && doctor.experience_years > 0 && (
                  <li className="flex items-center gap-2 rounded-full bg-white px-4 py-2 ring-1 ring-line">
                    <Award className="size-4 text-brand-600" aria-hidden />
                    <span className="font-semibold text-navy-800">{doctor.experience_years}+ years experience</span>
                  </li>
                )}
              </ul>
              {doctor.biography && <p className="mt-6 max-w-2xl whitespace-pre-line leading-relaxed">{doctor.biography}</p>}
              <div className="mt-8">
                {doctor.accepting_bookings ? (
                  <ButtonLink href={bookHref} size="lg">
                    <CalendarCheck className="size-5" aria-hidden />
                    Book with {doctor.full_name.split(" ").slice(0, 2).join(" ")}
                  </ButtonLink>
                ) : (
                  <p className="flex max-w-xl gap-3 rounded-2xl bg-warning-50 p-4 text-sm text-warning-700 ring-1 ring-warning-500/25">
                    <CalendarX2 className="mt-0.5 size-5 shrink-0" aria-hidden />
                    {doctor.full_name} is not taking new online bookings at the moment. Please{" "}
                    <Link href="/doctors" className="font-semibold underline">
                      choose another dentist
                    </Link>{" "}
                    or contact the clinic.
                  </p>
                )}
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      <section className="py-12" aria-label="Services and working hours">
        <div className="container-page grid gap-6 lg:grid-cols-2">
          <Reveal>
            <Card className="h-full p-6 sm:p-8">
              <h2 className="flex items-center gap-2 text-xl font-bold">
                <BriefcaseMedical className="size-5 text-brand-600" aria-hidden />
                Services provided
              </h2>
              {doctor.services.length > 0 ? (
                <ul className="mt-5 grid gap-2 sm:grid-cols-2">
                  {doctor.services.map((s) => (
                    <li key={s.id}>
                      <Link
                        href={`/services/${s.slug}`}
                        className="flex min-h-11 items-center rounded-xl bg-muted px-4 text-sm font-semibold text-navy-800 transition-colors hover:bg-brand-50 hover:text-brand-700"
                      >
                        {s.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-4 text-sm">Please contact the clinic for details.</p>
              )}
            </Card>
          </Reveal>
          <Reveal delay={0.08}>
            <Card className="h-full p-6 sm:p-8">
              <h2 className="flex items-center gap-2 text-xl font-bold">
                <Clock3 className="size-5 text-brand-600" aria-hidden />
                Working days
              </h2>
              <table className="mt-5 w-full text-sm">
                <caption className="sr-only">Weekly working hours for {doctor.full_name}</caption>
                <tbody>
                  {ORDER.map((wd) => {
                    const sessions = schedules.filter((s) => s.weekday === wd);
                    return (
                      <tr key={wd} className="border-b border-line last:border-0">
                        <th scope="row" className="py-3 pr-4 text-left font-semibold text-navy-800">
                          {WEEKDAYS[wd]}
                        </th>
                        <td className={cn("py-3 text-right", sessions.length === 0 && "text-body")}>
                          {sessions.length === 0
                            ? "Not working"
                            : sessions.map((s) => `${formatTime(s.start_time)} – ${formatTime(s.end_time)}`).join(", ")}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              <p className="mt-4 text-xs text-body">
                Exact availability, leave and holidays are shown when you choose a date in the booking form.
              </p>
            </Card>
          </Reveal>
        </div>
      </section>
      <CtaBand phone={settings.phone} />
    </>
  );
}
