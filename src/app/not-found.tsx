import Link from "next/link";
import { SearchX } from "lucide-react";

export default function NotFound() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center bg-page px-6 text-center">
      <span className="grid size-20 place-items-center rounded-3xl bg-tint text-brand"><SearchX size={40} /></span>
      <h1 className="mt-6 text-3xl font-extrabold">Página não encontrada</h1>
      <p className="mt-2 max-w-sm text-soft">O endereço que você abriu não existe ou foi movido.</p>
      <Link href="/" className="mt-6 w-full max-w-sm rounded-2xl bg-brand py-4 text-lg font-bold text-white">Voltar ao início</Link>
    </main>
  );
}
