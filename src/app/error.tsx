"use client";
import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RotateCcw } from "lucide-react";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    // Em produção, troque por um serviço de monitoramento (Sentry, etc.)
    console.error("[app error]", error.digest ?? error.message);
  }, [error]);

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center bg-page px-6 text-center">
      <span className="grid size-20 place-items-center rounded-3xl bg-amber-100 text-amber-700"><AlertTriangle size={40} /></span>
      <h1 className="mt-6 text-3xl font-extrabold">Algo deu errado</h1>
      <p className="mt-2 max-w-sm text-soft">
        Não conseguimos carregar esta tela. Seus dados estão seguros — tente novamente.
      </p>
      <div className="mt-6 w-full max-w-sm space-y-3">
        <button onClick={reset} className="flex w-full items-center justify-center gap-2 rounded-2xl bg-brand py-4 text-lg font-bold text-white">
          <RotateCcw size={20} /> Tentar novamente
        </button>
        <Link href="/" className="block rounded-2xl border-2 border-brand py-4 text-lg font-bold text-brand">Voltar ao início</Link>
      </div>
    </main>
  );
}
