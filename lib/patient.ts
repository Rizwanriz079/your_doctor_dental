import "server-only";
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";

/**
 * A signed-in patient, read entirely from their Supabase Auth session.
 * Identity and details come from the verified JWT (email + user_metadata);
 * there is no separate patient profile table.
 */
export type PatientSession = {
  id: string;
  email: string;
  fullName: string;
  phone: string;
  avatarUrl: string | null;
  /** When the patient last dismissed the "booking updates" popup (ISO), if ever. */
  updatesSeenAt: string | null;
};

export const getPatient = cache(async (): Promise<PatientSession | null> => {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  const claims = data?.claims;
  if (error || !claims?.sub) return null;
  const meta = (claims.user_metadata ?? {}) as Record<string, unknown>;
  const str = (v: unknown) => (typeof v === "string" ? v : "");
  const email = str(claims.email);
  return {
    id: claims.sub,
    email,
    // Google provides full_name / name; email sign-ups store full_name at registration.
    fullName: str(meta.full_name) || str(meta.name) || email.split("@")[0],
    phone: str(meta.phone),
    avatarUrl: str(meta.avatar_url) || str(meta.picture) || null,
    updatesSeenAt: str(meta.updates_seen_at) || null,
  };
});

/** Only allow redirects back into this site (prevents open-redirects via ?next=). */
export function safeNext(next: string | null | undefined, fallback = "/my-appointments") {
  if (next === "/admin/setup/complete") return next; // first-run admin setup (email confirmation)
  if (!next || !next.startsWith("/") || next.startsWith("//") || next.includes("\\") || next.startsWith("/admin")) return fallback;
  return next;
}
