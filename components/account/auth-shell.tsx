import { ShieldCheck } from "lucide-react";
import type { ReactNode } from "react";

/** Centered card used by the sign-in, register and password pages. */
export function AuthShell({
  title,
  description,
  children,
  footer,
}: {
  title: string;
  description?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <section className="relative -mt-18 overflow-hidden pb-20 pt-30">
      <div
        className="absolute inset-0 -z-10 bg-[radial-gradient(110%_70%_at_20%_0%,#dff1f5_0%,#eaf5f8_40%,#ffffff_80%)]"
        aria-hidden
      />
      <div className="container-page">
        <div className="mx-auto w-full max-w-md rounded-3xl bg-white p-6 shadow-lift ring-1 ring-line sm:p-8">
          <h1 className="text-2xl font-bold tracking-tight sm:text-[1.75rem]">{title}</h1>
          {description && <p className="mt-2 text-sm leading-relaxed text-body">{description}</p>}
          <div className="mt-6">{children}</div>
        </div>
        {footer && <div className="mx-auto mt-5 max-w-md text-center text-sm text-body">{footer}</div>}
        <p className="mx-auto mt-6 flex max-w-md items-center justify-center gap-2 text-xs text-body">
          <ShieldCheck className="size-4 text-brand-600" aria-hidden />
          Secure sign-in by Supabase Auth. We never see your Google password.
        </p>
      </div>
    </section>
  );
}

export function OrDivider() {
  return (
    <div className="my-5 flex items-center gap-3 text-xs font-semibold uppercase tracking-wider text-body" role="separator">
      <span className="h-px flex-1 bg-line" />
      or
      <span className="h-px flex-1 bg-line" />
    </div>
  );
}
