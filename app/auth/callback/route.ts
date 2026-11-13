import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { safeNext } from "@/lib/patient";
import { createClient } from "@/lib/supabase/server";

/**
 * Landing point for Supabase Auth redirects: Google sign-in, email confirmation and
 * password-reset links. Exchanges the one-time code for a session cookie, links any
 * earlier guest bookings made with the (now verified) email, then continues to `next`.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const next = safeNext(searchParams.get("next"));
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const supabase = await createClient();

  let ok = false;
  if (code) {
    ok = !(await supabase.auth.exchangeCodeForSession(code)).error;
  } else if (tokenHash && type) {
    ok = !(await supabase.auth.verifyOtp({ token_hash: tokenHash, type })).error;
  }

  if (!ok) {
    const description = searchParams.get("error_description");
    const url = new URL("/login", origin);
    url.searchParams.set("error", description ? "provider" : "link");
    return NextResponse.redirect(url);
  }

  await supabase.rpc("patient_link_bookings");
  return NextResponse.redirect(new URL(next, origin));
}
