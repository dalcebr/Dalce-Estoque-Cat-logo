"use client";
import { useActionState } from "react";
import Link from "next/link";
import { signUp } from "./actions";

const field =
  "w-full rounded-2xl border border-line bg-surface px-4 py-3.5 text-lg outline-none focus:border-brand";
const L = ({ t }: { t: string }) => (
  <span className="mb-1 block px-1 text-xs font-bold uppercase tracking-[0.15em] text-soft">{t}</span>
);

export default function SignUpForm() {
  const [state, action, pending] = useActionState(signUp, undefined);
  return (
    <form action={action} className="mt-6 space-y-3">
      <label className="block"><L t="Nome da loja" />
        <input name="loja" required maxLength={80} placeholder="Ex.: Doceria da Ana" className={field} /></label>
      <label className="block"><L t="Seu nome" />
        <input name="nome" required maxLength={80} placeholder="Ex.: Ana Souza" className={field} /></label>
      <label className="block"><L t="E-mail" />
        <input name="email" type="email" required autoCapitalize="none" autoComplete="email" placeholder="voce@email.com" className={field} /></label>
      <div className="grid grid-cols-2 gap-3">
        <label className="block"><L t="Senha" />
          <input name="senha" type="password" required minLength={6} autoComplete="new-password" className={field} /></label>
        <label className="block"><L t="Repetir senha" />
          <input name="senha2" type="password" required minLength={6} autoComplete="new-password" className={field} /></label>
      </div>
      {state?.error && <p role="alert" className="rounded-2xl bg-red-100 px-4 py-3 text-sm font-semibold text-red-700">{state.error}</p>}
      <button disabled={pending} className="w-full rounded-2xl bg-brand py-4 text-lg font-bold text-white disabled:opacity-60">
        {pending ? "Criando sua loja..." : "Criar minha loja grátis"}
      </button>
      <p className="px-1 text-center text-sm text-soft">
        Já tem conta? <Link href="/login" className="font-bold text-brand">Entrar</Link>
      </p>
    </form>
  );
}
