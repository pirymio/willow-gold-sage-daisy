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
  makeDemoMix,
  makeDemoPrices,
  makeDemoRT,
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
  status: "Welcome: start from Step 1 by uploading your coefficient database.",

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
      `   energy ${s.energyBill.toFixed(4)} EUR/kWh | carbon ${s.carbonPrice.toFixed(1)} EUR/tCO2e | disruption ${s.disrCost.toFixed(2)} EUR/h | ${s.unitsPerCycle} 
