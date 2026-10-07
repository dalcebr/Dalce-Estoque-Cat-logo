import { notFound } from "next/navigation";
import Script from "next/script";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { createClient } from "@/lib/supabase/server";
import { resolveImageUrl } from "@/lib/storage";
import CatalogApp from "./CatalogApp";

export const dynamic = "force-dynamic";

const inter = Inter({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-inter",
  display: "swap",
});

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
  logo: string | null;
  phone: string | null;
  email: string | null;
  stock_mode: string;
  instagram: string | null;
  facebook: string | null;
  analytics_id: string | null;
  highlight: string | null;
  top_text: string | null;
  about: string | null;
  theme: string;
  primary_color: string;
  font_family: string;
  hero_title: string | null;
  hero_subtitle: string | null;
  hero_description: string | null;
  hero_image: string | null;
  hero_button_text: string;
  benefits: Benefit[];
  dark_mode_enabled: boolean;
  footer_text: string | null;
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
    title: d?.name ?? "Catálogo",
    description: d?.settings.about ?? `Catálogo de produtos — ${d?.name ?? ""}`,
  };
}

export default async function Vitrine({ params }: { params: Promise<{ slug: string }> }) {
  const d = await load((await params).slug);
  if (!d) notFound();

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;

  // Resolve all image URLs server-side
  const products = d.products.map((p) => ({
    ...p,
    image: p.image ? resolveImageUrl(supabaseUrl, "product-images", p.image) : null,
  }));

  const settings: CatalogSettings = {
    ...d.settings,
    logo: d.settings.logo ? resolveImageUrl(supabaseUrl, "catalog-logos", d.settings.logo) : null,
    hero_image: d.settings.hero_image ? resolveImageUrl(supabaseUrl, "catalog-logos", d.settings.hero_image) : null,
    // Ensure benefits is always an array
    benefits: Array.isArray(d.settings.benefits)
      ? d.settings.benefits
      : [
          { icon: "headphones", title: "Atendimento 24h", description: "De qualidade" },
          { icon: "truck", title: "Envio rápido", description: "Para todo brasil" },
        ],
  };

  const ga = settings.analytics_id && /^G-[A-Z0-9]{4,20}$/.test(settings.analytics_id) ? settings.analytics_id : null;

  return (
    <div className={inter.variable} style={{ fontFamily: "var(--font-inter), Inter, Arial, Helvetica, sans-serif" }}>
      {ga && (
        <>
          <Script src={`https://www.googletagmanager.com/gtag/js?id=${ga}`} strategy="afterInteractive" />
          <Script id="ga" strategy="afterInteractive">{`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());gtag('config','${ga}');`}</Script>
        </>
      )}
      <CatalogApp
        storeName={d.name}
        settings={settings}
        products={products}
        categories={d.categories ?? []}
        collections={d.collections ?? []}
      />
    </div>
  );
}
