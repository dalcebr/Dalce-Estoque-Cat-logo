"use client";
import { useState } from "react";
import Link from "next/link";
import { ChevronRight, Plus, Search, SlidersHorizontal } from "lucide-react";

export type Left = { k: "chip"; t: string; bg?: string; fg?: string } | { k: "img"; src: string } | { k: "avatar"; t: string; bg: string };
export type CadRow = { id: string; href: string; title: string; sub?: string; search: string; group?: string | null; n?: number; left: Left; right?: { t: string; s?: string; warn?: boolean } };
type Props = { rows: CadRow[]; placeholder: string; addLabel: string; addHref: string; empty: string; chips?: string[]; sortable?: boolean };
const SORTS = [["name", "Nome A–Z"], ["asc", "Menor preço"], ["desc", "Maior preço"]] as const;

export default function CadList({ rows, placeholder, addLabel, addHref, empty, chips, sortable }: Props) {
  const [q, setQ] = useState("");
  const [g, setG] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [sort, setSort] = useState<"name" | "asc" | "desc">("name");
  const list = rows.filter((r) => (!g || r.group === g) && r.search.toLowerCase().includes(q.toLowerCase()));
  if (sort !== "name") list.sort((a, b) => (sort === "asc" ? 1 : -1) * ((a.n ?? 0) - (b.n ?? 0)));
  const chip = (k: string | null, l: string) => <button key={l} onClick={() => setG(k)} className={`shrink-0 rounded-2xl px-6 py-3 text-lg font-semibold ${g === k ? "bg-brand text-white" : "border border-line bg-surface"}`}>{l}</button>;
  return (
    <>
      <div className="mt-5 flex items-center gap-3 rounded-3xl border border-line bg-surface py-2.5 pl-5 pr-2.5 text-soft">
        <Search size={22} className="shrink-0" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={placeholder} className="min-w-0 flex-1 bg-transparent py-1.5 text-lg text-ink outline-none placeholder:text-soft" />
        {sortable && <button onClick={() => setOpen(!open)} aria-label="Ordenar" className="grid size-12 shrink-0 place-items-center rounded-2xl bg-page text-brand"><SlidersHorizontal size={22} /></button>}
      </div>
      {sortable && open && <div className="mt-3 flex gap-2 overflow-x-auto">{SORTS.map(([k, l]) => <button key={k} onClick={() => setSort(k)} className={`shrink-0 rounded-full px-4 py-2 font-semibold ${sort === k ? "bg-tint text-brand" : "border border-line bg-surface text-soft"}`}>{l}</button>)}</div>}
      {chips && chips.length > 0 && <div className="mt-4 flex gap-2 overflow-x-auto">{chip(null, "Todas")}{chips.map((c) => chip(c, c))}</div>}
      <div className="mt-4 space-y-3">
        {list.map((r) => (
          <Link key={r.id} href={r.href} className="flex items-center gap-4 rounded-3xl border border-line bg-surface p-4">
            {r.left.k === "img" ? <img src={r.left.src} alt="" className="size-14 shrink-0 rounded-2xl bg-page object-cover" />
              : r.left.k === "avatar" ? <span className="grid size-14 shrink-0 place-items-center rounded-full text-xl font-extrabold text-white" style={{ background: r.left.bg }}>{r.left.t}</span>
              : <span className="grid size-14 shrink-0 place-items-center rounded-2xl bg-line text-xl font-extrabold text-ink" style={r.left.bg ? { background: r.left.bg, color: r.left.fg } : undefined}>{r.left.t}</span>}
            <span className="min-w-0 flex-1 leading-tight"><b className="block truncate text-xl font-extrabold">{r.title}</b>{r.sub && <span className="block truncate text-soft">{r.sub}</span>}</span>
            {r.right && <span className="shrink-0 text-right leading-tight"><b className={`block text-xl font-extrabold ${r.right.warn ? "text-amber-700" : ""}`}>{r.right.t}</b>{r.right.s && <span className="text-sm text-soft">{r.right.s}</span>}</span>}
            <ChevronRight size={20} className="shrink-0 text-soft/70" />
          </Link>))}
        {list.length === 0 && <p className="py-10 text-center text-soft">{empty}</p>}
      </div>
      <div className="fixed inset-x-0 bottom-0 bg-gradient-to-t from-page via-page to-transparent px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-6">
        <Link href={addHref} className="mx-auto flex w-full max-w-md items-center justify-center gap-2 rounded-[28px] bg-brand py-5 text-xl font-extrabold text-white shadow-lg"><Plus size={24} /> {addLabel}</Link>
      </div>
    </>
  );
}
