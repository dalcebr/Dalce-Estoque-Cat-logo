import Link from "next/link";
import { Sparkles } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import PageHeader from "@/components/PageHeader";

export const dynamic = "force-dynamic";
const EXEMPLOS: [string, string, string[]][] = [["👕", "Camiseta", ["P", "M", "G", "GG"]], ["👟", "Calçados", ["34", "35", "36", "37", "38"]], ["🎨", "Cor", ["Preta", "Vermelha", "Amarela", "Azul"]], ["🍦", "Sabor", ["Chocolate", "Morango", "Creme"]]];
const Pill = ({ t }: { t: string }) => <span className="rounded-full bg-tint px-3.5 py-1.5 font-semibold text-brand">{t}</span>;

export default async function Variacoes() {
  const supabase = await createClient();
  const { data } = await supabase.from("variation_groups").select("id, name, options").order("name");
  const groups = (data ?? []) as { id: string; name: string; options: string[] }[];
  return (
    <main className="min-h-dvh bg-page pb-36">
      <div className="h-[3px] bg-gradient-to-r from-brand via-blue-400 to-transparent" />
      <div className="mx-auto max-w-md px-5 pt-5">
        {groups.length > 0 ? (
          <>
            <PageHeader eyebrow="Cadastro · Variações" title="Suas variações" back="/cadastros" sub={`${groups.length} ${groups.length === 1 ? "grupo" : "grupos"}`} />
            <div className="mt-5 space-y-3">{groups.map((g) => (
              <Link key={g.id} href={`/cadastros/variacoes/${g.id}`} className="block rounded-3xl border border-line bg-surface p-4">
                <div className="flex items-center justify-between gap-3">
                  <b className="text-xl font-extrabold">{g.name}</b>
                  <span className="shrink-0 rounded-full bg-tint px-3 py-1 text-sm font-bold text-brand">{g.options.length} {g.options.length === 1 ? "opção" : "opções"}</span>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">{g.options.map((o) => <Pill key={o} t={o} />)}</div>
              </Link>))}</div>
          </>
        ) : (
          <>
            <PageHeader eyebrow="Cadastro · Variações" title="Crie diferentes versões do seu produto" back="/cadastros" />
            <p className="mt-6 text-lg leading-relaxed text-soft">Adicione tamanhos, cores, sabores ou tipos do mesmo item, com controle individual de estoque e preço.</p>
            <p className="mt-4 flex gap-3 rounded-3xl bg-tint p-4 text-lg font-semibold text-brand"><Sparkles className="mt-0.5 shrink-0" size={22} />Cada versão com seu próprio estoque e preço, sem duplicar produtos no catálogo.</p>
            <h2 className="mb-3 mt-10 text-center text-sm font-bold uppercase tracking-[0.18em] text-soft">Exemplos de uso</h2>
            <div className="grid grid-cols-2 gap-3">{EXEMPLOS.map(([e, n, o]) => (
              <div key={n} className="rounded-3xl border border-line bg-surface p-4"><div className="flex items-center gap-3"><span className="grid size-12 place-items-center rounded-xl bg-tint text-2xl">{e}</span><b className="text-xl font-extrabold">{n}</b></div>
                <div className="mt-3 flex flex-wrap gap-1.5">{o.map((x) => <Pill key={x} t={x} />)}</div></div>))}</div>
          </>)}
      </div>
      <div className="fixed inset-x-0 bottom-0 bg-gradient-to-t from-page via-page to-transparent px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-6">
        <Link href="/cadastros/variacoes/novo" className="mx-auto block w-full max-w-md rounded-[28px] bg-brand py-5 text-center text-xl font-extrabold text-white shadow-lg">Cadastrar variações</Link>
      </div>
    </main>
  );
}
