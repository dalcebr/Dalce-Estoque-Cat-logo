"use client";
import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { Box, ChevronRight, DollarSign, FileText, FolderPlus, House, LogOut, Menu as MenuIcon, MessageCircle, Settings, ShoppingCart, Store, ShieldCheck, Sparkles, Moon, Sun, type LucideIcon } from "lucide-react";
import { signOut } from "@/app/login/actions";

type Item = { n: string; s?: string; href: string; Icon: LucideIcon; c: string; more?: boolean };

const OPERACAO: Item[] = [
  { n: "Início", s: "resumo do dia", href: "/", Icon: House, c: "bg-tint text-brand" },
  { n: "Venda", s: "balcão aberto", href: "/vendas/nova", Icon: ShoppingCart, c: "bg-tint text-brand" },
  { n: "Cadastros", href: "/cadastros", Icon: FolderPlus, c: "bg-teal-100 text-teal-700", more: true },
  { n: "Fiado", s: "contas a receber", href: "/fiado", Icon: DollarSign, c: "bg-amber-100 text-amber-700" },
  { n: "Estoque", href: "/estoque", Icon: Box, c: "bg-teal-100 text-teal-700", more: true },
  { n: "Relatórios", href: "/relatorios", Icon: FileText, c: "bg-rose-100 text-rose-700", more: true },
];
const SISTEMA: Item[] = [
  { n: "Catálogo online", href: "/catalogo", Icon: Store, c: "bg-slate-100 text-slate-600", more: true },
  { n: "Ajustes", href: "/ajustes", Icon: Settings, c: "bg-slate-100 text-slate-600", more: true },
];

export type MenuProps = {
  name: string;
  storeName: string;
  planName: string;
  planBadge: string;
  planClass: string;
  isSuperAdmin: boolean;
  supportEmail: string;
};

function Section({ title, items, close, children }: { title: string; items: Item[]; close: () => void; children?: ReactNode }) {
  return (
    <section className="px-4 pb-2 pt-5">
      <h2 className="mb-2 px-2 text-xs font-bold uppercase tracking-[0.18em] text-soft">{title}</h2>
      {items.map(({ n, s, href, Icon, c, more }) => (
        <Link key={n} href={href} onClick={close} className="flex items-center gap-4 rounded-2xl px-2 py-2.5 active:bg-page">
          <span className={`grid size-12 shrink-0 place-items-center rounded-2xl ${c}`}><Icon size={22} /></span>
          <span className="flex-1 leading-tight"><b className="block text-lg">{n}</b>{s && <span className="text-soft">{s}</span>}</span>
          {more && <ChevronRight size={20} className="text-soft/70" />}
        </Link>))}
      {children}
    </section>
  );
}

export default function Menu({ name, storeName, planName, planBadge, planClass, isSuperAdmin, supportEmail }: MenuProps) {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);
  const [dark, setDark] = useState(false);
  useEffect(() => setDark(document.documentElement.classList.contains("dark")), []);
  const toggle = () => {
    const d = !dark; setDark(d);
    document.documentElement.classList.toggle("dark", d);
    try { localStorage.setItem("theme", d ? "dark" : "light"); } catch {}
  };
  const initials = name.split(" ").filter(Boolean).slice(0, 2).map((w) => w[0]).join("").toUpperCase() || "U";

  useEffect(() => {
    const h = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, []);

  return (
    <>
      <button aria-label="Menu" aria-expanded={open} onClick={() => setOpen(true)} className="grid size-12 shrink-0 place-items-center rounded-2xl border border-line bg-surface text-ink shadow-sm"><MenuIcon size={24} strokeWidth={2.5} /></button>

      <div className={`fixed inset-0 z-40 ${open ? "" : "pointer-events-none"}`} aria-hidden={!open}>
        <div onClick={close} className={`absolute inset-0 bg-black/50 transition-opacity duration-200 ${open ? "opacity-100" : "opacity-0"}`} />
        <aside className={`absolute inset-y-0 left-0 flex w-[85%] max-w-sm flex-col bg-surface shadow-2xl transition-transform duration-200 ${open ? "translate-x-0" : "-translate-x-full"}`}>
          <div className="flex items-center gap-4 px-5 pb-6 pt-[max(1.75rem,env(safe-area-inset-top))] text-white" style={{ background: "linear-gradient(135deg,#14306e 0%,#2a5bd7 100%)" }}>
            <span className="grid size-14 shrink-0 place-items-center rounded-2xl bg-white/20 text-2xl font-extrabold">{initials[0]}</span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xl font-extrabold">{name}</p>
              <p className="truncate text-sm text-white/80">{storeName}</p>
              <Link href="/assinatura" onClick={close} className={`mt-1.5 inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold uppercase tracking-wider ${planClass}`}>
                <Sparkles size={12} /> {planBadge}
              </Link>
            </div>
            <ChevronRight size={22} />
          </div>

          <nav className="flex-1 overflow-y-auto">
            <Section title="Operação" items={OPERACAO} close={close} />
            <Section title="Sistema" items={SISTEMA} close={close}>
              {isSuperAdmin && (
                <Link href="/admin" onClick={close} className="flex items-center gap-4 rounded-2xl px-2 py-2.5 active:bg-page">
                  <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-indigo-100 text-indigo-700"><ShieldCheck size={22} /></span>
                  <span className="flex-1 leading-tight"><b className="block text-lg">Painel do dono</b><span className="text-soft">lojas, planos e métricas</span></span>
                  <ChevronRight size={20} className="text-soft/70" />
                </Link>
              )}
              <button role="switch" aria-checked={dark} onClick={toggle} className="flex w-full items-center gap-4 rounded-2xl px-2 py-2.5 text-left">
                <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-slate-100 text-slate-600">{dark ? <Moon size={22} /> : <Sun size={22} />}</span>
                <span className="flex-1 leading-tight"><b className="block text-lg">Modo escuro</b><span className="text-soft">{dark ? "ativado" : "desativado"}</span></span>
                <span className={`h-7 w-12 shrink-0 rounded-full p-0.5 transition-colors ${dark ? "bg-brand" : "bg-line"}`}><span className={`block size-6 rounded-full bg-white shadow transition-transform ${dark ? "translate-x-5" : ""}`} /></span>
              </button>
            </Section>
          </nav>

          <div className="border-t border-line">
            <div className="flex items-center gap-3 px-5 py-4">
              <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-tint text-lg font-extrabold text-brand">{initials}</span>
              <div className="min-w-0 flex-1 leading-tight"><b className="block truncate text-lg">{name}</b><span className="text-soft">{planName}</span></div>
              <form action={signOut}><button aria-label="Sair" className="grid size-11 place-items-center rounded-xl border border-line text-soft"><LogOut size={20} /></button></form>
            </div>
            <a href={`mailto:${supportEmail}`} className="flex items-center gap-4 bg-[#14306e] px-5 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] text-white">
              <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-white/15"><MessageCircle size={22} /></span>
              <span className="flex-1 leading-tight"><b className="block text-lg">Precisa de ajuda?</b><span className="text-white/80">Fale com nosso suporte</span></span>
              <ChevronRight size={22} />
            </a>
          </div>
        </aside>
      </div>
    </>
  );
}
