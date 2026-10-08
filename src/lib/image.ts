/**
 * Utilitários de imagem do lado do cliente.
 *
 * Regras:
 * - Qualquer formato aceito pelo navegador (jpg, png, gif, webp, bmp, avif,
 *   heic em navegadores compatíveis, svg...) é convertido para WebP.
 * - A qualidade é preservada: só reduzimos se a imagem for MAIOR que o limite,
 *   e usamos downscale em etapas + alta qualidade de compressão.
 */

/** Qualidade padrão do WebP (0–1). Alta o suficiente para não borrar. */
export const WEBP_QUALITY = 0.92;

/** Lado máximo (em px) da imagem principal salva no Storage. */
export const MAX_IMAGE_PX = 1600;

/** Lado máximo (em px) da miniatura usada na pré-visualização. */
export const THUMB_PX = 480;

/** Área de recorte em pixels da imagem ORIGINAL (não da prévia). */
export type CropArea = { x: number; y: number; width: number; height: number };

/** Carrega um arquivo em um HTMLImageElement (decodifica qualquer formato suportado). */
export function loadImage(file: File | Blob): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Não foi possível ler esta imagem. Tente outro arquivo (JPG, PNG, WEBP...)."));
    };
    img.src = url;
  });
}

/**
 * Desenha a imagem (ou a região recortada dela) em um canvas, reduzindo para
 * caber em `max` px no maior lado. Usa downscale em etapas para evitar serrilhado.
 */
function drawToCanvas(
  img: HTMLImageElement,
  max: number,
  crop?: CropArea,
): HTMLCanvasElement {
  const sx = crop ? Math.max(0, Math.round(crop.x)) : 0;
  const sy = crop ? Math.max(0, Math.round(crop.y)) : 0;
  const sw = crop ? Math.max(1, Math.round(crop.width)) : img.naturalWidth;
  const sh = crop ? Math.max(1, Math.round(crop.height)) : img.naturalHeight;

  const k = Math.min(1, max / Math.max(sw, sh));
  const tw = Math.max(1, Math.round(sw * k));
  const th = Math.max(1, Math.round(sh * k));

  // Reduz em etapas (metade por vez) para manter a nitidez.
  let src: HTMLCanvasElement | HTMLImageElement = img;
  let cw = sw;
  let ch = sh;
  while (cw / 2 >= tw && ch / 2 >= th) {
    const half = document.createElement("canvas");
    half.width = Math.max(1, Math.floor(cw / 2));
    half.height = Math.max(1, Math.floor(ch / 2));
    const hctx = half.getContext("2d")!;
    hctx.imageSmoothingEnabled = true;
    hctx.imageSmoothingQuality = "high";
    hctx.drawImage(src, sx, sy, cw, ch, 0, 0, half.width, half.height);
    src = half;
    cw = half.width;
    ch = half.height;
  }

  const out = document.createElement("canvas");
  out.width = tw;
  out.height = th;
  const ctx = out.getContext("2d")!;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  if (src === img) {
    ctx.drawImage(img, sx, sy, sw, sh, 0, 0, tw, th);
  } else {
    ctx.drawImage(src, 0, 0, cw, ch, 0, 0, tw, th);
  }
  return out;
}

/** Converte um canvas em Blob WebP de alta qualidade. */
function canvasToWebp(canvas: HTMLCanvasElement, quality = WEBP_QUALITY): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("Falha ao processar a imagem."))),
      "image/webp",
      quality,
    );
  });
}

/**
 * Converte QUALQUER arquivo de imagem em um Blob WebP de alta qualidade.
 * Se `crop` for informado, recorta a região antes de redimensionar.
 */
export async function toWebpBlob(
  file: File | Blob,
  max = MAX_IMAGE_PX,
  crop?: CropArea,
): Promise<Blob> {
  const img = await loadImage(file);
  const canvas = drawToCanvas(img, max, crop);
  return canvasToWebp(canvas);
}

/** Gera uma miniatura WebP em data URL (usada na pré-visualização da galeria). */
export async function makeThumbnail(file: File | Blob, max = THUMB_PX): Promise<string> {
  const blob = await toWebpBlob(file, max);
  return await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Falha ao gerar pré-visualização."));
    reader.readAsDataURL(blob);
  });
}

/** Compatibilidade: redimensiona e devolve data URL WebP. */
export async function resizeImage(file: File, max = MAX_IMAGE_PX): Promise<string> {
  const blob = await toWebpBlob(file, max);
  return await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Falha ao processar a imagem."));
    reader.readAsDataURL(blob);
  });
}

/** Compatibilidade: redimensiona e devolve Blob WebP. */
export async function resizeImageToBlob(file: File, max = MAX_IMAGE_PX): Promise<Blob> {
  return toWebpBlob(file, max);
}
