"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getAdminUserId, createStoreAccount, setStoreFrozen, deleteStoreAccount, resetStorePassword, isValidUsername, createAdminAccount } from "@/lib/admin";
import { exportStore, importStore, validateBackup } from "@/lib/backup";
import { isValidUUID, sanitizeText } from "@/lib/validation";

const str = (fd: FormData, k: string, max = 120) => sanitizeText(String(fd.get(k) ?? ""), max);

/** Garante que o chamador e admin; redireciona caso contrario. */
async function requireAdmin() {
  const adminId = await getAdminUserId();
  if (!adminId) redirect("/");
  return adminId;
}

export async function createAccess(fd: FormData) {
  await requireAdmin();

  const storeName = str(fd, "storeName", 80);
  const ownerName = str(fd, "ownerName", 80);
  const username = str(fd, "username", 30).toLowerCase();
  const password = String(fd.get("password") ?? "");

  if (!storeName || !ownerName) redirect("/admin/novo?erro=campos");
  if (!isValidUsername(username)) redirect("/admin/novo?erro=usuario");
  if (password.length < 6 || password.length > 128) redirect("/admin/novo?erro=senha");

  const res = await createStoreAccount({ storeName, ownerName, username, password });
  if (!res.ok) redirect(`/admin/novo?erro=${encodeURIComponent(res.error)}`);

  revalidatePath("/admin");
  redirect("/admin?ok=criado");
}

export async function freezeStore(storeId: string, fd: FormData) {
  await requireAdmin();
  if (!isValidUUID(storeId)) return;
  const reason = str(fd, "reason", 120);
  await setStoreFrozen(storeId, true, reason || undefined);
  revalidatePath("/admin");
  redirect("/admin?ok=congelado");
}

export async function unfreezeStore(storeId: string) {
  await requireAdmin();
  if (!isValidUUID(storeId)) return;
  await setStoreFrozen(storeId, false);
  revalidatePath("/admin");
  redirect("/admin?ok=descongelado");
}

export async function resetPassword(userId: string, fd: FormData) {
  await requireAdmin();
  if (!isValidUUID(userId)) return;
  const password = String(fd.get("password") ?? "");
  if (password.length < 6 || password.length > 128) redirect("/admin?erro=senha");
  await resetStorePassword(userId, password);
  revalidatePath("/admin");
  redirect("/admin?ok=senha");
}

export async function deleteStore(storeId: string) {
  await requireAdmin();
  if (!isValidUUID(storeId)) return;
  await deleteStoreAccount(storeId);
  revalidatePath("/admin");
  redirect("/admin?ok=excluido");
}

/** Cria um novo administrador do sistema. */
export async function createAdmin(fd: FormData) {
  await requireAdmin();

  const name = str(fd, "name", 80);
  const username = str(fd, "username", 30).toLowerCase();
  const password = String(fd.get("password") ?? "");

  if (!name) redirect("/admin/admins?erro=campos");
  if (!isValidUsername(username)) redirect("/admin/admins?erro=usuario");
  if (password.length < 6 || password.length > 128) redirect("/admin/admins?erro=senha");

  const res = await createAdminAccount({ name, username, password });
  if (!res.ok) redirect(`/admin/admins?erro=${encodeURIComponent(res.error)}`);

  revalidatePath("/admin/admins");
  redirect("/admin/admins?ok=criado");
}

/** Exporta os dados da loja como JSON (retorna a string para download). */
export async function exportStoreJson(storeId: string): Promise<{ ok: boolean; json?: string; filename?: string; error?: string }> {
  await requireAdmin();
  if (!isValidUUID(storeId)) return { ok: false, error: "Loja inválida." };
  const backup = await exportStore(storeId);
  if (!backup) return { ok: false, error: "Loja não encontrada." };
  const slug = backup.store.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "loja";
  const date = new Date().toISOString().slice(0, 10);
  return { ok: true, json: JSON.stringify(backup, null, 2), filename: `dalce-${slug}-${date}.json` };
}

/** Importa um backup (conteudo JSON) criando uma nova loja. */
export async function importStoreJson(fd: FormData) {
  await requireAdmin();

  const raw = String(fd.get("backup") ?? "");
  if (!raw) redirect("/admin/importar?erro=vazio");

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    redirect("/admin/importar?erro=json");
  }
  if (!validateBackup(parsed)) redirect("/admin/importar?erro=formato");

  const storeName = str(fd, "storeName", 80) || parsed.store.name;
  const ownerUsername = str(fd, "ownerUsername", 30).toLowerCase() || undefined;

  const res = await importStore(parsed, { storeName, ownerUsername });
  if (!res.ok) redirect(`/admin/importar?erro=${encodeURIComponent(res.error)}`);

  revalidatePath("/admin");
  redirect("/admin?ok=importado");
}
