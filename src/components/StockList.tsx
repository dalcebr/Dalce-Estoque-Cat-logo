"use client";
import { useState } from "react";
import Link from "next/link";
import { Pencil, ScanLine, Search } from "lucide-react";

export type StockRow = { id: string; name: string; price: string; stock: number; min: number };
const level = (r: StockRow) => (r.stock <= 0 ? "zero" : r.stock <= r.min ? "low" : "ok");
const initials = (n: string) => n.split(" ").filter(Boolean).slice(0, 2).map((w) => w[0]).join("").toUpperCase();
const CHIP = { zero: "bg-red-100 text-red-700", low: "bg-amber-100 text-amber-700", ok: "bg-tint text-brand" };
const NUM = { zero: "text-red-700", low: "text-amber-700", ok: "text-ink" };

export default function StockList({ rows }: { rows: StockRow[] }) {
  const [q, setQ] = useState("");
  const [f, setF] = useState<"all" | "low" | "zero">("all");
  const low = rows.filter((r) => level(r) === "low").length, zero = rows.filter((r) => level(r) === "zero").length;
  const list = rows.filter((r) => (f === "all" || level(r) === f) && r.name.toLowerCase().includes(q.toLowerCase()));
  const chip = (k: "all" | "low" | "zero", label: string, dot?: string, n?: number) => (
    <button key={k} onClick={() => setF(k)} className={`flex shrink-0 items-center gap-2 rounded-2xl px-5 py-3 text-lg font-semibold ${f === k ? "bg-brand text-white" : "border border-line bg-surface"}`}>
      {dot && <i className={`size-3 rounded-full ${dot}`} />}{label}{!!n && <span className="text-soft">{n}</span>}
    </button>);
  return (
    <>
      <div className="mt-5 flex gap-3">
        <label className="flex flex-1 items-center gap-3 rounded-3xl border border-line bg-surface px-5 py-4 text-soft"><Search size={22} /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Nome ou código de barras" className="w-full bg-transparent text-lg text-ink outline-none placeholder:text-soft" /></label>
        <span className="grid size-14 shrink-0 place-items-center rounded-3xl bg-tint text-brand"><ScanLine size={26} /></span>
      </div>
      <div className="mt-4 flex gap-2 overflow-x-auto">{chip("all", "Todos")}{chip("low", "Baixo", "bg-amber-600", low)}{chip("zero", "Zerado", "bg-red-600", zero)}</div>
      <section className="mt-4 overflow-hidden rounded-3xl border border-line bg-surface">
        <div className="flex items-center justify-between border-b border-line bg-page px-5 py-4">
          <span className="text-xs font-bold uppercase tracking-[0.15em] text-soft">Produtos em estoque</span>
          <span className="rounded-full bg-tint px-3.5 py-1.5 text-sm font-bold text-brand">{list.length} {list.length === 1 ? "produto" : "produtos"}</span>
        </div>
        {list.length === 0 && <p className="px-5 py-8 text-center text-soft">Nenhum produto encontrado.</p>}
        <div className="divide-y divide-line">
          {list.map((r) => (
            <div key={r.id} className="px-5 py-4">
              <div className="flex items-center gap-4">
                <span className={`grid size-14 shrink-0 place-items-center rounded-2xl text-xl font-extrabold ${CHIP[level(r)]}`}>{initials(r.name)}</span>
                <b className="flex-1 text-xl font-extrabold">{r.name}</b>
                <Link href={`/estoque/${r.id}`} aria-label={`Editar ${r.name}`} className="grid size-11 place-items-center rounded-xl bg-tint text-brand"><Pencil size={20} /></Link>
              </div>
              <div className="mt-2 flex items-end justify-between"><b className="text-soft">{r.price}</b><span><b className={`text-3xl font-extrabold ${NUM[level(r)]}`}>{r.stock}</b> <span className="text-sm font-bold text-soft">UN</span></span></div>
            </div>))}
        </div>
      </section>
    </>
  );
}
