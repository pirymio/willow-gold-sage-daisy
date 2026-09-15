"use client";

import type { ReactNode } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { TAB_NAMES } from "@/lib/rtlca/types";
import { useRtlca } from "@/lib/rtlca/store";
import { chartColor, fmt, trunc } from "@/lib/rtlca/util";
import { ProcessMap } from "./ProcessMap";
import { Gauge } from "./Gauges";
import { cn } from "@/lib/utils";

const tip = {
  contentStyle: {
    background: "var(--color-surface)",
    border: "1px solid var(--color-border)",
    borderRadius: 8,
    fontSize: 12,
  },
};

export function ResultTabs() {
  const tab = useRtlca((s) => s.tab);
  const setTab = useRtlca((s) => s.setTab);
  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col">
      <div className="flex gap-1 overflow-x-auto px-1">
        {TAB_NAMES.map((name, i) => (
          <button
            key={name}
            type="button"
            onClick={() => setTab(i)}
            className={cn(
              "h-10 min-h-10 shrink-0 rounded-t-md px-4 text-xs font-semibold tracking-wide",
              i === tab
                ? "bg-surface text-primary shadow-[var(--shadow-border)]"
                : "bg-transparent text-muted hover:text-fg",
            )}
          >
            {name}
          </button>
        ))}
      </div>
      <div className="min-h-0 flex-1 overflow-auto rounded-b-lg rounded-tr-lg bg-surface p-3 shadow-[var(--shadow-border)] md:p-4">
        {tab === 0 && <MapTab />}
        {tab === 1 && <ImpactTab />}
        {tab === 2 && <EnergyTab />}
        {tab === 3 && <ParetoTab />}
        {tab === 4 && <LccTab />}
        {tab === 5 && <CedTab />}
      </div>
    </div>
  );
}

function MapTab() {
  const log = useRtlca((s) => s.log);
  return (
    <div className="grid h-full min-h-[520px] grid-rows-[minmax(240px,1fr)_220px] gap-3">
      <ProcessMap />
      <pre className="overflow-auto rounded-md bg-header p-3 font-mono text-[11px] leading-relaxed text-header-fg">
        {log.join("\n")}
      </pre>
    </div>
  );
}

function ImpactTab() {
  const live = useRtlca((s) => s.live);
  const soglia = useRtlca((s) => s.soglia);
  const staticLca = useRtlca((s) => s.staticLca);
  const series = live?.series ?? [];
  const inst = series.map((p) => ({ t: p.t, inst: p.inst, hot: p.hot ? p.inst : null, thr: soglia || null }));
  const cum = series.map((p) => ({ t: p.t, cum: p.cum, stat: staticLca || null }));
  const nRt = live?.rtNames.length ?? 0;
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div>
        {nRt > 0 && live ? (
          <Gauge
            title="RT cumulative impact"
            values={live.gaugeCum}
            names={live.rtNames}
            max={live.gaugeMaxCum}
            readout={fmt(live.gaugeCum.reduce((a, b) => a + b, 0), 5)}
          />
        ) : (
          <EmptyChart label="Cumulative RT impact" />
        )}
      </div>
      <div>
        {nRt > 0 && live ? (
          <Gauge
            title="RT instantaneous impact"
            values={live.gaugeInst}
            names={live.rtNames}
            max={live.gaugeMaxInst}
            readout={fmt(live.gaugeInst.reduce((a, b) => a + b, 0), 5)}
          />
        ) : (
          <EmptyChart label="Instantaneous RT impact" />
        )}
      </div>
      <ChartCard title="Instantaneous impact + threshold">
        <ResponsiveContainer width="100%" height={240}>
          <LineChart data={inst} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
            <CartesianGrid stroke="var(--color-border)" strokeDasharray="3 3" />
            <XAxis dataKey="t" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip {...tip} />
            <Line type="monotone" dataKey="inst" name="TOTAL" stroke="var(--color-fg)" dot={false} strokeWidth={2} />
            {soglia > 0 && <Line type="monotone" dataKey="thr" name="threshold" stroke="var(--color-stop)" dot={false} strokeDasharray="4 4" />}
            <Line type="monotone" dataKey="hot" name="hotspot" stroke="var(--color-stop)" dot={{ r: 3 }} strokeWidth={0} />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>
      <ChartCard title="Cumulative impact vs static LCA">
        <ResponsiveContainer width="100%" height={240}>
          <LineChart data={cum} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
            <CartesianGrid stroke="var(--color-border)" strokeDasharray="3 3" />
            <XAxis dataKey="t" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip {...tip} />
            <Line type="monotone" dataKey="cum" name="RT-LCA" stroke="var(--color-kpi-2)" dot={false} strokeWidth={2} />
            {staticLca > 0 && <Line type="monotone" dataKey="stat" name="static LCA" stroke="var(--color-muted)" dot={false} />}
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  );
}

