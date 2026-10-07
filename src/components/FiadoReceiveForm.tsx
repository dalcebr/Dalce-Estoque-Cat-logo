"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { receiveFiado } from "@/app/fiado/actions";
import { cap } from "@/lib/format";

const f = "w-full rounded-2xl border border-line bg-surface px-4 py-3.5 text-lg outline-none focus:border-brand";
const METHODS = ["dinheiro", "pix", "débito", "crédito"];

export default function FiadoReceiveForm({ name }: { name: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");

  async function submit(fd: FormData) {
    setBusy(true); setError(""); setOk("");
    const r = await receiveFiado(fd);
    setBusy(false);
    if ("error" in r) { setError(r.error); return; }
    setOk("Recebimento registrado ✓");
    router.refresh();
  }

  return (
    <form action={submit} className="mt-3 space-y-3 rounded-3xl border border-line bg-surface p-4">
      <h2 className="text-lg font-extrabold">Receber pagamento</h2>
      <input type="hidden" name="name" value={name} />
      <input name="amount" required inputMode="decimal" placeholder="Valor (R$)" className={f} />
      <select name="method" className={f}>{METHODS.map((m) => <option key={m} value={m}>{cap(m)}</option>)}</select>
      {error && <p role="alert" className="text-sm font-semibold text-red-700">{error}</p>}
      {ok && <p role="status" className="text-sm font-semibold text-green-700">{ok}</p>}
      <button disabled={busy} className="w-full rounded-2xl bg-brand py-3.5 text-lg font-bold text-white disabled:opacity-60">
        {busy ? "Registrando..." : "Registrar recebimento"}
      </button>
    </form>
  );
}
