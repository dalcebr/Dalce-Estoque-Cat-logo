import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import PageHeader from "@/components/PageHeader";
import ProductForm, { type ProductInit } from "@/components/ProductForm";
import DeleteButton from "@/components/DeleteButton";
import { archiveProduct } from "../../actions";

export const dynamic = "force-dynamic";
const dec = (n: number) => String(n).replace(".", ",");

export default async function Produto({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const isNew = id === "novo";
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: prof } = await supabase.from("profiles").select("store_id").eq("id", user!.id).single();
  const storeId = (prof?.store_id as string) ?? "";
  const { data: cats } = await supabase.from("categories").select("id, name").order("name");
  let init: ProductInit = { name: "", price: "", cost: "", stock: "0", min_stock: "0", category_id: "", image: "" };
  if (!isNew) {
    const { data: p } = await supabase.from("products").select("id, name, price, cost, stock, min_stock, category_id, image").eq("id", id).maybeSingle();
    if (!p) notFound();
    init = { id: p.id, name: p.name, price: dec(Number(p.price)), cost: dec(Number(p.cost)), stock: String(p.stock), min_stock: String(p.min_stock), category_id: p.category_id ?? "", image: p.image ?? "" };
  }
  return (
    <main className="mx-auto min-h-dvh max-w-md bg-page px-5 pb-10 pt-5">
      <PageHeader eyebrow="Cadastro · Produtos" title={isNew ? "Novo produto" : "Editar produto"} back="/cadastros/produtos" />
      <ProductForm p={init} cats={cats ?? []} storeId={storeId} />
      {!isNew && <DeleteButton action={archiveProduct.bind(null, id)} label="Arquivar produto" confirmText="Arquivar este produto? Ele some das listas e do PDV, mas as vendas antigas continuam." />}
    </main>
  );
}
