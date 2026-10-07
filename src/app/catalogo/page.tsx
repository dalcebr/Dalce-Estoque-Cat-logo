import { createClient } from "@/lib/supabase/server";
import CatalogForm from "@/components/CatalogForm";
import { DEFAULTS, slugify, type CatalogSettings } from "@/lib/catalog";

export const dynamic = "force-dynamic";

export default async function Catalogo() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: p } = await supabase.from("profiles").select("store_id, stores(name)").eq("id", user!.id).single();
  const { data: c } = p ? await supabase.from("catalog_settings").select("*").eq("store_id", p.store_id).maybeSingle() : { data: null };
  const st = Array.isArray(p?.stores) ? p?.stores[0] : p?.stores;
  const initial = { ...DEFAULTS } as Record<string, unknown>;
  for (const k of Object.keys(DEFAULTS)) if (c && c[k] != null) initial[k] = c[k];
  if (!initial.slug) initial.slug = slugify(st?.name ?? "");
  return <CatalogForm initial={initial as unknown as CatalogSettings} open={!!c?.active && !!c?.slug} />;
}
