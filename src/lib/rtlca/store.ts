import { create } from "zustand";
import type {
  CycleResult,
  Database,
  DataType,
  FlowDir,
  FlowTipo,
  InputFlow,
  LawKind,
  LiveSnapshot,
  MixFile,
  PriceFile,
  RTFile,
} from "./types";
import { COST_ITEMS } from "./types";
import {
  cedFactors,
  makeDemoDatabase,
  makeDemoMix,
  makeDemoPrices,
  makeDemoRT,
  makeSampleSystem,
  mapRtToSample,
} from "./demo-data";
import {
  finishResult,
  initRunner,
  mapMixCed,
  mapMixCol,
  mixAt,
  prepareCycle,
  qualityNotes,
  stepBatch,
  type PreparedCycle,
  type RunnerState,
} from "./engine";
import { downloadCampaign, seriesMatrix } from "./export";
import { energyToMJ, fmt, fmtStamp, newInputTemplate, trunc, validateLaw } from "./util";

export type Speed = 1 | 2 | 4 | 8 | "max";

export interface AlertState {
  title: string;
  message: string;
  kind: "error" | "warn" | "info";
}

interface DraftFlow {
  dir: FlowDir;
  dataType: DataType;
  tipo: FlowTipo;
  kw: string;
  qty: number;
  lawKind: LawKind;
  lawA: number;
  lawB: number;
  lawW: number;
  lawExpr: string;
  selectedProc: number;
  selectedDb: number;
}

const defaultDraft = (): DraftFlow => ({
  dir: "Input",
  dataType: "static",
  tipo: "Matter",
  kw: "",
  qty: 1,
  lawKind: "linear",
  lawA: 10,
  lawB: 2,
  lawW: 0.05,
  lawExpr: "10 + 5*sin(0.05*t)",
  selectedProc: 0,
  selectedDb: 0,
});

interface AppState {
  step: number;
  maxStep: number;
  tab: number;
  loaded: boolean;
  procsDone: boolean;
  flowsDone: boolean;
  configDone: boolean;
  costsSet: boolean;
  running: boolean;
  db: Database | null;
  impactCat: number;
  procs: string[];
  inputs: InputFlow[];
  selectedFlow: number;
  costP: number[][];
  energyBill: number;
  carbonPrice: number;
  disrCost: number;
  unitsPerCycle: number;
  rt: RTFile | null;
  mix: MixFile | null;
  mixCf: number[];
  mixCed: number[][];
  price: PriceFile | null;
  clockTime: number | null;
  campaign: string;
  expN: number;
  staticLca: number;
  soglia: number;
  speed: Speed;
  tOffset: number;
  hotN: number;
  log: string[];
  results: CycleResult[];
  seriesArchive: number[][][];
  live: LiveSnapshot | null;
  draft: DraftFlow;
  alert: AlertState | null;
  costOpen: boolean;
  procOpen: number | null;
  rtMapOpen: { names: string[]; units: string[]; defs: number[] } | null;
  qsOpen: { ids: string[]; prompts: string[]; defs: string[]; mode: "confirm" | "newcycle" } | null;
  status: string;
  addLog: (line: string) => void;
  setAlert: (a: AlertState | null) => void;
  setStatus: (s: string) => void;
  gotoStep: (k: number, reopen?: boolean) => void;
  setTab: (k: number) => void;
  loadDemoDb: () => void;
  loadDb: (db: Database) => void;
  addProc: (name: string) => void;
  delProc: () => void;
  renameProc: (p: number, name: string) => void;
  procsNext: () => void;
  setDraft: (p: Partial<DraftFlow>) => void;
  addFlow: () => void;
  removeFlow: (idx?: number) => void;
  endFlows: () => void;
  setCostP: (p: number, k: number, v: number) => void;
  setFlowPrice: (i: number, v: number) => void;
  setGlobalCost: (k: "energyBill" | "carbonPrice" | "disrCost" | "unitsPerCycle", v: number) => void;
  saveCosts: () => void;
  costsNext: () => void;
  loadDemoRT: () => void;
  loadRT: (rt: RTFile) => void;
  applyRtMap: (assign: number[]) => void;
  loadDemoMix: () => void;
  loadMix: (mix: MixFile) => void;
  loadDemoPrice: () => void;
  loadPrice: (price: PriceFile) => void;
  setClock: (ms: number) => void;
  setCampaign: (s: string) => void;
  setStaticLca: (n: number) => void;
  setSoglia: (n: number) => void;
  setSpeed: (s: Speed) => void;
  confirm: () => void;
  applyQS: (values: number[]) => boolean;
  start: () => void;
  stop: () => void;
  newCycle: () => void;
  saveResults: () => void;
  loadSampleCampaign: () => void;
  editFlowQty: (i: number, qty: number) => void;
  setCostOpen: (v: boolean) => void;
  setProcOpen: (p: number | null) => void;
  closeRtMap: () => void;
  closeQS: () => void;
}

