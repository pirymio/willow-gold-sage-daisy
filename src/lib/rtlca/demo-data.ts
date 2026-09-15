import type { Database, InputFlow, MixFile, PriceFile, RTFile } from "./types";
import { COST_ITEMS } from "./types";
import { energyToMJ, newInputTemplate, uid } from "./util";

type RowSpec = {
  name: string;
  unit: string;
  climate: number;
  acid: number;
  eutro: number;
  ced: number;
  nrF: number;
  nrN: number;
  nrB: number;
  rB: number;
  rWsg: number;
  rW: number;
};

const ROWS: RowSpec[] = [
  { name: "Electricity Italy production mix, at consumer", unit: "MJ", climate: 0.108, acid: 0.00042, eutro: 0.00008, ced: 2.35, nrF: 1.72, nrN: 0.31, nrB: 0.02, rB: 0.04, rWsg: 0.14, rW: 0.12 },
  { name: "Electricity from natural gas, EU mix", unit: "MJ", climate: 0.142, acid: 0.00031, eutro: 0.00005, ced: 2.55, nrF: 2.41, nrN: 0.06, nrB: 0.01, rB: 0.02, rWsg: 0.03, rW: 0.02 },
  { name: "Electricity from average onshore wind", unit: "MJ", climate: 0.0034, acid: 0.00002, eutro: 0.000004, ced: 1.08, nrF: 0.18, nrN: 0.02, nrB: 0.01, rB: 0.02, rWsg: 0.84, rW: 0.01 },
  { name: "Electricity from PV panel, Italy", unit: "MJ", climate: 0.0148, acid: 0.00007, eutro: 0.000012, ced: 1.22, nrF: 0.38, nrN: 0.04, nrB: 0.01, rB: 0.03, rWsg: 0.74, rW: 0.02 },
  { name: "Electricity from hydropower, alpine", unit: "MJ", climate: 0.0019, acid: 0.00001, eutro: 0.000002, ced: 1.05, nrF: 0.06, nrN: 0.01, nrB: 0.0, rB: 0.01, rWsg: 0.02, rW: 0.95 },
  { name: "Electricity from geothermal", unit: "MJ", climate: 0.011, acid: 0.00009, eutro: 0.00001, ced: 1.18, nrF: 0.22, nrN: 0.03, nrB: 0.01, rB: 0.02, rWsg: 0.88, rW: 0.02 },
  { name: "Heat, natural gas boiler", unit: "MJ", climate: 0.068, acid: 0.00018, eutro: 0.00003, ced: 1.18, nrF: 1.12, nrN: 0.02, nrB: 0.01, rB: 0.01, rWsg: 0.01, rW: 0.01 },
  { name: "Steel, low-alloy, hot rolled", unit: "kg", climate: 1.92, acid: 0.0064, eutro: 0.0011, ced: 24.4, nrF: 21.8, nrN: 0.9, nrB: 0.2, rB: 0.4, rWsg: 0.6, rW: 0.5 },
  { name: "Steel, stainless 304", unit: "kg", climate: 4.62, acid: 0.018, eutro: 0.0032, ced: 62.0, nrF: 54.0, nrN: 3.1, nrB: 0.4, rB: 0.8, rWsg: 2.1, rW: 1.6 },
  { name: "Aluminium, primary, ingot", unit: "kg", climate: 12.4, acid: 0.052, eutro: 0.0078, ced: 158, nrF: 96, nrN: 48, nrB: 1.2, rB: 1.8, rWsg: 6.4, rW: 4.6 },
  { name: "Aluminium, recycled, ingot", unit: "kg", climate: 1.18, acid: 0.0048, eutro: 0.0007, ced: 18.6, nrF: 14.2, nrN: 2.1, nrB: 0.2, rB: 0.4, rWsg: 1.1, rW: 0.6 },
  { name: "Copper, cathode", unit: "kg", climate: 4.05, acid: 0.042, eutro: 0.006, ced: 52.0, nrF: 44.0, nrN: 3.4, nrB: 0.5, rB: 0.9, rWsg: 1.8, rW: 1.4 },
  { name: "Cast iron", unit: "kg", climate: 1.54, acid: 0.0055, eutro: 0.0009, ced: 19.8, nrF: 17.6, nrN: 0.8, nrB: 0.2, rB: 0.3, rWsg: 0.5, rW: 0.4 },
  { name: "HDPE granulate", unit: "kg", climate: 1.84, acid: 0.0041, eutro: 0.0006, ced: 76.2, nrF: 72.4, nrN: 1.1, nrB: 0.4, rB: 1.2, rWsg: 0.7, rW: 0.4 },
  { name: "PP granulate", unit: "kg", climate: 1.97, acid: 0.0044, eutro: 0.0007, ced: 73.5, nrF: 69.8, nrN: 1.0, nrB: 0.4, rB: 1.1, rWsg: 0.7, rW: 0.5 },
  { name: "PVC granulate", unit: "kg", climate: 2.21, acid: 0.0072, eutro: 0.001, ced: 58.4, nrF: 54.1, nrN: 1.4, nrB: 0.3, rB: 0.9, rWsg: 1.0, rW: 0.7 },
  { name: "Epoxy resin", unit: "kg", climate: 6.15, acid: 0.021, eutro: 0.0034, ced: 112, nrF: 102, nrN: 4.2, nrB: 0.6, rB: 1.5, rWsg: 2.4, rW: 1.3 },
  { name: "Glass fibre reinforced plastic", unit: "kg", climate: 8.42, acid: 0.028, eutro: 0.0041, ced: 128, nrF: 112, nrN: 6.1, nrB: 0.8, rB: 2.0, rWsg: 4.2, rW: 2.9 },
  { name: "Lubricating oil", unit: "kg", climate: 1.12, acid: 0.0084, eutro: 0.0015, ced: 52.8, nrF: 50.2, nrN: 0.8, nrB: 0.3, rB: 0.6, rWsg: 0.5, rW: 0.4 },
  { name: "Cutting fluid, emulsion", unit: "kg", climate: 0.62, acid: 0.0028, eutro: 0.0018, ced: 18.4, nrF: 16.1, nrN: 0.6, nrB: 0.2, rB: 0.7, rWsg: 0.5, rW: 0.3 },
  { name: "Welding electrode, steel", unit: "kg", climate: 2.48, acid: 0.0091, eutro: 0.0014, ced: 32.6, nrF: 28.4, nrN: 1.4, nrB: 0.3, rB: 0.6, rWsg: 1.1, rW: 0.8 },
  { name: "Argon, gaseous", unit: "kg", climate: 0.54, acid: 0.0012, eutro: 0.0002, ced: 8.6, nrF: 6.2, nrN: 1.4, nrB: 0.1, rB: 0.2, rWsg: 0.4, rW: 0.3 },
  { name: "Water, deionised", unit: "kg", climate: 0.0011, acid: 0.000004, eutro: 0.000002, ced: 0.042, nrF: 0.028, nrN: 0.006, nrB: 0.001, rB: 0.002, rWsg: 0.003, rW: 0.002 },
  { name: "Cardboard, corrugated", unit: "kg", climate: 0.82, acid: 0.0036, eutro: 0.0012, ced: 28.4, nrF: 12.2, nrN: 1.1, nrB: 0.4, rB: 13.6, rWsg: 0.6, rW: 0.5 },
  { name: "Wood pallet", unit: "kg", climate: 0.18, acid: 0.0011, eutro: 0.0004, ced: 18.2, nrF: 2.4, nrN: 0.3, nrB: 0.2, rB: 14.6, rWsg: 0.4, rW: 0.3 },
  { name: "Plastic film, LDPE", unit: "kg", climate: 2.08, acid: 0.0048, eutro: 0.0007, ced: 78.5, nrF: 74.6, nrN: 1.2, nrB: 0.4, rB: 1.1, rWsg: 0.7, rW: 0.5 },
  { name: "Paint, solvent-based", unit: "kg", climate: 3.42, acid: 0.014, eutro: 0.0026, ced: 68.0, nrF: 62.4, nrN: 2.1, nrB: 0.4, rB: 1.2, rWsg: 1.2, rW: 0.7 },
  { name: "Rubber, synthetic", unit: "kg", climate: 2.76, acid: 0.0094, eutro: 0.0015, ced: 84.2, nrF: 78.6, nrN: 2.0, nrB: 0.5, rB: 1.4, rWsg: 1.0, rW: 0.7 },
  { name: "Cement, Portland", unit: "kg", climate: 0.86, acid: 0.0018, eutro: 0.0003, ced: 4.6, nrF: 3.9, nrN: 0.2, nrB: 0.1, rB: 0.1, rWsg: 0.2, rW: 0.1 },
  { name: "Glass, flat", unit: "kg", climate: 0.92, acid: 0.0042, eutro: 0.0006, ced: 15.4, nrF: 13.1, nrN: 0.7, nrB: 0.2, rB: 0.4, rWsg: 0.6, rW: 0.4 },
  { name: "Paper, kraft", unit: "kg", climate: 0.64, acid: 0.0041, eutro: 0.0015, ced: 32.8, nrF: 10.4, nrN: 1.2, nrB: 0.5, rB: 19.2, rWsg: 0.8, rW: 0.7 },
  { name: "Brass", unit: "kg", climate: 3.18, acid: 0.028, eutro: 0.0044, ced: 44.0, nrF: 37.6, nrN: 2.6, nrB: 0.4, rB: 0.8, rWsg: 1.5, rW: 1.1 },
  { name: "Titanium alloy", unit: "kg", climate: 31.2, acid: 0.12, eutro: 0.018, ced: 360, nrF: 248, nrN: 86, nrB: 2.4, rB: 4.2, rWsg: 12.4, rW: 7.0 },
  { name: "Carbon fibre", unit: "kg", climate: 24.8, acid: 0.084, eutro: 0.012, ced: 286, nrF: 248, nrN: 18, nrB: 2.0, rB: 4.8, rWsg: 8.2, rW: 5.0 },
  { name: "Natural gas, burned", unit: "MJ", climate: 0.056, acid: 0.00011, eutro: 0.00002, ced: 1.12, nrF: 1.08, nrN: 0.01, nrB: 0.01, rB: 0.01, rWsg: 0.01, rW: 0.00 },
  { name: "Compressed air, 7 bar", unit: "MJ", climate: 0.125, acid: 0.00048, eutro: 0.00009, ced: 2.62, nrF: 1.94, nrN: 0.34, nrB: 0.02, rB: 0.05, rWsg: 0.16, rW: 0.11 },
  { name: "Steel chips, recycled credit", unit: "kg", climate: -1.12, acid: -0.0032, eutro: -0.0005, ced: -14.6, nrF: -13.1, nrN: -0.5, nrB: -0.1, rB: -0.2, rWsg: -0.4, rW: -0.3 },
  { name: "Welding fume, treated", unit: "kg", climate: 0.42, acid: 0.0084, eutro: 0.0021, ced: 6.8, nrF: 5.4, nrN: 0.5, nrB: 0.1, rB: 0.2, rWsg: 0.4, rW: 0.2 },
];

