import FiltersForm from "@/components/FiltersForm";
import { resolveRange } from "@/lib/range";

export default async function Filtros({ searchParams }: { searchParams: Promise<{ p?: string; de?: string; ate?: string }> }) {
  const sp = await searchParams;
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(new Date());
  const r = resolveRange(sp, today);
  return <FiltersForm today={today} initialPreset={r.preset} initialFrom={r.from} initialTo={r.to} />;
}
