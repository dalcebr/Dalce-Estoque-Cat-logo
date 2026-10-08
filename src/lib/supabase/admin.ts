import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Cliente Supabase com a SERVICE ROLE KEY.
 *
 * ATENCAO: ignora RLS e tem acesso total ao banco e ao Auth.
 * Use SOMENTE em Server Actions/Route Handlers, nunca no cliente.
 * Requer a variavel de ambiente SUPABASE_SERVICE_ROLE_KEY.
 */
export function createAdminClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY nao configurada. Adicione a variavel de ambiente para usar o painel de administrador.",
    );
  }
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

/** Indica se o painel de administrador esta configurado (service role presente). */
export function adminConfigured(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}
