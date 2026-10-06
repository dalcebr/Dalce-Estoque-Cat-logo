"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CalendarDays, ChevronLeft } from "lucide-react";
import { PRESETS, presetRange } from "@/lib/range";

export default function FiltersForm({ today, initialPreset, initialFrom, initialTo }: { today: string; initialPreset: string | null; initialFrom: string; initialTo: string }) {
  const router = useRouter();
  const [preset, setPreset] = useState<string | null>(initialPreset);
  const [from, setFrom] = useState(initialFrom);
  const [to, setTo] = useState(initialTo);
  const pick = (p: string) => { const r = presetRange(p, today); setPreset(p); setFrom(r.from); setTo(r.to); };
  const apply = () => router.push(preset ? `/relatorios?p=${preset}` : `/relatorios?de=${from}&ate=${to}`);
  const name = PRESETS.find(([k]) => k === preset)?.[1];

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col bg-page px-5 pb-28 pt-5">
      <header className="flex items-center gap-4">
        <Link href="/relatorios" aria-label="Voltar" className="grid size-12 shrink-0 place-items-center rounded-2xl border border-line bg-white shadow-sm"><ChevronLeft size={24} strokeWidth={2.5} /></Link>
        <div className="flex-1 leading-tight"><p className="text-xs font-bold uppercase tracking-[0.18em] text-brand">Relatórios · Filtros</p><h1 className="text-3xl font-extrabold">O que quer filtrar?</h1></div>
        <button onClick={() => pick("hoje")} className="px-2 text-lg font-bold text-brand">Limpar</button>
      </header>

      <h2 className="mb-3 mt-7 text-xs font-bold uppercase tracking-[0.18em] text-soft">Período</h2>
      <div className="grid grid-cols-2 gap-3">
        {PRESETS.map(([k, l]) => (
          <button key={k} onClick={() => pick(k)} className={`rounded-2xl border py-4 text-lg font-bold ${preset === k ? "border-brand bg-brand text-white" : "border-line bg-white"}`}>{l}</button>))}
      </div>
      <div className="mt-3 grid grid-cols-2 gap-3">
        {([["De", from, setFrom], ["Até", to, setTo]] as const).map(([l, v, set]) => (
          <label key={l} className="rounded-3xl border border-line bg-white p-4">
            <span className="text-xs font-bold uppercase tracking-[0.18em] text-soft">{l}</span>
            <span className="mt-1 flex items-center gap-2 text-brand"><CalendarDays size={20} className="shrink-0" />
              <input type="date" value={v} onChange={(e) => { set(e.target.value); setPreset(null); }} className="w-full min-w-0 bg-transparent font-bold text-ink outline-none" /></span>
          </label>))}
      </div>
      <p className="mt-3 text-soft">{preset ? `Preset ativo — as datas seguem ${name}` : "Período personalizado"}</p>

      <div className="fixed inset-x-0 bottom-0 border-t border-line bg-page px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-4">
        <button onClick={apply} disabled={!from || !to} className="mx-auto block w-full max-w-md rounded-[28px] bg-brand py-5 text-xl font-extrabold text-white shadow-lg disabled:opacity-45">Aplicar filtros</button>
      </div>
    </main>
  );
}
