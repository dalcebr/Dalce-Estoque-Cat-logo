import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const securityHeaders: Record<string, string> = {
  "X-Frame-Options": "DENY",
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=(), payment=()",
  "Strict-Transport-Security":
    "max-age=63072000; includeSubDomains; preload",
};

function applySecurityHeaders(res: NextResponse): NextResponse {
  for (const [key, value] of Object.entries(securityHeaders)) {
    res.headers.set(key, value);
  }
  return res;
}

export async function updateSession(req: NextRequest) {
  let res = NextResponse.next({ request: req });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => req.cookies.getAll(),
        setAll(
          cookiesToSet: {
            name: string;
            value: string;
            options: CookieOptions;
          }[],
        ) {
          cookiesToSet.forEach(({ name, value }) =>
            req.cookies.set(name, value),
          );
          res = NextResponse.next({ request: req });
          cookiesToSet.forEach(({ name, value, options }) =>
            res.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const isPublic = req.nextUrl.pathname.startsWith("/c/");
  const isLogin = req.nextUrl.pathname === "/login";

  // Public catalog routes: apply security headers, skip auth
  if (isPublic) {
    return applySecurityHeaders(res);
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user && !isLogin)
    return applySecurityHeaders(
      NextResponse.redirect(new URL("/login", req.url)),
    );
  if (user && isLogin)
    return applySecurityHeaders(
      NextResponse.redirect(new URL("/", req.url)),
    );

  return applySecurityHeaders(res);
}
