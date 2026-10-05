"use client";
import { useActionState } from "react";
import { signIn } from "./actions";
const field = "w-full rounded-lg border border-brand bg-white px-4 py-3 text-brand placeholder:text-brand/50 outline-none focus:ring-2 focus:ring-brand/40";
export default function LoginForm() {
  const [state, action, pending] = useActionState(signIn, undefined);
  return (
    <form action={action} className="mt-8 w-full space-y-3">
      <input name="usuario" placeholder="Usuário" autoComplete="username" autoCapitalize="none" className={field} />
      <input name="senha" type="password" placeholder="Senha" autoComplete="current-password" className={field} />
      {state?.error && <p role="alert" className="text-sm text-red-600">{state.error}</p>}
      <button disabled={pending} className="w-full rounded-lg bg-brand py-3 font-semibold text-white disabled:opacity-60">
        {pending ? "Entrando..." : "Entrar"}
      </button>
    </form>
  );
}
