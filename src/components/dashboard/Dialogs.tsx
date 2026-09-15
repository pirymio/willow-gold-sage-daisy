"use client";

import { useState, type ReactNode } from "react";
import { COST_ITEMS } from "@/lib/rtlca/types";
import { useRtlca } from "@/lib/rtlca/store";
import { fmtFixed, trunc } from "@/lib/rtlca/util";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export function Dialogs() {
  return (
    <>
      <AlertDialog />
      <CostDialog />
      <ProcDialog />
      <RtMapDialog />
      <QsDialog />
    </>
  );
}

function Overlay({
  title,
  onClose,
  children,
  wide,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
  wide?: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-header/40 p-0 sm:items-center sm:p-6" role="dialog" aria-modal="true">
      <div
        className={cn(
          "flex max-h-[92vh] w-full flex-col rounded-t-xl bg-surface shadow-[var(--shadow-border)] sm:rounded-xl",
          wide ? "sm:max-w-3xl" : "sm:max-w-lg",
        )}
      >
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <h2 className="text-sm font-semibold">{title}</h2>
          <button type="button" onClick={onClose} className="text-sm text-muted hover:text-fg">
            Close
          </button>
        </div>
        <div className="min-h-0 overflow-auto p-4">{children}</div>
      </div>
    </div>
  );
}

function AlertDialog() {
  const alert = useRtlca((s) => s.alert);
  const setAlert = useRtlca((s) => s.setAlert);
  if (!alert) return null;
  return (
    <Overlay title={alert.title} onClose={() => setAlert(null)}>
      <p className="whitespace-pre-wrap text-sm leading-relaxed text-fg">{alert.message}</p>
      <div className="mt-4 flex justify-end">
        <Button onClick={() => setAlert(null)}>OK</Button>
      </div>
    </Overlay>
  );
}

function CostDialog() {
  const open = useRtlca((s) => s.costOpen);
  const setOpen = useRtlca((s) => s.setCostOpen);
  const procs = useRtlca((s) => s.procs);
  const inputs = useRtlca((s) => s.inputs);
  const costP = useRtlca((s) => s.costP);
  const setCostP = useRtlca((s) => s.setCostP);
  const setFlowPrice = useRtlca((s) => s.setFlowPrice);
  const energyBill = useRtlca((s) => s.energyBill);
  const carbonPrice = useRtlca((s) => s.carbonPrice);
  const disrCost = useRtlca((s) => s.disrCost);
  const unitsPerCycle = useRtlca((s) => s.unitsPerCycle);
  const setGlobal = useRtlca((s) => s.setGlobalCost);
  const save = useRtlca((s) => s.saveCosts);
  const [sel, setSel] = useState(0);
  if (!open) return null;
  const nP = procs.length;
  const isGlobal = sel >= nP;
  const hourly = !isGlobal ? (costP[sel] ?? []).reduce((a, b) => a + b, 0) : 0;
  return (
    <Overlay title="Costs and prices (LCC)" onClose={() => setOpen(false)} wide>
      <p className="mb-3 text-xs italic text-muted">
        Select a unit process, then edit values. Items follow Environmental LCC (capital, operating, end-of-life).
      </p>
      <div className="grid gap-4 md:grid-cols-[200px_1fr]">
        <ul className="flex flex-col gap-1">
          {procs.map((p, i) => (
            <li key={p}>
              <button
                type="button"
                onClick={() => setSel(i)}
                className={cn(
                  "h-10 w-full rounded-sm px-3 text-left text-sm",
                  sel === i ? "bg-primary text-primary-fg" : "bg-surface-2 hover:bg-border/60",
                )}
              >
                {p}
              </button>
            </li>
          ))}
          <li>
            <button
              type="button"
              onClick={() => setSel(nP)}
              className={cn(
                "h-10 w-full rounded-sm px-3 text-left text-sm",
                isGlobal ? "bg-primary text-primary-fg" : "bg-surface-2 hover:bg-border/60",
              )}
            >
              GLOBAL
            </button>
          </li>
        </ul>
        <div>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-muted">
                <th className="pb-2 font-medium">Cost item</th>
                <th className="pb-2 font-medium">Value</th>
                <th className="pb-2 font-medium">Unit</th>
              </tr>
            </thead>
            <tbody>
              {!isGlobal &&
                COST_ITEMS.map((name, k) => (
                  <tr key={name} className="border-t border-border">
                    <td className="py-1.5 pr-2">{name}</td>
                    <td className="py-1.5">
                      <Input
                        type="number"
                        min={0}
                        step="0.01"
                        className="h-9"
                        value={costP[sel]?.[k] ?? 0}
                        onChange={(e) => setCostP(sel, k, Number(e.target.value))}
                      />
                    </td>
                    <td className="py-1.5 text-muted">EUR/h</td>
                  </tr>
                ))}
              {!isGlobal &&
                inputs.map((f, i) =>
                  f.proc === sel && f.dataType !== "real-time" ? (
                    <tr key={f.id} className="border-t border-border">
                      <td className="py-1.5 pr-2">
                        {f.dir === "Output" ? "Disposal / treatment: " : "Purchase price: "}
                        {trunc(f.nome, 30)}
                      </td>
                      <td className="py-1.5">
                        <Input
                          type="number"
                          min={0}
                          step="0.01"
                          className="h-9"
                          value={f.price}
                          onChange={(e) => setFlowPrice(i, Number(e.target.value))}
                        />
                      </td>
                      <td className="py-1.5 text-muted">EUR/{f.unit}</td>
                    </tr>
                  ) : null,
                )}
              {!isGlobal && inputs.some((f) => f.proc === sel && f.dataType === "real-time") && (
                <tr className="border-t border-border">
                  <td className="py-1.5 text-muted" colSpan={3}>
                    Energy: real-time channel, priced with the GLOBAL energy price
                  </td>
                </tr>
              )}
              {isGlobal && (
                <>
                  <GlobalRow label="Energy price from the bill" unit="EUR/kWh" value={energyBill} onChange={(v) => setGlobal("energyBill", v)} />
                  <GlobalRow label="Carbon price (0 = off)" unit="EUR/tCO2e" value={carbonPrice} onChange={(v) => setGlobal("carbonPrice", v)} />
                  <GlobalRow label="Disruption cost during hotspots" unit="EUR/h" value={disrCost} onChange={(v) => setGlobal("disrCost", v)} />
                  <GlobalRow label="Product units per cycle" unit="units" value={unitsPerCycle} onChange={(v) => setGlobal("unitsPerCycle", v)} />
                </>
              )}
            </tbody>
          </table>
          <p className="mt-3 text-sm font-semibold">
            {isGlobal ? "Global economic parameters" : `${procs[sel]}: hourly items ${fmtFixed(hourly)} EUR/h`}
          </p>
        </div>
      </div>
      <div className="mt-4 flex justify-end gap-2">
        <Button variant="secondary" onClick={() => setOpen(false)}>
          Cancel
        </Button>
        <Button onClick={save}>Save costs</Button>
      </div>
    </Overlay>
  );
}

