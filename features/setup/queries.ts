import "server-only";
import { createClient } from "@/lib/supabase/server";

export type SetupState =
  | { state: "not_configured" } // no Supabase URL/key given to the app
  | { state: "unreachable"; detail: string } // Supabase project could not be reached
  | { state: "database_missing" } // project reachable, but the clinic schema isn't installed
  | { state: "needs_admin" } // ready for the first super admin
  | { state: "ready" }; // setup finished: wizard closed

export function supabaseHost() {
  try {
    return new URL(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").host;
  } catch {
    return null;
  }
}

/** Checks the connection to Supabase and whether the first admin still needs to be created. */
export async function getSetupState(): Promise<SetupState> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) {
    return { state: "not_configured" };
  }
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc("setup_status");
    if (error) {
      // PGRST202 = function not found -> schema not installed yet.
      if (error.code === "PGRST202" || error.code === "PGRST205" || error.code === "42883") return { state: "database_missing" };
      return { state: "unreachable", detail: error.message };
    }
    const status = data as { needs_admin?: boolean } | null;
    return status?.needs_admin ? { state: "needs_admin" } : { state: "ready" };
  } catch (e) {
    return { state: "unreachable", detail: e instanceof Error ? e.message : "Network error" };
  }
}
