"use server";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { clientIp, rateLimit } from "@/lib/rate-limit";

export type SignUpState = { error?: string } | undefined;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function signUp(_: SignUpState, fd: FormData): Promise<SignUpState> {
  const storeName = String(fd.get("loja") ?? "").trim().slice(0, 80);
  const userName = String(fd.get("nome") ?? "").trim().slice(0, 80);
  const email = String(fd.get("email") ?? "").trim().toLowerCase();
  const password = String(fd.get("senha") ?? "");
  const confirm = String(fd.get("senha2") ?? "");

  if (!storeName) return { error: "Informe o nome da sua loja." };
  if (!userName) return { error: "Informe seu nome." };
  if (!EMAIL_RE.test(email)) return { error: "Informe um e-mail válido." };
  if (password.length < 6) return { error: "A senha precisa ter pelo menos 6 caracteres." };
  if (password !== confirm) return { error: "As senhas não conferem." };

  // evita criação em massa de contas: 5 cadastros por IP a cada hora
  const ip = clientIp(await headers());
  const rl = rateLimit(`signup:${ip}`, 5, 60 * 60_000);
  if (!rl.ok) return { error: `Muitas tentativas. Tente novamente em ${Math.ceil(rl.retryAfter / 60)} min.` };

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) {
    const msg = /already|registered|exists/i.test(error.message)
      ? "Já existe uma conta com esse e-mail. Faça login."
      : "Não foi possível criar a conta. Tente novamente.";
    return { error: msg };
  }

  if (!data.session) {
    return { error: "Conta criada! Confirme o e-mail que enviamos e depois faça login." };
  }

  const { error: rpcError } = await supabase.rpc("create_store_for_user", {
    p_name: storeName,
    p_user_name: userName,
  });
  if (rpcError) {
    await supabase.auth.signOut();
    return { error: "Conta criada, mas não conseguimos montar sua loja. Fale com o suporte." };
  }

  redirect("/");
}
