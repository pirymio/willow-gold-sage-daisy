"use client";

import { useRef, useState, type ReactNode } from "react";
import { Minus, Plus } from "lucide-react";
import { STEP_NAMES } from "@/lib/rtlca/types";
import { clockDays, clockTimes, filteredDb, mixCfAt, useRtlca } from "@/lib/rtlca/store";
import { parseDatabase, parsePrices, parseRT, parseTerna, readFileAsWorkbook } from "@/lib/rtlca/io";
import { fmtClock, fmtDay, trunc } from "@/lib/rtlca/util";
import { Button } from "@/components/ui/button";
import { Field, Input, NativeSelect } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export function Workflow() {
  const step = useRtlca((s) => s.step);
  const maxStep = useRtlca((s) => s.maxStep);
  const goto = useRtlca((s) => s.gotoStep);
  return (
    <aside className="flex w-full flex-col gap-1.5 lg:w-[340px] lg:shrink-0">
      <p className="px-1 text-[11px] font-semibold uppercase tracking-wider text-primary">
        Guided workflow · Step {step} of 6 — {STEP_NAMES[step - 1]}
      </p>
      {STEP_NAMES.map((name, i) => {
        const k = i + 1;
        const active = step === k;
        const reached = k <= maxStep;
        return (
          <section key={name} className="overflow-hidden rounded-md bg-surface shadow-[var(--shadow-border)]">
            <button
              type="button"
              onClick={() => goto(k, true)}
              className={cn(
                "flex h-11 w-full items-center px-3 text-left text-sm font-semibold",
                active && "bg-primary text-primary-fg",
                !active && reached && "bg-done text-done-fg",
                !active && !reached && "bg-surface-2 text-subtle",
              )}
            >
              {active ? "> " : "  "}Step {k} — {name}
              {!active && reached ? "  (done)" : ""}
            </button>
            {active && (
              <div className="p-3">
                {k === 1 && <Step1 />}
                {k === 2 && <Step2 />}
                {k === 3 && <Step3 />}
                {k === 4 && <Step4 />}
                {k === 5 && <Step5 />}
                {k === 6 && <Step6 />}
              </div>
            )}
          </section>
        );
      })}
    </aside>
  );
}

