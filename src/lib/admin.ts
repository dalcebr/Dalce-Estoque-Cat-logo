import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

/** Email sintetico usado pelo sistema: `usuario@dalce.app`. */
export const EMAIL_DOMAIN = "dalce.app";

/** Constroi o email sintetico a partir do username. */
export function usernameToEmail(username: string): string {
  return `${username}@${EMAIL_DOMAIN}`;
}

/** Valida o formato do username (mesmo padrao do login). */
export function isValidUsername(username: string): boolean {
  return /^[a-z0-9._-]{3,30}$/.test(username);
}

export type AdminStore = {
  storeId: string;
  storeName: string;
  frozen: boolean;
  frozenAt: string | null;
  frozenReason: string | null;
  createdAt: string;
  ownerId: string | null;
  ownerName: string | null;
  ownerUsername: string | null;
  counts: { products: number; sales: number; customers: number };
};

/**
 * Verifica se o usuario autenticado e administrador.
 * Retorna o id do usuario admin ou null.
 */
export async function getAdminUserId(): Promise<string | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: rpcRole, error: rpcError } = await supabase.rpc("current_role_name");
  if (!rpcError) return rpcRole === "admin" ? user.id : null;
  const { data } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();
  return data?.role === "admin" ? user.id : null;
}

/** Lista todas as lojas com dados do dono e contagens. */
export async function listStores(): Promise<AdminStore[]> {
  const admin = createAdminClient();

  const { data: stores } = await admin
    .from("stores")
    .select("id, name, frozen, frozen_at, frozen_reason, created_at")
    .order("created_at", { ascending: false });

  if (!stores) return [];

  const { data: profiles } = await admin
    .from("profiles")
    .select("id, store_id, name, username, role");

  const byStore = new Map<string, { id: string; name: string; username: string | null }>();
  for (const p of profiles ?? []) {
    if (p.role === "admin") continue;
    if (!byStore.has(p.store_id)) {
      byStore.set(p.store_id, { id: p.id, name: p.name, username: p.username });
    }
  }

  const result: AdminStore[] = [];
  for (const s of stores) {
    const owner = byStore.get(s.id) ?? null;
    const [products, sales, customers] = await Promise.all([
      admin.from("products").select("id", { count: "exact", head: true }).eq("store_id", s.id),
      admin.from("sales").select("id", { count: "exact", head: true }).eq("store_id", s.id),
      admin.from("customers").select("id", { count: "exact", head: true }).eq("store_id", s.id),
    ]);
    result.push({
      storeId: s.id,
      storeName: s.name,
      frozen: s.frozen,
      frozenAt: s.frozen_at,
      frozenReason: s.frozen_reason,
      createdAt: s.created_at,
      ownerId: owner?.id ?? null,
      ownerName: owner?.name ?? null,
      ownerUsername: owner?.username ?? null,
      counts: {
        products: products.count ?? 0,
        sales: sales.count ?? 0,
        customers: customers.count ?? 0,
      },
    });
  }
  return result;
}

/** Cria uma nova loja + usuario de acesso. Retorna o id da loja criada. */
export async function createStoreAccount(input: {
  storeName: string;
  ownerName: string;
  username: string;
  password: string;
}): Promise<{ ok: true; storeId: string } | { ok: false; error: string }> {
  const admin = createAdminClient();
  const email = usernameToEmail(input.username);

  // 1. Cria o usuario no Auth.
  const { data: created, error: authError } = await admin.auth.admin.createUser({
    email,
    password: input.password,
    email_confirm: true,
    user_metadata: { name: input.ownerName, username: input.username },
  });
  if (authError || !created.user) {
    const msg = authError?.message ?? "Falha ao criar usuario.";
    if (/already|registered|exists/i.test(msg)) return { ok: false, error: "Este usuário já existe." };
    return { ok: false, error: msg };
  }

  const userId = created.user.id;

  // 2. Cria a loja.
  const { data: store, error: storeError } = await admin
    .from("stores")
    .insert({ name: input.storeName, owner_username: input.username })
    .select("id")
    .single();
  if (storeError || !store) {
    try { await admin.auth.admin.deleteUser(userId); } catch { /* ignora */ }
    return { ok: false, error: storeError?.message ?? "Falha ao criar a loja." };
  }

  // 3. Cria o perfil vinculando usuario e loja.
  const { error: profileError } = await admin.from("profiles").insert({
    id: userId,
    store_id: store.id,
    name: input.ownerName,
    username: input.username,
    role: "owner",
  });
  if (profileError) {
    await admin.from("stores").delete().eq("id", store.id);
    try { await admin.auth.admin.deleteUser(userId); } catch { /* ignora */ }
    return { ok: false, error: profileError.message };
  }

  return { ok: true, storeId: store.id };
}

