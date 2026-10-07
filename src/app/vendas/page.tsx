import { createClient } from "@/lib/supabase/server";
import PageHeader from "@/components/PageHeader";
import SalesList, { type Row } from "@/components/SalesList";
import { brl, fmtTime, nowParts, saleCode, shortToday } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function VendasDoDia() {
  const supabase = await createClient();
  const { dayStart } = nowParts();
  const { data } = await supabase.from("sales")
    .select("id, number, total, status, customer_name, created_at, sale_items(id)")
    .gte("created_at", dayStart).order("created_at", { ascending: false });
  const sales = data ?? [];
  const valid = sales.filter((s) => s.status !== "cancelada");
  const sum = valid.reduce((a, s) => a + Number(s.total), 0);
  const top = valid.length > 1 ? valid.reduce((m, s) => (Number(s.total) > Number(m.total) ? s : m)) : null;
  const rows: Row[] = sales.map((s) => ({
    id: s.id, code: saleCode(s.number), time: fmtTime(s.created_at), customer: s.customer_name,
    items: s.sale_items?.length ?? 0, total: brl(Number(s.total)), biggest: s.id === top?.id, cancelled: s.status === "cancelada",
  }));
  return (
    <main className="min-h-dvh bg-page pb-40">
      <div className="h-[3px] bg-gradient-to-r from-brand via-blue-400 to-transparent" />
      <div className="mx-auto max-w-md px-5 pt-5">
        <PageHeader eyebrow="Operação · Vendas" title="Vendas do dia" back="/" />
        <SalesList rows={rows} dayLabel={shortToday()} />
      </div>
      <footer className="fixed inset-x-0 bottom-0 bg-brand px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-5 text-white">
        <div className="mx-auto max-w-md">
          <p className="text-sm font-bold uppercase tracking-[0.15em] opacity-80">Hoje · {shortToday()}</p>
          <div className="mt-1 flex items-end justify-between"><span className="text-4xl font-extrabold">{brl(sum)}</span><span className="text-lg font-semibold opacity-90">{valid.length} {valid.length === 1 ? "venda" : "vendas"}</span></div>
        </div>
      </footer>
    </main>
  );
}
