"use server";
import { redirect } from "next/navigation";
import { getStore } from "@/lib/store";
export async function updateStore(fd: FormData) {
  const name = String(fd.get("name") ?? "").trim();
  if (!name) return;
  const s = await getStore();
  if (!s) return;
  await s.supabase.from("stores").update({ name }).eq("id", s.storeId);
  redirect("/ajustes");
}
