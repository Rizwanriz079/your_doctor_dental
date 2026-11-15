"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { useWelcomeTransition } from "./welcome-transition";
import { LogoMark } from "@/components/brand/logo-mark";
import { useMotionPreferences } from "@/components/animations/motion-preferences";

const SEEN_KEY = "dental-welcome-spin-v4-seen";
let seenInMemory = false;

/** Native dialog provides focus containment, Escape and an inert background. */
export function WelcomeIntro({ clinicName }: { clinicName: string }) {
  const { setReady } = useWelcomeTransition();
  const [leaving, setLeaving] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const pathname = usePathname();
  const { paused } = useMotionPreferences();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog || pathname !== "/" || paused) { setReady(true); return; }
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    let seen = seenInMemory;
    try { seen = seen || window.sessionStorage.getItem(SEEN_KEY) === "true"; } catch { /* In-memory fallback. */ }
    if (seen || preference.matches || window.location.hash) { setReady(true); return; }
    // Schedule once after effect setup so React Strict Mode's probe does not consume the intro.
    let reveal: ReturnType<typeof setTimeout> | undefined;
    let finish: ReturnType<typeof setTimeout> | undefined;
    const previousOverflow = document.body.style.overflow;
    const start = setTimeout(() => {
      if (!dialog.isConnected || typeof dialog.showModal !== "function") { setReady(true); return; }
      setLeaving(false);
      setReady(false);
      dialog.showModal();
      document.body.style.overflow = "hidden";
      seenInMemory = true;
      try { window.sessionStorage.setItem(SEEN_KEY, "true"); } catch { /* Session memory fallback. */ }
      reveal = setTimeout(() => { setReady(true); setLeaving(true); }, 5500);
      finish = setTimeout(() => dialog.close(), 6500);
    }, 0);
    const onClose = () => { document.body.style.overflow = previousOverflow; clearTimeout(reveal); clearTimeout(finish); setReady(true); };
    const onPreference = () => { if (preference.matches && dialog.open) dialog.close(); };
    dialog.addEventListener("close", onClose);
    preference.addEventListener("change", onPreference);
    return () => {
      clearTimeout(start);
      clearTimeout(reveal);
      clearTimeout(finish);
      dialog.removeEventListener("close", onClose);
      preference.removeEventListener("change", onPreference);
      if (dialog.open) dialog.close();
      document.body.style.overflow = previousOverflow;
    };
  }, [pathname, paused, setReady]);

  return <dialog ref={dialogRef} className={`welcome-intro welcome-spin${leaving ? " is-leaving" : ""}`} tabIndex={-1} aria-labelledby="welcome-intro-title" aria-describedby="welcome-intro-description">
    <div className="welcome-intro-content">
      <div className="welcome-mark" aria-hidden><span className="welcome-ring" /><span className="welcome-halo" /><LogoMark className="welcome-tooth" /></div>
      <p className="welcome-eyebrow">A little care. A brighter smile.</p>
      <h2 id="welcome-intro-title">{clinicName}</h2>
      <p id="welcome-intro-description">Welcome to thoughtful dental care.</p>
    </div>
  </dialog>;
}
