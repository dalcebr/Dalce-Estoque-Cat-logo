"use server";
import { revalidatePath } from "next/cache";
import { getStore, num } from "@/lib/store";
import { logAction } from "@/lib/audit";

export type FiadoResult = { ok: true } | { error: string };

export async function receiveFiado(fd: FormData): Promise<FiadoResult> {
  const name = String(fd.get("name") ?? "").trim().slice(0, 80);
  const method = String(fd.get("method") ?? "dinheiro");
  const amount = num(fd.get("amount"));

  if (!name) return { error: "Informe o cliente." };
  if (!Number.isFinite(amount) || amount <= 0) return { error: "Informe um valor válido." };

  const s = await getStore();
  if (!s) return { error: "Sessão expirada. Entre novamente." };

  // receive_fiado valida loja, valor e forma de pagamento no banco
  const { error } = await s.supabase.rpc("receive_fiado", {
    p_name: name,
    p_amount: amount,
    p_method: method,
  });
  if (error) return { error: "Não foi possível registrar o recebimento." };

  await logAction(s.supabase, s.storeId, "fiado.recebido", `${name} · R$ ${amount.toFixed(2)}`);

  revalidatePath("/fiado");
  revalidatePath("/fiado/[name]", "page");
  return { ok: true };
}
