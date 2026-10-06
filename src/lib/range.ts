export const PRESETS = [
  ["hoje", "Hoje"], ["ontem", "Ontem"], ["semana", "Esta semana"], ["semana-passada", "Semana passada"],
  ["mes", "Este mês"], ["mes-passado", "Mês passado"], ["ano", "Este ano"], ["ano-passado", "Ano passado"],
] as const;

const dt = (s: string) => new Date(`${s}T12:00:00Z`);
export const add = (s: string, n: number) => { const x = dt(s); x.setUTCDate(x.getUTCDate() + n); return x.toISOString().slice(0, 10); };
export const days = (a: string, b: string) => Math.round((dt(b).getTime() - dt(a).getTime()) / 864e5) + 1;
export const br = (s: string) => `${s.slice(8)}/${s.slice(5, 7)}/${s.slice(0, 4)}`;

export function presetRange(p: string, t: string): { from: string; to: string } {
  const dow = (dt(t).getUTCDay() + 6) % 7; // semana começa na segunda
  const y = +t.slice(0, 4), mo = +t.slice(5, 7), ms = `${t.slice(0, 8)}01`;
  switch (p) {
    case "ontem": return { from: add(t, -1), to: add(t, -1) };
    case "semana": return { from: add(t, -dow), to: t };
    case "semana-passada": return { from: add(t, -dow - 7), to: add(t, -dow - 1) };
    case "mes": return { from: ms, to: t };
    case "mes-passado": return { from: mo === 1 ? `${y - 1}-12-01` : `${y}-${String(mo - 1).padStart(2, "0")}-01`, to: add(ms, -1) };
    case "ano": return { from: `${y}-01-01`, to: t };
    case "ano-passado": return { from: `${y - 1}-01-01`, to: `${y - 1}-12-31` };
    default: return { from: t, to: t };
  }
}

const OK = /^\d{4}-\d{2}-\d{2}$/;
export function resolveRange(sp: { p?: string; de?: string; ate?: string }, t: string) {
  let preset: string | null = null;
  let from: string, to: string;
  if (sp.de && sp.ate && OK.test(sp.de) && OK.test(sp.ate)) [from, to] = sp.de <= sp.ate ? [sp.de, sp.ate] : [sp.ate, sp.de];
  else { preset = PRESETS.some(([k]) => k === sp.p) ? (sp.p as string) : "hoje"; ({ from, to } = presetRange(preset, t)); }
  const n = days(from, to), prevTo = add(from, -1), prevFrom = add(prevTo, -(n - 1));
  const label = preset ? PRESETS.find(([k]) => k === preset)![1] : `${br(from)} – ${br(to)}`;
  const prevLabel = preset === "hoje" ? "ontem" : preset === "ontem" ? "anteontem" : "período anterior";
  return { preset, from, to, n, prevFrom, prevTo, label, prevLabel };
}
