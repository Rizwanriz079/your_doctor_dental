import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Refreshes the Supabase session cookie and performs an optimistic redirect for
 * /dentaladmincalicut routes. This is NOT the security boundary: the admin layout re-checks the
 * role on the server and every data operation is protected by RLS / is_admin().
 */
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  // Not configured yet (e.g. env vars missing on the host): let pages render and explain,
  // instead of crashing every request with a bare 500.
  if (!url || !key) return response;

  const supabase = createServerClient(
    url,
    key,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    },
  );

  // Verifies the JWT locally (and refreshes an expired session) without an Auth-server round trip.
  const { data } = await supabase.auth.getClaims();
  const user = data?.claims?.sub ? { id: data.claims.sub } : null;

  const { pathname } = request.nextUrl;
  const isAdminArea = pathname.startsWith("/dentaladmincalicut");
  // Pages under /dentaladmincalicut that must open without a session: login and the first-run setup wizard.
  const isAdminLogin = pathname === "/dentaladmincalicut/login" || pathname === "/dentaladmincalicut/setup";

  if (isAdminArea && !isAdminLogin && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/dentaladmincalicut/login";
    url.search = `?next=${encodeURIComponent(pathname)}`;
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  // Every page, so signed-in patients and admins keep a fresh session cookie.
  // Static files and images are skipped.
  matcher: ["/((?!_next/static|_next/image|images/|favicon.ico|robots.txt|sitemap.xml|.*\\.(?:png|jpg|jpeg|svg|webp|avif|ico)$).*)"],
};
