import PageHeader from "@/components/PageHeader";
import SubmitButton from "@/components/SubmitButton";
import { createAccess } from "../actions";

export const dynamic = "force-dynamic";

const ERROS: Record<string, string> = {
  campos: "Preencha o nome da loja e do responsável.",
  usuario: "Usuário inválido. Use 3 a 30 caracteres: letras minúsculas, números, ponto, hífen ou underline.",
  senha: "A senha deve ter entre 6 e 128 caracteres.",
};

const field = "w-full rounded-2xl border border-line bg-surface px-4 py-3.5 text-lg outline-none focus:border-brand";

export default async function NovoAcesso({ searchParams }: { searchParams: Promise<{ erro?: string }> }) {
  const { erro } = await searchParams;
  const msg = erro ? (ERROS[erro] ?? decodeURIComponent(erro)) : null;

  return (
    <main className="mx-auto min-h-dvh max-w-md bg-page px-5 pt-5">
      <PageHeader eyebrow="Admin · Novo" title="Criar acesso" back="/admin" sub="Uma nova loja com usuário próprio" />

      {msg && <p className="mt-5 rounded-2xl border border-red-300 bg-red-100 px-4 py-3 text-sm font-semibold text-red-700">{msg}</p>}

      <form action={createAccess} className="mt-6 space-y-3">
        <label className="block">
          <span className="mb-1 block px-1 text-xs font-bold uppercase tracking-[0.15em] text-soft">Nome da loja</span>
          <input name="storeName" required maxLength={80} placeholder="Ex.: Dalce Joias" className={field} />
        </label>
        <label className="block">
          <span className="mb-1 block px-1 text-xs font-bold uppercase tracking-[0.15em] text-soft">Nome do responsável</span>
          <input name="ownerName" required maxLength={80} placeholder="Ex.: Maria Silva" className={field} />
        </label>
        <label className="block">
          <span className="mb-1 block px-1 text-xs font-bold uppercase tracking-[0.15em] text-soft">Usuário de acesso</span>
          <input name="username" required autoCapitalize="none" autoCorrect="off" maxLength={30} placeholder="Ex.: mariasilva" className={field} />
          <span className="mt-1 block px-1 text-sm text-soft">O login será feito com este usuário (sem e-mail).</span>
        </label>
        <label className="block">
          <span className="mb-1 block px-1 text-xs font-bold uppercase tracking-[0.15em] text-soft">Senha inicial</span>
          <input name="password" required minLength={6} maxLength={128} type="text" placeholder="Mínimo 6 caracteres" className={field} />
        </label>
        <div className="pt-2"><SubmitButton>Criar acesso</SubmitButton></div>
      </form>
    </main>
  );
}
