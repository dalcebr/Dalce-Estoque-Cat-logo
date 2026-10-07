"use client";
import { useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { Check, ChevronRight, ExternalLink, Eye, EyeOff, ImagePlus, Info, Palette, Save, Store, Sun, Moon, Type, MessageCircle, Image, Gift, Truck, Headphones, Shield, Star, Clock, Heart, CheckCircle, Plus, Trash2 } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import { saveCatalog } from "@/app/catalogo/actions";
import { THEMES, BENEFIT_ICONS, DEFAULT_BENEFITS, type CatalogSettings, type StockMode, type Benefit } from "@/lib/catalog";
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

const LOGO_BUCKET = "catalog-logos";
const LOGO_MAX_PX = 256;
const HERO_MAX_PX = 1200;

const ICON_MAP: Record<string, typeof Headphones> = {
  headphones: Headphones, truck: Truck, shield: Shield, star: Star,
  check: CheckCircle, clock: Clock, heart: Heart, gift: Gift,
};

export default function CatalogForm({ initial, open, storeId }: { initial: CatalogSettings; open: boolean; storeId: string }) {
  const [v, setV] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [logoUploading, setLogoUploading] = useState(false);
  const [heroUploading, setHeroUploading] = useState(false);
  const [msg, setMsg] = useState<{ t: string; err?: boolean } | null>(null);
  const [themes, setThemes] = useState(false);
  const [host, setHost] = useState("");
  const file = useRef<HTMLInputElement>(null);
  const heroFile = useRef<HTMLInputElement>(null);
  useEffect(() => setHost(location.host), []);
  const set = <K extends keyof CatalogSettings>(k: K, x: CatalogSettings[K]) => setV((s) => ({ ...s, [k]: x }));
  const theme = THEMES.find((t) => t.k === v.theme) ?? THEMES[0];
  const sw = (cols: readonly string[]) => <span className="flex">{cols.map((c) => <i key={c} className="h-6 w-6 first:rounded-l-md last:rounded-r-md" style={{ background: c }} />)}</span>;

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
  const removeBenefit = (idx: number) => {
    setBenefits(benefits.filter((_, i) => i !== idx));
  };

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

      {/* Logo */}
      <section className="mt-6 grid min-h-40 place-items-center rounded-[28px] bg-line/50 p-5">
        {v.logo && <img src={resolveImageUrl(supabaseUrl, LOGO_BUCKET, v.logo)} alt="Logo da loja" className="mb-3 size-20 rounded-2xl bg-surface object-contain" />}
        <div className="flex gap-2">
          <button disabled={logoUploading} onClick={() => file.current?.click()} className="flex items-center gap-2 rounded-2xl bg-surface px-5 py-3.5 text-lg font-semibold text-brand disabled:opacity-60"><ImagePlus size={22} />{logoUploading ? "Enviando..." : v.logo ? "Trocar logo" : "Adicionar logo"}</button>
          {v.logo && <button onClick={() => set("logo", "")} className="rounded-2xl bg-surface px-4 py-3.5 font-semibold text-red-700">Remover</button>}
        </div>
        <input ref={file} type="file" accept="image/*" hidden onChange={async (e) => {
          const f = e.target.files?.[0];
          if (f) {
            setLogoUploading(true);
            try {
              const supabase = createBrowserSupabase();
              const path = await uploadImage(supabase, LOGO_BUCKET, storeId, f, LOGO_MAX_PX);
              set("logo", path);
            } catch (err) { console.error("Logo upload failed", err); }
            finally { setLogoUploading(false); }
          }
          e.target.value = "";
        }} />
      </section>

      {/* Ativar */}
      <button role="switch" aria-checked={v.active} onClick={() => set("active", !v.active)} className="mt-5 flex w-full items-center gap-4 rounded-3xl border border-line bg-surface p-5 text-left">
        <span className="flex-1 leading-tight"><b className="block text-xl font-extrabold">Ativar catálogo</b><span className="text-soft">Sua vitrine fica visível na internet</span></span>
        <span className={`h-9 w-16 shrink-0 rounded-full p-1 transition-colors ${v.active ? "bg-brand" : "bg-line"}`}><span className={`block size-7 rounded-full bg-white shadow transition-transform ${v.active ? "translate-x-7" : ""}`} /></span>
      </button>

      <Sep t="Endereço da loja" />
      <Lbl t="Link do catálogo" />
      <Prefix p="/c/"><input value={v.slug} onChange={(e) => set("slug", e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))} placeholder="nome-da-sua-loja" maxLength={30} autoCapitalize="none" className={bare} /></Prefix>
      <p className="mt-2 break-all px-1 text-sm text-soft">https://{host}/c/{v.slug || "seu-link"}{open && initial.slug && <> · <Link href={`/c/${initial.slug}`} target="_blank" className="inline-flex items-center gap-1 font-bold text-brand">Abrir <ExternalLink size={14} /></Link></>}</p>

      <Sep t="Contato" />
      <Link href="/ajustes/loja" className="flex items-center gap-4 rounded-3xl border border-line bg-surface p-4"><span className="grid size-12 place-items-center rounded-2xl bg-page text-brand"><Store size={22} /></span><b className="flex-1 text-xl font-extrabold">Informações da Loja</b><ChevronRight className="text-soft/70" /></Link>
      <Lbl t="Telefone · WhatsApp" /><input value={v.phone} onChange={(e) => set("phone", e.target.value)} inputMode="tel" placeholder="(11) 99999-9999" className={box} />
      <Lbl t="E-mail" /><input value={v.email} onChange={(e) => set("email", e.target.value)} type="email" placeholder="contato@sualoja.com" className={box} />

      <Sep t="Produto sem estoque" />
      <div className="space-y-2.5">
        {OPTS.map(({ k, n, s, Icon }) => { const on = v.stock_mode === k; return (
          <button key={k} onClick={() => set("stock_mode", k)} className={`flex w-full items-center gap-4 rounded-3xl border p-4 text-left ${on ? "border-brand bg-tint" : "border-line bg-surface"}`}>
            <span className={`grid size-12 shrink-0 place-items-center rounded-xl ${on ? "bg-brand text-white" : "bg-page text-brand"}`}><Icon size={22} /></span>
            <span className="flex-1 leading-tight"><b className="block text-lg font-extrabold">{n}</b><span className="text-soft">{s}</span></span>
            {on && <span className="grid size-8 place-items-center rounded-full bg-brand text-white"><Check size={18} /></span>}
          </button>); })}
      </div>

      <Sep t="Redes sociais" />
      <Lbl t="Instagram" /><Prefix p="instagram.com/"><input value={v.instagram} onChange={(e) => set("instagram", e.target.value)} autoCapitalize="none" className={bare} /></Prefix>
      <Lbl t="Facebook" /><Prefix p="facebook.com/"><input value={v.facebook} onChange={(e) => set("facebook", e.target.value)} autoCapitalize="none" className={bare} /></Prefix>
      <Lbl t="Google Analytics ID" opt /><input value={v.analytics_id} onChange={(e) => set("analytics_id", e.target.value)} placeholder="G-XXXXXXXXXX" autoCapitalize="characters" className={box} />

      <Sep t="Textos da vitrine" />
      <Lbl t="Texto de destaque" /><input value={v.highlight} onChange={(e) => set("highlight", e.target.value)} maxLength={120} placeholder="Ex: Quem ama cuida" className={box} />
      <Lbl t="Texto livre superior" opt /><textarea value={v.top_text} onChange={(e) => set("top_text", e.target.value)} rows={2} maxLength={500} className={box} />
      <Lbl t="Sobre nós" opt /><textarea value={v.about} onChange={(e) => set("about", e.target.value)} rows={3} maxLength={1500} placeholder="Conte a história da sua loja…" className={box} />

      {/* ═══ HERO BANNER ═══ */}
      <Sep t="Banner principal" />
      <section className="space-y-1">
        {/* Hero image upload */}
        <div className="grid min-h-32 place-items-center rounded-[28px] bg-line/50 p-5">
          {v.hero_image && (
            <img src={resolveImageUrl(supabaseUrl, LOGO_BUCKET, v.hero_image)} alt="Banner" className="mb-3 h-32 w-full rounded-2xl bg-surface object-cover" />
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
                const path = await uploadImage(supabase, LOGO_BUCKET, storeId, f, HERO_MAX_PX);
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

      {/* ═══ BENEFITS ═══ */}
      <Sep t="Benefícios" />
      <p className="mb-4 px-1 text-sm text-soft">Ícones exibidos abaixo do banner. Até 4 benefícios.</p>
      <div className="space-y-3">
        {benefits.map((b, idx) => {
          const IconComp = ICON_MAP[b.icon] || Star;
          return (
            <div key={idx} className="rounded-3xl border border-line bg-surface p-4">
              <div className="flex items-center gap-3 mb-3">
                <span className="grid size-10 place-items-center rounded-xl bg-page text-brand"><IconComp size={20} /></span>
                <b className="flex-1 text-lg font-extrabold">Benefício {idx + 1}</b>
                {benefits.length > 1 && (
                  <button onClick={() => removeBenefit(idx)} className="grid size-8 place-items-center rounded-lg text-red-600 hover:bg-red-50"><Trash2 size={16} /></button>
                )}
              </div>
              {/* Icon picker */}
              <label className="mb-2 block px-1 text-sm font-bold text-soft">Ícone</label>
              <div className="flex flex-wrap gap-2 mb-3">
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

      {/* ═══ PERSONALIZAÇÃO VISUAL ═══ */}
      <Sep t="Personalização visual" />

      {/* Primary color */}
      <Lbl t="Cor principal" />
      <div className="flex items-center gap-3">
        <input type="color" value={v.primary_color || "#C9852B"} onChange={(e) => set("primary_color", e.target.value)}
          className="size-14 cursor-pointer rounded-2xl border border-line bg-surface p-1" />
        <input value={v.primary_color || "#C9852B"} onChange={(e) => set("primary_color", e.target.value)}
          maxLength={7} placeholder="#C9852B" className={bare + " rounded-2xl border border-line bg-surface px-4 py-3 text-lg font-mono font-bold"} />
      </div>

      {/* Dark mode toggle */}
      <button role="switch" aria-checked={v.dark_mode_enabled} onClick={() => set("dark_mode_enabled", !v.dark_mode_enabled)}
        className="mt-5 flex w-full items-center gap-4 rounded-3xl border border-line bg-surface p-5 text-left">
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

      {/* Theme selector */}
      <section className="mt-5 overflow-hidden rounded-3xl border border-line bg-surface">
        <button onClick={() => setThemes(!themes)} className="flex w-full items-center gap-4 p-4 text-left"><span className="grid size-12 place-items-center rounded-xl bg-page text-brand"><Palette size={22} /></span><b className="flex-1 text-xl font-extrabold">Tema do catálogo</b>{sw(theme.colors)}<ChevronRight size={20} className={`text-soft/70 transition-transform ${themes ? "rotate-90" : ""}`} /></button>
        {themes && <div className="divide-y divide-line border-t border-line">{THEMES.map((t) => (
          <button key={t.k} onClick={() => set("theme", t.k)} className="flex w-full items-center gap-4 px-5 py-3.5 text-left">{sw(t.colors)}<b className="flex-1 text-lg">{t.n}</b>{v.theme === t.k && <Check size={20} className="text-brand" />}</button>))}</div>}
      </section>

      {/* ═══ WHATSAPP ═══ */}
      <Sep t="WhatsApp" />
      <Lbl t="Mensagem inicial do pedido" />
      <div className="flex items-start gap-3 rounded-3xl border border-line bg-surface p-4">
        <span className="mt-1 grid size-10 shrink-0 place-items-center rounded-xl bg-green-100 text-green-700"><MessageCircle size={20} /></span>
        <textarea value={v.whatsapp_message} onChange={(e) => set("whatsapp_message", e.target.value)} rows={2} maxLength={300}
          placeholder="Olá! Gostaria de fazer um pedido:" className="min-w-0 flex-1 bg-transparent text-lg font-medium outline-none placeholder:text-soft" />
      </div>

      {/* ═══ FOOTER ═══ */}
      <Sep t="Rodapé" />
      <Lbl t="Texto do rodapé" opt />
      <textarea value={v.footer_text} onChange={(e) => set("footer_text", e.target.value)} rows={2} maxLength={200}
        placeholder="Ex: 19 anos de história" className={box} />

      {/* ═══ SAVE BUTTON ═══ */}
      <div className="fixed inset-x-0 bottom-0 border-t border-line bg-page px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-3">
        <p className={`mb-2 text-center text-sm ${msg?.err ? "font-semibold text-red-700" : "text-soft"}`} role={msg?.err ? "alert" : undefined}>{msg?.t ?? "Alterações sincronizam com a vitrine ao salvar"}</p>
        <button onClick={save} disabled={busy} className="mx-auto flex w-full max-w-md items-center justify-center gap-3 rounded-[28px] bg-brand py-5 text-xl font-extrabold text-white shadow-lg disabled:opacity-60"><Save size={24} />{busy ? "Salvando..." : "Salvar catálogo"}</button>
      </div>
    </main>
  );
}
