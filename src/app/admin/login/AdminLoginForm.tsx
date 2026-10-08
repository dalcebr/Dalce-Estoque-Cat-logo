"use client";
import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { adminSignIn, type AdminSignInState } from "./actions";
import SubmitButton from "@/components/SubmitButton";

const field =
  "w-full rounded-2xl border border-line bg-surface px-4 py-3.5 text-lg text-ink outline-none placeholder:text-soft focus:border-brand";

export default function AdminLoginForm() {
  const router = useRouter();
  const [state, action] = useActionState<AdminSignInState | undefined, FormData>(
    adminSignIn,
    undefined,
  );

  // Redireciona no cliente depois que a sessão já foi gravada nos cookies.
  useEffect(() => {
    if (state?.redirectTo) {
      router.replace(state.redirectTo);
      router.refresh();
    }
  }, [state?.redirectTo, router]);

  return (
    <form action={action} className="mt-8 w-full space-y-3">
      <input
        name="usuario"
        placeholder="Usuário do administrador"
        autoComplete="username"
        autoCapitalize="none"
        autoCorrect="off"
        className={field}
      />
      <input
        name="senha"
        type="password"
        placeholder="Senha"
        autoComplete="current-password"
        className={field}
      />
      {state?.error && (
        <p role="alert" className="rounded-2xl border border-red-300 bg-red-100 px-4 py-3 text-sm font-semibold text-red-700">
          {state.error}
        </p>
      )}
      <SubmitButton className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-navy text-lg font-bold text-white shadow-sm transition-opacity disabled:opacity-60">
        Entrar no painel
      </SubmitButton>
    </form>
  );
}
