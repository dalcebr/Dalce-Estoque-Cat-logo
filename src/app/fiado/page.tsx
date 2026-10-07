import { createClient } from "@/lib/supabase/server";
import FiadoView, { type FiadoRow } from "@/components/FiadoView";
import { sinceLabel } from "@/lib/fiado";

export const dynamic = "force-dynamic";
type Sale = { customer_name: string | null; created_at: string };

export default async function Fiado() {
  const supabase = await createClient();
  const [{ data: fp }, { data: rc }] = await Promise.all([
    supabase.from("sale_payments").select("amount, sales!inner(customer_name, status, created_at)").eq("method", "fiado").eq("sales.status", "finalizada"),
    supabase.from("fiado_receipts").select("customer_name, amount"),
  ]);
  const map = new Map<string, { name: string; bal: number; since: string }>();
  for (const r of (fp ?? []) as { amount: number; sales: Sale | Sale[] }[]) {
    const s = Array.isArray(r.sales) ? r.sales[0] : r.sales;
    const name = (s?.customer_name ?? "").trim();
    if (!name) continue;
    const k = name.toLowerCase(), e = map.get(k) ?? { name, bal: 0, since: s.created_at };
    e.bal += Number(r.amount); if (s.created_at < e.since) e.since = s.created_at;
    map.set(k, e);
  }
  for (const r of (rc ?? []) as { customer_name: string; amount: number }[]) { const e = map.get(r.customer_name.trim().toLowerCase()); if (e) e.bal -= Number(r.amount); }
  const rows: FiadoRow[] = [...map.values()].filter((e) => Math.abs(e.bal) > 0.004).sort((a, b) => b.bal - a.bal).map((e) => ({ name: e.name, balance: Math.round(e.bal * 100) / 100, since: sinceLabel(e.since) }));
  return <FiadoView rows={rows} />;
}
