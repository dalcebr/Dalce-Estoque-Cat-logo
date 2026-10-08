import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import AdminLoginForm from "./AdminLoginForm";

export const dynamic = "force-dynamic";

/**
 * Tela de login EXCLUSIVA do painel de administração.
 * Não tem relação com o login da loja (`/login`): aqui só entram contas
 * com papel `admin` e o destino é sempre `/admin`.
 */
export default function AdminLoginPage() {
  return (
    <main className="relative flex min-h-dvh flex-col items-center justify-center bg-page px-6">
      <div className="w-full max-w-sm text-center">
        <span className="mx-auto grid size-20 place-items-center rounded-3xl bg-navy/10 text-navy">
          <ShieldCheck size={40} />
        </span>
        <p className="mt-5 text-xs font-bold uppercase tracking-[0.2em] text-brand">Dalce · Administração</p>
        <h1 className="mt-1 text-3xl font-extrabold text-ink">Painel de acessos</h1>
        <p className="mt-2 text-soft">Entre com um usuário administrador</p>

        <AdminLoginForm />

        <p className="mt-6 text-sm text-soft">
          É uma loja?{" "}
          <Link href="/login" className="font-bold text-brand underline">
            Entrar no sistema
          </Link>
        </p>
      </div>
    </main>
  );
}
