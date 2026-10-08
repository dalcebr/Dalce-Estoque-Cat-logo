"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getStore, num } from "@/lib/store";
import { isValidUUID, sanitizeText } from "@/lib/validation";
import { normalizeImages, coverOf } from "@/lib/products";
import { normalizeVariations } from "@/lib/variations";
import { deleteImages, isStoragePath } from "@/lib/storage";

const str = (fd: FormData, k: string, max = 120) => sanitizeText(String(fd.get(k) ?? ""), max);
const esc = (s: string) => s.replace(/[%_\\]/g, "\\$&");

export async function saveProduct(fd: FormData) {
  const s = await getStore();
  if (!s) return void redirect("/login");

  const id = str(fd, "id", 36);
  if (id && !isValidUUID(id)) return;

  const name = str(fd, "name", 80);
  const price = num(fd.get("price")), cost = num(fd.get("cost"));
  if (!name || !Number.isFinite(price) || price <= 0 || !Number.isFinite(cost) || cost < 0) return;

  let image = String(fd.get("image") ?? "");
  // Accept legacy base64 data URLs OR new storage paths ({uuid}/{uuid}.webp)
  if (image) {
    const isBase64 = image.startsWith("data:image/");
    const isStoragePath = /^[0-9a-f-]+\/[0-9a-f-]+\.webp$/i.test(image);
    if (!isBase64 && !isStoragePath) image = "";
    if (isBase64 && image.length > 150_000) image = "";
  }

  // Galeria de fotos (até 5). A primeira é a capa.
  let rawImages: unknown = [];
  try { rawImages = JSON.parse(String(fd.get("images") ?? "[]")); } catch { rawImages = []; }
  const images = normalizeImages(rawImages, image);
  image = coverOf(images) ?? "";

  const categoryId = str(fd, "category_id", 36) || null;
  if (categoryId && !isValidUUID(categoryId)) return;

  // Variações selecionadas (grupos já cadastrados + estoque/preço por opção).
  let rawVariations: unknown = [];
  try { rawVariations = JSON.parse(String(fd.get("variations") ?? "[]")); } catch { rawVariations = []; }
  const variations = normalizeVariations(rawVariations);

  const stock = Math.trunc(num(fd.get("stock"))) || 0;
  // A soma do estoque das variações não pode ultrapassar o estoque do produto.
  const variationsStock = variations.reduce((s, v) => s + (Number.isFinite(v.stock) ? v.stock : 0), 0);
  if (variations.length > 0 && variationsStock > Math.max(0, stock)) {
    redirect(`/cadastros/produtos/${id || "novo"}?erro=estoque`);
  }

  const row = {
    name, price, cost,
    stock,
    min_stock: Math.max(0, Math.trunc(num(fd.get("min_stock"))) || 0),
    image: image || null,
    images,
    category_id: categoryId,
  };

  // Captura em constantes locais: o narrowing de `s` se perde dentro de closures.
  const supabase = s.supabase;
  const storeId = s.storeId;

  /** Substitui as variações do produto pelas informadas. */
  async function saveVariations(productId: string) {
    await supabase.from("product_variations").delete().eq("product_id", productId).eq("store_id", storeId);
    if (variations.length === 0) return;
    await supabase.from("product_variations").insert(
      variations.map((v, i) => ({
        store_id: storeId,
        product_id: productId,
        group_id: v.group_id,
        group_name: v.group_name,
        option: v.option,
        stock: v.stock,
        price: v.price,
        position: i,
      })),
    );
  }

  if (id) {
    // Busca a galeria anterior para remover do Storage as fotos que saíram.
    const { data: prev } = await s.supabase.from("products").select("images, image").eq("id", id).eq("store_id", s.storeId).maybeSingle();
    const before = normalizeImages(prev?.images, prev?.image);
    const removed = before.filter((p) => !images.includes(p) && isStoragePath(p));
    await s.supabase.from("products").update(row).eq("id", id).eq("store_id", s.storeId);
    await saveVariations(id);
    if (removed.length) { try { await deleteImages(s.supabase, "product-images", removed); } catch { /* não bloqueia o salvamento */ } }
  } else {
    const { data: created } = await s.supabase.from("products").insert({ ...row, store_id: s.storeId }).select("id").single();
    if (created?.id) await saveVariations(created.id);
  }
  revalidatePath("/cadastros/produtos"); revalidatePath("/estoque");
  redirect("/cadastros/produtos");
}

export async function archiveProduct(id: string) {
  if (typeof id !== "string" || !isValidUUID(id)) return;
  const s = await getStore();
  if (!s) return void redirect("/login");
  await s.supabase.from("products").update({ active: false }).eq("id", id).eq("store_id", s.storeId);
  revalidatePath("/cadastros/produtos"); revalidatePath("/estoque");
  redirect("/cadastros/produtos");
}

