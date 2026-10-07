import { add, br } from "@/lib/range";
const TZ = "America/Sao_Paulo";
const day = (iso: string | Date) => new Intl.DateTimeFormat("en-CA", { timeZone: TZ }).format(new Date(iso));
export const sinceLabel = (iso: string) => { const t = day(new Date()), d = day(iso); return d === t ? "hoje" : d === add(t, -1) ? "ontem" : br(d); };
export const esc = (s: string) => s.replace(/[%_\\]/g, "\\$&");

import type { SupabaseClient } from "@supabase/supabase-js";
import { days } from "@/lib/range";
export const ago = (iso: string) => { const n = days(day(iso), day(new Date())) - 1; return n <= 0 ? "hoje" : n === 1 ? "há 1 dia" : `há ${n} dias`; };
const COLORS = ["#15803d", "#1d4ed8", "#0e7490", "#be123c", "#b45309", "#4d7c0f"];
export const avatarColor = (n: string) => COLORS[[...n].reduce((h, c) => h + c.charCodeAt(0), 0) % COLORS.length];
/** saldo de fiado em aberto por cliente (chave = nome em minúsculas) */
export async function balances(supabase: SupabaseClient) {
  const [{ data: fp }, { data: rc }] = await Promise.all([
    supabase.from("sale_payments").select("amount, sales!inner(customer_name, status)").eq("method", "fiado").eq("sales.status", "finalizada"),
    supabase.from("fiado_receipts").select("customer_name, amount"),
  ]);
  const m = new Map<string, number>();
  for (const r of (fp ?? []) as { amount: number; sales: { customer_name: string | null } | { customer_name: string | null }[] }[]) {
    const s = Array.isArray(r.sales) ? r.sales[0] : r.sales, k = (s?.customer_name ?? "").trim().toLowerCase();
    if (k) m.set(k, (m.get(k) ?? 0) + Number(r.amount));
  }
  for (const r of (rc ?? []) as { customer_name: string; amount: number }[]) { const k = r.customer_name.trim().toLowerCase(); if (m.has(k)) m.set(k, (m.get(k) ?? 0) - Number(r.amount)); }
  return m;
}
