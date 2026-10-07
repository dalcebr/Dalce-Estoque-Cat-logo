import Link from "next/link";
import { ChartNoAxesColumn, ChevronRight, Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import AppMenu from "@/components/AppMenu";
import GoalCard from "@/components/GoalCard";
import { brl, cap, nowParts } from "@/lib/format";

export const dynamic = "force-dynamic";

const Stat = ({ label, value, sub, valueClass = "" }: { label: string; value: string; sub?: string; valueClass?: string }) => (
  <div className="min-h-[82px] rounded-3xl border border-line bg-surface p-4">
    <p className="text-xs font-semibold uppercase tracking-wider text-soft">{label}</p>
    <p className={`mt-1 text-2xl font-extrabold ${valueClass}`}>{value}</p>
    {sub && <p className="mt-0.5 text-sm text-soft">{sub}</p>}
  </div>
);

export default async function Home() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase.from("profiles").select("name, stores(monthly_goal)").eq("id", user!.id).single();
  const { label, monthName, dayStart, monthStart } = nowParts();
  const { data: sales } = await supabase.from("sales").select("total, cost, payment_method, created_at").gte("created_at", monthStart).neq("status", "cancelada");

  const list = sales ?? [];
  const sum = (a: typeof list, k: "total" | "cost") => a.reduce((s, x) => s + Number(x[k]), 0);
  const today = sum(list.filter((s) => s.created_at >= dayStart), "total");
  const month = sum(list, "total"), cost = sum(list, "cost");
  const ticket = list.length ? month / list.length : 0;
  const biggest = list.reduce<(typeof list)[number] | null>((m, s) => (!m || Number(s.total) > Number(m.total) ? s : m), null);
  const store = Array.isArray(profile?.stores) ? profile?.stores[0] : profile?.stores;
  const goal = store?.monthly_goal != null ? Number(store.monthly_goal) : null;
  const name = profile?.name?.split(" ")[0] ?? "Usuário";

  return (
    <main className="min-h-dvh bg-page pb-32">
      <div className="h-[3px] bg-gradient-to-r from-brand via-blue-400 to-transparent" />
      <div className="mx-auto max-w-md px-5 pt-5">
        <header className="flex items-start gap-4">
          <AppMenu />
          <div className="min-w-0 flex-1 leading-tight">
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-brand">Início · Resumo</p>
            <h1 className="text-3xl font-extrabold">Olá, {name}</h1>
            <p className="mt-0.5 text-soft">{label}</p>
          </div>
          <span className="rounded-xl bg-tint px-4 py-2 text-sm font-bold uppercase tracking-wider text-brand">Hoje</span>
        </header>

        <section className="mt-6 rounded-[28px] p-5 text-white shadow-[0_12px_24px_-12px_rgba(29,78,216,.6)]"
          style={{ background: "linear-gradient(135deg,#14306e 0%,#2a5bd7 100%)" }}>
          <div className="flex items-center justify-between text-sm font-semibold">
            <span className="uppercase tracking-wider opacity-90">Vendido hoje</span>
            <Link href="/vendas" className="flex items-center gap-1">Detalhes <ChevronRight size={18} /></Link>
          </div>
          <p className="mt-1 text-4xl font-extrabold tracking-tight">{brl(today)}</p>
          <p className="mt-4 text-[15px]"><b>{list.length} {list.length === 1 ? "venda" : "vendas"}</b> <span className="mx-1.5 opacity-60">·</span> <span className="opacity-90">Mês:</span> <b>{brl(month)}</b></p>
        </section>

        <div className="mt-3 grid grid-cols-2 gap-3">
          <Stat label="Custo" value={brl(cost)} />
          <Stat label="Lucro" value={brl(month - cost)} valueClass="text-green-700" />
          <Stat label="Ticket médio" value={brl(ticket)} />
          <Stat label="Maior pagamento" value={brl(biggest ? Number(biggest.total) : 0)} sub={biggest?.payment_method ? cap(biggest.payment_method) : undefined} />
        </div>

        <div className="mt-3"><GoalCard goal={goal} sold={month} monthName={monthName} /></div>
      </div>

      <nav className="fixed inset-x-0 bottom-0 border-t border-line bg-surface px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-4">
        <div className="mx-auto grid max-w-md grid-cols-[5fr_6fr] gap-3">
          <Link href="/relatorios" className="flex items-center justify-center gap-2 rounded-2xl border-2 border-brand bg-surface py-4 text-lg font-bold text-brand"><ChartNoAxesColumn size={22} strokeWidth={3} /> Relatórios</Link>
          <Link href="/vendas/nova" className="flex items-center justify-center gap-2 rounded-2xl bg-brand py-4 text-lg font-bold text-white"><Plus size={24} /> Nova venda</Link>
        </div>
      </nav>
    </main>
  );
}
