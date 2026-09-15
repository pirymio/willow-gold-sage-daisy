import type {
  CycleResult,
  Database,
  InputFlow,
  LiveSnapshot,
  MixFile,
  PriceFile,
  ProcCostStack,
  RTFile,
  SeriesPt,
} from "./types";
import { COST_ITEMS } from "./types";
import { energyToMJ, evalLaw, fmtStamp, trunc } from "./util";

export function mixAt(mix: MixFile, mixCf: number[], dn: number): { sh: number[]; cf: number } {
  let i = 0;
  for (let k = 0; k < mix.T.length; k++) {
    if (mix.T[k]! <= dn) i = k;
    else break;
  }
  const g = mix.gen[i]!.map((x) => (Number.isFinite(x) && x > 0 ? x : 0));
  const tot = g.reduce((a, b) => a + b, 0);
  const sh = tot > 0 ? g.map((x) => x / tot) : g.map(() => 0);
  const cf = sh.reduce((a, s, q) => a + s * (mixCf[q] ?? 0), 0);
  return { sh, cf };
}

export function mapMixCol(db: Database, mixSrc: string[], colIdx: number): number[] {
  const kw: Record<string, string> = {
    Thermal: "electricity gas eu",
    Wind: "average onshore",
    Photovoltaic: "pv panel",
    "Self-consumption": "pv panel",
    Hydro: "hydropower",
    Geothermal: "__none__",
  };
  const fb = "electricity italy production";
  return mixSrc.map((src) => {
    const pat = kw[src] ?? "__none__";
    let idx = -1;
    if (pat !== "__none__") {
      idx = db.procNames.findIndex(
        (n, i) => db.procUnits[i]!.trim().toLowerCase() === "mj" && n.toLowerCase().includes(pat),
      );
    }
    if (idx < 0) {
      idx = db.procNames.findIndex(
        (n, i) => db.procUnits[i]!.trim().toLowerCase() === "mj" && n.toLowerCase().includes(fb),
      );
    }
    if (idx < 0) throw new Error(`No dataset row found for grid source "${src}".`);
    const v = db.raw[db.procRow[idx]!]![db.coefCols[colIdx]!];
    if (typeof v !== "number" || !Number.isFinite(v)) throw new Error(`Non-numeric CF for source "${src}".`);
    return v;
  });
}

export function mapMixCed(db: Database, mixSrc: string[]): number[][] {
  const nS = mixSrc.length;
  const M = Array.from({ length: nS }, () => [0, 0] as [number, number]);
  if (db.cedCol < 0) return M;
  for (const c of db.cedNRCols) {
    const v = mapMixCol(db, mixSrc, c);
    v.forEach((x, q) => {
      M[q]![0] += x;
    });
  }
  for (const c of db.cedRCols) {
    const v = mapMixCol(db, mixSrc, c);
    v.forEach((x, q) => {
      M[q]![1] += x;
    });
  }
  return M;
}

export interface PreparedCycle {
  tvec: number[];
  nSteps: number;
  nIn: number;
  nP: number;
  nRt: number;
  rtList: number[];
  inputs: InputFlow[];
  procs: string[];
  useMix: boolean;
  usePrice: boolean;
  useCedMix: boolean;
  cfMixVec: number[];
  shareVec: number[][];
  cedMixVec: number[][];
  priceVec: number[];
  kwhPerUnit: number[];
  capexP: number[];
  labP: number[];
  opxP: number[];
  carbonP: number;
  disrRate: number;
  dtStep: number;
  soglia: number;
  statVal: number;
  mixStart: number;
  unitsPerCycle: number;
  tOffset: number;
  expN: number;
  campaign: string;
  category: string;
  mixSrc: string[];
}

