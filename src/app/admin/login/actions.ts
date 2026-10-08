"use server";
import { createClient } from "@/lib/supabase/server";
import { sanitizeText } from "@/lib/validation";

export type AdminSignInState = { error?: string; redirectTo?: string };

/**
 * Login EXCLUSIVO do painel de administração.
 *
 * É separado do login da loja (`/login`):
 * - só aceita usuários com `role = 'admin'`;
 * - se a conta for de loja, encerra a sessão e mostra um erro claro;
 * - nunca redireciona para o sistema da loja.
 *
 * Assim como no login da loja, NÃO usamos `redirect()` aqui: em Server Actions
 * o `redirect()` pode descartar os cookies de sessão definidos na mesma
 * requisição, fazendo o middleware enxergar o usuário como deslogado na
 * navegação seguinte. Retornamos o destino e o cliente redireciona.
 */
export async function adminSignIn(
  _: AdminSignInState | undefined,
  fd: FormData,
): Promise<AdminSignInState> {
  const user = sanitizeText(String(fd.get("usuario") ?? ""), 60).toLowerCase();
  const password = String(fd.get("senha") ?? "");
  if (!user || !password || password.length > 128) return { error: "Informe usuário e senha." };
  // Evita injeção no e-mail sintético construído abaixo.
  if (!/^[a-z0-9._-]+$/.test(user)) return { error: "Usuário inválido." };

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email: `${user}@dalce.app`,
    password,
  });
  if (error || !data.user) return { error: "Usuário ou senha inválidos." };

  // Papel via função security definer (não depende de RLS).
  // Fallback: leitura direta de `profiles` caso a função ainda não exista.
  let role: string | null = null;
  let rpcFailed = false;
  const { data: rpcRole, error: rpcError } = await supabase.rpc("current_role_name");
  if (!rpcError) {
    role = rpcRole;
  } else {
    rpcFailed = true;
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", data.user.id)
      .maybeSingle();
    role = profile?.role ?? null;
  }

  if (role !== "admin") {
    // Conta de loja não entra no painel: encerra a sessão criada agora.
    await supabase.auth.signOut();
    // Mensagem detalhada para facilitar o diagnóstico.
    if (role === null) {
      return {
        error: rpcFailed
          ? "Login ok, mas não foi possível ler seu papel (perfil ausente ou função current_role_name() não existe). Rode supabase/023_admin_role_helper.sql e supabase/021_promote_admin.sql."
          : "Login ok, mas seu perfil não tem papel definido. Rode supabase/021_promote_admin.sql para promover esta conta a admin.",
      };
    }
    return {
      error: `Esta conta não é de administrador (papel atual: "${role}"). Rode supabase/021_promote_admin.sql para promovê-la a admin.`,
    };
  }

  return { redirectTo: "/admin" };
}
