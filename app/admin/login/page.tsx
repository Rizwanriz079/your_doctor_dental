import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { CalendarCheck2, ShieldCheck, Stethoscope } from "lucide-react";
import { BrandMark } from "@/components/admin/shell/brand-mark";
import { getAdmin } from "@/lib/auth";
import { getSettings } from "@/features/public/queries";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Admin sign in", robots: { index: false, follow: false } };

export default async function AdminLoginPage({ searchParams }: PageProps<"/admin/login">) {
  const [admin, settings, params] = await Promise.all([getAdmin(), getSettings(), searchParams]);
  const next = typeof params.next === "string" ? params.next : undefined;
  if (admin) redirect(next?.startsWith("/admin") && !next.startsWith("//") ? next : "/admin/dashboard");

  return (
    <main className="grid min-h-dvh bg-muted lg:grid-cols-[1.05fr_1fr]">
      <section className="relative hidden overflow-hidden bg-navy-800 p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-24 -top-24 size-[28rem] rounded-full bg-brand-500/30 blur-3xl"
        />
        <div aria-hidden className="pointer-events-none absolute -bottom-32 -left-20 size-[26rem] rounded-full bg-sky-soft/10 blur-3xl" />
        <div className="relative flex items-center gap-3">
          <BrandMark logoPath={settings.logo_path} />
          <span className="text-lg font-bold">{settings.clinic_name}</span>
        </div>
        <div className="relative max-w-md">
          <p className="eyebrow !text-brand-200">Clinic management</p>
          <h1 className="mt-3 text-4xl font-bold leading-tight tracking-tight !text-white">
            Everything your front desk needs, in one calm place.
          </h1>
          <ul className="mt-10 space-y-4 text-navy-100">
            {[
              { icon: CalendarCheck2, text: "Live booking notifications and appointment workflow" },
              { icon: Stethoscope, text: "Doctors, schedules and daily capacity under your control" },
              { icon: ShieldCheck, text: "Patient data protected by role-based access" },
            ].map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-3">
                <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-white/10">
                  <Icon className="size-4.5" aria-hidden />
                </span>
                {text}
              </li>
            ))}
          </ul>
        </div>
        <p className="relative text-sm text-navy-300">Authorised staff only. Activity is recorded.</p>
      </section>

      <section className="flex items-center justify-center px-4 py-12 sm:px-8">
        <div className="w-full max-w-md">
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <BrandMark logoPath={settings.logo_path} />
            <span className="text-lg font-bold text-navy-800">{settings.clinic_name}</span>
          </div>
          <div className="rounded-3xl border border-line bg-white p-6 shadow-soft sm:p-8">
            <h2 className="text-2xl font-bold tracking-tight">Admin sign in</h2>
            <p className="mt-1 text-sm text-body">Sign in with your clinic administrator account.</p>
            <LoginForm next={next} />
          </div>
        </div>
      </section>
    </main>
  );
}
