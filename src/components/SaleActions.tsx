"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronRight, Ellipsis, Share2, StickyNote, XCircle } from "lucide-react";
import { cancelSale } from "@/app/vendas/actions";

type Props = { id: string; code: string; customer: string | null; total: string; cancelled: boolean; receipt: string };

export default function SaleActions({ id, code, customer, total, cancelled, receipt }: Props) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  async function share() {
    setOpen(false);
    if (navigator.share) { try { await navigator.share({ title: `Venda ${code}`, text: receipt }); } catch {} }
    else { await navigator.clipboard.writeText(receipt); alert("Recibo copiado."); }
  }
  async function cancel() {
    if (!confirm("Cancelar esta venda? Ela deixa de entrar nos totais e o estoque volta.")) return;
    setBusy(true);
    const r = await cancelSale(id);
    setBusy(false);
    if ("error" in r) { alert(r.error); return; }
    setOpen(false);
    router.refresh();
  }

  return (
    <>
      <nav className="fixed inset-x-0 bottom-0 border-t border-line bg-page px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-4">
        <div className="mx-auto grid max-w-md grid-cols-[2fr_3fr] gap-3">
          <button onClick={() => setOpen(true)} className="flex items-center justify-center gap-2 rounded-2xl border-2 border-brand bg-surface py-4 text-lg font-bold text-brand"><Ellipsis size={24} /> Opções</button>
          <button onClick={share} className="flex items-center justify-center gap-2 rounded-2xl bg-brand py-4 text-lg font-bold text-white"><Share2 size={22} /> Compartilhar</button>
        </div>
      </nav>

      {open && (
        <div className="fixed inset-0 z-30 bg-black/50" onClick={() => setOpen(false)}>
          <div onClick={(e) => e.stopPropagation()} className="absolute inset-x-0 bottom-0 mx-auto max-w-md rounded-t-[32px] bg-page px-5 pb-8 pt-3">
            <div className="mx-auto h-1.5 w-14 rounded-full bg-tint" />
            <p className="mt-4 text-sm font-bold uppercase tracking-[0.18em] text-brand">Opções · {code}</p>
            <h2 className="text-2xl font-extrabold">{customer ?? "Sem cliente"} · {total}</h2>
            <div className="mt-5 space-y-5">
              <button disabled={cancelled || busy} onClick={cancel} className="flex w-full items-center gap-4 text-left disabled:opacity-40">
                <span className="grid size-14 place-items-center rounded-2xl bg-red-100 text-red-600"><XCircle size={28} /></span>
                <span className="flex-1"><b className="block text-lg">{busy ? "Cancelando..." : "Cancelar venda"}</b><span className="text-soft">Devolve o estoque dos itens</span></span>
                <ChevronRight className="text-soft" />
              </button>
              <div className="flex items-center gap-4 opacity-40">
                <span className="grid size-14 place-items-center rounded-2xl bg-line text-soft"><StickyNote size={26} /></span>
                <span className="flex-1"><b className="block text-lg">Observação</b><span className="text-soft">Nota interna sobre esta venda</span></span>
              </div>
              <button onClick={share} className="flex w-full items-center gap-4 text-left">
                <span className="grid size-14 place-items-center rounded-2xl bg-tint text-brand"><Share2 size={26} /></span>
                <span className="flex-1"><b className="block text-lg">Compartilhar recibo</b><span className="text-soft">enviar o recibo</span></span>
                <ChevronRight className="text-soft" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
