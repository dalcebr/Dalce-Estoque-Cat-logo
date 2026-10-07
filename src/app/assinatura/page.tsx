import Link from "next/link";
import { redirect } from "next/navigation";
import { AlertTriangle, ArrowLeft, Check, MessageCircle, Sparkles } from "lucide-react";
import { getAccount } from "@/lib/account";
import { PLAN_LIST, brlPlan, daysLeft, fmtDay, planOf } from "@/lib/plans";

export const dynamic = "force-dynamic";

export default async function AssinaturaPage() {
  const account = await getAccount();
  if (!account) redirect("/login");

  const plan = planOf(account.plan);
  const limit = account.plan === "trial" ? account.trialEndsAt : account.planEndsAt;
  const left = daysLeft(limit);
  const expired = account.status === "expired" || account.status === "blocked";

  return (
    <main className="min-h-dvh bg-page pb-12">
      <div className="h-[3px] bg-gradient-to-r from-brand via-blue-400 to-transparent" />
      <div className="mx-auto max-w-md px-5 pt-5">
        <header className="flex items-center gap-4">
          <Link href="/ajustes" aria-label="Voltar" className="grid size-12 shrink-0 place-items-center rounded-2xl border border-line bg-surface shadow-sm"><ArrowLeft size={22} /></Link>
          <div className="leading-tight">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand">Conta · Assinatura</p>
            <h1 className="text-3xl font-extrabold">Seu plano</h1>
          </div>
        </header>

        <section className={`mt-6 rounded-[28px] p-5 text-white ${expired ? "bg-gradient-to-br from-red-700 to-red-900" : "bg-gradient-to-br from-[#14306e] to-[#2a5bd7]"}`}>
          <p className="text-xs font-bold uppercase tracking-[0.18em] opacity-90">{account.storeName}</p>
          <p className="mt-1 text-3xl font-extrabold">{plan.name}</p>
          <p className="mt-1 text-lg opacity-90">
            {expired ? "Acesso suspenso — regularize para voltar a vender" : left != null ? `${left} dia(s) restantes · vence em ${fmtDay(limit)}` : "Sem data de vencimento"}
          </p>
          {expired && <p className="mt-3 flex items-center gap-2 rounded-2xl bg-white/15 px-4 py-3 text-sm font-semibold"><AlertTriangle size={18} /> Seus dados continuam salvos. Reative para voltar a usar.</p>}
        </section>

        <h2 className="mb-2 mt-7 px-1 text-xs font-bold uppercase tracking-[0.18em] text-soft">Planos disponíveis</h2>
        <div className="space-y-3">
          {PLAN_LIST.map((p) => {
            const current = p.key === account.plan;
            return (
              <section key={p.key} className={`rounded-3xl border p-5 ${current ? "border-brand bg-tint" : "border-line bg-surface"}`}>
                <div className="flex items-center justify-between">
                  <b className="text-xl font-extrabold">{p.name}</b>
                  <span className="text-right leading-tight">
                    <b className="block text-xl font-extrabold">{p.price === 0 ? "Grátis" : brlPlan(p.price)}</b>
                    {p.price ? <span className="text-xs text-soft">por mês</span> : null}
                  </span>
                </div>
                <p className="mt-1 text-soft">{p.tagline}</p>
                <ul className="mt-3 space-y-1.5">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm font-semibold"><Check size={16} className="text-brand" />{f}</li>
                  ))}
                </ul>
                {current && <p className="mt-3 rounded-xl bg-brand px-4 py-2 text-center text-sm font-bold text-white">Plano atual</p>}
              </section>
            );
          })}
        </div>

        <section className="mt-6 rounded-3xl border border-line bg-surface p-5">
          <h2 className="flex items-center gap-2 text-xl font-extrabold"><Sparkles size={20} className="text-brand" /> Como assinar</h2>
          <p className="mt-2 text-soft">Fale com nosso time, escolha o plano e receba o acesso liberado na hora.</p>
          <a href="mailto:suporte@dalce.app?subject=Quero%20assinar%20o%20Dalce%20Estoque" className="mt-4 flex items-center justify-center gap-2 rounded-2xl bg-brand py-4 text-lg font-bold text-white">
            <MessageCircle size={20} /> Falar com o suporte
          </a>
          <p className="mt-3 text-center text-sm text-soft">suporte@dalce.app</p>
        </section>
      </div>
    </main>
  );
}
