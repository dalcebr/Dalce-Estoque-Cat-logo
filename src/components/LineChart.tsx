type Props = { labels: string[]; cur: number[]; prev: number[]; curName: string; prevName: string };
const W = 340, H = 190, L = 46, R = 326, T = 10, B = 160;

function nice(max: number) {
  if (max <= 0) return { top: 40, step: 10 };
  const raw = max / 4, mag = 10 ** Math.floor(Math.log10(raw)), f = raw / mag;
  const s = (f <= 1 ? 1 : f <= 2 ? 2 : f <= 5 ? 5 : 10) * mag;
  return { top: s * 4, step: s };
}
const smooth = (p: [number, number][]) => p.reduce((d, [x, y], i) => {
  if (i === 0) return `M${x},${y}`;
  const [px, py] = p[i - 1], mx = (px + x) / 2;
  return `${d} C${mx},${py} ${mx},${y} ${x},${y}`;
}, "");

export default function LineChart({ labels, cur, prev, curName, prevName }: Props) {
  const n = labels.length;
  const { top, step } = nice(Math.max(...cur, ...prev, 0));
  const x = (i: number) => (n === 1 ? (L + R) / 2 : L + (i * (R - L)) / (n - 1));
  const y = (v: number) => B - (v / top) * (B - T);
  const pts = (a: number[]) => a.map((v, i) => [x(i), y(v)] as [number, number]);
  const c = pts(cur), p = pts(prev);
  const tickIdx = [...new Set([0, 1, 2, 3, 4].map((k) => Math.round((k * (n - 1)) / 4)))];
  return (
    <div>
      <div className="mb-2 flex justify-center gap-6 text-sm font-semibold text-soft">
        <span className="flex items-center gap-2"><i className="size-3 rounded-full bg-brand" />{prevName}</span>
        <span className="flex items-center gap-2"><i className="size-3 rounded-full bg-green-700" />{curName}</span>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="Gráfico de vendas no período">
        {[0, 1, 2, 3, 4].map((k) => (
          <g key={k}>
            <line x1={L} x2={R} y1={y(k * step)} y2={y(k * step)} stroke="#e8e8ee" />
            <text x={L - 8} y={y(k * step) + 4} textAnchor="end" fontSize="10" fill="#6b6f80">R$ {k * step}</text>
          </g>))}
        <path d={`${smooth(c)} L${x(n - 1)},${B} L${x(0)},${B}Z`} fill="#15803d" opacity=".12" />
        <path d={smooth(p)} fill="none" stroke="#1d4ed8" strokeWidth="2" />
        <path d={smooth(c)} fill="none" stroke="#15803d" strokeWidth="2.5" />
        {c.map(([cx, cy], i) => cur[i] > 0 && <circle key={i} cx={cx} cy={cy} r="3" fill="#15803d" />)}
        {tickIdx.map((i) => <text key={i} x={x(i)} y={B + 18} textAnchor="middle" fontSize="10" fill="#6b6f80">{labels[i]}</text>)}
      </svg>
    </div>
  );
}
