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
  const { error } = await supabase.auth.signInWithPassword({ email: `${user}@dalce.app`, password });
  if (error) return { error: "Usuário ou senha inválidos." };
  redirect("/");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
