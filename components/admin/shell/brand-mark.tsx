import Image from "next/image";
import { LogoMark } from "@/components/brand/logo-mark";
import { cn, mediaUrl } from "@/lib/utils";

/** Clinic logo: uploaded logo if configured, otherwise the built-in "Your Dentist" mark. */
export function BrandMark({ logoPath, className }: { logoPath?: string | null; className?: string }) {
  const src = mediaUrl(logoPath);
  if (src) {
    return (
      <span className={cn("relative block size-9 overflow-hidden rounded-xl", className)}>
        <Image src={src} alt="" fill sizes="36px" className="object-contain" />
      </span>
    );
  }
  return <LogoMark className={cn("block size-9 drop-shadow-[0_6px_10px_rgb(11_122_124/0.35)]", className)} />;
}
