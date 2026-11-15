"use client";

import { createContext, useContext, useEffect, useSyncExternalStore, type ReactNode } from "react";

const KEY = "dental-motion-paused";
const EVENT = "dental-motion-change";
let memoryPaused = false;
let useMemory = false;
function subscribe(callback: () => void) {
  window.addEventListener(EVENT, callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener(EVENT, callback);
    window.removeEventListener("storage", callback);
  };
}
function snapshot() {
  if (useMemory) return memoryPaused;
  try { return window.localStorage.getItem(KEY) === "true"; } catch { return memoryPaused; }
}
const Preferences = createContext({ paused: false, toggle: () => {} });

export function MotionPreferences({ children }: { children: ReactNode }) {
  const paused = useSyncExternalStore(subscribe, snapshot, () => false);
  useEffect(() => {
    document.documentElement.dataset.motionPaused = String(paused);
    return () => { delete document.documentElement.dataset.motionPaused; };
  }, [paused]);
  function toggle() {
    memoryPaused = !paused;
    try { window.localStorage.setItem(KEY, String(memoryPaused)); } catch { useMemory = true; }
    window.dispatchEvent(new Event(EVENT));
  }
  return <Preferences.Provider value={{ paused, toggle }}>{children}</Preferences.Provider>;
}

export const useMotionPreferences = () => useContext(Preferences);