function FileBtn({
  label,
  onBuf,
}: {
  label: string;
  onBuf: (wb: Awaited<ReturnType<typeof readFileAsWorkbook>>, name: string) => void;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const setAlert = useRtlca((s) => s.setAlert);
  return (
    <>
      <input
        ref={ref}
        type="file"
        accept=".xlsx,.xls,.csv"
        className="hidden"
        onChange={async (e) => {
          const f = e.target.files?.[0];
          e.target.value = "";
          if (!f) return;
          try {
            const wb = await readFileAsWorkbook(f);
            onBuf(wb, f.name);
          } catch (err) {
            setAlert({ title: "File", message: err instanceof Error ? err.message : String(err), kind: "error" });
          }
        }}
      />
      <Button variant="secondary" size="sm" onClick={() => ref.current?.click()}>
        {label}
      </Button>
    </>
  );
}

function Step1() {
  const loadDb = useRtlca((s) => s.loadDb);
  const loaded = useRtlca((s) => s.loaded);
  const db = useRtlca((s) => s.db);
  const ref = useRef<HTMLInputElement>(null);
  const setAlert = useRtlca((s) => s.setAlert);
  return (
    <div className="space-y-3">
      <p className="text-xs leading-relaxed text-muted">
        Coefficient database (Idemat-style): processes × impact categories. Upload your own database file to begin the
        campaign. This is the only database source — no demo data is provided.
      </p>
      <input
        ref={ref}
        type="file"
        accept=".xlsx,.xls,.csv"
        className="hidden"
        onChange={async (e) => {
          const f = e.target.files?.[0];
          e.target.value = "";
          if (!f) return;
          try {
            const wb = await readFileAsWorkbook(f);
            loadDb(parseDatabase(wb, f.name));
          } catch (err) {
            setAlert({ title: "File", message: err instanceof Error ? err.message : String(err), kind: "error" });
          }
        }}
      />
      <Button className="w-full" onClick={() => ref.current?.click()}>
        Upload your database
      </Button>
      {loaded && db && (
        <p className="text-xs text-muted">
          {db.fileName}: {db.procNames.length} processes, {db.colLabels.length} indicators.
        </p>
      )}
    </div>
  );
}

function Step2() {
  const db = useRtlca((s) => s.db);
  const impactCat = useRtlca((s) => s.impactCat);
  const procs = useRtlca((s) => s.procs);
  const inputs = useRtlca((s) => s.inputs);
  const addProc = useRtlca((s) => s.addProc);
  const delProc = useRtlca((s) => s.delProc);
  const procsNext = useRtlca((s) => s.procsNext);
  const [name, setName] = useState("");
  return (
    <div className="space-y-3">
      <Field label="Impact category (whole study)">
        <NativeSelect
          value={impactCat}
          disabled={inputs.length > 0}
          onChange={(e) => useRtlca.setState({ impactCat: Number(e.target.value) })}
        >
          {(db?.colLabels ?? ["(load the database)"]).map((lab, i) => (
            <option key={lab} value={i}>
              {lab}
            </option>
          ))}
        </NativeSelect>
      </Field>
      <div className="flex items-center gap-2">
        <Button variant="go" size="icon" aria-label="Add unit process" onClick={() => { addProc(name || `Process_${procs.length + 1}`); setName(""); }}>
          <Plus className="size-4" />
        </Button>
        <Button variant="secondary" size="icon" aria-label="Remove last process" onClick={delProc}>
          <Minus className="size-4" />
        </Button>
        <Input
          placeholder="Process name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              addProc(name || `Process_${procs.length + 1}`);
              setName("");
            }
          }}
        />
      </div>
      <p className="text-xs italic text-muted">{procs.length ? procs.join("  >  ") : "(no processes yet: press +)"}</p>
      <Button className="w-full" onClick={procsNext}>
        Next
      </Button>
    </div>
  );
}

