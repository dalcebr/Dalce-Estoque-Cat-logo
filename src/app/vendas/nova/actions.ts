"use server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { fmtTime, saleCode } from "@/lib/format";

type Item = { productId?: string; name: string; qty: number; price: number };
type Pay = { method: string; amount: number };
type Result = { error: string } | { ok: true; code: string; time: string };
const r2 = (n: number) => Math.round(n * 100) / 100;

export async function createSale(input: { items: Item[]; payments: Pay[]; customer?: string; note?: string }): Promise<Result> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Sessão expirada. Entre novamente." };
  const { data: profile } = await supabase.from("profiles").select("store_id, name").eq("id", user.id).single();
  if (!profile) return { error: "Perfil não encontrado." };

  const ids = input.items.filter((i) => i.productId).map((i) => i.productId as string);
  const { data: prods } = ids.length ? await supabase.from("products").select("id, name, price, cost").in("id", ids) : { data: [] };
  const map = new Map((prods ?? []).map((p: { id: string; name: string; price: number; cost: number }) => [p.id, p]));

  let total = 0, cost = 0;
  const rows: { product_id: string | null; name: string; qty: number; total: number }[] = [];
  for (const i of input.items) {
    const qty = Math.max(1, Math.floor(i.qty));
    const p = i.productId ? map.get(i.productId) : null;
    if (i.productId && !p) return { error: "Produto não encontrado." };
    const unit = p ? Number(p.price) : Number(i.price); // preço sempre vem do banco quando há produto
    if (!Number.isFinite(unit) || unit < 0) return { error: "Valor inválido." };
    const line = r2(unit * qty);
    total += line; cost += p ? Number(p.cost) * qty : 0;
    rows.push({ product_id: p ? p.id : null, name: p ? p.name : "Venda rápida", qty, total: line });
  }
  total = r2(total);
  const paid = r2(input.payments.reduce((s, p) => s + p.amount, 0));
  if (!rows.length || total <= 0) return { error: "Carrinho vazio." };
  if (input.payments.some((p) => !(p.amount > 0)) || Math.abs(paid - total) > 0.009) return { error: "Os pagamentos não fecham o total." };

  if (input.payments.some((p) => p.method === "fiado") && !input.customer?.trim()) return { error: "Identifique o cliente para vender no fiado." };
  const main = [...input.payments].sort((a, b) => b.amount - a.amount)[0];
  const { data: sale, error } = await supabase.from("sales").insert({
    store_id: profile.store_id, total, cost: r2(cost), payment_method: main.method,
    customer_name: input.customer?.trim() || null, seller_name: profile.name, note: input.note?.trim() || null,
  }).select("id, number, created_at").single();
  if (error || !sale) return { error: "Não foi possível salvar a venda." };

  const sid = profile.store_id;
  const a = await supabase.from("sale_items").insert(rows.map((r) => ({ ...r, sale_id: sale.id, store_id: sid })));
  const b = await supabase.from("sale_payments").insert(input.payments.map((p) => ({ method: p.method, amount: r2(p.amount), sale_id: sale.id, store_id: sid })));
  const cname = input.customer?.trim();
  if (cname) {
    const { data: ex } = await supabase.from("customers").select("id").ilike("name", cname.replace(/[%_\\]/g, "\\$&")).maybeSingle();
    if (!ex) await supabase.from("customers").insert({ store_id: sid, name: cname });
  }
  const stock = rows.filter((r) => r.product_id).map((r) => ({ productId: r.product_id, qty: r.qty }));
  const c = stock.length ? await supabase.rpc("apply_stock", { items: stock }) : { error: null };
  if (a.error || b.error || c.error) return { error: "Venda salva, mas houve erro nos itens ou pagamentos." };

  revalidatePath("/"); revalidatePath("/vendas");
  return { ok: true, code: saleCode(sale.number), time: fmtTime(sale.created_at) };
}
