import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import PageHeader from "@/components/PageHeader";
import DeleteButton from "@/components/DeleteButton";
import SubmitButton from "@/components/SubmitButton";
import { deleteCategory, saveCategory } from "../../actions";

export const dynamic = "force-dynamic";
const COLORS = ["#0f8b83", "#2563eb", "#d97706", "#be123c", "#0e7490", "#4d7c0f", "#7c3aed", "#475569"];

export default async function Categoria({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ erro?: string }> }) {
  const { id } = await params, { erro } = await searchParams;
  const isNew = id === "novo";
  let c = { name: "", color: COLORS[0] };
  if (!isNew) {
    const supabase = await createClient();
    const { data } = await supabase.from("categories").select("name, color").eq("id", id).maybeSingle();
    if (!data) notFound();
    c = data;
  }
  return (
    <main className="mx-auto min-h-dvh max-w-md bg-page px-5 pb-10 pt-5">
      <PageHeader eyebrow="Cadastro · Categorias" title={isNew ? "Nova categoria" : "Editar categoria"} back="/cadastros/categorias" />
      <form action={saveCategory} className="mt-6 space-y-4">
        <input type="hidden" name="id" value={isNew ? "" : id} />
        <label className="block"><span className="mb-1 block px-1 text-xs font-bold uppercase tracking-[0.15em] text-soft">Nome</span>
          <input name="name" required maxLength={40} defaultValue={c.name} className="w-full rounded-2xl border border-line bg-surface px-4 py-3.5 text-lg outline-none focus:border-brand" /></label>
        {erro && <p role="alert" className="text-red-700">Já existe uma categoria com esse nome.</p>}
        <div><span className="mb-2 block px-1 text-xs font-bold uppercase tracking-[0.15em] text-soft">Cor</span>
          <div className="flex flex-wrap gap-3">{COLORS.map((k) => (
            <label key={k} className="cursor-pointer"><input type="radio" name="color" value={k} defaultChecked={k.toLowerCase() === c.color.toLowerCase()} className="peer sr-only" />
              <span className="block size-11 rounded-full ring-offset-2 ring-offset-page peer-checked:ring-4 peer-checked:ring-ink" style={{ background: k }} /></label>))}</div></div>
        <SubmitButton>Salvar categoria</SubmitButton>
      </form>
      {!isNew && <DeleteButton action={deleteCategory.bind(null, id)} label="Excluir categoria" confirmText="Excluir esta categoria? Os produtos dela ficam sem categoria." />}
    </main>
  );
}
