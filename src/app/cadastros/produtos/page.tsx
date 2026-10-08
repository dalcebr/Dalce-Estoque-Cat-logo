import { createClient } from "@/lib/supabase/server";
import PageHeader from "@/components/PageHeader";
import CadList, { type CadRow } from "@/components/CadList";
import { brl } from "@/lib/format";
import { resolveImageUrl } from "@/lib/storage";
import { deleteProduct } from "../actions";

export const dynamic = "force-dynamic";
type Row = { id: string; name: string; price: number; image: string | null; images: string[] | null; categories: { name: string } | { name: string }[] | null };

export default async function Produtos() {
  const supabase = await createClient();
  const [{ data }, { data: cats }] = await Promise.all([
    supabase.from("products").select("id, name, price, image, images, categories(name)").eq("active", true).order("name"),
    supabase.from("categories").select("name").order("name"),
  ]);
  const rows: CadRow[] = ((data ?? []) as Row[]).map((p): CadRow => {
    const c = Array.isArray(p.categories) ? p.categories[0] : p.categories;
    const cover = p.images?.[0] ?? p.image;
    return { id: p.id, href: `/cadastros/produtos/${p.id}`, title: p.name, sub: c?.name ?? "Sem categoria", search: `${p.name} ${c?.name ?? ""}`, group: c?.name ?? null, n: Number(p.price),
      left: cover ? { k: "img", src: resolveImageUrl(process.env.NEXT_PUBLIC_SUPABASE_URL!, "product-images", cover) } : { k: "chip", t: p.name[0]?.toUpperCase() ?? "?" }, right: { t: brl(Number(p.price)) } };
  });
  return (
    <main className="min-h-dvh bg-page pb-36">
      <div className="h-[3px] bg-gradient-to-r from-brand via-blue-400 to-transparent" />
      <div className="mx-auto max-w-md px-5 pt-5">
        <PageHeader eyebrow="Cadastro · Produtos" title="Seus produtos" back="/cadastros" sub={`${rows.length} ${rows.length === 1 ? "produto" : "produtos"}`} />
        <CadList rows={rows} placeholder="Nome do produto" addLabel="Novo produto" addHref="/cadastros/produtos/novo" empty="Nenhum produto cadastrado." chips={(cats ?? []).map((c: { name: string }) => c.name)} sortable onDelete={deleteProduct} deleteConfirm="Excluir este produto definitivamente? Ele sai do catálogo, do estoque e do PDV. As vendas antigas continuam no histórico." />
      </div>
    </main>
  );
}
