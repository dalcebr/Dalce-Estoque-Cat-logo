import { isBase64Image, isStoragePath } from "@/lib/storage";

/** Máximo de fotos por produto. */
export const MAX_PRODUCT_IMAGES = 5;

/**
 * Normaliza a galeria de um produto.
 * - aceita `images` (array) e/ou `image` (capa legada)
 * - remove valores inválidos (nem storage path nem base64 legado)
 * - garante que a capa (`image`) seja a primeira foto
 * - limita a MAX_PRODUCT_IMAGES
 */
export function normalizeImages(images: unknown, cover?: string | null): string[] {
  const list: string[] = [];
  const push = (v: unknown) => {
    const s = String(v ?? "").trim();
    if (!s) return;
    if (!isStoragePath(s) && !isBase64Image(s)) return;
    if (isBase64Image(s) && s.length > 150_000) return;
    if (!list.includes(s)) list.push(s);
  };

  if (Array.isArray(images)) images.forEach(push);
  push(cover);

  return list.slice(0, MAX_PRODUCT_IMAGES);
}

/** Retorna a capa (primeira foto) da galeria. */
export function coverOf(images: string[]): string | null {
  return images[0] ?? null;
}
