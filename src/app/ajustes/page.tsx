import Link from "next/link";
import { ChevronRight, CreditCard, House, LogOut, Settings, ShieldCheck, type LucideIcon } from "lucide-react";
import AppMenu from "@/components/AppMenu";
import { signOut } from "@/app/login/actions";
import { getAccount } from "@/lib/account";
import { daysLeft, fmtDay, planOf } from "@/lib/plans";

export const dynamic = "force-dynamic";

const ITEMS: { n: string; s: string; href: string; Icon: LucideIcon; c: string }[] = [
  { n: "Geral", s: "Preferências do terminal", href: "/ajustes/geral", Icon: Settings, c: "bg-indigo-100 text-indigo-700" },
  { n: "Loja", s: "Dados cadastrais e fiscais", href: "/ajustes/loja", Icon: House, c: "bg-tint text-brand" },
];
const Label = ({ t }: { t: string }) => <h2 className="mb-2 mt-7 px-1 text-xs font-bold uppercase tracking-[0.18em] text-soft">{t}</h2>;

export default async function Ajustes() {
  const account = await getAccount();
  const plan = planOf(account?.plan);
  const limit = account?.plan === "trial" ? account?.trialEndsAt : account?.planEndsAt;
  const left = daysLeft(limit ?? null);

  return (
    <main className="min-h-dvh bg-page pb-10">
      <div className="h-[3px] bg-gradient-to-r from-brand via-blue-400 to-transparent" />
      <div className="mx-auto max-w-md px-5 pt-5">
        <header className="flex items-center gap-4"><AppMenu /><div className="leading-tight"><p className="text-xs font-bold uppercase tracking-[0.18em] text-brand">Sistema · Ajustes</p><h1 className="text-3xl font-extrabold">O que quer ajustar?</h1></div></header>

        <Label t="Loja & operação" />
        <section className="divide-y divide-line overflow-hidden rounded-3xl border border-line bg-surface">
          {ITEMS.map(({ n, s, href, Icon, c }) => (
            <Link key={n} href={href} className="flex items-center gap-4 px-5 py-4 active:bg-page">
              <span className={`grid size-14 shrink-0 place-items-center rounded-2xl ${c}`}><Icon size={24} /></span>
              <span className="flex-1 leading-tight"><b className="block text-xl font-extrabold">{n}</b><span className="text-soft">{s}</span></span>
              <ChevronRight size={22} className="text-soft/70" />
            </Link>))}
        </section>

        <Label t="Assinatura" />
        <Link href="/assinatura" className="flex items-center gap-4 rounded-3xl border border-line bg-surface px-5 py-4 active:bg-page">
          <span className="grid size-14 shrink-0 place-items-center rounded-2xl bg-green-100 text-green-700"><CreditCard size={24} /></span>
          <span className="flex-1 leading-tight">
            <b className="block text-xl font-extrabold">Plano {plan.name}</b>
            <span className="text-soft">{left != null ? `${left} dia(s) · vence ${fmtDay(limit ?? null)}` : "Sem vencimento"}</span>
          </span>
          <ChevronRight size={22} className="text-soft/70" />
        </Link>

        {account?.isSuperAdmin && (
          <>
            <Label t="Dono do sistema" />
            <Link href="/admin" className="flex items-center gap-4 rounded-3xl border border-line bg-surface px-5 py-4 active:bg-page">
              <span className="grid size-14 shrink-0 place-items-center rounded-2xl bg-indigo-100 text-indigo-700"><ShieldCheck size={24} /></span>
              <span className="flex-1 leading-tight"><b className="block text-xl font-extrabold">Painel do dono</b><span className="text-soft">lojas, planos e métricas</span></span>
              <ChevronRight size={22} className="text-soft/70" />
            </Link>
          </>
        )}

        <Label t="Conta" />
        <form action={signOut} className="overflow-hidden rounded-3xl border border-line bg-surface">
          <button className="flex w-full items-center gap-4 px-5 py-4 text-left active:bg-page">
            <span className="grid size-14 shrink-0 place-items-center rounded-2xl bg-red-100 text-red-700"><LogOut size={24} /></span>
            <span className="flex-1 leading-tight"><b className="block text-xl font-extrabold">Sair</b><span className="text-soft">Encerrar a sessão neste aparelho</span></span>
          </button>
        </form>
      </div>
    </main>
  );
}
