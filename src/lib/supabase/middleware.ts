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
  const isAdminLogin = pathname === "/admin/login";
  const isFrozenPage = pathname === "/congelado";
  const isAdminArea = pathname === "/admin" || pathname.startsWith("/admin/");

  // Public catalog routes: apply security headers, skip auth
  if (isPublic) {
    return applySecurityHeaders(res);
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // O painel tem login próprio: quem não está autenticado e tenta acessar
  // /admin/* vai para /admin/login (e não para o login da loja).
  if (!user && !isLogin && !isAdminLogin)
    return applySecurityHeaders(
      NextResponse.redirect(
        new URL(isAdminArea ? "/admin/login" : "/login", req.url),
      ),
    );

  // Descobre o papel do usuario (admin ou loja).
  let isAdmin = false;
  let frozen = false;
  if (user) {
    // Papel via funcao security definer (nao depende de RLS).
    // Fallback: se a funcao ainda nao existir, le direto de `profiles`.
    const { data: rpcRole, error: rpcError } = await supabase.rpc("current_role_name");
    if (!rpcError) {
      isAdmin = rpcRole === "admin";
    } else {
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .maybeSingle();
      isAdmin = profile?.role === "admin";
    }

    // Estado de congelamento da loja (apenas para lojas comuns).
    if (!isAdmin) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("stores(frozen)")
        .eq("id", user.id)
        .maybeSingle();
      const store = Array.isArray(profile?.stores) ? profile?.stores[0] : profile?.stores;
      frozen = Boolean(store?.frozen);
    }
  }

  // O admin tem uma area separada: nunca entra no sistema de catalogo.
  // Exceção: a própria tela de login do painel (para não criar loop).
  if (user && isAdmin && !isAdminArea && !isLogin) {
    return applySecurityHeaders(
      NextResponse.redirect(new URL("/admin", req.url)),
    );
  }

  // Rotas do painel exigem admin. A tela de login do painel é acessível
  // apenas por quem NÃO está logado como admin (senão vai para o painel).
  if (user && isAdminArea && !isAdmin && !isAdminLogin) {
    return applySecurityHeaders(
      NextResponse.redirect(new URL("/", req.url)),
    );
  }

  // Já logado como admin tentando abrir o login do painel: manda para o painel.
  if (user && isAdmin && isAdminLogin) {
    return applySecurityHeaders(
      NextResponse.redirect(new URL("/admin", req.url)),
    );
  }

  // Já logado como loja tentando abrir o login do painel: manda para a loja.
  if (user && !isAdmin && isAdminLogin) {
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
