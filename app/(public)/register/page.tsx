import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { RegisterForm } from "@/components/account/auth-forms";
import { AuthShell, OrDivider } from "@/components/account/auth-shell";
import { GoogleButton } from "@/components/account/google-button";
import { getPatient, safeNext } from "@/lib/patient";

export const metadata: Metadata = { title: "Create an account", robots: { index: false } };

export default async function RegisterPage({ searchParams }: PageProps<"/register">) {
  const sp = await searchParams;
  const next = safeNext(typeof sp.next === "string" ? sp.next : undefined);
  if (await getPatient()) redirect(next);

  return (
    <AuthShell
      title="Create your account"
      description="Keep track of your appointments, see your booking history and book faster next time."
      footer={
        <>
          Already have an account?{" "}
          <Link href={`/login?next=${encodeURIComponent(next)}`} className="font-semibold text-brand-700 hover:underline">
            Sign in
          </Link>
        </>
      }
    >
      <GoogleButton next={next} label="Sign up with Google" />
      <OrDivider />
      <RegisterForm next={next} />
    </AuthShell>
  );
}
