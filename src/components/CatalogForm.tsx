"use client";
import { useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { Check, ExternalLink, Eye, EyeOff, Info, Image, Save, Sun, Moon, MessageCircle, Gift, Truck, Headphones, Shield, Star, Clock, Heart, CheckCircle, Plus, Trash2, Palette, Type } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import { saveCatalog } from "@/app/catalogo/actions";
import {
  BENEFIT_ICONS, DEFAULT_BENEFITS, COLOR_FIELDS, FONTS,
  type CatalogSettings, type StockMode, type Benefit, type CatalogColors, type CatalogFonts,
} from "@/lib/catalog";
import { createBrowserSupabase } from "@/lib/supabase/client";
import { uploadImage, resolveImageUrl } from "@/lib/storage";

const box = "w-full rounded-3xl border border-line bg-surface px-5 py-4 text-lg outline-none focus:border-brand";
const Sep = ({ t }: { t: string }) => <div className="my-7 flex items-center gap-4"><i className="h-px flex-1 bg-line" /><span className="text-xs font-bold uppercase tracking-[0.18em] text-soft">{t}</span><i className="h-px flex-1 bg-line" /></div>;
const Lbl = ({ t, opt }: { t: string; opt?: boolean }) => <span className="mb-2 mt-5 block px-1 text-lg font-extrabold first:mt-0">{t}{opt && <span className="text-base font-medium text-soft"> · opcional</span>}</span>;
const Prefix = ({ p, children }: { p: string; children: ReactNode }) => <div className="flex items-center gap-1 rounded-3xl border border-line bg-surface px-5 py-4 text-lg focus-within:border-brand"><span className="shrink-0 font-bold text-soft">{p}</span>{children}</div>;
const bare = "min-w-0 flex-1 bg-transparent font-bold outline-none placeholder:font-normal placeholder:text-soft";

const OPTS: { k: StockMode; n: string; s: string; Icon: typeof Eye }[] = [
  { k: "all", n: "Exibir todos os produtos", s: "Mostra mesmo sem estoque", Icon: Eye },
  { k: "hide", n: "Ocultar sem estoque", s: "Some da vitrine ao zerar", Icon: EyeOff },
  { k: "unavailable", n: "Exibir como indisponível", s: "Aparece, mas sem comprar", Icon: Info },
];

const HERO_BUCKET = "catalog-logos";
const HERO_MAX_PX = 1200;

const ICON_MAP: Record<string, typeof Headphones> = {
  headphones: Headphones, truck: Truck, shield: Shield, star: Star,
  check: CheckCircle, clock: Clock, heart: Heart, gift: Gift,
};

export default function CatalogForm({ initial, open, storeId }: { initial: CatalogSettings; open: boolean; storeId: string }) {
  const [v, setV] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [heroUploading, setHeroUploading] = useState(false);
  const [msg, setMsg] = useState<{ t: string; err?: boolean } | null>(null);
  const [host, setHost] = useState("");
  const heroFile = useRef<HTMLInputElement>(null);
  useEffect(() => setHost(location.host), []);
  const set = <K extends keyof CatalogSettings>(k: K, x: CatalogSettings[K]) => setV((s) => ({ ...s, [k]: x }));
  const setColor = (k: keyof CatalogColors, x: string) => setV((s) => ({ ...s, colors: { ...s.colors, [k]: x } }));
  const setFont = <K extends keyof CatalogFonts>(k: K, x: CatalogFonts[K]) => setV((s) => ({ ...s, fonts: { ...s.fonts, [k]: x } }));

  // Benefits helpers
  const benefits: Benefit[] = Array.isArray(v.benefits) && v.benefits.length > 0 ? v.benefits : DEFAULT_BENEFITS;
  const setBenefits = (b: Benefit[]) => set("benefits", b);
  const updateBenefit = (idx: number, field: keyof Benefit, val: string) => {
    const next = [...benefits];
    next[idx] = { ...next[idx], [field]: val };
    setBenefits(next);
  };
  const addBenefit = () => {
    if (benefits.length >= 4) return;
    setBenefits([...benefits, { icon: "star", title: "", description: "" }]);
  };
  const removeBenefit = (idx: number) => setBenefits(benefits.filter((_, i) => i !== idx));

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;

  async function save() {
    setBusy(true); setMsg(null);
    const r = await saveCatalog(v);
    setBusy(false);
    if ("error" in r) setMsg({ t: r.error, err: true }); else { set("slug", r.slug); setMsg({ t: "Catálogo salvo ✓" }); }
  }

  return (
    <main className="mx-auto min-h-dvh max-w-md bg-page px-5 pb-48 pt-5">
      <PageHeader eyebrow="Ajustes · Catálogo" title="Como sua loja aparece?" back="/" />

      {/* Ativar */}
      <button role="switch" aria-checked={v.active} onClick={() => set("active", !v.active)} className="mt-6 flex w-full items-center gap-4 rounded-3xl border border-line bg-surface p-5 text-left">
        <span className="flex-1 leading-tight"><b className="block text-xl font-extrabold">Ativar catálogo</b><span className="text-soft">Sua vitrine fica visível na internet</span></span>
        <span className={`h-9 w-16 shrink-0 rounded-full p-1 transition-colors ${v.active ? "bg-brand" : "bg-line"}`}><span className={`block size-7 rounded-full bg-white shadow transition-transform ${v.active ? "translate-x-7" : ""}`} /></span>
      </button>

      <Sep t="Endereço da loja" />
      <Lbl t="Link do catálogo" />
      <Prefix p="/c/"><input value={v.slug} onChange={(e) => set("slug", e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))} placeholder="nome-da-sua-loja" maxLength={30} autoCapitalize="none" className={bare} /></Prefix>
      <p className="mt-2 break-all px-1 text-sm text-soft">https://{host}/c/{v.slug || "seu-link"}{open && initial.slug && <> · <Link href={`/c/${initial.slug}`} target="_blank" className="inline-flex items-center gap-1 font-bold text-brand">Abrir <ExternalLink size={14} /></Link></>}</p>

      <Sep t="Dados da loja" />
      <Lbl t="Nome da loja" /><input value={v.store_name} onChange={(e) => set("store_name", e.target.value)} maxLength={80} placeholder="Ex: Dalce Joias" className={box} />
      <Lbl t="E-mail da loja" /><input value={v.email} onChange={(e) => set("email", e.target.value)} type="email" placeholder="contato@sualoja.com" className={box} />
      <Lbl t="Número" /><input value={v.phone} onChange={(e) => set("phone", e.target.value)} inputMode="tel" placeholder="(11) 99999-9999" className={box} />
      <Lbl t="Instagram" /><Prefix p="instagram.com/"><input value={v.instagram} onChange={(e) => set("instagram", e.target.value)} autoCapitalize="none" className={bare} /></Prefix>

      <Sep t="Produto sem estoque" />
      <div className="space-y-2.5">
        {OPTS.map(({ k, n, s, Icon }) => { const on = v.stock_mode === k; return (
          <button key={k} onClick={() => set("stock_mode", k)} className={`flex w-full items-center gap-4 rounded-3xl border p-4 text-left ${on ? "border-brand bg-tint" : "border-line bg-surface"}`}>
            <span className={`grid size-12 shrink-0 place-items-center rounded-xl ${on ? "bg-brand text-white" : "bg-page text-brand"}`}><Icon size={22} /></span>
            <span className="flex-1 leading-tight"><b className="block text-lg font-extrabold">{n}</b><span className="text-soft">{s}</span></span>
            {on && <span className="grid size-8 place-items-center rounded-full bg-brand text-white"><Check size={18} /></span>}
          </button>); })}
      </div>

      {/* ═══ BANNER PRINCIPAL ═══ */}
      <Sep t="Banner principal" />
      <section className="space-y-1">
        <div className="grid min-h-32 place-items-center rounded-[28px] bg-line/50 p-5">
          {v.hero_image && (
            <img src={resolveImageUrl(supabaseUrl, HERO_BUCKET, v.hero_image)} alt="Banner" className="mb-3 h-32 w-full rounded-2xl bg-surface object-cover" />
          )}
          <div className="flex gap-2">
            <button disabled={heroUploading} onClick={() => heroFile.current?.click()} className="flex items-center gap-2 rounded-2xl bg-surface px-5 py-3.5 text-lg font-semibold text-brand disabled:opacity-60">
              <Image size={22} />{heroUploading ? "Enviando..." : v.hero_image ? "Trocar imagem" : "Adicionar imagem do banner"}
            </button>
            {v.hero_image && <button onClick={() => set("hero_image", "")} className="rounded-2xl bg-surface px-4 py-3.5 font-semibold text-red-700">Remover</button>}
          </div>
          <input ref={heroFile} type="file" accept="image/*" hidden onChange={async (e) => {
            const f = e.target.files?.[0];
            if (f) {
              setHeroUploading(true);
              try {
                const supabase = createBrowserSupabase();
                const path = await uploadImage(supabase, HERO_BUCKET, storeId, f, HERO_MAX_PX);
                set("hero_image", path);
              } catch (err) { console.error("Hero upload failed", err); }
              finally { setHeroUploading(false); }
            }
            e.target.value = "";
          }} />
        </div>
        <Lbl t="Título do banner" opt />
        <input value={v.hero_title} onChange={(e) => set("hero_title", e.target.value)} maxLength={80} placeholder="Ex: NOVAS COLEÇÕES" className={box} />
        <Lbl t="Subtítulo" opt />
        <input value={v.hero_subtitle} onChange={(e) => set("hero_subtitle", e.target.value)} maxLength={80} placeholder="Ex: EXCLUSIVAS" className={box} />
        <Lbl t="Descrição" opt />
        <textarea value={v.hero_description} onChange={(e) => set("hero_description", e.target.value)} rows={2} maxLength={200} placeholder="Texto abaixo do título…" className={box} />
        <Lbl t="Texto do botão" />
        <input value={v.hero_button_text} onChange={(e) => set("hero_button_text", e.target.value)} maxLength={40} placeholder="VER PRODUTOS" className={box} />
      </section>

      {/* ═══ BENEFÍCIOS ═══ */}
      <Sep t="Benefícios" />
      <p className="mb-4 px-1 text-sm text-soft">Ícones exibidos abaixo do banner. Até 4 benefícios.</p>
      <div className="space-y-3">
        {benefits.map((b, idx) => {
          const IconComp = ICON_MAP[b.icon] || Star;
          return (
            <div key={idx} className="rounded-3xl border border-line bg-surface p-4">
              <div className="mb-3 flex items-center gap-3">
                <span className="grid size-10 place-items-center rounded-xl bg-page text-brand"><IconComp size={20} /></span>
                <b className="flex-1 text-lg font-extrabold">Benefício {idx + 1}</b>
                {benefits.length > 1 && (
                  <button onClick={() => removeBenefit(idx)} className="grid size-8 place-items-center rounded-lg text-red-600 hover:bg-red-50"><Trash2 size={16} /></button>
                )}
              </div>
              <label className="mb-2 block px-1 text-sm font-bold text-soft">Ícone</label>
              <div className="mb-3 flex flex-wrap gap-2">
                {BENEFIT_ICONS.map((ic) => {
                  const Ic = ICON_MAP[ic.k] || Star;
                  const on = b.icon === ic.k;
                  return (
                    <button key={ic.k} onClick={() => updateBenefit(idx, "icon", ic.k)}
                      className={`flex items-center gap-1.5 rounded-xl border px-3 py-2 text-sm font-medium ${on ? "border-brand bg-tint text-brand" : "border-line bg-page text-soft"}`}>
                      <Ic size={16} />{ic.n}
                    </button>
                  );
                })}
              </div>
              <label className="mb-1 block px-1 text-sm font-bold text-soft">Título</label>
              <input value={b.title} onChange={(e) => updateBenefit(idx, "title", e.target.value)} maxLength={60} placeholder="Ex: Envio rápido" className={box + " mb-2"} />
              <label className="mb-1 block px-1 text-sm font-bold text-soft">Descrição</label>
              <input value={b.description} onChange={(e) => updateBenefit(idx, "description", e.target.value)} maxLength={100} placeholder="Ex: Para todo Brasil" className={box} />
            </div>
          );
        })}
        {benefits.length < 4 && (
          <button onClick={addBenefit} className="flex w-full items-center justify-center gap-2 rounded-3xl border-2 border-dashed border-line bg-surface/50 p-4 text-lg font-semibold text-brand">
            <Plus size={20} /> Adicionar benefício
          </button>
        )}
      </div>

      {/* ═══ CORES ═══ */}
      <Sep t="Cores" />
      <p className="mb-4 px-1 text-sm text-soft">Escolha a cor de cada elemento do catálogo.</p>
      <div className="space-y-2.5">
        {COLOR_FIELDS.map(({ k, n }) => (
          <div key={k} className="flex items-center gap-3 rounded-3xl border border-line bg-surface p-3">
            <input type="color" value={v.colors[k]} onChange={(e) => setColor(k, e.target.value)}
              className="size-12 shrink-0 cursor-pointer rounded-2xl border border-line bg-page p-1" />
            <span className="flex-1 text-lg font-bold">{n}</span>
            <input value={v.colors[k]} onChange={(e) => setColor(k, e.target.value)} maxLength={7}
              className="w-28 rounded-2xl border border-line bg-page px-3 py-2 text-center font-mono text-base font-bold outline-none focus:border-brand" />
          </div>
        ))}
      </div>

      {/* ═══ FONTES ═══ */}
      <Sep t="Fontes" />
      <p className="mb-4 px-1 text-sm text-soft">Escolha duas fontes e onde cada uma é usada.</p>
      <div className="space-y-3">
        <div className="rounded-3xl border border-line bg-surface p-4">
          <label className="mb-2 flex items-center gap-2 px-1 text-sm font-bold text-soft"><Type size={16} /> Fonte 1</label>
          <select value={v.fonts.font_1} onChange={(e) => setFont("font_1", e.target.value as CatalogFonts["font_1"])} className={box}>
            {FONTS.map((f) => <option key={f.k} value={f.k}>{f.n}</option>)}
          </select>
        </div>
        <div className="rounded-3xl border border-line bg-surface p-4">
          <label className="mb-2 flex items-center gap-2 px-1 text-sm font-bold text-soft"><Type size={16} /> Fonte 2</label>
          <select value={v.fonts.font_2} onChange={(e) => setFont("font_2", e.target.value as CatalogFonts["font_2"])} className={box}>
            {FONTS.map((f) => <option key={f.k} value={f.k}>{f.n}</option>)}
          </select>
        </div>
        {([
          { k: "store_name_font" as const, n: "Nome da loja" },
          { k: "heading_font" as const, n: "Títulos" },
          { k: "card_font" as const, n: "Texto do card" },
          { k: "body_font" as const, n: "Textos gerais" },
        ]).map(({ k, n }) => (
          <div key={k} className="flex items-center gap-3 rounded-3xl border border-line bg-surface p-4">
            <span className="flex-1 text-lg font-bold">{n}</span>
            <div className="flex gap-2">
              {[1, 2].map((slot) => {
                const on = v.fonts[k] === slot;
                return (
                  <button key={slot} onClick={() => setFont(k, slot as 1 | 2)}
                    className={`rounded-xl border px-4 py-2 text-base font-bold ${on ? "border-brand bg-tint text-brand" : "border-line bg-page text-soft"}`}>
                    Fonte {slot}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* ═══ MODO ESCURO ═══ */}
      <Sep t="Modo escuro" />
      <button role="switch" aria-checked={v.dark_mode_enabled} onClick={() => set("dark_mode_enabled", !v.dark_mode_enabled)}
        className="flex w-full items-center gap-4 rounded-3xl border border-line bg-surface p-5 text-left">
        <span className="grid size-12 place-items-center rounded-xl bg-page text-brand">
          {v.dark_mode_enabled ? <Moon size={22} /> : <Sun size={22} />}
        </span>
        <span className="flex-1 leading-tight">
          <b className="block text-xl font-extrabold">Modo escuro</b>
          <span className="text-soft">{v.dark_mode_enabled ? "Botão visível no catálogo" : "Botão oculto no catálogo"}</span>
        </span>
        <span className={`h-9 w-16 shrink-0 rounded-full p-1 transition-colors ${v.dark_mode_enabled ? "bg-brand" : "bg-line"}`}>
          <span className={`block size-7 rounded-full bg-white shadow transition-transform ${v.dark_mode_enabled ? "translate-x-7" : ""}`} />
        </span>
      </button>

      {/* ═══ WHATSAPP ═══ */}
      <Sep t="WhatsApp" />
      <Lbl t="Mensagem inicial do pedido" />
      <div className="flex items-start gap-3 rounded-3xl border border-line bg-surface p-4">
        <span className="mt-1 grid size-10 shrink-0 place-items-center rounded-xl bg-green-100 text-green-700"><MessageCircle size={20} /></span>
        <textarea value={v.whatsapp_message} onChange={(e) => set("whatsapp_message", e.target.value)} rows={2} maxLength={300}
          placeholder="Olá! Gostaria de fazer um pedido:" className="min-w-0 flex-1 bg-transparent text-lg font-medium outline-none placeholder:text-soft" />
      </div>

      {/* ═══ SAVE BUTTON ═══ */}
      <div className="fixed inset-x-0 bottom-0 border-t border-line bg-page px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-3">
        <p className={`mb-2 text-center text-sm ${msg?.err ? "font-semibold text-red-700" : "text-soft"}`} role={msg?.err ? "alert" : undefined}>{msg?.t ?? "Alterações sincronizam com a vitrine ao salvar"}</p>
        <button onClick={save} disabled={busy} className="mx-auto flex w-full max-w-md items-center justify-center gap-3 rounded-[28px] bg-brand py-5 text-xl font-extrabold text-white shadow-lg disabled:opacity-60"><Save size={24} />{busy ? "Salvando..." : "Salvar catálogo"}</button>
      </div>
    </main>
  );
}