const LABELS: [string, string, string][] = [
  ["Climate change", "IPCC 2013 GWP 100a", "kg CO2 eq"],
  ["Acidification", "CML 2001", "kg SO2 eq"],
  ["Eutrophication", "CML 2001", "kg PO4 eq"],
  ["CED", "Cumulative Energy Demand", "MJ"],
  ["Non-renewable, fossil", "CED sub-category", "MJ"],
  ["Non-renewable, nuclear", "CED sub-category", "MJ"],
  ["Non-renewable, biomass", "CED sub-category", "MJ"],
  ["Renewable, biomass", "CED sub-category", "MJ"],
  ["Renewable, wind/solar/geo", "CED sub-category", "MJ"],
  ["Renewable, water", "CED sub-category", "MJ"],
];

function cleanLabel(a: string, b: string, c: string) {
  return [a, b, c].filter((s) => s && !s.startsWith(".")).join(" - ");
}

export function makeDemoDatabase(): Database {
  const nC = 6 + LABELS.length;
  const raw: (string | number | null)[][] = [];
  raw[0] = Array(nC).fill(null);
  raw[1] = Array(nC).fill(null);
  raw[2] = Array(nC).fill(null);
  LABELS.forEach((L, i) => {
    raw[0]![6 + i] = L[0];
    raw[1]![6 + i] = L[1];
    raw[2]![6 + i] = L[2];
  });
  raw[0]![4] = "Unit";
  raw[0]![5] = "Process";
  const procNames: string[] = [];
  const procUnits: string[] = [];
  const procRow: number[] = [];
  ROWS.forEach((r, i) => {
    const row = Array(nC).fill(null) as (string | number | null)[];
    row[4] = r.unit;
    row[5] = r.name;
    const vals = [r.climate, r.acid, r.eutro, r.ced, r.nrF, r.nrN, r.nrB, r.rB, r.rWsg, r.rW];
    vals.forEach((v, k) => {
      row[6 + k] = v;
    });
    raw[3 + i] = row;
    procNames.push(r.name);
    procUnits.push(r.unit);
    procRow.push(3 + i);
  });
  const coefCols = LABELS.map((_, i) => 6 + i);
  const colLabels = LABELS.map((L) => cleanLabel(L[0], L[1], L[2]));
  const cedCol = colLabels.findIndex((s) => s.trim().toUpperCase().startsWith("CED"));
  const cedNRCols: number[] = [];
  const cedRCols: number[] = [];
  if (cedCol >= 0) {
    const c0 = coefCols[cedCol]!;
    colLabels.forEach((lab, i) => {
      const c = coefCols[i]!;
      if (c > c0 && c <= c0 + 6) {
        if (lab.trim().toLowerCase().startsWith("non-renewable")) cedNRCols.push(i);
        else if (lab.trim().toLowerCase().startsWith("renewable")) cedRCols.push(i);
      }
    });
  }
  return {
    raw,
    coefCols,
    colLabels,
    procNames,
    procUnits,
    procRow,
    cedCol,
    cedNRCols,
    cedRCols,
    fileName: "dataset.xlsx (demo)",
  };
}

