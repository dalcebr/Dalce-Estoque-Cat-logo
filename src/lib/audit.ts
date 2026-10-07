import type { SupabaseClient } from "@supabase/supabase-js";

/** Registra uma ação sensível na auditoria da loja (falha em silêncio). */
export async function logAction(
  supabase: SupabaseClient,
  storeId: string,
  action: string,
  detail?: string
) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data: p } = await supabase.from("profiles").select("name").eq("id", user.id).maybeSingle();
    await supabase.from("audit_logs").insert({
      store_id: storeId,
      actor_id: user.id,
      actor_name: p?.name ?? null,
      action,
      detail: detail?.slice(0, 300) ?? null,
    });
  } catch {
    /* auditoria nunca deve quebrar a operação */
  }
}
