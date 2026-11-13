import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { FinishSetup } from "@/components/admin/setup/finish-setup";
import { SetupShell } from "@/components/admin/setup/setup-shell";
import { getPatient } from "@/lib/patient";
import { SetupWizard } from "@/components/admin/setup/setup-wizard";
import { getSetupState, supabaseHost } from "@/features/setup/queries";

export const metadata: Metadata = { title: "Clinic setup", robots: { index: false, follow: false } };

/** First-run wizard. Closed for good once a super admin exists (enforced in the database). */
export default async function SetupPage({ searchParams }: PageProps<"/dentaladmincalicut/setup">) {
  const { confirmed } = await searchParams;
  const setup = await getSetupState();
  if (setup.state === "ready") redirect("/dentaladmincalicut/login");

  // Already signed in (e.g. confirmed the email, or signed in on the patient site):
  // offer to make this account the super admin instead of creating another one.
  const user = setup.state === "needs_admin" ? await getPatient() : null;
  if (user) {
    return (
      <SetupShell>
        <FinishSetup email={user.email} signedIn />
      </SetupShell>
    );
  }

  return (
    <SetupShell>
      <SetupWizard setup={setup} host={supabaseHost()} emailConfirmed={confirmed === "1"} />
    </SetupShell>
  );
}