function findProc(db: Database, needle: string): number {
  const i = db.procNames.findIndex((n) => n.toLowerCase().includes(needle.toLowerCase()));
  if (i < 0) throw new Error(`Demo process not found: ${needle}`);
  return i;
}

export function cedFactors(db: Database, ip: number): [number, number] {
  if (db.cedCol < 0) return [0, 0];
  const r = db.procRow[ip]!;
  let nr = 0;
  let rn = 0;
  for (const c of db.cedNRCols) {
    const v = db.raw[r]![db.coefCols[c]!];
    if (typeof v === "number" && Number.isFinite(v)) nr += v;
  }
  for (const c of db.cedRCols) {
    const v = db.raw[r]![db.coefCols[c]!];
    if (typeof v === "number" && Number.isFinite(v)) rn += v;
  }
  if (db.cedNRCols.length === 0 && db.cedRCols.length === 0) {
    const v = db.raw[r]![db.coefCols[db.cedCol]!];
    if (typeof v === "number" && Number.isFinite(v)) nr = v;
  }
  return [nr, rn];
}

function flowFromDb(
  db: Database,
  nameNeedle: string,
  proc: number,
  dir: InputFlow["dir"],
  dataType: InputFlow["dataType"],
  qty: number | null,
  extra?: Partial<InputFlow>,
): InputFlow {
  const ip = findProc(db, nameNeedle);
  const ic = 0;
  const v = db.raw[db.procRow[ip]!]![db.coefCols[ic]!];
  const in_ = newInputTemplate();
  in_.id = uid();
  in_.nome = db.procNames[ip]!;
  in_.tipo = db.procUnits[ip] === "MJ" ? "Energy" : "Matter";
  in_.proc = proc;
  in_.dir = dir;
  in_.procIdx = ip;
  in_.rowSheet = db.procRow[ip]!;
  in_.unit = db.procUnits[ip]!;
  in_.colIdx = ic;
  in_.cf = typeof v === "number" ? v : 0;
  in_.cfLabel = db.colLabels[ic]!;
  in_.dataType = dataType;
  in_.qty = qty;
  in_.cedF = cedFactors(db, ip);
  return { ...in_, ...extra };
}

