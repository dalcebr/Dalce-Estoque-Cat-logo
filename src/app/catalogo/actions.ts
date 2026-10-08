"use server";
import { revalidatePath } from "next/cache";
import { getStore } from "@/lib/store";
import {
  slugify, BENEFIT_ICONS, FONTS, COLOR_FIELDS,
  DEFAULT_COLORS, DEFAULT_FONTS,
  type CatalogSettings, type Benefit, type CatalogColors, type CatalogFonts, type FontKey,
} from "@/lib/catalog";
import { sanitizeText } from "@/lib/validation";

type Result = { ok: true; slug: string } | { error: string };
const handle = (v: string) =>
  v.trim().replace(/^https?:\/\/(www\.)?(instagram|facebook)\.com\//i, "").replace(/^@/, "").replace(/\/+$/, "");

const HEX = /^#[0-9a-fA-F]{6}$/;

function sanitizeBenefits(raw: unknown): Benefit[] {
  if (!Array.isArray(raw)) return [];
  const validIcons: string[] = BENEFIT_ICONS.map((i) => i.k as string);
  return raw.slice(0, 4).map((b: Record<string, unknown>) => ({
    icon: validIcons.includes(String(b?.icon ?? "")) ? String(b.icon) : "star",
    title: sanitizeText(String(b?.title ?? ""), 60),
    description: sanitizeText(String(b?.description ?? ""), 100),
  })).filter((b) => b.title.length > 0);
}

function sanitizeColors(raw: unknown): CatalogColors {
  const src = (raw ?? {}) as Record<string, unknown>;
  const out = { ...DEFAULT_COLORS };
  for (const { k } of COLOR_FIELDS) {
    const v = String(src[k] ?? "").trim();
    if (HEX.test(v)) out[k] = v;
  }
  return out;
}

function sanitizeFonts(raw: unknown): CatalogFonts {
  const src = (raw ?? {}) as Record<string, unknown>;
  const valid: string[] = FONTS.map((f) => f.k);
  const pick = (v: unknown, fallback: FontKey): FontKey =>
    valid.includes(String(v)) ? (String(v) as FontKey) : fallback;
  const slot = (v: unknown, fallback: 1 | 2): 1 | 2 => (v === 2 ? 2 : v === 1 ? 1 : fallback);
  return {
    font_1: pick(src.font_1, DEFAULT_FONTS.font_1),
    font_2: pick(src.font_2, DEFAULT_FONTS.font_2),
    store_name_font: slot(src.store_name_font, DEFAULT_FONTS.store_name_font),
    heading_font: slot(src.heading_font, DEFAULT_FONTS.heading_font),
    card_font: slot(src.card_font, DEFAULT_FONTS.card_font),
    body_font: slot(src.body_font, DEFAULT_FONTS.body_font),
  };
}

export async function saveCatalog(i: CatalogSettings): Promise<Result> {
  const slug = slugify(i.slug ?? "");
  if ((i.active || slug) && slug.length < 3) return { error: "O link precisa ter pelo menos 3 letras ou números." };

  const instagram = handle(sanitizeText(String(i.instagram ?? ""), 60));
  if (!/^[A-Za-z0-9._-]{0,60}$/.test(instagram))
    return { error: "Usuário do Instagram inválido." };

  const email = sanitizeText(String(i.email ?? ""), 254);
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { error: "E-mail inválido." };

  const store_name = sanitizeText(String(i.store_name ?? ""), 80);
  const phone = String(i.phone ?? "").replace(/[^\d+()\-\s]/g, "").slice(0, 20);

  const hero_image = String(i.hero_image ?? "");
  if (hero_image) {
    const isBase64 = hero_image.startsWith("data:image/");
    const isStoragePath = /^[0-9a-f-]+\/[0-9a-f-]+\.webp$/i.test(hero_image);
    if (!isBase64 && !isStoragePath) return { error: "Imagem do banner inválida." };
    if (isBase64 && hero_image.length > 300_000) return { error: "Imagem do banner grande demais." };
  }

  const hero_title = sanitizeText(String(i.hero_title ?? ""), 80);
  const hero_description = sanitizeText(String(i.hero_description ?? ""), 200);
  const hero_button_text = sanitizeText(String(i.hero_button_text ?? "VER PRODUTOS"), 40) || "VER PRODUTOS";
  const whatsapp_message = sanitizeText(String(i.whatsapp_message ?? "Olá! Gostaria de fazer um pedido:"), 300) || "Olá! Gostaria de fazer um pedido:";
  const benefits = sanitizeBenefits(i.benefits);
  const colors = sanitizeColors(i.colors);
  const fonts = sanitizeFonts(i.fonts);
  const dark_mode_enabled = Boolean(i.dark_mode_enabled);

  const s = await getStore();
  if (!s) return { error: "Sessão expirada. Entre novamente." };

  const { error } = await s.supabase.from("catalog_settings").upsert({
    store_id: s.storeId,
    active: !!i.active,
    slug: slug || null,
    store_name: store_name || null,
    phone: phone || null,
    email: email || null,
    stock_mode: ["all", "hide", "unavailable"].includes(i.stock_mode) ? i.stock_mode : "all",
    instagram: instagram || null,
    hero_title: hero_title || null,
    hero_description: hero_description || null,
    hero_image: hero_image || null,
    hero_button_text,
    benefits: JSON.stringify(benefits),
    colors: JSON.stringify(colors),
    fonts: JSON.stringify(fonts),
    dark_mode_enabled,
    whatsapp_message,
    updated_at: new Date().toISOString(),
  });
  if (error) return { error: error.code === "23505" ? "Esse link já está em uso. Escolha outro." : "Não foi possível salvar o catálogo." };
  revalidatePath("/c/[slug]", "page");
  return { ok: true, slug };
}
