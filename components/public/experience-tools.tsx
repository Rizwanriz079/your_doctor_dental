"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { motion, useScroll, useSpring } from "motion/react";
import { ArrowUp, CalendarCheck, Phone } from "lucide-react";
import { useSafeReducedMotion } from "@/lib/use-reduced-motion";

export function ExperienceTools({ phone }: { phone: string }) {
  const pathname = usePathname();
  const reduce = useSafeReducedMotion();
  const [showTop, setShowTop] = useState(false);
  const { scrollYProgress } = useScroll();
  const progress = useSpring(scrollYProgress, { stiffness: 180, damping: 35 });
  const bookingPage = pathname.startsWith("/book-appointment");
  const showBookingBar = ["/", "/about", "/contact"].includes(pathname) || pathname.startsWith("/services") || pathname.startsWith("/doctors");
  useEffect(() => {
    const update = () => setShowTop(window.scrollY > 500);
    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, []);
  return <>
    <motion.div className="pointer-events-none fixed inset-x-0 top-0 z-[60] h-0.5 origin-left bg-brand-500" style={{ scaleX: reduce ? scrollYProgress : progress }} aria-hidden />
    <div className={`fixed right-4 z-30 flex flex-col items-end gap-2 ${showBookingBar ? "bottom-24 sm:bottom-5" : "bottom-5"}`}>
      {showTop && !bookingPage && <button type="button" onClick={() => { window.scrollTo({ top: 0, behavior: reduce ? "instant" : "smooth" }); document.getElementById("main")?.focus({ preventScroll: true }); }} className="grid size-11 place-items-center rounded-full border border-line bg-white/95 text-brand-700 shadow-soft" aria-label="Back to top"><ArrowUp className="size-5" aria-hidden /></button>}
    </div>
    {showBookingBar && <>
      <div className="h-24 sm:hidden" aria-hidden />
      <nav aria-label="Quick appointment actions" className="mobile-booking-bar fixed inset-x-0 bottom-0 z-40 flex gap-3 border-t border-line bg-white/95 px-4 pt-3 backdrop-blur-xl sm:hidden">
        {phone && <a href={`tel:${phone.replace(/\s+/g, "")}`} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-line px-5 text-sm font-semibold text-navy-800"><Phone className="size-4" aria-hidden />Call</a>}
        <Link href="/book-appointment" className="inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-full bg-brand-600 px-5 text-sm font-semibold text-white"><CalendarCheck className="size-4" aria-hidden />Book a visit</Link>
      </nav>
    </>}
  </>;
}
