import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import RecoverForm from "./RecoverForm";

export const metadata = { title: "Recuperar senha", robots: { index: false, follow: false } };

export default function RecuperarSenhaPage() {
  return (
    <main className="relative flex min-h-dvh flex-col items-center justify-center bg-page px-6">
      <Link href="/login" aria-label="Voltar" className="absolute left-5 top-[max(1.25rem,env(safe-area-inset-top))] grid size-12 place-items-center rounded-2xl border border-line bg-surface shadow-sm">
        <ChevronLeft size={24} strokeWidth={2.5} />
      </Link>
      <div className="w-full max-w-sm text-center">
        <h1 className="text-3xl font-extrabold text-ink">Esqueceu a senha?</h1>
        <p className="mt-2 text-soft">Informe seu e-mail e enviaremos um link para criar uma nova senha.</p>
        <RecoverForm />
        <p className="mt-6 text-sm text-soft">
          Lembrou a senha? <Link href="/login" className="font-bold text-brand">Entrar</Link>
        </p>
      </div>
    </main>
  );
}
