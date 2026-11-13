import type { Metadata } from "next";
import { LegalPage } from "@/components/public/legal-page";
import { getSettings } from "@/features/public/queries";

export const metadata: Metadata = { title: "Terms of Use" };

export default async function TermsPage() {
  const s = await getSettings();
  return (
    <LegalPage
      title="Terms of use"
      text={s.terms_text}
      updatedAt={s.updated_at}
      fallback={[
        "Online booking requests are reviewed by the clinic. Your appointment is pending until the clinic confirms it.",
        "Information on this website is general and does not replace a consultation or diagnosis by a qualified dentist. Treatment outcomes vary between patients.",
        "If you need to change or cancel your appointment, please contact the clinic as early as possible so the time can be offered to another patient.",
        "In a dental emergency outside opening hours, please contact your local emergency services.",
      ]}
    />
  );
}
