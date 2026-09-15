"use client";

import { fmt } from "@/lib/rtlca/util";
import { useRtlca } from "@/lib/rtlca/store";
import { Workflow } from "./Workflow";
import { ResultTabs } from "./Charts";
import { Dialogs } from "./Dialogs";
import { cn } from "@/lib/utils";

export function AppShell() {
  const status = useRtlca((s) => s.status);
  const campaign = useRtlca((s) => s.campaign);
  const expN = useRtlca((s) => s.expN);
  const live = useRtlca((s) => s.live);
  const staticLca = useRtlca((s) => s.staticLca);
  const configDone = useRtlca((s) => s.configDone);
  const delta =
    live && staticLca > 0 ? `${live.cumTot - staticLca >= 0 ? "+" : ""}${((100 * (live.cumTot - staticLca)) / staticLca).toFixed(1)}%` : "—";
  const kpis = [
    { label: "Instantaneous impact", value: live ? fmt(live.instTot) : "—", color: "text-kpi-1" },
    { label: "Cumulative impact", value: live ? fmt(live.cumTot) : "—", color: "text-kpi-2" },
    { label: "Delta% vs static LCA", value: delta, color: "text-kpi-3" },
    { label: "Hotspots detected", value: live ? String(live.hotN) : "—", color: live && live.hotN > 0 ? "text-kpi-4" : "text-fg" },
    { label: "Cumulative cost [EUR]", value: live ? live.costTot.toFixed(2) : "—", color: "text-kpi-5" },
  ];
  return (
    <div className="flex min-h-dvh flex-col bg-bg text-fg">
      <header className="flex flex-wrap items-center justify-between gap-2 bg-header px-4 py-3 text-header-fg">
        <div className="min-w-0">
          <h1 className="text-base font-semibold tracking-tight md:text-lg">RT-LCA / LCC process dashboard</h1>
          <p className="text-[11px] text-header-muted md:text-xs">
            Real-time life cycle assessment & costing of unit processes · ISO 14040/14044
          </p>
        </div>
        <p className="font-mono text-xs tabular-nums">
          {configDone ? `${campaign} — cycle ${expN}` : "no campaign"}
        </p>
      </header>
      <div className="grid grid-cols-2 gap-2 px-3 py-2 md:grid-cols-5">
        {kpis.map((k) => (
          <article key={k.label} className="rounded-md bg-surface px-3 py-2 shadow-[var(--shadow-border)]">
            <p className="text-[10px] font-medium uppercase tracking-wide text-subtle">{k.label}</p>
            <p className={cn("font-mono text-lg font-semibold tabular-nums md:text-xl", k.color)}>{k.value}</p>
          </article>
        ))}
      </div>
      <p className="px-4 pb-2 text-sm text-muted">{status}</p>
      <div className="flex min-h-0 flex-1 flex-col gap-3 px-3 pb-4 lg:flex-row">
        <Workflow />
        <ResultTabs />
      </div>
      <Dialogs />
    </div>
  );
}
