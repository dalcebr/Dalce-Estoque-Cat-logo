"use server";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type LoginState = { error?: string } | undefined;

export async function signIn(_: LoginState, fd: FormData): Promise<LoginState> {
  const raw = String(fd.get("usuario") ?? "").trim().toLowerCase();
  const password = String(fd.get("senha") ?? "");
  if (!raw || !password) return { error: "Informe usuário e senha." };

  // aceita tanto o e-mail completo quanto o apelido antigo (usuario@dalce.app)
  const email = raw.includes("@") ? raw : `${raw}@dalce.app`;

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: "Usuário ou senha inválidos." };
  redirect("/");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
