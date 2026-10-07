"use server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
export async function cancelSale(id: string) {
  const supabase = await createClient();
  await supabase.rpc("cancel_sale", { p_sale: id }); // cancela e devolve o estoque (RLS limita à loja)
  revalidatePath("/"); revalidatePath("/vendas"); revalidatePath(`/vendas/${id}`);
}
