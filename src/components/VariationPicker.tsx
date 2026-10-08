"use client";
import { useState } from "react";
import { Check, Layers, Plus, Trash2 } from "lucide-react";
import { MAX_VARIATION_GROUPS, type ProductVariation, type VariationGroup } from "@/lib/variations";

const f = "w-full rounded-2xl border border-line bg-surface px-4 py-3 text-lg outline-none focus:border-brand";

/** Converte texto digitado (aceita vírgula) em número. Vazio → null. */
function toNumber(raw: string): number | null {
  const s = raw.replace(/\s/g, "").replace(/\./g, "").replace(",", ".");
  if (s === "") return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

/**
 * Seletor de variações do produto.
 * O usuário escolhe grupos já cadastrados (Cadastros → Variações) e define,
 * para cada opção, o estoque e (opcionalmente) um preço próprio.
 *
 * Os campos são controlados por texto local para permitir digitação livre
 * (apagar, digitar "12,50", etc.) sem o valor "pular" a cada tecla.
 */
export default function VariationPicker({
  groups,
  value,
  onChange,
  maxStock,
}: {
  groups: VariationGroup[];
  value: ProductVariation[];
  onChange: (v: ProductVariation[]) => void;
  /** Estoque do produto principal. A soma das variações não pode ultrapassá-lo. */
  maxStock?: number;
}) {
  const [open, setOpen] = useState(false);
  // Texto em edição por chave "grupo\u0000opção" (evita reformatar durante a digitação).
  const [draft, setDraft] = useState<Record<string, string>>({});

  const usedGroups = new Set(value.map((v) => v.group_name.toLowerCase()));
  const available = groups.filter((g) => !usedGroups.has(g.name.toLowerCase()));

  const keyOf = (groupName: string, option: string) => `${groupName}\u0000${option}`;

  /** Soma atual do estoque das variações. */
  const totalStock = value.reduce((s, v) => s + (Number.isFinite(v.stock) ? v.stock : 0), 0);
  const limit = typeof maxStock === "number" && Number.isFinite(maxStock) ? Math.max(0, Math.trunc(maxStock)) : null;
  const over = limit !== null && totalStock > limit;

  /** Adiciona todas as opções de um grupo, herdando estoque/preço já informados. */
  function addGroup(g: VariationGroup) {
    const next = [...value];
    g.options.forEach((option) => {
      next.push({ group_id: g.id, group_name: g.name, option, stock: 0, price: null });
    });
    onChange(next);
    setOpen(false);
  }

  function removeGroup(name: string) {
    onChange(value.filter((v) => v.group_name !== name));
  }

  function update(groupName: string, option: string, patch: Partial<ProductVariation>) {
    onChange(value.map((v) => (v.group_name === groupName && v.option === option ? { ...v, ...patch } : v)));
  }

  /** Atualiza o estoque a partir do texto digitado, sem reformatar o campo. */
  function setStock(groupName: string, option: string, raw: string) {
    const k = keyOf(groupName, option) + "\u0001stock";
    setDraft((d) => ({ ...d, [k]: raw }));
    const n = toNumber(raw);
    update(groupName, option, { stock: n === null ? 0 : Math.max(0, Math.trunc(n)) });
  }

  /** Atualiza o preço a partir do texto digitado, sem reformatar o campo. */
  function setPrice(groupName: string, option: string, raw: string) {
    const k = keyOf(groupName, option) + "\u0001price";
    setDraft((d) => ({ ...d, [k]: raw }));
    const n = toNumber(raw);
    update(groupName, option, { price: n === null || n < 0 ? null : n });
  }

  // Agrupa para exibição
  const grouped = value.reduce<Record<string, ProductVariation[]>>((acc, v) => {
    (acc[v.group_name] ??= []).push(v);
    return acc;
  }, {});

  const groupCount = Object.keys(grouped).length;

  return (
    <div className="rounded-3xl border border-line bg-surface p-4">
      <div className="mb-3 flex items-center justify-between">
        <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.15em] text-soft">
          <Layers size={15} /> Variações
        </span>
        <span className="text-xs font-semibold text-soft">{groupCount}/{MAX_VARIATION_GROUPS}</span>
      </div>

      {groupCount === 0 && (
        <p className="mb-3 text-sm text-soft">
          Nenhuma variação selecionada. Escolha um grupo já cadastrado para definir tamanhos, cores, sabores etc.
        </p>
      )}

      <div className="space-y-4">
        {Object.entries(grouped).map(([name, options]) => (
          <div key={name} className="rounded-2xl border border-line bg-page p-3">
            <div className="mb-3 flex items-center justify-between">
              <b className="text-base font-extrabold">{name}</b>
              <button
                type="button"
                onClick={() => removeGroup(name)}
                aria-label={`Remover ${name}`}
                className="grid size-9 place-items-center rounded-xl border border-line bg-surface text-red-600"
              >
                <Trash2 size={16} />
              </button>
            </div>

            <div className="space-y-3">
              {options.map((v) => {
                const k = keyOf(name, v.option);
                const stockText = draft[k + "\u0001stock"] ?? String(v.stock);
                const priceText = draft[k + "\u0001price"] ?? (v.price === null ? "" : String(v.price).replace(".", ","));
                return (
                  <div key={v.option} className="rounded-xl border border-line bg-surface p-3">
                    <b className="mb-2 block truncate text-sm font-bold text-ink">{v.option}</b>
                    <div className="grid grid-cols-2 gap-2">
                      <label className="block">
                        <span className="mb-1 block px-1 text-[10px] font-bold uppercase tracking-[0.12em] text-soft">Estoque</span>
                        <input
                          type="text"
                          inputMode="numeric"
                          placeholder="0"
                          value={stockText}
                          onChange={(e) => setStock(name, v.option, e.target.value.replace(/[^\d]/g, ""))}
                          className={`${f} px-3 py-2.5 text-center text-base`}
                        />
                      </label>
                      <label className="block">
                        <span className="mb-1 block px-1 text-[10px] font-bold uppercase tracking-[0.12em] text-soft">Preço (R$)</span>
                        <input
                          type="text"
                          inputMode="decimal"
                          placeholder="padrão"
                          value={priceText}
                          onChange={(e) => setPrice(name, v.option, e.target.value.replace(/[^\d.,]/g, ""))}
                          className={`${f} px-3 py-2.5 text-center text-base`}
                        />
                      </label>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {groupCount < MAX_VARIATION_GROUPS && (
        <div className="mt-3">
          {!open ? (
            <button
              type="button"
              onClick={() => setOpen(true)}
              disabled={available.length === 0}
              className="flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-line bg-page py-3 text-sm font-bold text-brand disabled:opacity-50"
            >
              <Plus size={18} /> {available.length === 0 ? "Nenhum grupo disponível" : "Adicionar variação"}
            </button>
          ) : (
            <div className="rounded-2xl border border-line bg-page p-2">
              {available.length === 0 ? (
                <p className="p-3 text-sm text-soft">Todos os grupos já foram adicionados.</p>
              ) : (
                available.map((g) => (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() => addGroup(g)}
                    className="flex w-full items-center justify-between gap-3 rounded-xl px-3 py-3 text-left hover:bg-surface"
                  >
                    <span className="min-w-0">
                      <b className="block truncate text-base font-bold">{g.name}</b>
                      <span className="block truncate text-xs text-soft">{g.options.join(" · ")}</span>
                    </span>
                    <Check size={18} className="shrink-0 text-brand" />
                  </button>
                ))
              )}
              <button type="button" onClick={() => setOpen(false)} className="mt-1 w-full rounded-xl py-2 text-sm font-semibold text-soft">
                Cancelar
              </button>
            </div>
          )}
        </div>
      )}

      {groupCount > 0 && (
        <div className={`mt-3 flex items-center justify-between rounded-2xl px-4 py-3 text-sm font-bold ${over ? "bg-red-100 text-red-700" : "bg-tint text-brand"}`}>
          <span>Total nas variações</span>
          <span>
            {totalStock}
            {limit !== null && <span className="font-semibold opacity-70"> / {limit}</span>}
          </span>
        </div>
      )}

      {over && (
        <p className="mt-2 text-xs font-semibold text-red-600">
          A soma das variações ({totalStock}) ultrapassa o estoque do produto ({limit}). Reduza as quantidades ou aumente o estoque do produto.
        </p>
      )}

      <p className="mt-3 text-xs text-soft">
        O estoque das variações é somado ao estoque do produto e não pode ultrapassá-lo. Deixe o preço vazio para usar o preço padrão.
      </p>
    </div>
  );
}
