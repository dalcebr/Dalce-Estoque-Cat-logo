"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getStore } from "@/lib/store";
import { isValidUUID } from "@/lib/validation";

export async function cancelSale(id: string) {
  if (typeof id !== "string" || !isValidUUID(id)) return;
  const s = await getStore();
  if (!s) return void redirect("/login");
  // RLS limits to store, but we also pass the store context via the authenticated session
  await s.supabase.rpc("cancel_sale", { p_sale: id });
  revalidatePath("/"); revalidatePath("/vendas"); revalidatePath(`/vendas/${id}`);
}
