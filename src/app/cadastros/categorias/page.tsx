import { createClient } from "@/lib/supabase/server";
import PageHeader from "@/components/PageHeader";
import CadList, { type CadRow } from "@/components/CadList";

export const dynamic = "force-dynamic";

export default async function Categorias() {
  const supabase = await createClient();
  const { data } = await supabase.from("categories").select("id, name, color").order("name");
  const rows: CadRow[] = (data ?? []).map((c: { id: string; name: string; color: string }): CadRow => ({
    id: c.id, href: `/cadastros/categorias/${c.id}`, title: c.name, search: c.name, left: { k: "chip", t: c.name[0]?.toUpperCase() ?? "?", bg: `${c.color}26`, fg: c.color } }));
  return (
    <main className="min-h-dvh bg-page pb-36">
      <div className="h-[3px] bg-gradient-to-r from-brand via-blue-400 to-transparent" />
      <div className="mx-auto max-w-md px-5 pt-5">
        <PageHeader eyebrow="Cadastro · Categorias" title="Suas categorias" back="/cadastros" sub={`${rows.length} ${rows.length === 1 ? "categoria" : "categorias"}`} />
        <CadList rows={rows} placeholder="Nome da categoria" addLabel="Nova categoria" addHref="/cadastros/categorias/novo" empty="Nenhuma categoria cadastrada." />
      </div>
    </main>
  );
}
