"use server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { logAction } from "@/lib/audit";

export async function cancelSale(id: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  const { data: p } = await supabase.from("profiles").select("store_id").eq("id", user.id).maybeSingle();
  if (!p) return;

  const { data: sale } = await supabase.from("sales").select("number, total").eq("id", id).maybeSingle();
  await supabase.rpc("cancel_sale", { p_sale: id }); // cancela e devolve o estoque (RLS limita à loja)
  await logAction(supabase, p.store_id, "venda.cancelada", sale ? `#${sale.number} · R$ ${Number(sale.total).toFixed(2)}` : id);

  revalidatePath("/"); revalidatePath("/vendas"); revalidatePath(`/vendas/${id}`);
}
