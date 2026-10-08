import Link from "next/link";
import { ChevronRight, House, LogOut, Settings, ShieldCheck, type LucideIcon } from "lucide-react";
import AppMenu from "@/components/AppMenu";
import { signOut } from "@/app/login/actions";
import { getAdminUserId } from "@/lib/admin";

const ITEMS: { n: string; s: string; href: string; Icon: LucideIcon; c: string }[] = [
  { n: "Geral", s: "Preferências do terminal", href: "/ajustes/geral", Icon: Settings, c: "bg-indigo-100 text-indigo-700" },
  { n: "Loja", s: "Dados cadastrais e fiscais", href: "/ajustes/loja", Icon: House, c: "bg-tint text-brand" },
];
const Label = ({ t }: { t: string }) => <h2 className="mb-2 mt-7 px-1 text-xs font-bold uppercase tracking-[0.18em] text-soft">{t}</h2>;

export default async function Ajustes() {
  const adminId = await getAdminUserId();
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
        {adminId && (
          <>
            <Label t="Administração" />
            <section className="overflow-hidden rounded-3xl border border-line bg-surface">
              <Link href="/admin" className="flex items-center gap-4 px-5 py-4 active:bg-page">
                <span className="grid size-14 shrink-0 place-items-center rounded-2xl bg-navy/10 text-navy"><ShieldCheck size={24} /></span>
                <span className="flex-1 leading-tight"><b className="block text-xl font-extrabold">Painel de acessos</b><span className="text-soft">Criar, congelar e excluir lojas</span></span>
                <ChevronRight size={22} className="text-soft/70" />
              </Link>
            </section>
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
