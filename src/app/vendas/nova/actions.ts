"use server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { fmtTime, saleCode } from "@/lib/format";
import { isValidUUID, sanitizeText, isValidPaymentMethod } from "@/lib/validation";

type Item = { productId?: string; name: string; qty: number; price: number };
type Pay = { method: string; amount: number };
type Result = { error: string } | { ok: true; code: string; time: string };
const r2 = (n: number) => Math.round(n * 100) / 100;

export async function createSale(input: { items: Item[]; payments: Pay[]; customer?: string; note?: string }): Promise<Result> {
  // --- auth ---
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Sessão expirada. Entre novamente." };
  const { data: profile } = await supabase.from("profiles").select("store_id, name").eq("id", user.id).single();
  if (!profile) return { error: "Perfil não encontrado." };
  const storeId = profile.store_id as string;

  // --- input shape validation ---
  if (!Array.isArray(input.items) || input.items.length === 0 || input.items.length > 200) return { error: "Carrinho inválido." };
  if (!Array.isArray(input.payments) || input.payments.length === 0 || input.payments.length > 10) return { error: "Pagamentos inválidos." };

  // --- validate each item ---
  for (const i of input.items) {
    if (i.productId !== undefined && i.productId !== null && i.productId !== "") {
      if (typeof i.productId !== "string" || !isValidUUID(i.productId)) return { error: "ID de produto inválido." };
    }
    if (typeof i.qty !== "number" || !Number.isFinite(i.qty) || i.qty < 1) return { error: "Quantidade inválida." };
    if (typeof i.price !== "number" || !Number.isFinite(i.price) || i.price < 0) return { error: "Preço inválido." };
  }

  // --- validate each payment ---
  for (const p of input.payments) {
    if (typeof p.method !== "string" || !isValidPaymentMethod(p.method)) return { error: `Método de pagamento inválido: ${sanitizeText(String(p.method), 20)}.` };
    if (typeof p.amount !== "number" || !Number.isFinite(p.amount) || p.amount <= 0) return { error: "Valor de pagamento inválido." };
  }

  // --- sanitize optional text fields ---
  const customerName = input.customer ? sanitizeText(String(input.customer), 80) : null;
  const note = input.note ? sanitizeText(String(input.note), 500) : null;

  // --- fetch products from DB and verify prices ---
  const ids = input.items.filter((i) => i.productId).map((i) => i.productId as string);
  const { data: prods } = ids.length
    ? await supabase.from("products").select("id, name, price, cost, store_id").in("id", ids).eq("store_id", storeId)
    : { data: [] };
  const map = new Map((prods ?? []).map((p: { id: string; name: string; price: number; cost: number; store_id: string }) => [p.id, p]));

  // Verify all referenced products were found (belongs to this store)
  for (const id of ids) {
    if (!map.has(id)) return { error: "Produto não encontrado ou não pertence a esta loja." };
  }

  let total = 0, cost = 0;
  const rows: { product_id: string | null; name: string; qty: number; total: number }[] = [];
  for (const i of input.items) {
    const qty = Math.max(1, Math.floor(i.qty));
    const p = i.productId ? map.get(i.productId) : null;
    // Price always comes from DB for registered products (defense against client-side tampering)
    const unit = p ? Number(p.price) : Number(i.price);
    if (!Number.isFinite(unit) || unit < 0) return { error: "Valor inválido." };
    const line = r2(unit * qty);
    total += line; cost += p ? Number(p.cost) * qty : 0;
    rows.push({ product_id: p ? p.id : null, name: p ? p.name : "Venda rápida", qty, total: line });
  }
  total = r2(total);
  const paid = r2(input.payments.reduce((s, p) => s + p.amount, 0));
  if (!rows.length || total <= 0) return { error: "Carrinho vazio." };
  if (input.payments.some((p) => !(p.amount > 0)) || Math.abs(paid - total) > 0.009) return { error: "Os pagamentos não fecham o total." };

  if (input.payments.some((p) => p.method === "fiado") && !customerName) return { error: "Identifique o cliente para vender no fiado." };
  const main = [...input.payments].sort((a, b) => b.amount - a.amount)[0];
  const { data: sale, error } = await supabase.from("sales").insert({
    store_id: storeId, total, cost: r2(cost), payment_method: main.method,
    customer_name: customerName || null, seller_name: profile.name, note: note || null,
  }).select("id, number, created_at").single();
  if (error || !sale) return { error: "Não foi possível salvar a venda." };

  const a = await supabase.from("sale_items").insert(rows.map((r) => ({ ...r, sale_id: sale.id, store_id: storeId })));
  const b = await supabase.from("sale_payments").insert(input.payments.map((p) => ({ method: p.method, amount: r2(p.amount), sale_id: sale.id, store_id: storeId })));
  if (customerName) {
    const escaped = customerName.replace(/[%_\\]/g, "\\$&");
    const { data: ex } = await supabase.from("customers").select("id").eq("store_id", storeId).ilike("name", escaped).maybeSingle();
    if (!ex) await supabase.from("customers").insert({ store_id: storeId, name: customerName });
  }
  const stock = rows.filter((r) => r.product_id).map((r) => ({ productId: r.product_id, qty: r.qty }));
  const c = stock.length ? await supabase.rpc("apply_stock", { items: stock }) : { error: null };
  if (a.error || b.error || c.error) return { error: "Venda salva, mas houve erro nos itens ou pagamentos." };

  revalidatePath("/"); revalidatePath("/vendas");
  return { ok: true, code: saleCode(sale.number), time: fmtTime(sale.created_at) };
}
