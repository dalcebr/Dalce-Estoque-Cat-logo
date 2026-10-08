"use client";
import { useRef, useState } from "react";
import { ImagePlus, Star, Trash2, ChevronLeft, ChevronRight, Loader2, Crop } from "lucide-react";
import { saveProduct } from "@/app/cadastros/actions";
import { createBrowserSupabase } from "@/lib/supabase/client";
import { uploadImage, resolveImageUrl } from "@/lib/storage";
import { MAX_IMAGE_PX, type CropArea } from "@/lib/image";
import { MAX_PRODUCT_IMAGES } from "@/lib/products";
import { type ProductVariation, type VariationGroup } from "@/lib/variations";
import ImageCropper from "@/components/ImageCropper";
import VariationPicker from "@/components/VariationPicker";

export type ProductInit = { id?: string; name: string; price: string; cost: string; stock: string; min_stock: string; category_id: string; images: string[]; variations: ProductVariation[] };
const f = "w-full rounded-2xl border border-line bg-surface px-4 py-3.5 text-lg outline-none focus:border-brand";
const L = ({ t }: { t: string }) => <span className="mb-1 block px-1 text-xs font-bold uppercase tracking-[0.15em] text-soft">{t}</span>;

const BUCKET = "product-images";

/** Fila de arquivos aguardando recorte. */
type Pending = { file: File; url: string };

export default function ProductForm({ p, cats, groups, storeId }: { p: ProductInit; cats: { id: string; name: string }[]; groups: VariationGroup[]; storeId: string }) {
  // `images` holds storage paths like "{storeId}/{uuid}.webp" (or legacy base64).
  // A primeira posição é a capa (foto principal).
  const [images, setImages] = useState<string[]>(p.images);
  const [variations, setVariations] = useState<ProductVariation[]>(p.variations);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [queue, setQueue] = useState<Pending[]>([]);
  const [cropping, setCropping] = useState<Pending | null>(null);
  // Quando não é null, o recorte confirmado substitui a foto neste índice.
  const [replaceIndex, setReplaceIndex] = useState<number | null>(null);
  const file = useRef<HTMLInputElement>(null);

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const src = (v: string) => resolveImageUrl(supabaseUrl, BUCKET, v);
  const full = images.length >= MAX_PRODUCT_IMAGES;

  /** Envia um blob já processado (recortado ou não) para o Storage. */
  async function uploadBlob(blob: Blob, originalName: string) {
    const supabase = createBrowserSupabase();
    const asFile = new File([blob], originalName.replace(/\.[^.]+$/, "") + ".webp", { type: "image/webp" });
    return uploadImage(supabase, BUCKET, storeId, asFile, MAX_IMAGE_PX);
  }

  function handleFiles(selected: FileList) {
    const list = Array.from(selected);
    if (list.length === 0) return;
    const room = MAX_PRODUCT_IMAGES - images.length;
    if (room <= 0) { setError(`Máximo de ${MAX_PRODUCT_IMAGES} fotos por produto.`); return; }

    const accepted = list.slice(0, room);
    if (list.length > room) setError(`Só cabem ${MAX_PRODUCT_IMAGES} fotos. As demais foram ignoradas.`);

    const pending: Pending[] = accepted.map((f) => ({ file: f, url: URL.createObjectURL(f) }));
    // Abre o editor na primeira foto; as demais ficam na fila.
    setCropping(pending[0]);
    setQueue(pending.slice(1));
  }

  /** Confirma o recorte da foto atual e segue para a próxima da fila. */
  async function confirmCrop(crop: CropArea) {
    const current = cropping;
    if (!current) return;
    setCropping(null);
    setUploading(true);
    setError(null);
    try {
      const { toWebpBlob } = await import("@/lib/image");
      const blob = await toWebpBlob(current.file, MAX_IMAGE_PX, crop);
      const path = await uploadBlob(blob, current.file.name);
      URL.revokeObjectURL(current.url);
      setImages((prev) => [...prev, path].slice(0, MAX_PRODUCT_IMAGES));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Falha ao enviar a imagem.");
    } finally {
      setUploading(false);
      // Continua com a próxima foto da fila.
      if (queue.length > 0) {
        const [next, ...rest] = queue;
        setQueue(rest);
        setCropping(next);
      }
    }
  }

  /** Cancela o recorte da foto atual (pula para a próxima). */
  function cancelCrop() {
    if (cropping) URL.revokeObjectURL(cropping.url);
    setCropping(null);
    if (queue.length > 0) {
      const [next, ...rest] = queue;
      setQueue(rest);
      setCropping(next);
    }
  }

  /** Reabre o editor para recortar novamente uma foto já enviada. */
  async function recrop(index: number) {
    const value = images[index];
    const url = src(value);
    try {
      const res = await fetch(url);
      const blob = await res.blob();
      const f = new File([blob], `foto-${index + 1}.webp`, { type: blob.type || "image/webp" });
      setCropping({ file: f, url: URL.createObjectURL(f) });
      // Marca para substituir a foto atual ao confirmar.
      setReplaceIndex(index);
    } catch {
      setError("Não foi possível abrir esta foto para recorte.");
    }
  }

  async function confirmRecrop(crop: CropArea) {
    const current = cropping;
    if (!current || replaceIndex === null) return;
    const index = replaceIndex;
    setCropping(null);
    setReplaceIndex(null);
    setUploading(true);
    setError(null);
    try {
      const { toWebpBlob } = await import("@/lib/image");
      const blob = await toWebpBlob(current.file, MAX_IMAGE_PX, crop);
      const path = await uploadBlob(blob, current.file.name);
      URL.revokeObjectURL(current.url);
      setImages((prev) => prev.map((v, i) => (i === index ? path : v)));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Falha ao salvar o recorte.");
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
    <>
      {cropping && (
        <ImageCropper
          src={cropping.url}
          onCancel={replaceIndex !== null ? () => { URL.revokeObjectURL(cropping.url); setCropping(null); setReplaceIndex(null); } : cancelCrop}
          onConfirm={replaceIndex !== null ? confirmRecrop : confirmCrop}
        />
      )}

      <form action={saveProduct} className="mt-6 space-y-3">
        <input type="hidden" name="id" value={p.id ?? ""} />
        <input type="hidden" name="images" value={JSON.stringify(images)} />
        <input type="hidden" name="variations" value={JSON.stringify(variations)} />

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
                  <button
                    type="button"
                    onClick={() => recrop(i)}
                    aria-label="Recortar foto"
                    className="absolute right-1.5 top-1.5 grid size-7 place-items-center rounded-lg bg-black/60 text-white"
                  >
                    <Crop size={14} />
                  </button>
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
            A primeira foto é a capa. Toque na ⭐ para escolher outra como capa, no ✂️ para recortar ou use as setas para reordenar.
          </p>
          {error && <p className="mt-2 text-xs font-semibold text-red-600">{error}</p>}

          <input
            ref={file}
            type="file"
            accept="image/*"
            multiple
            hidden
            onChange={(e) => { if (e.target.files) handleFiles(e.target.files); e.target.value = ""; }}
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

        {/* ─── Variações ─── */}
        <VariationPicker groups={groups} value={variations} onChange={setVariations} />

        <button disabled={uploading} className="w-full rounded-2xl bg-brand py-4 text-lg font-bold text-white disabled:opacity-60">Salvar produto</button>
      </form>
    </>
  );
}
