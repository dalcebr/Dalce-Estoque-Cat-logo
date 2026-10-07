import Link from "next/link";
import ResetForm from "./ResetForm";

export const metadata = { title: "Nova senha", robots: { index: false, follow: false } };

export default function RedefinirSenhaPage() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center bg-page px-6">
      <div className="w-full max-w-sm text-center">
        <h1 className="text-3xl font-extrabold text-ink">Criar nova senha</h1>
        <p className="mt-2 text-soft">Escolha uma senha nova para acessar sua loja.</p>
        <ResetForm />
        <p className="mt-6 text-sm text-soft">
          <Link href="/login" className="font-bold text-brand">Voltar para o login</Link>
        </p>
      </div>
    </main>
  );
}
