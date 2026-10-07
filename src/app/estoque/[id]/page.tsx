import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import PageHeader from "@/components/PageHeader";
import SubmitButton from "@/components/SubmitButton";
import { updateProduct } from "../actions";

const f = "w-full rounded-2xl border border-line bg-surface px-4 py-3.5 text-lg outline-none focus:border-brand";
const dec = (n: number) => String(n).replace(".", ",");
const L = ({ t }: { t: string }) => <span className="mb-1 block px-1 text-xs font-bold uppercase tracking-[0.15em] text-soft">{t}</span>;

export default async function EditarProduto({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: p } = await supabase.from("products").select("id, name, price, cost, stock, min_stock").eq("id", id).maybeSingle();
  if (!p) notFound();
  return (
    <main className="mx-auto min-h-dvh max-w-md bg-page px-5 pt-5">
      <PageHeader eyebrow="Estoque · Produto" title="Editar produto" back="/estoque" />
      <form action={updateProduct} className="mt-6 space-y-3">
        <input type="hidden" name="id" value={p.id} />
        <label className="block"><L t="Nome" /><input name="name" required defaultValue={p.name} className={f} /></label>
        <label className="block"><L t="Preço de venda (R$)" /><input name="price" required inputMode="decimal" defaultValue={dec(Number(p.price))} className={f} /></label>
        <label className="block"><L t="Custo (R$)" /><input name="cost" inputMode="decimal" defaultValue={dec(Number(p.cost))} className={f} /></label>
        <label className="block"><L t="Quantidade em estoque" /><input name="stock" inputMode="numeric" defaultValue={p.stock} className={f} /></label>
        <label className="block"><L t="Estoque mínimo (alerta de baixo)" /><input name="min_stock" inputMode="numeric" defaultValue={p.min_stock} className={f} /></label>
        <SubmitButton>Salvar</SubmitButton>
      </form>
    </main>
  );
}
