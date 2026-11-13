import Link from "next/link";
import Image from "next/image";
import { cn, mediaUrl } from "@/lib/utils";

/** Original tooth mark: a soft rounded molar outline with a highlight arc. */
export function ToothMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden fill="none">
      <rect width="32" height="32" rx="10" fill="url(#tm-bg)" />
      <path
        d="M10.4 8.2c1.9-.9 3.6-.3 5.6.6 2-.9 3.7-1.5 5.6-.6 2.4 1.1 3.1 4 2.4 6.8-.5 2-1.3 3.3-1.7 5.6-.4 2.4-.8 4.6-2.2 4.6-1.6 0-1.6-3.7-2.5-5.4-.4-.8-1-.8-1.4 0-.9 1.7-.9 5.4-2.5 5.4-1.4 0-1.8-2.2-2.2-4.6-.4-2.3-1.2-3.6-1.7-5.6-.7-2.8 0-5.7 2.6-6.8Z"
        fill="#fff"
      />
      <path d="M12 11.2c1.1-.6 2.3-.4 3.4.2" stroke="#9fd7d8" strokeWidth="1.4" strokeLinecap="round" />
      <defs>
        <linearGradient id="tm-bg" x1="0" y1="0" x2="32" y2="32">
          <stop stopColor="#2fa3a5" />
          <stop offset="1" stopColor="#0b4e50" />
        </linearGradient>
      </defs>
    </svg>
  );
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
