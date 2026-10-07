"use client";
import { useActionState } from "react";
import { signIn } from "./actions";

const field =
  "w-full rounded-2xl border border-line bg-surface px-4 py-3.5 text-lg outline-none focus:border-brand";

export default function LoginForm() {
  const [state, action, pending] = useActionState(signIn, undefined);
  return (
    <form action={action} className="mt-8 w-full space-y-3">
      <input name="usuario" placeholder="E-mail ou usuário" autoComplete="username" autoCapitalize="none" className={field} />
      <input name="senha" type="password" placeholder="Senha" autoComplete="current-password" className={field} />
      {state?.error && <p role="alert" className="rounded-2xl bg-red-100 px-4 py-3 text-sm font-semibold text-red-700">{state.error}</p>}
      <button disabled={pending} className="w-full rounded-2xl bg-brand py-4 text-lg font-bold text-white disabled:opacity-60">
        {pending ? "Entrando..." : "Entrar"}
      </button>
    </form>
  );
}
