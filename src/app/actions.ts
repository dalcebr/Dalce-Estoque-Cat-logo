"use server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
export async function setGoal(fd: FormData) {
  const raw = String(fd.get("meta") ?? "").replace(/\./g, "").replace(",", ".");
  const goal = Number(raw);
  if (!Number.isFinite(goal) || goal <= 0) return;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  const { data: profile } = await supabase.from("profiles").select("store_id").eq("id", user.id).single();
  if (!profile) return;
  await supabase.from("stores").update({ monthly_goal: goal }).eq("id", profile.store_id);
  revalidatePath("/");
}
