"use client";
import { useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Eye, EyeOff, Search } from "lucide-react";
import { brl } from "@/lib/format";

export type FiadoRow = { name: string; balance: number; since: string };
const COLORS = ["#15803d", "#1d4ed8", "#0e7490", "#be123c", "#b45309", "#4d7c0f"];
const color = (n: string) => COLORS[[...n].reduce((h, c) => h + c.charCodeAt(0), 0) % COLORS.length];

export default function FiadoView({ rows }: { rows: FiadoRow[] }) {
  const [q, setQ] = useState("");
  const [f, setF] = useState<"all" | "debit" | "credit">("all");
  const [hide, setHide] = useState(false);
  const money = (v: number) => (hide ? "R$ ••••" : brl(v));
  const debit = rows.filter((r) => r.balance > 0), credit = rows.filter((r) => r.balance < 0);
  const list = rows.filter((r) => (f === "all" || (f === "debit" ? r.balance > 0 : r.balance < 0)) && r.name.toLowerCase().includes(q.toLowerCase()));
  const open = debit.reduce((s, r) => s + r.balance, 0);
  const chip = (k: "all" | "debit" | "credit", l: string, n: number) => (
    <button key={k} onClick={() => setF(k)} className={`shrink-0 rounded-2xl px-5 py-3 text-lg font-semibold ${f === k ? "bg-brand text-white" : "border border-line bg-surface"}`}>{l} · {n}</button>);
  return (
    <main className="min-h-dvh bg-page pb-40">
      <div className="h-[3px] bg-gradient-to-r from-brand via-blue-400 to-transparent" />
      <div className="mx-auto max-w-md px-5 pt-5">
        <header className="flex items-center gap-4">
          <Link href="/" aria-label="Voltar" className="grid size-12 shrink-0 place-items-center rounded-2xl border border-line bg-surface shadow-sm"><ChevronLeft size={24} strokeWidth={2.5} /></Link>
          <div className="flex-1 leading-tight"><p className="text-xs font-bold uppercase tracking-[0.18em] text-brand">Operação · Fiado</p><h1 className="text-3xl font-extrabold">Fiado dos clientes</h1></div>
          <button onClick={() => setHide(!hide)} aria-label={hide ? "Mostrar valores" : "Ocultar valores"} className="grid size-12 shrink-0 place-items-center rounded-2xl border border-line bg-surface text-brand shadow-sm">{hide ? <EyeOff size={22} /> : <Eye size={22} />}</button>
        </header>
        <label className="mt-6 flex items-center gap-3 rounded-3xl border border-line bg-surface px-5 py-4 text-soft"><Search size={22} /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar por nome" className="w-full bg-transparent text-lg text-ink outline-none placeholder:text-soft" /></label>
        <div className="mt-4 flex gap-2 overflow-x-auto">{chip("all", "Todos", rows.length)}{chip("debit", "Débito", debit.length)}{chip("credit", "Crédito", credit.length)}</div>
        <section className="mt-4 overflow-hidden rounded-3xl border border-line bg-surface">
          <div className="flex items-center justify-between border-b border-line bg-page px-5 py-4">
            <span className="text-xs font-bold uppercase tracking-[0.15em] text-soft">Clientes</span>
            <span className="rounded-full bg-tint px-3.5 py-1.5 text-sm font-bold text-brand">{list.length} {list.length === 1 ? "cliente" : "clientes"}</span>
          </div>
          {list.length === 0 && <p className="px-5 py-8 text-center text-soft">Nenhum cliente com fiado em aberto.</p>}
          <div className="divide-y divide-line">
            {list.map((r) => (
              <Link key={r.name} href={`/fiado/${encodeURIComponent(r.name)}`} className="block px-5 py-4">
                <div className="flex items-center gap-4"><span className="grid size-12 shrink-0 place-items-center rounded-full text-lg font-extrabold text-white" style={{ background: color(r.name) }}>{r.name[0]?.toUpperCase()}</span><b className="flex-1 truncate text-xl font-extrabold">{r.name}</b><ChevronRight size={20} className="text-soft/70" /></div>
                <div className="mt-2 flex items-center justify-between"><span className="text-xs font-bold uppercase tracking-[0.12em] text-soft">Aberto desde {r.since}</span>
                  <b className={`text-2xl font-extrabold ${r.balance > 0 ? "text-red-700" : "text-green-700"}`}>{r.balance > 0 && !hide ? "-" : ""}{money(Math.abs(r.balance))}</b></div>
              </Link>))}
          </div>
        </section>
      </div>
      <footer className="fixed inset-x-0 bottom-0 bg-brand px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-5 text-white">
        <div className="mx-auto max-w-md"><p className="text-xs font-bold uppercase tracking-[0.15em] opacity-80">Em aberto</p>
          <div className="mt-1 flex items-end justify-between"><span className="text-3xl font-extrabold">{money(open)}</span><span className="text-lg font-semibold opacity-90">{debit.length} {debit.length === 1 ? "devedor" : "devedores"}</span></div></div>
      </footer>
    </main>
  );
}
