import Link from "next/link";
import { ShieldCheck, UserPlus } from "lucide-react";
import { getAdminUserId, listAdmins } from "@/lib/admin";
import { adminConfigured } from "@/lib/supabase/admin";
import SubmitButton from "@/components/SubmitButton";
import { createAdmin } from "../actions";

export const dynamic = "force-dynamic";

const ERROS: Record<string, string> = {
  campos: "Informe o nome do administrador.",
  usuario: "Usuário inválido. Use 3 a 30 caracteres: letras minúsculas, números, ponto, hífen ou underline.",
  senha: "A senha deve ter entre 6 e 128 caracteres.",
};

const field = "w-full rounded-2xl border border-line bg-surface px-4 py-3.5 text-lg outline-none focus:border-brand";

export default async function AdminsPage({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string; erro?: string }>;
}) {
  const adminId = await getAdminUserId();
  if (!adminId) {
    return (
      <main className="mx-auto max-w-md px-5 py-10 text-center">
        <h1 className="text-2xl font-extrabold">Acesso restrito</h1>
        <p className="mt-2 text-soft">Sua conta não está marcada como administrador.</p>
        <Link href="/admin/diagnostico" className="mt-6 inline-flex rounded-2xl bg-brand px-5 py-3 font-bold text-white">
          Abrir diagnóstico
        </Link>
      </main>
    );
  }

  const { ok, erro } = await searchParams;
  const admins = await listAdmins();
  const configured = adminConfigured();
  const msg = erro ? (ERROS[erro] ?? decodeURIComponent(erro)) : null;

  return (
    <main className="mx-auto min-h-dvh max-w-md bg-page px-5 pb-32 pt-5">
      <div className="flex items-center gap-3">
        <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-navy/10 text-navy">
          <ShieldCheck size={22} />
        </span>
        <div className="leading-tight">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand">Administradores</p>
          <b className="block text-lg font-extrabold">Acessos ao painel</b>
        </div>
      </div>

      {!configured && (
        <p className="mt-5 rounded-2xl border border-amber-300 bg-amber-100 px-4 py-3 text-sm font-semibold text-amber-700">
          Configure a variável <code>SUPABASE_SERVICE_ROLE_KEY</code> para criar administradores.
        </p>
      )}
      {ok === "criado" && (
        <p className="mt-5 rounded-2xl border border-green-300 bg-green-100 px-4 py-3 text-sm font-semibold text-green-700">
          Administrador criado com sucesso.
        </p>
      )}
      {msg && (
        <p className="mt-5 rounded-2xl border border-red-300 bg-red-100 px-4 py-3 text-sm font-semibold text-red-700">{msg}</p>
      )}

      <section className="mt-6">
        <h2 className="px-1 text-xs font-bold uppercase tracking-[0.15em] text-soft">Administradores atuais</h2>
        <ul className="mt-2 space-y-2">
          {admins.map((a) => (
            <li key={a.id} className="flex items-center gap-3 rounded-2xl border border-line bg-surface px-4 py-3">
              <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-tint text-brand">
                <ShieldCheck size={18} />
              </span>
              <div className="min-w-0 leading-tight">
                <b className="block truncate">{a.name}</b>
                <span className="text-sm text-soft">{a.username ? `@${a.username}` : "—"}</span>
              </div>
              {a.id === adminId && (
                <span className="ml-auto rounded-full bg-brand/10 px-2.5 py-1 text-xs font-bold text-brand">você</span>
              )}
            </li>
          ))}
          {admins.length === 0 && <p className="py-6 text-center text-soft">Nenhum administrador cadastrado.</p>}
        </ul>
      </section>

      <section className="mt-8">
        <h2 className="flex items-center gap-2 px-1 text-xs font-bold uppercase tracking-[0.15em] text-soft">
          <UserPlus size={16} /> Novo administrador
        </h2>
        <form action={createAdmin} className="mt-3 space-y-3">
          <label className="block">
            <span className="mb-1 block px-1 text-xs font-bold uppercase tracking-[0.15em] text-soft">Nome</span>
            <input name="name" required maxLength={80} placeholder="Ex.: Dalce Admin" className={field} />
          </label>
          <label className="block">
            <span className="mb-1 block px-1 text-xs font-bold uppercase tracking-[0.15em] text-soft">Usuário de acesso</span>
            <input name="username" required autoCapitalize="none" autoCorrect="off" maxLength={30} placeholder="Ex.: dalce" className={field} />
            <span className="mt-1 block px-1 text-sm text-soft">O login será feito com este usuário (sem e-mail).</span>
          </label>
          <label className="block">
            <span className="mb-1 block px-1 text-xs font-bold uppercase tracking-[0.15em] text-soft">Senha</span>
            <input name="password" required minLength={6} maxLength={128} type="text" placeholder="Mínimo 6 caracteres" className={field} />
          </label>
          <div className="pt-2">
            <SubmitButton>Criar administrador</SubmitButton>
          </div>
        </form>
      </section>
    </main>
  );
}