function Step3() {
  const db = useRtlca((s) => s.db);
  const procs = useRtlca((s) => s.procs);
  const inputs = useRtlca((s) => s.inputs);
  const draft = useRtlca((s) => s.draft);
  const setDraft = useRtlca((s) => s.setDraft);
  const addFlow = useRtlca((s) => s.addFlow);
  const removeFlow = useRtlca((s) => s.removeFlow);
  const endFlows = useRtlca((s) => s.endFlows);
  const selectedFlow = useRtlca((s) => s.selectedFlow);
  const filtered = db ? filteredDb(db, draft) : { capped: [] as number[], nAll: 0, idx: [] as number[] };
  const showQty = draft.dataType === "static" || draft.dataType === "quasi-static";
  const showLaw = draft.dataType === "dynamic";
  return (
    <div className="space-y-2.5">
      <div className="grid grid-cols-[1fr_auto] gap-2">
        <Field label="Process">
          <NativeSelect value={draft.selectedProc} onChange={(e) => setDraft({ selectedProc: Number(e.target.value) })}>
            {procs.map((p, i) => (
              <option key={p} value={i}>
                {p}
              </option>
            ))}
          </NativeSelect>
        </Field>
        <div className="flex items-end gap-1 pb-0.5">
          {(["Input", "Output"] as const).map((d) => (
            <Chip key={d} on={draft.dir === d} onClick={() => setDraft({ dir: d })}>
              {d === "Input" ? "In" : "Out"}
            </Chip>
          ))}
        </div>
      </div>
      <div className="flex flex-wrap gap-1">
        {(["static", "quasi-static", "dynamic", "real-time"] as const).map((d) => (
          <Chip key={d} on={draft.dataType === d} onClick={() => setDraft({ dataType: d })}>
            {d}
          </Chip>
        ))}
      </div>
      <div className="flex gap-1">
        {(["Matter", "Energy"] as const).map((t) => (
          <Chip key={t} on={draft.tipo === t} onClick={() => setDraft({ tipo: t })}>
            {t}
          </Chip>
        ))}
        <span className="self-center text-xs italic text-muted">
          {draft.dataType === "dynamic" ? "(law below)" : draft.dataType === "real-time" ? "(from source)" : ""}
        </span>
      </div>
      <Field label="Filter">
        <Input value={draft.kw} onChange={(e) => setDraft({ kw: e.target.value, selectedDb: 0 })} placeholder="type to search the dataset" />
      </Field>
      <Field label="Dataset process">
        <NativeSelect value={draft.selectedDb} onChange={(e) => setDraft({ selectedDb: Number(e.target.value) })}>
          {filtered.capped.length === 0 && <option value={0}>(no result: change the filter)</option>}
          {filtered.capped.map((ip, i) => (
            <option key={ip} value={i}>
              {db?.procNames[ip]} [{db?.procUnits[ip]} | row {db?.procRow[ip]}]
            </option>
          ))}
        </NativeSelect>
      </Field>
      {filtered.nAll > 250 && (
        <p className="text-[11px] text-muted">{filtered.nAll} matches, showing 250 — type a filter word.</p>
      )}
      {showQty && (
        <Field label={`Quantity (${db?.procUnits[filtered.capped[draft.selectedDb] ?? 0] ?? "unit"})`}>
          <Input type="number" value={draft.qty} onChange={(e) => setDraft({ qty: Number(e.target.value) })} />
        </Field>
      )}
      {showLaw && (
        <div className="space-y-2 rounded-sm bg-surface-2 p-2">
          <p className="text-xs font-semibold">Variation law v(t) — never constant</p>
          <NativeSelect
            value={draft.lawKind}
            onChange={(e) => setDraft({ lawKind: e.target.value as typeof draft.lawKind })}
          >
            <option value="linear">Linear: a + b*t</option>
            <option value="sinusoidal">Sinusoidal: a + b*sin(w*t)</option>
            <option value="exponential">Exponential: a*exp(b*t)</option>
            <option value="custom">Custom: f(t)</option>
          </NativeSelect>
          <div className="grid grid-cols-3 gap-2">
            <Field label="a">
              <Input type="number" value={draft.lawA} onChange={(e) => setDraft({ lawA: Number(e.target.value) })} />
            </Field>
            <Field label="b">
              <Input type="number" value={draft.lawB} onChange={(e) => setDraft({ lawB: Number(e.target.value) })} />
            </Field>
            <Field label="w">
              <Input type="number" value={draft.lawW} onChange={(e) => setDraft({ lawW: Number(e.target.value) })} />
            </Field>
          </div>
          <Field label="f(t)">
            <Input
              value={draft.lawExpr}
              disabled={draft.lawKind !== "custom"}
              onChange={(e) => setDraft({ lawExpr: e.target.value })}
            />
          </Field>
        </div>
      )}
      <div className="flex gap-2">
        <Button variant="secondary" className="flex-1" onClick={addFlow}>
          Add flow
        </Button>
        <Button variant="outline" className="flex-1" onClick={() => removeFlow()}>
          Remove
        </Button>
      </div>
      <ul className="max-h-36 overflow-auto rounded-sm bg-surface-2 p-1 text-[11px] leading-5">
        {inputs.length === 0 && <li className="px-2 py-1 text-muted">(no flows yet)</li>}
        {inputs.map((f, i) => {
          const q =
            f.dataType === "dynamic"
              ? `v(t)=${trunc(f.lawTxt, 12)}`
              : f.qty == null || Number.isNaN(f.qty)
                ? "from source"
                : `${f.qty} ${f.unit}`;
          return (
            <li key={f.id}>
              <button
                type="button"
                onClick={() => useRtlca.setState({ selectedFlow: i })}
                className={cn(
                  "w-full rounded-sm px-2 py-1 text-left",
                  selectedFlow === i ? "bg-primary/10 text-primary" : "hover:bg-border/40",
                )}
              >
                #{i + 1} [{trunc(procs[f.proc] ?? "", 8)}|{f.dir.slice(0, 2)}] {trunc(f.nome, 16)} | {f.dataType} | {q}
              </button>
            </li>
          );
        })}
      </ul>
      <Button className="w-full" onClick={endFlows}>
        Finish flows
      </Button>
    </div>
  );
}

