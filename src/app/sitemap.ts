import type { MetadataRoute } from "next";
import { createClient } from "@supabase/supabase-js";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export const revalidate = 3600; // regenera de hora em hora

/**
 * Sitemap com as páginas públicas + os catálogos publicados.
 * Usa a anon key: a função public_catalog só devolve catálogos ativos.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const base: MetadataRoute.Sitemap = [
    { url: `${APP_URL}/cadastro`, lastModified: now, changeFrequency: "monthly", priority: 0.9 },
    { url: `${APP_URL}/login`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
  ];

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return base;

  try {
    const supabase = createClient(url, key, { auth: { persistSession: false } });
    const { data } = await supabase
      .from("catalog_settings")
      .select("slug, updated_at")
      .eq("active", true)
      .not("slug", "is", null)
      .limit(5000);

    const catalogs: MetadataRoute.Sitemap = (data ?? [])
      .filter((c: { slug: string | null }) => !!c.slug)
      .map((c: { slug: string; updated_at: string | null }) => ({
        url: `${APP_URL}/c/${c.slug}`,
        lastModified: c.updated_at ? new Date(c.updated_at) : now,
        changeFrequency: "weekly" as const,
        priority: 0.7,
      }));

    return [...base, ...catalogs];
  } catch {
    return base;
  }
}
