import { createClient } from "@/lib/supabase/server";
import { storeStatus, type StoreStatus } from "@/lib/plans";

export type Account = {
  userId: string;
  email: string | null;
  name: string;
  role: string;
  isSuperAdmin: boolean;
  storeId: string;
  storeName: string;
  plan: string;
  active: boolean;
  trialEndsAt: string | null;
  planEndsAt: string | null;
  status: StoreStatus;
};

/** Carrega o perfil + loja do usuário logado (ou null se não houver sessão). */
export async function getAccount(): Promise<Account | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: p } = await supabase
    .from("profiles")
    .select("name, role, is_super_admin, store_id, stores(name, plan, active, trial_ends_at, plan_ends_at)")
    .eq("id", user.id)
    .maybeSingle();
  if (!p) return null;

  const st = (Array.isArray(p.stores) ? p.stores[0] : p.stores) as
    | { name: string; plan: string; active: boolean; trial_ends_at: string | null; plan_ends_at: string | null }
    | null;

  return {
    userId: user.id,
    email: user.email ?? null,
    name: p.name ?? "Usuário",
    role: p.role ?? "owner",
    isSuperAdmin: !!p.is_super_admin,
    storeId: p.store_id as string,
    storeName: st?.name ?? "Minha loja",
    plan: st?.plan ?? "trial",
    active: st?.active ?? true,
    trialEndsAt: st?.trial_ends_at ?? null,
    planEndsAt: st?.plan_ends_at ?? null,
    status: storeStatus({
      plan: st?.plan ?? "trial",
      active: st?.active ?? true,
      trial_ends_at: st?.trial_ends_at ?? null,
      plan_ends_at: st?.plan_ends_at ?? null,
    }),
  };
}
