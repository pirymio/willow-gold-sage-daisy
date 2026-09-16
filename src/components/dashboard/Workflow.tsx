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
