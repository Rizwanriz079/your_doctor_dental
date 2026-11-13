import "server-only";
import { redirect } from "next/navigation";
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";

export type AdminSession = {
  userId: string;
  email: string;
  fullName: string;
  /** Storage path of the admin's photo (Supabase Auth user_metadata.avatar_url), if set. */
  avatarPath: string | null;
};

/**
 * Returns the signed-in super admin, or null.
 * getClaims() verifies the session JWT's signature locally against the project's public
 * signing keys (cached), avoiding an Auth-server round trip on every request. The role is
 * then read from `profiles`, a query that itself runs under RLS with the same verified token.
 */
export const getAdmin = cache(async (): Promise<AdminSession | null> => {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub;
  if (error || !userId) return null;
  const { data: profile } = await supabase
    .from("profiles")
    .select("role, full_name, email")
    .eq("id", userId)
    .maybeSingle();
  if (profile?.role !== "super_admin") return null;
  return {
    userId,
    email: profile.email ?? (typeof data.claims.email === "string" ? data.claims.email : ""),
    fullName: profile.full_name ?? "Admin",
    avatarPath: avatarFromClaims(data.claims.user_metadata),
  };
});

function avatarFromClaims(meta: unknown): string | null {
  const v = meta && typeof meta === "object" ? (meta as Record<string, unknown>).avatar_url : null;
  return typeof v === "string" && v.startsWith("avatars/") ? v : null;
}

/** Use at the top of every admin page / server action. Redirects when not authorised. */
export async function requireAdmin(): Promise<AdminSession> {
  const admin = await getAdmin();
  if (!admin) redirect("/dentaladmincalicut/login");
  return admin;
}

/** For server actions: returns an error result instead of redirecting. */
export async function assertAdmin(): Promise<AdminSession> {
  const admin = await getAdmin();
  if (!admin) throw new Error("Not authorised");
  return admin;
}
