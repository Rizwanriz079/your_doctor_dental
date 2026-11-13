import type { Metadata } from "next";
import { LogIn, ShieldCheck, UserPlus } from "lucide-react";
import { BookingWizard } from "@/components/booking/booking-wizard";
import type { WizardDoctor, WizardService } from "@/components/booking/types";
import { PageIntro } from "@/components/public/sections";
import { ButtonLink } from "@/components/ui/button";
import { getActiveDoctors, getActiveServices, getSettings } from "@/features/public/queries";
import { getPatient } from "@/lib/patient";

export const metadata: Metadata = {
  title: "Book an Appointment",
  description: "Choose a service, dentist, date and time, and request your appointment online.",
};

/** Today's date in the clinic's time zone (YYYY-MM-DD). */
function clinicToday(timeZone: string) {
  try {
    return new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
  } catch {
    return new Date().toISOString().slice(0, 10);
  }
}

export default async function BookAppointmentPage({ searchParams }: PageProps<"/book-appointment">) {
  const sp = await searchParams;
  const patient = await getPatient();

  // Booking requires an account so every appointment shows up in the patient's history.
  if (!patient) {
    const query = new URLSearchParams();
    if (typeof sp.service === "string") query.set("service", sp.service);
    if (typeof sp.doctor === "string") query.set("doctor", sp.doctor);
    const back = `/book-appointment${query.size ? `?${query}` : ""}`;
    return (
      <>
        <PageIntro
          eyebrow="Online booking"
          title="Book an appointment"
          description="Sign in or create a free account to book. You can then see, track and cancel all your appointments in one place."
        />
        <section className="pb-20 pt-2">
          <div className="container-page">
            <div className="mx-auto max-w-md rounded-3xl border border-line bg-white p-6 text-center shadow-soft sm:p-8">
              <div className="mx-auto grid size-14 place-items-center rounded-2xl bg-brand-50 text-brand-600">
                <LogIn className="size-7" aria-hidden />
              </div>
              <h2 className="mt-4 text-lg font-bold">Sign in to book</h2>
              <p className="mt-2 text-sm text-body">
                It takes a few seconds with Google or email, and your details are filled in for you next time.
              </p>
              <div className="mt-6 grid gap-2">
                <ButtonLink href={`/login?next=${encodeURIComponent(back)}`} variant="navy" className="w-full">
                  <LogIn className="size-4" aria-hidden /> Sign in
                </ButtonLink>
                <ButtonLink href={`/register?next=${encodeURIComponent(back)}`} variant="secondary" className="w-full">
                  <UserPlus className="size-4" aria-hidden /> Create an account
                </ButtonLink>
              </div>
            </div>
          </div>
        </section>
      </>
    );
  }

  const [settings, services, doctors] = await Promise.all([
    getSettings(),
    getActiveServices(),
    getActiveDoctors({ bookableOnly: true }),
  ]);

  const wizardDoctors: WizardDoctor[] = doctors
    .filter((d) => d.services.length > 0)
    .map((d) => ({
      id: d.id,
      full_name: d.full_name,
      specialization: d.specialization,
      qualification: d.qualification,
      profile_image_path: d.profile_image_path,
      serviceIds: d.services.map((s) => s.id),
    }));
  const bookableServiceIds = new Set(wizardDoctors.flatMap((d) => d.serviceIds));
  const wizardServices: WizardService[] = services
    .filter((s) => bookableServiceIds.has(s.id))
    .map((s) => ({
      id: s.id,
      name: s.name,
      category: s.category,
      short_description: s.short_description,
      duration_minutes: s.duration_minutes,
    }));

  return (
    <>
      <PageIntro
        eyebrow="Online booking"
        title="Book an appointment"
        description="It takes about two minutes. The clinic will confirm your appointment after you send your request."
      >
        <p className="mt-5 inline-flex items-center gap-2 rounded-full bg-white/80 px-4 py-2 text-sm text-navy-700 ring-1 ring-line">
          <ShieldCheck className="size-4 text-brand-600" aria-hidden />
          Your details are only used to arrange your visit.
        </p>
      </PageIntro>
      <section className="pb-20 pt-2">
        <div className="container-page">
          <BookingWizard
            services={wizardServices}
            doctors={wizardDoctors}
            today={clinicToday(settings.timezone)}
            windowDays={settings.booking_window_days}
            requireEmail={settings.require_email}
            initialServiceId={typeof sp.service === "string" ? sp.service : undefined}
            initialDoctorId={typeof sp.doctor === "string" ? sp.doctor : undefined}
            prefill={{ fullName: patient.fullName, phone: patient.phone, email: patient.email }}
          />
        </div>
      </section>
    </>
  );
}
