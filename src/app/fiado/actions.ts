"use server";
import { revalidatePath } from "next/cache";
import { getStore, num } from "@/lib/store";

export async function receiveFiado(fd: FormData) {
  const name = String(fd.get("name") ?? "").trim(), method = String(fd.get("method") ?? "dinheiro");
  const amount = num(fd.get("amount"));
  if (!name || !Number.isFinite(amount) || amount <= 0) return;
  const s = await getStore();
  if (!s) return;
  await s.supabase.from("fiado_receipts").insert({ store_id: s.storeId, customer_name: name, amount, method });
  revalidatePath("/fiado"); revalidatePath("/fiado/[name]", "page");
}
