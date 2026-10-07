"use server";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { clientIp, rateLimit } from "@/lib/rate-limit";

export type RecoverState = { error?: string; ok?: string } | undefined;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Envia o e-mail de redefinição de senha. */
export async function requestReset(_: RecoverState, fd: FormData): Promise<RecoverState> {
  const email = String(fd.get("email") ?? "").trim().toLowerCase();
  if (!EMAIL_RE.test(email)) return { error: "Informe um e-mail válido." };

  // 3 pedidos por IP a cada 15 minutos
  const ip = clientIp(await headers());
  const rl = rateLimit(`reset:${ip}`, 3, 15 * 60_000);
  if (!rl.ok) return { error: `Muitas tentativas. Tente novamente em ${Math.ceil(rl.retryAfter / 60)} min.` };

  const supabase = await createClient();
  const origin = (await headers()).get("origin") ?? process.env.NEXT_PUBLIC_APP_URL ?? "";
  await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/redefinir-senha`,
  });

  // resposta genérica de propósito: não revela se o e-mail existe na base
  return { ok: "Se existir uma conta com esse e-mail, enviamos um link para redefinir a senha." };
}

/** Define a nova senha (o usuário chega aqui pelo link do e-mail). */
export async function updatePassword(_: RecoverState, fd: FormData): Promise<RecoverState> {
  const password = String(fd.get("senha") ?? "");
  const confirm = String(fd.get("senha2") ?? "");
  if (password.length < 6) return { error: "A senha precisa ter pelo menos 6 caracteres." };
  if (password !== confirm) return { error: "As senhas não conferem." };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Link expirado ou inválido. Solicite um novo." };

  const { error } = await supabase.auth.updateUser({ password });
  if (error) return { error: "Não foi possível alterar a senha. Solicite um novo link." };

  return { ok: "Senha alterada com sucesso! Você já pode entrar com a nova senha." };
}
