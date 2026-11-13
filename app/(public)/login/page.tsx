import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { SignInForm } from "@/components/account/auth-forms";
import { AuthShell, OrDivider } from "@/components/account/auth-shell";
import { GoogleButton } from "@/components/account/google-button";
import { getPatient, safeNext } from "@/lib/patient";

export const metadata: Metadata = { title: "Sign in", robots: { index: false } };

const ERRORS: Record<string, string> = {
  link: "That sign-in link is invalid or has expired. Please try again.",
  provider: "Google sign-in was cancelled or failed. Please try again.",
};

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const sp = await searchParams;
  const next = safeNext(typeof sp.next === "string" ? sp.next : undefined);
  if (await getPatient()) redirect(next);
  const error = typeof sp.error === "string" ? ERRORS[sp.error] : undefined;

  return (
    <AuthShell
      title="Sign in"
      description="See all your bookings in one place and book faster next time."
      footer={
        <>
          New here?{" "}
          <Link href={`/register?next=${encodeURIComponent(next)}`} className="font-semibold text-brand-700 hover:underline">
            Create an account
          </Link>
          <span className="mx-2 text-navy-300">·</span>
          <Link href="/book-appointment" className="font-semibold text-brand-700 hover:underline">
            Book without an account
          </Link>
        </>
      }
    >
      {error && (
        <p role="alert" className="mb-4 rounded-xl bg-danger-50 px-3.5 py-3 text-sm text-danger-700">
          {error}
        </p>
      )}
      <GoogleButton next={next} />
      <OrDivider />
      <SignInForm next={next} />
    </AuthShell>
  );
}
