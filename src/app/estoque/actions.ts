"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getStore, num } from "@/lib/store";

export async function updateProduct(fd: FormData) {
  const id = String(fd.get("id") ?? "");
  const name = String(fd.get("name") ?? "").trim();
  const price = num(fd.get("price")), cost = num(fd.get("cost"));
  const stock = Math.trunc(num(fd.get("stock"))), min_stock = Math.max(0, Math.trunc(num(fd.get("min_stock"))) || 0);
  if (!id || !name || !(price >= 0) || !(cost >= 0) || !Number.isFinite(stock)) return;
  const s = await getStore();
  if (!s) return;
  await s.supabase.from("products").update({ name, price, cost, stock, min_stock }).eq("id", id); // RLS limita à loja
  revalidatePath("/estoque");
  redirect("/estoque");
}
