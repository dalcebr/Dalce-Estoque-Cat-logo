"use client";
import { useState } from "react";
import { setGoal } from "@/app/actions";
import { brl } from "@/lib/format";
export default function GoalCard({ goal, sold }: { goal: number | null; sold: number }) {
  const [editing, setEditing] = useState(false);
  const form = (
    <form action={async (fd) => { await setGoal(fd); setEditing(false); }} className="mt-3 flex gap-2">
      <input name="meta" inputMode="decimal" placeholder="Ex.: 10000,00" defaultValue={goal ?? ""} autoFocus
        className="min-w-0 flex-1 rounded-lg border border-brand px-3 py-2 text-brand outline-none" />
      <button className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white">Salvar</button>
    </form>
  );
  const pct = goal ? (sold / goal) * 100 : 0;
  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-4">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-black">Meta do mês</h2>
        <button onClick={() => setEditing(!editing)} className="text-sm font-medium text-brand">{goal ? "Editar" : "Definir meta"}</button>
      </div>
      {(editing || !goal) && editing && form}
      {!goal && !editing && <p className="mt-2 text-sm text-muted">Defina quanto quer vender neste mês.</p>}
      {goal && (
        <div className="mt-3">
          <div className="h-2.5 overflow-hidden rounded-full bg-gray-200"><div className="h-full bg-brand" style={{ width: `${Math.min(pct, 100)}%` }} /></div>
          <div className="mt-2 flex justify-between text-sm"><span className="text-black">Vendido: {brl(sold)} ({pct.toFixed(0)}%)</span><span className="text-muted">Meta: {brl(goal)}</span></div>
          <p className="mt-1 text-sm text-muted">
            {sold >= goal ? "Meta batida! 🎉" : `Faltam ${brl(goal - sold)} (${(100 - pct).toFixed(0)}%)`}
          </p>
        </div>
      )}
    </section>
  );
}
