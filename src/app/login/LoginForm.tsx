"use client";
import { useActionState } from "react";
import { signIn } from "./actions";
import SubmitButton from "@/components/SubmitButton";
const field = "w-full rounded-lg border border-brand bg-surface px-4 py-3 text-brand placeholder:text-brand/50 outline-none focus:ring-2 focus:ring-brand/40";
export default function LoginForm() {
  const [state, action] = useActionState(signIn, undefined);
  return (
    <form action={action} className="mt-8 w-full space-y-3">
      <input name="usuario" placeholder="Usuário" autoComplete="username" autoCapitalize="none" className={field} />
      <input name="senha" type="password" placeholder="Senha" autoComplete="current-password" className={field} />
      {state?.error && <p role="alert" className="text-sm text-red-600">{state.error}</p>}
      <SubmitButton className="flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-brand font-semibold text-white shadow-sm transition-opacity disabled:opacity-60">
        Entrar
      </SubmitButton>
    </form>
  );
}