function Chip({ on, onClick, children }: { on: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "h-8 rounded-full px-3 text-xs font-medium",
        on ? "bg-primary text-primary-fg" : "bg-surface-2 text-muted hover:text-fg",
      )}
    >
      {children}
    </button>
  );
}

function Step4() {
  const setCostOpen = useRtlca((s) => s.setCostOpen);
  const costsNext = useRtlca((s) => s.costsNext);
  const costsSet = useRtlca((s) => s.costsSet);
  return (
    <div className="space-y-3">
      <p className="text-xs text-muted">
        Hourly capital and operating items per process, plus flow unit prices. Skip to run impact only.
      </p>
      <div className="flex gap-2">
        <Button variant="secondary" className="flex-1" onClick={() => setCostOpen(true)}>
          Enter costs
        </Button>
        <Button className="flex-1" onClick={costsNext}>
          Next
        </Button>
      </div>
      {costsSet && <p className="text-xs text-done-fg">Costs saved.</p>}
    </div>
  );
}

function Step5() {
  const rt = useRtlca((s) => s.rt);
  const mix = useRtlca((s) => s.mix);
  const price = useRtlca((s) => s.price);
  const clockTime = useRtlca((s) => s.clockTime);
  const loadDemoRT = useRtlca((s) => s.loadDemoRT);
  const loadRT = useRtlca((s) => s.loadRT);
  const loadDemoMix = useRtlca((s) => s.loadDemoMix);
  const loadMix = useRtlca((s) => s.loadMix);
  const loadDemoPrice = useRtlca((s) => s.loadDemoPrice);
  const loadPrice = useRtlca((s) => s.loadPrice);
  const setClock = useRtlca((s) => s.setClock);
  const confirm = useRtlca((s) => s.confirm);
  const s = useRtlca.getState();
  const days = clockDays(s);
  const day = clockTime ? Date.UTC(new Date(clockTime).getUTCFullYear(), new Date(clockTime).getUTCMonth(), new Date(clockTime).getUTCDate()) : days[0];
  const times = day != null ? clockTimes(s, day) : [];
  const cfLbl = mixCfAt(s, clockTime);
  return (
    <div className="space-y-3">
      <p className="text-xs font-semibold text-fg">A. Acquisition file</p>
      <div className="flex flex-wrap gap-2">
        <Button variant="secondary" size="sm" onClick={loadDemoRT}>
          Load demo RT
        </Button>
        <FileBtn label="Your RT" onBuf={(wb, name) => loadRT(parseRT(wb, name))} />
      </div>
      <p className="text-[11px] italic text-muted">{rt ? `${rt.t.length} rows, ${rt.names.length} channels — ${rt.fileName}` : "no file loaded yet"}</p>
      <p className="text-xs font-semibold text-fg">B. Italian grid mix (Terna) and clock</p>
      <div className="flex flex-wrap gap-2">
        <Button variant="secondary" size="sm" onClick={loadDemoMix}>
          Load demo mix
        </Button>
        <FileBtn label="Your mix" onBuf={(wb, name) => loadMix(parseTerna(wb, name))} />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Field label="Day">
          <NativeSelect
            value={day ?? ""}
            onChange={(e) => {
              const d = Number(e.target.value);
              const tt = clockTimes(useRtlca.getState(), d);
              setClock(tt[0] ?? d);
            }}
          >
            {days.length === 0 && <option>(load mix)</option>}
            {days.map((d) => (
              <option key={d} value={d}>
                {fmtDay(d)}
              </option>
            ))}
          </NativeSelect>
        </Field>
        <Field label="Time">
          <NativeSelect value={clockTime ?? ""} onChange={(e) => setClock(Number(e.target.value))}>
            {times.length === 0 && <option>--:--</option>}
            {times.map((t) => (
              <option key={t} value={t}>
                {fmtClock(t)}
              </option>
            ))}
          </NativeSelect>
        </Field>
      </div>
      <p className="text-xs font-semibold text-primary">{cfLbl}</p>
      <p className="text-xs font-semibold text-fg">C. Energy price (optional, 15 min)</p>
      <div className="flex flex-wrap gap-2">
        <Button variant="secondary" size="sm" onClick={loadDemoPrice}>
          Load demo price
        </Button>
        <FileBtn label="Your price" onBuf={(wb, name) => loadPrice(parsePrices(wb, name))} />
      </div>
      {price && <p className="text-[11px] italic text-muted">{price.zone}: {price.T.length} intervals</p>}
      <Button className="w-full" onClick={confirm}>
        Confirm
      </Button>
    </div>
  );
}

