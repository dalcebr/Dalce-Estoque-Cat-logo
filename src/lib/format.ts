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

const T = "America/Sao_Paulo";
export const saleCode = (n: number | null) => `#${n ?? 0}A`;
export const fmtTime = (iso: string) => new Date(iso).toLocaleTimeString("pt-BR", { timeZone: T, hour: "2-digit", minute: "2-digit", hourCycle: "h23" });
export const fmtDateTime = (iso: string) =>
  new Date(iso).toLocaleString("pt-BR", { timeZone: T, day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).replace(", ", " ");
export function shortToday() {
  const p = Object.fromEntries(new Intl.DateTimeFormat("pt-BR", { timeZone: T, day: "2-digit", month: "short" }).formatToParts(new Date()).map((x) => [x.type, x.value]));
  return `${p.day} ${p.month.replace(".", "").toUpperCase()}`;
}

export function shortDate() {
  const p = Object.fromEntries(new Intl.DateTimeFormat("pt-BR", { timeZone: "America/Sao_Paulo", weekday: "short", day: "numeric", month: "short" }).formatToParts(new Date()).map((x) => [x.type, x.value]));
  return `${cap(p.weekday.replace(".", ""))}, ${p.day} ${p.month.replace(".", "")}`;
}
