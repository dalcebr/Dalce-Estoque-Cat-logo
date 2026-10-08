import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import { RateLimiter } from "@/lib/rate-limit";

const loginLimiter = new RateLimiter({
  windowMs: 60_000, // 1 minute
  maxRequests: 10,
});

function getClientIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    (req as unknown as { ip?: string }).ip ||
    "unknown"
  );
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Rate-limit login attempts (loja e painel de administração).
  // O POST é a Server Action de autenticação: aplicamos apenas o rate-limit e
  // deixamos a requisição seguir sem rodar a lógica de sessão (o usuário ainda
  // não está autenticado neste ponto).
  const isLoginPost =
    req.method === "POST" && (pathname === "/login" || pathname === "/admin/login");

  if (isLoginPost) {
    const ip = getClientIp(req);
    const { success, remaining } = loginLimiter.check(ip);

    if (!success) {
      return NextResponse.json(
        { error: "Too many login attempts. Please try again later." },
        {
          status: 429,
          headers: {
            "Retry-After": "60",
            "X-RateLimit-Remaining": "0",
          },
        },
      );
    }

    const res = NextResponse.next();
    res.headers.set("X-RateLimit-Remaining", String(remaining));
    return res;
  }

  return updateSession(req);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
