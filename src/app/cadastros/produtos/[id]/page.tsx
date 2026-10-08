import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import PageHeader from "@/components/PageHeader";
import ProductForm, { type ProductInit } from "@/components/ProductForm";
import DeleteButton from "@/components/DeleteButton";
import { normalizeImages } from "@/lib/products";
import { normalizeVariations, type VariationGroup } from "@/lib/variations";
import { archiveProduct } from "../../actions";

export const dynamic = "force-dynamic";
const dec = (n: number) => String(n).replace(".", ",");

export default async function Produto({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const isNew = id === "novo";
  const supabase = await createClient();
  // Get current user's store_id for storage uploads
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: profile } = await supabase.from("profiles").select("store_id").eq("id", user.id).single();
  if (!profile) redirect("/login");
  const storeId = profile.store_id as string;
  const [{ data: cats }, { data: vgs }] = await Promise.all([
    supabase.from("categories").select("id, name").order("name"),
    supabase.from("variation_groups").select("id, name, options").order("name"),
  ]);
  const groups = (vgs ?? []) as VariationGroup[];
  let init: ProductInit = { name: "", price: "", cost: "", stock: "0", min_stock: "0", category_id: "", images: [], variations: [] };
  if (!isNew) {
    const { data: p } = await supabase.from("products").select("id, name, price, cost, stock, min_stock, category_id, image, images").eq("id", id).maybeSingle();
    if (!p) notFound();
    const { data: vars } = await supabase
      .from("product_variations")
      .select("group_id, group_name, option, stock, price")
      .eq("product_id", id)
      .order("position");
    init = {
      id: p.id,
      name: p.name,
      price: dec(Number(p.price)),
      cost: dec(Number(p.cost)),
      stock: String(p.stock),
      min_stock: String(p.min_stock),
      category_id: p.category_id ?? "",
      images: normalizeImages(p.images, p.image),
      variations: normalizeVariations(vars),
    };
  }
  return (
    <main className="mx-auto min-h-dvh max-w-md bg-page px-5 pb-10 pt-5">
      <PageHeader eyebrow="Cadastro · Produtos" title={isNew ? "Novo produto" : "Editar produto"} back="/cadastros/produtos" />
      <ProductForm p={init} cats={cats ?? []} groups={groups} storeId={storeId} />
      {!isNew && <DeleteButton action={archiveProduct.bind(null, id)} label="Arquivar produto" confirmText="Arquivar este produto? Ele some das listas e do PDV, mas as vendas antigas continuam." />}
    </main>
  );
}
