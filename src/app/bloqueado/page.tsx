import Link from "next/link";
import { redirect } from "next/navigation";
import { AlertTriangle, MessageCircle } from "lucide-react";
import { getAccount } from "@/lib/account";
import { signOut } from "@/app/login/actions";
import { fmtDay, planOf } from "@/lib/plans";

export const dynamic = "force-dynamic";

export default async function BloqueadoPage() {
  const account = await getAccount();
  if (!account) redirect("/login");
  if (account.status !== "expired" && account.status !== "blocked") redirect("/");

  const limit = account.plan === "trial" ? account.trialEndsAt : account.planEndsAt;

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center bg-page px-6 text-center">
      <span className="grid size-20 place-items-center rounded-3xl bg-red-100 text-red-700"><AlertTriangle size={40} /></span>
      <h1 className="mt-6 text-3xl font-extrabold">Acesso suspenso</h1>
      <p className="mt-2 max-w-sm text-soft">
        {account.status === "blocked"
          ? "O acesso desta loja foi suspenso pelo suporte."
          : `O período do plano ${planOf(account.plan).name} terminou em ${fmtDay(limit)}.`}
      </p>
      <p className="mt-4 max-w-sm rounded-2xl border border-line bg-surface px-5 py-4 text-sm text-soft">
        Nada foi perdido: seus produtos, clientes e vendas continuam salvos. Reative a assinatura para voltar a usar.
      </p>
      <div className="mt-6 w-full max-w-sm space-y-3">
        <Link href="/assinatura" className="block rounded-2xl bg-brand py-4 text-lg font-bold text-white">Ver planos e reativar</Link>
        <a href="mailto:suporte@dalce.app" className="flex items-center justify-center gap-2 rounded-2xl border-2 border-brand py-4 text-lg font-bold text-brand"><MessageCircle size={20} /> Falar com o suporte</a>
        <form action={signOut}>
          <button className="w-full rounded-2xl py-3 font-semibold text-soft">Sair da conta</button>
        </form>
      </div>
    </main>
  );
}
