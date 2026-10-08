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

  const pathname = req.nextUrl.pathname;
  const isPublic = pathname.startsWith("/c/");
  const isLogin = pathname === "/login";
  const isFrozenPage = pathname === "/congelado";
  const isAdminArea = pathname === "/admin" || pathname.startsWith("/admin/");

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

  // Descobre o papel do usuario (admin ou loja).
  let isAdmin = false;
  let frozen = false;
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role, stores(frozen)")
      .eq("id", user.id)
      .maybeSingle();
    const store = Array.isArray(profile?.stores) ? profile?.stores[0] : profile?.stores;
    isAdmin = profile?.role === "admin";
    frozen = Boolean(store?.frozen);
  }

  // O admin tem uma area separada: nunca entra no sistema de catalogo.
  if (user && isAdmin && !isAdminArea) {
    return applySecurityHeaders(
      NextResponse.redirect(new URL("/admin", req.url)),
    );
  }

  // Rotas do painel exigem admin.
  if (user && isAdminArea && !isAdmin) {
    return applySecurityHeaders(
      NextResponse.redirect(new URL("/", req.url)),
    );
  }

  if (user && isLogin)
    return applySecurityHeaders(
      NextResponse.redirect(new URL(isAdmin ? "/admin" : "/", req.url)),
    );

  // Bloqueia o acesso de lojas congeladas (exceto a propria pagina de aviso).
  if (user && !isFrozenPage && !isAdmin && frozen) {
    return applySecurityHeaders(
      NextResponse.redirect(new URL("/congelado", req.url)),
    );
  }

  return applySecurityHeaders(res);
}
