import PageHeader from "@/components/PageHeader";
import ImportForm from "./ImportForm";

export const dynamic = "force-dynamic";

const ERROS: Record<string, string> = {
  vazio: "Selecione um arquivo de backup.",
  json: "O arquivo não é um JSON válido.",
  formato: "Formato de backup inválido. Use um arquivo exportado pelo painel.",
};

export default async function Importar({ searchParams }: { searchParams: Promise<{ erro?: string }> }) {
  const { erro } = await searchParams;
  const msg = erro ? (ERROS[erro] ?? decodeURIComponent(erro)) : null;

  return (
    <main className="mx-auto min-h-dvh max-w-md bg-page px-5 pt-5 pb-10">
      <PageHeader eyebrow="Admin · Importar" title="Restaurar loja" back="/admin" sub="Recria a loja a partir de um backup" />

      {msg && <p className="mt-5 rounded-2xl border border-red-300 bg-red-100 px-4 py-3 text-sm font-semibold text-red-700">{msg}</p>}

      <p className="mt-5 rounded-2xl border border-line bg-surface px-4 py-3 text-sm text-soft">
        A importação cria uma <b>nova loja</b> com os dados do arquivo. Nada existente é sobrescrito.
        Depois de importar, crie o acesso do dono em <b>Novo acesso</b> (ou informe o usuário abaixo).
      </p>

      <ImportForm />
    </main>
  );
}
