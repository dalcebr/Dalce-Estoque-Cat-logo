"use server";
import { revalidatePath } from "next/cache";
import { getStore } from "@/lib/store";
import { slugify, THEMES, type CatalogSettings } from "@/lib/catalog";

type Result = { ok: true; slug: string } | { error: string };
const handle = (v: string) => v.trim().replace(/^https?:\/\/(www\.)?(instagram|facebook)\.com\//i, "").replace(/^@/, "").replace(/\/+$/, "");

export async function saveCatalog(i: CatalogSettings): Promise<Result> {
  const slug = slugify(i.slug ?? "");
  if ((i.active || slug) && slug.length < 3) return { error: "O link precisa ter pelo menos 3 letras ou números." };
  const instagram = handle(i.instagram ?? ""), facebook = handle(i.facebook ?? "");
  if (!/^[A-Za-z0-9._-]{0,60}$/.test(instagram) || !/^[A-Za-z0-9._-]{0,60}$/.test(facebook)) return { error: "Usuário de rede social inválido." };
  const analytics_id = (i.analytics_id ?? "").trim().toUpperCase();
  if (analytics_id && !/^G-[A-Z0-9]{4,20}$/.test(analytics_id)) return { error: "ID do Google Analytics inválido (ex.: G-XXXXXXXXXX)." };
  const email = (i.email ?? "").trim();
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { error: "E-mail inválido." };
  const logo = i.logo ?? "";
  if (logo && (!logo.startsWith("data:image/") || logo.length > 300_000)) return { error: "Logo inválido ou grande demais." };

  const s = await getStore();
  if (!s) return { error: "Sessão expirada. Entre novamente." };
  const { error } = await s.supabase.from("catalog_settings").upsert({
    store_id: s.storeId, active: !!i.active, slug: slug || null, logo: logo || null,
    phone: (i.phone ?? "").replace(/[^\d+()\-\s]/g, "").slice(0, 20) || null, email: email || null,
    stock_mode: ["all", "hide", "unavailable"].includes(i.stock_mode) ? i.stock_mode : "all",
    instagram: instagram || null, facebook: facebook || null, analytics_id: analytics_id || null,
    highlight: (i.highlight ?? "").trim().slice(0, 120) || null, top_text: (i.top_text ?? "").trim().slice(0, 500) || null, about: (i.about ?? "").trim().slice(0, 1500) || null,
    theme: THEMES.some((t) => t.k === i.theme) ? i.theme : "azul", updated_at: new Date().toISOString(),
  });
  if (error) return { error: error.code === "23505" ? "Esse link já está em uso. Escolha outro." : "Não foi possível salvar o catálogo." };
  revalidatePath("/c/[slug]", "page");
  return { ok: true, slug };
}
