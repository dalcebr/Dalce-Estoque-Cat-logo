import Link from "next/link";
import { ChevronRight, History } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import { createClient } from "@/lib/supabase/server";
import { fmtDateTime } from "@/lib/format";

export const dynamic = "force-dynamic";

const LABEL: Record<string, string> = {
  "loja.criada": "Loja criada",
  "loja.atualizada": "Dados da loja atualizados",
  "loja.ativada": "Acesso reativado",
  "loja.suspensa": "Acesso suspenso",
  "plano.alterado": "Plano alterado",
  "senha.redefinida": "Senha redefinida pelo suporte",
  "venda.cancelada": "Venda cancelada",
  "produto.criado": "Produto cadastrado",
  "produto.editado": "Produto atualizado",
  "produto.arquivado": "Produto arquivado",
  "categoria.criada": "Categoria criada",
  "categoria.editada": "Categoria atualizada",
  "categoria.excluida": "Categoria excluída",
  "cliente.criado": "Cliente cadastrado",
  "cliente.editado": "Cliente atualizado",
  "variacao.criada": "Variação criada",
  "variacao.editada": "Variação atualizada",
  "variacao.excluida": "Variação excluída",
  "catalogo.salvo": "Catálogo atualizado",
};

export default async function Auditoria() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("audit_logs")
    .select("id, action, detail, actor_name, created_at")
    .order("created_at", { ascending: false })
    .limit(100);
  const rows = (data ?? []) as { id: string; action: string; detail: string | null; actor_name: string | null; created_at: string }[];

  return (
    <main className="mx-auto min-h-dvh max-w-md bg-page px-5 pb-10 pt-5">
      <PageHeader eyebrow="Ajustes · Segurança" title="Histórico de ações" back="/ajustes/geral" sub="Últimos 100 registros da sua loja" />
      <section className="mt-6 overflow-hidden rounded-3xl border border-line bg-surface">
        {rows.length === 0 && <p className="px-5 py-8 text-center text-soft">Nenhuma ação registrada ainda.</p>}
        <div className="divide-y divide-line">
          {rows.map((r) => (
            <div key={r.id} className="flex items-start gap-4 px-5 py-4">
              <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-tint text-brand"><History size={20} /></span>
              <span className="min-w-0 flex-1 leading-tight">
                <b className="block text-lg">{LABEL[r.action] ?? r.action}</b>
                {r.detail && <span className="block truncate text-soft">{r.detail}</span>}
                <span className="text-sm text-soft">{fmtDateTime(r.created_at)} · {r.actor_name ?? "Sistema"}</span>
              </span>
            </div>
          ))}
        </div>
      </section>
      <Link href="/ajustes/geral" className="mt-4 flex items-center justify-center gap-2 rounded-2xl border-2 border-brand py-3.5 font-bold text-brand">
        Voltar às preferências <ChevronRight size={18} />
      </Link>
    </main>
  );
}
