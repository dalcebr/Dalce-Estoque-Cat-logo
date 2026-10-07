import { notFound } from "next/navigation";
import Script from "next/script";
import type { Metadata } from "next";
import { Cormorant_Garamond, Jost } from "next/font/google";
import { createClient } from "@/lib/supabase/server";
import { resolveImageUrl } from "@/lib/storage";
import CatalogApp from "./CatalogApp";

export const dynamic = "force-dynamic";

const serif = Cormorant_Garamond({ subsets: ["latin"], weight: ["400", "600", "700"], variable: "--font-serif", display: "swap" });
const sans = Jost({ subsets: ["latin"], weight: ["300", "400", "500", "600", "700"], variable: "--font-sans", display: "swap" });

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

  const settings = {
    ...d.settings,
    logo: d.settings.logo ? resolveImageUrl(supabaseUrl, "catalog-logos", d.settings.logo) : null,
  };

  const ga = settings.analytics_id && /^G-[A-Z0-9]{4,20}$/.test(settings.analytics_id) ? settings.analytics_id : null;

  return (
    <div className={`${serif.variable} ${sans.variable}`}>
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