let runner: RunnerState | null = null;
let prepared: PreparedCycle | null = null;
let timer: number | null = null;

function stopTimer() {
  if (timer != null) {
    window.clearTimeout(timer);
    timer = null;
  }
}

export const useRtlca = create<AppState>((set, get) => ({
  step: 1,
  maxStep: 1,
  tab: 0,
  loaded: false,
  procsDone: false,
  flowsDone: false,
  configDone: false,
  costsSet: false,
  running: false,
  db: null,
  impactCat: 0,
  procs: [],
  inputs: [],
  selectedFlow: -1,
  costP: [],
  energyBill: 0.25,
  carbonPrice: 0,
  disrCost: 0,
  unitsPerCycle: 1,
  rt: null,
  mix: null,
  mixCf: [],
  mixCed: [],
  price: null,
  clockTime: null,
  campaign: "Campaign_1",
  expN: 0,
  staticLca: 0,
  soglia: 0,
  speed: 4,
  tOffset: 0,
  hotN: 0,
  log: ["CAMPAIGN AND HOTSPOT LOG", "-------------------------"],
  results: [],
  seriesArchive: [],
  live: null,
  draft: defaultDraft(),
  alert: null,
  costOpen: false,
  procOpen: null,
  rtMapOpen: null,
  qsOpen: null,
  status: "Welcome: start from Step 1, or open the sample campaign.",

  addLog: (line) => set((s) => ({ log: [...s.log, line] })),
  setAlert: (a) => set({ alert: a }),
  setStatus: (status) => set({ status }),
  setTab: (tab) => set({ tab }),
  setCostOpen: (costOpen) => set({ costOpen }),
  setProcOpen: (procOpen) => set({ procOpen }),
  closeRtMap: () => set({ rtMapOpen: null }),
  closeQS: () => {
    const q = get().qsOpen;
    if (q?.mode === "newcycle") set({ expN: Math.max(1, get().expN - 1), qsOpen: null });
    else set({ qsOpen: null });
  },
  setCampaign: (campaign) => set({ campaign }),
  setStaticLca: (staticLca) => set({ staticLca }),
  setSoglia: (soglia) => set({ soglia }),
  setSpeed: (speed) => set({ speed }),

  gotoStep: (k, reopen) => {
    const s = get();
    if (s.running) {
      set({ status: "Stop the running cycle before changing step." });
      return;
    }
    if (k > s.maxStep) {
      set({ status: `Step ${k} is not reachable yet: complete the previous steps first.` });
      return;
    }
    const patch: Partial<AppState> = {
      step: k,
      maxStep: Math.max(s.maxStep, k),
    };
    if (reopen && k < 6 && s.configDone) {
      patch.configDone = false;
      get().addLog(`Configuration reopened at Step ${k}: press CONFIRM (Step 5) again before running.`);
      patch.status = `Reopened Step ${k}. Changes here require CONFIRM again before START.`;
    }
    set(patch);
  },

  loadDemoDb: () => get().loadDb(makeDemoDatabase()),
  loadDb: (db) => {
    set({
      db,
      loaded: true,
      impactCat: 0,
      status: `Database loaded: ${db.procNames.length} processes, ${db.colLabels.length} indicators. Define the system.`,
    });
    if (db.cedCol >= 0) {
      get().addLog(
        `CED columns found: total + ${db.cedNRCols.length} non-renewable + ${db.cedRCols.length} renewable`,
      );
    } else {
      get().addLog("WARNING: no CED column in the dataset (CED tab disabled).");
    }
    get().gotoStep(2);
  },

  addProc: (name) => {
    const nm = name.trim();
    if (!nm) return;
    set((s) => ({
      procs: [...s.procs, nm],
      draft: { ...s.draft, selectedProc: s.procs.length },
      status: `${s.procs.length + 1} unit processes: press + for another one, NEXT to add the flows.`,
    }));
  },
  delProc: () => {
    const s = get();
    const n = s.procs.length;
    if (!n) return;
    if (s.inputs.some((f) => f.proc === n - 1)) {
      set({ alert: { title: "Unit processes", message: `"${s.procs[n - 1]}" has flows: remove them first.`, kind: "error" } });
      return;
    }
    set({ procs: s.procs.slice(0, -1) });
  },
  renameProc: (p, name) => {
    const nm = name.trim();
    if (!nm) return;
    set((s) => {
      const procs = s.procs.slice();
      const old = procs[p];
      procs[p] = nm;
      return { procs };
    });
  },
  procsNext: () => {
    if (!get().procs.length) {
      set({ alert: { title: "Unit processes", message: "Add at least one unit process with the + button.", kind: "error" } });
      return;
    }
    set({ procsDone: true, status: "Now add the input/output flows of each unit process (energy: one real-time flow per process)." });
    get().gotoStep(3);
  },

  setDraft: (p) =>
    set((s) => {
      const draft = { ...s.draft, ...p };
      if (p.dataType === "real-time") draft.tipo = "Energy";
      else if (p.tipo === "Energy" && draft.dataType !== "real-time") draft.dataType = "real-time";
      else if (p.tipo === "Matter" && draft.dataType === "real-time") draft.dataType = "static";
      return { draft };
    }),

  addFlow: () => {
    const s = get();
    if (!s.procsDone) {
      set({ alert: { title: "Flows", message: "Define the unit processes first (Step 2).", kind: "error" } });
      return;
    }
    const db = s.db;
    if (!db) {
      set({ alert: { title: "Flows", message: "Load the database first.", kind: "error" } });
      return;
    }
    const idx = filteredDbIndex(db, s.draft)[s.draft.selectedDb];
    if (idx == null) {
      set({ alert: { title: "Flows", message: "Select a valid dataset process.", kind: "error" } });
      return;
    }
    const ic = s.impactCat;
    const v = db.raw[db.procRow[idx]!]![db.coefCols[ic]!];
    if (typeof v !== "number" || !Number.isFinite(v)) {
      set({ alert: { title: "Flows", message: "Non-numeric coefficient for this row in the chosen category.", kind: "error" } });
      return;
    }
    const in_ = newInputTemplate();
    in_.nome = db.procNames[idx]!;
    in_.tipo = s.draft.tipo;
    in_.proc = s.draft.selectedProc;
    in_.dir = s.draft.dir;
    in_.procIdx = idx;
    in_.rowSheet = db.procRow[idx]!;
    in_.unit = db.procUnits[idx]!;
    in_.colIdx = ic;
    in_.cf = v;
    in_.cfLabel = db.colLabels[ic]!;
    in_.dataType = s.draft.dataType;
    in_.cedF = cedFactors(db, idx);
    if (s.draft.dataType === "static" || s.draft.dataType === "quasi-static") {
      if (!Number.isFinite(s.draft.qty)) {
        set({ alert: { title: "Flows", message: "Invalid quantity.", kind: "error" } });
        return;
      }
      in_.qty = s.draft.qty;
    } else if (s.draft.dataType === "dynamic") {
      const law = validateLaw(s.draft.lawKind, s.draft.lawA, s.draft.lawB, s.draft.lawW, s.draft.lawExpr);
      if (!law.ok) {
        set({ alert: { title: "Variation law", message: law.msg, kind: "error" } });
        return;
      }
      in_.lawKind = s.draft.lawKind;
      in_.lawA = s.draft.lawA;
      in_.lawB = s.draft.lawB;
      in_.lawW = s.draft.lawW;
      in_.lawExpr = s.draft.lawExpr;
      in_.lawTxt = law.txt;
      in_.qty = null;
    } else {
      if (s.inputs.some((f) => f.dataType === "real-time" && f.proc === in_.proc)) {
        set({
          alert: {
            title: "Real-time",
            message: `"${s.procs[in_.proc]}" already has its energy input: one per unit process.`,
            kind: "error",
          },
        });
        return;
      }
      in_.qty = null;
    }
    set({
      inputs: [...s.inputs, in_],
      status: `${s.inputs.length + 1} flows defined. Press FINISH FLOWS when done.`,
    });
  },

  removeFlow: (idx) => {
    const s = get();
    const r = idx ?? s.selectedFlow;
    if (r < 0 || r >= s.inputs.length) {
      set({ alert: { title: "Remove", message: "Select a flow in the list.", kind: "error" } });
      return;
    }
    const inputs = s.inputs.filter((_, i) => i !== r);
    set({ inputs, selectedFlow: inputs.length - 1 });
  },

  endFlows: () => {
    const s = get();
    if (!s.inputs.length) {
      set({ alert: { title: "Finish flows", message: "Define at least one flow.", kind: "error" } });
      return;
    }
    s.procs.forEach((p, i) => {
      if (!s.inputs.some((f) => f.proc === i)) get().addLog(`WARNING: process "${p}" has no flows (empty column in Pareto).`);
    });
    set({ flowsDone: true, status: "Enter the costs and prices for the LCC (or NEXT to skip them)." });
    get().gotoStep(4);
    const nP = get().procs.length;
    if (get().costP.length !== nP) {
      set({ costP: Array.from({ length: nP }, () => Array(COST_ITEMS.length).fill(0)) });
    }
  },

  setCostP: (p, k, v) =>
    set((s) => {
      const costP = s.costP.map((row, i) => (i === p ? row.map((x, j) => (j === k ? v : x)) : row));
      return { costP };
    }),
  setFlowPrice: (i, v) =>
    set((s) => ({
      inputs: s.inputs.map((f, k) => (k === i ? { ...f, price: v } : f)),
    })),
  setGlobalCost: (k, v) => set({ [k]: k === "unitsPerCycle" ? Math.max(v, 1) : v } as Partial<AppState>),
  saveCosts: () => {
    const s = get();
    set({ costsSet: true, costOpen: false });
    get().addLog("Costs and prices saved (LCC):");
    s.procs.forEach((p, i) => {
      const row = s.costP[i] ?? [];
      const sum = row.reduce((a, b) => a + b, 0);
      get().addLog(
        `   ${trunc(p, 16).padEnd(16)} hourly items ${sum.toFixed(2)} EUR/h  (CAPEX ${(row[0]! + row[1]!).toFixed(2)}, labour ${(row[2] ?? 0).toFixed(2)}, other OPEX ${row.slice(3).reduce((a, b) => a + b, 0).toFixed(2)})`,
      );
    });
    get().addLog(
      `   energy ${s.energyBill.toFixed(4)} EUR/kWh | carbon ${s.carbonPrice.toFixed(1)} EUR/tCO2e | disruption ${s.disrCost.toFixed(2)} EUR/h | ${s.unitsPerCycle} units/cycle`,
    );
    set({ status: `Costs saved for ${s.procs.length} processes (${COST_ITEMS.length} hourly items each). Press NEXT.` });
  },
  costsNext: () => {
    const s = get();
    if (!s.costsSet) get().addLog("LCC: no costs entered, all prices = 0 (impact only).");
    get().gotoStep(5);
    const hasRt = s.inputs.some((f) => f.dataType === "real-time");
    set({
      status: hasRt
        ? "Load the RT file, the grid mix and (optional) the price file, then CONFIRM."
        : "No real-time flow: press CONFIRM directly.",
    });
  },

  loadDemoRT: () => get().loadRT(makeDemoRT()),
  loadRT: (rt) => {
    const s = get();
    const rtIdx = s.inputs.map((f, i) => (f.dataType === "real-time" ? i : -1)).filter((i) => i >= 0);
    if (!rtIdx.length) {
      set({ alert: { title: "Real-time", message: "Add the energy (real-time) input of at least one unit process in Step 3.", kind: "error" } });
      return;
    }
    const ordered = [...rtIdx].sort((a, b) => s.inputs[a]!.proc - s.inputs[b]!.proc);
    const defs = rt.names.map((_, c) => (c < ordered.length ? s.inputs[ordered[c]!]!.proc + 1 : 0));
    set({ rt, rtMapOpen: { names: rt.names, units: rt.units, defs } });
  },
  applyRtMap: (assign) => {
    const s = get();
    const rt = s.rt;
    if (!rt) return;
    const nP = s.procs.length;
    for (let c = 0; c < assign.length; c++) {
      const p = assign[c]!;
      if (!Number.isInteger(p) || p < 0 || p > nP) {
        set({ alert: { title: "Real-time", message: `Invalid process number for column "${rt.names[c]}".`, kind: "error" } });
        return;
      }
      if (p > 0 && assign.slice(0, c).includes(p)) {
        set({ alert: { title: "Real-time", message: `Process "${s.procs[p - 1]}" receives two columns: one column per process.`, kind: "error" } });
        return;
      }
      if (p > 0 && !s.inputs.some((f) => f.dataType === "real-time" && f.proc === p - 1)) {
        set({
          alert: {
            title: "Real-time",
            message: `Process "${s.procs[p - 1]}" has no energy input: add it in Step 3 or assign the column to another process.`,
            kind: "error",
          },
        });
        return;
      }
    }
    const inputs = s.inputs.map((f) => (f.dataType === "real-time" ? { ...f, rtCol: -1, rtColName: "", rtConv: 1 } : f));
    get().addLog("Energy columns -> unit processes:");
    assign.forEach((p, c) => {
      if (p === 0) {
        get().addLog(`   ${rt.names[c]!.padEnd(22)} ignored`);
        return;
      }
      const j = inputs.findIndex((f) => f.dataType === "real-time" && f.proc === p - 1);
      const fProc = energyToMJ(inputs[j]!.unit);
      if (Number.isNaN(fProc)) {
        set({ alert: { title: "Real-time", message: `"${inputs[j]!.nome}" has unit "${inputs[j]!.unit}": the energy input must be an MJ process.`, kind: "error" } });
        return;
      }
      const conv = energyToMJ(rt.units[c]!) / fProc;
      inputs[j] = {
        ...inputs[j]!,
        rtCol: c,
        rtColName: rt.names[c]!,
        rtConv: conv,
        nome: `${trunc(s.procs[p - 1]!, 10)} <- ${rt.names[c]}`,
      };
      get().addLog(`   ${rt.names[c]!.padEnd(22)} -> ${s.procs[p - 1]!.padEnd(12)} [${rt.units[c]} -> ${inputs[j]!.unit}] x${conv.toPrecision(5)}`);
    });
    set({
      inputs,
      rtMapOpen: null,
      status: `RT file: ${rt.t.length} rows, ${assign.filter((p) => p > 0).length} columns matched. Load the grid mix, then CONFIRM.`,
    });
  },

  loadDemoMix: () => get().loadMix(makeDemoMix()),
  loadMix: (mix) => {
    const s = get();
    if (!s.db) {
      set({ alert: { title: "Grid mix", message: "Load the CF database first (Step 1).", kind: "error" } });
      return;
    }
    try {
      const mixCf = mapMixCol(s.db, mix.src, s.impactCat);
      const mixCed = mapMixCed(s.db, mix.src);
      const clockTime = defaultClock(mix.T, s.price?.T);
      set({
        mix,
        mixCf,
        mixCed,
        clockTime,
        status: `Grid mix loaded: ${mix.T.length} intervals, sources: ${mix.src.join(", ")}.`,
      });
      get().addLog("Grid mix source -> dataset CF mapping:");
      mix.src.forEach((src, q) => get().addLog(`   ${src.padEnd(17)} cf = ${mixCf[q]}`));
    } catch (e) {
      set({ alert: { title: "Grid mix reading error", message: e instanceof Error ? e.message : String(e), kind: "error" } });
    }
  },
  loadDemoPrice: () => get().loadPrice(makeDemoPrices()),
  loadPrice: (price) => {
    const clockTime = get().clockTime ?? defaultClock(get().mix?.T, price.T);
    set({
      price,
      clockTime,
      status: `Energy price loaded: ${price.T.length} intervals (${price.zone}), ${Math.min(...price.kwh).toFixed(3)}–${Math.max(...price.kwh).toFixed(3)} EUR/kWh.`,
    });
    get().addLog(
      `Energy price file loaded (zone ${price.zone}): ${fmtStamp(price.T[0]!)} -> ${fmtStamp(price.T[price.T.length - 1]!)}`,
    );
  },
  setClock: (ms) => set({ clockTime: ms }),

  confirm: () => {
    const s = get();
    const rtIdx = s.inputs.filter((f) => f.dataType === "real-time");
    if (rtIdx.length) {
      if (!s.rt) {
        set({ alert: { title: "Configuration", message: "There are real-time flows but the file has not been loaded.", kind: "error" } });
        return;
      }
      const missing = s.inputs.find((f) => f.dataType === "real-time" && f.rtCol < 0);
      if (missing) {
        set({
          alert: {
            title: "Configuration",
            message: `The energy input of "${s.procs[missing.proc]}" has no column: press LOAD RT.`,
            kind: "error",
          },
        });
        return;
      }
    }
    const qs = s.inputs.filter((f) => f.dataType === "quasi-static");
    if (qs.length) {
      set({
        qsOpen: {
          ids: qs.map((f) => f.id),
          prompts: qs.map((f) => `${f.nome} [${f.unit}] (${s.procs[f.proc]})`),
          defs: qs.map((f) => (f.qty == null || Number.isNaN(f.qty) ? "" : String(f.qty))),
          mode: "confirm",
        },
      });
      return;
    }
    finishConfirm(set, get);
  },

  applyQS: (values) => {
    const s = get();
    const qs = s.qsOpen;
    if (!qs) return false;
    if (values.some((v) => !Number.isFinite(v))) {
      set({ alert: { title: "Quasi-static", message: "Invalid value.", kind: "error" } });
      return false;
    }
    const inputs = s.inputs.map((f) => {
      const k = qs.ids.indexOf(f.id);
      return k >= 0 ? { ...f, qty: values[k]! } : f;
    });
    set({ inputs, qsOpen: null });
    if (qs.mode === "newcycle") resetForNewCycle(set, get);
    else finishConfirm(set, get);
    return true;
  },

  start: () => {
    const s = get();
    if (!s.configDone || !prepared) {
      set({ alert: { title: "Run", message: "Complete steps 1–5 first.", kind: "error" } });
      return;
    }
    if (runner && runner.k >= prepared.nSteps) {
      set({ alert: { title: "Run", message: "Cycle already completed: press NEW CYCLE.", kind: "error" } });
      return;
    }
    if (!runner) runner = initRunner(prepared, s.hotN);
    set({ running: true });
    const tick = () => {
      const st = get();
      if (!st.running || !prepared || !runner) return;
      const batch = st.speed === "max" ? 40 : st.speed;
      const live = stepBatch(prepared, runner, st.rt, batch);
      const logHot =
        live.hotN > st.hotN && live.hotN % 10 === 1
          ? `  HOTSPOT cycle ${prepared.expN}: t=${live.series[live.series.length - 1]?.t.toFixed(2)} s, inst=${fmt(live.instTot)} > thr ${fmt(prepared.soglia)}`
          : null;
      set({
        live,
        hotN: live.hotN,
        status: `Cycle ${prepared.expN}: t = ${(live.series.at(-1)?.t ?? 0).toFixed(1)} s (${live.idx}/${live.nSteps})`,
      });
      if (logHot) get().addLog(logHot);
      if (live.alarm && live.alarmProcs.some(Boolean) && live.done === false) {
        /* alarm text already on Pareto */
      }
      if (live.done) {
        completeCycle(set, get, live);
        return;
      }
      const delay = st.speed === "max" ? 16 : 40;
      timer = window.setTimeout(tick, delay);
    };
    tick();
  },

  stop: () => {
    stopTimer();
    set({ running: false, status: `Cycle ${get().expN} paused (${get().live?.idx ?? 0}/${get().live?.nSteps ?? 0}): press START to resume.` });
  },

  newCycle: () => {
    const s = get();
    if (s.live && s.live.idx < s.live.nSteps && s.live.idx > 1) {
      set({ alert: { title: "New cycle", message: "The current cycle is not finished: complete it or stop it.", kind: "error" } });
      return;
    }
    const qs = s.inputs.filter((f) => f.dataType === "quasi-static");
    set({ expN: s.expN + 1 });
    if (qs.length) {
      set({
        qsOpen: {
          ids: qs.map((f) => f.id),
          prompts: qs.map((f) => `${f.nome} [${f.unit}] (${s.procs[f.proc]})`),
          defs: qs.map((f) => (f.qty == null ? "" : String(f.qty))),
          mode: "newcycle",
        },
      });
      return;
    }
    resetForNewCycle(set, get);
  },

  saveResults: () => {
    const s = get();
    try {
      const fn = downloadCampaign({
        campaign: s.campaign,
        category: s.db?.colLabels[s.impactCat] ?? "",
        procs: s.procs,
        inputs: s.inputs,
        costP: s.costP,
        energyBill: s.energyBill,
        carbonPrice: s.carbonPrice,
        disrCost: s.disrCost,
        unitsPerCycle: s.unitsPerCycle,
        mixFile: s.mix?.fileName ?? "",
        rtFile: s.rt?.fileName ?? "",
        dbFile: s.db?.fileName ?? "",
        results: s.results,
        series: s.seriesArchive,
        log: s.log,
      });
      get().addLog(`Results saved: ${fn} (+ JSON state)`);
      set({ status: `Results saved to ${fn} (workbook) and .json (state).` });
    } catch (e) {
      set({ alert: { title: "Save results", message: e instanceof Error ? e.message : String(e), kind: "error" } });
    }
  },

  loadSampleCampaign: () => {
    stopTimer();
    runner = null;
    const db = makeDemoDatabase();
    const { procs, inputs: rawIn, costP } = makeSampleSystem(db);
    const rt = makeDemoRT();
    const mix = makeDemoMix();
    const price = makeDemoPrices();
    const inputs = mapRtToSample(rawIn, rt);
    const mixCf = mapMixCol(db, mix.src, 0);
    const mixCed = mapMixCed(db, mix.src);
    const clockTime = defaultClock(mix.T, price.T);
    set({
      db,
      loaded: true,
      impactCat: 0,
      procs,
      inputs,
      procsDone: true,
      flowsDone: true,
      costsSet: true,
      costP,
      energyBill: 0.25,
      carbonPrice: 45,
      disrCost: 18,
      unitsPerCycle: 1,
      rt,
      mix,
      mixCf,
      mixCed,
      price,
      clockTime,
      campaign: "Gate_to_gate_demo",
      staticLca: 8.4,
      soglia: 0,
      expN: 1,
      tOffset: 0,
      hotN: 0,
      results: [],
      seriesArchive: [],
      live: null,
      configDone: true,
      step: 6,
      maxStep: 6,
      tab: 0,
      draft: { ...defaultDraft(), selectedProc: 0 },
    });
    get().addLog(`[Gate_to_gate_demo] Sample campaign loaded (category: ${trunc(db.colLabels[0]!, 40)}).`);
    get().addLog("Energy columns -> unit processes:");
    inputs
      .filter((f) => f.dataType === "real-time")
      .forEach((f) => get().addLog(`   ${f.rtColName.padEnd(22)} -> ${procs[f.proc]}`));
    mix.src.forEach((src, q) => get().addLog(`   ${src.padEnd(17)} cf = ${mixCf[q]}`));
    get().addLog(`Grid mix window start: ${fmtStamp(clockTime!)}`);
    get().addLog(`Energy price: 15-min market price from ${fmtStamp(clockTime!)} (replaces the bill price).`);
    armPrepared(get);
    set({ status: 'Sample campaign ready: press START. Three unit processes, live energy, Italian grid mix.' });
  },

  editFlowQty: (i, qty) =>
    set((s) => ({
      inputs: s.inputs.map((f, k) => (k === i ? { ...f, qty } : f)),
      configDone: false,
    })),
}));

