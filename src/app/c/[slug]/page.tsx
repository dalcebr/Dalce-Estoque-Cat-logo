import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Inter, Poppins, Montserrat, Roboto, Playfair_Display, Lora } from "next/font/google";
import { createClient } from "@/lib/supabase/server";
import { resolveImageUrl } from "@/lib/storage";
import { DEFAULT_COLORS, DEFAULT_FONTS, type CatalogColors, type CatalogFonts } from "@/lib/catalog";
import CatalogApp from "./CatalogApp";

export const dynamic = "force-dynamic";

const inter = Inter({ subsets: ["latin"], weight: ["300", "400", "500", "600", "700", "800"], variable: "--font-inter", display: "swap" });
const poppins = Poppins({ subsets: ["latin"], weight: ["300", "400", "500", "600", "700", "800"], variable: "--font-poppins", display: "swap" });
const montserrat = Montserrat({ subsets: ["latin"], weight: ["300", "400", "500", "600", "700", "800"], variable: "--font-montserrat", display: "swap" });
const roboto = Roboto({ subsets: ["latin"], weight: ["300", "400", "500", "700", "900"], variable: "--font-roboto", display: "swap" });
const playfair = Playfair_Display({ subsets: ["latin"], weight: ["400", "500", "600", "700", "800"], variable: "--font-playfair", display: "swap" });
const lora = Lora({ subsets: ["latin"], weight: ["400", "500", "600", "700"], variable: "--font-lora", display: "swap" });

export type CatalogProduct = {
  id: string;
  name: string;
  price: number;
  image: string | null;
  available: boolean;
  category: string | null;
  color: string | null;
  description: string | null;
  collection: string | null;
  material: string | null;
  featured: boolean;
  created_at: string;
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
  hero_subtitle: string | null;
  hero_description: string | null;
  hero_image: string | null;
  hero_button_text: string;
  benefits: Benefit[];
  colors: CatalogColors;
  fonts: CatalogFonts;
  dark_mode_enabled: boolean;
  whatsapp_message: string;
};

export type CatalogData = {
  name: string;
  settings: CatalogSettings;
  categories: { name: string; color: string }[];
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

  const products = d.products.map((p) => ({
    ...p,
    image: p.image ? resolveImageUrl(supabaseUrl, "product-images", p.image) : null,
  }));

  const raw = d.settings as unknown as Record<string, unknown>;
  const settings: CatalogSettings = {
    store_name: (raw.store_name as string) ?? null,
    phone: (raw.phone as string) ?? null,
    email: (raw.email as string) ?? null,
    stock_mode: (raw.stock_mode as string) ?? "all",
    instagram: (raw.instagram as string) ?? null,
    hero_title: (raw.hero_title as string) ?? null,
    hero_subtitle: (raw.hero_subtitle as string) ?? null,
    hero_description: (raw.hero_description as string) ?? null,
    hero_image: raw.hero_image ? resolveImageUrl(supabaseUrl, "catalog-logos", String(raw.hero_image)) : null,
    hero_button_text: (raw.hero_button_text as string) || "VER PRODUTOS",
    benefits: Array.isArray(raw.benefits) ? (raw.benefits as Benefit[]) : parse(raw.benefits, [] as Benefit[]),
    colors: parse(raw.colors, DEFAULT_COLORS),
    fonts: parse(raw.fonts, DEFAULT_FONTS),
    dark_mode_enabled: raw.dark_mode_enabled !== false,
    whatsapp_message: (raw.whatsapp_message as string) || "Olá! Gostaria de fazer um pedido:",
  };

  const storeName = settings.store_name || d.name;

  const fontVars = [inter.variable, poppins.variable, montserrat.variable, roboto.variable, playfair.variable, lora.variable].join(" ");

  return (
    <div className={fontVars}>
      <CatalogApp
        storeName={storeName}
        settings={settings}
        products={products}
        categories={d.categories ?? []}
      />
    </div>
  );
}
