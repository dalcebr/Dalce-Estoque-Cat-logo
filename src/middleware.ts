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
  // Rate-limit login attempts
  if (req.nextUrl.pathname === "/login" && req.method === "POST") {
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

    // Attach rate-limit info header on allowed requests
    const res = updateSession(req);
    return res.then((r) => {
      r.headers.set("X-RateLimit-Remaining", String(remaining));
      return r;
    });
  }

  return updateSession(req);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