export function makeSampleSystem(db: Database): {
  procs: string[];
  inputs: InputFlow[];
  costP: number[][];
} {
  const procs = ["Machining", "Welding", "Assembly"];
  const inputs: InputFlow[] = [
    flowFromDb(db, "Steel, low-alloy", 0, "Input", "static", 2.4, { price: 1.85 }),
    flowFromDb(db, "Lubricating oil", 0, "Input", "quasi-static", 0.04, { price: 4.2 }),
    flowFromDb(db, "Electricity Italy production", 0, "Input", "real-time", null, { tipo: "Energy" }),
    flowFromDb(db, "Steel chips", 0, "Output", "static", 0.35, { price: 0.12 }),
    flowFromDb(db, "Welding electrode", 1, "Input", "static", 0.18, { price: 6.4 }),
    flowFromDb(db, "Argon, gaseous", 1, "Input", "static", 0.22, { price: 1.1 }),
    flowFromDb(db, "Electricity Italy production", 1, "Input", "real-time", null, { tipo: "Energy" }),
    flowFromDb(db, "Welding fume", 1, "Output", "dynamic", null, {
      lawKind: "sinusoidal",
      lawA: 0.008,
      lawB: 0.006,
      lawW: 0.12,
      lawTxt: "0.008 + 0.006*sin(0.12*t)",
      price: 2.4,
    }),
    flowFromDb(db, "HDPE granulate", 2, "Input", "static", 0.65, { price: 1.45 }),
    flowFromDb(db, "Electricity Italy production", 2, "Input", "real-time", null, { tipo: "Energy" }),
    flowFromDb(db, "Cardboard, corrugated", 2, "Input", "static", 0.28, { price: 0.55 }),
  ];
  const costP = [
    [4.8, 1.2, 18.5, 2.1, 1.4, 0.6, 3.2],
    [3.1, 0.8, 22.0, 1.6, 1.1, 0.9, 2.8],
    [2.4, 0.4, 16.0, 1.1, 0.8, 0.4, 2.2],
  ];
  if (costP[0]!.length !== COST_ITEMS.length) throw new Error("cost items mismatch");
  return { procs, inputs, costP };
}

