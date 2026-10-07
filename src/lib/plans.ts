export type PlanKey = "trial" | "pro" | "business" | "blocked";

export type Plan = {
  key: PlanKey;
  name: string;
  price: number | null;
  days: number;
  tagline: string;
  features: string[];
};

export const PLANS: Record<PlanKey, Plan> = {
  trial: {
    key: "trial",
    name: "Teste grátis",
    price: 0,
    days: 14,
    tagline: "14 dias com todos os recursos liberados",
    features: ["PDV completo", "Estoque e fiado", "Catálogo online", "Relatórios"],
  },
  pro: {
    key: "pro",
    name: "Pro",
    price: 49.9,
    days: 30,
    tagline: "Para quem vende todos os dias",
    features: ["Tudo do teste", "Catálogo online ilimitado", "Relatórios completos", "Suporte por WhatsApp"],
  },
  business: {
    key: "business",
    name: "Business",
    price: 89.9,
    days: 30,
    tagline: "Para lojas com equipe e alto volume",
    features: ["Tudo do Pro", "Múltiplos operadores", "Metas e comparativos", "Suporte prioritário"],
  },
  blocked: {
    key: "blocked",
    name: "Bloqueado",
    price: null,
    days: 0,
    tagline: "Acesso suspenso",
    features: [],
  },
};

export const PLAN_LIST: Plan[] = [PLANS.trial, PLANS.pro, PLANS.business];

export const planOf = (key: string | null | undefined): Plan => PLANS[(key as PlanKey) ?? "trial"] ?? PLANS.trial;

export const brlPlan = (v: number | null) =>
  v == null ? "—" : v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export type StoreStatus = "trial" | "active" | "expired" | "blocked";

export function storeStatus(store: {
  plan: string;
  active: boolean;
  trial_ends_at: string | null;
  plan_ends_at: string | null;
}): StoreStatus {
  if (!store.active || store.plan === "blocked") return "blocked";
  const limit = store.plan === "trial" ? store.trial_ends_at : store.plan_ends_at;
  if (limit && new Date(limit).getTime() <= Date.now()) return "expired";
  return store.plan === "trial" ? "trial" : "active";
}

export const STATUS_LABEL: Record<StoreStatus, string> = {
  trial: "Em teste",
  active: "Ativo",
  expired: "Vencido",
  blocked: "Bloqueado",
};

export const STATUS_CLASS: Record<StoreStatus, string> = {
  trial: "bg-amber-100 text-amber-700",
  active: "bg-green-100 text-green-700",
  expired: "bg-red-100 text-red-700",
  blocked: "bg-slate-100 text-slate-600",
};

export function daysLeft(iso: string | null): number | null {
  if (!iso) return null;
  return Math.ceil((new Date(iso).getTime() - Date.now()) / 864e5);
}

export function fmtDay(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo", day: "2-digit", month: "2-digit", year: "numeric" });
}
