import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

/**
 * OAuth/email confirmation callback. Exchanges the auth code for a session
 * and redirects. The `next` param is validated to be a same-origin relative
 * path to prevent open redirects.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const nextParam = searchParams.get("next") ?? "/";

  // Only allow same-origin relative redirect targets (reject //, \\, absolute).
  let next = "/";
  try {
    const resolved = new URL(nextParam, origin);
    if (resolved.origin === origin && !nextParam.includes("\\")) {
      next = resolved.pathname + resolved.search;
    }
  } catch {
    // keep default "/"
  }

  if (code) {
    // Collect refreshed session cookies so they land on the redirect response.
    const pendingCookies: Array<{ name: string; value: string; options?: object }> = [];
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
            pendingCookies.push(...cookiesToSet);
          },
        },
      },
    );
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const response = NextResponse.redirect(`${origin}${next}`);
      pendingCookies.forEach(({ name, value, options }) =>
        response.cookies.set(name, value, options),
      );
      return response;
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth`);
}
