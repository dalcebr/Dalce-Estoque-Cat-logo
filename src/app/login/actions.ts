"use server";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { sanitizeText } from "@/lib/validation";

export async function signIn(_: { error?: string } | undefined, fd: FormData) {
  const user = sanitizeText(String(fd.get("usuario") ?? ""), 60).toLowerCase();
  const password = String(fd.get("senha") ?? "");
  if (!user || !password || password.length > 128) return { error: "Informe usuário e senha." };
  // Prevent injection via the constructed email
  if (!/^[a-z0-9._-]+$/.test(user)) return { error: "Usuário inválido." };

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email: `${user}@dalce.app`, password });
  if (error || !data.user) return { error: "Usuário ou senha inválidos." };

  // Administradores vão direto para o painel de acessos (separado do sistema).
  // Usa a função `current_role_name()` (security definer) para não depender de RLS.
  // Fallback: se a função ainda não existir, lê direto de `profiles`.
  let role: string | null = null;
  const { data: rpcRole, error: rpcError } = await supabase.rpc("current_role_name");
  if (!rpcError) {
    role = rpcRole;
  } else {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", data.user.id)
      .maybeSingle();
    role = profile?.role ?? null;
  }
  redirect(role === "admin" ? "/admin" : "/");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