export type AdminUser = {
  id: string;
  name: string;
  username: string | null;
  createdAt: string;
};

/** Lista todos os administradores do sistema. */
export async function listAdmins(): Promise<AdminUser[]> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("profiles")
    .select("id, name, username, created_at")
    .eq("role", "admin")
    .order("created_at", { ascending: true });
  return (data ?? []).map((p) => ({
    id: p.id,
    name: p.name,
    username: p.username,
    createdAt: p.created_at,
  }));
}

/**
 * Cria um novo administrador do sistema.
 * O admin nao pertence a nenhuma loja, por isso o perfil e criado com
 * store_id nulo (a coluna precisa aceitar null — ver 023_admin_role_helper.sql).
 */
export async function createAdminAccount(input: {
  name: string;
  username: string;
  password: string;
}): Promise<{ ok: true; userId: string } | { ok: false; error: string }> {
  const admin = createAdminClient();
  const email = usernameToEmail(input.username);

  const { data: created, error: authError } = await admin.auth.admin.createUser({
    email,
    password: input.password,
    email_confirm: true,
    user_metadata: { name: input.name, username: input.username },
  });
  if (authError || !created.user) {
    const msg = authError?.message ?? "Falha ao criar usuário.";
    if (/already|registered|exists/i.test(msg)) return { ok: false, error: "Este usuário já existe." };
    return { ok: false, error: msg };
  }

  const userId = created.user.id;

  const { error: profileError } = await admin.from("profiles").insert({
    id: userId,
    store_id: null,
    name: input.name,
    username: input.username,
    role: "admin",
  });
  if (profileError) {
    try { await admin.auth.admin.deleteUser(userId); } catch { /* ignora */ }
    return { ok: false, error: profileError.message };
  }

  return { ok: true, userId };
}

/** Congela ou descongela uma loja. */
export async function setStoreFrozen(
  storeId: string,
  frozen: boolean,
  reason?: string,
): Promise<{ ok: boolean; error?: string }> {
  const admin = createAdminClient();
  const { error } = await admin
    .from("stores")
    .update({
      frozen,
      frozen_at: frozen ? new Date().toISOString() : null,
      frozen_reason: frozen ? (reason ?? null) : null,
    })
    .eq("id", storeId);
  return error ? { ok: false, error: error.message } : { ok: true };
}

/** Redefine a senha do usuario dono da loja. */
export async function resetStorePassword(
  userId: string,
  password: string,
): Promise<{ ok: boolean; error?: string }> {
  const admin = createAdminClient();
  const { error } = await admin.auth.admin.updateUserById(userId, { password });
  return error ? { ok: false, error: error.message } : { ok: true };
}

/**
 * Exclui a loja e TODOS os seus dados, alem do usuario de acesso.
 * As tabelas de dados caem por cascade a partir de `stores`.
 */
export async function deleteStoreAccount(
  storeId: string,
): Promise<{ ok: boolean; error?: string }> {
  const admin = createAdminClient();

  // Descobre o(s) usuario(s) vinculados para remover do Auth.
  const { data: profiles } = await admin
    .from("profiles")
    .select("id")
    .eq("store_id", storeId);

  // Remove a loja (cascade apaga os dados das tabelas filhas).
  const { error: storeError } = await admin.from("stores").delete().eq("id", storeId);
  if (storeError) return { ok: false, error: storeError.message };

  // Remove os usuarios do Auth.
  for (const p of profiles ?? []) {
    try { await admin.auth.admin.deleteUser(p.id); } catch { /* ignora */ }
  }

  return { ok: true };
}
