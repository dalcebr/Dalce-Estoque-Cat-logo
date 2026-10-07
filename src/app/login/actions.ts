"use server";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { clientIp, rateLimit, rateLimitReset } from "@/lib/rate-limit";

export type LoginState = { error?: string } | undefined;

export async function signIn(_: LoginState, fd: FormData): Promise<LoginState> {
  const raw = String(fd.get("usuario") ?? "").trim().toLowerCase();
  const password = String(fd.get("senha") ?? "");
  if (!raw || !password) return { error: "Informe usuário e senha." };

  // proteção contra força bruta: 10 tentativas por IP a cada 5 minutos
  const ip = clientIp(await headers());
  const key = `login:${ip}`;
  const rl = rateLimit(key, 10, 5 * 60_000);
  if (!rl.ok) {
    return { error: `Muitas tentativas. Tente novamente em ${rl.retryAfter}s.` };
  }

  // aceita tanto o e-mail completo quanto o apelido antigo (usuario@dalce.app)
  const email = raw.includes("@") ? raw : `${raw}@dalce.app`;

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: "Usuário ou senha inválidos." };

  rateLimitReset(key);
  redirect("/");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
