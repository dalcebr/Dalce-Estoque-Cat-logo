/** Tipos e helpers de variações de produto. */

/** Grupo de variação reutilizável (cadastro). */
export type VariationGroup = { id: string; name: string; options: string[] };

/** Variação aplicada a um produto (com estoque/preço próprios). */
export type ProductVariation = {
  group_id: string | null;
  group_name: string;
  option: string;
  stock: number;
  price: number | null;
};

/** Máximo de grupos de variação por produto. */
export const MAX_VARIATION_GROUPS = 5;

/** Máximo de opções por grupo. */
export const MAX_VARIATION_OPTIONS = 50;

/** Normaliza a lista de variações vinda do formulário. */
export function normalizeVariations(raw: unknown): ProductVariation[] {
  if (!Array.isArray(raw)) return [];
  const out: ProductVariation[] = [];
  const seen = new Set<string>();
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const v = item as Record<string, unknown>;
    const group_name = String(v.group_name ?? "").trim().slice(0, 40);
    const option = String(v.option ?? "").trim().slice(0, 30);
    if (!group_name || !option) continue;
    const key = `${group_name.toLowerCase()}\u0000${option.toLowerCase()}`;
    if (seen.has(key)) continue;
    seen.add(key);
    const stock = Math.trunc(Number(v.stock));
    const price = v.price === null || v.price === undefined || v.price === "" ? null : Number(v.price);
    out.push({
      group_id: typeof v.group_id === "string" && v.group_id ? v.group_id : null,
      group_name,
      option,
      stock: Number.isFinite(stock) ? stock : 0,
      price: price !== null && Number.isFinite(price) && price >= 0 ? price : null,
    });
  }
  return out;
}

/** Agrupa variações por nome de grupo, preservando a ordem. */
export function groupVariations(variations: ProductVariation[]): { name: string; options: ProductVariation[] }[] {
  const map = new Map<string, ProductVariation[]>();
  for (const v of variations) {
    const list = map.get(v.group_name) ?? [];
    list.push(v);
    map.set(v.group_name, list);
  }
  return [...map.entries()].map(([name, options]) => ({ name, options }));
}

/** Soma o estoque das variações (0 quando não há variações). */
export function variationsStock(variations: ProductVariation[]): number {
  return variations.reduce((s, v) => s + (Number.isFinite(v.stock) ? v.stock : 0), 0);
}
