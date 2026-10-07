"use client";
import { useRef, useState } from "react";
import { ImagePlus, Loader2 } from "lucide-react";
import { saveProduct } from "@/app/cadastros/actions";
import { uploadImage, deleteImageByUrl } from "@/lib/image";

export type ProductInit = { id?: string; name: string; price: string; cost: string; stock: string; min_stock: string; category_id: string; image: string };
const f = "w-full rounded-2xl border border-line bg-surface px-4 py-3.5 text-lg outline-none focus:border-brand";
const L = ({ t }: { t: string }) => <span className="mb-1 block px-1 text-xs font-bold uppercase tracking-[0.15em] text-soft">{t}</span>;

export default function ProductForm({ p, cats, storeId }: { p: ProductInit; cats: { id: string; name: string }[]; storeId: string }) {
  const [img, setImg] = useState(p.image);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const file = useRef<HTMLInputElement>(null);

  async function pick(f: File) {
    setBusy(true); setErr("");
    const r = await uploadImage(f, storeId, "produto");
    setBusy(false);
    if ("error" in r) { setErr(r.error); return; }
    // remove a imagem antiga do Storage para não acumular lixo
    if (img && img !== r.url) void deleteImageByUrl(img);
    setImg(r.url);
  }

  function remove() {
    if (img) void deleteImageByUrl(img);
    setImg("");
  }

  return (
    <form action={saveProduct} className="mt-6 space-y-3">
      <input type="hidden" name="id" value={p.id ?? ""} />
      <input type="hidden" name="image" value={img} />
      <div className="flex items-center gap-4 rounded-3xl border border-line bg-surface p-4">
        {img
          ? <img src={img} alt="" className="size-20 rounded-2xl bg-page object-cover" />
          : <span className="grid size-20 place-items-center rounded-2xl bg-page text-soft">{busy ? <Loader2 size={28} className="animate-spin" /> : <ImagePlus size={28} />}</span>}
        <div className="flex flex-wrap gap-2">
          <button type="button" disabled={busy} onClick={() => file.current?.click()} className="rounded-xl bg-tint px-4 py-2.5 font-bold text-brand disabled:opacity-60">
            {busy ? "Enviando..." : img ? "Trocar foto" : "Adicionar foto"}
          </button>
          {img && !busy && <button type="button" onClick={remove} className="rounded-xl px-3 py-2.5 font-semibold text-red-700">Remover</button>}
        </div>
        <input ref={file} type="file" accept="image/*" hidden onChange={async (e) => { const x = e.target.files?.[0]; if (x) await pick(x); e.target.value = ""; }} />
      </div>
      {err && <p role="alert" className="px-1 text-sm font-semibold text-red-700">{err}</p>}
      <label className="block"><L t="Nome" /><input name="name" required maxLength={80} defaultValue={p.name} className={f} /></label>
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
      <button disabled={busy} className="w-full rounded-2xl bg-brand py-4 text-lg font-bold text-white disabled:opacity-60">Salvar produto</button>
    </form>
  );
}
