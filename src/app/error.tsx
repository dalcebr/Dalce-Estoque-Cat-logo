"use client";

import { useEffect } from "react";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="flex min-h-dvh items-center justify-center bg-page px-5">
      <div className="w-full max-w-md text-center">
        <div className="mx-auto grid size-20 place-items-center rounded-2xl bg-tint">
          <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-brand">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        </div>
        <h1 className="mt-5 text-3xl font-extrabold text-ink">Algo deu errado</h1>
        <p className="mt-2 text-soft">
          Ocorreu um erro inesperado. Tente novamente ou volte para a tela inicial.
        </p>
        <button
          onClick={() => reset()}
          className="mt-6 inline-flex h-12 items-center justify-center rounded-2xl bg-brand px-8 text-base font-bold text-white shadow-sm active:opacity-90"
        >
          Tentar novamente
        </button>
      </div>
    </main>
  );
}
