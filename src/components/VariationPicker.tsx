"use client";
import { useState } from "react";
import { Check, Layers, Plus, Trash2 } from "lucide-react";
import { MAX_VARIATION_GROUPS, type ProductVariation, type VariationGroup } from "@/lib/variations";

const f = "w-full rounded-2xl border border-line bg-surface px-4 py-3 text-lg outline-none focus:border-brand";

/**
 * Seletor de variações do produto.
 * O usuário escolhe grupos já cadastrados (Cadastros → Variações) e define,
 * para cada opção, o estoque e (opcionalmente) um preço próprio.
 */
export default function VariationPicker({
  groups,
  value,
  onChange,
}: {
  groups: VariationGroup[];
  value: ProductVariation[];
  onChange: (v: ProductVariation[]) => void;
}) {
  const [open, setOpen] = useState(false);

  const usedGroups = new Set(value.map((v) => v.group_name.toLowerCase()));
  const available = groups.filter((g) => !usedGroups.has(g.name.toLowerCase()));

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
            <div className="mb-2 flex items-center justify-between">
              <b className="text-base font-extrabold">{name}</b>
              <button
                type="button"
                onClick={() => removeGroup(name)}
                aria-label={`Remover ${name}`}
                className="grid size-8 place-items-center rounded-lg text-red-600"
              >
                <Trash2 size={16} />
              </button>
            </div>
            <div className="space-y-2">
              {options.map((v) => (
                <div key={v.option} className="flex items-center gap-2">
                  <span className="w-20 shrink-0 truncate text-sm font-semibold text-soft">{v.option}</span>
                  <label className="flex flex-1 items-center gap-1.5">
                    <span className="text-[10px] font-bold uppercase text-soft">Estoque</span>
                    <input
                      type="number"
                      inputMode="numeric"
                      value={v.stock}
                      onChange={(e) => update(name, v.option, { stock: Math.trunc(Number(e.target.value)) || 0 })}
                      className={`${f} px-3 py-2 text-base`}
                    />
                  </label>
                  <label className="flex flex-1 items-center gap-1.5">
                    <span className="text-[10px] font-bold uppercase text-soft">Preço</span>
                    <input
                      type="text"
                      inputMode="decimal"
                      placeholder="padrão"
                      value={v.price === null ? "" : String(v.price).replace(".", ",")}
                      onChange={(e) => {
                        const raw = e.target.value.replace(",", ".").trim();
                        update(name, v.option, { price: raw === "" ? null : Number(raw) });
                      }}
                      className={`${f} px-3 py-2 text-base`}
                    />
                  </label>
                </div>
              ))}
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

      <p className="mt-3 text-xs text-soft">
        O estoque das variações é somado ao estoque do produto. Deixe o preço vazio para usar o preço padrão.
      </p>
    </div>
  );
}
