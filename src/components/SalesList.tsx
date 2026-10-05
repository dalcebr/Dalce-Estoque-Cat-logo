"use client";
import { useState } from "react";
import Link from "next/link";
import { ReceiptText, Search } from "lucide-react";

export type Row = { id: string; code: string; time: string; customer: string | null; items: number; total: string; biggest: boolean; cancelled: boolean };

export default function SalesList({ rows, dayLabel }: { rows: Row[]; dayLabel: string }) {
  const [q, setQ] = useState("");
  const list = rows.filter((r) => !q || (r.customer ?? "").toLowerCase().includes(q.toLowerCase()));
  return (
    <>
      <label className="mt-6 flex items-center gap-3 rounded-3xl border border-line bg-white px-5 py-4 text-soft">
        <Search size={22} />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar por cliente" className="w-full bg-transparent text-lg text-ink outline-none placeholder:text-soft" />
      </label>
      <section className="mt-5 overflow-hidden rounded-3xl border border-line bg-white">
        <div className="flex items-center justify-between border-b border-line bg-[#f6f8fd] px-6 py-4">
          <span className="text-sm font-bold uppercase tracking-[0.15em] text-soft">Vendas · {dayLabel}</span>
          <span className="rounded-full bg-tint px-3.5 py-1.5 text-sm font-bold text-brand">{list.length} {list.length === 1 ? "venda" : "vendas"}</span>
        </div>
        {list.length === 0 && <p className="px-6 py-8 text-center text-soft">Nenhuma venda encontrada.</p>}
        <div className="divide-y divide-line">
          {list.map((r) => (
            <Link key={r.id} href={`/vendas/${r.id}`} className={`block px-6 py-4 ${r.cancelled ? "opacity-50" : ""}`}>
              <div className="flex justify-between text-lg font-extrabold text-soft"><span>{r.code}</span><span>{r.time}</span></div>
              <div className="mt-2 flex items-center gap-4">
                <span className="grid size-14 shrink-0 place-items-center rounded-full border-2 border-brand text-brand"><ReceiptText size={26} /></span>
                <span className="flex-1 text-xl font-semibold text-[#8c8fa3]">{r.customer ?? "Sem cliente"}</span>
                {r.cancelled ? <span className="rounded-full bg-red-100 px-3 py-1 text-sm font-bold uppercase text-red-700">Cancelada</span>
                  : r.biggest && <span className="rounded-full bg-green-100 px-3 py-1 text-sm font-bold uppercase text-green-700">Maior venda</span>}
              </div>
              <div className="mt-2 flex items-center gap-4">
                <span className="text-sm font-bold uppercase tracking-wider text-soft">{r.items} {r.items === 1 ? "item" : "itens"}</span>
                <span className="h-1.5 flex-1 rounded-full bg-brand" />
                <span className="text-3xl font-extrabold tracking-tight">{r.total}</span>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}
