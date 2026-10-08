import Link from "next/link";
import { LogOut, ShieldCheck } from "lucide-react";

export const dynamic = "force-dynamic";

/**
 * Layout exclusivo do painel de administração.
 * É totalmente separado do sistema de catálogo: não usa o menu da loja
 * e só é acessível por usuários com papel "admin".
 *
 * A tela de login do painel (`/admin/login`) tem layout próprio e não
 * passa por aqui.
 */
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh bg-page">
      <header className="sticky top-0 z-30 border-b border-line bg-surface/95 backdrop-blur">
        <div className="mx-auto flex max-w-md items-center gap-3 px-5 py-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-navy/10 text-navy">
            <ShieldCheck size={22} />
          </span>
          <div className="min-w-0 flex-1 leading-tight">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand">Dalce · Administração</p>
            <b className="block truncate text-lg font-extrabold">Painel de acessos</b>
          </div>
          <Link
            href="/admin/logout"
            prefetch={false}
            aria-label="Sair"
            className="flex items-center gap-2 rounded-2xl border border-line px-3 py-2 text-sm font-bold text-soft active:bg-page"
          >
            <LogOut size={18} /> Sair
          </Link>
        </div>
      </header>
      {children}
    </div>
  );
}
