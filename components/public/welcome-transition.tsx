"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

const WelcomeTransition = createContext({ ready: true, setReady: (_ready: boolean) => {} });

/** The intro and hero share one handover rather than replaying separate entrances. */
export function WelcomeTransitionProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  return <WelcomeTransition.Provider value={{ ready, setReady }}>{children}</WelcomeTransition.Provider>;
}

export const useWelcomeTransition = () => useContext(WelcomeTransition);
