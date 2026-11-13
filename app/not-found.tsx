import Link from "next/link";
import { ButtonLink } from "@/components/ui/button";
import { ToothMark } from "@/components/public/logo";

export default function NotFound() {
  return (
    <main className="grid min-h-dvh place-items-center bg-[radial-gradient(100%_80%_at_50%_0%,#dff1f5_0%,#ffffff_70%)] px-4 py-20 text-center">
      <div className="max-w-md">
        <Link href="/" aria-label="Home" className="inline-block rounded-xl">
          <ToothMark className="mx-auto size-14" />
        </Link>
        <p className="eyebrow mt-8">Error 404</p>
        <h1 className="mt-3 text-3xl font-bold sm:text-4xl">We couldn&apos;t find that page</h1>
        <p className="mt-3">The page may have moved, or the doctor or service is no longer listed.</p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <ButtonLink href="/">Back to home</ButtonLink>
          <ButtonLink href="/book-appointment" variant="secondary">
            Book an appointment
          </ButtonLink>
        </div>
      </div>
    </main>
  );
}
