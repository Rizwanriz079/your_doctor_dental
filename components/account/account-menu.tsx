"use client";

import { AnimatePresence, motion } from "motion/react";
import { CalendarDays, ChevronDown, LogIn, LogOut } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { signOut } from "@/features/account/actions";
import { duration, easeOut } from "@/lib/motion";
import { initials } from "@/lib/utils";

export type HeaderPatient = { fullName: string; email: string; avatarUrl: string | null } | null;

export function PatientAvatar({ patient, size = 32 }: { patient: NonNullable<HeaderPatient>; size?: number }) {
  return (
    <span
      className="relative grid shrink-0 place-items-center overflow-hidden rounded-full bg-brand-100 text-xs font-bold text-brand-700"
      style={{ width: size, height: size }}
      aria-hidden
    >
      {patient.avatarUrl ? (
        <Image src={patient.avatarUrl} alt="" fill sizes={`${size}px`} className="object-cover" unoptimized />
      ) : (
        initials(patient.fullName)
      )}
    </span>
  );
}

/** Desktop header control: "Sign in" link, or the signed-in patient's menu. */
export function AccountMenu({ patient }: { patient: HeaderPatient }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (!patient) {
    return (
      <Link
        href="/login"
        className="hidden h-11 items-center gap-2 rounded-full px-4 text-sm font-semibold text-navy-800 transition-colors hover:bg-white/70 sm:inline-flex"
      >
        <LogIn className="size-4" aria-hidden /> Sign in
      </Link>
    );
  }

  return (
    <div ref={ref} className="relative hidden sm:block">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="menu"
        className="flex h-11 items-center gap-2 rounded-full bg-white/80 pl-1.5 pr-3 ring-1 ring-line transition-colors hover:bg-white"
      >
        <PatientAvatar patient={patient} />
        <span className="max-w-[8rem] truncate text-sm font-semibold text-navy-800">{patient.fullName.split(" ")[0]}</span>
        <ChevronDown className="size-4 text-body" aria-hidden />
        <span className="sr-only">Account menu</span>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            role="menu"
            className="absolute right-0 top-[calc(100%+0.5rem)] z-50 w-64 overflow-hidden rounded-2xl bg-white shadow-lift ring-1 ring-line"
            initial={{ opacity: 0, scale: 0.96, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: -4 }}
            transition={{ duration: duration.fast, ease: easeOut }}
            style={{ transformOrigin: "top right" }}
          >
            <div className="border-b border-line px-4 py-3">
              <p className="truncate text-sm font-bold text-navy-800">{patient.fullName}</p>
              <p className="truncate text-xs text-body">{patient.email}</p>
            </div>
            <Link
              role="menuitem"
              href="/my-appointments"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 px-4 py-3 text-sm font-semibold text-navy-800 hover:bg-muted"
            >
              <CalendarDays className="size-4 text-brand-600" aria-hidden /> My bookings
            </Link>
            <form action={signOut}>
              <button
                role="menuitem"
                type="submit"
                className="flex w-full items-center gap-2.5 px-4 py-3 text-left text-sm font-semibold text-danger-700 hover:bg-danger-50"
              >
                <LogOut className="size-4" aria-hidden /> Sign out
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
