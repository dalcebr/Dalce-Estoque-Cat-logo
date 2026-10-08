"use client";
import { useState } from "react";
import { Minus, Plus } from "lucide-react";
import { MAX_VARIATION_OPTIONS } from "@/lib/variations";

const f = "w-full rounded-2xl border border-line bg-surface px-4 py-3.5 text-lg outline-none focus:border-brand";
const L = ({ t }: { t: string }) => <span className="mb-1 block px-1 text-xs font-bold uppercase tracking-[0.15em] text-soft">{t}</span>;

/** Divide a string de opções em itens limpos. */
const split = (s: string) => s.split(/[\n,;]+/).map((o) => o.trim()).filter(Boolean);

/**
 * Formulário de um grupo de variações.
 * Permite informar a QUANTIDADE de opções, que gera os campos automaticamente.
 */
export default function VariationOptions({ name, options }: { name: string; options: string[] }) {
  const [count, setCount] = useState(Math.max(options.length, 1));
  const [values, setValues] = useState<string[]>(() => {
    const base = [...options];
    while (base.length < 1) base.push("");
    return base;
  });

  /** Ajusta a quantidade de campos, preservando o que já foi digitado. */
  function setQuantity(n: number) {
    const next = Math.min(Math.max(1, Math.trunc(n) || 1), MAX_VARIATION_OPTIONS);
    setCount(next);
    setValues((prev) => {
      const copy = [...prev];
      while (copy.length < next) copy.push("");
      return copy.slice(0, next);
    });
  }

  function update(i: number, v: string) {
    setValues((prev) => prev.map((x, idx) => (idx === i ? v : x)));
  }

  // Campo oculto com as opções finais (separadas por vírgula).
  const serialized = values.map((v) => v.trim()).filter(Boolean).join(", ");

  return (
    <>
      <label className="block">
        <L t="Nome do grupo" />
        <input name="name" required maxLength={40} defaultValue={name} placeholder="Ex.: Tamanho" className={f} />
      </label>

      <div className="rounded-3xl border border-line bg-surface p-4">
        <div className="mb-3 flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-[0.15em] text-soft">Quantidade de opções</span>
          <span className="text-xs font-semibold text-soft">{count}/{MAX_VARIATION_OPTIONS}</span>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setQuantity(count - 1)}
            disabled={count <= 1}
            aria-label="Diminuir quantidade"
            className="grid size-12 shrink-0 place-items-center rounded-2xl border border-line bg-page text-brand disabled:opacity-40"
          >
            <Minus size={22} />
          </button>
          <input
            type="number"
            inputMode="numeric"
            min={1}
            max={MAX_VARIATION_OPTIONS}
            value={count}
            onChange={(e) => setQuantity(Number(e.target.value))}
            className={`${f} text-center text-2xl font-extrabold`}
          />
          <button
            type="button"
            onClick={() => setQuantity(count + 1)}
            disabled={count >= MAX_VARIATION_OPTIONS}
            aria-label="Aumentar quantidade"
            className="grid size-12 shrink-0 place-items-center rounded-2xl border border-line bg-page text-brand disabled:opacity-40"
          >
            <Plus size={22} />
          </button>
        </div>

        <div className="mt-4 space-y-2">
          {values.map((v, i) => (
            <label key={i} className="flex items-center gap-3">
              <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-tint text-sm font-bold text-brand">{i + 1}</span>
              <input
                value={v}
                onChange={(e) => update(i, e.target.value)}
                maxLength={30}
                placeholder={`Opção ${i + 1} — ex.: ${["P", "M", "G", "GG", "XG"][i] ?? "..."}`}
                className={f}
              />
            </label>
          ))}
        </div>

        <p className="mt-3 text-xs text-soft">
          Preencha cada opção. As vazias são ignoradas ao salvar.
        </p>
      </div>

      {/* Valor enviado para a action */}
      <input type="hidden" name="options" value={serialized} />
      {split(serialized).length === 0 && (
        <p className="text-xs font-semibold text-amber-700">Informe pelo menos uma opção.</p>
      )}
    </>
  );
}
