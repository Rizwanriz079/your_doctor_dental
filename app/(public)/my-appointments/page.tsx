import { LogIn, UserRound } from "lucide-react";
import type { Metadata } from "next";
import { BookingUpdatesPopup } from "@/components/account/booking-updates-popup";
import { DetailsForm } from "@/components/account/details-form";
import { MyBookings, type MyBooking } from "@/components/account/my-bookings";
import { LookupForm } from "@/components/public/lookup-form";
import { PageIntro } from "@/components/public/sections";
import { ButtonLink } from "@/components/ui/button";
import { getPatient } from "@/lib/patient";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "My Appointments",
  description: "See your bookings, or check the status of a booking with its reference.",
  robots: { index: false },
};

/** Clinic changes since the patient last dismissed the popup (first visit: the last 14 days). */
function unseenUpdates(bookings: MyBooking[], seenAt: string | null) {
  const since = seenAt ? Date.parse(seenAt) : Date.now() - 14 * 24 * 60 * 60 * 1000;
  return bookings.filter((b) => b.last_change && Date.parse(b.last_change.at) > since);
}

export default async function MyAppointmentsPage({ searchParams }: PageProps<"/my-appointments">) {
  const patient = await getPatient();

  if (patient) {
    const supabase = await createClient();
    await supabase.rpc("patient_link_bookings"); // picks up bookings made with this account's verified email
    const { data, error } = await supabase.rpc("patient_my_appointments");
    if (error) console.error("patient_my_appointments failed", error.code, error.message);
    const bookings = (data ?? []) as unknown as MyBooking[];
    const updates = unseenUpdates(bookings, patient.updatesSeenAt);
    return (
      <>
        <BookingUpdatesPopup updates={updates} />
        <PageIntro
          eyebrow="My appointments"
          title={`Hello, ${patient.fullName.split(" ")[0]}`}
          description="Your upcoming and past appointments with us."
        />
        <section className="pb-20 pt-2">
          <div className="container-page grid gap-8 lg:grid-cols-[minmax(0,1fr)_20rem]">
            <div className="min-w-0">
              <MyBookings bookings={bookings} />
            </div>
            <aside className="min-w-0">
              <div className="rounded-3xl border border-line bg-white p-5 shadow-soft sm:p-6">
                <h2 className="flex items-center gap-2 text-base font-bold">
                  <UserRound className="size-4 text-brand-600" aria-hidden /> Your details
                </h2>
                <div className="mt-4">
                  <DetailsForm email={patient.email} fullName={patient.fullName} phone={patient.phone} />
                </div>
              </div>
              <p className="mt-4 text-xs leading-relaxed text-body">
                Bookings you made earlier as a guest appear here when they used the same email address as your account.
              </p>
            </aside>
          </div>
        </section>
      </>
    );
  }

  const { ref } = await searchParams;
  const initial = typeof ref === "string" && /^(YD|LD)-[A-F0-9]{8}$/i.test(ref) ? ref.toUpperCase() : "";
  return (
    <>
      <PageIntro
        eyebrow="My appointments"
        title="Check your booking"
        description="Sign in to see all your bookings, or look up a single booking with its reference and phone number."
      />
      <section className="pb-20 pt-2">
        <div className="container-page grid gap-8 lg:grid-cols-[minmax(0,1fr)_22rem]">
          <div className="min-w-0">
            <LookupForm initialReference={initial} />
          </div>
          <aside className="min-w-0 rounded-3xl bg-navy-800 p-6 text-white shadow-lift">
            <h2 className="text-lg font-bold text-white">See all your bookings</h2>
            <p className="mt-2 text-sm text-navy-100">
              Sign in with Google or email to see your booking history, cancel appointments and book faster next time.
            </p>
            <div className="mt-5 grid gap-2">
              <ButtonLink href="/login?next=/my-appointments" variant="secondary" className="w-full">
                <LogIn className="size-4" aria-hidden /> Sign in
              </ButtonLink>
              <ButtonLink href="/register?next=/my-appointments" variant="glass" className="w-full">
                Create an account
              </ButtonLink>
            </div>
          </aside>
        </div>
      </section>
    </>
  );
}
