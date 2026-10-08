import { notFound } from "next/navigation";
import type { Metadata } from "next";
import {
  Inter, Poppins, Montserrat, Roboto, Open_Sans, Raleway, Nunito, Work_Sans,
  DM_Sans, Quicksand, Josefin_Sans, Oswald, Bebas_Neue, Righteous,
  Playfair_Display, Lora, Cormorant_Garamond, Merriweather, Cinzel,
  Abril_Fatface, Dancing_Script, Pacifico, Great_Vibes, Satisfy,
} from "next/font/google";
import { createClient } from "@/lib/supabase/server";
import { resolveImageUrl } from "@/lib/storage";
import { DEFAULT_COLORS, DEFAULT_COLORS_DARK, DEFAULT_FONTS, type CatalogColors, type CatalogFonts } from "@/lib/catalog";
import CatalogApp from "./CatalogApp";

export const dynamic = "force-dynamic";

const inter = Inter({ subsets: ["latin"], weight: ["300", "400", "500", "600", "700", "800"], variable: "--font-inter", display: "swap" });
const poppins = Poppins({ subsets: ["latin"], weight: ["300", "400", "500", "600", "700", "800"], variable: "--font-poppins", display: "swap" });
const montserrat = Montserrat({ subsets: ["latin"], weight: ["300", "400", "500", "600", "700", "800"], variable: "--font-montserrat", display: "swap" });
const roboto = Roboto({ subsets: ["latin"], weight: ["300", "400", "500", "700", "900"], variable: "--font-roboto", display: "swap" });
const opensans = Open_Sans({ subsets: ["latin"], weight: ["300", "400", "500", "600", "700", "800"], variable: "--font-opensans", display: "swap" });
const raleway = Raleway({ subsets: ["latin"], weight: ["300", "400", "500", "600", "700", "800"], variable: "--font-raleway", display: "swap" });
const nunito = Nunito({ subsets: ["latin"], weight: ["300", "400", "500", "600", "700", "800"], variable: "--font-nunito", display: "swap" });
const worksans = Work_Sans({ subsets: ["latin"], weight: ["300", "400", "500", "600", "700", "800"], variable: "--font-worksans", display: "swap" });
const dmsans = DM_Sans({ subsets: ["latin"], weight: ["300", "400", "500", "600", "700", "800"], variable: "--font-dmsans", display: "swap" });
const quicksand = Quicksand({ subsets: ["latin"], weight: ["300", "400", "500", "600", "700"], variable: "--font-quicksand", display: "swap" });
const josefin = Josefin_Sans({ subsets: ["latin"], weight: ["300", "400", "500", "600", "700"], variable: "--font-josefin", display: "swap" });
const oswald = Oswald({ subsets: ["latin"], weight: ["300", "400", "500", "600", "700"], variable: "--font-oswald", display: "swap" });
const bebas = Bebas_Neue({ subsets: ["latin"], weight: ["400"], variable: "--font-bebas", display: "swap" });
const righteous = Righteous({ subsets: ["latin"], weight: ["400"], variable: "--font-righteous", display: "swap" });
const playfair = Playfair_Display({ subsets: ["latin"], weight: ["400", "500", "600", "700", "800"], variable: "--font-playfair", display: "swap" });
const lora = Lora({ subsets: ["latin"], weight: ["400", "500", "600", "700"], variable: "--font-lora", display: "swap" });
const cormorant = Cormorant_Garamond({ subsets: ["latin"], weight: ["300", "400", "500", "600", "700"], variable: "--font-cormorant", display: "swap" });
const merriweather = Merriweather({ subsets: ["latin"], weight: ["300", "400", "700", "900"], variable: "--font-merriweather", display: "swap" });
const cinzel = Cinzel({ subsets: ["latin"], weight: ["400", "500", "600", "700", "800"], variable: "--font-cinzel", display: "swap" });
const abril = Abril_Fatface({ subsets: ["latin"], weight: ["400"], variable: "--font-abril", display: "swap" });
const dancing = Dancing_Script({ subsets: ["latin"], weight: ["400", "500", "600", "700"], variable: "--font-dancing", display: "swap" });
const pacifico = Pacifico({ subsets: ["latin"], weight: ["400"], variable: "--font-pacifico", display: "swap" });
const greatvibes = Great_Vibes({ subsets: ["latin"], weight: ["400"], variable: "--font-greatvibes", display: "swap" });
const satisfy = Satisfy({ subsets: ["latin"], weight: ["400"], variable: "--font-satisfy", display: "swap" });

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
        price: v?.price == null || v.price === "" || !Number.isFinite(Number(v.price)) ? null : Number(v.price),
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

  const fontVars = [
    inter.variable, poppins.variable, montserrat.variable, roboto.variable,
    opensans.variable, raleway.variable, nunito.variable, worksans.variable,
    dmsans.variable, quicksand.variable, josefin.variable, oswald.variable,
    bebas.variable, righteous.variable, playfair.variable, lora.variable,
    cormorant.variable, merriweather.variable, cinzel.variable, abril.variable,
    dancing.variable, pacifico.variable, greatvibes.variable, satisfy.variable,
  ].join(" ");

  return (
    <div className={fontVars}>
      <CatalogApp
        storeName={storeName}
        settings={settings}
        products={products}
        categories={categories}
      />
    </div>
  );
}