function cumEnergy(n: number, dt: number, rate: (t: number) => number): number[] {
  const out = new Array<number>(n);
  let e = 0;
  for (let i = 0; i < n; i++) {
    const t = i * dt;
    e += rate(t) * dt;
    out[i] = e;
  }
  return out;
}

export function makeDemoRT(): RTFile {
  const dt = 0.5;
  const tMax = 120;
  const n = Math.floor(tMax / dt) + 1;
  const t = Array.from({ length: n }, (_, i) => i * dt);
  const machining = cumEnergy(n, dt, (s) => {
    if (s < 8) return 0.22;
    if (s < 42) return 2.4 + 0.25 * Math.sin(0.4 * s);
    if (s < 52) return 0.25;
    if (s < 92) return 2.2 + 0.3 * Math.sin(0.35 * s);
    return 0.2;
  });
  const welding = cumEnergy(n, dt, (s) => {
    const pulse = (a: number, b: number) => (s >= a && s < b ? 3.8 : 0);
    return 0.04 + pulse(18, 28) + pulse(48, 58) + pulse(78, 90);
  });
  const assembly = cumEnergy(n, dt, (s) => 0.32 + (s > 30 && s < 100 ? 0.18 : 0));
  return {
    t,
    data: t.map((_, i) => [machining[i]!, welding[i]!, assembly[i]!]),
    names: ["Spindle energy (C)", "Welder energy (D)", "Line auxiliaries (E)"],
    units: ["Wh", "Wh", "Wh"],
    fileName: "test_imbriglio_1.xlsx (demo)",
  };
}

