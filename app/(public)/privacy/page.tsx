import type { Metadata } from "next";
import { LegalPage } from "@/components/public/legal-page";
import { getSettings } from "@/features/public/queries";

export const metadata: Metadata = { title: "Privacy Notice" };

export default async function PrivacyPage() {
  const s = await getSettings();
  return (
    <LegalPage
      title="Privacy notice"
      text={s.privacy_text}
      updatedAt={s.updated_at}
      fallback={[
        `${s.clinic_name} collects only the information needed to arrange your appointment: your name, phone number, optional email address and any message you choose to send.`,
        "We use these details to schedule, confirm and manage your appointment and to contact you about it. We do not sell your information or use it for unrelated marketing without your consent.",
        "Access to booking information is restricted to authorised clinic staff. Please do not include detailed medical information in the online booking form; your dentist will discuss your health in person.",
        `To ask about, correct or delete your information, please contact the clinic${s.email ? ` at ${s.email}` : ""}${s.phone ? ` or ${s.phone}` : ""}.`,
      ]}
    />
  );
}
