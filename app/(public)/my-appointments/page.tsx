import type { Metadata } from "next";
import { LookupForm } from "@/components/public/lookup-form";
import { PageIntro } from "@/components/public/sections";

export const metadata: Metadata = {
  title: "Check Your Booking",
  description: "Check the status of your appointment using your booking reference.",
  robots: { index: false },
};

export default async function MyAppointmentsPage({ searchParams }: PageProps<"/my-appointments">) {
  const { ref } = await searchParams;
  const initial = typeof ref === "string" && /^LD-[A-F0-9]{8}$/i.test(ref) ? ref.toUpperCase() : "";
  return (
    <>
      <PageIntro
        eyebrow="My appointments"
        title="Check your booking"
        description="See whether your appointment is pending, confirmed or has changed. You'll need your booking reference and phone number."
      />
      <section className="pb-20 pt-2">
        <div className="container-page">
          <LookupForm initialReference={initial} />
        </div>
      </section>
    </>
  );
}
