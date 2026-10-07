"use client";
import { useRef, useState } from "react";
import { ImagePlus } from "lucide-react";
import { saveProduct } from "@/app/cadastros/actions";
import { createBrowserSupabase } from "@/lib/supabase/client";
import { uploadImage, isBase64Image, resolveImageUrl } from "@/lib/storage";

export type ProductInit = { id?: string; name: string; price: string; cost: string; stock: string; min_stock: string; category_id: string; image: string };
const f = "w-full rounded-2xl border border-line bg-surface px-4 py-3.5 text-lg outline-none focus:border-brand";
const L = ({ t }: { t: string }) => <span className="mb-1 block px-1 text-xs font-bold uppercase tracking-[0.15em] text-soft">{t}</span>;

const BUCKET = "product-images";
const MAX_PX = 160;

export default function ProductForm({ p, cats, storeId }: { p: ProductInit; cats: { id: string; name: string }[]; storeId: string }) {
  // `img` holds: "" (none) | base64 data URL (legacy) | storage path like "{storeId}/{uuid}.webp"
  const [img, setImg] = useState(p.image);
  const [uploading, setUploading] = useState(false);
  const file = useRef<HTMLInputElement>(null);

  const displaySrc = img
    ? resolveImageUrl(process.env.NEXT_PUBLIC_SUPABASE_URL!, BUCKET, img)
    : "";

  async function handleFile(selected: File) {
    setUploading(true);
    try {
      const supabase = createBrowserSupabase();
      const path = await uploadImage(supabase, BUCKET, storeId, selected, MAX_PX);
      setImg(path);
    } catch (e) {
      console.error("Upload failed", e);
    } finally {
      setUploading(false);
    }
  }

  return (
    <form action={saveProduct} className="mt-6 space-y-3">
      <input type="hidden" name="id" value={p.id ?? ""} />
      <input type="hidden" name="image" value={img} />
      <div className="flex items-center gap-4 rounded-3xl border border-line bg-surface p-4">
        {displaySrc ? <img src={displaySrc} alt="" className="size-20 rounded-2xl bg-page object-cover" /> : <span className="grid size-20 place-items-center rounded-2xl bg-page text-soft"><ImagePlus size={28} /></span>}
        <div className="flex flex-wrap gap-2">
          <button type="button" disabled={uploading} onClick={() => file.current?.click()} className="rounded-xl bg-tint px-4 py-2.5 font-bold text-brand disabled:opacity-60">{uploading ? "Enviando..." : img ? "Trocar foto" : "Adicionar foto"}</button>
          {img && <button type="button" onClick={() => setImg("")} className="rounded-xl px-3 py-2.5 font-semibold text-red-700">Remover</button>}
        </div>
        <input ref={file} type="file" accept="image/*" hidden onChange={async (e) => { const x = e.target.files?.[0]; if (x) await handleFile(x); e.target.value = ""; }} />
      </div>
      <label className="block"><L t="Nome" /><input name="name" required defaultValue={p.name} className={f} /></label>
      <div className="grid grid-cols-2 gap-3">
        <label className="block"><L t="Preço de venda (R$)" /><input name="price" required inputMode="decimal" defaultValue={p.price} className={f} /></label>
        <label className="block"><L t="Custo (R$)" /><input name="cost" inputMode="decimal" defaultValue={p.cost} className={f} /></label>
      </div>
      <label className="block"><L t="Categoria" />
        <select name="category_id" defaultValue={p.category_id} className={f}><option value="">Sem categoria</option>{cats.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
      <div className="grid grid-cols-2 gap-3">
        <label className="block"><L t="Em estoque" /><input name="stock" inputMode="numeric" defaultValue={p.stock} className={f} /></label>
        <label className="block"><L t="Estoque mínimo" /><input name="min_stock" inputMode="numeric" defaultValue={p.min_stock} className={f} /></label>
      </div>
      <button className="w-full rounded-2xl bg-brand py-4 text-lg font-bold text-white">Salvar produto</button>
    </form>
  );
}
