"use client";
import { createClient } from "@/lib/supabase/client";

/**
 * Redimensiona e comprime a imagem no navegador antes do upload.
 * Isso reduz o tráfego do cliente (importante no celular) e o custo de Storage.
 */
export async function resizeImage(file: File, max: number, quality = 0.85): Promise<Blob> {
  const img = await createImageBitmap(file);
  const k = Math.min(1, max / Math.max(img.width, img.height));
  const c = document.createElement("canvas");
  c.width = Math.max(1, Math.round(img.width * k));
  c.height = Math.max(1, Math.round(img.height * k));
  const ctx = c.getContext("2d");
  if (!ctx) throw new Error("canvas indisponível");
  ctx.drawImage(img, 0, 0, c.width, c.height);
  return await new Promise<Blob>((resolve, reject) =>
    c.toBlob((b) => (b ? resolve(b) : reject(new Error("falha ao converter imagem"))), "image/webp", quality)
  );
}

const MAX_BYTES = 2 * 1024 * 1024; // mesmo limite do bucket

export type UploadResult = { url: string } | { error: string };

/**
 * Envia uma imagem para o bucket "catalogo", na pasta da loja do usuário.
 * A política de Storage exige que a primeira pasta seja o store_id, então
 * uma loja nunca consegue gravar na pasta de outra.
 */
export async function uploadImage(file: File, storeId: string, prefix: string): Promise<UploadResult> {
  if (!file.type.startsWith("image/")) return { error: "Escolha um arquivo de imagem." };
  if (file.size > 12 * 1024 * 1024) return { error: "Imagem muito grande (máx. 12 MB)." };

  let blob: Blob;
  try {
    blob = await resizeImage(file, 1200);
  } catch {
    return { error: "Não foi possível processar a imagem." };
  }
  if (blob.size > MAX_BYTES) return { error: "Imagem muito grande mesmo após a compressão." };

  const supabase = createClient();
  const path = `${storeId}/${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.webp`;

  const { error } = await supabase.storage.from("catalogo").upload(path, blob, {
    contentType: "image/webp",
    cacheControl: "31536000",
    upsert: false,
  });
  if (error) return { error: "Falha no envio. Verifique sua conexão e tente novamente." };

  const { data } = supabase.storage.from("catalogo").getPublicUrl(path);
  return { url: data.publicUrl };
}

/** Remove uma imagem do Storage a partir da URL pública (ignora erros). */
export async function deleteImageByUrl(url: string | null | undefined) {
  if (!url) return;
  const marker = "/storage/v1/object/public/catalogo/";
  const i = url.indexOf(marker);
  if (i < 0) return; // não é do nosso bucket (ex.: data: antigo) — nada a fazer
  const path = decodeURIComponent(url.slice(i + marker.length).split("?")[0]);
  try {
    const supabase = createClient();
    await supabase.storage.from("catalogo").remove([path]);
  } catch {
    /* limpeza é best-effort */
  }
}
