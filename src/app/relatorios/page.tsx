import Link from "next/link";
import { SlidersHorizontal, TrendingUp } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import PageHeader from "@/components/PageHeader";
import LineChart from "@/components/LineChart";
import { brl, cap } from "@/lib/format";
import { add, days, resolveRange } from "@/lib/range";

export const dynamic = "force-dynamic";

const TZ = "America/Sao_Paulo";
const fmtL = new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", hourCycle: "h23" });
const local = (iso: string) => { const p = Object.fromEntries(fmtL.formatToParts(new Date(iso)).map((x) => [x.type, x.value])); return { date: `${p.year}-${p.month}-${p.day}`, hour: Number(p.hour) }; };
const today = () => new Intl.DateTimeFormat("en-CA", { timeZone: TZ }).format(new Date());
const MONTHS = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
const COLORS: Record<string, string> = { dinheiro: "#15803d", débito: "#0284c7", crédito: "#1d4ed8", pix: "#0d9488", fiado: "#d97706", outros: "#64748b" };

type Sale = { total: number; cost: number; created_at: string; payment_method: string | null; sale_items: { name: string; qty: number; total: number }[]; sale_payments: { method: string; amount: number }[] };

const Card = ({ label, value, cls = "" }: { label: string; value: string; cls?: string }) => (
  <div className="rounded-3xl border border-line bg-white p-4"><p className="text-soft">{label}</p><p className={`mt-1 text-2xl font-extrabold ${cls}`}>{value}</p></div>
);