function filteredDbIndex(db: Database, draft: DraftFlow): number[] {
  let m = db.procNames.map((_, i) => i);
  if (draft.tipo === "Energy") m = m.filter((i) => db.procUnits[i]!.toLowerCase() === "mj");
  const kw = draft.kw.trim().toLowerCase();
  if (kw) m = m.filter((i) => db.procNames[i]!.toLowerCase().includes(kw));
  return m;
}

export function filteredDb(db: Database, draft: DraftFlow) {
  const idx = filteredDbIndex(db, draft);
  return { idx, capped: idx.slice(0, 250), nAll: idx.length };
}

function defaultClock(mixT?: number[], priceT?: number[]): number | null {
  const T = mixT?.length ? mixT : priceT;
  if (!T?.length) return null;
  const target = Date.UTC(2026, 7, 31, 15, 0, 0);
  let best = T[0]!;
  let d = Math.abs(best - target);
  for (const t of T) {
    const dd = Math.abs(t - target);
    if (dd < d) {
      best = t;
      d = dd;
    }
  }
  return best;
}

function finishConfirm(set: (p: Partial<AppState> | ((s: AppState) => Partial<AppState>)) => void, get: () => AppState) {
  const s = get();
  const camp = s.campaign.trim() || "Campaign_1";
  const hasRt = s.inputs.some((f) => f.dataType === "real-time");
  if (hasRt && s.price && s.clockTime) {
    get().addLog(`Energy price: 15-min market price from ${fmtStamp(s.clockTime)} (replaces the bill price).`);
  } else if (hasRt) {
    get().addLog(`Energy price: fixed bill price ${s.energyBill.toFixed(4)} EUR/kWh.`);
  }
  if (hasRt && s.mix && s.clockTime) {
    const { sh, cf } = mixAt(s.mix, s.mixCf, s.clockTime);
    get().addLog(`Grid mix window start: ${fmtStamp(s.clockTime)}  (cf mix = ${cf})`);
    s.mix.src.forEach((src, q) => get().addLog(`   ${src.padEnd(17)} ${(100 * sh[q]!).toFixed(1)}%`));
  } else if (hasRt) {
    get().addLog("Grid mix NOT loaded: real-time flows use their fixed dataset CF.");
  }
  get().addLog(`[${camp}] Campaign started (category: ${trunc(s.db?.colLabels[s.impactCat] ?? "", 40)}).`);
  set({
    campaign: camp,
    configDone: true,
    expN: 1,
    tOffset: 0,
    hotN: 0,
    results: [],
    seriesArchive: [],
    live: null,
    status: `Campaign "${camp}" ready: press START.`,
  });
  armPrepared(get);
  get().gotoStep(6);
}

