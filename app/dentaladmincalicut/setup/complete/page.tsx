import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { FinishSetup } from "@/components/admin/setup/finish-setup";
import { SetupShell } from "@/components/admin/setup/setup-shell";
import { getSetupState } from "@/features/setup/queries";
import { getAdmin } from "@/lib/auth";
import { getPatient } from "@/lib/patient";

export const metadata: Metadata = { title: "Finish setup", robots: { index: false, follow: false } };

/** Landing page after the new admin confirms their email. */
export default async function FinishSetupPage() {
  if (await getAdmin()) redirect("/dentaladmincalicut/dashboard");
  const [setup, user] = await Promise.all([getSetupState(), getPatient()]);
  if (setup.state !== "needs_admin") redirect("/dentaladmincalicut/login");
  if (!user) redirect("/dentaladmincalicut/setup");
  return (
    <SetupShell>
      <FinishSetup email={user.email} />
    </SetupShell>
  );
}
