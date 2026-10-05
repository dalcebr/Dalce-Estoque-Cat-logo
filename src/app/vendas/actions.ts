"use server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
export async function cancelSale(id: string) {
  const supabase = await createClient();
  await supabase.from("sales").update({ status: "cancelada" }).eq("id", id); // RLS limita à loja do usuário
  revalidatePath("/"); revalidatePath("/vendas"); revalidatePath(`/vendas/${id}`);
}
