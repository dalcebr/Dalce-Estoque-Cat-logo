import { createClient } from "@/lib/supabase/server";
import Menu from "./Menu";

export default async function AppMenu() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: p } = user ? await supabase.from("profiles").select("name").eq("id", user.id).single() : { data: null };
  return <Menu name={p?.name ?? "Usuário"} />;
}
