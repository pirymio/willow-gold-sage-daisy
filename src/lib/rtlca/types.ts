export type DataType = "static" | "quasi-static" | "dynamic" | "real-time";
export type FlowDir = "Input" | "Output";
export type FlowTipo = "Matter" | "Energy";
export type LawKind = "linear" | "sinusoidal" | "exponential" | "custom";

export interface InputFlow {
  id: string;
  nome: string;
  tipo: FlowTipo;
  proc: number;
  dir: FlowDir;
  price: number;
  cedF: [number, number];
  procIdx: number;
  rowSheet: number;
  unit: string;
  qty: number | null;
  colIdx: number;
  cf: number;
  cfLabel: string;
  dataType: DataType;
  lawTxt: string;
  lawKind: LawKind;
  lawA: number;
  lawB: number;
  lawW: number;
  lawExpr: string;
  rtCol: number;
  rtColName: string;
  rtConv: number;
}

export interface Database {
  raw: (string | number | null)[][];
  coefCols: number[];
  colLabels: string[];
  procNames: string[];
  procUnits: string[];
  procRow: number[];
  cedCol: number;
  cedNRCols: number[];
  cedRCols: number[];
  fileName: string;
}

export interface RTFile {
  t: number[];
  data: number[][];
  names: string[];
  units: string[];
  fileName: string;
}

export interface MixFile {
  T: number[];
  src: string[];
  gen: number[][];
  fileName: string;
}

export interface PriceFile {
  T: number[];
  kwh: number[];
  zone: string;
  fileName: string;
}

export interface CycleResult {
  campaign: string;
  cycle: number;
  category: string;
  processes: string[];
  procImpact: number[];
  totalImpact: number;
  staticLca: number;
  deltaPerc: number | null;
  flowImpact: number[];
  flowCost: number[];
  flowCED: [number, number][];
  costTotal: number;
  costEnergy: number;
  costDisruption: number;
  costPerUnit: number;
  cedTotal: number;
  cedRenewable: number;
  hotspots: number;
  dataQualityNotes: string[];
  mixStart: string;
  timestamp: string;
}

export interface SeriesPt {
  t: number;
  tg: number;
  inst: number;
  cum: number;
  cost: number;
  costE: number;
  ced: number;
  cedR: number;
  cfMix: number;
  price: number;
  hot: boolean;
  vals: number[];
  eIns: number[];
  mixShare: number[];
}

export interface ProcCostStack {
  flowCosts: number[];
  capex: number;
  labour: number;
  opex: number;
  carbon: number;
  total: number;
}

export interface LiveSnapshot {
  idx: number;
  nSteps: number;
  instTot: number;
  cumTot: number;
  costTot: number;
  costEnergy: number;
  costDisr: number;
  hotN: number;
  procImp: number[];
  flowImp: number[];
  flowCost: number[];
  flowCed: [number, number][];
  cedP: [number, number][];
  costStack: ProcCostStack[];
  mixShare: number[];
  mixCf: number;
  mixLabel: string;
  gaugeCum: number[];
  gaugeInst: number[];
  gaugeMaxCum: number;
  gaugeMaxInst: number;
  alarm: string;
  dq: string;
  alarmProcs: boolean[];
  elapsedH: number;
  rtNames: string[];
  done: boolean;
  series: SeriesPt[];
  valHistory: { tg: number; vals: number[] }[];
}

export const COST_ITEMS = [
  "Machine depreciation (CAPEX)",
  "Tooling / dies amortisation",
  "Labour (operators)",
  "Planned maintenance",
  "Auxiliary utilities (air, water, cooling)",
  "Consumables (lubricants, cleaning)",
  "Allocated overheads (indirect)",
] as const;

export const COST_UNITS = COST_ITEMS.map(() => "EUR/h");

export const STEP_NAMES = [
  "Database",
  "System definition",
  "Flows (LCI)",
  "Costs (LCC)",
  "RT source, mix, price",
  "Run the campaign",
] as const;

export const TAB_NAMES = ["MAP", "IMPACT", "ENERGY", "PARETO", "LCC", "CED"] as const;