export function prepareCycle(args: {
  inputs: InputFlow[];
  procs: string[];
  rt: RTFile | null;
  mix: MixFile | null;
  mixCf: number[];
  mixCed: number[][];
  mixStart: number;
  price: PriceFile | null;
  energyBill: number;
  costP: number[][];
  carbonPrice: number;
  disrCost: number;
  soglia: number;
  statVal: number;
  unitsPerCycle: number;
  tOffset: number;
  expN: number;
  campaign: string;
  category: string;
}): PreparedCycle {
  const { inputs, procs } = args;
  const rtList = inputs.map((f, i) => (f.dataType === "real-time" && f.rtCol >= 0 ? i : -1)).filter((i) => i >= 0);
  const tvec =
    rtList.length && args.rt ? args.rt.t.slice() : Array.from({ length: 241 }, (_, i) => i * 0.5);
  const nSteps = tvec.length;
  const nIn = inputs.length;
  const nP = procs.length;
  const useMix = rtList.length > 0 && !!args.mix && Number.isFinite(args.mixStart);
  const usePrice = rtList.length > 0 && !!args.price && Number.isFinite(args.mixStart);
  const cfMixVec = new Array<number>(nSteps).fill(0);
  const shareVec: number[][] = Array.from({ length: nSteps }, () => []);
  const cedMixVec: number[][] = Array.from({ length: nSteps }, () => [0, 0]);
  if (useMix && args.mix) {
    for (let kk = 0; kk < nSteps; kk++) {
      const dn = args.mixStart + ((tvec[kk]! - tvec[0]!) / 86400) * 1000;
      const { sh, cf } = mixAt(args.mix, args.mixCf, dn);
      shareVec[kk] = sh;
      cfMixVec[kk] = cf;
      if (args.mixCed.length) {
        const nr = sh.reduce((a, s, q) => a + s * (args.mixCed[q]?.[0] ?? 0), 0);
        const rn = sh.reduce((a, s, q) => a + s * (args.mixCed[q]?.[1] ?? 0), 0);
        cedMixVec[kk] = [nr, rn];
      }
    }
  }
  const priceVec = new Array<number>(nSteps).fill(args.energyBill);
  if (usePrice && args.price) {
    for (let kk = 0; kk < nSteps; kk++) {
      const dn = args.mixStart + ((tvec[kk]! - tvec[0]!) / 86400) * 1000;
      let ip = 0;
      for (let k = 0; k < args.price.T.length; k++) {
        if (args.price.T[k]! <= dn) ip = k;
        else break;
      }
      priceVec[kk] = args.price.kwh[ip] ?? args.energyBill;
    }
  }
  const kwhPerUnit = inputs.map((f) => {
    const fac = energyToMJ(f.unit);
    return Number.isNaN(fac) ? 0 : fac / 3.6;
  });
  const nItems = COST_ITEMS.length;
  const costP =
    args.costP.length === nP && args.costP[0]?.length === nItems
      ? args.costP
      : Array.from({ length: nP }, () => Array(nItems).fill(0));
  const capexP = costP.map((r) => (r[0] ?? 0) + (r[1] ?? 0));
  const labP = costP.map((r) => r[2] ?? 0);
  const opxP = costP.map((r) => r.slice(3).reduce((a, b) => a + b, 0));
  const diffs = tvec.slice(1).map((x, i) => x - tvec[i]!);
  const dtStep = median(diffs.filter((d) => d > 0)) || 1;
  const useCedMix = useMix && args.mixCed.some((r) => r[0] !== 0 || r[1] !== 0);
  return {
    tvec,
    nSteps,
    nIn,
    nP,
    nRt: rtList.length,
    rtList,
    inputs,
    procs,
    useMix,
    usePrice,
    useCedMix,
    cfMixVec,
    shareVec,
    cedMixVec,
    priceVec,
    kwhPerUnit,
    capexP,
    labP,
    opxP,
    carbonP: args.carbonPrice / 1000,
    disrRate: args.disrCost,
    dtStep,
    soglia: args.soglia,
    statVal: args.statVal,
    mixStart: args.mixStart,
    unitsPerCycle: args.unitsPerCycle,
    tOffset: args.tOffset,
    expN: args.expN,
    campaign: args.campaign,
    category: args.category,
    mixSrc: args.mix?.src ?? [],
  };
}

function median(a: number[]): number {
  if (!a.length) return NaN;
  const s = [...a].sort((x, y) => x - y);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m]! : (s[m - 1]! + s[m]!) / 2;
}

export interface RunnerState {
  k: number;
  prevCum: number[];
  heldE: number[];
  heldI: number[];
  hasEv: boolean[];
  impCumRT: number[];
  costCumRT: number[];
  cedCumRT: [number, number][];
  costDisr: number;
  hotN: number;
  alarmDone: boolean[];
  series: SeriesPt[];
  valHistory: { tg: number; vals: number[] }[];
  lastImps: number[];
  lastCosts: number[];
  lastCed: [number, number][];
  lastInst: number[];
}

