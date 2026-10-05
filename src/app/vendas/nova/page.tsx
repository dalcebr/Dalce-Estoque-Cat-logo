import Link from "next/link";
export default function Page() {
  return (
    <main className="mx-auto min-h-dvh max-w-md px-5 pt-8">
      <Link href="/" className="text-sm font-medium text-brand">← Início</Link>
      <h1 className="mt-4 text-2xl font-bold">Nova venda</h1>
      <p className="mt-2 text-muted">Em construção — próxima etapa.</p>
    </main>
  );
}
