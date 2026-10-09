"use client";
import { useRef, useState } from "react";
import { ImagePlus, Trash2, Loader2, Crop } from "lucide-react";
import { saveCategory } from "@/app/cadastros/actions";
import { createBrowserSupabase } from "@/lib/supabase/client";
import { uploadImage, resolveImageUrl } from "@/lib/storage";
import { MAX_IMAGE_PX, type CropArea } from "@/lib/image";
import ImageCropper from "@/components/ImageCropper";

export type CategoryInit = { id?: string; name: string; color: string; image: string | null };

const BUCKET = "product-images";
const COLORS = ["#0f8b83", "#2563eb", "#d97706", "#be123c", "#0e7490", "#4d7c0f", "#7c3aed", "#475569"];

export default function CategoryForm({ c, storeId, supabaseUrl, supabaseKey }: { c: CategoryInit; storeId: string; supabaseUrl: string; supabaseKey: string }) {
  // `image` guarda o caminho no Storage ("{storeId}/{uuid}.webp") ou base64 legado.
  const [image, setImage] = useState<string | null>(c.image);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cropping, setCropping] = useState<{ file: File; url: string } | null>(null);
  const file = useRef<HTMLInputElement>(null);

  const src = (v: string) => resolveImageUrl(supabaseUrl, BUCKET, v);

  /** Envia um blob já processado (recortado ou não) para o Storage. */
  async function uploadBlob(blob: Blob, originalName: string) {
    const supabase = createBrowserSupabase(supabaseUrl, supabaseKey);
    const asFile = new File([blob], originalName.replace(/\.[^.]+$/, "") + ".webp", { type: "image/webp" });
    return uploadImage(supabase, BUCKET, storeId, asFile, MAX_IMAGE_PX);
  }

  function handleFile(selected: FileList) {
    const f = selected[0];
    if (!f) return;
    setError(null);
    setCropping({ file: f, url: URL.createObjectURL(f) });
  }

  /** Confirma o recorte e envia a foto. */
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
      setImage(path);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Falha ao enviar a imagem.");
    } finally {
      setUploading(false);
    }
  }

  function cancelCrop() {
    if (cropping) URL.revokeObjectURL(cropping.url);
    setCropping(null);
  }

  /** Reabre o editor para recortar novamente a foto já enviada. */
  async function recrop() {
    if (!image) return;
    try {
      const res = await fetch(src(image));
      const blob = await res.blob();
      const f = new File([blob], "capa.webp", { type: blob.type || "image/webp" });
      setCropping({ file: f, url: URL.createObjectURL(f) });
    } catch {
      setError("Não foi possível abrir esta foto para recorte.");
    }
  }

  return (
    <>
      {cropping && <ImageCropper src={cropping.url} onCancel={cancelCrop} onConfirm={confirmCrop} />}

      <form action={saveCategory} className="mt-6 space-y-4">
        <input type="hidden" name="id" value={c.id ?? ""} />
        <input type="hidden" name="image" value={image ?? ""} />

        {/* ─── Foto de capa ─── */}
        <div className="rounded-3xl border border-line bg-surface p-4">
          <span className="mb-3 block text-xs font-bold uppercase tracking-[0.15em] text-soft">Foto da categoria</span>

          {image ? (
            <div className="relative overflow-hidden rounded-2xl border border-line bg-page">
              <img src={src(image)} alt="Capa da categoria" className="aspect-video w-full object-cover" />
              <div className="flex items-center justify-end gap-2 border-t border-line bg-surface px-2 py-2">
                <button type="button" onClick={recrop} aria-label="Recortar foto" className="grid size-8 place-items-center rounded-lg text-soft">
                  <Crop size={16} />
                </button>
                <button type="button" onClick={() => setImage(null)} aria-label="Remover foto" className="grid size-8 place-items-center rounded-lg text-red-600">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              disabled={uploading}
              onClick={() => file.current?.click()}
              className="flex w-full flex-col items-center gap-2 rounded-2xl border border-dashed border-line bg-page py-8 text-soft disabled:opacity-60"
            >
              {uploading ? <Loader2 className="animate-spin" size={28} /> : <ImagePlus size={28} />}
              <span className="text-sm font-semibold">{uploading ? "Enviando..." : "Adicionar foto"}</span>
              <span className="text-xs">Qualquer formato (convertido para WebP)</span>
            </button>
          )}

          <p className="mt-3 text-xs text-soft">
            A foto aparece no card da categoria na vitrine. Sem foto, o catálogo usa a imagem de um produto da categoria.
          </p>
          {error && <p className="mt-2 text-xs font-semibold text-red-600">{error}</p>}

          <input
            ref={file}
            type="file"
            accept="image/*"
            hidden
            onChange={(e) => { if (e.target.files) handleFile(e.target.files); e.target.value = ""; }}
          />
        </div>

        <label className="block"><span className="mb-1 block px-1 text-xs font-bold uppercase tracking-[0.15em] text-soft">Nome</span>
          <input name="name" required maxLength={40} defaultValue={c.name} className="w-full rounded-2xl border border-line bg-surface px-4 py-3.5 text-lg outline-none focus:border-brand" /></label>

        <div><span className="mb-2 block px-1 text-xs font-bold uppercase tracking-[0.15em] text-soft">Cor</span>
          <div className="flex flex-wrap gap-3">{COLORS.map((k) => (
            <label key={k} className="cursor-pointer"><input type="radio" name="color" value={k} defaultChecked={k.toLowerCase() === c.color.toLowerCase()} className="peer sr-only" />
              <span className="block size-11 rounded-full ring-offset-2 ring-offset-page peer-checked:ring-4 peer-checked:ring-ink" style={{ background: k }} /></label>))}</div></div>

        <button disabled={uploading} className="w-full rounded-2xl bg-brand py-4 text-lg font-bold text-white disabled:opacity-60">Salvar categoria</button>
      </form>
    </>
  );
}