export function initRunner(P: PreparedCycle, hotN = 0): RunnerState {
  const n = Math.max(P.nRt, 1);
  return {
    k: 0,
    prevCum: Array(n).fill(NaN),
    heldE: Array(n).fill(NaN),
    heldI: Array(n).fill(NaN),
    hasEv: Array(n).fill(false),
    impCumRT: Array(n).fill(0),
    costCumRT: Array(n).fill(0),
    cedCumRT: Array.from({ length: n }, () => [0, 0] as [number, number]),
    costDisr: 0,
    hotN,
    alarmDone: Array(P.nP).fill(false),
    series: [],
    valHistory: [],
    lastImps: Array(P.nIn).fill(0),
    lastCosts: Array(P.nIn).fill(0),
    lastCed: Array.from({ length: P.nIn }, () => [0, 0] as [number, number]),
    lastInst: Array(P.nIn).fill(0),
  };
}

export function stepBatch(
  P: PreparedCycle,
  R: RunnerState,
  rt: RTFile | null,
  batch: number,
): LiveSnapshot {
  const { inputs: Inp, tvec: tv, nIn, nP, rtList } = P;
  const kEnd = Math.min(R.k + batch, P.nSteps);
  const vals = new Array<number>(nIn).fill(0);
  const imps = R.lastImps.slice();
  const impsInst = new Array<number>(nIn).fill(0);
  const costs = R.lastCosts.slice();
  const ced = R.lastCed.map((c) => [c[0], c[1]] as [number, number]);

  for (let kk = R.k; kk < kEnd; kk++) {
    const tk = tv[kk]!;
    const tg = P.tOffset + (tk - tv[0]!);
    for (let i = 0; i < nIn; i++) {
      const f = Inp[i]!;
      let v: number;
      let vi: number | null;
      switch (f.dataType) {
        case "static":
        case "quasi-static":
          v = f.qty ?? 0;
          vi = v;
          imps[i] = v * f.cf;
          break;
        case "dynamic":
          v = evalLaw(f, tk);
          vi = v;
          imps[i] = v * f.cf;
          break;
        default:
          v = (rt?.data[kk]?.[f.rtCol] ?? 0) * f.rtConv;
          vi = null;
      }
      vals[i] = v;
      if (vi != null) impsInst[i] = vi * f.cf;
    }
    for (let kx = 0; kx < P.nRt; kx++) {
      const j = rtList[kx]!;
      const cum = vals[j]!;
      if (!Number.isNaN(R.prevCum[kx]!)) {
        const delta = cum - R.prevCum[kx]!;
        if (delta !== 0) {
          R.heldE[kx] = delta;
          const cfj = P.useMix ? P.cfMixVec[kk]! : Inp[j]!.cf;
          R.heldI[kx] = delta * cfj;
          R.impCumRT[kx] += delta * cfj;
          R.costCumRT[kx] += delta * P.kwhPerUnit[j]! * P.priceVec[kk]!;
          if (P.useCedMix) {
            R.cedCumRT[kx]![0] += delta * P.cedMixVec[kk]![0];
            R.cedCumRT[kx]![1] += delta * P.cedMixVec[kk]![1];
          } else {
            R.cedCumRT[kx]![0] += delta * Inp[j]!.cedF[0];
            R.cedCumRT[kx]![1] += delta * Inp[j]!.cedF[1];
          }
          R.hasEv[kx] = true;
          impsInst[j] = R.heldI[kx]!;
        }
      }
      R.prevCum[kx] = cum;
      imps[j] = R.impCumRT[kx]!;
      costs[j] = R.costCumRT[kx]!;
      ced[j] = [R.cedCumRT[kx]![0], R.cedCumRT[kx]![1]];
    }
    for (let i = 0; i < nIn; i++) {
      if (Inp[i]!.dataType !== "real-time") {
        ced[i] = [vals[i]! * Inp[i]!.cedF[0], vals[i]! * Inp[i]!.cedF[1]];
      }
    }
    for (let i = 0; i < nIn; i++) {
      if (Inp[i]!.dataType !== "real-time") costs[i] = vals[i]! * Inp[i]!.price;
    }
    const elapsedH = (tk - tv[0]!) / 3600;
    const instTot = impsInst.reduce((a, b) => a + b, 0);
    if (P.soglia > 0 && instTot > P.soglia) {
      R.hotN += 1;
      R.costDisr += (P.disrRate * P.dtStep) / 3600;
    }
    const costTime = P.capexP.map((c, p) => (c + P.labP[p]! + P.opxP[p]!) * elapsedH);
    const costCarb = imps.map((x) => P.carbonP * Math.abs(x));
    const costTot =
      costs.reduce((a, b) => a + b, 0) +
      costTime.reduce((a, b) => a + b, 0) +
      costCarb.reduce((a, b) => a + b, 0) +
      R.costDisr;
    const cumTot = imps.reduce((a, b) => a + b, 0);
    const eIns = rtList.map((_, kx) => (Number.isFinite(R.heldE[kx]!) ? R.heldE[kx]! : 0));
    const mixShare = P.shareVec[kk] ?? [];
    const pt: SeriesPt = {
      t: tk,
      tg,
      inst: instTot,
      cum: cumTot,
      cost: costTot,
      costE: R.costCumRT.reduce((a, b) => a + b, 0),
      ced: ced.reduce((a, c) => a + c[0] + c[1], 0),
      cedR: ced.reduce((a, c) => a + c[1], 0),
      cfMix: P.useMix ? P.cfMixVec[kk]! : NaN,
      price: P.priceVec[kk]!,
      hot: P.soglia > 0 && instTot > P.soglia,
      vals: vals.slice(),
      eIns,
      mixShare,
    };
    R.series.push(pt);
    R.valHistory.push({ tg, vals: vals.slice() });
    R.lastInst = impsInst.slice();
  }

  R.k = kEnd;
  R.lastImps = imps;
  R.lastCosts = costs;
  R.lastCed = ced;

  return snapshot(P, R, imps, costs, ced, R.lastInst);
}

