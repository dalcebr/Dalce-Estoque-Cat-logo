import Link from "next/link";
import { Archive, Bookmark, ChevronRight, LayoutGrid, Users, type LucideIcon } from "lucide-react";
import AppMenu from "@/components/AppMenu";

const ITEMS: { n: string; s: string; href: string; Icon: LucideIcon; c: string }[] = [
  { n: "Cliente", s: "Sua base de clientes", href: "/em-breve?p=Cliente", Icon: Users, c: "bg-teal-100 text-teal-700" },
  { n: "Produto", s: "Itens que você vende", href: "/produtos/novo", Icon: Archive, c: "bg-green-100 text-green-700" },
  { n: "Categoria", s: "Organize o catálogo", href: "/em-breve?p=Categoria", Icon: LayoutGrid, c: "bg-amber-100 text-amber-700" },
  { n: "Variações", s: "Grades: cor, tamanho…", href: "/em-breve?p=Variações", Icon: Bookmark, c: "bg-indigo-100 text-indigo-700" },
];

export default function Cadastros() {
  return (
    <main className="min-h-dvh bg-page pb-10">
      <div className="h-[3px] bg-gradient-to-r from-brand via-blue-400 to-transparent" />
      <div className="mx-auto max-w-md px-5 pt-5">
        <header className="flex items-center gap-4">
          <AppMenu />
          <div className="leading-tight">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand">Cadastro · Itens</p>
            <h1 className="text-3xl font-extrabold">O que você vai cadastrar?</h1>
          </div>
        </header>
        <section className="mt-6 divide-y divide-line overflow-hidden rounded-3xl border border-line bg-surface">
          {ITEMS.map(({ n, s, href, Icon, c }) => (
            <Link key={n} href={href} className="flex items-center gap-4 px-5 py-4 active:bg-page">
              <span className={`grid size-14 shrink-0 place-items-center rounded-2xl ${c}`}><Icon size={24} /></span>
              <span className="flex-1 leading-tight"><b className="block text-xl font-extrabold">{n}</b><span className="text-soft">{s}</span></span>
              <ChevronRight size={22} className="text-soft/70" />
            </Link>))}
        </section>
      </div>
    </main>
  );
}
