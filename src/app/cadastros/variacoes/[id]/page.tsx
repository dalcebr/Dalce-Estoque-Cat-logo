import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import PageHeader from "@/components/PageHeader";
import DeleteButton from "@/components/DeleteButton";
import SubmitButton from "@/components/SubmitButton";
import { deleteVariation, saveVariation } from "../../actions";

export const dynamic = "force-dynamic";
const f = "w-full rounded-2xl border border-line bg-surface px-4 py-3.5 text-lg outline-none focus:border-brand";
const L = ({ t }: { t: string }) => <span className="mb-1 block px-1 text-xs font-bold uppercase tracking-[0.15em] text-soft">{t}</span>;

export default async function Variacao({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ erro?: string }> }) {
  const { id } = await params, { erro } = await searchParams;
  const isNew = id === "novo";
  let g = { name: "", options: [] as string[] };
  if (!isNew) {
    const supabase = await createClient();
    const { data } = await supabase.from("variation_groups").select("name, options").eq("id", id).maybeSingle();
    if (!data) notFound();
    g = data;
  }
  return (
    <main className="mx-auto min-h-dvh max-w-md bg-page px-5 pb-10 pt-5">
      <PageHeader eyebrow="Cadastro · Variações" title={isNew ? "Nova variação" : "Editar variação"} back="/cadastros/variacoes" />
      <form action={saveVariation} className="mt-6 space-y-3">
        <input type="hidden" name="id" value={isNew ? "" : id} />
        <label className="block"><L t="Nome do grupo" /><input name="name" required maxLength={40} defaultValue={g.name} placeholder="Ex.: Tamanho" className={f} /></label>
        <label className="block"><L t="Opções" /><textarea name="options" required rows={4} defaultValue={g.options.join(", ")} placeholder="Ex.: P, M, G, GG (separe por vírgula ou linha)" className={f} /></label>
        {erro && <p role="alert" className="text-red-700">Informe o nome e pelo menos uma opção.</p>}
        <SubmitButton>Salvar variação</SubmitButton>
      </form>
      {!isNew && <DeleteButton action={deleteVariation.bind(null, id)} label="Excluir variação" confirmText="Excluir este grupo de variações?" />}
    </main>
  );
}
