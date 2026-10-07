import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-page px-5">
      <div className="w-full max-w-md text-center">
        <div className="mx-auto grid size-20 place-items-center rounded-2xl bg-tint">
          <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-brand">
            <circle cx="12" cy="12" r="10" />
            <path d="M16 16s-1.5-2-4-2-4 2-4 2" />
            <line x1="9" y1="9" x2="9.01" y2="9" />
            <line x1="15" y1="9" x2="15.01" y2="9" />
          </svg>
        </div>
        <p className="mt-5 text-6xl font-extrabold text-brand">404</p>
        <h1 className="mt-2 text-3xl font-extrabold text-ink">Pagina nao encontrada</h1>
        <p className="mt-2 text-soft">
          A pagina que voce procura nao existe ou foi movida.
        </p>
        <Link
          href="/"
          className="mt-6 inline-flex h-12 items-center justify-center rounded-2xl bg-brand px-8 text-base font-bold text-white shadow-sm active:opacity-90"
        >
          Voltar ao inicio
        </Link>
      </div>
    </main>
  );
}