function Step6() {
  const campaign = useRtlca((s) => s.campaign);
  const setCampaign = useRtlca((s) => s.setCampaign);
  const expN = useRtlca((s) => s.expN);
  const staticLca = useRtlca((s) => s.staticLca);
  const setStaticLca = useRtlca((s) => s.setStaticLca);
  const soglia = useRtlca((s) => s.soglia);
  const setSoglia = useRtlca((s) => s.setSoglia);
  const speed = useRtlca((s) => s.speed);
  const setSpeed = useRtlca((s) => s.setSpeed);
  const start = useRtlca((s) => s.start);
  const stop = useRtlca((s) => s.stop);
  const newCycle = useRtlca((s) => s.newCycle);
  const save = useRtlca((s) => s.saveResults);
  const running = useRtlca((s) => s.running);
  const configDone = useRtlca((s) => s.configDone);
  return (
    <div className="space-y-3">
      <div className="flex items-end gap-2">
        <Field label="Campaign" className="flex-1">
          <Input value={campaign} onChange={(e) => setCampaign(e.target.value)} />
        </Field>
        <span className="mb-2 text-sm font-semibold text-primary">Cycle {expN}</span>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Field label="Static LCA (0 = off)">
          <Input type="number" value={staticLca} onChange={(e) => setStaticLca(Number(e.target.value))} />
        </Field>
        <Field label="Hotspot threshold">
          <Input type="number" value={soglia} onChange={(e) => setSoglia(Number(e.target.value))} />
        </Field>
      </div>
      <Field label="Playback">
        <NativeSelect value={String(speed)} onChange={(e) => setSpeed((e.target.value === "max" ? "max" : Number(e.target.value)) as typeof speed)}>
          <option value="1">1×</option>
          <option value="2">2×</option>
          <option value="4">4×</option>
          <option value="8">8×</option>
          <option value="max">Max</option>
        </NativeSelect>
      </Field>
      <div className="grid grid-cols-3 gap-2">
        <Button variant="go" disabled={!configDone || running} onClick={start}>
          Start
        </Button>
        <Button variant="stop" disabled={!running} onClick={stop}>
          Stop
        </Button>
        <Button variant="secondary" disabled={running} onClick={newCycle}>
          New
        </Button>
      </div>
      <Button variant="outline" className="w-full" onClick={save}>
        Save results (Excel + JSON)
      </Button>
    </div>
  );
}
