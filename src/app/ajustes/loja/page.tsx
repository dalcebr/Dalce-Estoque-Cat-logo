import PageHeader from "@/components/PageHeader";
import SubmitButton from "@/components/SubmitButton";
import { createClient } from "@/lib/supabase/server";
import { updateStore } from "../actions";

export const dynamic = "force-dynamic";

export default async function Loja() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: p } = await supabase.from("profiles").select("stores(name)").eq("id", user!.id).single();
  const st = Array.isArray(p?.stores) ? p?.stores[0] : p?.stores;
  return (
    <main className="mx-auto min-h-dvh max-w-md bg-page px-5 pt-5">
      <PageHeader eyebrow="Ajustes · Loja" title="Dados da loja" back="/ajustes" />
      <form action={updateStore} className="mt-6 space-y-3">
        <label className="block"><span className="mb-1 block px-1 text-xs font-bold uppercase tracking-[0.15em] text-soft">Nome da loja</span>
          <input name="name" required defaultValue={st?.name ?? ""} className="w-full rounded-2xl border border-line bg-surface px-4 py-3.5 text-lg outline-none focus:border-brand" /></label>
        <SubmitButton>Salvar</SubmitButton>
      </form>
    </main>
  );
}
