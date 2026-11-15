"use client";
import { createContext, useContext, useEffect, type ReactNode } from "react";
const Preferences = createContext({ paused: false, toggle: () => {} });
/** OS reduced motion remains authoritative; legacy pause storage is retired. */
export function MotionPreferences({ children }: { children: ReactNode }) {
  useEffect(() => {
    delete document.documentElement.dataset.motionPaused;
    try { window.localStorage.removeItem("dental-motion-paused"); } catch { /* Optional storage. */ }
  }, []);
  return <Preferences.Provider value={{paused:false,toggle:()=>{}}}>{children}</Preferences.Provider>;
}
export const useMotionPreferences = () => useContext(Preferences);
