"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getStore, num } from "@/lib/store";

const str = (fd: FormData, k: string, max = 120) => String(fd.get(k) ?? "").trim().slice(0, max);
const esc = (s: string) => s.replace(/[%_\\]/g, "\\$&");

export async function saveProduct(fd: FormData) {
  const id = str(fd, "id"), name = str(fd, "name", 80);
  const price = num(fd.get("price")), cost = num(fd.get("cost"));
  if (!name || !Number.isFinite(price) || price <= 0 || !Number.isFinite(cost) || cost < 0) return;
  let image = String(fd.get("image") ?? "");
  if (image && (!image.startsWith("data:image/") || image.length > 150_000)) image = "";
  const row = { name, price, cost, stock: Math.trunc(num(fd.get("stock"))) || 0, min_stock: Math.max(0, Math.trunc(num(fd.get("min_stock"))) || 0), image: image || null, category_id: str(fd, "category_id") || null };
  const s = await getStore();
  if (!s) return;
  if (id) await s.supabase.from("products").update(row).eq("id", id);
  else await s.supabase.from("products").insert({ ...row, store_id: s.storeId });
  revalidatePath("/cadastros/produtos"); revalidatePath("/estoque");
  redirect("/cadastros/produtos");
}
export async function archiveProduct(id: string) {
  const s = await getStore();
  if (s) await s.supabase.from("products").update({ active: false }).eq("id", id);
  revalidatePath("/cadastros/produtos"); revalidatePath("/estoque");
  redirect("/cadastros/produtos");
}

export async function saveCategory(fd: FormData) {
  const id = str(fd, "id"), name = str(fd, "name", 40), color = str(fd, "color", 7);
  if (!name || !/^#[0-9a-f]{6}$/i.test(color)) return;
  const s = await getStore();
  if (!s) return;
  const { error } = id ? await s.supabase.from("categories").update({ name, color }).eq("id", id) : await s.supabase.from("categories").insert({ name, color, store_id: s.storeId });
  if (error?.code === "23505") redirect(`/cadastros/categorias/${id || "novo"}?erro=nome`);
  revalidatePath("/cadastros/categorias"); revalidatePath("/cadastros/produtos");
  redirect("/cadastros/categorias");
}
export async function deleteCategory(id: string) {
  const s = await getStore();
  if (s) await s.supabase.from("categories").delete().eq("id", id);
  revalidatePath("/cadastros/categorias"); revalidatePath("/cadastros/produtos");
  redirect("/cadastros/categorias");
}

export async function saveCustomer(fd: FormData) {
  const id = str(fd, "id"), name = str(fd, "name", 80);
  const phone = str(fd, "phone", 20).replace(/[^\d+()\-\s]/g, ""), cpf = str(fd, "cpf", 20).replace(/\D/g, "");
  const here = `/cadastros/clientes/${id || "novo"}`;
  if (!id && !name) return;
  if (cpf && cpf.length !== 11) redirect(`${here}?erro=cpf`);
  const s = await getStore();
  if (!s) return;
  if (id) await s.supabase.from("customers").update({ phone: phone || null, cpf: cpf || null }).eq("id", id);
  else {
    const { data: ex } = await s.supabase.from("customers").select("id").ilike("name", esc(name)).maybeSingle();
    if (ex) redirect(`${here}?erro=nome`);
    await s.supabase.from("customers").insert({ store_id: s.storeId, name, phone: phone || null, cpf: cpf || null });
  }
  revalidatePath("/cadastros/clientes");
  redirect("/cadastros/clientes");
}

export async function saveVariation(fd: FormData) {
  const id = str(fd, "id"), name = str(fd, "name", 40);
  const options = [...new Set(String(fd.get("options") ?? "").split(/[\n,;]+/).map((o) => o.trim().slice(0, 30)).filter(Boolean))].slice(0, 50);
  if (!name || options.length === 0) redirect(`/cadastros/variacoes/${id || "novo"}?erro=1`);
  const s = await getStore();
  if (!s) return;
  if (id) await s.supabase.from("variation_groups").update({ name, options }).eq("id", id);
  else await s.supabase.from("variation_groups").insert({ name, options, store_id: s.storeId });
  revalidatePath("/cadastros/variacoes");
  redirect("/cadastros/variacoes");
}
export async function deleteVariation(id: string) {
  const s = await getStore();
  if (s) await s.supabase.from("variation_groups").delete().eq("id", id);
  revalidatePath("/cadastros/variacoes");
  redirect("/cadastros/variacoes");
}
