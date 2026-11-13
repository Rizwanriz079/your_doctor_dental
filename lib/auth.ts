import "server-only";
import { redirect } from "next/navigation";
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";

export type AdminSession = {
  userId: string;
  email: string;
  fullName: string;
};

/** Returns the signed-in super admin, or null. Verified against Supabase Auth + profiles. */
export const getAdmin = cache(async (): Promise<AdminSession | null> => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profile } = await supabase
    .from("profiles")
    .select("role, full_name, email")
    .eq("id", user.id)
    .maybeSingle();
  if (profile?.role !== "super_admin") return null;
  return {
    userId: user.id,
    email: profile.email ?? user.email ?? "",
    fullName: profile.full_name ?? "Admin",
  };
});

/** Use at the top of every admin page / server action. Redirects when not authorised. */
export async function requireAdmin(): Promise<AdminSession> {
  const admin = await getAdmin();
  if (!admin) redirect("/admin/login");
  return admin;
}

/** For server actions: returns an error result instead of redirecting. */
export async function assertAdmin(): Promise<AdminSession> {
  const admin = await getAdmin();
  if (!admin) throw new Error("Not authorised");
  return admin;
}
