import { createBrowserClient } from "@supabase/ssr";

/**
 * Cliente Supabase para uso no navegador (upload de fotos, etc.).
 *
 * IMPORTANTE (Cloudflare Workers / OpenNext): as variáveis `NEXT_PUBLIC_*`
 * NÃO são embutidas no bundle do cliente automaticamente. Por isso a URL e a
 * chave anon são lidas no servidor (ver `@/lib/supabase/public`) e passadas
 * como props para os client components — nunca leia `process.env` aqui.
 */
export function createBrowserSupabase(url: string, anonKey: string) {
  if (!url || !anonKey) {
    throw new Error(
      "Supabase não configurado: URL e/ou chave anon ausentes. " +
        "Defina NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY " +
        "no ambiente do servidor (wrangler.jsonc > vars ou painel do Cloudflare) " +
        "e faça um novo build/deploy.",
    );
  }

  return createBrowserClient(url, anonKey);
}
