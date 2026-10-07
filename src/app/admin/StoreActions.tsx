"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, KeyRound, Loader2, Power, X } from "lucide-react";
import { resetOwnerPassword, setPlan, toggleStore } from "@/app/admin/actions";
import { PLAN_LIST } from "@/lib/plans";

const btn = "rounded-xl px-3 py-2 text-sm font-bold";

export default function StoreActions({ id, active }: { id: string; active: boolean }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [open, setOpen] = useState<null | "plan" | "pass">(null);
  const [msg, setMsg] = useState<{ t: string; err?: boolean } | null>(null);
  const [pass, setPass] = useState("");

  const run = (fn: () => Promise<{ ok: true; msg: string } | { error: string }>) =>
    start(async () => {
      const r = await fn();
      setMsg("error" in r ? { t: r.error, err: true } : { t: r.msg });
      if ("ok" in r) { setOpen(null); setPass(""); router.refresh(); }
    });

  return (
    <div className="mt-3 border-t border-line pt-3">
      <div className="flex flex-wrap items-center gap-2">
        <button disabled={pending} onClick={() => setOpen(open === "plan" ? null : "plan")} className={`${btn} bg-tint text-brand`}>Plano</button>
        <button disabled={pending} onClick={() => setOpen(open === "pass" ? null : "pass")} className={`${btn} bg-page text-soft`}><KeyRound size={14} className="mr-1 inline" />Senha</button>
        <button disabled={pending} onClick={() => run(() => toggleStore(id, !active))} className={`${btn} ${active ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"}`}>
          <Power size={14} className="mr-1 inline" />{active ? "Suspender" : "Ativar"}
        </button>
        {pending && <Loader2 size={16} className="animate-spin text-soft" />}
      </div>

      {open === "plan" && (
        <div className="mt-3 space-y-2 rounded-2xl bg-page p-3">
          {PLAN_LIST.map((p) => (
            <div key={p.key} className="flex items-center gap-2">
              <span className="flex-1 text-sm font-bold">{p.name}</span>
              {[30, 90, 365].map((d) => (
                <button key={d} disabled={pending} onClick={() => run(() => setPlan(id, p.key, d))} className="rounded-lg border border-line bg-surface px-2.5 py-1.5 text-xs font-bold text-brand">{d}d</button>
              ))}
            </div>
          ))}
          <button disabled={pending} onClick={() => run(() => setPlan(id, "blocked", 0))} className="w-full rounded-lg bg-red-100 py-2 text-xs font-bold text-red-700">Bloquear acesso</button>
        </div>
      )}

      {open === "pass" && (
        <div className="mt-3 flex gap-2 rounded-2xl bg-page p-3">
          <input value={pass} onChange={(e) => setPass(e.target.value)} placeholder="Nova senha do dono" className="min-w-0 flex-1 rounded-xl border border-line bg-surface px-3 py-2 text-sm outline-none focus:border-brand" />
          <button disabled={pending || pass.length < 6} onClick={() => run(() => resetOwnerPassword(id, pass))} className="rounded-xl bg-brand px-3 py-2 text-sm font-bold text-white disabled:opacity-50">Salvar</button>
        </div>
      )}

      {msg && (
        <p className={`mt-2 flex items-center gap-1.5 text-sm font-semibold ${msg.err ? "text-red-700" : "text-green-700"}`}>
          {msg.err ? <X size={14} /> : <Check size={14} />}{msg.t}
        </p>
      )}
    </div>
  );
}
