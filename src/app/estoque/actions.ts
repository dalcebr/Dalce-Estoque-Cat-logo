"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getStore, num } from "@/lib/store";
import { isValidUUID, sanitizeText } from "@/lib/validation";

export async function updateProduct(fd: FormData) {
  const s = await getStore();
  if (!s) return void redirect("/login");

  const id = String(fd.get("id") ?? "").trim();
  if (!id || !isValidUUID(id)) return;

  const name = sanitizeText(String(fd.get("name") ?? ""), 80);
  const price = num(fd.get("price")), cost = num(fd.get("cost"));
  const stock = Math.trunc(num(fd.get("stock"))), min_stock = Math.max(0, Math.trunc(num(fd.get("min_stock"))) || 0);
  if (!name || !(price >= 0) || !(cost >= 0) || !Number.isFinite(stock)) return;

  await s.supabase.from("products").update({ name, price, cost, stock, min_stock }).eq("id", id).eq("store_id", s.storeId);
  revalidatePath("/estoque");
  redirect("/estoque");
}
