import { getAccount } from "@/lib/account";
import { daysLeft, planOf } from "@/lib/plans";
import Menu from "./Menu";

const SUPPORT = process.env.NEXT_PUBLIC_SUPPORT_EMAIL ?? "suporte@dalce.app";

export default async function AppMenu() {
  const account = await getAccount();
  if (!account) return <Menu name="Usuário" storeName="Minha loja" planName="—" planBadge="—" planClass="bg-white/20" isSuperAdmin={false} supportEmail={SUPPORT} />;

  const plan = planOf(account.plan);
  const limit = account.plan === "trial" ? account.trialEndsAt : account.planEndsAt;
  const left = daysLeft(limit);

  const badge =
    account.status === "blocked" ? "Acesso suspenso"
    : account.status === "expired" ? "Plano vencido"
    : account.plan === "trial" ? `Teste · ${left ?? 0} dia(s)`
    : `${plan.name} · ${left ?? "∞"} dia(s)`;

  const planClass =
    account.status === "expired" || account.status === "blocked" ? "bg-red-500/90 text-white"
    : account.plan === "trial" ? "bg-white/20 text-white"
    : "bg-green-500/90 text-white";

  return (
    <Menu
      name={account.name}
      storeName={account.storeName}
      planName={plan.name}
      planBadge={badge}
      planClass={planClass}
      isSuperAdmin={account.isSuperAdmin}
      supportEmail={SUPPORT}
    />
  );
}
