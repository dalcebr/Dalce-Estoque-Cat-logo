import { createClient } from "@/lib/supabase/server";
import { adminConfigured } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

/**
 * Página de diagnóstico do login de administrador.
 * Mostra exatamente o que o servidor enxerga: usuário autenticado, papel
 * retornado pela função `current_role_name()`, leitura direta de `profiles`
 * e se a service role key está configurada.
 *
 * Acesse em /admin/diagnostico (logado). Não altera nada no banco.
 */
export default async function DiagnosticoPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const rpc = await supabase.rpc("current_role_name");
  const profile = user
    ? await supabase.from("profiles").select("id, name, username, role, store_id").eq("id", user.id).maybeSingle()
    : { data: null, error: null };

  const rows: { label: string; value: string; ok?: boolean }[] = [
    { label: "Usuário autenticado", value: user ? `${user.email} (${user.id})` : "NÃO autenticado", ok: Boolean(user) },
    {
      label: "current_role_name() (RPC)",
      value: rpc.error ? `ERRO: ${rpc.error.message}` : String(rpc.data),
      ok: !rpc.error && rpc.data === "admin",
    },
    {
      label: "profiles.role (select direto)",
      value: profile.error ? `ERRO: ${profile.error.message}` : String(profile.data?.role ?? "sem perfil"),
      ok: profile.data?.role === "admin",
    },
    { label: "profiles.store_id", value: String(profile.data?.store_id ?? "—") },
    { label: "SUPABASE_SERVICE_ROLE_KEY", value: adminConfigured() ? "configurada" : "AUSENTE", ok: adminConfigured() },
  ];

  return (
    <main className="mx-auto max-w-md px-5 py-6">
      <h1 className="text-2xl font-extrabold">Diagnóstico do login</h1>
      <p className="mt-1 text-sm text-soft">
        Se “current_role_name()” ou “profiles.role” não mostrar <b>admin</b>, o redirecionamento não acontece.
      </p>

      <div className="mt-5 space-y-3">
        {rows.map((r) => (
          <div key={r.label} className="rounded-2xl border border-line bg-surface px-4 py-3">
            <p className="text-xs font-bold uppercase tracking-wide text-soft">{r.label}</p>
            <p className={`mt-1 break-words font-mono text-sm ${r.ok === false ? "text-red-600" : r.ok ? "text-green-700" : "text-ink"}`}>
              {r.value}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-6 rounded-2xl border border-line bg-tint px-4 py-3 text-sm text-soft">
        <b className="text-ink">Como corrigir</b>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          <li>Se a RPC der erro “function does not exist”: rode <code>supabase/023_admin_role_helper.sql</code> no SQL Editor.</li>
          <li>Se “profiles.role” vier “sem perfil”: seu usuário não tem linha em <code>profiles</code>. Rode o <code>021_promote_admin.sql</code>.</li>
          <li>Se vier <code>owner</code> em vez de <code>admin</code>: rode o <code>update</code> do <code>021_promote_admin.sql</code>.</li>
        </ul>
      </div>
    </main>
  );
}
