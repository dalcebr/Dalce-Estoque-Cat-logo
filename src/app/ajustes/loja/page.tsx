import PageHeader from "@/components/PageHeader";
import { createClient } from "@/lib/supabase/server";
import { updateStore } from "../actions";

export const dynamic = "force-dynamic";

const f = "w-full rounded-2xl border border-line bg-surface px-4 py-3.5 text-lg outline-none focus:border-brand";
const L = ({ t, opt }: { t: string; opt?: boolean }) => (
  <span className="mb-1 block px-1 text-xs font-bold uppercase tracking-[0.15em] text-soft">
    {t}{opt && <span className="font-medium normal-case tracking-normal"> · opcional</span>}
  </span>
);

export default async function Loja({ searchParams }: { searchParams: Promise<{ ok?: string }> }) {
  const { ok } = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: p } = await supabase
    .from("profiles")
    .select("stores(name, document, phone, email, address, city, state)")
    .eq("id", user!.id)
    .single();
  const st = (Array.isArray(p?.stores) ? p?.stores[0] : p?.stores) as
    | { name: string; document: string | null; phone: string | null; email: string | null; address: string | null; city: string | null; state: string | null }
    | null;

  return (
    <main className="mx-auto min-h-dvh max-w-md bg-page px-5 pb-10 pt-5">
      <PageHeader eyebrow="Ajustes · Loja" title="Dados da loja" back="/ajustes" sub="Aparecem no catálogo e nos recibos" />
      {ok && <p className="mt-4 rounded-2xl bg-green-100 px-4 py-3 text-sm font-semibold text-green-700">Dados salvos com sucesso.</p>}
      <form action={updateStore} className="mt-6 space-y-3">
        <label className="block"><L t="Nome da loja" />
          <input name="name" required maxLength={80} defaultValue={st?.name ?? ""} className={f} /></label>
        <label className="block"><L t="CNPJ ou CPF" opt />
          <input name="document" inputMode="numeric" defaultValue={st?.document ?? ""} placeholder="00.000.000/0000-00" className={f} /></label>
        <div className="grid grid-cols-2 gap-3">
          <label className="block"><L t="Telefone · WhatsApp" opt />
            <input name="phone" inputMode="tel" defaultValue={st?.phone ?? ""} placeholder="(11) 99999-9999" className={f} /></label>
          <label className="block"><L t="E-mail" opt />
            <input name="email" type="email" defaultValue={st?.email ?? ""} placeholder="contato@loja.com" className={f} /></label>
        </div>
        <label className="block"><L t="Endereço" opt />
          <input name="address" defaultValue={st?.address ?? ""} placeholder="Rua, número, bairro" className={f} /></label>
        <div className="grid grid-cols-[3fr_1fr] gap-3">
          <label className="block"><L t="Cidade" opt />
            <input name="city" defaultValue={st?.city ?? ""} className={f} /></label>
          <label className="block"><L t="UF" opt />
            <input name="state" maxLength={2} defaultValue={st?.state ?? ""} placeholder="SP" className={`${f} uppercase`} /></label>
        </div>
        <button className="w-full rounded-2xl bg-brand py-4 text-lg font-bold text-white">Salvar dados da loja</button>
      </form>
    </main>
  );
}
