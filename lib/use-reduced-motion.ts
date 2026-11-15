"use client";

import { useMotionPreferences } from "@/components/animations/motion-preferences";
import { useReducedMotion } from "motion/react";
import { useSyncExternalStore } from "react";

const subscribe = () => () => {};

/**
 * Hydration-safe reduced-motion flag: `false` during SSR and the hydration render
 * (so server and client markup match), then the user's real preference.
 * The global <MotionConfig reducedMotion="user"> already strips movement either way.
 */
export function useSafeReducedMotion(): boolean {
  const { paused } = useMotionPreferences();
  const prefersReduced = useReducedMotion();
  const hydrated = useSyncExternalStore(subscribe, () => true, () => false);
  return paused || (hydrated && Boolean(prefersReduced));
}
