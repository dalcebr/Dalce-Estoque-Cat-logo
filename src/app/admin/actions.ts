"use server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { logAction } from "@/lib/audit";

export type AdminResult = { ok: true; msg: string } | { error: string };

async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: p } = await supabase.from("profiles").select("is_super_admin").eq("id", user.id).maybeSingle();
  if (!p?.is_super_admin) return null;
  return { supabase, userId: user.id };
}

/** Altera plano / validade / bloqueio de uma loja. */
export async function setPlan(storeId: string, plan: string, days: number): Promise<AdminResult> {
  const admin = await requireAdmin();
  if (!admin) return { error: "Ação não permitida." };
  const { error } = await admin.supabase.rpc("admin_set_plan", { p_store: storeId, p_plan: plan, p_days: days });
  if (error) return { error: "Não foi possível alterar o plano." };
  revalidatePath("/admin");
  return { ok: true, msg: "Plano atualizado." };
}

/**
 * Ativa ou suspende o acesso da loja.
 * Usa a RPC admin_set_active: reativar NÃO sobrescreve o plano do cliente
 * (antes forçava "pro", apagando o plano real contratado).
 */
export async function toggleStore(storeId: string, active: boolean): Promise<AdminResult> {
  const admin = await requireAdmin();
  if (!admin) return { error: "Ação não permitida." };
  const { error } = await admin.supabase.rpc("admin_set_active", {
    p_store: storeId,
    p_active: active,
  });
  if (error) return { error: "Não foi possível atualizar a loja." };
  revalidatePath("/admin");
  return { ok: true, msg: active ? "Loja ativada." : "Loja suspensa." };
}

/** Redefine a senha do dono da loja (requer SUPABASE_SERVICE_ROLE_KEY). */
export async function resetOwnerPassword(storeId: string, password: string): Promise<AdminResult> {
  const admin = await requireAdmin();
  if (!admin) return { error: "Ação não permitida." };
  if (password.length < 6) return { error: "A senha precisa ter pelo menos 6 caracteres." };

  const service = createAdminClient();
  if (!service) return { error: "Configure SUPABASE_SERVICE_ROLE_KEY para redefinir senhas." };

  const { data: owner } = await admin.supabase
    .from("profiles")
    .select("id")
    .eq("store_id", storeId)
    .order("created_at")
    .limit(1)
    .maybeSingle();
  if (!owner) return { error: "Nenhum usuário encontrado nesta loja." };

  const { error } = await service.auth.admin.updateUserById(owner.id, { password });
  if (error) return { error: "Não foi possível redefinir a senha." };
  await logAction(admin.supabase, storeId, "senha.redefinida");
  return { ok: true, msg: "Senha redefinida." };
}
