import Link from "next/link";
import { Plus, ShieldCheck, Upload } from "lucide-react";
import { getAdminUserId, listStores } from "@/lib/admin";
import { adminConfigured } from "@/lib/supabase/admin";
import StoreCard from "./StoreCard";

export const dynamic = "force-dynamic";

const OK: Record<string, string> = {
  criado: "Acesso criado com sucesso.",
  congelado: "Loja congelada. O usuário não consegue mais acessar.",
  descongelado: "Loja descongelada. O acesso foi restaurado.",
  excluido: "Loja e todos os dados foram excluídos.",
  importado: "Backup importado com sucesso.",
  senha: "Senha redefinida.",
};

export default async function AdminPage({ searchParams }: { searchParams: Promise<{ ok?: string; erro?: string }> }) {
  const adminId = await getAdminUserId();
  if (!adminId) {
    // Não redireciona para "/" (isso causaria loop com o middleware).
    // Mostra uma mensagem clara com link para o diagnóstico.
    return (
      <main className="mx-auto max-w-md px-5 py-10 text-center">
        <h1 className="text-2xl font-extrabold">Acesso restrito</h1>
        <p className="mt-2 text-soft">
          Sua conta não está marcada como administrador. Verifique o papel do seu usuário.
        </p>
        <Link
          href="/admin/diagnostico"
          className="mt-6 inline-flex rounded-2xl bg-brand px-5 py-3 font-bold text-white"
        >
          Abrir diagnóstico
        </Link>
      </main>
    );
  }

  const { ok, erro } = await searchParams;
  const stores = await listStores();
  const configured = adminConfigured();

  return (
    <main className="pb-32">
      <div className="mx-auto max-w-md px-5 pt-5">
        {!configured && (
          <p className="mt-5 rounded-2xl border border-amber-300 bg-amber-100 px-4 py-3 text-sm font-semibold text-amber-700">
            Configure a variável <code>SUPABASE_SERVICE_ROLE_KEY</code> para criar, congelar e excluir acessos.
          </p>
        )}
        {ok && OK[ok] && (
          <p className="mt-5 rounded-2xl border border-green-300 bg-green-100 px-4 py-3 text-sm font-semibold text-green-700">{OK[ok]}</p>
        )}
        {erro && (
          <p className="mt-5 rounded-2xl border border-red-300 bg-red-100 px-4 py-3 text-sm font-semibold text-red-700">{decodeURIComponent(erro)}</p>
        )}

        <div className="mt-5 flex items-center gap-3 rounded-3xl border border-line bg-surface px-5 py-4">
          <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-tint text-brand"><ShieldCheck size={22} /></span>
          <div className="leading-tight">
            <b className="block text-lg">{stores.length} {stores.length === 1 ? "loja" : "lojas"}</b>
            <span className="text-soft">{stores.filter((s) => s.frozen).length} congelada(s)</span>
          </div>
        </div>

        <div className="mt-4 space-y-3">
          {stores.map((s) => <StoreCard key={s.storeId} store={s} />)}
          {stores.length === 0 && <p className="py-10 text-center text-soft">Nenhuma loja cadastrada ainda.</p>}
        </div>
      </div>

      <nav className="fixed inset-x-0 bottom-0 border-t border-line bg-surface px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-4">
        <div className="mx-auto grid max-w-md grid-cols-3 gap-3">
          <Link href="/admin/admins" className="flex items-center justify-center gap-2 rounded-2xl border-2 border-brand bg-surface py-4 text-base font-bold text-brand"><ShieldCheck size={20} strokeWidth={2.5} /> Admins</Link>
          <Link href="/admin/importar" className="flex items-center justify-center gap-2 rounded-2xl border-2 border-brand bg-surface py-4 text-base font-bold text-brand"><Upload size={20} strokeWidth={2.5} /> Importar</Link>
          <Link href="/admin/novo" className="flex items-center justify-center gap-2 rounded-2xl bg-brand py-4 text-base font-bold text-white"><Plus size={22} /> Novo</Link>
        </div>
        <div className="mx-auto mt-3 max-w-md">
          <Link href="/admin/diagnostico" className="block text-center text-sm font-semibold text-soft underline">
            Diagnóstico do login
          </Link>
        </div>
      </nav>
    </main>
  );
}
