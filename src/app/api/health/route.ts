import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

/**
 * Health check para monitoramento externo (UptimeRobot, Better Stack, etc.).
 * Verifica se o app responde e se o banco está acessível.
 *
 * GET /api/health
 *   200 → tudo ok
 *   503 → banco indisponível
 *
 * Não expõe nenhum dado: apenas confirma que o Postgres responde.
 */
export async function GET() {
  const started = Date.now();
  let db: "ok" | "erro" = "ok";

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    db = "erro";
  } else {
    try {
      const supabase = createClient(url, key, {
        auth: { persistSession: false, autoRefreshToken: false },
      });
      // consulta leve: só confirma que o Postgres responde
      const { error } = await supabase.from("stores").select("id").limit(1);
      if (error) db = "erro";
    } catch {
      db = "erro";
    }
  }

  const body = {
    status: db === "ok" ? "ok" : "degradado",
    db,
    uptime: Math.round(process.uptime()),
    latencyMs: Date.now() - started,
    timestamp: new Date().toISOString(),
  };

  return NextResponse.json(body, {
    status: db === "ok" ? 200 : 503,
    headers: { "Cache-Control": "no-store" },
  });
}
