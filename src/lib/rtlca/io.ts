import * as XLSX from "xlsx";
import type { Database, MixFile, PriceFile, RTFile } from "./types";
import { asText, colLetter, energyToMJ, isNum, toMs, toNum } from "./util";

function sheetToAoA(wb: XLSX.WorkBook, name: string): unknown[][] {
  const sheet = wb.Sheets[name];
  if (!sheet) return [];
  return XLSX.utils.sheet_to_json(sheet, { header: 1, defval: null, raw: true }) as unknown[][];
}

export function readWorkbook(buf: ArrayBuffer): XLSX.WorkBook {
  return XLSX.read(buf, { type: "array", cellDates: true });
}

function cleanLabel(a: unknown, b: unknown, c: unknown): string {
  const parts = [a, b, c].map(asText).filter((s) => s && s[0] !== ".");
  return parts.length ? parts.join(" - ") : "(unnamed)";
}

export function parseDatabase(wb: XLSX.WorkBook, fileName: string): Database {
  const sheets = wb.SheetNames;
  if (!sheets.length) throw new Error("Empty workbook.");
  const rawUnknown = sheetToAoA(wb, sheets[0]!);
  const raw: (string | number | null)[][] = rawUnknown.map((row) =>
    row.map((c) => {
      if (c == null) return null;
      if (typeof c === "number" && Number.isFinite(c)) return c;
      if (typeof c === "string") return c;
      if (c instanceof Date) return c.toISOString();
      return asText(c) || null;
    }),
  );
  const nR = raw.length;
  const nC = raw.reduce((m, r) => Math.max(m, r.length), 0);
  if (nR < 4) throw new Error("Unexpected coefficient-database format.");
  const dataRows: number[] = [];
  for (let r = 3; r < nR; r++) dataRows.push(r);
  const sample = dataRows.slice(0, Math.min(dataRows.length, 400));
  const coefCols: number[] = [];
  for (let c = 6; c < nC; c++) {
    let cnt = 0;
    for (const r of sample) if (isNum(raw[r]?.[c])) cnt++;
    if (cnt > 0.5 * sample.length) coefCols.push(c);
  }
  if (!coefCols.length) throw new Error("No indicator column found.");
  const colLabels = coefCols.map((c) => cleanLabel(raw[0]?.[c], raw[1]?.[c], raw[2]?.[c]));
  const procNames: string[] = [];
  const procUnits: string[] = [];
  const procRow: number[] = [];
  const colUnit = 4;
  const colName = 5;
  for (const r of dataRows) {
    const nm = asText(raw[r]?.[colName]);
    if (!nm) continue;
    let anyNum = false;
    for (const c of coefCols) if (isNum(raw[r]?.[c])) { anyNum = true; break; }
    if (!anyNum) continue;
    procNames.push(nm);
    procUnits.push(asText(raw[r]?.[colUnit]));
    procRow.push(r);
  }
  if (!procNames.length) throw new Error("No valid process found in the database.");
  let cedCol = -1;
  const cedNRCols: number[] = [];
  const cedRCols: number[] = [];
  for (let c = 0; c < colLabels.length; c++) {
    if (colLabels[c]!.trim().toUpperCase().startsWith("CED")) {
      cedCol = c;
      break;
    }
  }
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
  return { raw, coefCols, colLabels, procNames, procUnits, procRow, cedCol, cedNRCols, cedRCols, fileName };
}

