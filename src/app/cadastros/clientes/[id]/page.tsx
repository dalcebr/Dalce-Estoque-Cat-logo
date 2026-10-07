import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import PageHeader from "@/components/PageHeader";
import SubmitButton from "@/components/SubmitButton";
import { saveCustomer } from "../../actions";

export const dynamic = "force-dynamic";
const f = "w-full rounded-2xl border border-line bg-surface px-4 py-3.5 text-lg outline-none focus:border-brand";
const L = ({ t }: { t: string }) => <span className="mb-1 block px-1 text-xs font-bold uppercase tracking-[0.15em] text-soft">{t}</span>;
const ERROS: Record<string, string> = { nome: "Já existe um cliente com esse nome.", cpf: "O CPF precisa ter 11 dígitos." };

export default async function Cliente({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ erro?: string }> }) {
  const { id } = await params, { erro } = await searchParams;
  const isNew = id === "novo";
  let c = { name: "", phone: "", cpf: "" };
  if (!isNew) {
    const supabase = await createClient();
    const { data } = await supabase.from("customers").select("name, phone, cpf").eq("id", id).maybeSingle();
    if (!data) notFound();
    c = { name: data.name, phone: data.phone ?? "", cpf: data.cpf ?? "" };
  }
  return (
    <main className="mx-auto min-h-dvh max-w-md bg-page px-5 pb-10 pt-5">
      <PageHeader eyebrow="Cadastro · Clientes" title={isNew ? "Novo cliente" : c.name} back="/cadastros/clientes" />
      <form action={saveCustomer} className="mt-6 space-y-3">
        <input type="hidden" name="id" value={isNew ? "" : id} />
        <label className="block"><L t="Nome" /><input name="name" required maxLength={80} defaultValue={c.name} readOnly={!isNew} className={`${f} ${isNew ? "" : "opacity-60"}`} /></label>
        {!isNew && <p className="px-1 text-sm text-soft">O nome não muda para manter o histórico de vendas e fiado.</p>}
        <label className="block"><L t="Telefone · WhatsApp" /><input name="phone" inputMode="tel" defaultValue={c.phone} placeholder="(11) 99999-9999" className={f} /></label>
        <label className="block"><L t="CPF" /><input name="cpf" inputMode="numeric" defaultValue={c.cpf} placeholder="Somente números" className={f} /></label>
        {erro && <p role="alert" className="text-red-700">{ERROS[erro] ?? "Não foi possível salvar."}</p>}
        <SubmitButton>Salvar cliente</SubmitButton>
      </form>
      {!isNew && <Link href={`/fiado/${encodeURIComponent(c.name)}`} className="mt-3 block rounded-2xl border-2 border-brand py-3.5 text-center text-lg font-bold text-brand">Ver fiado do cliente</Link>}
    </main>
  );
}
