import { createClient } from "@/lib/supabase/server";
import PageHeader from "@/components/PageHeader";
import CadList, { type CadRow } from "@/components/CadList";
import { ago, avatarColor, balances } from "@/lib/fiado";
import { brl } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function Clientes() {
  const supabase = await createClient();
  const [{ data: cs }, { data: ss }, bal] = await Promise.all([
    supabase.from("customers").select("id, name, phone, cpf").order("name"),
    supabase.from("sales").select("customer_name, created_at").not("customer_name", "is", null).neq("status", "cancelada").order("created_at", { ascending: false }).limit(1000),
    balances(supabase),
  ]);
  const last = new Map<string, string>();
  for (const s of (ss ?? []) as { customer_name: string; created_at: string }[]) { const k = s.customer_name.trim().toLowerCase(); if (!last.has(k)) last.set(k, s.created_at); }
  let open = 0;
  const rows: CadRow[] = ((cs ?? []) as { id: string; name: string; phone: string | null; cpf: string | null }[]).map((c): CadRow => {
    const k = c.name.trim().toLowerCase(), b = bal.get(k) ?? 0, l = last.get(k);
    if (b > 0.004) open++;
    return { id: c.id, href: `/cadastros/clientes/${c.id}`, title: c.name, sub: [c.phone, l ? ago(l) : null].filter(Boolean).join(" · ") || undefined,
      search: `${c.name} ${c.phone ?? ""} ${c.cpf ?? ""}`, left: { k: "avatar", t: c.name[0]?.toUpperCase() ?? "?", bg: avatarColor(c.name) },
      right: b > 0.004 ? { t: `-${brl(b)}`, s: "em aberto", warn: true } : undefined };
  });
  return (
    <main className="min-h-dvh bg-page pb-36">
      <div className="h-[3px] bg-gradient-to-r from-brand via-blue-400 to-transparent" />
      <div className="mx-auto max-w-md px-5 pt-5">
        <PageHeader eyebrow="Cadastro · Clientes" title="Sua base de clientes" back="/cadastros" sub={`${rows.length} ${rows.length === 1 ? "cliente" : "clientes"} · ${open} com fiado em aberto`} />
        <CadList rows={rows} placeholder="Nome, telefone ou CPF" addLabel="Novo cliente" addHref="/cadastros/clientes/novo" empty="Nenhum cliente cadastrado." />
      </div>
    </main>
  );
}
