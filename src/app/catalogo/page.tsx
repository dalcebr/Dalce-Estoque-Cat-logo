import { createClient } from "@/lib/supabase/server";
import CatalogForm from "@/components/CatalogForm";
import { DEFAULTS, slugify, type CatalogSettings } from "@/lib/catalog";
import { getSupabasePublicConfig } from "@/lib/supabase/public";

export const dynamic = "force-dynamic";

export default async function Catalogo() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: p } = await supabase.from("profiles").select("store_id, stores(name)").eq("id", user!.id).single();
  const { data: c } = p ? await supabase.from("catalog_settings").select("*").eq("store_id", p.store_id).maybeSingle() : { data: null };
  const st = Array.isArray(p?.stores) ? p?.stores[0] : p?.stores;

  const initial = { ...DEFAULTS } as Record<string, unknown>;
  for (const k of Object.keys(DEFAULTS)) if (c && c[k] != null) initial[k] = c[k];

  // JSONB columns may arrive as strings or objects depending on the driver.
  const parse = <T,>(raw: unknown, fallback: T): T => {
    if (raw == null) return fallback;
    if (typeof raw === "string") { try { return JSON.parse(raw) as T; } catch { return fallback; } }
    return raw as T;
  };
  initial.colors = parse(c?.colors, DEFAULTS.colors);
  initial.colors_dark = parse(c?.colors_dark, DEFAULTS.colors_dark);
  initial.fonts = parse(c?.fonts, DEFAULTS.fonts);
  initial.benefits = parse(c?.benefits, DEFAULTS.benefits);

  if (!initial.slug) initial.slug = slugify(st?.name ?? "");
  if (!initial.store_name) initial.store_name = st?.name ?? "";

  const { url: supabaseUrl, anonKey: supabaseKey } = getSupabasePublicConfig();

  return <CatalogForm initial={initial as unknown as CatalogSettings} open={!!c?.active && !!c?.slug} storeId={p!.store_id as string} supabaseUrl={supabaseUrl} supabaseKey={supabaseKey} />;
}