export function makeDemoMix(): MixFile {
  const start = Date.UTC(2026, 7, 30, 0, 0, 0);
  const end = Date.UTC(2026, 8, 2, 0, 0, 0);
  const step = 15 * 60 * 1000;
  const src = ["Thermal", "Wind", "Photovoltaic", "Self-consumption", "Hydro", "Geothermal"];
  const T: number[] = [];
  const gen: number[][] = [];
  for (let ms = start; ms < end; ms += step) {
    const d = new Date(ms);
    const h = d.getUTCHours() + d.getUTCMinutes() / 60;
    const day = Math.floor((ms - start) / 86400000);
    const pv = h >= 6 && h <= 20 ? 9200 * Math.sin(((h - 6) / 14) * Math.PI) * (0.85 + 0.15 * Math.sin(day)) : 0;
    const wind = 2800 + 1600 * Math.sin((h / 24) * 2 * Math.PI + day) + 400 * Math.sin(h);
    const hydro = 4100 + 200 * Math.sin(day);
    const geo = 820;
    const self = 0.28 * pv;
    const demand = 28500 + 4000 * Math.sin(((h - 8) / 24) * 2 * Math.PI);
    const thermal = Math.max(6500, demand - pv - wind - hydro - geo);
    T.push(ms);
    gen.push([thermal, Math.max(0, wind), Math.max(0, pv), Math.max(0, self), hydro, geo]);
  }
  return { T, src, gen, fileName: "terna_agosto.xlsx (demo)" };
}

export function makeDemoPrices(): PriceFile {
  const start = Date.UTC(2026, 7, 30, 0, 0, 0);
  const end = Date.UTC(2026, 8, 2, 0, 0, 0);
  const step = 15 * 60 * 1000;
  const T: number[] = [];
  const kwh: number[] = [];
  for (let ms = start; ms < end; ms += step) {
    const d = new Date(ms);
    const h = d.getUTCHours() + d.getUTCMinutes() / 60;
    const mwh = 92 + 38 * Math.sin(((h - 9) / 24) * 2 * Math.PI) + 8 * Math.sin(h * 0.7);
    T.push(ms);
    kwh.push(mwh / 1000);
  }
  return { T, kwh, zone: "IT-South", fileName: "energy-charts_IT_week36_2026.xlsx (demo)" };
}

export function mapRtToSample(inputs: InputFlow[], rt: RTFile): InputFlow[] {
  const rtIdx = inputs
    .map((f, i) => ({ f, i }))
    .filter((x) => x.f.dataType === "real-time")
    .sort((a, b) => a.f.proc - b.f.proc);
  return inputs.map((f, i) => {
    const k = rtIdx.findIndex((x) => x.i === i);
    if (k < 0 || k >= rt.names.length) return f;
    const fProc = energyToMJ(f.unit);
    const conv = energyToMJ(rt.units[k]!) / (Number.isNaN(fProc) ? 1 : fProc);
    return {
      ...f,
      rtCol: k,
      rtColName: rt.names[k]!,
      rtConv: conv,
      nome: `${["Machining", "Welding", "Assembly"][f.proc] ?? "P"} <- ${rt.names[k]}`,
    };
  });
}
