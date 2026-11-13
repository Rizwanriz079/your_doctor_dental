import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ResetPasswordForm } from "@/components/account/auth-forms";
import { AuthShell } from "@/components/account/auth-shell";
import { getPatient } from "@/lib/patient";

export const metadata: Metadata = { title: "Choose a new password", robots: { index: false } };

export default async function ResetPasswordPage() {
  // The reset link signs the user in (via /auth/callback) before landing here.
  if (!(await getPatient())) redirect("/forgot-password");
  return (
    <AuthShell title="Choose a new password" description="Enter a new password for your account.">
      <ResetPasswordForm />
    </AuthShell>
  );
}
