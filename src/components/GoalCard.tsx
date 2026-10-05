"use client";
import { useState } from "react";
import { ChevronRight } from "lucide-react";
import { setGoal } from "@/app/actions";
import { brl } from "@/lib/format";

export default function GoalCard({ goal, sold, monthName }: { goal: number | null; sold: number; monthName: string }) {
  const [editing, setEditing] = useState(false);
  const pct = goal ? Math.round((sold / goal) * 100) : 0;
  const R = 24, C = 2 * Math.PI * R;
  return (
    <section className="rounded-3xl border border-line bg-white p-4">
      <button type="button" onClick={() => setEditing(!editing)} className="flex w-full items-center gap-4 text-left">
        <div className="relative size-16 shrink-0">
          <svg viewBox="0 0 64 64" className="size-16 -rotate-90">
            <circle cx="32" cy="32" r={R} fill="none" stroke="var(--color-tint)" strokeWidth="6" />
            <circle cx="32" cy="32" r={R} fill="none" stroke="var(--color-brand)" strokeWidth="6" strokeLinecap="round"
              strokeDasharray={C} strokeDashoffset={C * (1 - Math.min(pct, 100) / 100)} />
          </svg>
          <span className="absolute inset-0 grid place-items-center text-sm font-extrabold text-brand">{pct}%</span>
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="text-lg font-extrabold">Meta de {monthName}</h2>
          {goal ? (
            <>
              <p className="text-sm text-soft">{brl(sold)} de {brl(goal)}</p>
              <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-tint"><div className="h-full rounded-full bg-brand" style={{ width: `${Math.min(pct, 100)}%` }} /></div>
              <p className="mt-1.5 text-sm font-semibold text-soft">{sold >= goal ? "meta batida!" : `faltam ${brl(goal - sold)}`}</p>
            </>
          ) : (<p className="text-sm text-soft">Toque para definir sua meta</p>)}
        </div>
        <ChevronRight className="shrink-0 text-soft" size={22} />
      </button>
      {editing && (
        <form action={async (fd) => { await setGoal(fd); setEditing(false); }} className="mt-4 flex gap-2">
          <input name="meta" inputMode="decimal" placeholder="Ex.: 10000,00" defaultValue={goal ?? ""} autoFocus
            className="min-w-0 flex-1 rounded-xl border border-brand px-3 py-2.5 text-brand outline-none" />
          <button className="rounded-xl bg-brand px-5 py-2.5 text-sm font-bold text-white">Salvar</button>
        </form>
      )}
    </section>
  );
}
