"use server";
import { revalidatePath } from "next/cache";
import { getStore } from "@/lib/store";
import { slugify, THEMES, type CatalogSettings } from "@/lib/catalog";
import { sanitizeText } from "@/lib/validation";

type Result = { ok: true; slug: string } | { error: string };
const handle = (v: string) => v.trim().replace(/^https?:\/\/(www\.)?(instagram|facebook)\.com\//i, "").replace(/^@/, "").replace(/\/+$/, "");

export async function saveCatalog(i: CatalogSettings): Promise<Result> {
  // --- sanitize text fields to prevent XSS ---
  const slug = slugify(i.slug ?? "");
  if ((i.active || slug) && slug.length < 3) return { error: "O link precisa ter pelo menos 3 letras ou números." };

  const instagram = handle(sanitizeText(String(i.instagram ?? ""), 60));
  const facebook = handle(sanitizeText(String(i.facebook ?? ""), 60));
  if (!/^[A-Za-z0-9._-]{0,60}$/.test(instagram) || !/^[A-Za-z0-9._-]{0,60}$/.test(facebook)) return { error: "Usuário de rede social inválido." };

  const analytics_id = sanitizeText(String(i.analytics_id ?? ""), 20).toUpperCase();
  if (analytics_id && !/^G-[A-Z0-9]{4,20}$/.test(analytics_id)) return { error: "ID do Google Analytics inválido (ex.: G-XXXXXXXXXX)." };

  const email = sanitizeText(String(i.email ?? ""), 254);
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { error: "E-mail inválido." };

  const logo = String(i.logo ?? "");
  // Accept legacy base64 data URLs OR new storage paths ({uuid}/{uuid}.webp)
  if (logo) {
    const isBase64 = logo.startsWith("data:image/");
    const isStoragePath = /^[0-9a-f-]+\/[0-9a-f-]+\.webp$/i.test(logo);
    if (!isBase64 && !isStoragePath) return { error: "Logo inválido." };
    if (isBase64 && logo.length > 300_000) return { error: "Logo inválido ou grande demais." };
  }

  const highlight = sanitizeText(String(i.highlight ?? ""), 120);
  const top_text = sanitizeText(String(i.top_text ?? ""), 500);
  const about = sanitizeText(String(i.about ?? ""), 1500);
  const phone = String(i.phone ?? "").replace(/[^\d+()\-\s]/g, "").slice(0, 20);

  const s = await getStore();
  if (!s) return { error: "Sessão expirada. Entre novamente." };

  const { error } = await s.supabase.from("catalog_settings").upsert({
    store_id: s.storeId, active: !!i.active, slug: slug || null, logo: logo || null,
    phone: phone || null, email: email || null,
    stock_mode: ["all", "hide", "unavailable"].includes(i.stock_mode) ? i.stock_mode : "all",
    instagram: instagram || null, facebook: facebook || null, analytics_id: analytics_id || null,
    highlight: highlight || null, top_text: top_text || null, about: about || null,
    theme: THEMES.some((t) => t.k === i.theme) ? i.theme : "azul", updated_at: new Date().toISOString(),
  });
  if (error) return { error: error.code === "23505" ? "Esse link já está em uso. Escolha outro." : "Não foi possível salvar o catálogo." };
  revalidatePath("/c/[slug]", "page");
  return { ok: true, slug };
}
