import { redirect } from "next/navigation";
import Link from "next/link";
import { AlertTriangle, ArrowLeft, Building2, DollarSign, ShoppingCart, TrendingUp, Users } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getAccount } from "@/lib/account";
import { brl, fmtDateTime } from "@/lib/format";
import { STATUS_CLASS, STATUS_LABEL, daysLeft, fmtDay, planOf, storeStatus } from "@/lib/plans";
import StoreActions from "./StoreActions";

export const dynamic = "force-dynamic";

type Overview = {
  stores: number; active: number; trial: number; expired: number; users: number;
  products: number; sales: number; revenue: number; revenue30: number; sales30: number;
};
type StoreRow = {
  id: string; name: string; plan: string; active: boolean; trial_ends_at: string | null; plan_ends_at: string | null;
  created_at: string; owner_name: string | null; owner_email: string | null;
  users: number; products: number; sales: number; revenue: number; last_sale: string | null;
};

const Stat = ({ label, value, sub, Icon }: { label: string; value: string; sub?: string; Icon: typeof Users }) => (
  <div className="rounded-3xl border border-line bg-surface p-4">
    <span className="grid size-10 place-items-center rounded-xl bg-tint text-brand"><Icon size={20} /></span>
    <p className="mt-2 text-xs font-bold uppercase tracking-wider text-soft">{label}</p>
    <p className="text-2xl font-extrabold">{value}</p>
    {sub && <p className="text-sm text-soft">{sub}</p>}
  </div>
);

export default async function AdminPage() {
  const account = await getAccount();
  if (!account) redirect("/login");
  if (!account.isSuperAdmin) redirect("/");

  const supabase = await createClient();
  const [{ data: ov }, { data: rows }] = await Promise.all([
    supabase.rpc("admin_overview"),
    supabase.rpc("admin_stores"),
  ]);
  const o = (ov ?? {}) as Overview;
  const stores = (rows ?? []) as StoreRow[];

  return (
    <main className="min-h-dvh bg-page pb-12">
      <div className="h-[3px] bg-gradient-to-r from-brand via-blue-400 to-transparent" />
      <div className="mx-auto max-w-md px-5 pt-5">
        <header className="flex items-center gap-4">
          <Link href="/" aria-label="Voltar" className="grid size-12 shrink-0 place-items-center rounded-2xl border border-line bg-surface shadow-sm"><ArrowLeft size={22} /></Link>
          <div className="leading-tight">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand">Sistema · Painel do dono</p>
            <h1 className="text-3xl font-extrabold">Visão geral do negócio</h1>
          </div>
        </header>

        <div className="mt-6 grid grid-cols-2 gap-3">
          <Stat label="Lojas" value={String(o.stores ?? 0)} sub={`${o.active ?? 0} ativas · ${o.expired ?? 0} vencidas`} Icon={Building2} />
          <Stat label="Usuários" value={String(o.users ?? 0)} sub={`${o.trial ?? 0} em teste`} Icon={Users} />
          <Stat label="Vendas (30 dias)" value={String(o.sales30 ?? 0)} sub={brl(Number(o.revenue30 ?? 0))} Icon={ShoppingCart} />
          <Stat label="Volume total" value={brl(Number(o.revenue ?? 0))} sub={`${o.sales ?? 0} vendas · ${o.products ?? 0} produtos`} Icon={DollarSign} />
        </div>

        <h2 className="mb-2 mt-7 px-1 text-xs font-bold uppercase tracking-[0.18em] text-soft">Lojas cadastradas</h2>
        <div className="space-y-3">
          {stores.map((s) => {
            const status = storeStatus(s);
            const left = daysLeft(s.plan === "trial" ? s.trial_ends_at : s.plan_ends_at);
            return (
              <section key={s.id} className="rounded-3xl border border-line bg-surface p-4">
                <div className="flex items-start gap-3">
                  <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-tint text-lg font-extrabold text-brand">{s.name[0]?.toUpperCase() ?? "?"}</span>
                  <div className="min-w-0 flex-1 leading-tight">
                    <b className="block truncate text-xl font-extrabold">{s.name}</b>
                    <span className="block truncate text-sm text-soft">{s.owner_name ?? "Sem dono"} · {s.owner_email ?? "—"}</span>
                  </div>
                  <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-bold uppercase ${STATUS_CLASS[status]}`}>{STATUS_LABEL[status]}</span>
                </div>

                <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                  <div className="rounded-2xl bg-page py-2"><b className="block text-lg">{s.products}</b><span className="text-xs text-soft">produtos</span></div>
                  <div className="rounded-2xl bg-page py-2"><b className="block text-lg">{s.sales}</b><span className="text-xs text-soft">vendas</span></div>
                  <div className="rounded-2xl bg-page py-2"><b className="block text-lg">{brl(Number(s.revenue))}</b><span className="text-xs text-soft">volume</span></div>
                </div>

                <p className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-soft">
                  <span>Plano: <b className="text-ink">{planOf(s.plan).name}</b></span>
                  <span>Vence: <b className="text-ink">{fmtDay(s.plan === "trial" ? s.trial_ends_at : s.plan_ends_at)}</b></span>
                  {left != null && left >= 0 && <span className="font-semibold text-amber-700">{left} dia(s)</span>}
                  {left != null && left < 0 && <span className="flex items-center gap-1 font-semibold text-red-700"><AlertTriangle size={14} /> vencido</span>}
                </p>
                <p className="mt-1 text-sm text-soft">Última venda: {s.last_sale ? fmtDateTime(s.last_sale) : "nenhuma"} · criada em {fmtDay(s.created_at)}</p>

                <StoreActions id={s.id} active={s.active} />
              </section>
            );
          })}
          {stores.length === 0 && <p className="rounded-3xl border border-line bg-surface px-5 py-8 text-center text-soft">Nenhuma loja cadastrada ainda.</p>}
        </div>

        <p className="mt-6 flex items-center justify-center gap-2 text-sm text-soft"><TrendingUp size={16} /> Painel exclusivo do dono do sistema</p>
      </div>
    </main>
  );
}