export async function saveCategory(fd: FormData) {
  const s = await getStore();
  if (!s) return void redirect("/login");

  const id = str(fd, "id", 36);
  if (id && !isValidUUID(id)) return;

  const name = str(fd, "name", 40), color = str(fd, "color", 7);
  if (!name || !/^#[0-9a-f]{6}$/i.test(color)) return;

  // Foto de capa da categoria (opcional): caminho no Storage ou base64 legado.
  let image = String(fd.get("image") ?? "");
  if (image) {
    const isBase64 = image.startsWith("data:image/");
    const isPath = isStoragePath(image);
    if (!isBase64 && !isPath) image = "";
    if (isBase64 && image.length > 150_000) image = "";
  }

  if (id) {
    // Remove do Storage a capa antiga quando ela foi trocada/removida.
    const { data: prev } = await s.supabase.from("categories").select("image").eq("id", id).eq("store_id", s.storeId).maybeSingle();
    const before = prev?.image ?? "";
    const { error } = await s.supabase.from("categories").update({ name, color, image: image || null }).eq("id", id).eq("store_id", s.storeId);
    if (error?.code === "23505") redirect(`/cadastros/categorias/${id}?erro=nome`);
    if (before && before !== image && isStoragePath(before)) {
      try { await deleteImages(s.supabase, "product-images", [before]); } catch { /* não bloqueia o salvamento */ }
    }
  } else {
    const { error } = await s.supabase.from("categories").insert({ name, color, image: image || null, store_id: s.storeId });
    if (error?.code === "23505") redirect("/cadastros/categorias/novo?erro=nome");
  }
  revalidatePath("/cadastros/categorias"); revalidatePath("/cadastros/produtos");
  redirect("/cadastros/categorias");
}

export async function deleteCategory(id: string) {
  if (typeof id !== "string" || !isValidUUID(id)) return;
  const s = await getStore();
  if (!s) return void redirect("/login");
  await s.supabase.from("categories").delete().eq("id", id).eq("store_id", s.storeId);
  revalidatePath("/cadastros/categorias"); revalidatePath("/cadastros/produtos");
  redirect("/cadastros/categorias");
}

export async function saveCustomer(fd: FormData) {
  const s = await getStore();
  if (!s) return void redirect("/login");

  const id = str(fd, "id", 36);
  if (id && !isValidUUID(id)) return;

  const name = str(fd, "name", 80);
  const phone = str(fd, "phone", 20).replace(/[^\d+()\-\s]/g, "");
  const cpf = str(fd, "cpf", 20).replace(/\D/g, "");
  const here = `/cadastros/clientes/${id || "novo"}`;
  if (!id && !name) return;
  if (cpf && cpf.length !== 11) redirect(`${here}?erro=cpf`);

  if (id) {
    await s.supabase.from("customers").update({ phone: phone || null, cpf: cpf || null }).eq("id", id).eq("store_id", s.storeId);
  } else {
    const { data: ex } = await s.supabase.from("customers").select("id").eq("store_id", s.storeId).ilike("name", esc(name)).maybeSingle();
    if (ex) redirect(`${here}?erro=nome`);
    await s.supabase.from("customers").insert({ store_id: s.storeId, name, phone: phone || null, cpf: cpf || null });
  }
  revalidatePath("/cadastros/clientes");
  redirect("/cadastros/clientes");
}

export async function saveVariation(fd: FormData) {
  const s = await getStore();
  if (!s) return void redirect("/login");

  const id = str(fd, "id", 36);
  if (id && !isValidUUID(id)) return;

  const name = str(fd, "name", 40);
  const options = [...new Set(
    String(fd.get("options") ?? "")
      .split(/[\n,;]+/)
      .map((o) => sanitizeText(o, 30))
      .filter(Boolean),
  )].slice(0, 50);
  if (!name || options.length === 0) redirect(`/cadastros/variacoes/${id || "novo"}?erro=1`);

  if (id) {
    await s.supabase.from("variation_groups").update({ name, options }).eq("id", id).eq("store_id", s.storeId);
  } else {
    await s.supabase.from("variation_groups").insert({ name, options, store_id: s.storeId });
  }
  revalidatePath("/cadastros/variacoes");
  redirect("/cadastros/variacoes");
}

export async function deleteVariation(id: string) {
  if (typeof id !== "string" || !isValidUUID(id)) return;
  const s = await getStore();
  if (!s) return void redirect("/login");
  await s.supabase.from("variation_groups").delete().eq("id", id).eq("store_id", s.storeId);
  revalidatePath("/cadastros/variacoes");
  redirect("/cadastros/variacoes");
}
