import { WelcomeIntro } from "@/components/public/welcome-intro";
import { ExperienceTools } from "@/components/public/experience-tools";
import { SiteFooter } from "@/components/public/site-footer";
import { SiteHeader } from "@/components/public/site-header";
import { getSettings } from "@/features/public/queries";
import { getPatient } from "@/lib/patient";

export default async function PublicLayout({ children }: LayoutProps<"/">) {
  const [settings, patient] = await Promise.all([getSettings(), getPatient()]);
  return (
    <div className="clinic-public flex min-h-dvh flex-col overflow-x-clip">
      <WelcomeIntro clinicName={settings.clinic_name} />
      <SiteHeader clinicName={settings.clinic_name} logoPath={settings.logo_path} phone={settings.phone}
        patient={patient ? { fullName: patient.fullName, email: patient.email, avatarUrl: patient.avatarUrl } : null}
      />
      <main id="main" tabIndex={-1} className="flex-1 outline-none">
        {children}
      </main>
      <SiteFooter settings={settings} />
      <ExperienceTools phone={settings.phone} />
    </div>
  );
}
