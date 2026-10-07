"use server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { logAction } from "@/lib/audit";

export type CancelResult = { ok: true } | { error: string };

export async function cancelSale(id: string): Promise<CancelResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Sessão expirada. Entre novamente." };

  const { data: p } = await supabase.from("profiles").select("store_id").eq("id", user.id).maybeSingle();
  if (!p) return { error: "Perfil não encontrado." };

  const { data: sale } = await supabase
    .from("sales")
    .select("number, total, status")
    .eq("id", id)
    .maybeSingle();
  if (!sale) return { error: "Venda não encontrada." };
  if (sale.status === "cancelada") return { ok: true };

  // cancel_sale valida a loja e devolve o estoque de forma atômica
  const { error } = await supabase.rpc("cancel_sale", { p_sale: id });
  if (error) return { error: "Não foi possível cancelar a venda." };

  await logAction(supabase, p.store_id, "venda.cancelada", `#${sale.number} · R$ ${Number(sale.total).toFixed(2)}`);

  revalidatePath("/");
  revalidatePath("/vendas");
  revalidatePath(`/vendas/${id}`);
  revalidatePath("/estoque");
  return { ok: true };
}
