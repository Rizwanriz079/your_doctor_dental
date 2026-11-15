"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { motion, useScroll, useSpring } from "motion/react";
import { ArrowUp } from "lucide-react";
import { useSafeReducedMotion } from "@/lib/use-reduced-motion";

export function ExperienceTools() {
  const pathname = usePathname();
  const reduce = useSafeReducedMotion();
  const [showTop, setShowTop] = useState(false);
  const { scrollYProgress } = useScroll();
  const progress = useSpring(scrollYProgress, { stiffness: 180, damping: 35 });
  const bookingPage = pathname.startsWith("/book-appointment");
  useEffect(() => {
    const update = () => setShowTop(window.scrollY > 500);
    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, []);
  return <>
    <motion.div className="pointer-events-none fixed inset-x-0 top-0 z-[60] h-0.5 origin-left bg-brand-500" style={{ scaleX: reduce ? scrollYProgress : progress }} aria-hidden />
    <div className="fixed bottom-5 right-4 z-30 hidden sm:block">
      {showTop && !bookingPage && <button type="button" onClick={() => { window.scrollTo({ top: 0, behavior: reduce ? "instant" : "smooth" }); document.getElementById("main")?.focus({ preventScroll: true }); }} className="grid size-11 place-items-center rounded-full border border-line bg-white/95 text-brand-700 shadow-soft" aria-label="Back to top"><ArrowUp className="size-5" aria-hidden /></button>}
    </div>

  </>;
}
