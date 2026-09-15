"use client";

import { flowLabel, flowStyle, chartColor, fmt } from "@/lib/rtlca/util";
import { useRtlca } from "@/lib/rtlca/store";

export function ProcessMap() {
  const procs = useRtlca((s) => s.procs);
  const inputs = useRtlca((s) => s.inputs);
  const live = useRtlca((s) => s.live);
  const setProcOpen = useRtlca((s) => s.setProcOpen);
  const nP = procs.length;
  if (!nP) {
    return (
      <div className="flex h-full min-h-64 items-center justify-center text-sm text-muted">
        Add unit processes in Step 2 to see the system map.
      </div>
    );
  }
  const width = Math.max(640, nP * 220 + 80);
  const height = 340;
  return (
    <div className="h-full min-h-64 overflow-x-auto">
      <svg viewBox={`0 0 ${width} ${height}`} className="h-full min-h-64 w-full min-w-[640px]" role="img" aria-label="Unit process map">
        <text x={16} y={22} className="fill-muted" fontSize="11">
          Unit processes (flow order) — click a block to inspect. RT blue, static grey, quasi-static dashed, dynamic dash-dot.
        </text>
        {procs.map((name, p) => {
          const x = 50 + p * 220;
          const y = 150;
          const w = 168;
          const h = 78;
          const alarm = live?.alarmProcs[p];
          const ins = inputs.map((f, i) => ({ f, i })).filter((x) => x.f.proc === p && x.f.dir === "Input");
          const outs = inputs.map((f, i) => ({ f, i })).filter((x) => x.f.proc === p && x.f.dir === "Output");
          const imp = live ? live.procImp[p] : null;
          return (
            <g key={p}>
              {ins.map((it, k) => {
                const fx = x + 20 + (k * (w - 40)) / Math.max(ins.length, 1);
                const st = flowStyle(it.f.dataType);
                return (
                  <g key={it.i} onClick={() => setProcOpen(p)} className="cursor-pointer">
                    <line x1={fx} y1={48} x2={fx} y2={y} stroke={st.color} strokeWidth={st.width} strokeDasharray={st.dash || undefined} />
                    <polygon points={`${fx},${y} ${fx - 5},${y - 10} ${fx + 5},${y - 10}`} fill={st.color} />
                    <text x={fx + 6} y={58} fontSize="10" fill={st.color} transform={`rotate(-55 ${fx + 6} 58)`}>
                      {flowLabel(it.f)}
                    </text>
                  </g>
                );
              })}
              {outs.map((it, k) => {
                const fx = x + 20 + (k * (w - 40)) / Math.max(outs.length, 1);
                const st = flowStyle(it.f.dataType);
                return (
                  <g key={it.i} onClick={() => setProcOpen(p)} className="cursor-pointer">
                    <line x1={fx} y1={y + h} x2={fx} y2={y + h + 42} stroke={st.color} strokeWidth={st.width} strokeDasharray={st.dash || undefined} />
                    <polygon points={`${fx},${y + h + 48} ${fx - 5},${y + h + 38} ${fx + 5},${y + h + 38}`} fill={st.color} />
                    <text x={fx + 6} y={y + h + 62} fontSize="10" fill={st.color} transform={`rotate(55 ${fx + 6} ${y + h + 62})`}>
                      {flowLabel(it.f)}
                    </text>
                  </g>
                );
              })}
              <g onClick={() => setProcOpen(p)} className="cursor-pointer">
                <rect
                  x={x}
                  y={y}
                  width={w}
                  height={h}
                  rx={10}
                  fill="var(--color-surface)"
                  stroke={alarm ? "var(--color-stop)" : chartColor(p)}
                  strokeWidth={alarm ? 3 : 2}
                />
                <text x={x + w / 2} y={y + 28} textAnchor="middle" fontSize="13" fontWeight="600" fill="var(--color-fg)">
                  {name}
                </text>
                <text x={x + w / 2} y={y + 52} textAnchor="middle" fontSize="12" fontWeight="600" fill="var(--color-kpi-2)">
                  impact: {imp == null ? "—" : fmt(imp, 4)}
                </text>
              </g>
              {p < nP - 1 && (
                <g>
                  <line x1={x + w} y1={y + h / 2} x2={x + 220 - 8} y2={y + h / 2} stroke="var(--color-fg)" strokeWidth={2} />
                  <polygon
                    points={`${x + 220},${y + h / 2} ${x + 220 - 10},${y + h / 2 - 5} ${x + 220 - 10},${y + h / 2 + 5}`}
                    fill="var(--color-fg)"
                  />
                </g>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}
