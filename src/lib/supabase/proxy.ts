import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Session refresh + route protection. Used by root proxy.ts (Next 16's
 * renamed middleware entry).
 *
 * - Refreshes the Supabase session cookie on every matching request.
 * - Redirects unauthenticated users away from protected paths.
 * - Redirects authenticated users away from /login and /signup.
 */

const PROTECTED_PREFIXES = ["/editor"];
const AUTH_PATHS = ["/login", "/signup"];

export async function updateSupabaseSession(request: NextRequest): Promise<NextResponse> {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // getClaims() validates and refreshes the session (do NOT trust getSession).
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;

  const { pathname } = request.nextUrl;
  const isProtected = PROTECTED_PREFIXES.some((p) => pathname.startsWith(p));
  const isAuthPath = AUTH_PATHS.includes(pathname);

  if (!claims && isProtected) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    const redirect = NextResponse.redirect(url);
    // Preserve any refreshed session cookies on the redirect.
    supabaseResponse.cookies.getAll().forEach((c) =>
      redirect.cookies.set(c.name, c.value, c),
    );
    return redirect;
  }

  if (claims && isAuthPath) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    url.search = "";
    const redirect = NextResponse.redirect(url);
    supabaseResponse.cookies.getAll().forEach((c) =>
      redirect.cookies.set(c.name, c.value, c),
    );
    return redirect;
  }

  return supabaseResponse;
}
