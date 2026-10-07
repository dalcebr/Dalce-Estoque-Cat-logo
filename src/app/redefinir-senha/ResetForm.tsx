"use client";
import { useActionState } from "react";
import { updatePassword } from "../recuperar-senha/actions";

const field = "w-full rounded-2xl border border-line bg-surface px-4 py-3.5 text-lg outline-none focus:border-brand";

export default function ResetForm() {
  const [state, action, pending] = useActionState(updatePassword, undefined);
  return (
    <form action={action} className="mt-8 w-full space-y-3">
      <input name="senha" type="password" required minLength={6} autoComplete="new-password" placeholder="Nova senha" className={field} />
      <input name="senha2" type="password" required minLength={6} autoComplete="new-password" placeholder="Repetir a nova senha" className={field} />
      {state?.error && <p role="alert" className="rounded-2xl bg-red-100 px-4 py-3 text-sm font-semibold text-red-700">{state.error}</p>}
      {state?.ok && <p role="status" className="rounded-2xl bg-green-100 px-4 py-3 text-sm font-semibold text-green-700">{state.ok}</p>}
      <button disabled={pending} className="w-full rounded-2xl bg-brand py-4 text-lg font-bold text-white disabled:opacity-60">
        {pending ? "Salvando..." : "Salvar nova senha"}
      </button>
    </form>
  );
}
