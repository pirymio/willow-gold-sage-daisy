import type { DataType, InputFlow, LawKind } from "./types";

export function trunc(s: string, n: number) {
  return s.length > n ? s.slice(0, n) : s;
}

export function energyToMJ(u: string): number {
  switch (u.trim().toLowerCase()) {
    case "j":
      return 1e-6;
    case "kj":
      return 1e-3;
    case "mj":
      return 1;
    case "gj":
      return 1e3;
    case "wh":
      return 0.0036;
    case "kwh":
      return 3.6;
    case "mwh":
      return 3600;
    default:
      return NaN;
  }
}

export function newInputTemplate(): InputFlow {
  return {
    id: uid(),
    nome: "",
    tipo: "Matter",
    proc: 0,
    dir: "Input",
    price: 0,
    cedF: [0, 0],
    procIdx: 0,
    rowSheet: 0,
    unit: "",
    qty: 0,
    colIdx: 0,
    cf: 0,
    cfLabel: "",
    dataType: "static",
    lawTxt: "",
    lawKind: "linear",
    lawA: 10,
    lawB: 2,
    lawW: 0.05,
    lawExpr: "10 + 5*sin(0.05*t)",
    rtCol: -1,
    rtColName: "",
    rtConv: 1,
  };
}

let _n = 0;
export function uid() {
  _n += 1;
  return `f${Date.now().toString(36)}${_n}`;
}

export function flowStyle(dt: DataType): { color: string; dash: string; width: number } {
  switch (dt) {
    case "real-time":
      return { color: "var(--color-primary)", dash: "", width: 2.4 };
    case "static":
      return { color: "var(--color-muted)", dash: "", width: 1.5 };
    case "quasi-static":
      return { color: "var(--color-muted)", dash: "5 4", width: 1.5 };
    default:
      return { color: "var(--color-dynamic)", dash: "3 3 1 3", width: 1.5 };
  }
}

export function flowLabel(in_: InputFlow): string {
  let q: string;
  if (in_.dataType === "real-time") q = "energy RT";
  else if (in_.dataType === "dynamic") q = "v(t)";
  else if (in_.qty == null || Number.isNaN(in_.qty)) q = "-";
  else q = `${fmt(in_.qty, 3)} ${in_.unit}`;
  return `${trunc(in_.nome, 16)} (${q})`;
}

export function fmt(n: number, sig = 5): string {
  if (!Number.isFinite(n)) return "-";
  const a = Math.abs(n);
  if (a === 0) return "0";
  if (a >= 1000 || a < 0.001) return n.toExponential(2);
  if (a >= 100) return n.toFixed(1);
  if (a >= 10) return n.toFixed(2);
  return n.toPrecision(sig);
}

export function fmtFixed(n: number, d = 2): string {
  if (!Number.isFinite(n)) return "-";
  return n.toFixed(d);
}

export function evalLaw(flow: InputFlow, t: number): number {
  const { lawKind, lawA: a, lawB: b, lawW: w, lawExpr } = flow;
  switch (lawKind) {
    case "linear":
      return a + b * t;
    case "sinusoidal":
      return a + b * Math.sin(w * t);
    case "exponential":
      return a * Math.exp(b * t);
    case "custom": {
      try {
        const fn = new Function("t", "Math", `"use strict"; return (${lawExpr});`);
        const y = Number(fn(t, Math));
        return Number.isFinite(y) ? y : 0;
      } catch {
        return 0;
      }
    }
  }
}

