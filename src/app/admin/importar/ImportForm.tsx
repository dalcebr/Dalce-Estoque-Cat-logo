"use client";

import { useRef, useState } from "react";
import { FileJson, Upload } from "lucide-react";
import SubmitButton from "@/components/SubmitButton";
import { importStoreJson } from "../actions";

const field = "w-full rounded-2xl border border-line bg-surface px-4 py-3.5 text-lg outline-none focus:border-brand";

export default function ImportForm() {
  const [content, setContent] = useState("");
  const [fileName, setFileName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const onFile = async (file: File | undefined) => {
    setError(null);
    if (!file) return;
    if (file.size > 20 * 1024 * 1024) {
      setError("Arquivo muito grande (máx. 20 MB).");
      return;
    }
    try {
      const text = await file.text();
      JSON.parse(text); // valida o JSON antes de enviar
      setContent(text);
      setFileName(file.name);
    } catch {
      setError("O arquivo não é um JSON válido.");
    }
  };

  return (
    <form action={importStoreJson} className="mt-6 space-y-3">
      <input type="hidden" name="backup" value={content} />

      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="flex w-full items-center gap-4 rounded-3xl border-2 border-dashed border-line bg-surface px-5 py-5 text-left active:bg-page"
      >
        <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-tint text-brand"><FileJson size={22} /></span>
        <span className="min-w-0 flex-1 leading-tight">
          <b className="block text-lg">{fileName ?? "Escolher arquivo .json"}</b>
          <span className="text-soft">{fileName ? "Toque para trocar o arquivo" : "Backup exportado do painel"}</span>
        </span>
      </button>
      <input ref={inputRef} type="file" accept="application/json,.json" className="hidden" onChange={(e) => onFile(e.target.files?.[0])} />

      {error && <p className="rounded-2xl border border-red-300 bg-red-100 px-4 py-3 text-sm font-semibold text-red-700">{error}</p>}

      <label className="block">
        <span className="mb-1 block px-1 text-xs font-bold uppercase tracking-[0.15em] text-soft">Nome da loja (opcional)</span>
        <input name="storeName" maxLength={80} placeholder="Deixe vazio para usar o nome do backup" className={field} />
      </label>
      <label className="block">
        <span className="mb-1 block px-1 text-xs font-bold uppercase tracking-[0.15em] text-soft">Usuário do dono (opcional)</span>
        <input name="ownerUsername" autoCapitalize="none" autoCorrect="off" maxLength={30} placeholder="Ex.: mariasilva" className={field} />
      </label>

      <div className="pt-2">
        <SubmitButton disabled={!content}>
          <Upload size={20} /> Importar dados
        </SubmitButton>
      </div>
    </form>
  );
}
