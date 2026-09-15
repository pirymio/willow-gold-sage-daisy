import { chartColor, fmt, trunc } from "@/lib/rtlca/util";

export function Gauge({
  title,
  values,
  names,
  max,
  readout,
}: {
  title: string;
  values: number[];
  names: string[];
  max: number;
  readout: string;
}) {
  const rng = max > 0 ? max : 1;
  const ticks = [0, 0.25, 0.5, 0.75, 1];
  const segs = [
    { a0: 0, a1: 0.5, c: "var(--color-go)" },
    { a0: 0.5, a1: 0.8, c: "var(--color-warn)" },
    { a0: 0.8, a1: 1, c: "var(--color-stop)" },
  ];
  const arc = (t0: number, t1: number, r: number) => {
    const a0 = Math.PI * (1 - t0);
    const a1 = Math.PI * (1 - t1);
    const x0 = 80 + r * Math.cos(a0);
    const y0 = 88 - r * Math.sin(a0);
    const x1 = 80 + r * Math.cos(a1);
    const y1 = 88 - r * Math.sin(a1);
    const large = t1 - t0 > 0.5 ? 1 : 0;
    return `M ${x0} ${y0} A ${r} ${r} 0 ${large} 1 ${x1} ${y1}`;
  };
  return (
    <div className="flex min-h-0 flex-col">
      <p className="text-center font-mono text-2xl font-medium tabular-nums text-kpi-2">{readout}</p>
      <svg viewBox="0 0 160 132" className="mx-auto h-48 w-full max-w-xs">
        {segs.map((s) => (
          <path key={s.a0} d={arc(s.a0, s.a1, 62)} fill="none" stroke={s.c} strokeWidth="7" strokeLinecap="butt" />
        ))}
        {ticks.map((t) => {
          const a = Math.PI * (1 - t);
          const x0 = 80 + 54 * Math.cos(a);
          const y0 = 88 - 54 * Math.sin(a);
          const x1 = 80 + 66 * Math.cos(a);
          const y1 = 88 - 66 * Math.sin(a);
          const lx = 80 + 74 * Math.cos(a);
          const ly = 88 - 74 * Math.sin(a);
          return (
            <g key={t}>
              <line x1={x0} y1={y0} x2={x1} y2={y1} stroke="var(--color-fg)" strokeWidth="1" />
              <text x={lx} y={ly + 3} textAnchor="middle" fontSize="8" fill="var(--color-muted)">
                {fmt(t * rng, 3)}
              </text>
            </g>
          );
        })}
        {values.map((v, i) => {
          const f = Math.max(0, Math.min(1, v / rng));
          const a = Math.PI * (1 - f);
          const L = Math.max(28, 54 - 10 * i);
          const x = 80 + L * Math.cos(a);
          const y = 88 - L * Math.sin(a);
          const c = chartColor(i);
          return (
            <g key={i}>
              <line x1={80} y1={88} x2={x} y2={y} stroke={c} strokeWidth="3.5" />
              <circle cx={x} cy={y} r="3.5" fill={c} />
            </g>
          );
        })}
        <circle cx={80} cy={88} r="3.5" fill="var(--color-fg)" />
        <text x={80} y={124} textAnchor="middle" fontSize="10" fill="var(--color-muted)">
          {title}
        </text>
      </svg>
      <ul className="space-y-0.5 px-3 text-xs">
        {names.map((n, i) => (
          <li key={i} className="flex justify-between gap-2 font-mono tabular-nums" style={{ color: chartColor(i) }}>
            <span className="truncate">{trunc(n, 18)}</span>
            <span>{fmt(values[i] ?? 0, 4)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
