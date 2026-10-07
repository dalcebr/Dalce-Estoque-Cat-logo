import Link from "next/link";
import { BadgeCheck, Box, ChartNoAxesColumn, Store } from "lucide-react";
import SignUpForm from "./SignUpForm";

const BENEFITS = [
  { Icon: Store, t: "Catálogo online", s: "Sua vitrine com link próprio para divulgar" },
  { Icon: Box, t: "Estoque e fiado", s: "Controle de produtos, clientes e contas a receber" },
  { Icon: ChartNoAxesColumn, t: "Relatórios", s: "Lucro, ticket médio e mais vendidos" },
];

export default function CadastroPage() {
  return (
    <main className="min-h-dvh bg-page pb-12">
      <div className="h-[3px] bg-gradient-to-r from-brand via-blue-400 to-transparent" />
      <div className="mx-auto max-w-md px-5 pt-8">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand">Dalce Estoque</p>
        <h1 className="mt-1 text-3xl font-extrabold leading-tight">Comece a vender organizado hoje</h1>
        <p className="mt-2 text-soft">14 dias grátis, sem cartão de crédito. Cancele quando quiser.</p>

        <ul className="mt-6 space-y-2">
          {BENEFITS.map(({ Icon, t, s }) => (
            <li key={t} className="flex items-center gap-4 rounded-3xl border border-line bg-surface p-4">
              <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-tint text-brand"><Icon size={22} /></span>
              <span className="leading-tight"><b className="block text-lg">{t}</b><span className="text-soft">{s}</span></span>
            </li>
          ))}
        </ul>

        <section className="mt-6 rounded-3xl border border-line bg-surface p-5">
          <h2 className="flex items-center gap-2 text-xl font-extrabold"><BadgeCheck size={22} className="text-brand" /> Criar minha loja</h2>
          <SignUpForm />
        </section>

        <p className="mt-6 text-center text-sm text-soft">
          Precisa de ajuda? <a href="mailto:suporte@dalce.app" className="font-bold text-brand">suporte@dalce.app</a>
        </p>
      </div>
    </main>
  );
}
