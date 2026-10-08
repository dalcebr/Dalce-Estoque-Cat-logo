"use client";

import { useState, useTransition, type ReactNode } from "react";
import { Download, KeyRound, Lock, LockOpen, Trash2, User } from "lucide-react";
import type { AdminStore } from "@/lib/admin";
import { freezeStore, unfreezeStore, deleteStore, resetPassword, exportStoreJson } from "../../actions";

const fmtDate = (iso: string | null) => {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
};

export default function StoreCard({ store }: { store: AdminStore }) {
  const [pending, start] = useTransition();
  const [dialog, setDialog] = useState<null | "freeze" | "delete" | "password">(null);
  const [exporting, setExporting] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const download = async () => {
    setExporting(true);
    setMsg(null);
    try {
      const res = await exportStoreJson(store.storeId);
      if (!res.ok || !res.json) {
        setMsg(res.error ?? "Falha ao exportar.");
        return;
      }
      const blob = new Blob([res.json], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = res.filename ?? "backup.json";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch {
      setMsg("Falha ao exportar os dados.");
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="rounded-3xl border border-line bg-surface p-4">
      <div className="flex items-start gap-3">
        <span className={`grid size-12 shrink-0 place-items-center rounded-2xl ${store.frozen ? "bg-red-100 text-red-700" : "bg-tint text-brand"}`}>
          {store.frozen ? <Lock size={22} /> : <LockOpen size={22} />}
        </span>
        <div className="min-w-0 flex-1 leading-tight">
          <b className="block truncate text-xl font-extrabold">{store.storeName}</b>
          <span className="flex items-center gap-1.5 text-soft"><User size={14} /> {store.ownerName ?? "—"}{store.ownerUsername ? ` · @${store.ownerUsername}` : ""}</span>
          <span className="mt-1 block text-sm text-soft">
            {store.counts.products} produtos · {store.counts.sales} vendas · {store.counts.customers} clientes
          </span>
          {store.frozen && (
            <span className="mt-1 block text-sm font-semibold text-red-700">
              Congelada{store.frozenAt ? ` em ${fmtDate(store.frozenAt)}` : ""}{store.frozenReason ? ` — ${store.frozenReason}` : ""}
            </span>
          )}
        </div>
      </div>

      {msg && <p className="mt-3 rounded-xl bg-red-100 px-3 py-2 text-sm font-semibold text-red-700">{msg}</p>}

      <div className="mt-4 grid grid-cols-2 gap-2">
        {store.frozen ? (
          <button disabled={pending} onClick={() => start(() => void unfreezeStore(store.storeId))} className="flex items-center justify-center gap-2 rounded-2xl border border-line py-3 font-bold text-ink disabled:opacity-60">
            <LockOpen size={18} /> Descongelar
          </button>
        ) : (
          <button disabled={pending} onClick={() => setDialog("freeze")} className="flex items-center justify-center gap-2 rounded-2xl border border-line py-3 font-bold text-ink disabled:opacity-60">
            <Lock size={18} /> Congelar
          </button>
        )}
        <button disabled={exporting} onClick={download} className="flex items-center justify-center gap-2 rounded-2xl border border-line py-3 font-bold text-ink disabled:opacity-60">
          <Download size={18} /> {exporting ? "Exportando…" : "Exportar JSON"}
        </button>
        <button disabled={pending || !store.ownerId} onClick={() => setDialog("password")} className="flex items-center justify-center gap-2 rounded-2xl border border-line py-3 font-bold text-ink disabled:opacity-60">
          <KeyRound size={18} /> Nova senha
        </button>
        <button disabled={pending} onClick={() => setDialog("delete")} className="flex items-center justify-center gap-2 rounded-2xl border border-red-300 py-3 font-bold text-red-700 disabled:opacity-60">
          <Trash2 size={18} /> Excluir
        </button>
      </div>

      {dialog === "freeze" && (
        <Modal title="Congelar acesso" onClose={() => setDialog(null)}>
          <p className="text-soft">O usuário não conseguirá mais acessar o sistema até ser descongelado. Os dados são preservados.</p>
          <form action={(fd) => start(() => void freezeStore(store.storeId, fd))} className="mt-4 space-y-3">
            <input name="reason" placeholder="Motivo (opcional)" className="w-full rounded-2xl border border-line bg-surface px-4 py-3 outline-none focus:border-brand" />
            <div className="flex gap-3">
              <button type="button" onClick={() => setDialog(null)} className="flex-1 rounded-xl border border-line py-3 font-bold text-ink">Cancelar</button>
              <button type="submit" disabled={pending} className="flex-1 rounded-xl bg-brand py-3 font-bold text-white disabled:opacity-60">Congelar</button>
            </div>
          </form>
        </Modal>
      )}

      {dialog === "password" && (
        <Modal title="Redefinir senha" onClose={() => setDialog(null)}>
          <p className="text-soft">Defina uma nova senha para <b>{store.ownerName}</b>.</p>
          <form action={(fd) => start(() => void resetPassword(store.ownerId!, fd))} className="mt-4 space-y-3">
            <input name="password" type="text" minLength={6} required placeholder="Nova senha (mín. 6)" className="w-full rounded-2xl border border-line bg-surface px-4 py-3 outline-none focus:border-brand" />
            <div className="flex gap-3">
              <button type="button" onClick={() => setDialog(null)} className="flex-1 rounded-xl border border-line py-3 font-bold text-ink">Cancelar</button>
              <button type="submit" disabled={pending} className="flex-1 rounded-xl bg-brand py-3 font-bold text-white disabled:opacity-60">Salvar</button>
            </div>
          </form>
        </Modal>
      )}

      {dialog === "delete" && (
        <Modal title="Excluir loja" onClose={() => setDialog(null)}>
          <p className="text-soft">
            Isso apaga <b>todos os dados</b> de <b>{store.storeName}</b> (produtos, vendas, clientes, catálogo) e o acesso do usuário.
            Esta ação não pode ser desfeita. Exporte um backup antes, se quiser poder restaurar depois.
          </p>
          <div className="mt-4 flex gap-3">
            <button type="button" onClick={() => setDialog(null)} className="flex-1 rounded-xl border border-line py-3 font-bold text-ink">Cancelar</button>
            <button type="button" disabled={pending} onClick={() => start(() => void deleteStore(store.storeId))} className="flex-1 rounded-xl bg-red-700 py-3 font-bold text-white disabled:opacity-60">Excluir tudo</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" role="presentation">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div role="alertdialog" aria-modal="true" className="relative z-10 mx-5 w-full max-w-sm rounded-2xl bg-surface p-6 shadow-xl">
        <h2 className="text-lg font-bold text-ink">{title}</h2>
        <div className="mt-2">{children}</div>
      </div>
    </div>
  );
}
