import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getStore } from "@/lib/store";
import PageHeader from "@/components/PageHeader";
import DeleteButton from "@/components/DeleteButton";
import CategoryForm from "@/components/CategoryForm";
import { getSupabasePublicConfig } from "@/lib/supabase/public";
import { deleteCategory } from "../../actions";

export const dynamic = "force-dynamic";
const COLORS = ["#0f8b83", "#2563eb", "#d97706", "#be123c", "#0e7490", "#4d7c0f", "#7c3aed", "#475569"];

export default async function Categoria({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ erro?: string }> }) {
  const { id } = await params, { erro } = await searchParams;
  const isNew = id === "novo";
  const store = await getStore();
  const { url: supabaseUrl, anonKey: supabaseKey } = getSupabasePublicConfig();
  let c: { name: string; color: string; image: string | null } = { name: "", color: COLORS[0], image: null };
  if (!isNew) {
    const supabase = await createClient();
    const { data } = await supabase.from("categories").select("name, color, image").eq("id", id).maybeSingle();
    if (!data) notFound();
    c = data;
  }
  return (
    <main className="mx-auto min-h-dvh max-w-md bg-page px-5 pb-10 pt-5">
      <PageHeader eyebrow="Cadastro · Categorias" title={isNew ? "Nova categoria" : "Editar categoria"} back="/cadastros/categorias" />
      {erro && <p role="alert" className="mt-4 text-red-700">Já existe uma categoria com esse nome.</p>}
      <CategoryForm c={{ id: isNew ? undefined : id, name: c.name, color: c.color, image: c.image }} storeId={store?.storeId ?? ""} supabaseUrl={supabaseUrl} supabaseKey={supabaseKey} />
      {!isNew && <div className="mt-6"><DeleteButton action={deleteCategory.bind(null, id)} label="Excluir categoria" confirmText="Excluir esta categoria? Os produtos dela ficam sem categoria." /></div>}
    </main>
  );
}