export function validateLaw(
  kind: LawKind,
  a: number,
  b: number,
  w: number,
  expr: string,
): { ok: true; txt: string } | { ok: false; msg: string } {
  switch (kind) {
    case "linear":
      if (b === 0) return { ok: false, msg: "b = 0 makes the law CONSTANT: not allowed." };
      return { ok: true, txt: `${a} + ${b}*t` };
    case "sinusoidal":
      if (b === 0 || w === 0) return { ok: false, msg: "b = 0 or w = 0 make the law CONSTANT." };
      return { ok: true, txt: `${a} + ${b}*sin(${w}*t)` };
    case "exponential":
      if (a === 0 || b === 0) return { ok: false, msg: "a = 0 or b = 0 make the law CONSTANT." };
      return { ok: true, txt: `${a}*exp(${b}*t)` };
    case "custom": {
      const e = expr.trim();
      if (!e) return { ok: false, msg: "Write an expression f(t)." };
      try {
        const f0 = new Function("t", "Math", `"use strict"; return (${e});`);
        const tt = Array.from({ length: 201 }, (_, i) => (i * 100) / 200);
        const y = tt.map((x) => Number(f0(x, Math)));
        if (y.some((v) => !Number.isFinite(v))) return { ok: false, msg: "Non-finite values on [0,100]." };
        const mx = Math.max(...y.map(Math.abs));
        const span = Math.max(...y) - Math.min(...y);
        if (span <= 1e-9 * (1 + mx)) {
          return { ok: false, msg: "The expression is CONSTANT: not allowed for a dynamic datum." };
        }
        return { ok: true, txt: e };
      } catch {
        return { ok: false, msg: "Invalid expression: use the variable t." };
      }
    }
  }
}

export function shortSrc(s: string): string {
  const i = s.search(/[- ]/);
  const nm = i < 0 ? s : s.slice(0, i);
  return trunc(nm, 7);
}

export function colLetter(c: number): string {
  let n = c + 1;
  let L = "";
  while (n > 0) {
    const r = (n - 1) % 26;
    L = String.fromCharCode(65 + r) + L;
    n = Math.floor((n - 1) / 26);
  }
  return L;
}

export function asText(x: unknown): string {
  if (typeof x === "string") return x.trim();
  if (typeof x === "number" && Number.isFinite(x)) return String(x);
  return "";
}

export function isNum(x: unknown): x is number {
  return typeof x === "number" && Number.isFinite(x);
}

export function toNum(x: unknown): number {
  if (typeof x === "number" && Number.isFinite(x)) return x;
  if (typeof x === "string") {
    const v = Number(x.replace(",", "."));
    return Number.isFinite(v) ? v : NaN;
  }
  return NaN;
}

export function toMs(x: unknown): number {
  if (x instanceof Date && !Number.isNaN(x.getTime())) return x.getTime();
  if (typeof x === "number" && Number.isFinite(x)) {
    if (x > 1e12) return x;
    if (x > 1e9) return x * 1000;
    if (x > 20000 && x < 120000) {
      return Date.UTC(1899, 11, 30) + x * 86400000;
    }
  }
  if (typeof x === "string") {
    const t = x.trim();
    const iso = Date.parse(t.replace(" ", "T"));
    if (!Number.isNaN(iso)) return iso;
    const m = t.match(/^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})(?::(\d{2}))?/);
    if (m) {
      return Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4], +m[5], m[6] ? +m[6] : 0);
    }
  }
  return NaN;
}

export function fmtClock(ms: number): string {
  const d = new Date(ms);
  const hh = String(d.getUTCHours()).padStart(2, "0");
  const mm = String(d.getUTCMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
}

export function fmtDay(ms: number): string {
  const d = new Date(ms);
  const y = d.getUTCFullYear();
  const mo = String(d.getUTCMonth() + 1).padStart(2, "0");
  const da = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${mo}-${da}`;
}

export function fmtStamp(ms: number): string {
  return `${fmtDay(ms)} ${fmtClock(ms)}`;
}

export function dayFloor(ms: number): number {
  const d = new Date(ms);
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
}

export const CHART = [
  "var(--color-chart-1)",
  "var(--color-chart-2)",
  "var(--color-chart-3)",
  "var(--color-chart-4)",
  "var(--color-chart-5)",
  "var(--color-chart-6)",
  "var(--color-chart-7)",
  "var(--color-chart-8)",
  "var(--color-chart-9)",
  "var(--color-chart-10)",
];

export function chartColor(i: number): string {
  return CHART[i % CHART.length]!;
}
