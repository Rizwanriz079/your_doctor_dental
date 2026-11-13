import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { SetupShell } from "@/components/admin/setup/setup-shell";
import { SetupWizard } from "@/components/admin/setup/setup-wizard";
import { getSetupState, supabaseHost } from "@/features/setup/queries";

export const metadata: Metadata = { title: "Clinic setup", robots: { index: false, follow: false } };

/** First-run wizard. Closed for good once a super admin exists (enforced in the database). */
export default async function SetupPage() {
  const setup = await getSetupState();
  if (setup.state === "ready") redirect("/admin/login");
  return (
    <SetupShell>
      <SetupWizard setup={setup} host={supabaseHost()} />
    </SetupShell>
  );
}
