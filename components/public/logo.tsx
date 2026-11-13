import Link from "next/link";
import Image from "next/image";
import { LogoMark } from "@/components/brand/logo-mark";
import { cn, mediaUrl } from "@/lib/utils";

/** Kept for existing imports; renders the shared brand mark. */
export function ToothMark({ className }: { className?: string }) {
  return <LogoMark className={className} />;
}

export function Logo({
  name,
  logoPath,
  className,
  tone = "dark",
}: {
  name: string;
  logoPath?: string | null;
  className?: string;
  tone?: "dark" | "light";
}) {
  const src = mediaUrl(logoPath);
  return (
    <Link
      href="/"
      className={cn("flex min-w-0 items-center gap-2.5 rounded-lg", className)}
      aria-label={`${name} — home`}
    >
      {src ? (
        <span className="relative size-9 shrink-0">
          <Image src={src} alt="" fill sizes="36px" className="object-contain" />
        </span>
      ) : (
        <ToothMark className="size-9 shrink-0" />
      )}
      <span
        className={cn(
          "truncate text-lg font-bold tracking-tight",
          tone === "dark" ? "text-navy-800" : "text-white",
        )}
      >
        {name}
      </span>
    </Link>
  );
}
