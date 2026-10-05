export const brl = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
export const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const TZ = "America/Sao_Paulo";
export function nowParts() {
  const p = Object.fromEntries(
    new Intl.DateTimeFormat("pt-BR", { timeZone: TZ, weekday: "short", day: "numeric", month: "long" })
      .formatToParts(new Date()).map((x) => [x.type, x.value])
  );
  const num = new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
  const [y, m, d] = num.split("-");
  return {
    label: `${cap(p.weekday)}, ${Number(p.day)} de ${p.month}`,
    monthName: cap(p.month),
    dayStart: `${y}-${m}-${d}T00:00:00-03:00`,
    monthStart: `${y}-${m}-01T00:00:00-03:00`,
  };
}
