import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";

const PUBLIC = ["/login", "/cadastro", "/c/", "/bloqueado", "/assinatura"];

export async function updateSession(req: NextRequest) {
  let res = NextResponse.next({ request: req });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => req.cookies.getAll(),
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          cookiesToSet.forEach(({ name, value }) => req.cookies.set(name, value));
          res = NextResponse.next({ request: req });
          cookiesToSet.forEach(({ name, value, options }) => res.cookies.set(name, value, options));
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();
  const path = req.nextUrl.pathname;
  const isPublic = PUBLIC.some((p) => path === p || path.startsWith(p));
  const isAuthPage = path === "/login" || path === "/cadastro";

  if (!user) {
    if (isPublic) return res;
    return NextResponse.redirect(new URL("/login", req.url));
  }
  if (isAuthPage) return NextResponse.redirect(new URL("/", req.url));

  // loja vencida/bloqueada: mantém acesso apenas às telas de regularização
  const { data: profile } = await supabase
    .from("profiles")
    .select("is_super_admin, stores(plan, active, trial_ends_at, plan_ends_at)")
    .eq("id", user.id)
    .maybeSingle();

  if (profile && !profile.is_super_admin) {
    const st = (Array.isArray(profile.stores) ? profile.stores[0] : profile.stores) as
      | { plan: string; active: boolean; trial_ends_at: string | null; plan_ends_at: string | null }
      | null;
    if (st) {
      const limit = st.plan === "trial" ? st.trial_ends_at : st.plan_ends_at;
      const expired = !st.active || st.plan === "blocked" || (!!limit && new Date(limit).getTime() <= Date.now());
      const allowed = path === "/bloqueado" || path === "/assinatura" || path.startsWith("/c/");
      if (expired && !allowed) return NextResponse.redirect(new URL("/bloqueado", req.url));
      if (!expired && path === "/bloqueado") return NextResponse.redirect(new URL("/", req.url));
    }
  }

  return res;
}
