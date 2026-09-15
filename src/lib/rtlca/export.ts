import * as XLSX from "xlsx";
import type { CycleResult, InputFlow, LiveSnapshot } from "./types";
import { COST_ITEMS } from "./types";

export function downloadCampaign(args: {
  campaign: string;
  category: string;
  procs: string[];
  inputs: InputFlow[];
  costP: number[][];
  energyBill: number;
  carbonPrice: number;
  disrCost: number;
  unitsPerCycle: number;
  mixFile: string;
  rtFile: string;
  dbFile: string;
  results: CycleResult[];
  series: number[][][];
  log: string[];
}) {
  if (!args.results.length) throw new Error("No completed cycle yet: run at least one cycle before saving.");
  const wb = XLSX.utils.book_new();
  const sys: (string | number)[][] = [
    ["Campaign", args.campaign],
    ["Impact category", args.category],
    ["Unit processes (flow order)", args.procs.join(" > ")],
    ["Energy price (bill) [EUR/kWh]", args.energyBill],
    ["Carbon price [EUR/tCO2e]", args.carbonPrice],
    ["Disruption cost [EUR/h]", args.disrCost],
    ["Units per cycle", args.unitsPerCycle],
    ["Grid mix file", args.mixFile],
    ["RT file", args.rtFile],
    ["Dataset", args.dbFile],
    ["Saved on", new Date().toISOString()],
    [],
    ["#", "Unit process", "Direction", "Taxonomy", "Dataset process", "Unit", "Quantity / law / channel", "Impact factor", "Unit price [EUR/unit]", "CED non-renew. [MJ/unit]", "CED renew. [MJ/unit]"],
  ];
  args.inputs.forEach((in_, i) => {
    let q: string | number;
    if (in_.dataType === "dynamic") q = `v(t) = ${in_.lawTxt}`;
    else if (in_.dataType === "real-time") q = `channel ${in_.rtColName}`;
    else q = in_.qty ?? "";
    sys.push([
      i + 1,
      args.procs[in_.proc] ?? "",
      in_.dir,
      in_.dataType,
      in_.nome,
      in_.unit,
      q,
      in_.cf,
      in_.price,
      in_.cedF[0],
      in_.cedF[1],
    ]);
  });
  sys.push([]);
  sys.push(["Unit process", ...COST_ITEMS]);
  args.procs.forEach((p, i) => {
    sys.push([p, ...(args.costP[i] ?? COST_ITEMS.map(() => 0))]);
  });
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(sys), "System");

  const rh = [
    "Cycle",
    "Timestamp",
    "Mix start",
    "Total impact",
    "Static LCA",
    "Delta %",
    ...args.procs.map((p) => `Impact: ${p}`),
    "Cost total [EUR]",
    "Cost energy [EUR]",
    "Cost disruption [EUR]",
    "Cost per unit [EUR]",
    "CED total [MJ]",
    "CED renewable [MJ]",
    "Hotspots",
    "Data quality notes",
  ];
  const rr: (string | number | null)[][] = [rh];
  for (const R of args.results) {
    rr.push([
      R.cycle,
      R.timestamp,
      R.mixStart,
      R.totalImpact,
      R.staticLca,
      R.deltaPerc,
      ...R.procImpact,
      R.costTotal,
      R.costEnergy,
      R.costDisruption,
      R.costPerUnit,
      R.cedTotal,
      R.cedRenewable,
      R.hotspots,
      R.dataQualityNotes.join(" | "),
    ]);
  }
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(rr), "Results");

  const fh = ["Cycle", "#", "Unit process", "Flow", "Taxonomy", "Impact", "Cost [EUR]", "CED NR [MJ]", "CED R [MJ]"];
  const fr: (string | number)[][] = [fh];
  for (const R of args.results) {
    R.flowImpact.forEach((_, i) => {
      const in_ = args.inputs[i];
      if (!in_) return;
      fr.push([
        R.cycle,
        i + 1,
        args.procs[in_.proc] ?? "",
        in_.nome,
        in_.dataType,
        R.flowImpact[i] ?? 0,
        R.flowCost[i] ?? 0,
        R.flowCED[i]?.[0] ?? 0,
        R.flowCED[i]?.[1] ?? 0,
      ]);
    });
  }
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(fr), "Flows");

  args.series.forEach((M, k) => {
    if (!M.length) return;
    const sh = ["t [s]", "cf mix", "price [EUR/kWh]", "inst impact", "cum impact", "cum cost [EUR]", "cum CED [MJ]"];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([sh, ...M]), `Series_cycle${k + 1}`);
  });
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(args.log.map((l) => [l])), "Log");

  const stamp = new Date().toISOString().replace(/[-:]/g, "").slice(0, 15);
  const fn = `RTLCA_${args.campaign}_${stamp}.xlsx`;
  XLSX.writeFile(wb, fn);

  const json = {
    Campaign: args.campaign,
    Category: args.category,
    Procs: args.procs,
    Inputs: args.inputs,
    CostP: args.costP,
    EnergyBill: args.energyBill,
    CarbonPrice: args.carbonPrice,
    DisrCost: args.disrCost,
    UnitsPerCycle: args.unitsPerCycle,
    Results: args.results,
    Log: args.log,
    SavedOn: new Date().toISOString(),
  };
  const blob = new Blob([JSON.stringify(json, null, 2)], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = fn.replace(/\.xlsx$/, ".json");
  a.click();
  URL.revokeObjectURL(a.href);
  return fn;
}

export function seriesMatrix(live: LiveSnapshot | null): number[][] {
  if (!live) return [];
  return live.series.map((p) => [p.t, p.cfMix, p.price, p.inst, p.cum, p.cost, p.ced]);
}
