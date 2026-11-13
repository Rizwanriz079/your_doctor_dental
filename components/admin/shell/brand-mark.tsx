import Image from "next/image";
import { cn, mediaUrl } from "@/lib/utils";

/** Clinic logo: uploaded logo if configured, otherwise an original tooth mark. */
export function BrandMark({ logoPath, className }: { logoPath?: string | null; className?: string }) {
  const src = mediaUrl(logoPath);
  if (src) {
    return (
      <span className={cn("relative block size-9 overflow-hidden rounded-xl", className)}>
        <Image src={src} alt="" fill sizes="36px" className="object-contain" />
      </span>
    );
  }
  return (
    <span
      className={cn(
        "grid size-9 place-items-center rounded-xl bg-gradient-to-br from-brand-500 to-navy-800 text-white shadow-[0_6px_16px_-6px_rgb(11_122_124/0.7)]",
        className,
      )}
      aria-hidden
    >
      <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinejoin="round">
        <path d="M7.5 3.5c-2.4 0-4 1.9-4 4.6 0 2.4 1 3.7 1.6 6 .6 2.5.9 6.4 2.6 6.4 1.6 0 1.6-4.5 4.3-4.5s2.7 4.5 4.3 4.5c1.7 0 2-3.9 2.6-6.4.6-2.3 1.6-3.6 1.6-6 0-2.7-1.6-4.6-4-4.6-1.9 0-2.9 1-4.5 1s-2.6-1-4.5-1Z" />
      </svg>
    </span>
  );
}
