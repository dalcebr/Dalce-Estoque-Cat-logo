export async function resizeImage(file: File, max: number) {
  const img = await createImageBitmap(file), k = Math.min(1, max / Math.max(img.width, img.height));
  const c = document.createElement("canvas"); c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
  c.getContext("2d")!.drawImage(img, 0, 0, c.width, c.height);
  return c.toDataURL("image/webp", 0.85);
}

/** Resize an image and return a Blob (for direct upload to Supabase Storage). */
export async function resizeImageToBlob(file: File, max: number): Promise<Blob> {
  const img = await createImageBitmap(file), k = Math.min(1, max / Math.max(img.width, img.height));
  const c = document.createElement("canvas"); c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
  c.getContext("2d")!.drawImage(img, 0, 0, c.width, c.height);
  return new Promise((resolve, reject) => {
    c.toBlob((b) => (b ? resolve(b) : reject(new Error("Failed to create blob"))), "image/webp", 0.85);
  });
}

/**
 * Converte QUALQUER arquivo de imagem aceito pelo navegador (jpg, png, gif,
 * webp, bmp, avif, heic em navegadores compatíveis, svg, etc.) em um Blob WebP.
 * Se o navegador não conseguir decodificar o arquivo, lança um erro amigável.
 */
export async function toWebpBlob(file: File, max: number): Promise<Blob> {
  try {
    return await resizeImageToBlob(file, max);
  } catch {
    throw new Error("Não foi possível ler esta imagem. Tente outro arquivo (JPG, PNG, WEBP...).");
  }
}

/** Gera uma miniatura WebP (usada na pré-visualização da galeria). */
export async function makeThumbnail(file: File, max = 320): Promise<string> {
  const blob = await toWebpBlob(file, max);
  return await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Falha ao gerar pré-visualização."));
    reader.readAsDataURL(blob);
  });
}
