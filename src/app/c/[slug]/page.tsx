import { notFound } from "next/navigation";
import Script from "next/script";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { THEMES } from "@/lib/catalog";
import { brl } from "@/lib/format";
import { resolveImageUrl } from "@/lib/storage";

export const dynamic = "force-dynamic";
type Prod = { id: string; name: string; price: number; available: boolean; category: string | null; color: string | null };
type Data = { name: string; settings: { logo: string | null; phone: string | null; email: string | null; stock_mode: string; instagram: string | null; facebook: string | null; analytics_id: string | null; highlight: string | null; top_text: string | null; about: string | null; theme: string }; products: Prod[] };

async function load(slug: string) {
  const supabase = await createClient();
  const { data } = await supabase.rpc("public_catalog", { p_slug: slug });
  return (data as Data | null) ?? null;
}
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const d = await load((await params).slug);
  return { title: d?.name ?? "Catálogo" };
}

export default async function Vitrine({ params }: { params: Promise<{ slug: string }> }) {
  const d = await load((await params).slug);
  if (!d) notFound();
  const s = d.settings, accent = (THEMES.find((t) => t.k === s.theme) ?? THEMES[0]).colors[0];
  const digits = (s.phone ?? "").replace(/\D/g, ""), wa = digits ? (digits.length <= 11 ? `55${digits}` : digits) : "";
  const ga = s.analytics_id && /^G-[A-Z0-9]{4,20}$/.test(s.analytics_id) ? s.analytics_id : null;
  const link = "font-semibold underline underline-offset-2";

  return (
    <main className="mx-auto min-h-dvh max-w-md px-5 pb-12 pt-8">
      {ga && <>
        <Script src={`https://www.googletagmanager.com/gtag/js?id=${ga}`} strategy="afterInteractive" />
        <Script id="ga" strategy="afterInteractive">{`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());gtag('config','${ga}');`}</Script>
      </>}
      <header className="flex items-center gap-4">
        {s.logo && <img src={resolveImageUrl(process.env.NEXT_PUBLIC_SUPABASE_URL!, "catalog-logos", s.logo)} alt="" className="size-16 rounded-2xl bg-surface object-contain" />}
        <h1 className="text-3xl font-extrabold leading-tight">{d.name}</h1>
      </header>
      {s.highlight && <p className="mt-4 rounded-2xl px-4 py-3 font-bold text-white" style={{ background: accent }}>{s.highlight}</p>}
      {s.top_text && <p className="mt-4 whitespace-pre-line text-soft">{s.top_text}</p>}

      <ul className="mt-6 grid grid-cols-2 gap-3">
        {d.products.map((p) => {
          const can = p.available || s.stock_mode === "all";
          return (
            <li key={p.id} className="overflow-hidden rounded-3xl border border-line bg-surface">
              <div className="h-2" style={{ background: p.color ?? accent }} />
              <div className="p-4">
                {p.category && <span className="text-xs font-bold uppercase tracking-wider text-soft">{p.category}</span>}
                <b className="mt-1 block text-lg leading-tight">{p.name}</b>
                <p className="mt-1 text-xl font-extrabold">{brl(Number(p.price))}</p>
                {can && wa && <a href={`https://wa.me/${wa}?text=${encodeURIComponent(`Olá! Quero pedir: ${p.name}`)}`} target="_blank" rel="noopener noreferrer" className="mt-3 block rounded-xl py-2.5 text-center font-bold text-white" style={{ background: accent }}>Pedir</a>}
                {!can && <span className="mt-3 block rounded-xl bg-line py-2.5 text-center font-bold text-soft">Indisponível</span>}
              </div>
            </li>);
        })}
      </ul>
      {d.products.length === 0 && <p className="mt-8 text-center text-soft">Nenhum produto disponível no momento.</p>}

      {s.about && <section className="mt-8"><h2 className="mb-2 text-xl font-extrabold">Sobre nós</h2><p className="whitespace-pre-line text-soft">{s.about}</p></section>}
      <footer className="mt-8 space-y-1 border-t border-line pt-5 text-soft">
        {s.phone && <p>WhatsApp: {wa ? <a className={link} href={`https://wa.me/${wa}`}>{s.phone}</a> : s.phone}</p>}
        {s.email && <p>E-mail: <a className={link} href={`mailto:${s.email}`}>{s.email}</a></p>}
        {s.instagram && <p>Instagram: <a className={link} href={`https://instagram.com/${s.instagram}`}>@{s.instagram}</a></p>}
        {s.facebook && <p>Facebook: <a className={link} href={`https://facebook.com/${s.facebook}`}>{s.facebook}</a></p>}
      </footer>
    </main>
  );
}
