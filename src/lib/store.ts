import { createClient } from "@/lib/supabase/server";
export const num = (v: FormDataEntryValue | null) => Number(String(v ?? "").replace(/\./g, "").replace(",", "."));
export async function getStore() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: p } = await supabase.from("profiles").select("store_id").eq("id", user.id).single();
  return p ? { supabase, storeId: p.store_id as string } : null;
}