function snapshot(
  P: PreparedCycle,
  R: RunnerState,
  imps: number[],
  costs: number[],
  ced: [number, number][],
  impsInst: number[],
): LiveSnapshot {
  const last = R.series[R.series.length - 1];
  const nP = P.nP;
  const procImp = Array(nP).fill(0);
  for (let i = 0; i < P.nIn; i++) procImp[P.inputs[i]!.proc] += imps[i]!;
  const elapsedH = last ? (last.t - P.tvec[0]!) / 3600 : 0;
  const costStack: ProcCostStack[] = Array.from({ length: nP }, (_, p) => {
    const flowCosts = P.inputs.map((f, i) => (f.proc === p ? Math.abs(costs[i]!) : 0));
    const capex = P.capexP[p]! * elapsedH;
    const labour = P.labP[p]! * elapsedH;
    const opex = P.opxP[p]! * elapsedH;
    let carbon = 0;
    for (let i = 0; i < P.nIn; i++) if (P.inputs[i]!.proc === p) carbon += P.carbonP * Math.abs(imps[i]!);
    const total = flowCosts.reduce((a, b) => a + b, 0) + capex + labour + opex + carbon;
    return { flowCosts, capex, labour, opex, carbon, total };
  });
  const cedP: [number, number][] = Array.from({ length: nP }, () => [0, 0]);
  for (let i = 0; i < P.nIn; i++) {
    const p = P.inputs[i]!.proc;
    cedP[p]![0] += Math.abs(ced[i]![0]);
    cedP[p]![1] += Math.abs(ced[i]![1]);
  }
  const totAll = procImp.reduce((a, b) => a + Math.abs(b), 0);
  const alarmProcs = Array(nP).fill(false);
  let alarm = "";
  const dqList: string[] = [];
  for (let p = 0; p < nP; p++) {
    const share = totAll > 0 ? Math.abs(procImp[p]!) / totAll : 0;
    if (nP > 1 && share > 0.8) {
      alarmProcs[p] = true;
      alarm = `ALARM: "${P.procs[p]}" alone causes ${(100 * share).toFixed(0)}% of the total impact (> 80%)`;
      if (!R.alarmDone[p]) R.alarmDone[p] = true;
    }
    const fl = P.inputs.map((f, i) => ({ f, i })).filter((x) => x.f.proc === p);
    const seg = fl.map((x) => Math.abs(imps[x.i]!));
    const totp = seg.reduce((a, b) => a + b, 0);
    if (fl.length && totp > 0) {
      let im = 0;
      for (let k = 1; k < seg.length; k++) if (seg[k]! > seg[im]!) im = k;
      const dom = fl[im]!.f;
      const rtShare = fl.reduce((a, x, k) => a + (x.f.dataType === "real-time" ? seg[k]! : 0), 0) / totp;
      if (dom.dataType !== "real-time") {
        dqList.push(
          `${P.procs[p]}: ${(100 * seg[im]! / totp).toFixed(0)}% from "${trunc(dom.nome, 16)}" (${dom.dataType}); RT ${(100 * rtShare).toFixed(0)}%`,
        );
      }
    }
  }
  const mixShare = last?.mixShare ?? [];
  let mixLabel = "Grid mix not loaded";
  if (P.useMix && last) {
    const dn = P.mixStart + ((last.t - P.tvec[0]!) / 86400) * 1000;
    mixLabel = `${fmtStamp(dn)}   cf=${Number.isFinite(last.cfMix) ? last.cfMix.toPrecision(4) : "-"}`;
  }
  const gaugeCum = P.rtList.map((_, kx) => R.impCumRT[kx]!);
  const gaugeInst = P.rtList.map((_, kx) => (Number.isFinite(R.heldI[kx]!) ? R.heldI[kx]! : 0));
  const rtNames = P.rtList.map((j) => trunc(P.inputs[j]!.nome, 18));
  const cedTot = cedP.reduce((a, c) => a + c[0] + c[1], 0);
  return {
    idx: R.k,
    nSteps: P.nSteps,
    instTot: last?.inst ?? 0,
    cumTot: last?.cum ?? 0,
    costTot: last?.cost ?? 0,
    costEnergy: last?.costE ?? 0,
    costDisr: R.costDisr,
    hotN: R.hotN,
    procImp,
    flowImp: imps.slice(),
    flowCost: costs.slice(),
    flowCed: ced.map((c) => [c[0], c[1]] as [number, number]),
    cedP,
    costStack,
    mixShare,
    mixCf: last?.cfMix ?? NaN,
    mixLabel,
    gaugeCum,
    gaugeInst,
    gaugeMaxCum: Math.max(1, ...gaugeCum.map(Math.abs)),
    gaugeMaxInst: Math.max(1, ...gaugeInst.map(Math.abs)) * 1.2,
    alarm,
    dq:
      dqList.length === 0
        ? "Data quality: the dominant flow of every process is measured in real time."
        : `Data quality: dominant flow NOT real-time in → ${dqList.join(" | ")}`,
    alarmProcs,
    elapsedH,
    rtNames,
    done: R.k >= P.nSteps,
    series: R.series,
    valHistory: R.valHistory,
  };
}

