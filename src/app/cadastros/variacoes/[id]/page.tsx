import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import PageHeader from "@/components/PageHeader";
import DeleteButton from "@/components/DeleteButton";
import SubmitButton from "@/components/SubmitButton";
import VariationOptions from "@/components/VariationOptions";
import { deleteVariation, saveVariation } from "../../actions";

export const dynamic = "force-dynamic";

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
        <VariationOptions name={g.name} options={g.options} />
        {erro && <p role="alert" className="text-red-700">Informe o nome e pelo menos uma opção.</p>}
        <SubmitButton>Salvar variação</SubmitButton>
      </form>
      {!isNew && <DeleteButton action={deleteVariation.bind(null, id)} label="Excluir variação" confirmText="Excluir este grupo de variações?" />}
    </main>
  );
}
