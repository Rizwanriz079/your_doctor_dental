"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { LogoMark } from "@/components/brand/logo-mark";
import { useMotionPreferences } from "@/components/animations/motion-preferences";

const SEEN_KEY = "dental-welcome-outline-v3-seen";
let seenInMemory = false;

/** Native dialog provides focus containment, Escape and an inert background. */
export function WelcomeIntro({ clinicName }: { clinicName: string }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const pathname = usePathname();
  const { paused } = useMotionPreferences();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog || pathname !== "/" || paused) return;
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    let seen = seenInMemory;
    try { seen = seen || window.sessionStorage.getItem(SEEN_KEY) === "true"; } catch { /* In-memory fallback. */ }
    if (seen || preference.matches || window.location.hash) return;
    // Schedule once after effect setup so React Strict Mode's probe does not consume the intro.
    let finish: ReturnType<typeof setTimeout> | undefined;
    const previousOverflow = document.body.style.overflow;
    const start = setTimeout(() => {
      if (!dialog.isConnected || typeof dialog.showModal !== "function") return;
      dialog.showModal();
      document.body.style.overflow = "hidden";
      seenInMemory = true;
      try { window.sessionStorage.setItem(SEEN_KEY, "true"); } catch { /* Session memory fallback. */ }
      finish = setTimeout(() => dialog.close(), 5000);
    }, 0);
    const onClose = () => { document.body.style.overflow = previousOverflow; document.querySelector(".clinic-hero")?.classList.add("intro-finished"); };
    const onPreference = () => { if (preference.matches && dialog.open) dialog.close(); };
    dialog.addEventListener("close", onClose);
    preference.addEventListener("change", onPreference);
    return () => {
      clearTimeout(start);
      clearTimeout(finish);
      dialog.removeEventListener("close", onClose);
      preference.removeEventListener("change", onPreference);
      if (dialog.open) dialog.close();
      document.body.style.overflow = previousOverflow;
    };
  }, [pathname, paused]);

  return <dialog ref={dialogRef} className="welcome-intro welcome-outline" tabIndex={-1} aria-labelledby="welcome-intro-title" aria-describedby="welcome-intro-description">
    <div className="welcome-intro-content">
      <div className="welcome-mark" aria-hidden><LogoMark className="welcome-tooth" /></div>
      <p className="welcome-eyebrow">A little care. A brighter smile.</p>
      <h2 id="welcome-intro-title">{clinicName}</h2>
      <p id="welcome-intro-description">Welcome to thoughtful dental care.</p>
    </div>
  </dialog>;
}
