"use client";
import { useActionState } from "react";
import { requestReset } from "./actions";

const field = "w-full rounded-2xl border border-line bg-surface px-4 py-3.5 text-lg outline-none focus:border-brand";

export default function RecoverForm() {
  const [state, action, pending] = useActionState(requestReset, undefined);
  return (
    <form action={action} className="mt-8 w-full space-y-3">
      <input name="email" type="email" required autoCapitalize="none" autoComplete="email" placeholder="Seu e-mail" className={field} />
      {state?.error && <p role="alert" className="rounded-2xl bg-red-100 px-4 py-3 text-sm font-semibold text-red-700">{state.error}</p>}
      {state?.ok && <p role="status" className="rounded-2xl bg-green-100 px-4 py-3 text-sm font-semibold text-green-700">{state.ok}</p>}
      <button disabled={pending} className="w-full rounded-2xl bg-brand py-4 text-lg font-bold text-white disabled:opacity-60">
        {pending ? "Enviando..." : "Enviar link de recuperação"}
      </button>
    </form>
  );
}