export function finishResult(P: PreparedCycle, live: LiveSnapshot, notes: string[]): CycleResult {
  const delta =
    P.statVal > 0 ? (100 * (live.cumTot - P.statVal)) / P.statVal : null;
  return {
    campaign: P.campaign,
    cycle: P.expN,
    category: P.category,
    processes: P.procs.slice(),
    procImpact: live.procImp.slice(),
    totalImpact: live.cumTot,
    staticLca: P.statVal,
    deltaPerc: delta,
    flowImpact: live.flowImp.slice(),
    flowCost: live.flowCost.slice(),
    flowCED: live.flowCed.map((c) => [c[0], c[1]] as [number, number]),
    costTotal: live.costTot,
    costEnergy: live.costEnergy,
    costDisruption: live.costDisr,
    costPerUnit: live.costTot / Math.max(P.unitsPerCycle, 1),
    cedTotal: live.cedP.reduce((a, c) => a + c[0] + c[1], 0),
    cedRenewable: live.cedP.reduce((a, c) => a + c[1], 0),
    hotspots: live.hotN,
    dataQualityNotes: notes,
    mixStart: Number.isFinite(P.mixStart) ? fmtStamp(P.mixStart) : "",
    timestamp: fmtStamp(Date.now()),
  };
}

export function qualityNotes(P: PreparedCycle, live: LiveSnapshot): string[] {
  const msg: string[] = [];
  for (let p = 0; p < P.nP; p++) {
    const fl = P.inputs.map((f, i) => ({ f, i })).filter((x) => x.f.proc === p);
    if (!fl.length) continue;
    const seg = fl.map((x) => Math.abs(live.flowImp[x.i]!));
    const totp = seg.reduce((a, b) => a + b, 0);
    if (totp <= 0) continue;
    let im = 0;
    for (let k = 1; k < seg.length; k++) if (seg[k]! > seg[im]!) im = k;
    const dom = fl[im]!.f;
    const rtShare = fl.reduce((a, x, k) => a + (x.f.dataType === "real-time" ? seg[k]! : 0), 0) / totp;
    if (dom.dataType !== "real-time") {
      msg.push(
        `- "${P.procs[p]}": ${(100 * seg[im]! / totp).toFixed(0)}% of its impact comes from "${dom.nome}", a ${dom.dataType} datum; only ${(100 * rtShare).toFixed(0)}% of the column is measured in real time.`,
      );
    }
  }
  return msg;
}
