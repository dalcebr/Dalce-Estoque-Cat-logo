import { add, br } from "@/lib/range";
const TZ = "America/Sao_Paulo";
const day = (iso: string | Date) => new Intl.DateTimeFormat("en-CA", { timeZone: TZ }).format(new Date(iso));
export const sinceLabel = (iso: string) => { const t = day(new Date()), d = day(iso); return d === t ? "hoje" : d === add(t, -1) ? "ontem" : br(d); };
export const esc = (s: string) => s.replace(/[%_\\]/g, "\\$&");