function GlobalRow({
  label,
  unit,
  value,
  onChange,
}: {
  label: string;
  unit: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <tr className="border-t border-border">
      <td className="py-1.5 pr-2">{label}</td>
      <td className="py-1.5">
        <Input type="number" min={0} step="0.01" className="h-9" value={value} onChange={(e) => onChange(Number(e.target.value))} />
      </td>
      <td className="py-1.5 text-muted">{unit}</td>
    </tr>
  );
}

function ProcDialog() {
  const p = useRtlca((s) => s.procOpen);
  const setOpen = useRtlca((s) => s.setProcOpen);
  const procs = useRtlca((s) => s.procs);
  const inputs = useRtlca((s) => s.inputs);
  const costP = useRtlca((s) => s.costP);
  const live = useRtlca((s) => s.live);
  const cat = useRtlca((s) => s.db?.colLabels[s.impactCat] ?? "");
  const rename = useRtlca((s) => s.renameProc);
  const remove = useRtlca((s) => s.removeFlow);
  const goto = useRtlca((s) => s.gotoStep);
  const setDraft = useRtlca((s) => s.setDraft);
  const setCostOpen = useRtlca((s) => s.setCostOpen);
  const editQty = useRtlca((s) => s.editFlowQty);
  const setFlowPrice = useRtlca((s) => s.setFlowPrice);
  const [name, setName] = useState("");
  if (p == null) return null;
  const fl = inputs.map((f, i) => ({ f, i })).filter((x) => x.f.proc === p);
  const hourly = (costP[p] ?? []).reduce((a, b) => a + b, 0);
  return (
    <Overlay title={`Unit process "${procs[p]}"`} onClose={() => setOpen(null)} wide>
      <div className="mb-3 flex flex-wrap items-end gap-2">
        <label className="flex flex-col gap-1 text-xs font-medium text-muted">
          Name
          <Input className="h-9 w-56" defaultValue={procs[p]} onChange={(e) => setName(e.target.value)} />
        </label>
        <Button variant="secondary" size="sm" onClick={() => rename(p, name || procs[p]!)}>
          Rename
        </Button>
      </div>
      <p className="mb-3 text-xs text-muted">
        Position {p + 1} of {procs.length} in the chain · {fl.length} flows · hourly costs {fmtFixed(hourly)} EUR/h ·
        impact so far: {live ? live.procImp[p] : "—"} · {trunc(cat, 40)}
      </p>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="text-left text-xs text-muted">
              <th className="pb-2">#</th>
              <th className="pb-2">Flow</th>
              <th className="pb-2">Dir</th>
              <th className="pb-2">Taxonomy</th>
              <th className="pb-2">Qty / law</th>
              <th className="pb-2">Unit</th>
              <th className="pb-2">Price</th>
              <th className="pb-2">CF</th>
            </tr>
          </thead>
          <tbody>
            {fl.map(({ f, i }) => (
              <tr key={f.id} className="border-t border-border">
                <td className="py-1.5">{i + 1}</td>
                <td className="py-1.5">{f.nome}</td>
                <td className="py-1.5">{f.dir}</td>
                <td className="py-1.5">{f.dataType}</td>
                <td className="py-1.5">
                  {f.dataType === "static" || f.dataType === "quasi-static" ? (
                    <Input type="number" className="h-8 w-24" value={f.qty ?? 0} onChange={(e) => editQty(i, Number(e.target.value))} />
                  ) : f.dataType === "dynamic" ? (
                    `v(t) = ${f.lawTxt}`
                  ) : f.rtCol >= 0 ? (
                    `channel ${f.rtColName}`
                  ) : (
                    "channel (not mapped)"
                  )}
                </td>
                <td className="py-1.5">{f.unit}</td>
                <td className="py-1.5">
                  <Input type="number" min={0} className="h-8 w-24" value={f.price} onChange={(e) => setFlowPrice(i, Number(e.target.value))} />
                </td>
                <td className="py-1.5 font-mono text-xs">{f.cf}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <Button variant="danger" size="sm" onClick={() => { if (fl[0]) remove(fl[0].i); }}>
          Remove first listed flow
        </Button>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => {
            setDraft({ selectedProc: p });
            setOpen(null);
            goto(3, true);
          }}
        >
          Add flow here
        </Button>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => {
            setOpen(null);
            setCostOpen(true);
          }}
        >
          Edit costs
        </Button>
      </div>
    </Overlay>
  );
}

function RtMapDialog() {
  const open = useRtlca((s) => s.rtMapOpen);
  const close = useRtlca((s) => s.closeRtMap);
  const apply = useRtlca((s) => s.applyRtMap);
  const procs = useRtlca((s) => s.procs);
  const [vals, setVals] = useState<number[] | null>(null);
  if (!open) return null;
  const v = vals ?? open.defs;
  return (
    <Overlay title="Match energy columns to unit processes (0 = ignore)" onClose={close} wide>
      <p className="mb-3 text-xs text-muted">Chain: {procs.map((p, i) => `${i + 1}=${p}`).join(",  ")}</p>
      <div className="space-y-3">
        {open.names.map((n, c) => (
          <label key={n} className="flex flex-col gap-1 text-sm">
            <span>
              Column “{n}” [{open.units[c]}] → unit process number
            </span>
            <Input
              type="number"
              min={0}
              max={procs.length}
              className="h-9 w-28"
              value={v[c] ?? 0}
              onChange={(e) => {
                const next = [...v];
                next[c] = Number(e.target.value);
                setVals(next);
              }}
            />
          </label>
        ))}
      </div>
      <div className="mt-4 flex justify-end gap-2">
        <Button variant="secondary" onClick={close}>
          Cancel
        </Button>
        <Button onClick={() => apply(v)}>Apply matching</Button>
      </div>
    </Overlay>
  );
}

function QsDialog() {
  const open = useRtlca((s) => s.qsOpen);
  const close = useRtlca((s) => s.closeQS);
  const apply = useRtlca((s) => s.applyQS);
  const [vals, setVals] = useState<string[] | null>(null);
  if (!open) return null;
  const v = vals ?? open.defs;
  return (
    <Overlay title="Quasi-static values for this cycle" onClose={close}>
      <div className="space-y-3">
        {open.prompts.map((p, i) => (
          <label key={p} className="flex flex-col gap-1 text-sm">
            <span>{p}</span>
            <Input
              type="number"
              className="h-9"
              value={v[i] ?? ""}
              onChange={(e) => {
                const next = [...v];
                next[i] = e.target.value;
                setVals(next);
              }}
            />
          </label>
        ))}
      </div>
      <div className="mt-4 flex justify-end gap-2">
        <Button variant="secondary" onClick={close}>
          Cancel
        </Button>
        <Button onClick={() => apply(v.map(Number))}>Confirm values</Button>
      </div>
    </Overlay>
  );
}
