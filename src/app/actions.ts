"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getStore } from "@/lib/store";

export async function setGoal(fd: FormData) {
  const raw = String(fd.get("meta") ?? "").replace(/\./g, "").replace(",", ".");
  const goal = Number(raw);
  if (!Number.isFinite(goal) || goal <= 0 || goal > 100_000_000) return;

  const s = await getStore();
  if (!s) return void redirect("/login");

  await s.supabase.from("stores").update({ monthly_goal: goal }).eq("id", s.storeId);
  revalidatePath("/");
}