export default async function Relatorios({ searchParams }: { searchParams: Promise<{ p?: string; de?: string; ate?: string }> }) {
  const sp = await searchParams;
  const r = resolveRange(sp, today());
  const qs = r.preset ? `?p=${r.preset}` : `?de=${r.from}&ate=${r.to}`;

  const supabase = await createClient();
  const { data } = await supabase.from("sales")
    .select("total, cost, created_at, payment_method, sale_items(name, qty, total), sale_payments(method, amount)")
    .neq("status", "cancelada")
    .gte("created_at", `${r.prevFrom}T00:00:00-03:00`).lt("created_at", `${add(r.to, 1)}T00:00:00-03:00`)
    .order("created_at").limit(1000);
  const all: (Sale & { d: string; h: number })[] = ((data ?? []) as Sale[]).map((s) => { const l = local(s.created_at); return { ...s, d: l.date, h: l.hour }; });
  const sales = all.filter((s) => s.d >= r.from && s.d <= r.to);

  const total = sales.reduce((a, s) => a + Number(s.total), 0), cost = sales.reduce((a, s) => a + Number(s.cost), 0);
  const ticket = sales.length ? total / sales.length : 0;

  // série do gráfico
  const mode = r.n === 1 ? "hour" : r.n <= 62 ? "day" : "month";
  const mIdx = (d: string, base: string) => (+d.slice(0, 4) * 12 + +d.slice(5, 7)) - (+base.slice(0, 4) * 12 + +base.slice(5, 7));
  const size = mode === "hour" ? 24 : mode === "day" ? r.n : mIdx(r.to, r.from) + 1;
  const cur = Array(size).fill(0), prev = Array(size).fill(0);
  for (const s of all) {
    const inCur = s.d >= r.from && s.d <= r.to;
    const base = inCur ? r.from : r.prevFrom;
    const i = mode === "hour" ? s.h : mode === "day" ? days(base, s.d) - 1 : mIdx(s.d, base);
    if (i < 0 || i >= size) continue;
    (inCur ? cur : prev)[i] += Number(s.total);
  }
  let labels: string[];
  let lo = 0, hi = size - 1;
  if (mode === "hour") {
    const hrs = all.map((s) => s.h);
    lo = Math.min(8, ...hrs); hi = Math.max(18, ...hrs);
    labels = Array.from({ length: 24 }, (_, h) => `${h}H`);
  } else if (mode === "day") labels = Array.from({ length: size }, (_, i) => { const d = add(r.from, i); return `${d.slice(8)}/${d.slice(5, 7)}`; });
  else labels = Array.from({ length: size }, (_, i) => MONTHS[(+r.from.slice(5, 7) - 1 + i) % 12]);

  // pagamentos e produtos
  const pay: Record<string, number> = {}, prod: Record<string, { qty: number; total: number }> = {};
  for (const s of sales) {
    const ps = s.sale_payments?.length ? s.sale_payments : [{ method: s.payment_method ?? "outros", amount: Number(s.total) }];
    ps.forEach((p) => { pay[p.method] = (pay[p.method] ?? 0) + Number(p.amount); });
    s.sale_items?.forEach((i) => { const e = (prod[i.name] ??= { qty: 0, total: 0 }); e.qty += i.qty; e.total += Number(i.total); });
  }
  const payList = Object.entries(pay).sort((a, b) => b[1] - a[1]), paySum = payList.reduce((a, [, v]) => a + v, 0);
  const top = Object.entries(prod).sort((a, b) => b[1].total - a[1].total).slice(0, 5);
  const C = 2 * Math.PI * 38;
  let acc = 0;

  return (
    <main className="min-h-dvh bg-page pb-10">
      <div className="h-[3px] bg-gradient-to-r from-brand via-blue-400 to-transparent" />
      <div className="mx-auto max-w-md px-5 pt-5">
        <PageHeader eyebrow="Relatórios · Dashboard" title="Como foram as vendas?" back="/" sub={`${r.label} · comparando com ${r.prevLabel}`}
          right={<Link href={`/relatorios/filtros${qs}`} aria-label="Filtros" className="grid size-12 shrink-0 place-items-center rounded-2xl border border-line bg-white shadow-sm"><SlidersHorizontal size={22} /></Link>} />

        <section className="mt-5 rounded-[28px] p-5 text-white shadow-[0_12px_24px_-12px_rgba(29,78,216,.6)]" style={{ background: "linear-gradient(135deg,#14306e 0%,#2a5bd7 100%)" }}>
          <p className="text-xs font-bold uppercase tracking-[0.18em] opacity-90">Total de vendas</p>
          <p className="mt-1 text-4xl font-extrabold tracking-tight">{brl(total)}</p>
          <p className="mt-3 flex items-center gap-2 text-sm"><TrendingUp size={18} />{sales.length} {sales.length === 1 ? "venda" : "vendas"} · ticket médio {brl(ticket)}</p>
        </section>

        <div className="mt-3 grid grid-cols-2 gap-3">
          <Card label="Lucro bruto" value={brl(total - cost)} cls="text-green-700" />
          <Card label="Ticket médio" value={brl(ticket)} />
          <Card label="Venda líquida" value={brl(total)} />
          <Card label="Venda custo" value={brl(cost)} />
        </div>

        <section className="mt-3 rounded-3xl border border-line bg-white p-5">
          <h2 className="mb-3 text-lg font-extrabold">Vendas no período</h2>
          <LineChart labels={labels.slice(lo, hi + 1)} cur={cur.slice(lo, hi + 1)} prev={prev.slice(lo, hi + 1)} curName={r.label} prevName={cap(r.prevLabel)} />
        </section>

        <section className="mt-3 rounded-3xl border border-line bg-white p-5">
          <h2 className="mb-4 text-lg font-extrabold">Tipos de pagamento</h2>
          {payList.length === 0 ? <p className="text-soft">Sem pagamentos no período.</p> : (
            <div className="flex items-center gap-5">
              <svg viewBox="0 0 100 100" className="size-32 shrink-0 -rotate-90">
                {payList.map(([k, v]) => { const len = (v / paySum) * C, o = acc; acc += len;
                  return <circle key={k} cx="50" cy="50" r="38" fill="none" stroke={COLORS[k] ?? "#64748b"} strokeWidth="16" strokeDasharray={`${len} ${C - len}`} strokeDashoffset={-o} />; })}
              </svg>
              <ul className="flex-1 space-y-2">
                {payList.map(([k, v]) => (
                  <li key={k} className="flex items-center gap-2 text-sm"><i className="size-3 rounded-full" style={{ background: COLORS[k] ?? "#64748b" }} /><span className="flex-1 font-semibold">{cap(k)}</span><span className="text-soft">{Math.round((v / paySum) * 100)}%</span><b>{brl(v)}</b></li>))}
              </ul>
            </div>)}
        </section>

        <section className="mt-3 rounded-3xl border border-line bg-white p-5">
          <h2 className="mb-3 text-lg font-extrabold">Mais vendidos</h2>
          {top.length === 0 ? <p className="text-soft">Sem itens no período.</p> : (
            <ul className="divide-y divide-line">
              {top.map(([name, v], i) => (
                <li key={name} className="flex items-center gap-3 py-2.5"><span className="grid size-8 place-items-center rounded-lg bg-tint text-sm font-extrabold text-brand">{i + 1}</span><span className="flex-1 font-semibold">{name}</span><span className="text-sm text-soft">{v.qty}x</span><b>{brl(v.total)}</b></li>))}
            </ul>)}
        </section>
      </div>
    </main>
  );
}
