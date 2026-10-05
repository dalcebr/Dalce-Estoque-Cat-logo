"use server";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
export async function signIn(_: { error?: string } | undefined, fd: FormData) {
  const user = String(fd.get("usuario") ?? "").trim().toLowerCase();
  const password = String(fd.get("senha") ?? "");
  if (!user || !password) return { error: "Informe usuário e senha." };
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email: `${user}@dalce.app`, password });
  if (error) return { error: "Usuário ou senha inválidos." };
  redirect("/");
}
export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
