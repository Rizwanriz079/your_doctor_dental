"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { CalendarCheck, Menu, Phone, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { ButtonLink } from "@/components/ui/button";
import { duration, easeOut } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { Logo } from "./logo";

const NAV = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
  { href: "/services", label: "Services" },
  { href: "/doctors", label: "Doctors" },
  { href: "/contact", label: "Contact" },
];

function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
}

export function SiteHeader({ clinicName, logoPath, phone }: { clinicName: string; logoPath: string | null; phone: string }) {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const drawerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close the drawer whenever the route changes.
  const [lastPath, setLastPath] = useState(pathname);
  if (lastPath !== pathname) {
    setLastPath(pathname);
    setOpen(false);
  }

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const button = menuButtonRef.current;
    const t = window.setTimeout(() => drawerRef.current?.querySelector<HTMLElement>("a,button")?.focus(), 30);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
      if (e.key === "Tab" && drawerRef.current) {
        const items = Array.from(drawerRef.current.querySelectorAll<HTMLElement>("a,button"));
        const first = items[0];
        const last = items[items.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last?.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      window.clearTimeout(t);
      document.body.style.overflow = prev;
      document.removeEventListener("keydown", onKey);
      button?.focus();
    };
  }, [open]);

  return (
    <motion.header
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: duration.medium, ease: easeOut }}
      className={cn(
        "sticky top-0 z-50 h-18 transition-[background-color,box-shadow,backdrop-filter] duration-300",
        scrolled || open
          ? "bg-white/85 shadow-[0_1px_0_rgb(23_50_77/0.06),0_8px_24px_-12px_rgb(23_50_77/0.15)] backdrop-blur-xl"
          : "bg-transparent",
      )}
    >
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-3 focus:z-[60] focus:rounded-full focus:bg-white focus:px-4 focus:py-2 focus:font-semibold focus:text-navy-800 focus:shadow-lift"
      >
        Skip to content
      </a>
      <div className="container-page flex h-full items-center justify-between gap-4">
        <Logo name={clinicName} logoPath={logoPath} className="max-w-[60%] lg:max-w-none" />

        <nav aria-label="Main" className="hidden lg:block">
          <ul className="flex items-center gap-1 rounded-full bg-white/60 p-1 ring-1 ring-navy-100/60 backdrop-blur-md">
            {NAV.map((item) => {
              const active = isActive(pathname, item.href);
              return (
                <li key={item.href} className="relative">
                  <Link
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "relative z-10 block rounded-full px-4 py-2 text-sm font-semibold transition-colors duration-200",
                      active ? "text-white" : "text-navy-700 hover:text-brand-700",
                    )}
                  >
                    {item.label}
                  </Link>
                  {active && (
                    <motion.span
                      layoutId="nav-active"
                      className="absolute inset-0 rounded-full bg-navy-800"
                      transition={{ duration: duration.normal, ease: easeOut }}
                      aria-hidden
                    />
                  )}
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="flex items-center gap-2">
          <ButtonLink href="/book-appointment" variant="primary" size="md" className="hidden sm:inline-flex">
            <CalendarCheck className="size-4" aria-hidden />
            Book Appointment
          </ButtonLink>
          <button
            ref={menuButtonRef}
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="grid size-11 place-items-center rounded-full bg-white text-navy-800 ring-1 ring-line transition-colors hover:bg-muted lg:hidden"
            aria-expanded={open}
            aria-controls="mobile-menu"
            aria-label={open ? "Close menu" : "Open menu"}
          >
            {open ? <X className="size-5" aria-hidden /> : <Menu className="size-5" aria-hidden />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              className="fixed inset-0 top-18 z-40 bg-navy-900/30 backdrop-blur-[2px] lg:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: duration.normal }}
              onClick={() => setOpen(false)}
              aria-hidden
            />
            <motion.div
              ref={drawerRef}
              id="mobile-menu"
              role="dialog"
              aria-modal="true"
              aria-label="Menu"
              className="fixed inset-x-0 top-18 z-50 max-h-[calc(100dvh-4.5rem)] overflow-y-auto rounded-b-3xl bg-white px-4 pb-6 pt-2 shadow-lift lg:hidden"
              initial={{ opacity: 0, y: -16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: duration.normal, ease: easeOut }}
            >
              <motion.ul
                className="flex flex-col"
                initial="hidden"
                animate="show"
                variants={{ hidden: {}, show: { transition: { staggerChildren: 0.05, delayChildren: 0.05 } } }}
              >
                {NAV.map((item) => {
                  const active = isActive(pathname, item.href);
                  return (
                    <motion.li
                      key={item.href}
                      variants={{ hidden: { opacity: 0, x: -10 }, show: { opacity: 1, x: 0 } }}
                      transition={{ duration: duration.normal, ease: easeOut }}
                    >
                      <Link
                        href={item.href}
                        aria-current={active ? "page" : undefined}
                        onClick={() => setOpen(false)}
                        className={cn(
                          "flex min-h-12 items-center justify-between rounded-2xl px-4 text-base font-semibold transition-colors",
                          active ? "bg-brand-50 text-brand-700" : "text-navy-800 hover:bg-muted",
                        )}
                      >
                        {item.label}
                        {active && <span className="size-2 rounded-full bg-brand-600" aria-hidden />}
                      </Link>
                    </motion.li>
                  );
                })}
              </motion.ul>
              <div className="mt-4 grid gap-2 border-t border-line pt-4">
                <ButtonLink href="/book-appointment" size="lg" className="w-full" onClick={() => setOpen(false)}>
                  <CalendarCheck className="size-5" aria-hidden />
                  Book an Appointment
                </ButtonLink>
                {phone && (
                  <a
                    href={`tel:${phone.replace(/\s+/g, "")}`}
                    className="flex min-h-12 items-center justify-center gap-2 rounded-full text-sm font-semibold text-navy-800 ring-1 ring-line hover:bg-muted"
                  >
                    <Phone className="size-4" aria-hidden />
                    Call {phone}
                  </a>
                )}
                <Link
                  href="/my-appointments"
                  onClick={() => setOpen(false)}
                  className="flex min-h-11 items-center justify-center text-sm font-semibold text-brand-700 hover:underline"
                >
                  Check a booking
                </Link>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </motion.header>
  );
}
