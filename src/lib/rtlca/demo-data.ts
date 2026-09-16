import type { Database, MixFile, PriceFile, RTFile } from "./types";

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