function EnergyTab() {
  const live = useRtlca((s) => s.live);
  const inputs = useRtlca((s) => s.inputs);
  const mix = useRtlca((s) => s.mix);
  const hist = live?.valHistory ?? [];
  const valData = hist.map((h) => {
    const row: Record<string, number> = { tg: h.tg };
    h.vals.forEach((v, i) => {
      row[`f${i}`] = v;
    });
    return row;
  });
  const eIns = (live?.series ?? []).map((p) => {
    const row: Record<string, number> = { t: p.t };
    p.eIns.forEach((v, i) => {
      row[`e${i}`] = v;
    });
    return row;
  });
  const lastShare = live?.mixShare ?? [];
  const mixData = (mix?.src ?? []).map((src, i) => ({
    name: trunc(src, 10),
    share: (lastShare[i] ?? 0) * 100,
  }));
  return (
    <div className="grid gap-4">
      <ChartCard title="Values instant by instant (cycles are appended)">
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={valData} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
            <CartesianGrid stroke="var(--color-border)" strokeDasharray="3 3" />
            <XAxis dataKey="tg" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip {...tip} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            {inputs.map((f, i) => (
              <Line
                key={f.id}
                type="monotone"
                dataKey={`f${i}`}
                name={`#${i + 1} ${trunc(f.nome, 16)} (${f.dataType})`}
                stroke={chartColor(i)}
                dot={f.dataType === "real-time"}
                strokeWidth={f.dataType === "static" ? 2.2 : 1.4}
                strokeDasharray={f.dataType === "quasi-static" ? "6 4" : f.dataType === "dynamic" ? "3 3" : undefined}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>
      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard title="Instantaneous energy (sample-and-hold)">
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={eIns} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
              <CartesianGrid stroke="var(--color-border)" strokeDasharray="3 3" />
              <XAxis dataKey="t" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip {...tip} />
              {(live?.rtNames ?? []).map((n, i) => (
                <Line key={n} type="stepAfter" dataKey={`e${i}`} name={n} stroke={chartColor(i)} dot={{ r: 2 }} strokeWidth={1.4} />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard title={live?.mixLabel ? `Italian grid mix @ ${live.mixLabel}` : "Italian grid mix"}>
          {mixData.length ? (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={mixData} margin={{ top: 8, right: 12, left: 0, bottom: 8 }}>
                <CartesianGrid stroke="var(--color-border)" strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} interval={0} angle={-20} textAnchor="end" height={48} />
                <YAxis domain={[0, 60]} tick={{ fontSize: 11 }} />
                <Tooltip {...tip} />
                <Bar dataKey="share" name="share %" fill="var(--color-primary)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyChart label="Load the Terna mix in Step 5" />
          )}
        </ChartCard>
      </div>
    </div>
  );
}

function ParetoTab() {
  const live = useRtlca((s) => s.live);
  const procs = useRtlca((s) => s.procs);
  const inputs = useRtlca((s) => s.inputs);
  const cat = useRtlca((s) => s.db?.colLabels[s.impactCat] ?? "impact");
  const data = procs.map((name, p) => {
    const row: Record<string, string | number> = { name };
    inputs.forEach((f, i) => {
      if (f.proc === p) row[`f${i}`] = Math.abs(live?.flowImp[i] ?? 0);
    });
    return row;
  });
  return (
    <div className="flex h-full flex-col gap-2">
      {live?.alarm ? <p className="text-sm font-semibold text-stop">{live.alarm}</p> : null}
      {live?.dq ? <p className="text-sm font-medium text-warn">{live.dq}</p> : null}
      <ChartCard title={`Contribution analysis per unit process — ${trunc(cat, 60)}`}>
        <ResponsiveContainer width="100%" height={420}>
          <BarChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 8 }}>
            <CartesianGrid stroke="var(--color-border)" strokeDasharray="3 3" />
            <XAxis dataKey="name" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip {...tip} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            {inputs.map((f, i) => (
              <Bar key={f.id} dataKey={`f${i}`} stackId="a" name={`#${i + 1} ${trunc(f.nome, 18)}`} fill={chartColor(i)} />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  );
}

function LccTab() {
  const live = useRtlca((s) => s.live);
  const procs = useRtlca((s) => s.procs);
  const inputs = useRtlca((s) => s.inputs);
  const data = procs.map((name, p) => {
    const st = live?.costStack[p];
    const row: Record<string, string | number> = { name };
    inputs.forEach((f, i) => {
      if (f.proc === p) row[`f${i}`] = st?.flowCosts[i] ?? 0;
    });
    row.capex = st?.capex ?? 0;
    row.labour = st?.labour ?? 0;
    row.opex = st?.opex ?? 0;
    row.carbon = st?.carbon ?? 0;
    return row;
  });
  const cum = (live?.series ?? []).map((p) => ({ t: p.t, cost: p.cost, energy: p.costE }));
  return (
    <div className="grid gap-4">
      <ChartCard title="Real-time LCC: cost per unit process [EUR], split by cost item">
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 8 }}>
            <CartesianGrid stroke="var(--color-border)" strokeDasharray="3 3" />
            <XAxis dataKey="name" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip {...tip} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            {inputs.map((f, i) => (
              <Bar key={f.id} dataKey={`f${i}`} stackId="c" name={trunc(f.nome, 16)} fill={chartColor(i)} />
            ))}
            <Bar dataKey="capex" stackId="c" name="capital" fill="var(--color-muted)" />
            <Bar dataKey="labour" stackId="c" name="labour" fill="var(--color-subtle)" />
            <Bar dataKey="opex" stackId="c" name="other OPEX" fill="var(--color-border)" />
            <Bar dataKey="carbon" stackId="c" name="carbon cost" fill="var(--color-go)" />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>
      <ChartCard title="Cumulative cost of the cycle [EUR]">
        <ResponsiveContainer width="100%" height={240}>
          <LineChart data={cum} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
            <CartesianGrid stroke="var(--color-border)" strokeDasharray="3 3" />
            <XAxis dataKey="t" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip {...tip} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Line type="monotone" dataKey="cost" name="total cost" stroke="var(--color-kpi-5)" dot={false} strokeWidth={2} />
            <Line type="monotone" dataKey="energy" name="energy cost" stroke="var(--color-chart-6)" dot={false} strokeWidth={1.4} />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  );
}

function CedTab() {
  const live = useRtlca((s) => s.live);
  const procs = useRtlca((s) => s.procs);
  const data = procs.map((name, p) => ({
    name,
    nr: live?.cedP[p]?.[0] ?? 0,
    r: live?.cedP[p]?.[1] ?? 0,
  }));
  const cum = (live?.series ?? []).map((p) => ({ t: p.t, ced: p.ced, r: p.cedR }));
  const tot = live ? live.cedP.reduce((a, c) => a + c[0] + c[1], 0) : 0;
  const rshare = tot > 0 && live ? (100 * live.cedP.reduce((a, c) => a + c[1], 0)) / tot : 0;
  return (
    <div className="grid gap-4">
      <p className="text-center text-xl font-medium tabular-nums text-dynamic">
        {tot ? `CED total: ${fmt(tot, 4)} MJ   |   renewable share ${rshare.toFixed(0)}%` : "CED: —"}
      </p>
      <ChartCard title="Cumulative Energy Demand per unit process [MJ]: non-renewable vs renewable">
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 8 }}>
            <CartesianGrid stroke="var(--color-border)" strokeDasharray="3 3" />
            <XAxis dataKey="name" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip {...tip} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Bar dataKey="nr" stackId="e" name="non-renewable" fill="var(--color-dynamic)" />
            <Bar dataKey="r" stackId="e" name="renewable" fill="var(--color-go)" />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>
      <ChartCard title="Cumulative CED of the cycle [MJ]">
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={cum} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
            <CartesianGrid stroke="var(--color-border)" strokeDasharray="3 3" />
            <XAxis dataKey="t" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip {...tip} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Line type="monotone" dataKey="ced" name="CED total" stroke="var(--color-dynamic)" dot={false} strokeWidth={2} />
            <Line type="monotone" dataKey="r" name="renewable part" stroke="var(--color-go)" dot={false} strokeWidth={1.4} />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  );
}

function ChartCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="min-w-0">
      <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">{title}</h3>
      <div className="min-h-[200px]">{children}</div>
    </div>
  );
}

function EmptyChart({ label }: { label: string }) {
  return <div className="flex h-48 items-center justify-center text-sm text-muted">{label}</div>;
}
