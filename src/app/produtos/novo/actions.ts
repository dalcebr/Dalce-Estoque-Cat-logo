"use server";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

const COLORS = ["#0f8b83", "#2563eb", "#d97706", "#be123c", "#0e7490", "#4d7c0f"];
const num = (v: FormDataEntryValue | null) => Number(String(v ?? "").replace(/\./g, "").replace(",", "."));

export async function createProduct(fd: FormData) {
  const name = String(fd.get("name") ?? "").trim();
  const price = num(fd.get("price")), cost = num(fd.get("cost"));
  const cat = String(fd.get("category") ?? "").trim();
  if (!name || !Number.isFinite(price) || price <= 0 || !Number.isFinite(cost) || cost < 0) return;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  const { data: profile } = await supabase.from("profiles").select("store_id").eq("id", user.id).single();
  if (!profile) return;

  let category_id: string | null = null;
  if (cat) {
    const { data: ex } = await supabase.from("categories").select("id").eq("name", cat).maybeSingle();
    if (ex) category_id = ex.id;
    else {
      const color = COLORS[[...cat].reduce((h, c) => h + c.charCodeAt(0), 0) % COLORS.length];
      const { data: n } = await supabase.from("categories").insert({ store_id: profile.store_id, name: cat, color }).select("id").single();
      category_id = n?.id ?? null;
    }
  }
  await supabase.from("products").insert({ store_id: profile.store_id, name, price, cost, category_id });
  redirect("/vendas/nova");
}
