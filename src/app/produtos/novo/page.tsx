import PageHeader from "@/components/PageHeader";
import { createProduct } from "./actions";
const f = "w-full rounded-2xl border border-line bg-surface px-4 py-3.5 text-lg outline-none focus:border-brand";
export default function NovoProduto() {
  return (
    <main className="mx-auto min-h-dvh max-w-md bg-page px-5 pt-5">
      <PageHeader eyebrow="Produtos · Cadastro" title="Novo produto" back="/vendas/nova" />
      <form action={createProduct} className="mt-6 space-y-3">
        <input name="name" required placeholder="Nome do produto" className={f} />
        <input name="price" required inputMode="decimal" placeholder="Preço de venda (R$)" className={f} />
        <input name="cost" inputMode="decimal" placeholder="Custo (R$) — opcional" className={f} />
        <input name="stock" inputMode="numeric" placeholder="Estoque inicial — opcional" className={f} />
        <input name="min_stock" inputMode="numeric" placeholder="Estoque mínimo (alerta de baixo) — opcional" className={f} />
        <input name="category" placeholder="Categoria — opcional" className={f} />
        <button className="w-full rounded-2xl bg-brand py-4 text-lg font-bold text-white">Salvar produto</button>
      </form>
    </main>
  );
}
