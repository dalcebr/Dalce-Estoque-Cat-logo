"use client";
import { useRef, useState } from "react";
import { ImagePlus, Star, Trash2, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { saveProduct } from "@/app/cadastros/actions";
import { createBrowserSupabase } from "@/lib/supabase/client";
import { uploadImage, resolveImageUrl } from "@/lib/storage";
import { makeThumbnail } from "@/lib/image";
import { MAX_PRODUCT_IMAGES } from "@/lib/products";

export type ProductInit = { id?: string; name: string; price: string; cost: string; stock: string; min_stock: string; category_id: string; images: string[] };
const f = "w-full rounded-2xl border border-line bg-surface px-4 py-3.5 text-lg outline-none focus:border-brand";
const L = ({ t }: { t: string }) => <span className="mb-1 block px-1 text-xs font-bold uppercase tracking-[0.15em] text-soft">{t}</span>;

const BUCKET = "product-images";
const MAX_PX = 160;

export default function ProductForm({ p, cats, storeId }: { p: ProductInit; cats: { id: string; name: string }[]; storeId: string }) {
  // `images` holds storage paths like "{storeId}/{uuid}.webp" (or legacy base64).
  // A primeira posição é a capa (foto principal).
  const [images, setImages] = useState<string[]>(p.images);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const file = useRef<HTMLInputElement>(null);

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const src = (v: string) => resolveImageUrl(supabaseUrl, BUCKET, v);
  const full = images.length >= MAX_PRODUCT_IMAGES;

  async function handleFiles(selected: FileList) {
    const list = Array.from(selected);
    if (list.length === 0) return;
    const room = MAX_PRODUCT_IMAGES - images.length;
    if (room <= 0) { setError(`Máximo de ${MAX_PRODUCT_IMAGES} fotos por produto.`); return; }

    setUploading(true);
    setError(null);
    try {
      const supabase = createBrowserSupabase();
      const added: string[] = [];
      for (const file of list.slice(0, room)) {
        const path = await uploadImage(supabase, BUCKET, storeId, file, MAX_PX);
        added.push(path);
      }
      setImages((prev) => [...prev, ...added].slice(0, MAX_PRODUCT_IMAGES));
      if (list.length > room) setError(`Só cabem ${MAX_PRODUCT_IMAGES} fotos. As demais foram ignoradas.`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Falha ao enviar a imagem.");
    } finally {
      setUploading(false);
    }
  }

  function removeAt(i: number) {
    setImages((prev) => prev.filter((_, idx) => idx !== i));
  }

  function makeCover(i: number) {
    setImages((prev) => {
      if (i <= 0) return prev;
      const next = [...prev];
      const [pick] = next.splice(i, 1);
      next.unshift(pick);
      return next;
    });
  }

  function move(i: number, dir: -1 | 1) {
    setImages((prev) => {
      const j = i + dir;
      if (j < 0 || j >= prev.length) return prev;
      const next = [...prev];
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
  }

  return (
    <form action={saveProduct} className="mt-6 space-y-3">
      <input type="hidden" name="id" value={p.id ?? ""} />
      <input type="hidden" name="images" value={JSON.stringify(images)} />

      {/* ─── Galeria de fotos ─── */}
      <div className="rounded-3xl border border-line bg-surface p-4">
        <div className="mb-3 flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-[0.15em] text-soft">Fotos do produto</span>
          <span className="text-xs font-semibold text-soft">{images.length}/{MAX_PRODUCT_IMAGES}</span>
        </div>

        {images.length === 0 ? (
          <button
            type="button"
            disabled={uploading}
            onClick={() => file.current?.click()}
            className="flex w-full flex-col items-center gap-2 rounded-2xl border border-dashed border-line bg-page py-8 text-soft disabled:opacity-60"
          >
            {uploading ? <Loader2 className="animate-spin" size={28} /> : <ImagePlus size={28} />}
            <span className="text-sm font-semibold">{uploading ? "Enviando..." : "Adicionar fotos"}</span>
            <span className="text-xs">Até {MAX_PRODUCT_IMAGES} fotos · qualquer formato (convertido para WebP)</span>
          </button>
        ) : (
          <div className="grid grid-cols-3 gap-3">
            {images.map((v, i) => (
              <div key={v} className="relative overflow-hidden rounded-2xl border border-line bg-page">
                <img src={src(v)} alt={`Foto ${i + 1}`} className="aspect-square w-full object-cover" />
                {i === 0 && (
                  <span className="absolute left-1.5 top-1.5 rounded-full bg-brand px-2 py-0.5 text-[10px] font-bold text-white">CAPA</span>
                )}
                <div className="flex items-center justify-between gap-1 border-t border-line bg-surface px-1 py-1">
                  <button type="button" onClick={() => move(i, -1)} disabled={i === 0} aria-label="Mover para trás" className="grid size-7 place-items-center rounded-lg text-soft disabled:opacity-30">
                    <ChevronLeft size={16} />
                  </button>
                  <button type="button" onClick={() => makeCover(i)} disabled={i === 0} aria-label="Definir como capa" className="grid size-7 place-items-center rounded-lg text-brand disabled:opacity-30">
                    <Star size={15} fill={i === 0 ? "currentColor" : "none"} />
                  </button>
                  <button type="button" onClick={() => removeAt(i)} aria-label="Remover foto" className="grid size-7 place-items-center rounded-lg text-red-600">
                    <Trash2 size={15} />
                  </button>
                  <button type="button" onClick={() => move(i, 1)} disabled={i === images.length - 1} aria-label="Mover para frente" className="grid size-7 place-items-center rounded-lg text-soft disabled:opacity-30">
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            ))}

            {!full && (
              <button
                type="button"
                disabled={uploading}
                onClick={() => file.current?.click()}
                className="grid aspect-square place-items-center rounded-2xl border border-dashed border-line bg-page text-soft disabled:opacity-60"
              >
                {uploading ? <Loader2 className="animate-spin" size={22} /> : <ImagePlus size={22} />}
              </button>
            )}
          </div>
        )}

        <p className="mt-3 text-xs text-soft">
          A primeira foto é a capa. Toque na ⭐ para escolher outra como capa ou use as setas para reordenar.
        </p>
        {error && <p className="mt-2 text-xs font-semibold text-red-600">{error}</p>}

        <input
          ref={file}
          type="file"
          accept="image/*"
          multiple
          hidden
          onChange={async (e) => { if (e.target.files) await handleFiles(e.target.files); e.target.value = ""; }}
        />
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
      <button disabled={uploading} className="w-full rounded-2xl bg-brand py-4 text-lg font-bold text-white disabled:opacity-60">Salvar produto</button>
    </form>
  );
}
