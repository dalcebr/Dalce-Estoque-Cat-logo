import { createClient } from "@/lib/supabase/server";
import PageHeader from "@/components/PageHeader";
import StockList, { type StockRow } from "@/components/StockList";
import { brl } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function Estoque() {
  const supabase = await createClient();
  const { data } = await supabase.from("products").select("id, name, price, stock, min_stock").eq("active", true).order("name");
  const rows: StockRow[] = (data ?? []).map((p: { id: string; name: string; price: number; stock: number; min_stock: number }) => ({ id: p.id, name: p.name, price: brl(Number(p.price)), stock: p.stock, min: p.min_stock }));
  const zero = rows.filter((r) => r.stock <= 0).length;
  return (
    <main className="min-h-dvh bg-page pb-10">
      <div className="h-[3px] bg-gradient-to-r from-brand via-blue-400 to-transparent" />
      <div className="mx-auto max-w-md px-5 pt-5">
        <PageHeader eyebrow="Consulta · Estoque" title="Como está o estoque?" back="/" sub={`${rows.length} ${rows.length === 1 ? "produto" : "produtos"} · ${zero} ${zero === 1 ? "zerado" : "zerados"}`} />
        <StockList rows={rows} />
      </div>
    </main>
  );
}
