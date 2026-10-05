import { createClient } from "@/lib/supabase/server";
import Pdv, { type Product } from "@/components/Pdv";
import { shortDate } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function NovaVenda() {
  const supabase = await createClient();
  const { data } = await supabase.from("products").select("id, name, price, categories(name, color)").eq("active", true).order("name");
  const products: Product[] = (data ?? []).map((p: { id: string; name: string; price: number; categories: { name: string; color: string } | { name: string; color: string }[] | null }) => {
    const c = Array.isArray(p.categories) ? p.categories[0] : p.categories;
    return { id: p.id, name: p.name, price: Math.round(Number(p.price) * 100), cat: c?.name ?? null, color: c?.color ?? null };
  });
  return <Pdv products={products} dateLabel={shortDate()} />;
}
