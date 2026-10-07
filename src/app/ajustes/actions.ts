"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getStore } from "@/lib/store";
import { logAction } from "@/lib/audit";

const str = (fd: FormData, k: string, max = 120) => String(fd.get(k) ?? "").trim().slice(0, max);

export async function updateStore(fd: FormData) {
  const name = str(fd, "name", 80);
  if (!name) return;
  const s = await getStore();
  if (!s) return;

  const row = {
    name,
    document: str(fd, "document", 24).replace(/[^\d./-]/g, "") || null,
    phone: str(fd, "phone", 20).replace(/[^\d+()\-\s]/g, "") || null,
    email: str(fd, "email", 120) || null,
    address: str(fd, "address", 160) || null,
    city: str(fd, "city", 80) || null,
    state: str(fd, "state", 2).toUpperCase() || null,
    updated_at: new Date().toISOString(),
  };

  await s.supabase.from("stores").update(row).eq("id", s.storeId);
  await logAction(s.supabase, s.storeId, "loja.atualizada", name);
  revalidatePath("/ajustes/loja");
  revalidatePath("/ajustes");
  redirect("/ajustes/loja?ok=1");
}
