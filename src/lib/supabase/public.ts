/**
 * Configuração pública do Supabase lida NO SERVIDOR.
 *
 * No Cloudflare Workers (OpenNext) as variáveis `NEXT_PUBLIC_*` NÃO são
 * embutidas no bundle do cliente automaticamente. Por isso, em vez de ler
 * `process.env` dentro de componentes "use client" (o que resulta em
 * `undefined` no navegador), lemos aqui no servidor e passamos os valores
 * para os client components via props.
 */
export type SupabasePublicConfig = {
  url: string;
  anonKey: string;
};

export function getSupabasePublicConfig(): SupabasePublicConfig {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
  return { url, anonKey };
}
