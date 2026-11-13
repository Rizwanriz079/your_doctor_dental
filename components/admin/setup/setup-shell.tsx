import type { ReactNode } from "react";
import { LogoMark } from "@/components/brand/logo-mark";

/** Standalone layout for the setup wizard (works before the clinic database exists). */
export function SetupShell({ children }: { children: ReactNode }) {
  return (
    <main className="grid min-h-dvh place-items-center bg-[radial-gradient(110%_70%_at_20%_0%,#dff1f5_0%,#eaf5f8_40%,#f5f7f8_80%)] px-4 py-10">
      <div className="w-full max-w-lg">
        <div className="mb-6 text-center">
          <LogoMark className="mx-auto mb-4 size-14 drop-shadow-[0_10px_18px_rgb(11_122_124/0.35)]" title="Your Dentist" />
          <p className="eyebrow">First-time setup</p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">Set up your clinic admin</h1>
        </div>
        <div className="rounded-3xl bg-white p-6 shadow-lift ring-1 ring-line sm:p-8">{children}</div>
      </div>
    </main>
  );
}
