import PageHeader from "@/components/PageHeader";
import FiadoReceiveForm from "@/components/FiadoReceiveForm";
import { createClient } from "@/lib/supabase/server";
import { brl, cap, fmtDateTime } from "@/lib/format";
import { esc } from "@/lib/fiado";

export const dynamic = "force-dynamic";
type Sale = { created_at: string };

export default async function FiadoCliente({ params }: { params: Promise<{ name: string }> }) {
  const { name: raw } = await params;
  const name = (() => { try { return decodeURIComponent(raw); } catch { return raw; } })();
  const supabase = await createClient();
  const [{ data: fp }, { data: rc }] = await Promise.all([
    supabase.from("sale_payments").select("amount, sales!inner(customer_name, status, created_at)").eq("method", "fiado").eq("sales.status", "finalizada").ilike("sales.customer_name", esc(name)),
    supabase.from("fiado_receipts").select("amount, method, created_at").ilike("customer_name", esc(name)),
  ]);
  const ev = [
    ...((fp ?? []) as { amount: number; sales: Sale | Sale[] }[]).map((r) => ({ at: (Array.isArray(r.sales) ? r.sales[0] : r.sales).created_at, v: Number(r.amount), t: "Compra no fiado" })),
    ...((rc ?? []) as { amount: number; method: string; created_at: string }[]).map((r) => ({ at: r.created_at, v: -Number(r.amount), t: `Recebido · ${cap(r.method)}` })),
  ].sort((a, b) => b.at.localeCompare(a.at));
  const bal = ev.reduce((s, e) => s + e.v, 0);
  return (
    <main className="mx-auto min-h-dvh max-w-md bg-page px-5 pb-10 pt-5">
      <PageHeader eyebrow="Fiado · Cliente" title={name} back="/fiado" />
      <section className="mt-5 rounded-[28px] p-5 text-white" style={{ background: "linear-gradient(135deg,#14306e 0%,#2a5bd7 100%)" }}>
        <p className="text-xs font-bold uppercase tracking-[0.18em] opacity-90">{bal > 0.004 ? "Em aberto" : bal < -0.004 ? "Crédito do cliente" : "Sem débito"}</p>
        <p className="mt-1 text-4xl font-extrabold">{brl(Math.abs(bal))}</p>
      </section>
      <FiadoReceiveForm name={name} />
      <h2 className="mb-2 mt-6 px-1 text-xs font-bold uppercase tracking-[0.18em] text-soft">Histórico</h2>
      <ul className="divide-y divide-line overflow-hidden rounded-3xl border border-line bg-surface">
        {ev.map((e, i) => (<li key={i} className="flex items-center justify-between px-5 py-3.5"><span><b className="block">{e.t}</b><span className="text-sm text-soft">{fmtDateTime(e.at)}</span></span><b className={e.v > 0 ? "text-red-700" : "text-green-700"}>{e.v > 0 ? "-" : "+"}{brl(Math.abs(e.v))}</b></li>))}
        {ev.length === 0 && <li className="px-5 py-6 text-center text-soft">Sem movimentações.</li>}
      </ul>
    </main>
  );
}
