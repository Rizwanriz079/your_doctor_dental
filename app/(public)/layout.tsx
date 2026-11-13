import { SiteFooter } from "@/components/public/site-footer";
import { SiteHeader } from "@/components/public/site-header";
import { getSettings } from "@/features/public/queries";
import { getPatient } from "@/lib/patient";

export default async function PublicLayout({ children }: LayoutProps<"/">) {
  const [settings, patient] = await Promise.all([getSettings(), getPatient()]);
  return (
    <div className="flex min-h-dvh flex-col overflow-x-clip">
      <SiteHeader clinicName={settings.clinic_name} logoPath={settings.logo_path} phone={settings.phone}
        patient={patient ? { fullName: patient.fullName, email: patient.email, avatarUrl: patient.avatarUrl } : null}
      />
      <main id="main" className="flex-1">
        {children}
      </main>
      <SiteFooter settings={settings} />
    </div>
  );
}
