import Link from "next/link";
import { ChevronRight, History } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import ThemeSwitch from "@/components/ThemeSwitch";

export default function Geral() {
  return (
    <main className="mx-auto min-h-dvh max-w-md bg-page px-5 pt-5">
      <PageHeader eyebrow="Ajustes · Geral" title="Preferências do terminal" back="/ajustes" />
      <section className="mt-6 overflow-hidden rounded-3xl border border-line bg-surface"><ThemeSwitch /></section>
      <Link href="/ajustes/auditoria" className="mt-3 flex items-center gap-4 rounded-3xl border border-line bg-surface px-5 py-4 active:bg-page">
        <span className="grid size-14 shrink-0 place-items-center rounded-2xl bg-slate-100 text-slate-600"><History size={24} /></span>
        <span className="flex-1 leading-tight"><b className="block text-xl font-extrabold">Histórico de ações</b><span className="text-soft">Auditoria de segurança da loja</span></span>
        <ChevronRight size={22} className="text-soft/70" />
      </Link>
    </main>
  );
}
