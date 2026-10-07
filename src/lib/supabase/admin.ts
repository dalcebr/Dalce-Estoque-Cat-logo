import { createClient } from "@supabase/supabase-js";

/**
 * Cliente com a service role key — ignora RLS.
 * Use SOMENTE em código de servidor (server actions / route handlers) e
 * sempre depois de validar que o usuário é o dono do sistema.
 * Requer a variável de ambiente SUPABASE_SERVICE_ROLE_KEY.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}
