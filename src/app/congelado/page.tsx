import { Lock } from "lucide-react";
import { signOut } from "@/app/login/actions";

export const dynamic = "force-dynamic";

export default function Congelado() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center bg-page px-6 text-center">
      <span className="grid size-20 place-items-center rounded-3xl bg-red-100 text-red-700"><Lock size={40} /></span>
      <h1 className="mt-6 text-3xl font-extrabold text-ink">Acesso congelado</h1>
      <p className="mt-3 max-w-sm text-muted">
        O acesso desta loja está temporariamente suspenso. Seus dados estão preservados.
        Entre em contato com o suporte para reativar.
      </p>
      <a href="mailto:suporte@dalce.app" className="mt-6 rounded-2xl bg-brand px-6 py-3.5 font-bold text-white">Falar com o suporte</a>
      <form action={signOut} className="mt-3">
        <button className="rounded-2xl border border-line px-6 py-3.5 font-bold text-ink">Sair</button>
      </form>
    </main>
  );
}
