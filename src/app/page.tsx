import Link from "next/link";
import { BarChart3, Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import Menu from "@/components/Menu";
import GoalCard from "@/components/GoalCard";
import { brl, nowParts } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function Home() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase.from("profiles").select("name, stores(monthly_goal)").eq("id", user!.id).single();
  const { hour, label, dayStart, monthStart } = nowParts();
  const { data: sales } = await supabase.from("sales").select("total, cost, created_at").gte("created_at", monthStart);

  const list = sales ?? [];
  const sum = (a: typeof list, k: "total" | "cost") => a.reduce((s, x) => s + Number(x[k]), 0);
  const today = list.filter((s) => s.created_at >= dayStart);
  const month = sum(list, "total"), cost = sum(list, "cost"), profit = month - cost;
  const store = Array.isArray(profile?.stores) ? profile?.stores[0] : profile?.stores;
  const goal = store?.monthly_goal != null ? Number(store.monthly_goal) : null;
  const greeting = hour < 12 ? "Bom dia" : hour < 18 ? "Boa tarde" : "Boa noite";
  const name = profile?.name?.split(" ")[0] ?? "Usuário";

  return (
    <main className="mx-auto min-h-dvh max-w-md bg-white px-5 pb-32 pt-[max(1.25rem,env(safe-area-inset-top))]">
      <div className="flex justify-end"><Menu /></div>
      <h1 className="mt-2 text-2xl font-bold text-black">{greeting}, {name}!</h1>
      <p className="text-muted">{label}</p>

      <section className="mt-5 rounded-3xl bg-brand p-5 text-white">
        <div className="flex justify-between text-sm"><span>vendido hoje</span><span className="font-medium">detalhes</span></div>
        <p className="mt-1 text-4xl font-bold">{brl(sum(today, "total"))}</p>
        <div className="mt-3 flex gap-4 text-sm"><span>Mês: {brl(month)}</span><span>{list.length} {list.length === 1 ? "venda" : "vendas"}</span></div>
      </section>

      <div className="mt-3 grid grid-cols-2 gap-3">
        <div className="rounded-2xl border border-gray-200 bg-white p-4"><p className="text-sm text-muted">Custo</p><p className="mt-1 text-lg font-bold text-black">{brl(cost)}</p></div>
        <div className="rounded-2xl border border-gray-200 bg-white p-4"><p className="text-sm text-muted">Lucro</p><p className="mt-1 text-lg font-bold text-green-600">{brl(profit)}</p></div>
      </div>

      <div className="mt-3"><GoalCard goal={goal} sold={month} /></div>

      <nav className="fixed inset-x-0 bottom-0 bg-white/95 px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-3">
        <div className="mx-auto grid max-w-md grid-cols-2 gap-3">
          <Link href="/relatorios" className="flex items-center justify-center gap-2 rounded-xl border border-brand bg-white py-3 font-semibold text-brand"><BarChart3 size={20} /> Relatórios</Link>
          <Link href="/vendas/nova" className="flex items-center justify-center gap-2 rounded-xl bg-brand py-3 font-semibold text-white"><Plus size={20} /> Nova venda</Link>
        </div>
      </nav>
    </main>
  );
}
