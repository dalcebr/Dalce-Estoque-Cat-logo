import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { resolveImageUrl } from "@/lib/storage";
import { DEFAULT_COLORS, DEFAULT_COLORS_DARK, DEFAULT_FONTS, type CatalogColors, type CatalogFonts } from "@/lib/catalog";
import CatalogApp from "./CatalogApp";
import "./fonts.css";

export const dynamic = "force-dynamic";

/**
 * Fontes do catálogo.
 *
 * Antes usávamos `next/font/google`, que baixa cada fonte durante o build.
 * Com 24 fontes, o build no Cloudflare falhava (`Cannot read properties of
 * null (reading '1')`) por falha/limite de rede ao acessar o Google Fonts.
 *
 * Agora carregamos via `<link>` do Google Fonts: o build não faz nenhum
 * download e o navegador do visitante baixa apenas as fontes usadas.
 * As variáveis CSS `--font-*` são definidas em `fonts.css`.
 */
const GOOGLE_FONTS_HREF =
  "https://fonts.googleapis.com/css2" +
  "?family=Inter:wght@300;400;500;600;700;800" +
  "&family=Poppins:wght@300;400;500;600;700;800" +
  "&family=Montserrat:wght@300;400;500;600;700;800" +
  "&family=Roboto:wght@300;400;500;700;900" +
  "&family=Open+Sans:wght@300;400;500;600;700;800" +
  "&family=Raleway:wght@300;400;500;600;700;800" +
  "&family=Nunito:wght@300;400;500;600;700;800" +
  "&family=Work+Sans:wght@300;400;500;600;700;800" +
  "&family=DM+Sans:wght@300;400;500;600;700;800" +
  "&family=Quicksand:wght@300;400;500;600;700" +
  "&family=Josefin+Sans:wght@300;400;500;600;700" +
  "&family=Oswald:wght@300;400;500;600;700" +
  "&family=Bebas+Neue" +
  "&family=Righteous" +
  "&family=Playfair+Display:wght@400;500;600;700;800" +
  "&family=Lora:wght@400;500;600;700" +
  "&family=Cormorant+Garamond:wght@300;400;500;600;700" +
  "&family=Merriweather:wght@300;400;700;900" +
  "&family=Cinzel:wght@400;500;600;700;800" +
  "&family=Abril+Fatface" +
  "&family=Dancing+Script:wght@400;500;600;700" +
  "&family=Pacifico" +
  "&family=Great+Vibes" +
  "&family=Satisfy" +
  "&display=swap";

export type CatalogProduct = {
  id: string;
  name: string;
  price: number;
  image: string | null;
  images: string[];
  available: boolean;
  category: string | null;
  color: string | null;
  description: string | null;
  collection: string | null;
  material: string | null;
  featured: boolean;
  created_at: string;
  sold_count: number;
  variations: { group: string; option: string; stock: number; price: number | null }[];
};

export type Benefit = {
  icon: string;
  title: string;
  description: string;
};

export type CatalogSettings = {
  store_name: string | null;
  phone: string | null;
  email: string | null;
  stock_mode: string;
  instagram: string | null;
  hero_title: string | null;
  hero_description: string | null;
  hero_image: string | null;
  hero_button_text: string;
  benefits: Benefit[];
  colors: CatalogColors;
  colors_dark: CatalogColors;
  fonts: CatalogFonts;
  dark_mode_enabled: boolean;
  whatsapp_message: string;
};

export type CatalogData = {
  name: string;
  settings: CatalogSettings;
  categories: { name: string; color: string; image: string | null }[];
  collections: string[];
  products: CatalogProduct[];
};

async function load(slug: string) {
  const supabase = await createClient();
  const { data } = await supabase.rpc("public_catalog", { p_slug: slug });
  return (data as CatalogData | null) ?? null;
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const d = await load((await params).slug);
  return {
    title: d?.settings.store_name ?? d?.name ?? "Catálogo",
    description: `Catálogo de produtos — ${d?.settings.store_name ?? d?.name ?? ""}`,
  };
}

const parse = <T,>(raw: unknown, fallback: T): T => {
  if (raw == null) return fallback;
  if (typeof raw === "string") { try { return JSON.parse(raw) as T; } catch { return fallback; } }
  return raw as T;
};

export default async function Vitrine({ params }: { params: Promise<{ slug: string }> }) {
  const d = await load((await params).slug);
  if (!d) notFound();

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;

  const products = d.products.map((p) => {
    const raw = Array.isArray(p.images) ? p.images : [];
    const list = (raw.length > 0 ? raw : p.image ? [p.image] : [])
      .map((v) => resolveImageUrl(supabaseUrl, "product-images", v));
    // Normaliza as variações: bancos com a função `public_catalog` antiga
    // (anterior à 018) não retornam `variations`, então garantimos um array.
    const variations = (Array.isArray(p.variations) ? p.variations : [])
      .map((v) => ({
        group: String(v?.group ?? "").trim(),
        option: String(v?.option ?? "").trim(),
        stock: Number.isFinite(Number(v?.stock)) ? Math.trunc(Number(v.stock)) : 0,
        price: v?.price == null || !Number.isFinite(Number(v.price)) ? null : Number(v.price),
      }))
      .filter((v) => v.group && v.option);
    return { ...p, images: list, image: list[0] ?? null, variations };
  });

  const categories = (d.categories ?? []).map((c) => ({
    ...c,
    image: c.image ? resolveImageUrl(supabaseUrl, "product-images", c.image) : null,
  }));

  const raw = d.settings as unknown as Record<string, unknown>;
  const settings: CatalogSettings = {
    store_name: (raw.store_name as string) ?? null,
    phone: (raw.phone as string) ?? null,
    email: (raw.email as string) ?? null,
    stock_mode: (raw.stock_mode as string) ?? "all",
    instagram: (raw.instagram as string) ?? null,
    hero_title: (raw.hero_title as string) ?? null,
    hero_description: (raw.hero_description as string) ?? null,
    hero_image: raw.hero_image ? resolveImageUrl(supabaseUrl, "catalog-logos", String(raw.hero_image)) : null,
    hero_button_text: (raw.hero_button_text as string) || "VER PRODUTOS",
    benefits: Array.isArray(raw.benefits) ? (raw.benefits as Benefit[]) : parse(raw.benefits, [] as Benefit[]),
    colors: parse(raw.colors, DEFAULT_COLORS),
    colors_dark: parse(raw.colors_dark, DEFAULT_COLORS_DARK),
    fonts: parse(raw.fonts, DEFAULT_FONTS),
    dark_mode_enabled: raw.dark_mode_enabled !== false,
    whatsapp_message: (raw.whatsapp_message as string) || "Olá! Gostaria de fazer um pedido:",
  };

  const storeName = settings.store_name || d.name;

  return (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link rel="stylesheet" href={GOOGLE_FONTS_HREF} />
      <CatalogApp
        storeName={storeName}
        settings={settings}
        products={products}
        categories={categories}
      />
    </>
  );
}
