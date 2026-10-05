export const brl = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const TZ = "America/Sao_Paulo";
export function nowParts() {
  const p = Object.fromEntries(
    new Intl.DateTimeFormat("pt-BR", { timeZone: TZ, weekday: "short", day: "numeric", month: "long", year: "numeric", hour: "numeric", hourCycle: "h23" })
      .formatToParts(new Date()).map((x) => [x.type, x.value])
  );
  const num = new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date()); // YYYY-MM-DD
  const [y, m, d] = num.split("-");
  return {
    hour: Number(p.hour),
    label: `${p.weekday} ${Number(p.day)} de ${p.month}`,
    dayStart: `${y}-${m}-${d}T00:00:00-03:00`,
    monthStart: `${y}-${m}-01T00:00:00-03:00`,
  };
}