export function parseRT(wb: XLSX.WorkBook, fileName: string): RTFile {
  const sheets = wb.SheetNames;
  let sheet = sheets[sheets.length - 1]!;
  for (const s of sheets) if (s.toLowerCase() === "data1") { sheet = s; break; }
  const raw = sheetToAoA(wb, sheet);
  const nR = raw.length;
  const nC = raw.reduce((m, r) => Math.max(m, r.length), 0);
  let unitsRow = -1;
  outer: for (let r = 0; r < Math.min(nR, 8); r++) {
    for (let c = 0; c < nC; c++) {
      const u = asText(raw[r]?.[c]);
      if (u.toLowerCase() === "s" || !Number.isNaN(energyToMJ(u))) {
        unitsRow = r;
        break outer;
      }
    }
  }
  if (unitsRow < 0) throw new Error("Units row not found (energy units expected in row 2).");
  const nameRow = Math.max(unitsRow - 1, 0);
  let timeCol = -1;
  const eCols: number[] = [];
  const eUnits: string[] = [];
  const eNames: string[] = [];
  for (let c = 0; c < nC; c++) {
    const u = asText(raw[unitsRow]?.[c]);
    if (u.toLowerCase() === "s" && timeCol < 0) timeCol = c;
    if (!Number.isNaN(energyToMJ(u))) {
      eCols.push(c);
      eUnits.push(u);
      let nm = asText(raw[nameRow]?.[c]);
      if (!nm) nm = `Energy ${colLetter(c)}`;
      eNames.push(`${nm} (${colLetter(c)})`);
    }
  }
  if (!eCols.length) throw new Error("No column with an energy unit (Wh, kWh, J, kJ, MJ, GJ, MWh).");
  const t: number[] = [];
  const data: number[][] = [];
  for (let r = unitsRow + 1; r < nR; r++) {
    let tvv: number;
    if (timeCol >= 0) {
      tvv = toNum(raw[r]?.[timeCol]);
      if (!Number.isFinite(tvv)) break;
    } else tvv = t.length;
    const row: number[] = [];
    let ok = true;
    for (let i = 0; i < eCols.length; i++) {
      const x = toNum(raw[r]?.[eCols[i]!]);
      if (!Number.isFinite(x)) { ok = false; break; }
      row.push(x);
    }
    if (!ok) break;
    t.push(tvv);
    data.push(row);
  }
  if (!t.length) throw new Error("No valid numeric data row in the real-time file.");
  return { t, data, names: eNames, units: eUnits, fileName };
}

export function parseTerna(wb: XLSX.WorkBook, fileName: string): MixFile {
  const raw = sheetToAoA(wb, wb.SheetNames[0]!);
  const srcNames: string[] = [];
  const dn: number[] = [];
  const vv: number[] = [];
  const si: number[] = [];
  for (let r = 1; r < raw.length; r++) {
    const d = toMs(raw[r]?.[0]);
    const v = toNum(raw[r]?.[1]);
    const src = asText(raw[r]?.[2]);
    if (!Number.isFinite(d) || !Number.isFinite(v) || !src) continue;
    let q = srcNames.indexOf(src);
    if (q < 0) { srcNames.push(src); q = srcNames.length - 1; }
    dn.push(d); vv.push(v); si.push(q);
  }
  if (!dn.length) throw new Error("No valid rows in the Terna file.");
  const T = Array.from(new Set(dn)).sort((a, b) => a - b);
  const nS = srcNames.length;
  const Gen = T.map(() => Array(nS).fill(0));
  const index = new Map(T.map((x, i) => [x, i]));
  for (let k = 0; k < dn.length; k++) {
    const ti = index.get(dn[k]!)!;
    Gen[ti]![si[k]!] = vv[k]!;
  }
  return { T, src: srcNames, gen: Gen, fileName };
}

export function parsePrices(wb: XLSX.WorkBook, fileName: string, zone = "IT-South"): PriceFile {
  const raw = sheetToAoA(wb, wb.SheetNames[0]!);
  const hdr = (raw[1] ?? raw[0] ?? []) as unknown[];
  let col = -1;
  let zoneName = zone;
  for (let c = 0; c < hdr.length; c++) {
    const h = asText(hdr[c]);
    if (h.toLowerCase().includes("prezzo") && h.includes(zone)) { col = c; break; }
  }
  if (col < 0) {
    for (let c = 0; c < hdr.length; c++) {
      const h = asText(hdr[c]);
      if (h.toLowerCase().includes("prezzo") || h.toLowerCase().includes("price")) {
        col = c;
        zoneName = h || zone;
        break;
      }
    }
  }
  if (col < 0) throw new Error("No price column found in the file.");
  const T: number[] = [];
  const kwh: number[] = [];
  const startRow = raw.length > 3 ? 3 : 1;
  for (let r = startRow; r < raw.length; r++) {
    const d = toMs(raw[r]?.[0]);
    const v = toNum(raw[r]?.[col]);
    if (Number.isFinite(d) && Number.isFinite(v)) {
      T.push(d);
      kwh.push(v / 1000);
    }
  }
  if (!T.length) throw new Error("No valid price rows in the file.");
  return { T, kwh, zone: zoneName, fileName };
}

export async function readFileAsWorkbook(file: File): Promise<XLSX.WorkBook> {
  const buf = await file.arrayBuffer();
  return readWorkbook(buf);
}
