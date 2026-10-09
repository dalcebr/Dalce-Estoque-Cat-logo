import { createBrowserClient } from "@supabase/ssr";

/**
 * Cliente Supabase para uso no navegador (upload de fotos, etc.).
 *
 * IMPORTANTE (Cloudflare Workers / OpenNext): as variaveis NEXT_PUBLIC_* sao
 * injetadas em tempo de build via `env` no next.config.ts. Se estiverem
 * ausentes, o @supabase/ssr lanca um erro generico — aqui validamos antes para
 * dar uma mensagem clara.
 */
export function createBrowserSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error(
      "Supabase nao configurado no navegador: NEXT_PUBLIC_SUPABASE_URL e/ou " +
        "NEXT_PUBLIC_SUPABASE_ANON_KEY ausentes. No Cloudflare, defina essas " +
        "variaveis (wrangler.jsonc > vars ou painel do Cloudflare) e faca um " +
        "novo build/deploy.",
    );
  }

  return createBrowserClient(url, key);
}
