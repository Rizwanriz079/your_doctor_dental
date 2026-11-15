import type { ReactNode } from "react";

/** CSS entrance keeps server-rendered content readable before hydration. */
export default function PublicTemplate({ children }: { children: ReactNode }) {
  return <div className="page-arrival">{children}</div>;
}