function armPrepared(get: () => AppState) {
  const s = get();
  prepared = prepareCycle({
    inputs: s.inputs,
    procs: s.procs,
    rt: s.rt,
    mix: s.mix,
    mixCf: s.mixCf,
    mixCed: s.mixCed,
    mixStart: s.clockTime ?? NaN,
    price: s.price,
    energyBill: s.energyBill,
    costP: s.costP,
    carbonPrice: s.carbonPrice,
    disrCost: s.disrCost,
    soglia: s.soglia,
    statVal: s.staticLca,
    unitsPerCycle: s.unitsPerCycle,
    tOffset: s.tOffset,
    expN: s.expN,
    campaign: s.campaign,
    category: s.db?.colLabels[s.impactCat] ?? "",
  });
  runner = initRunner(prepared, 0);
}

function resetForNewCycle(set: (p: Partial<AppState>) => void, get: () => AppState) {
  const s = get();
  set({
    live: null,
    hotN: s.hotN,
    status: `Cycle ${s.expN} ready: press START.`,
  });
  armPrepared(get);
}

function completeCycle(
  set: (p: Partial<AppState> | ((s: AppState) => Partial<AppState>)) => void,
  get: () => AppState,
  live: LiveSnapshot,
) {
  stopTimer();
  if (!prepared) return;
  const notes = qualityNotes(prepared, live);
  const R = finishResult(prepared, live, notes);
  const s = get();
  const tvec = prepared.tvec;
  const tOffset = s.tOffset + (tvec[tvec.length - 1]! - tvec[0]!) + Math.max(1, 0.03 * (tvec[tvec.length - 1]! - tvec[0]!));
  get().addLog(`[${s.campaign}] Cycle ${s.expN} completed: total impact = ${live.cumTot}`);
  s.procs.forEach((p, i) => get().addLog(`   ${trunc(p, 16).padEnd(16)} = ${live.procImp[i]}`));
  if (prepared.statVal > 0) {
    const dperc = (100 * (live.cumTot - prepared.statVal)) / prepared.statVal;
    get().addLog(`   Delta% vs static LCA = ${dperc >= 0 ? "+" : ""}${dperc.toFixed(2)}%  (RT=${live.cumTot}, static=${prepared.statVal})`);
  }
  const elapsedH = (tvec[tvec.length - 1]! - tvec[0]!) / 3600;
  get().addLog(
    `   LCC total = ${live.costTot.toFixed(2)} EUR: energy ${live.costEnergy.toFixed(2)} | disruption ${live.costDisr.toFixed(2)}`,
  );
  get().addLog(`   Cost per product unit = ${R.costPerUnit.toFixed(4)} EUR/unit (${s.unitsPerCycle} units per cycle)`);
  get().addLog(`   CED = ${R.cedTotal} MJ (renewable ${R.cedRenewable})`);
  notes.forEach((n) => get().addLog(`   DATA QUALITY ${n}`));
  get().addLog(`   Cycle ${s.expN} stored in the results archive (press SAVE RESULTS to write it to file).`);
  set({
    running: false,
    results: [...s.results, R],
    seriesArchive: [...s.seriesArchive, seriesMatrix(live)],
    tOffset,
    live,
    status: `Cycle ${s.expN} completed. Press NEW CYCLE for the next run.`,
  });
  if (notes.length) {
    set({
      alert: {
        title: "Data quality: dominant contribution not real-time",
        message: notes.join("\n"),
        kind: "info",
      },
    });
  }
}

export function clockDays(s: { mix: MixFile | null; price: PriceFile | null }): number[] {
  const T = s.mix?.T ?? s.price?.T ?? [];
  const days = Array.from(new Set(T.map((t) => Date.UTC(new Date(t).getUTCFullYear(), new Date(t).getUTCMonth(), new Date(t).getUTCDate()))));
  return days.sort((a, b) => a - b);
}

export function clockTimes(s: { mix: MixFile | null; price: PriceFile | null }, day: number): number[] {
  const T = s.mix?.T ?? s.price?.T ?? [];
  return T.filter((t) => {
    const d = new Date(t);
    return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()) === day;
  });
}

export function mixCfAt(s: { mix: MixFile | null; mixCf: number[]; price: PriceFile | null }, t: number | null): string {
  if (t == null) return "cf: -";
  if (s.mix) {
    const { cf } = mixAt(s.mix, s.mixCf, t);
    return `cf=${cf.toPrecision(4)}`;
  }
  if (s.price) {
    let ip = 0;
    for (let k = 0; k < s.price.T.length; k++) if (s.price.T[k]! <= t) ip = k;
    return `${s.price.kwh[ip]!.toFixed(3)} EUR/kWh`;
  }
  return "cf: -";
}
