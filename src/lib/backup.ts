import { createAdminClient } from "@/lib/supabase/admin";

/** Versao do formato de backup. Incrementar se o schema mudar. */
export const BACKUP_VERSION = 1;

export type StoreBackup = {
  format: "dalce-estoque-backup";
  version: number;
  exportedAt: string;
  store: {
    name: string;
    monthly_goal: number | null;
    owner_username: string | null;
  };
  data: {
    categories: unknown[];
    products: unknown[];
    product_variations: unknown[];
    variation_groups: unknown[];
    customers: unknown[];
    sales: unknown[];
    sale_items: unknown[];
    sale_payments: unknown[];
    fiado_receipts: unknown[];
    catalog_settings: unknown[];
  };
};

/** Tabelas de dados exportadas/importadas, na ordem de dependencia. */
const TABLES = [
  "categories",
  "variation_groups",
  "products",
  "product_variations",
  "customers",
  "sales",
  "sale_items",
  "sale_payments",
  "fiado_receipts",
  "catalog_settings",
] as const;

type TableName = (typeof TABLES)[number];

/**
 * Exporta todos os dados de uma loja para um objeto JSON.
 * Usa o service role (ignora RLS) para ler tudo.
 */
export async function exportStore(storeId: string): Promise<StoreBackup | null> {
  const admin = createAdminClient();

  const { data: store } = await admin
    .from("stores")
    .select("name, monthly_goal, owner_username")
    .eq("id", storeId)
    .maybeSingle();
  if (!store) return null;

  const data = {} as StoreBackup["data"];
  for (const table of TABLES) {
    const { data: rows } = await admin.from(table).select("*").eq("store_id", storeId);
    (data as Record<string, unknown[]>)[table] = rows ?? [];
  }

  return {
    format: "dalce-estoque-backup",
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    store: {
      name: store.name,
      monthly_goal: store.monthly_goal != null ? Number(store.monthly_goal) : null,
      owner_username: store.owner_username ?? null,
    },
    data,
  };
}

/** Valida minimamente a estrutura de um backup importado. */
export function validateBackup(raw: unknown): raw is StoreBackup {
  if (!raw || typeof raw !== "object") return false;
  const b = raw as Partial<StoreBackup>;
  if (b.format !== "dalce-estoque-backup") return false;
  if (typeof b.version !== "number") return false;
  if (!b.store || typeof b.store.name !== "string" || !b.store.name.trim()) return false;
  if (!b.data || typeof b.data !== "object") return false;
  return true;
}

/**
 * Importa um backup criando uma NOVA loja (novo store_id) e remapeando
 * todos os IDs internos. Nao sobrescreve lojas existentes.
 *
 * Retorna o id da loja criada.
 */
export async function importStore(
  backup: StoreBackup,
  opts?: { storeName?: string; ownerUsername?: string },
): Promise<{ ok: true; storeId: string } | { ok: false; error: string }> {
  const admin = createAdminClient();

  const storeName = (opts?.storeName ?? backup.store.name).trim();
  if (!storeName) return { ok: false, error: "Nome da loja invalido." };

  // 1. Cria a loja.
  const { data: store, error: storeError } = await admin
    .from("stores")
    .insert({
      name: storeName,
      monthly_goal: backup.store.monthly_goal,
      owner_username: opts?.ownerUsername ?? backup.store.owner_username ?? null,
    })
    .select("id")
    .single();
  if (storeError || !store) {
    return { ok: false, error: storeError?.message ?? "Falha ao criar a loja." };
  }
  const newStoreId = store.id;

  // Mapa de IDs antigos -> novos, por tabela.
  const idMap = new Map<string, string>();
  const mapId = (oldId: unknown): string | null => {
    if (typeof oldId !== "string") return null;
    return idMap.get(oldId) ?? null;
  };

  /** Insere linhas remapeando store_id e FKs conhecidas. */
  async function insertRows(
    table: TableName,
    rows: unknown[],
    remap: (row: Record<string, unknown>) => Record<string, unknown>,
  ): Promise<string | null> {
    if (!rows || rows.length === 0) return null;
    const prepared = rows.map((r) => {
      const row = { ...(r as Record<string, unknown>) };
      delete row.store_id;
      delete row.id; // gera novo UUID para evitar colisao com a loja original
      const mapped = remap(row);
      return { ...mapped, store_id: newStoreId };
    });
    const { data, error } = await admin.from(table).insert(prepared).select("id");
    if (error) return error.message;
    // Registra o mapeamento de IDs (a ordem de insercao e preservada).
    (data ?? []).forEach((inserted, i) => {
      const oldId = (rows[i] as Record<string, unknown>)?.id;
      if (typeof oldId === "string" && inserted?.id) idMap.set(oldId, inserted.id);
    });
    return null;
  }

  try {
    // categories
    let err = await insertRows("categories", backup.data.categories ?? [], (r) => r);
    if (err) throw new Error(`categories: ${err}`);

    // variation_groups
    err = await insertRows("variation_groups", backup.data.variation_groups ?? [], (r) => r);
    if (err) throw new Error(`variation_groups: ${err}`);

    // products (remapeia category_id)
    err = await insertRows("products", backup.data.products ?? [], (r) => ({
      ...r,
      category_id: mapId(r.category_id),
    }));
    if (err) throw new Error(`products: ${err}`);

    // product_variations (remapeia product_id e group_id)
    err = await insertRows("product_variations", backup.data.product_variations ?? [], (r) => ({
      ...r,
      product_id: mapId(r.product_id),
      group_id: mapId(r.group_id),
    }));
    if (err) throw new Error(`product_variations: ${err}`);

    // customers
    err = await insertRows("customers", backup.data.customers ?? [], (r) => r);
    if (err) throw new Error(`customers: ${err}`);

    // sales
    err = await insertRows("sales", backup.data.sales ?? [], (r) => r);
    if (err) throw new Error(`sales: ${err}`);

    // sale_items (remapeia sale_id e product_id)
    err = await insertRows("sale_items", backup.data.sale_items ?? [], (r) => ({
      ...r,
      sale_id: mapId(r.sale_id),
      product_id: mapId(r.product_id),
    }));
    if (err) throw new Error(`sale_items: ${err}`);

    // sale_payments (remapeia sale_id)
    err = await insertRows("sale_payments", backup.data.sale_payments ?? [], (r) => ({
      ...r,
      sale_id: mapId(r.sale_id),
    }));
    if (err) throw new Error(`sale_payments: ${err}`);

    // fiado_receipts
    err = await insertRows("fiado_receipts", backup.data.fiado_receipts ?? [], (r) => r);
    if (err) throw new Error(`fiado_receipts: ${err}`);

    // catalog_settings (PK e store_id; remove id e usa upsert simples)
    const settings = (backup.data.catalog_settings ?? []) as Record<string, unknown>[];
    if (settings.length > 0) {
      const row = { ...settings[0] };
      delete row.store_id;
      // O slug e unico globalmente: limpa para evitar conflito com a loja original.
      row.slug = null;
      row.active = false;
      const { error } = await admin
        .from("catalog_settings")
        .insert({ ...row, store_id: newStoreId });
      if (error) throw new Error(`catalog_settings: ${error.message}`);
    }
  } catch (e) {
    // Rollback manual: remove a loja criada (cascade limpa o resto).
    await admin.from("stores").delete().eq("id", newStoreId);
    return { ok: false, error: e instanceof Error ? e.message : "Falha na importacao." };
  }

  return { ok: true, storeId: newStoreId };
}
