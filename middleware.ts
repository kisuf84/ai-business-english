import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getProductLandingRewritePath, getLangslateProductForHostname, LANGSLATE_ADMIN_ORIGIN } from "./lib/langslateDomains.mjs";

export async function middleware(request: NextRequest) {
  const hostname = request.headers.get("host");
  const pathname = request.nextUrl.pathname;
  const productLanding = pathname === "/" ? getProductLandingRewritePath(hostname) : null;

  if (productLanding) {
    const landingUrl = new URL(productLanding, request.url);
    landingUrl.search = request.nextUrl.search;
    return NextResponse.rewrite(landingUrl);
  }

  // Keep the single administration experience on its canonical Vercel host.
  // Admin pages still perform their existing server-side authorization there.
  if (
    getLangslateProductForHostname(hostname) &&
    (pathname === "/admin" || pathname.startsWith("/admin/"))
  ) {
    const canonicalAdminUrl = new URL(`${pathname}${request.nextUrl.search}`, LANGSLATE_ADMIN_ORIGIN);
    return NextResponse.redirect(canonicalAdminUrl);
  }

  let response = NextResponse.next({ request });
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) return response;

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet: Array<{ name: string; value: string; options: CookieOptions }>) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  // Validate and refresh the session cookie. Authorization remains enforced
  // in the admin layout and every admin API route.
  await supabase.auth.getUser();
  return response;
}

export const config = {
  matcher: ["/", "/admin/:path*", "/api/admin/:path*", "/auth/:path*"],
};
