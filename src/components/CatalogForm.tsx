"use client";
import { useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { Check, ChevronRight, ExternalLink, Eye, EyeOff, ImagePlus, Info, Palette, Save, Store } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import { saveCatalog } from "@/app/catalogo/actions";
import { THEMES, type CatalogSettings, type StockMode } from "@/lib/catalog";
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

export default function CatalogForm({ initial, open, storeId }: { initial: CatalogSettings; open: boolean; storeId: string }) {
  const [v, setV] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [logoUploading, setLogoUploading] = useState(false);
  const [msg, setMsg] = useState<{ t: string; err?: boolean } | null>(null);
  const [themes, setThemes] = useState(false);
  const [host, setHost] = useState("");
  const file = useRef<HTMLInputElement>(null);
  useEffect(() => setHost(location.host), []);
  const set = <K extends keyof CatalogSettings>(k: K, x: CatalogSettings[K]) => setV((s) => ({ ...s, [k]: x }));
  const theme = THEMES.find((t) => t.k === v.theme) ?? THEMES[0];
  const sw = (cols: readonly string[]) => <span className="flex">{cols.map((c) => <i key={c} className="h-6 w-6 first:rounded-l-md last:rounded-r-md" style={{ background: c }} />)}</span>;

  async function save() {
    setBusy(true); setMsg(null);
    const r = await saveCatalog(v);
    setBusy(false);
    if ("error" in r) setMsg({ t: r.error, err: true }); else { set("slug", r.slug); setMsg({ t: "Catálogo salvo ✓" }); }
  }

  return (
    <main className="mx-auto min-h-dvh max-w-md bg-page px-5 pb-48 pt-5">
      <PageHeader eyebrow="Ajustes · Catálogo" title="Como sua loja aparece?" back="/" />

      <section className="mt-6 grid min-h-40 place-items-center rounded-[28px] bg-line/50 p-5">
        {v.logo && <img src={resolveImageUrl(process.env.NEXT_PUBLIC_SUPABASE_URL!, LOGO_BUCKET, v.logo)} alt="Logo da loja" className="mb-3 size-20 rounded-2xl bg-surface object-contain" />}
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
      <Lbl t="Texto de destaque" /><input value={v.highlight} onChange={(e) => set("highlight", e.target.value)} maxLength={120} placeholder="Ex: Pães quentinhos todo dia às 7h ☕" className={box} />
      <Lbl t="Texto livre superior" opt /><textarea value={v.top_text} onChange={(e) => set("top_text", e.target.value)} rows={2} maxLength={500} className={box} />
      <Lbl t="Sobre nós" opt /><textarea value={v.about} onChange={(e) => set("about", e.target.value)} rows={3} maxLength={1500} placeholder="Conte a história da sua loja…" className={box} />

      <Sep t="Personalização" />
      <section className="overflow-hidden rounded-3xl border border-line bg-surface">
        <button onClick={() => setThemes(!themes)} className="flex w-full items-center gap-4 p-4 text-left"><span className="grid size-12 place-items-center rounded-xl bg-page text-brand"><Palette size={22} /></span><b className="flex-1 text-xl font-extrabold">Tema do catálogo</b>{sw(theme.colors)}<ChevronRight size={20} className={`text-soft/70 transition-transform ${themes ? "rotate-90" : ""}`} /></button>
        {themes && <div className="divide-y divide-line border-t border-line">{THEMES.map((t) => (
          <button key={t.k} onClick={() => set("theme", t.k)} className="flex w-full items-center gap-4 px-5 py-3.5 text-left">{sw(t.colors)}<b className="flex-1 text-lg">{t.n}</b>{v.theme === t.k && <Check size={20} className="text-brand" />}</button>))}</div>}
      </section>

      <div className="fixed inset-x-0 bottom-0 border-t border-line bg-page px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-3">
        <p className={`mb-2 text-center text-sm ${msg?.err ? "font-semibold text-red-700" : "text-soft"}`} role={msg?.err ? "alert" : undefined}>{msg?.t ?? "Alterações sincronizam com a vitrine ao salvar"}</p>
        <button onClick={save} disabled={busy} className="mx-auto flex w-full max-w-md items-center justify-center gap-3 rounded-[28px] bg-brand py-5 text-xl font-extrabold text-white shadow-lg disabled:opacity-60"><Save size={24} />{busy ? "Salvando..." : "Salvar catálogo"}</button>
      </div>
    </main>
  );
}
