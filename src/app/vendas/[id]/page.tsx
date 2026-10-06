import { notFound } from "next/navigation";
import { Banknote, CalendarDays, CreditCard, IdCard, QrCode, UserRound } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import PageHeader from "@/components/PageHeader";
import SaleActions from "@/components/SaleActions";
import { brl, cap, fmtDateTime, saleCode } from "@/lib/format";

export const dynamic = "force-dynamic";

const Label = ({ children }: { children: string }) => <h2 className="mb-2 mt-7 px-1 text-sm font-bold uppercase tracking-[0.18em] text-soft">{children}</h2>;

export default async function SaleDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: s } = await supabase.from("sales")
    .select("id, number, total, status, payment_method, customer_name, seller_name, created_at, sale_items(id, name, qty, total), sale_payments(id, method, amount)")
    .eq("id", id).maybeSingle();
  if (!s) notFound();

  const items = s.sale_items ?? [];
  const code = saleCode(s.number), total = brl(Number(s.total)), cancelled = s.status === "cancelada";
  const method = s.payment_method ?? "Não informado";
  const iconFor = (x: string) => (/dinheiro/i.test(x) ? Banknote : /pix/i.test(x) ? QrCode : CreditCard);
  const pays: { id: string; method: string; amount: number }[] = s.sale_payments?.length ? s.sale_payments : [{ id: "0", method, amount: Number(s.total) }];
  const receipt = [`Dalce Estoque · Venda ${code}`, fmtDateTime(s.created_at), "",
    ...items.map((i) => `${i.qty}x ${i.name} — ${brl(Number(i.total))}`), "", `Total: ${total}`, `Pagamento: ${cap(method)}`].join("\n");

  return (
    <main className="min-h-dvh bg-page pb-40">
      <div className="h-[3px] bg-gradient-to-r from-brand via-blue-400 to-transparent" />
      <div className="mx-auto max-w-md px-5 pt-5">
        <PageHeader eyebrow={`Venda · ${code}`} title="Detalhe da venda" back="/vendas" />

        <section className="mt-6 rounded-[28px] border border-line bg-white p-5">
          <div className="flex items-center justify-between">
            <span className={`rounded-full px-3.5 py-1.5 text-sm font-bold uppercase ${cancelled ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"}`}>{cancelled ? "Cancelada" : "Finalizada"}</span>
            <span className="font-semibold text-soft">{items.length} {items.length === 1 ? "item" : "itens"}</span>
          </div>
          <p className="mt-4 text-4xl font-extrabold tracking-tight">{total}</p>
          <ul className="mt-6 space-y-3 text-lg text-soft">
            <li className="flex items-center gap-3"><CalendarDays size={22} />{fmtDateTime(s.created_at)}</li>
            <li className="flex items-center gap-3"><IdCard size={22} />Vendedor · {s.seller_name ?? "Não informado"}</li>
            <li className="flex items-center gap-3"><UserRound size={22} />Cliente · {s.customer_name ?? "Não informado"}</li>
          </ul>
        </section>

        <Label>Itens</Label>
        <div className="space-y-2">
          {items.map((i) => (
            <div key={i.id} className="flex items-center gap-4 rounded-3xl border border-line bg-white p-4">
              <span className="grid size-11 place-items-center rounded-xl bg-tint text-lg font-extrabold text-brand">{i.qty}x</span>
              <span className="flex-1 text-lg font-semibold">{i.name}</span>
              <b className="text-lg">{brl(Number(i.total))}</b>
            </div>
          ))}
        </div>

        <Label>Resumo</Label>
        <div className="flex items-center justify-between rounded-3xl border border-line bg-white p-5 text-xl font-extrabold"><span>Total</span><span>{total}</span></div>

        <Label>Pagamento</Label>
        <div className="space-y-2">
          {pays.map((p) => { const Ic = iconFor(p.method); return (
            <div key={p.id} className="flex items-center gap-4 rounded-3xl border border-line bg-white p-4">
              <span className="grid size-12 place-items-center rounded-xl bg-green-100 text-green-700"><Ic size={24} /></span>
              <span className="flex-1 text-lg font-semibold">{cap(p.method)}</span>
              <b className="text-lg">{brl(Number(p.amount))}</b>
            </div>); })}
        </div>
      </div>
      <SaleActions id={s.id} code={code} customer={s.customer_name} total={total} cancelled={cancelled} receipt={receipt} />
    </main>
  );
}
