import { i as __toESM } from "../_runtime.mjs";
import { n as require_react } from "../_libs/@radix-ui/react-compose-refs+[...].mjs";
import { v as require_jsx_runtime } from "../_libs/@tanstack/react-router+[...].mjs";
import { n as Plus, r as Minus } from "../_libs/lucide-react.mjs";
import { t as create } from "../_libs/zustand.mjs";
import { n as utils, r as writeFileSync, t as readSync } from "../_libs/xlsx.mjs";
import { t as Slot } from "../_libs/radix-ui__react-slot.mjs";
import { n as clsx, t as cva } from "../_libs/class-variance-authority+clsx.mjs";
import { t as twMerge } from "../_libs/tailwind-merge.mjs";
import { a as Line, c as ResponsiveContainer, i as XAxis, l as Tooltip, n as LineChart, o as CartesianGrid, r as YAxis, s as Bar, t as BarChart, u as Legend } from "../_libs/recharts+[...].mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/routes-DhOmQ3Wz.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function trunc(s, n) {
	return s.length > n ? s.slice(0, n) : s;
}
function energyToMJ(u) {
	switch (u.trim().toLowerCase()) {
		case "j": return 1e-6;
		case "kj": return .001;
		case "mj": return 1;
		case "gj": return 1e3;
		case "wh": return .0036;
		case "kwh": return 3.6;
		case "mwh": return 3600;
		default: return NaN;
	}
}
function newInputTemplate() {
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
		lawW: .05,
		lawExpr: "10 + 5*sin(0.05*t)",
		rtCol: -1,
		rtColName: "",
		rtConv: 1
	};
}
var _n = 0;
function uid() {
	_n += 1;
	return `f${Date.now().toString(36)}${_n}`;
}
function flowStyle(dt) {
	switch (dt) {
		case "real-time": return {
			color: "var(--color-primary)",
			dash: "",
			width: 2.4
		};
		case "static": return {
			color: "var(--color-muted)",
			dash: "",
			width: 1.5
		};
		case "quasi-static": return {
			color: "var(--color-muted)",
			dash: "5 4",
			width: 1.5
		};
		default: return {
			color: "var(--color-dynamic)",
			dash: "3 3 1 3",
			width: 1.5
		};
	}
}
function flowLabel(in_) {
	let q;
	if (in_.dataType === "real-time") q = "energy RT";
	else if (in_.dataType === "dynamic") q = "v(t)";
	else if (in_.qty == null || Number.isNaN(in_.qty)) q = "-";
	else q = `${fmt(in_.qty, 3)} ${in_.unit}`;
	return `${trunc(in_.nome, 16)} (${q})`;
}
function fmt(n, sig = 5) {
	if (!Number.isFinite(n)) return "-";
	const a = Math.abs(n);
	if (a === 0) return "0";
	if (a >= 1e3 || a < .001) return n.toExponential(2);
	if (a >= 100) return n.toFixed(1);
	if (a >= 10) return n.toFixed(2);
	return n.toPrecision(sig);
}
function fmtFixed(n, d = 2) {
	if (!Number.isFinite(n)) return "-";
	return n.toFixed(d);
}
function evalLaw(flow, t) {
	const { lawKind, lawA: a, lawB: b, lawW: w, lawExpr } = flow;
	switch (lawKind) {
		case "linear": return a + b * t;
		case "sinusoidal": return a + b * Math.sin(w * t);
		case "exponential": return a * Math.exp(b * t);
		case "custom": try {
			const fn = new Function("t", "Math", `"use strict"; return (${lawExpr});`);
			const y = Number(fn(t, Math));
			return Number.isFinite(y) ? y : 0;
		} catch {
			return 0;
		}
	}
}
function validateLaw(kind, a, b, w, expr) {
	switch (kind) {
		case "linear":
			if (b === 0) return {
				ok: false,
				msg: "b = 0 makes the law CONSTANT: not allowed."
			};
			return {
				ok: true,
				txt: `${a} + ${b}*t`
			};
		case "sinusoidal":
			if (b === 0 || w === 0) return {
				ok: false,
				msg: "b = 0 or w = 0 make the law CONSTANT."
			};
			return {
				ok: true,
				txt: `${a} + ${b}*sin(${w}*t)`
			};
		case "exponential":
			if (a === 0 || b === 0) return {
				ok: false,
				msg: "a = 0 or b = 0 make the law CONSTANT."
			};
			return {
				ok: true,
				txt: `${a}*exp(${b}*t)`
			};
		case "custom": {
			const e = expr.trim();
			if (!e) return {
				ok: false,
				msg: "Write an expression f(t)."
			};
			try {
				const f0 = new Function("t", "Math", `"use strict"; return (${e});`);
				const y = Array.from({ length: 201 }, (_, i) => i * 100 / 200).map((x) => Number(f0(x, Math)));
				if (y.some((v) => !Number.isFinite(v))) return {
					ok: false,
					msg: "Non-finite values on [0,100]."
				};
				const mx = Math.max(...y.map(Math.abs));
				if (Math.max(...y) - Math.min(...y) <= 1e-9 * (1 + mx)) return {
					ok: false,
					msg: "The expression is CONSTANT: not allowed for a dynamic datum."
				};
				return {
					ok: true,
					txt: e
				};
			} catch {
				return {
					ok: false,
					msg: "Invalid expression: use the variable t."
				};
			}
		}
	}
}
function colLetter(c) {
	let n = c + 1;
	let L = "";
	while (n > 0) {
		const r = (n - 1) % 26;
		L = String.fromCharCode(65 + r) + L;
		n = Math.floor((n - 1) / 26);
	}
	return L;
}
function asText(x) {
	if (typeof x === "string") return x.trim();
	if (typeof x === "number" && Number.isFinite(x)) return String(x);
	return "";
}
function isNum(x) {
	return typeof x === "number" && Number.isFinite(x);
}
function toNum(x) {
	if (typeof x === "number" && Number.isFinite(x)) return x;
	if (typeof x === "string") {
		const v = Number(x.replace(",", "."));
		return Number.isFinite(v) ? v : NaN;
	}
	return NaN;
}
function toMs(x) {
	if (x instanceof Date && !Number.isNaN(x.getTime())) return x.getTime();
	if (typeof x === "number" && Number.isFinite(x)) {
		if (x > 0xe8d4a51000) return x;
		if (x > 1e9) return x * 1e3;
		if (x > 2e4 && x < 12e4) return Date.UTC(1899, 11, 30) + x * 864e5;
	}
	if (typeof x === "string") {
		const t = x.trim();
		const iso = Date.parse(t.replace(" ", "T"));
		if (!Number.isNaN(iso)) return iso;
		const m = t.match(/^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})(?::(\d{2}))?/);
		if (m) return Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4], +m[5], m[6] ? +m[6] : 0);
	}
	return NaN;
}
function fmtClock(ms) {
	const d = new Date(ms);
	return `${String(d.getUTCHours()).padStart(2, "0")}:${String(d.getUTCMinutes()).padStart(2, "0")}`;
}
function fmtDay(ms) {
	const d = new Date(ms);
	return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
}
function fmtStamp(ms) {
	return `${fmtDay(ms)} ${fmtClock(ms)}`;
}
var CHART = [
	"var(--color-chart-1)",
	"var(--color-chart-2)",
	"var(--color-chart-3)",
	"var(--color-chart-4)",
	"var(--color-chart-5)",
	"var(--color-chart-6)",
	"var(--color-chart-7)",
	"var(--color-chart-8)",
	"var(--color-chart-9)",
	"var(--color-chart-10)"
];
function chartColor(i) {
	return CHART[i % CHART.length];
}
var COST_ITEMS = [
	"Machine depreciation (CAPEX)",
	"Tooling / dies amortisation",
	"Labour (operators)",
	"Planned maintenance",
	"Auxiliary utilities (air, water, cooling)",
	"Consumables (lubricants, cleaning)",
	"Allocated overheads (indirect)"
];
COST_ITEMS.map(() => "EUR/h");
var STEP_NAMES = [
	"Database",
	"System definition",
	"Flows (LCI)",
	"Costs (LCC)",
	"RT source, mix, price",
	"Run the campaign"
];
var TAB_NAMES = [
	"MAP",
	"IMPACT",
	"ENERGY",
	"PARETO",
	"LCC",
	"CED"
];
var ROWS = [
	{
		name: "Electricity Italy production mix, at consumer",
		unit: "MJ",
		climate: .108,
		acid: 42e-5,
		eutro: 8e-5,
		ced: 2.35,
		nrF: 1.72,
		nrN: .31,
		nrB: .02,
		rB: .04,
		rWsg: .14,
		rW: .12
	},
	{
		name: "Electricity from natural gas, EU mix",
		unit: "MJ",
		climate: .142,
		acid: 31e-5,
		eutro: 5e-5,
		ced: 2.55,
		nrF: 2.41,
		nrN: .06,
		nrB: .01,
		rB: .02,
		rWsg: .03,
		rW: .02
	},
	{
		name: "Electricity from average onshore wind",
		unit: "MJ",
		climate: .0034,
		acid: 2e-5,
		eutro: 4e-6,
		ced: 1.08,
		nrF: .18,
		nrN: .02,
		nrB: .01,
		rB: .02,
		rWsg: .84,
		rW: .01
	},
	{
		name: "Electricity from PV panel, Italy",
		unit: "MJ",
		climate: .0148,
		acid: 7e-5,
		eutro: 12e-6,
		ced: 1.22,
		nrF: .38,
		nrN: .04,
		nrB: .01,
		rB: .03,
		rWsg: .74,
		rW: .02
	},
	{
		name: "Electricity from hydropower, alpine",
		unit: "MJ",
		climate: .0019,
		acid: 1e-5,
		eutro: 2e-6,
		ced: 1.05,
		nrF: .06,
		nrN: .01,
		nrB: 0,
		rB: .01,
		rWsg: .02,
		rW: .95
	},
	{
		name: "Electricity from geothermal",
		unit: "MJ",
		climate: .011,
		acid: 9e-5,
		eutro: 1e-5,
		ced: 1.18,
		nrF: .22,
		nrN: .03,
		nrB: .01,
		rB: .02,
		rWsg: .88,
		rW: .02
	},
	{
		name: "Heat, natural gas boiler",
		unit: "MJ",
		climate: .068,
		acid: 18e-5,
		eutro: 3e-5,
		ced: 1.18,
		nrF: 1.12,
		nrN: .02,
		nrB: .01,
		rB: .01,
		rWsg: .01,
		rW: .01
	},
	{
		name: "Steel, low-alloy, hot rolled",
		unit: "kg",
		climate: 1.92,
		acid: .0064,
		eutro: .0011,
		ced: 24.4,
		nrF: 21.8,
		nrN: .9,
		nrB: .2,
		rB: .4,
		rWsg: .6,
		rW: .5
	},
	{
		name: "Steel, stainless 304",
		unit: "kg",
		climate: 4.62,
		acid: .018,
		eutro: .0032,
		ced: 62,
		nrF: 54,
		nrN: 3.1,
		nrB: .4,
		rB: .8,
		rWsg: 2.1,
		rW: 1.6
	},
	{
		name: "Aluminium, primary, ingot",
		unit: "kg",
		climate: 12.4,
		acid: .052,
		eutro: .0078,
		ced: 158,
		nrF: 96,
		nrN: 48,
		nrB: 1.2,
		rB: 1.8,
		rWsg: 6.4,
		rW: 4.6
	},
	{
		name: "Aluminium, recycled, ingot",
		unit: "kg",
		climate: 1.18,
		acid: .0048,
		eutro: 7e-4,
		ced: 18.6,
		nrF: 14.2,
		nrN: 2.1,
		nrB: .2,
		rB: .4,
		rWsg: 1.1,
		rW: .6
	},
	{
		name: "Copper, cathode",
		unit: "kg",
		climate: 4.05,
		acid: .042,
		eutro: .006,
		ced: 52,
		nrF: 44,
		nrN: 3.4,
		nrB: .5,
		rB: .9,
		rWsg: 1.8,
		rW: 1.4
	},
	{
		name: "Cast iron",
		unit: "kg",
		climate: 1.54,
		acid: .0055,
		eutro: 9e-4,
		ced: 19.8,
		nrF: 17.6,
		nrN: .8,
		nrB: .2,
		rB: .3,
		rWsg: .5,
		rW: .4
	},
	{
		name: "HDPE granulate",
		unit: "kg",
		climate: 1.84,
		acid: .0041,
		eutro: 6e-4,
		ced: 76.2,
		nrF: 72.4,
		nrN: 1.1,
		nrB: .4,
		rB: 1.2,
		rWsg: .7,
		rW: .4
	},
	{
		name: "PP granulate",
		unit: "kg",
		climate: 1.97,
		acid: .0044,
		eutro: 7e-4,
		ced: 73.5,
		nrF: 69.8,
		nrN: 1,
		nrB: .4,
		rB: 1.1,
		rWsg: .7,
		rW: .5
	},
	{
		name: "PVC granulate",
		unit: "kg",
		climate: 2.21,
		acid: .0072,
		eutro: .001,
		ced: 58.4,
		nrF: 54.1,
		nrN: 1.4,
		nrB: .3,
		rB: .9,
		rWsg: 1,
		rW: .7
	},
	{
		name: "Epoxy resin",
		unit: "kg",
		climate: 6.15,
		acid: .021,
		eutro: .0034,
		ced: 112,
		nrF: 102,
		nrN: 4.2,
		nrB: .6,
		rB: 1.5,
		rWsg: 2.4,
		rW: 1.3
	},
	{
		name: "Glass fibre reinforced plastic",
		unit: "kg",
		climate: 8.42,
		acid: .028,
		eutro: .0041,
		ced: 128,
		nrF: 112,
		nrN: 6.1,
		nrB: .8,
		rB: 2,
		rWsg: 4.2,
		rW: 2.9
	},
	{
		name: "Lubricating oil",
		unit: "kg",
		climate: 1.12,
		acid: .0084,
		eutro: .0015,
		ced: 52.8,
		nrF: 50.2,
		nrN: .8,
		nrB: .3,
		rB: .6,
		rWsg: .5,
		rW: .4
	},
	{
		name: "Cutting fluid, emulsion",
		unit: "kg",
		climate: .62,
		acid: .0028,
		eutro: .0018,
		ced: 18.4,
		nrF: 16.1,
		nrN: .6,
		nrB: .2,
		rB: .7,
		rWsg: .5,
		rW: .3
	},
	{
		name: "Welding electrode, steel",
		unit: "kg",
		climate: 2.48,
		acid: .0091,
		eutro: .0014,
		ced: 32.6,
		nrF: 28.4,
		nrN: 1.4,
		nrB: .3,
		rB: .6,
		rWsg: 1.1,
		rW: .8
	},
	{
		name: "Argon, gaseous",
		unit: "kg",
		climate: .54,
		acid: .0012,
		eutro: 2e-4,
		ced: 8.6,
		nrF: 6.2,
		nrN: 1.4,
		nrB: .1,
		rB: .2,
		rWsg: .4,
		rW: .3
	},
	{
		name: "Water, deionised",
		unit: "kg",
		climate: .0011,
		acid: 4e-6,
		eutro: 2e-6,
		ced: .042,
		nrF: .028,
		nrN: .006,
		nrB: .001,
		rB: .002,
		rWsg: .003,
		rW: .002
	},
	{
		name: "Cardboard, corrugated",
		unit: "kg",
		climate: .82,
		acid: .0036,
		eutro: .0012,
		ced: 28.4,
		nrF: 12.2,
		nrN: 1.1,
		nrB: .4,
		rB: 13.6,
		rWsg: .6,
		rW: .5
	},
	{
		name: "Wood pallet",
		unit: "kg",
		climate: .18,
		acid: .0011,
		eutro: 4e-4,
		ced: 18.2,
		nrF: 2.4,
		nrN: .3,
		nrB: .2,
		rB: 14.6,
		rWsg: .4,
		rW: .3
	},
	{
		name: "Plastic film, LDPE",
		unit: "kg",
		climate: 2.08,
		acid: .0048,
		eutro: 7e-4,
		ced: 78.5,
		nrF: 74.6,
		nrN: 1.2,
		nrB: .4,
		rB: 1.1,
		rWsg: .7,
		rW: .5
	},
	{
		name: "Paint, solvent-based",
		unit: "kg",
		climate: 3.42,
		acid: .014,
		eutro: .0026,
		ced: 68,
		nrF: 62.4,
		nrN: 2.1,
		nrB: .4,
		rB: 1.2,
		rWsg: 1.2,
		rW: .7
	},
	{
		name: "Rubber, synthetic",
		unit: "kg",
		climate: 2.76,
		acid: .0094,
		eutro: .0015,
		ced: 84.2,
		nrF: 78.6,
		nrN: 2,
		nrB: .5,
		rB: 1.4,
		rWsg: 1,
		rW: .7
	},
	{
		name: "Cement, Portland",
		unit: "kg",
		climate: .86,
		acid: .0018,
		eutro: 3e-4,
		ced: 4.6,
		nrF: 3.9,
		nrN: .2,
		nrB: .1,
		rB: .1,
		rWsg: .2,
		rW: .1
	},
	{
		name: "Glass, flat",
		unit: "kg",
		climate: .92,
		acid: .0042,
		eutro: 6e-4,
		ced: 15.4,
		nrF: 13.1,
		nrN: .7,
		nrB: .2,
		rB: .4,
		rWsg: .6,
		rW: .4
	},
	{
		name: "Paper, kraft",
		unit: "kg",
		climate: .64,
		acid: .0041,
		eutro: .0015,
		ced: 32.8,
		nrF: 10.4,
		nrN: 1.2,
		nrB: .5,
		rB: 19.2,
		rWsg: .8,
		rW: .7
	},
	{
		name: "Brass",
		unit: "kg",
		climate: 3.18,
		acid: .028,
		eutro: .0044,
		ced: 44,
		nrF: 37.6,
		nrN: 2.6,
		nrB: .4,
		rB: .8,
		rWsg: 1.5,
		rW: 1.1
	},
	{
		name: "Titanium alloy",
		unit: "kg",
		climate: 31.2,
		acid: .12,
		eutro: .018,
		ced: 360,
		nrF: 248,
		nrN: 86,
		nrB: 2.4,
		rB: 4.2,
		rWsg: 12.4,
		rW: 7
	},
	{
		name: "Carbon fibre",
		unit: "kg",
		climate: 24.8,
		acid: .084,
		eutro: .012,
		ced: 286,
		nrF: 248,
		nrN: 18,
		nrB: 2,
		rB: 4.8,
		rWsg: 8.2,
		rW: 5
	},
	{
		name: "Natural gas, burned",
		unit: "MJ",
		climate: .056,
		acid: 11e-5,
		eutro: 2e-5,
		ced: 1.12,
		nrF: 1.08,
		nrN: .01,
		nrB: .01,
		rB: .01,
		rWsg: .01,
		rW: 0
	},
	{
		name: "Compressed air, 7 bar",
		unit: "MJ",
		climate: .125,
		acid: 48e-5,
		eutro: 9e-5,
		ced: 2.62,
		nrF: 1.94,
		nrN: .34,
		nrB: .02,
		rB: .05,
		rWsg: .16,
		rW: .11
	},
	{
		name: "Steel chips, recycled credit",
		unit: "kg",
		climate: -1.12,
		acid: -.0032,
		eutro: -5e-4,
		ced: -14.6,
		nrF: -13.1,
		nrN: -.5,
		nrB: -.1,
		rB: -.2,
		rWsg: -.4,
		rW: -.3
	},
	{
		name: "Welding fume, treated",
		unit: "kg",
		climate: .42,
		acid: .0084,
		eutro: .0021,
		ced: 6.8,
		nrF: 5.4,
		nrN: .5,
		nrB: .1,
		rB: .2,
		rWsg: .4,
		rW: .2
	}
];
var LABELS = [
	[
		"Climate change",
		"IPCC 2013 GWP 100a",
		"kg CO2 eq"
	],
	[
		"Acidification",
		"CML 2001",
		"kg SO2 eq"
	],
	[
		"Eutrophication",
		"CML 2001",
		"kg PO4 eq"
	],
	[
		"CED",
		"Cumulative Energy Demand",
		"MJ"
	],
	[
		"Non-renewable, fossil",
		"CED sub-category",
		"MJ"
	],
	[
		"Non-renewable, nuclear",
		"CED sub-category",
		"MJ"
	],
	[
		"Non-renewable, biomass",
		"CED sub-category",
		"MJ"
	],
	[
		"Renewable, biomass",
		"CED sub-category",
		"MJ"
	],
	[
		"Renewable, wind/solar/geo",
		"CED sub-category",
		"MJ"
	],
	[
		"Renewable, water",
		"CED sub-category",
		"MJ"
	]
];
function cleanLabel$1(a, b, c) {
	return [
		a,
		b,
		c
	].filter((s) => s && !s.startsWith(".")).join(" - ");
}
function makeDemoDatabase() {
	const nC = 6 + LABELS.length;
	const raw = [];
	raw[0] = Array(nC).fill(null);
	raw[1] = Array(nC).fill(null);
	raw[2] = Array(nC).fill(null);
	LABELS.forEach((L, i) => {
		raw[0][6 + i] = L[0];
		raw[1][6 + i] = L[1];
		raw[2][6 + i] = L[2];
	});
	raw[0][4] = "Unit";
	raw[0][5] = "Process";
	const procNames = [];
	const procUnits = [];
	const procRow = [];
	ROWS.forEach((r, i) => {
		const row = Array(nC).fill(null);
		row[4] = r.unit;
		row[5] = r.name;
		[
			r.climate,
			r.acid,
			r.eutro,
			r.ced,
			r.nrF,
			r.nrN,
			r.nrB,
			r.rB,
			r.rWsg,
			r.rW
		].forEach((v, k) => {
			row[6 + k] = v;
		});
		raw[3 + i] = row;
		procNames.push(r.name);
		procUnits.push(r.unit);
		procRow.push(3 + i);
	});
	const coefCols = LABELS.map((_, i) => 6 + i);
	const colLabels = LABELS.map((L) => cleanLabel$1(L[0], L[1], L[2]));
	const cedCol = colLabels.findIndex((s) => s.trim().toUpperCase().startsWith("CED"));
	const cedNRCols = [];
	const cedRCols = [];
	if (cedCol >= 0) {
		const c0 = coefCols[cedCol];
		colLabels.forEach((lab, i) => {
			const c = coefCols[i];
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
		fileName: "dataset.xlsx (demo)"
	};
}
function findProc(db, needle) {
	const i = db.procNames.findIndex((n) => n.toLowerCase().includes(needle.toLowerCase()));
	if (i < 0) throw new Error(`Demo process not found: ${needle}`);
	return i;
}
function cedFactors(db, ip) {
	if (db.cedCol < 0) return [0, 0];
	const r = db.procRow[ip];
	let nr = 0;
	let rn = 0;
	for (const c of db.cedNRCols) {
		const v = db.raw[r][db.coefCols[c]];
		if (typeof v === "number" && Number.isFinite(v)) nr += v;
	}
	for (const c of db.cedRCols) {
		const v = db.raw[r][db.coefCols[c]];
		if (typeof v === "number" && Number.isFinite(v)) rn += v;
	}
	if (db.cedNRCols.length === 0 && db.cedRCols.length === 0) {
		const v = db.raw[r][db.coefCols[db.cedCol]];
		if (typeof v === "number" && Number.isFinite(v)) nr = v;
	}
	return [nr, rn];
}
function flowFromDb(db, nameNeedle, proc, dir, dataType, qty, extra) {
	const ip = findProc(db, nameNeedle);
	const ic = 0;
	const v = db.raw[db.procRow[ip]][db.coefCols[ic]];
	const in_ = newInputTemplate();
	in_.id = uid();
	in_.nome = db.procNames[ip];
	in_.tipo = db.procUnits[ip] === "MJ" ? "Energy" : "Matter";
	in_.proc = proc;
	in_.dir = dir;
	in_.procIdx = ip;
	in_.rowSheet = db.procRow[ip];
	in_.unit = db.procUnits[ip];
	in_.colIdx = ic;
	in_.cf = typeof v === "number" ? v : 0;
	in_.cfLabel = db.colLabels[ic];
	in_.dataType = dataType;
	in_.qty = qty;
	in_.cedF = cedFactors(db, ip);
	return {
		...in_,
		...extra
	};
}
function makeSampleSystem(db) {
	const procs = [
		"Machining",
		"Welding",
		"Assembly"
	];
	const inputs = [
		flowFromDb(db, "Steel, low-alloy", 0, "Input", "static", 2.4, { price: 1.85 }),
		flowFromDb(db, "Lubricating oil", 0, "Input", "quasi-static", .04, { price: 4.2 }),
		flowFromDb(db, "Electricity Italy production", 0, "Input", "real-time", null, { tipo: "Energy" }),
		flowFromDb(db, "Steel chips", 0, "Output", "static", .35, { price: .12 }),
		flowFromDb(db, "Welding electrode", 1, "Input", "static", .18, { price: 6.4 }),
		flowFromDb(db, "Argon, gaseous", 1, "Input", "static", .22, { price: 1.1 }),
		flowFromDb(db, "Electricity Italy production", 1, "Input", "real-time", null, { tipo: "Energy" }),
		flowFromDb(db, "Welding fume", 1, "Output", "dynamic", null, {
			lawKind: "sinusoidal",
			lawA: .008,
			lawB: .006,
			lawW: .12,
			lawTxt: "0.008 + 0.006*sin(0.12*t)",
			price: 2.4
		}),
		flowFromDb(db, "HDPE granulate", 2, "Input", "static", .65, { price: 1.45 }),
		flowFromDb(db, "Electricity Italy production", 2, "Input", "real-time", null, { tipo: "Energy" }),
		flowFromDb(db, "Cardboard, corrugated", 2, "Input", "static", .28, { price: .55 })
	];
	const costP = [
		[
			4.8,
			1.2,
			18.5,
			2.1,
			1.4,
			.6,
			3.2
		],
		[
			3.1,
			.8,
			22,
			1.6,
			1.1,
			.9,
			2.8
		],
		[
			2.4,
			.4,
			16,
			1.1,
			.8,
			.4,
			2.2
		]
	];
	if (costP[0].length !== COST_ITEMS.length) throw new Error("cost items mismatch");
	return {
		procs,
		inputs,
		costP
	};
}
function cumEnergy(n, dt, rate) {
	const out = new Array(n);
	let e = 0;
	for (let i = 0; i < n; i++) {
		const t = i * dt;
		e += rate(t) * dt;
		out[i] = e;
	}
	return out;
}
function makeDemoRT() {
	const dt = .5;
	const n = Math.floor(120 / dt) + 1;
	const t = Array.from({ length: n }, (_, i) => i * dt);
	const machining = cumEnergy(n, dt, (s) => {
		if (s < 8) return .22;
		if (s < 42) return 2.4 + .25 * Math.sin(.4 * s);
		if (s < 52) return .25;
		if (s < 92) return 2.2 + .3 * Math.sin(.35 * s);
		return .2;
	});
	const welding = cumEnergy(n, dt, (s) => {
		const pulse = (a, b) => s >= a && s < b ? 3.8 : 0;
		return .04 + pulse(18, 28) + pulse(48, 58) + pulse(78, 90);
	});
	const assembly = cumEnergy(n, dt, (s) => .32 + (s > 30 && s < 100 ? .18 : 0));
	return {
		t,
		data: t.map((_, i) => [
			machining[i],
			welding[i],
			assembly[i]
		]),
		names: [
			"Spindle energy (C)",
			"Welder energy (D)",
			"Line auxiliaries (E)"
		],
		units: [
			"Wh",
			"Wh",
			"Wh"
		],
		fileName: "test_imbriglio_1.xlsx (demo)"
	};
}
function makeDemoMix() {
	const start = Date.UTC(2026, 7, 30, 0, 0, 0);
	const end = Date.UTC(2026, 8, 2, 0, 0, 0);
	const step = 9e5;
	const src = [
		"Thermal",
		"Wind",
		"Photovoltaic",
		"Self-consumption",
		"Hydro",
		"Geothermal"
	];
	const T = [];
	const gen = [];
	for (let ms = start; ms < end; ms += step) {
		const d = new Date(ms);
		const h = d.getUTCHours() + d.getUTCMinutes() / 60;
		const day = Math.floor((ms - start) / 864e5);
		const pv = h >= 6 && h <= 20 ? 9200 * Math.sin((h - 6) / 14 * Math.PI) * (.85 + .15 * Math.sin(day)) : 0;
		const wind = 2800 + 1600 * Math.sin(h / 24 * 2 * Math.PI + day) + 400 * Math.sin(h);
		const hydro = 4100 + 200 * Math.sin(day);
		const geo = 820;
		const self = .28 * pv;
		const demand = 28500 + 4e3 * Math.sin((h - 8) / 24 * 2 * Math.PI);
		const thermal = Math.max(6500, demand - pv - wind - hydro - geo);
		T.push(ms);
		gen.push([
			thermal,
			Math.max(0, wind),
			Math.max(0, pv),
			Math.max(0, self),
			hydro,
			geo
		]);
	}
	return {
		T,
		src,
		gen,
		fileName: "terna_agosto.xlsx (demo)"
	};
}
function makeDemoPrices() {
	const start = Date.UTC(2026, 7, 30, 0, 0, 0);
	const end = Date.UTC(2026, 8, 2, 0, 0, 0);
	const step = 9e5;
	const T = [];
	const kwh = [];
	for (let ms = start; ms < end; ms += step) {
		const d = new Date(ms);
		const h = d.getUTCHours() + d.getUTCMinutes() / 60;
		const mwh = 92 + 38 * Math.sin((h - 9) / 24 * 2 * Math.PI) + 8 * Math.sin(h * .7);
		T.push(ms);
		kwh.push(mwh / 1e3);
	}
	return {
		T,
		kwh,
		zone: "IT-South",
		fileName: "energy-charts_IT_week36_2026.xlsx (demo)"
	};
}
function mapRtToSample(inputs, rt) {
	const rtIdx = inputs.map((f, i) => ({
		f,
		i
	})).filter((x) => x.f.dataType === "real-time").sort((a, b) => a.f.proc - b.f.proc);
	return inputs.map((f, i) => {
		const k = rtIdx.findIndex((x) => x.i === i);
		if (k < 0 || k >= rt.names.length) return f;
		const fProc = energyToMJ(f.unit);
		const conv = energyToMJ(rt.units[k]) / (Number.isNaN(fProc) ? 1 : fProc);
		return {
			...f,
			rtCol: k,
			rtColName: rt.names[k],
			rtConv: conv,
			nome: `${[
				"Machining",
				"Welding",
				"Assembly"
			][f.proc] ?? "P"} <- ${rt.names[k]}`
		};
	});
}
function mixAt(mix, mixCf, dn) {
	let i = 0;
	for (let k = 0; k < mix.T.length; k++) if (mix.T[k] <= dn) i = k;
	else break;
	const g = mix.gen[i].map((x) => Number.isFinite(x) && x > 0 ? x : 0);
	const tot = g.reduce((a, b) => a + b, 0);
	const sh = tot > 0 ? g.map((x) => x / tot) : g.map(() => 0);
	return {
		sh,
		cf: sh.reduce((a, s, q) => a + s * (mixCf[q] ?? 0), 0)
	};
}
function mapMixCol(db, mixSrc, colIdx) {
	const kw = {
		Thermal: "electricity gas eu",
		Wind: "average onshore",
		Photovoltaic: "pv panel",
		"Self-consumption": "pv panel",
		Hydro: "hydropower",
		Geothermal: "__none__"
	};
	const fb = "electricity italy production";
	return mixSrc.map((src) => {
		const pat = kw[src] ?? "__none__";
		let idx = -1;
		if (pat !== "__none__") idx = db.procNames.findIndex((n, i) => db.procUnits[i].trim().toLowerCase() === "mj" && n.toLowerCase().includes(pat));
		if (idx < 0) idx = db.procNames.findIndex((n, i) => db.procUnits[i].trim().toLowerCase() === "mj" && n.toLowerCase().includes(fb));
		if (idx < 0) throw new Error(`No dataset row found for grid source "${src}".`);
		const v = db.raw[db.procRow[idx]][db.coefCols[colIdx]];
		if (typeof v !== "number" || !Number.isFinite(v)) throw new Error(`Non-numeric CF for source "${src}".`);
		return v;
	});
}
function mapMixCed(db, mixSrc) {
	const nS = mixSrc.length;
	const M = Array.from({ length: nS }, () => [0, 0]);
	if (db.cedCol < 0) return M;
	for (const c of db.cedNRCols) mapMixCol(db, mixSrc, c).forEach((x, q) => {
		M[q][0] += x;
	});
	for (const c of db.cedRCols) mapMixCol(db, mixSrc, c).forEach((x, q) => {
		M[q][1] += x;
	});
	return M;
}
function prepareCycle(args) {
	const { inputs, procs } = args;
	const rtList = inputs.map((f, i) => f.dataType === "real-time" && f.rtCol >= 0 ? i : -1).filter((i) => i >= 0);
	const tvec = rtList.length && args.rt ? args.rt.t.slice() : Array.from({ length: 241 }, (_, i) => i * .5);
	const nSteps = tvec.length;
	const nIn = inputs.length;
	const nP = procs.length;
	const useMix = rtList.length > 0 && !!args.mix && Number.isFinite(args.mixStart);
	const usePrice = rtList.length > 0 && !!args.price && Number.isFinite(args.mixStart);
	const cfMixVec = new Array(nSteps).fill(0);
	const shareVec = Array.from({ length: nSteps }, () => []);
	const cedMixVec = Array.from({ length: nSteps }, () => [0, 0]);
	if (useMix && args.mix) for (let kk = 0; kk < nSteps; kk++) {
		const dn = args.mixStart + (tvec[kk] - tvec[0]) / 86400 * 1e3;
		const { sh, cf } = mixAt(args.mix, args.mixCf, dn);
		shareVec[kk] = sh;
		cfMixVec[kk] = cf;
		if (args.mixCed.length) {
			const nr = sh.reduce((a, s, q) => a + s * (args.mixCed[q]?.[0] ?? 0), 0);
			const rn = sh.reduce((a, s, q) => a + s * (args.mixCed[q]?.[1] ?? 0), 0);
			cedMixVec[kk] = [nr, rn];
		}
	}
	const priceVec = new Array(nSteps).fill(args.energyBill);
	if (usePrice && args.price) for (let kk = 0; kk < nSteps; kk++) {
		const dn = args.mixStart + (tvec[kk] - tvec[0]) / 86400 * 1e3;
		let ip = 0;
		for (let k = 0; k < args.price.T.length; k++) if (args.price.T[k] <= dn) ip = k;
		else break;
		priceVec[kk] = args.price.kwh[ip] ?? args.energyBill;
	}
	const kwhPerUnit = inputs.map((f) => {
		const fac = energyToMJ(f.unit);
		return Number.isNaN(fac) ? 0 : fac / 3.6;
	});
	const nItems = COST_ITEMS.length;
	const costP = args.costP.length === nP && args.costP[0]?.length === nItems ? args.costP : Array.from({ length: nP }, () => Array(nItems).fill(0));
	const capexP = costP.map((r) => (r[0] ?? 0) + (r[1] ?? 0));
	const labP = costP.map((r) => r[2] ?? 0);
	const opxP = costP.map((r) => r.slice(3).reduce((a, b) => a + b, 0));
	const dtStep = median(tvec.slice(1).map((x, i) => x - tvec[i]).filter((d) => d > 0)) || 1;
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
		carbonP: args.carbonPrice / 1e3,
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
		mixSrc: args.mix?.src ?? []
	};
}
function median(a) {
	if (!a.length) return NaN;
	const s = [...a].sort((x, y) => x - y);
	const m = Math.floor(s.length / 2);
	return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}
function initRunner(P, hotN = 0) {
	const n = Math.max(P.nRt, 1);
	return {
		k: 0,
		prevCum: Array(n).fill(NaN),
		heldE: Array(n).fill(NaN),
		heldI: Array(n).fill(NaN),
		hasEv: Array(n).fill(false),
		impCumRT: Array(n).fill(0),
		costCumRT: Array(n).fill(0),
		cedCumRT: Array.from({ length: n }, () => [0, 0]),
		costDisr: 0,
		hotN,
		alarmDone: Array(P.nP).fill(false),
		series: [],
		valHistory: [],
		lastImps: Array(P.nIn).fill(0),
		lastCosts: Array(P.nIn).fill(0),
		lastCed: Array.from({ length: P.nIn }, () => [0, 0]),
		lastInst: Array(P.nIn).fill(0)
	};
}
function stepBatch(P, R, rt, batch) {
	const { inputs: Inp, tvec: tv, nIn, nP, rtList } = P;
	const kEnd = Math.min(R.k + batch, P.nSteps);
	const vals = new Array(nIn).fill(0);
	const imps = R.lastImps.slice();
	const impsInst = new Array(nIn).fill(0);
	const costs = R.lastCosts.slice();
	const ced = R.lastCed.map((c) => [c[0], c[1]]);
	for (let kk = R.k; kk < kEnd; kk++) {
		const tk = tv[kk];
		const tg = P.tOffset + (tk - tv[0]);
		for (let i = 0; i < nIn; i++) {
			const f = Inp[i];
			let v;
			let vi;
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
			const j = rtList[kx];
			const cum = vals[j];
			if (!Number.isNaN(R.prevCum[kx])) {
				const delta = cum - R.prevCum[kx];
				if (delta !== 0) {
					R.heldE[kx] = delta;
					const cfj = P.useMix ? P.cfMixVec[kk] : Inp[j].cf;
					R.heldI[kx] = delta * cfj;
					R.impCumRT[kx] += delta * cfj;
					R.costCumRT[kx] += delta * P.kwhPerUnit[j] * P.priceVec[kk];
					if (P.useCedMix) {
						R.cedCumRT[kx][0] += delta * P.cedMixVec[kk][0];
						R.cedCumRT[kx][1] += delta * P.cedMixVec[kk][1];
					} else {
						R.cedCumRT[kx][0] += delta * Inp[j].cedF[0];
						R.cedCumRT[kx][1] += delta * Inp[j].cedF[1];
					}
					R.hasEv[kx] = true;
					impsInst[j] = R.heldI[kx];
				}
			}
			R.prevCum[kx] = cum;
			imps[j] = R.impCumRT[kx];
			costs[j] = R.costCumRT[kx];
			ced[j] = [R.cedCumRT[kx][0], R.cedCumRT[kx][1]];
		}
		for (let i = 0; i < nIn; i++) if (Inp[i].dataType !== "real-time") ced[i] = [vals[i] * Inp[i].cedF[0], vals[i] * Inp[i].cedF[1]];
		for (let i = 0; i < nIn; i++) if (Inp[i].dataType !== "real-time") costs[i] = vals[i] * Inp[i].price;
		const elapsedH = (tk - tv[0]) / 3600;
		const instTot = impsInst.reduce((a, b) => a + b, 0);
		if (P.soglia > 0 && instTot > P.soglia) {
			R.hotN += 1;
			R.costDisr += P.disrRate * P.dtStep / 3600;
		}
		const costTime = P.capexP.map((c, p) => (c + P.labP[p] + P.opxP[p]) * elapsedH);
		const costCarb = imps.map((x) => P.carbonP * Math.abs(x));
		const costTot = costs.reduce((a, b) => a + b, 0) + costTime.reduce((a, b) => a + b, 0) + costCarb.reduce((a, b) => a + b, 0) + R.costDisr;
		const cumTot = imps.reduce((a, b) => a + b, 0);
		const eIns = rtList.map((_, kx) => Number.isFinite(R.heldE[kx]) ? R.heldE[kx] : 0);
		const mixShare = P.shareVec[kk] ?? [];
		const pt = {
			t: tk,
			tg,
			inst: instTot,
			cum: cumTot,
			cost: costTot,
			costE: R.costCumRT.reduce((a, b) => a + b, 0),
			ced: ced.reduce((a, c) => a + c[0] + c[1], 0),
			cedR: ced.reduce((a, c) => a + c[1], 0),
			cfMix: P.useMix ? P.cfMixVec[kk] : NaN,
			price: P.priceVec[kk],
			hot: P.soglia > 0 && instTot > P.soglia,
			vals: vals.slice(),
			eIns,
			mixShare
		};
		R.series.push(pt);
		R.valHistory.push({
			tg,
			vals: vals.slice()
		});
		R.lastInst = impsInst.slice();
	}
	R.k = kEnd;
	R.lastImps = imps;
	R.lastCosts = costs;
	R.lastCed = ced;
	return snapshot(P, R, imps, costs, ced, R.lastInst);
}
function snapshot(P, R, imps, costs, ced, impsInst) {
	const last = R.series[R.series.length - 1];
	const nP = P.nP;
	const procImp = Array(nP).fill(0);
	for (let i = 0; i < P.nIn; i++) procImp[P.inputs[i].proc] += imps[i];
	const elapsedH = last ? (last.t - P.tvec[0]) / 3600 : 0;
	const costStack = Array.from({ length: nP }, (_, p) => {
		const flowCosts = P.inputs.map((f, i) => f.proc === p ? Math.abs(costs[i]) : 0);
		const capex = P.capexP[p] * elapsedH;
		const labour = P.labP[p] * elapsedH;
		const opex = P.opxP[p] * elapsedH;
		let carbon = 0;
		for (let i = 0; i < P.nIn; i++) if (P.inputs[i].proc === p) carbon += P.carbonP * Math.abs(imps[i]);
		const total = flowCosts.reduce((a, b) => a + b, 0) + capex + labour + opex + carbon;
		return {
			flowCosts,
			capex,
			labour,
			opex,
			carbon,
			total
		};
	});
	const cedP = Array.from({ length: nP }, () => [0, 0]);
	for (let i = 0; i < P.nIn; i++) {
		const p = P.inputs[i].proc;
		cedP[p][0] += Math.abs(ced[i][0]);
		cedP[p][1] += Math.abs(ced[i][1]);
	}
	const totAll = procImp.reduce((a, b) => a + Math.abs(b), 0);
	const alarmProcs = Array(nP).fill(false);
	let alarm = "";
	const dqList = [];
	for (let p = 0; p < nP; p++) {
		const share = totAll > 0 ? Math.abs(procImp[p]) / totAll : 0;
		if (nP > 1 && share > .8) {
			alarmProcs[p] = true;
			alarm = `ALARM: "${P.procs[p]}" alone causes ${(100 * share).toFixed(0)}% of the total impact (> 80%)`;
			if (!R.alarmDone[p]) R.alarmDone[p] = true;
		}
		const fl = P.inputs.map((f, i) => ({
			f,
			i
		})).filter((x) => x.f.proc === p);
		const seg = fl.map((x) => Math.abs(imps[x.i]));
		const totp = seg.reduce((a, b) => a + b, 0);
		if (fl.length && totp > 0) {
			let im = 0;
			for (let k = 1; k < seg.length; k++) if (seg[k] > seg[im]) im = k;
			const dom = fl[im].f;
			const rtShare = fl.reduce((a, x, k) => a + (x.f.dataType === "real-time" ? seg[k] : 0), 0) / totp;
			if (dom.dataType !== "real-time") dqList.push(`${P.procs[p]}: ${(100 * seg[im] / totp).toFixed(0)}% from "${trunc(dom.nome, 16)}" (${dom.dataType}); RT ${(100 * rtShare).toFixed(0)}%`);
		}
	}
	const mixShare = last?.mixShare ?? [];
	let mixLabel = "Grid mix not loaded";
	if (P.useMix && last) mixLabel = `${fmtStamp(P.mixStart + (last.t - P.tvec[0]) / 86400 * 1e3)}   cf=${Number.isFinite(last.cfMix) ? last.cfMix.toPrecision(4) : "-"}`;
	const gaugeCum = P.rtList.map((_, kx) => R.impCumRT[kx]);
	const gaugeInst = P.rtList.map((_, kx) => Number.isFinite(R.heldI[kx]) ? R.heldI[kx] : 0);
	const rtNames = P.rtList.map((j) => trunc(P.inputs[j].nome, 18));
	cedP.reduce((a, c) => a + c[0] + c[1], 0);
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
		flowCed: ced.map((c) => [c[0], c[1]]),
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
		dq: dqList.length === 0 ? "Data quality: the dominant flow of every process is measured in real time." : `Data quality: dominant flow NOT real-time in → ${dqList.join(" | ")}`,
		alarmProcs,
		elapsedH,
		rtNames,
		done: R.k >= P.nSteps,
		series: R.series,
		valHistory: R.valHistory
	};
}
function finishResult(P, live, notes) {
	const delta = P.statVal > 0 ? 100 * (live.cumTot - P.statVal) / P.statVal : null;
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
		flowCED: live.flowCed.map((c) => [c[0], c[1]]),
		costTotal: live.costTot,
		costEnergy: live.costEnergy,
		costDisruption: live.costDisr,
		costPerUnit: live.costTot / Math.max(P.unitsPerCycle, 1),
		cedTotal: live.cedP.reduce((a, c) => a + c[0] + c[1], 0),
		cedRenewable: live.cedP.reduce((a, c) => a + c[1], 0),
		hotspots: live.hotN,
		dataQualityNotes: notes,
		mixStart: Number.isFinite(P.mixStart) ? fmtStamp(P.mixStart) : "",
		timestamp: fmtStamp(Date.now())
	};
}
function qualityNotes(P, live) {
	const msg = [];
	for (let p = 0; p < P.nP; p++) {
		const fl = P.inputs.map((f, i) => ({
			f,
			i
		})).filter((x) => x.f.proc === p);
		if (!fl.length) continue;
		const seg = fl.map((x) => Math.abs(live.flowImp[x.i]));
		const totp = seg.reduce((a, b) => a + b, 0);
		if (totp <= 0) continue;
		let im = 0;
		for (let k = 1; k < seg.length; k++) if (seg[k] > seg[im]) im = k;
		const dom = fl[im].f;
		const rtShare = fl.reduce((a, x, k) => a + (x.f.dataType === "real-time" ? seg[k] : 0), 0) / totp;
		if (dom.dataType !== "real-time") msg.push(`- "${P.procs[p]}": ${(100 * seg[im] / totp).toFixed(0)}% of its impact comes from "${dom.nome}", a ${dom.dataType} datum; only ${(100 * rtShare).toFixed(0)}% of the column is measured in real time.`);
	}
	return msg;
}
function downloadCampaign(args) {
	if (!args.results.length) throw new Error("No completed cycle yet: run at least one cycle before saving.");
	const wb = utils.book_new();
	const sys = [
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
		["Saved on", (/* @__PURE__ */ new Date()).toISOString()],
		[],
		[
			"#",
			"Unit process",
			"Direction",
			"Taxonomy",
			"Dataset process",
			"Unit",
			"Quantity / law / channel",
			"Impact factor",
			"Unit price [EUR/unit]",
			"CED non-renew. [MJ/unit]",
			"CED renew. [MJ/unit]"
		]
	];
	args.inputs.forEach((in_, i) => {
		let q;
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
			in_.cedF[1]
		]);
	});
	sys.push([]);
	sys.push(["Unit process", ...COST_ITEMS]);
	args.procs.forEach((p, i) => {
		sys.push([p, ...args.costP[i] ?? COST_ITEMS.map(() => 0)]);
	});
	utils.book_append_sheet(wb, utils.aoa_to_sheet(sys), "System");
	const rr = [[
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
		"Data quality notes"
	]];
	for (const R of args.results) rr.push([
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
		R.dataQualityNotes.join(" | ")
	]);
	utils.book_append_sheet(wb, utils.aoa_to_sheet(rr), "Results");
	const fr = [[
		"Cycle",
		"#",
		"Unit process",
		"Flow",
		"Taxonomy",
		"Impact",
		"Cost [EUR]",
		"CED NR [MJ]",
		"CED R [MJ]"
	]];
	for (const R of args.results) R.flowImpact.forEach((_, i) => {
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
			R.flowCED[i]?.[1] ?? 0
		]);
	});
	utils.book_append_sheet(wb, utils.aoa_to_sheet(fr), "Flows");
	args.series.forEach((M, k) => {
		if (!M.length) return;
		utils.book_append_sheet(wb, utils.aoa_to_sheet([[
			"t [s]",
			"cf mix",
			"price [EUR/kWh]",
			"inst impact",
			"cum impact",
			"cum cost [EUR]",
			"cum CED [MJ]"
		], ...M]), `Series_cycle${k + 1}`);
	});
	utils.book_append_sheet(wb, utils.aoa_to_sheet(args.log.map((l) => [l])), "Log");
	const stamp = (/* @__PURE__ */ new Date()).toISOString().replace(/[-:]/g, "").slice(0, 15);
	const fn = `RTLCA_${args.campaign}_${stamp}.xlsx`;
	writeFileSync(wb, fn);
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
		SavedOn: (/* @__PURE__ */ new Date()).toISOString()
	};
	const blob = new Blob([JSON.stringify(json, null, 2)], { type: "application/json" });
	const a = document.createElement("a");
	a.href = URL.createObjectURL(blob);
	a.download = fn.replace(/\.xlsx$/, ".json");
	a.click();
	URL.revokeObjectURL(a.href);
	return fn;
}
function seriesMatrix(live) {
	if (!live) return [];
	return live.series.map((p) => [
		p.t,
		p.cfMix,
		p.price,
		p.inst,
		p.cum,
		p.cost,
		p.ced
	]);
}
var defaultDraft = () => ({
	dir: "Input",
	dataType: "static",
	tipo: "Matter",
	kw: "",
	qty: 1,
	lawKind: "linear",
	lawA: 10,
	lawB: 2,
	lawW: .05,
	lawExpr: "10 + 5*sin(0.05*t)",
	selectedProc: 0,
	selectedDb: 0
});
var runner = null;
var prepared = null;
var timer = null;
function stopTimer() {
	if (timer != null) {
		window.clearTimeout(timer);
		timer = null;
	}
}
var useRtlca = create((set, get) => ({
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
	energyBill: .25,
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
		if (get().qsOpen?.mode === "newcycle") set({
			expN: Math.max(1, get().expN - 1),
			qsOpen: null
		});
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
		const patch = {
			step: k,
			maxStep: Math.max(s.maxStep, k)
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
			status: `Database loaded: ${db.procNames.length} processes, ${db.colLabels.length} indicators. Define the system.`
		});
		if (db.cedCol >= 0) get().addLog(`CED columns found: total + ${db.cedNRCols.length} non-renewable + ${db.cedRCols.length} renewable`);
		else get().addLog("WARNING: no CED column in the dataset (CED tab disabled).");
		get().gotoStep(2);
	},
	addProc: (name) => {
		const nm = name.trim();
		if (!nm) return;
		set((s) => ({
			procs: [...s.procs, nm],
			draft: {
				...s.draft,
				selectedProc: s.procs.length
			},
			status: `${s.procs.length + 1} unit processes: press + for another one, NEXT to add the flows.`
		}));
	},
	delProc: () => {
		const s = get();
		const n = s.procs.length;
		if (!n) return;
		if (s.inputs.some((f) => f.proc === n - 1)) {
			set({ alert: {
				title: "Unit processes",
				message: `"${s.procs[n - 1]}" has flows: remove them first.`,
				kind: "error"
			} });
			return;
		}
		set({ procs: s.procs.slice(0, -1) });
	},
	renameProc: (p, name) => {
		const nm = name.trim();
		if (!nm) return;
		set((s) => {
			const procs = s.procs.slice();
			procs[p];
			procs[p] = nm;
			return { procs };
		});
	},
	procsNext: () => {
		if (!get().procs.length) {
			set({ alert: {
				title: "Unit processes",
				message: "Add at least one unit process with the + button.",
				kind: "error"
			} });
			return;
		}
		set({
			procsDone: true,
			status: "Now add the input/output flows of each unit process (energy: one real-time flow per process)."
		});
		get().gotoStep(3);
	},
	setDraft: (p) => set((s) => {
		const draft = {
			...s.draft,
			...p
		};
		if (p.dataType === "real-time") draft.tipo = "Energy";
		else if (p.tipo === "Energy" && draft.dataType !== "real-time") draft.dataType = "real-time";
		else if (p.tipo === "Matter" && draft.dataType === "real-time") draft.dataType = "static";
		return { draft };
	}),
	addFlow: () => {
		const s = get();
		if (!s.procsDone) {
			set({ alert: {
				title: "Flows",
				message: "Define the unit processes first (Step 2).",
				kind: "error"
			} });
			return;
		}
		const db = s.db;
		if (!db) {
			set({ alert: {
				title: "Flows",
				message: "Load the database first.",
				kind: "error"
			} });
			return;
		}
		const idx = filteredDbIndex(db, s.draft)[s.draft.selectedDb];
		if (idx == null) {
			set({ alert: {
				title: "Flows",
				message: "Select a valid dataset process.",
				kind: "error"
			} });
			return;
		}
		const ic = s.impactCat;
		const v = db.raw[db.procRow[idx]][db.coefCols[ic]];
		if (typeof v !== "number" || !Number.isFinite(v)) {
			set({ alert: {
				title: "Flows",
				message: "Non-numeric coefficient for this row in the chosen category.",
				kind: "error"
			} });
			return;
		}
		const in_ = newInputTemplate();
		in_.nome = db.procNames[idx];
		in_.tipo = s.draft.tipo;
		in_.proc = s.draft.selectedProc;
		in_.dir = s.draft.dir;
		in_.procIdx = idx;
		in_.rowSheet = db.procRow[idx];
		in_.unit = db.procUnits[idx];
		in_.colIdx = ic;
		in_.cf = v;
		in_.cfLabel = db.colLabels[ic];
		in_.dataType = s.draft.dataType;
		in_.cedF = cedFactors(db, idx);
		if (s.draft.dataType === "static" || s.draft.dataType === "quasi-static") {
			if (!Number.isFinite(s.draft.qty)) {
				set({ alert: {
					title: "Flows",
					message: "Invalid quantity.",
					kind: "error"
				} });
				return;
			}
			in_.qty = s.draft.qty;
		} else if (s.draft.dataType === "dynamic") {
			const law = validateLaw(s.draft.lawKind, s.draft.lawA, s.draft.lawB, s.draft.lawW, s.draft.lawExpr);
			if (!law.ok) {
				set({ alert: {
					title: "Variation law",
					message: law.msg,
					kind: "error"
				} });
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
				set({ alert: {
					title: "Real-time",
					message: `"${s.procs[in_.proc]}" already has its energy input: one per unit process.`,
					kind: "error"
				} });
				return;
			}
			in_.qty = null;
		}
		set({
			inputs: [...s.inputs, in_],
			status: `${s.inputs.length + 1} flows defined. Press FINISH FLOWS when done.`
		});
	},
	removeFlow: (idx) => {
		const s = get();
		const r = idx ?? s.selectedFlow;
		if (r < 0 || r >= s.inputs.length) {
			set({ alert: {
				title: "Remove",
				message: "Select a flow in the list.",
				kind: "error"
			} });
			return;
		}
		const inputs = s.inputs.filter((_, i) => i !== r);
		set({
			inputs,
			selectedFlow: inputs.length - 1
		});
	},
	endFlows: () => {
		const s = get();
		if (!s.inputs.length) {
			set({ alert: {
				title: "Finish flows",
				message: "Define at least one flow.",
				kind: "error"
			} });
			return;
		}
		s.procs.forEach((p, i) => {
			if (!s.inputs.some((f) => f.proc === i)) get().addLog(`WARNING: process "${p}" has no flows (empty column in Pareto).`);
		});
		set({
			flowsDone: true,
			status: "Enter the costs and prices for the LCC (or NEXT to skip them)."
		});
		get().gotoStep(4);
		const nP = get().procs.length;
		if (get().costP.length !== nP) set({ costP: Array.from({ length: nP }, () => Array(COST_ITEMS.length).fill(0)) });
	},
	setCostP: (p, k, v) => set((s) => {
		return { costP: s.costP.map((row, i) => i === p ? row.map((x, j) => j === k ? v : x) : row) };
	}),
	setFlowPrice: (i, v) => set((s) => ({ inputs: s.inputs.map((f, k) => k === i ? {
		...f,
		price: v
	} : f) })),
	setGlobalCost: (k, v) => set({ [k]: k === "unitsPerCycle" ? Math.max(v, 1) : v }),
	saveCosts: () => {
		const s = get();
		set({
			costsSet: true,
			costOpen: false
		});
		get().addLog("Costs and prices saved (LCC):");
		s.procs.forEach((p, i) => {
			const row = s.costP[i] ?? [];
			const sum = row.reduce((a, b) => a + b, 0);
			get().addLog(`   ${trunc(p, 16).padEnd(16)} hourly items ${sum.toFixed(2)} EUR/h  (CAPEX ${(row[0] + row[1]).toFixed(2)}, labour ${(row[2] ?? 0).toFixed(2)}, other OPEX ${row.slice(3).reduce((a, b) => a + b, 0).toFixed(2)})`);
		});
		get().addLog(`   energy ${s.energyBill.toFixed(4)} EUR/kWh | carbon ${s.carbonPrice.toFixed(1)} EUR/tCO2e | disruption ${s.disrCost.toFixed(2)} EUR/h | ${s.unitsPerCycle} units/cycle`);
		set({ status: `Costs saved for ${s.procs.length} processes (${COST_ITEMS.length} hourly items each). Press NEXT.` });
	},
	costsNext: () => {
		const s = get();
		if (!s.costsSet) get().addLog("LCC: no costs entered, all prices = 0 (impact only).");
		get().gotoStep(5);
		set({ status: s.inputs.some((f) => f.dataType === "real-time") ? "Load the RT file, the grid mix and (optional) the price file, then CONFIRM." : "No real-time flow: press CONFIRM directly." });
	},
	loadDemoRT: () => get().loadRT(makeDemoRT()),
	loadRT: (rt) => {
		const s = get();
		const rtIdx = s.inputs.map((f, i) => f.dataType === "real-time" ? i : -1).filter((i) => i >= 0);
		if (!rtIdx.length) {
			set({ alert: {
				title: "Real-time",
				message: "Add the energy (real-time) input of at least one unit process in Step 3.",
				kind: "error"
			} });
			return;
		}
		const ordered = [...rtIdx].sort((a, b) => s.inputs[a].proc - s.inputs[b].proc);
		const defs = rt.names.map((_, c) => c < ordered.length ? s.inputs[ordered[c]].proc + 1 : 0);
		set({
			rt,
			rtMapOpen: {
				names: rt.names,
				units: rt.units,
				defs
			}
		});
	},
	applyRtMap: (assign) => {
		const s = get();
		const rt = s.rt;
		if (!rt) return;
		const nP = s.procs.length;
		for (let c = 0; c < assign.length; c++) {
			const p = assign[c];
			if (!Number.isInteger(p) || p < 0 || p > nP) {
				set({ alert: {
					title: "Real-time",
					message: `Invalid process number for column "${rt.names[c]}".`,
					kind: "error"
				} });
				return;
			}
			if (p > 0 && assign.slice(0, c).includes(p)) {
				set({ alert: {
					title: "Real-time",
					message: `Process "${s.procs[p - 1]}" receives two columns: one column per process.`,
					kind: "error"
				} });
				return;
			}
			if (p > 0 && !s.inputs.some((f) => f.dataType === "real-time" && f.proc === p - 1)) {
				set({ alert: {
					title: "Real-time",
					message: `Process "${s.procs[p - 1]}" has no energy input: add it in Step 3 or assign the column to another process.`,
					kind: "error"
				} });
				return;
			}
		}
		const inputs = s.inputs.map((f) => f.dataType === "real-time" ? {
			...f,
			rtCol: -1,
			rtColName: "",
			rtConv: 1
		} : f);
		get().addLog("Energy columns -> unit processes:");
		assign.forEach((p, c) => {
			if (p === 0) {
				get().addLog(`   ${rt.names[c].padEnd(22)} ignored`);
				return;
			}
			const j = inputs.findIndex((f) => f.dataType === "real-time" && f.proc === p - 1);
			const fProc = energyToMJ(inputs[j].unit);
			if (Number.isNaN(fProc)) {
				set({ alert: {
					title: "Real-time",
					message: `"${inputs[j].nome}" has unit "${inputs[j].unit}": the energy input must be an MJ process.`,
					kind: "error"
				} });
				return;
			}
			const conv = energyToMJ(rt.units[c]) / fProc;
			inputs[j] = {
				...inputs[j],
				rtCol: c,
				rtColName: rt.names[c],
				rtConv: conv,
				nome: `${trunc(s.procs[p - 1], 10)} <- ${rt.names[c]}`
			};
			get().addLog(`   ${rt.names[c].padEnd(22)} -> ${s.procs[p - 1].padEnd(12)} [${rt.units[c]} -> ${inputs[j].unit}] x${conv.toPrecision(5)}`);
		});
		set({
			inputs,
			rtMapOpen: null,
			status: `RT file: ${rt.t.length} rows, ${assign.filter((p) => p > 0).length} columns matched. Load the grid mix, then CONFIRM.`
		});
	},
	loadDemoMix: () => get().loadMix(makeDemoMix()),
	loadMix: (mix) => {
		const s = get();
		if (!s.db) {
			set({ alert: {
				title: "Grid mix",
				message: "Load the CF database first (Step 1).",
				kind: "error"
			} });
			return;
		}
		try {
			const mixCf = mapMixCol(s.db, mix.src, s.impactCat);
			set({
				mix,
				mixCf,
				mixCed: mapMixCed(s.db, mix.src),
				clockTime: defaultClock(mix.T, s.price?.T),
				status: `Grid mix loaded: ${mix.T.length} intervals, sources: ${mix.src.join(", ")}.`
			});
			get().addLog("Grid mix source -> dataset CF mapping:");
			mix.src.forEach((src, q) => get().addLog(`   ${src.padEnd(17)} cf = ${mixCf[q]}`));
		} catch (e) {
			set({ alert: {
				title: "Grid mix reading error",
				message: e instanceof Error ? e.message : String(e),
				kind: "error"
			} });
		}
	},
	loadDemoPrice: () => get().loadPrice(makeDemoPrices()),
	loadPrice: (price) => {
		set({
			price,
			clockTime: get().clockTime ?? defaultClock(get().mix?.T, price.T),
			status: `Energy price loaded: ${price.T.length} intervals (${price.zone}), ${Math.min(...price.kwh).toFixed(3)}–${Math.max(...price.kwh).toFixed(3)} EUR/kWh.`
		});
		get().addLog(`Energy price file loaded (zone ${price.zone}): ${fmtStamp(price.T[0])} -> ${fmtStamp(price.T[price.T.length - 1])}`);
	},
	setClock: (ms) => set({ clockTime: ms }),
	confirm: () => {
		const s = get();
		if (s.inputs.filter((f) => f.dataType === "real-time").length) {
			if (!s.rt) {
				set({ alert: {
					title: "Configuration",
					message: "There are real-time flows but the file has not been loaded.",
					kind: "error"
				} });
				return;
			}
			const missing = s.inputs.find((f) => f.dataType === "real-time" && f.rtCol < 0);
			if (missing) {
				set({ alert: {
					title: "Configuration",
					message: `The energy input of "${s.procs[missing.proc]}" has no column: press LOAD RT.`,
					kind: "error"
				} });
				return;
			}
		}
		const qs = s.inputs.filter((f) => f.dataType === "quasi-static");
		if (qs.length) {
			set({ qsOpen: {
				ids: qs.map((f) => f.id),
				prompts: qs.map((f) => `${f.nome} [${f.unit}] (${s.procs[f.proc]})`),
				defs: qs.map((f) => f.qty == null || Number.isNaN(f.qty) ? "" : String(f.qty)),
				mode: "confirm"
			} });
			return;
		}
		finishConfirm(set, get);
	},
	applyQS: (values) => {
		const s = get();
		const qs = s.qsOpen;
		if (!qs) return false;
		if (values.some((v) => !Number.isFinite(v))) {
			set({ alert: {
				title: "Quasi-static",
				message: "Invalid value.",
				kind: "error"
			} });
			return false;
		}
		set({
			inputs: s.inputs.map((f) => {
				const k = qs.ids.indexOf(f.id);
				return k >= 0 ? {
					...f,
					qty: values[k]
				} : f;
			}),
			qsOpen: null
		});
		if (qs.mode === "newcycle") resetForNewCycle(set, get);
		else finishConfirm(set, get);
		return true;
	},
	start: () => {
		const s = get();
		if (!s.configDone || !prepared) {
			set({ alert: {
				title: "Run",
				message: "Complete steps 1–5 first.",
				kind: "error"
			} });
			return;
		}
		if (runner && runner.k >= prepared.nSteps) {
			set({ alert: {
				title: "Run",
				message: "Cycle already completed: press NEW CYCLE.",
				kind: "error"
			} });
			return;
		}
		if (!runner) runner = initRunner(prepared, s.hotN);
		set({ running: true });
		const tick = () => {
			const st = get();
			if (!st.running || !prepared || !runner) return;
			const batch = st.speed === "max" ? 40 : st.speed;
			const live = stepBatch(prepared, runner, st.rt, batch);
			const logHot = live.hotN > st.hotN && live.hotN % 10 === 1 ? `  HOTSPOT cycle ${prepared.expN}: t=${live.series[live.series.length - 1]?.t.toFixed(2)} s, inst=${fmt(live.instTot)} > thr ${fmt(prepared.soglia)}` : null;
			set({
				live,
				hotN: live.hotN,
				status: `Cycle ${prepared.expN}: t = ${(live.series.at(-1)?.t ?? 0).toFixed(1)} s (${live.idx}/${live.nSteps})`
			});
			if (logHot) get().addLog(logHot);
			if (live.alarm && live.alarmProcs.some(Boolean) && live.done === false) {}
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
		set({
			running: false,
			status: `Cycle ${get().expN} paused (${get().live?.idx ?? 0}/${get().live?.nSteps ?? 0}): press START to resume.`
		});
	},
	newCycle: () => {
		const s = get();
		if (s.live && s.live.idx < s.live.nSteps && s.live.idx > 1) {
			set({ alert: {
				title: "New cycle",
				message: "The current cycle is not finished: complete it or stop it.",
				kind: "error"
			} });
			return;
		}
		const qs = s.inputs.filter((f) => f.dataType === "quasi-static");
		set({ expN: s.expN + 1 });
		if (qs.length) {
			set({ qsOpen: {
				ids: qs.map((f) => f.id),
				prompts: qs.map((f) => `${f.nome} [${f.unit}] (${s.procs[f.proc]})`),
				defs: qs.map((f) => f.qty == null ? "" : String(f.qty)),
				mode: "newcycle"
			} });
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
				log: s.log
			});
			get().addLog(`Results saved: ${fn} (+ JSON state)`);
			set({ status: `Results saved to ${fn} (workbook) and .json (state).` });
		} catch (e) {
			set({ alert: {
				title: "Save results",
				message: e instanceof Error ? e.message : String(e),
				kind: "error"
			} });
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
			energyBill: .25,
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
			draft: {
				...defaultDraft(),
				selectedProc: 0
			}
		});
		get().addLog(`[Gate_to_gate_demo] Sample campaign loaded (category: ${trunc(db.colLabels[0], 40)}).`);
		get().addLog("Energy columns -> unit processes:");
		inputs.filter((f) => f.dataType === "real-time").forEach((f) => get().addLog(`   ${f.rtColName.padEnd(22)} -> ${procs[f.proc]}`));
		mix.src.forEach((src, q) => get().addLog(`   ${src.padEnd(17)} cf = ${mixCf[q]}`));
		get().addLog(`Grid mix window start: ${fmtStamp(clockTime)}`);
		get().addLog(`Energy price: 15-min market price from ${fmtStamp(clockTime)} (replaces the bill price).`);
		armPrepared(get);
		set({ status: "Sample campaign ready: press START. Three unit processes, live energy, Italian grid mix." });
	},
	editFlowQty: (i, qty) => set((s) => ({
		inputs: s.inputs.map((f, k) => k === i ? {
			...f,
			qty
		} : f),
		configDone: false
	}))
}));
function filteredDbIndex(db, draft) {
	let m = db.procNames.map((_, i) => i);
	if (draft.tipo === "Energy") m = m.filter((i) => db.procUnits[i].toLowerCase() === "mj");
	const kw = draft.kw.trim().toLowerCase();
	if (kw) m = m.filter((i) => db.procNames[i].toLowerCase().includes(kw));
	return m;
}
function filteredDb(db, draft) {
	const idx = filteredDbIndex(db, draft);
	return {
		idx,
		capped: idx.slice(0, 250),
		nAll: idx.length
	};
}
function defaultClock(mixT, priceT) {
	const T = mixT?.length ? mixT : priceT;
	if (!T?.length) return null;
	const target = Date.UTC(2026, 7, 31, 15, 0, 0);
	let best = T[0];
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
function finishConfirm(set, get) {
	const s = get();
	const camp = s.campaign.trim() || "Campaign_1";
	const hasRt = s.inputs.some((f) => f.dataType === "real-time");
	if (hasRt && s.price && s.clockTime) get().addLog(`Energy price: 15-min market price from ${fmtStamp(s.clockTime)} (replaces the bill price).`);
	else if (hasRt) get().addLog(`Energy price: fixed bill price ${s.energyBill.toFixed(4)} EUR/kWh.`);
	if (hasRt && s.mix && s.clockTime) {
		const { sh, cf } = mixAt(s.mix, s.mixCf, s.clockTime);
		get().addLog(`Grid mix window start: ${fmtStamp(s.clockTime)}  (cf mix = ${cf})`);
		s.mix.src.forEach((src, q) => get().addLog(`   ${src.padEnd(17)} ${(100 * sh[q]).toFixed(1)}%`));
	} else if (hasRt) get().addLog("Grid mix NOT loaded: real-time flows use their fixed dataset CF.");
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
		status: `Campaign "${camp}" ready: press START.`
	});
	armPrepared(get);
	get().gotoStep(6);
}
function armPrepared(get) {
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
		category: s.db?.colLabels[s.impactCat] ?? ""
	});
	runner = initRunner(prepared, 0);
}
function resetForNewCycle(set, get) {
	const s = get();
	set({
		live: null,
		hotN: s.hotN,
		status: `Cycle ${s.expN} ready: press START.`
	});
	armPrepared(get);
}
function completeCycle(set, get, live) {
	stopTimer();
	if (!prepared) return;
	const notes = qualityNotes(prepared, live);
	const R = finishResult(prepared, live, notes);
	const s = get();
	const tvec = prepared.tvec;
	const tOffset = s.tOffset + (tvec[tvec.length - 1] - tvec[0]) + Math.max(1, .03 * (tvec[tvec.length - 1] - tvec[0]));
	get().addLog(`[${s.campaign}] Cycle ${s.expN} completed: total impact = ${live.cumTot}`);
	s.procs.forEach((p, i) => get().addLog(`   ${trunc(p, 16).padEnd(16)} = ${live.procImp[i]}`));
	if (prepared.statVal > 0) {
		const dperc = 100 * (live.cumTot - prepared.statVal) / prepared.statVal;
		get().addLog(`   Delta% vs static LCA = ${dperc >= 0 ? "+" : ""}${dperc.toFixed(2)}%  (RT=${live.cumTot}, static=${prepared.statVal})`);
	}
	(tvec[tvec.length - 1] - tvec[0]) / 3600;
	get().addLog(`   LCC total = ${live.costTot.toFixed(2)} EUR: energy ${live.costEnergy.toFixed(2)} | disruption ${live.costDisr.toFixed(2)}`);
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
		status: `Cycle ${s.expN} completed. Press NEW CYCLE for the next run.`
	});
	if (notes.length) set({ alert: {
		title: "Data quality: dominant contribution not real-time",
		message: notes.join("\n"),
		kind: "info"
	} });
}
function clockDays(s) {
	const T = s.mix?.T ?? s.price?.T ?? [];
	return Array.from(new Set(T.map((t) => Date.UTC(new Date(t).getUTCFullYear(), new Date(t).getUTCMonth(), new Date(t).getUTCDate())))).sort((a, b) => a - b);
}
function clockTimes(s, day) {
	return (s.mix?.T ?? s.price?.T ?? []).filter((t) => {
		const d = new Date(t);
		return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()) === day;
	});
}
function mixCfAt(s, t) {
	if (t == null) return "cf: -";
	if (s.mix) {
		const { cf } = mixAt(s.mix, s.mixCf, t);
		return `cf=${cf.toPrecision(4)}`;
	}
	if (s.price) {
		let ip = 0;
		for (let k = 0; k < s.price.T.length; k++) if (s.price.T[k] <= t) ip = k;
		return `${s.price.kwh[ip].toFixed(3)} EUR/kWh`;
	}
	return "cf: -";
}
function sheetToAoA(wb, name) {
	const sheet = wb.Sheets[name];
	if (!sheet) return [];
	return utils.sheet_to_json(sheet, {
		header: 1,
		defval: null,
		raw: true
	});
}
function readWorkbook(buf) {
	return readSync(buf, {
		type: "array",
		cellDates: true
	});
}
function cleanLabel(a, b, c) {
	const parts = [
		a,
		b,
		c
	].map(asText).filter((s) => s && s[0] !== ".");
	return parts.length ? parts.join(" - ") : "(unnamed)";
}
function parseDatabase(wb, fileName) {
	const sheets = wb.SheetNames;
	if (!sheets.length) throw new Error("Empty workbook.");
	const raw = sheetToAoA(wb, sheets[0]).map((row) => row.map((c) => {
		if (c == null) return null;
		if (typeof c === "number" && Number.isFinite(c)) return c;
		if (typeof c === "string") return c;
		if (c instanceof Date) return c.toISOString();
		return asText(c) || null;
	}));
	const nR = raw.length;
	const nC = raw.reduce((m, r) => Math.max(m, r.length), 0);
	if (nR < 4) throw new Error("Unexpected coefficient-database format.");
	const dataRows = [];
	for (let r = 3; r < nR; r++) dataRows.push(r);
	const sample = dataRows.slice(0, Math.min(dataRows.length, 400));
	const coefCols = [];
	for (let c = 6; c < nC; c++) {
		let cnt = 0;
		for (const r of sample) if (isNum(raw[r]?.[c])) cnt++;
		if (cnt > .5 * sample.length) coefCols.push(c);
	}
	if (!coefCols.length) throw new Error("No indicator column found.");
	const colLabels = coefCols.map((c) => cleanLabel(raw[0]?.[c], raw[1]?.[c], raw[2]?.[c]));
	const procNames = [];
	const procUnits = [];
	const procRow = [];
	const colUnit = 4;
	const colName = 5;
	for (const r of dataRows) {
		const nm = asText(raw[r]?.[colName]);
		if (!nm) continue;
		let anyNum = false;
		for (const c of coefCols) if (isNum(raw[r]?.[c])) {
			anyNum = true;
			break;
		}
		if (!anyNum) continue;
		procNames.push(nm);
		procUnits.push(asText(raw[r]?.[colUnit]));
		procRow.push(r);
	}
	if (!procNames.length) throw new Error("No valid process found in the database.");
	let cedCol = -1;
	const cedNRCols = [];
	const cedRCols = [];
	for (let c = 0; c < colLabels.length; c++) if (colLabels[c].trim().toUpperCase().startsWith("CED")) {
		cedCol = c;
		break;
	}
	if (cedCol >= 0) {
		const c0 = coefCols[cedCol];
		colLabels.forEach((lab, i) => {
			const c = coefCols[i];
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
		fileName
	};
}
function parseRT(wb, fileName) {
	const sheets = wb.SheetNames;
	let sheet = sheets[sheets.length - 1];
	for (const s of sheets) if (s.toLowerCase() === "data1") {
		sheet = s;
		break;
	}
	const raw = sheetToAoA(wb, sheet);
	const nR = raw.length;
	const nC = raw.reduce((m, r) => Math.max(m, r.length), 0);
	let unitsRow = -1;
	outer: for (let r = 0; r < Math.min(nR, 8); r++) for (let c = 0; c < nC; c++) {
		const u = asText(raw[r]?.[c]);
		if (u.toLowerCase() === "s" || !Number.isNaN(energyToMJ(u))) {
			unitsRow = r;
			break outer;
		}
	}
	if (unitsRow < 0) throw new Error("Units row not found (energy units expected in row 2).");
	const nameRow = Math.max(unitsRow - 1, 0);
	let timeCol = -1;
	const eCols = [];
	const eUnits = [];
	const eNames = [];
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
	const t = [];
	const data = [];
	for (let r = unitsRow + 1; r < nR; r++) {
		let tvv;
		if (timeCol >= 0) {
			tvv = toNum(raw[r]?.[timeCol]);
			if (!Number.isFinite(tvv)) break;
		} else tvv = t.length;
		const row = [];
		let ok = true;
		for (let i = 0; i < eCols.length; i++) {
			const x = toNum(raw[r]?.[eCols[i]]);
			if (!Number.isFinite(x)) {
				ok = false;
				break;
			}
			row.push(x);
		}
		if (!ok) break;
		t.push(tvv);
		data.push(row);
	}
	if (!t.length) throw new Error("No valid numeric data row in the real-time file.");
	return {
		t,
		data,
		names: eNames,
		units: eUnits,
		fileName
	};
}
function parseTerna(wb, fileName) {
	const raw = sheetToAoA(wb, wb.SheetNames[0]);
	const srcNames = [];
	const dn = [];
	const vv = [];
	const si = [];
	for (let r = 1; r < raw.length; r++) {
		const d = toMs(raw[r]?.[0]);
		const v = toNum(raw[r]?.[1]);
		const src = asText(raw[r]?.[2]);
		if (!Number.isFinite(d) || !Number.isFinite(v) || !src) continue;
		let q = srcNames.indexOf(src);
		if (q < 0) {
			srcNames.push(src);
			q = srcNames.length - 1;
		}
		dn.push(d);
		vv.push(v);
		si.push(q);
	}
	if (!dn.length) throw new Error("No valid rows in the Terna file.");
	const T = Array.from(new Set(dn)).sort((a, b) => a - b);
	const nS = srcNames.length;
	const Gen = T.map(() => Array(nS).fill(0));
	const index = new Map(T.map((x, i) => [x, i]));
	for (let k = 0; k < dn.length; k++) {
		const ti = index.get(dn[k]);
		Gen[ti][si[k]] = vv[k];
	}
	return {
		T,
		src: srcNames,
		gen: Gen,
		fileName
	};
}
function parsePrices(wb, fileName, zone = "IT-South") {
	const raw = sheetToAoA(wb, wb.SheetNames[0]);
	const hdr = raw[1] ?? raw[0] ?? [];
	let col = -1;
	let zoneName = zone;
	for (let c = 0; c < hdr.length; c++) {
		const h = asText(hdr[c]);
		if (h.toLowerCase().includes("prezzo") && h.includes(zone)) {
			col = c;
			break;
		}
	}
	if (col < 0) for (let c = 0; c < hdr.length; c++) {
		const h = asText(hdr[c]);
		if (h.toLowerCase().includes("prezzo") || h.toLowerCase().includes("price")) {
			col = c;
			zoneName = h || zone;
			break;
		}
	}
	if (col < 0) throw new Error("No price column found in the file.");
	const T = [];
	const kwh = [];
	const startRow = raw.length > 3 ? 3 : 1;
	for (let r = startRow; r < raw.length; r++) {
		const d = toMs(raw[r]?.[0]);
		const v = toNum(raw[r]?.[col]);
		if (Number.isFinite(d) && Number.isFinite(v)) {
			T.push(d);
			kwh.push(v / 1e3);
		}
	}
	if (!T.length) throw new Error("No valid price rows in the file.");
	return {
		T,
		kwh,
		zone: zoneName,
		fileName
	};
}
async function readFileAsWorkbook(file) {
	return readWorkbook(await file.arrayBuffer());
}
function cn(...inputs) {
	return twMerge(clsx(inputs));
}
var buttonVariants = cva("inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-sm text-sm font-medium transition-colors duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/35 disabled:pointer-events-none disabled:opacity-45 active:scale-[0.98]", {
	variants: {
		variant: {
			default: "bg-primary text-primary-fg hover:bg-primary/90",
			secondary: "bg-surface-2 text-fg shadow-[var(--shadow-border)] hover:bg-border/50",
			outline: "border border-border bg-surface text-fg hover:bg-surface-2",
			ghost: "text-fg hover:bg-surface-2",
			go: "bg-go text-go-fg hover:bg-go/90",
			stop: "bg-stop text-stop-fg hover:bg-stop/90",
			danger: "bg-stop/10 text-stop hover:bg-stop/15"
		},
		size: {
			default: "h-10 min-h-10 px-3.5",
			sm: "h-8 min-h-8 px-2.5 text-xs",
			lg: "h-11 min-h-11 px-4",
			icon: "size-10"
		}
	},
	defaultVariants: {
		variant: "default",
		size: "default"
	}
});
function Button({ className, variant, size, asChild = false, ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(asChild ? Slot : "button", {
		className: cn(buttonVariants({
			variant,
			size
		}), className),
		...props
	});
}
function Input({ className, ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
		className: cn("h-10 w-full rounded-sm border border-border bg-surface px-3 text-sm text-fg outline-none transition-shadow duration-150 placeholder:text-subtle focus-visible:ring-2 focus-visible:ring-primary/30", className),
		...props
	});
}
function NativeSelect({ className, children, ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("select", {
		className: cn("h-10 w-full rounded-sm border border-border bg-surface px-2 text-sm text-fg outline-none focus-visible:ring-2 focus-visible:ring-primary/30", className),
		...props,
		children
	});
}
function Field({ label, children, className }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
		className: cn("flex min-w-0 flex-col gap-1", className),
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "text-xs font-medium text-muted",
			children: label
		}), children]
	});
}
function Workflow() {
	const step = useRtlca((s) => s.step);
	const maxStep = useRtlca((s) => s.maxStep);
	const goto = useRtlca((s) => s.gotoStep);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("aside", {
		className: "flex w-full flex-col gap-1.5 lg:w-[340px] lg:shrink-0",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
			className: "px-1 text-[11px] font-semibold uppercase tracking-wider text-primary",
			children: [
				"Guided workflow · Step ",
				step,
				" of 6 — ",
				STEP_NAMES[step - 1]
			]
		}), STEP_NAMES.map((name, i) => {
			const k = i + 1;
			const active = step === k;
			const reached = k <= maxStep;
			return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "overflow-hidden rounded-md bg-surface shadow-[var(--shadow-border)]",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
					type: "button",
					onClick: () => goto(k, true),
					className: cn("flex h-11 w-full items-center px-3 text-left text-sm font-semibold", active && "bg-primary text-primary-fg", !active && reached && "bg-done text-done-fg", !active && !reached && "bg-surface-2 text-subtle"),
					children: [
						active ? "> " : "  ",
						"Step ",
						k,
						" — ",
						name,
						!active && reached ? "  (done)" : ""
					]
				}), active && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "p-3",
					children: [
						k === 1 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Step1, {}),
						k === 2 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Step2, {}),
						k === 3 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Step3, {}),
						k === 4 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Step4, {}),
						k === 5 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Step5, {}),
						k === 6 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Step6, {})
					]
				})]
			}, name);
		})]
	});
}
function FileBtn({ label, onBuf }) {
	const ref = (0, import_react.useRef)(null);
	const setAlert = useRtlca((s) => s.setAlert);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
		ref,
		type: "file",
		accept: ".xlsx,.xls,.csv",
		className: "hidden",
		onChange: async (e) => {
			const f = e.target.files?.[0];
			e.target.value = "";
			if (!f) return;
			try {
				onBuf(await readFileAsWorkbook(f), f.name);
			} catch (err) {
				setAlert({
					title: "File",
					message: err instanceof Error ? err.message : String(err),
					kind: "error"
				});
			}
		}
	}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
		variant: "secondary",
		size: "sm",
		onClick: () => ref.current?.click(),
		children: label
	})] });
}
function Step1() {
	const loadDemo = useRtlca((s) => s.loadDemoDb);
	const loadDb = useRtlca((s) => s.loadDb);
	const sample = useRtlca((s) => s.loadSampleCampaign);
	const loaded = useRtlca((s) => s.loaded);
	const db = useRtlca((s) => s.db);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-3",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-xs leading-relaxed text-muted",
				children: "Coefficient database (Idemat-style): processes × impact categories. A demo dataset is included so you can run the full campaign without files."
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
				className: "w-full",
				onClick: sample,
				children: "Open sample campaign"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex gap-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					variant: "secondary",
					className: "flex-1",
					onClick: loadDemo,
					children: "Load demo database"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(FileBtn, {
					label: "Your file",
					onBuf: (wb, name) => loadDb(parseDatabase(wb, name))
				})]
			}),
			loaded && db && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "text-xs text-muted",
				children: [
					db.fileName,
					": ",
					db.procNames.length,
					" processes, ",
					db.colLabels.length,
					" indicators."
				]
			})
		]
	});
}
function Step2() {
	const db = useRtlca((s) => s.db);
	const impactCat = useRtlca((s) => s.impactCat);
	const procs = useRtlca((s) => s.procs);
	const inputs = useRtlca((s) => s.inputs);
	const addProc = useRtlca((s) => s.addProc);
	const delProc = useRtlca((s) => s.delProc);
	const procsNext = useRtlca((s) => s.procsNext);
	const [name, setName] = (0, import_react.useState)("");
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-3",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
				label: "Impact category (whole study)",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(NativeSelect, {
					value: impactCat,
					disabled: inputs.length > 0,
					onChange: (e) => useRtlca.setState({ impactCat: Number(e.target.value) }),
					children: (db?.colLabels ?? ["(load the database)"]).map((lab, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
						value: i,
						children: lab
					}, lab))
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center gap-2",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						variant: "go",
						size: "icon",
						"aria-label": "Add unit process",
						onClick: () => {
							addProc(name || `Process_${procs.length + 1}`);
							setName("");
						},
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { className: "size-4" })
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						variant: "secondary",
						size: "icon",
						"aria-label": "Remove last process",
						onClick: delProc,
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Minus, { className: "size-4" })
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
						placeholder: "Process name",
						value: name,
						onChange: (e) => setName(e.target.value),
						onKeyDown: (e) => {
							if (e.key === "Enter") {
								addProc(name || `Process_${procs.length + 1}`);
								setName("");
							}
						}
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-xs italic text-muted",
				children: procs.length ? procs.join("  >  ") : "(no processes yet: press +)"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
				className: "w-full",
				onClick: procsNext,
				children: "Next"
			})
		]
	});
}
function Step3() {
	const db = useRtlca((s) => s.db);
	const procs = useRtlca((s) => s.procs);
	const inputs = useRtlca((s) => s.inputs);
	const draft = useRtlca((s) => s.draft);
	const setDraft = useRtlca((s) => s.setDraft);
	const addFlow = useRtlca((s) => s.addFlow);
	const removeFlow = useRtlca((s) => s.removeFlow);
	const endFlows = useRtlca((s) => s.endFlows);
	const selectedFlow = useRtlca((s) => s.selectedFlow);
	const filtered = db ? filteredDb(db, draft) : {
		capped: [],
		nAll: 0,
		idx: []
	};
	const showQty = draft.dataType === "static" || draft.dataType === "quasi-static";
	const showLaw = draft.dataType === "dynamic";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-2.5",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "grid grid-cols-[1fr_auto] gap-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
					label: "Process",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(NativeSelect, {
						value: draft.selectedProc,
						onChange: (e) => setDraft({ selectedProc: Number(e.target.value) }),
						children: procs.map((p, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
							value: i,
							children: p
						}, p))
					})
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "flex items-end gap-1 pb-0.5",
					children: ["Input", "Output"].map((d) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Chip, {
						on: draft.dir === d,
						onClick: () => setDraft({ dir: d }),
						children: d === "Input" ? "In" : "Out"
					}, d))
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "flex flex-wrap gap-1",
				children: [
					"static",
					"quasi-static",
					"dynamic",
					"real-time"
				].map((d) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Chip, {
					on: draft.dataType === d,
					onClick: () => setDraft({ dataType: d }),
					children: d
				}, d))
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex gap-1",
				children: [["Matter", "Energy"].map((t) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Chip, {
					on: draft.tipo === t,
					onClick: () => setDraft({ tipo: t }),
					children: t
				}, t)), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "self-center text-xs italic text-muted",
					children: draft.dataType === "dynamic" ? "(law below)" : draft.dataType === "real-time" ? "(from source)" : ""
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
				label: "Filter",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
					value: draft.kw,
					onChange: (e) => setDraft({
						kw: e.target.value,
						selectedDb: 0
					}),
					placeholder: "type to search the dataset"
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
				label: "Dataset process",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(NativeSelect, {
					value: draft.selectedDb,
					onChange: (e) => setDraft({ selectedDb: Number(e.target.value) }),
					children: [filtered.capped.length === 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
						value: 0,
						children: "(no result: change the filter)"
					}), filtered.capped.map((ip, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("option", {
						value: i,
						children: [
							db?.procNames[ip],
							" [",
							db?.procUnits[ip],
							" | row ",
							db?.procRow[ip],
							"]"
						]
					}, ip))]
				})
			}),
			filtered.nAll > 250 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "text-[11px] text-muted",
				children: [filtered.nAll, " matches, showing 250 — type a filter word."]
			}),
			showQty && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
				label: `Quantity (${db?.procUnits[filtered.capped[draft.selectedDb] ?? 0] ?? "unit"})`,
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
					type: "number",
					value: draft.qty,
					onChange: (e) => setDraft({ qty: Number(e.target.value) })
				})
			}),
			showLaw && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "space-y-2 rounded-sm bg-surface-2 p-2",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-xs font-semibold",
						children: "Variation law v(t) — never constant"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(NativeSelect, {
						value: draft.lawKind,
						onChange: (e) => setDraft({ lawKind: e.target.value }),
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
								value: "linear",
								children: "Linear: a + b*t"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
								value: "sinusoidal",
								children: "Sinusoidal: a + b*sin(w*t)"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
								value: "exponential",
								children: "Exponential: a*exp(b*t)"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
								value: "custom",
								children: "Custom: f(t)"
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "grid grid-cols-3 gap-2",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
								label: "a",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
									type: "number",
									value: draft.lawA,
									onChange: (e) => setDraft({ lawA: Number(e.target.value) })
								})
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
								label: "b",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
									type: "number",
									value: draft.lawB,
									onChange: (e) => setDraft({ lawB: Number(e.target.value) })
								})
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
								label: "w",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
									type: "number",
									value: draft.lawW,
									onChange: (e) => setDraft({ lawW: Number(e.target.value) })
								})
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
						label: "f(t)",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
							value: draft.lawExpr,
							disabled: draft.lawKind !== "custom",
							onChange: (e) => setDraft({ lawExpr: e.target.value })
						})
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex gap-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					variant: "secondary",
					className: "flex-1",
					onClick: addFlow,
					children: "Add flow"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					variant: "outline",
					className: "flex-1",
					onClick: () => removeFlow(),
					children: "Remove"
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("ul", {
				className: "max-h-36 overflow-auto rounded-sm bg-surface-2 p-1 text-[11px] leading-5",
				children: [inputs.length === 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", {
					className: "px-2 py-1 text-muted",
					children: "(no flows yet)"
				}), inputs.map((f, i) => {
					const q = f.dataType === "dynamic" ? `v(t)=${trunc(f.lawTxt, 12)}` : f.qty == null || Number.isNaN(f.qty) ? "from source" : `${f.qty} ${f.unit}`;
					return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						type: "button",
						onClick: () => useRtlca.setState({ selectedFlow: i }),
						className: cn("w-full rounded-sm px-2 py-1 text-left", selectedFlow === i ? "bg-primary/10 text-primary" : "hover:bg-border/40"),
						children: [
							"#",
							i + 1,
							" [",
							trunc(procs[f.proc] ?? "", 8),
							"|",
							f.dir.slice(0, 2),
							"] ",
							trunc(f.nome, 16),
							" | ",
							f.dataType,
							" | ",
							q
						]
					}) }, f.id);
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
				className: "w-full",
				onClick: endFlows,
				children: "Finish flows"
			})
		]
	});
}
function Chip({ on, onClick, children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
		type: "button",
		onClick,
		className: cn("h-8 rounded-full px-3 text-xs font-medium", on ? "bg-primary text-primary-fg" : "bg-surface-2 text-muted hover:text-fg"),
		children
	});
}
function Step4() {
	const setCostOpen = useRtlca((s) => s.setCostOpen);
	const costsNext = useRtlca((s) => s.costsNext);
	const costsSet = useRtlca((s) => s.costsSet);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-3",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-xs text-muted",
				children: "Hourly capital and operating items per process, plus flow unit prices. Skip to run impact only."
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex gap-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					variant: "secondary",
					className: "flex-1",
					onClick: () => setCostOpen(true),
					children: "Enter costs"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					className: "flex-1",
					onClick: costsNext,
					children: "Next"
				})]
			}),
			costsSet && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-xs text-done-fg",
				children: "Costs saved."
			})
		]
	});
}
function Step5() {
	const rt = useRtlca((s) => s.rt);
	useRtlca((s) => s.mix);
	const price = useRtlca((s) => s.price);
	const clockTime = useRtlca((s) => s.clockTime);
	const loadDemoRT = useRtlca((s) => s.loadDemoRT);
	const loadRT = useRtlca((s) => s.loadRT);
	const loadDemoMix = useRtlca((s) => s.loadDemoMix);
	const loadMix = useRtlca((s) => s.loadMix);
	const loadDemoPrice = useRtlca((s) => s.loadDemoPrice);
	const loadPrice = useRtlca((s) => s.loadPrice);
	const setClock = useRtlca((s) => s.setClock);
	const confirm = useRtlca((s) => s.confirm);
	const s = useRtlca.getState();
	const days = clockDays(s);
	const day = clockTime ? Date.UTC(new Date(clockTime).getUTCFullYear(), new Date(clockTime).getUTCMonth(), new Date(clockTime).getUTCDate()) : days[0];
	const times = day != null ? clockTimes(s, day) : [];
	const cfLbl = mixCfAt(s, clockTime);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-3",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-xs font-semibold text-fg",
				children: "A. Acquisition file"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex flex-wrap gap-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					variant: "secondary",
					size: "sm",
					onClick: loadDemoRT,
					children: "Load demo RT"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(FileBtn, {
					label: "Your RT",
					onBuf: (wb, name) => loadRT(parseRT(wb, name))
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-[11px] italic text-muted",
				children: rt ? `${rt.t.length} rows, ${rt.names.length} channels — ${rt.fileName}` : "no file loaded yet"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-xs font-semibold text-fg",
				children: "B. Italian grid mix (Terna) and clock"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex flex-wrap gap-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					variant: "secondary",
					size: "sm",
					onClick: loadDemoMix,
					children: "Load demo mix"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(FileBtn, {
					label: "Your mix",
					onBuf: (wb, name) => loadMix(parseTerna(wb, name))
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "grid grid-cols-2 gap-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
					label: "Day",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(NativeSelect, {
						value: day ?? "",
						onChange: (e) => {
							const d = Number(e.target.value);
							const tt = clockTimes(useRtlca.getState(), d);
							setClock(tt[0] ?? d);
						},
						children: [days.length === 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", { children: "(load mix)" }), days.map((d) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
							value: d,
							children: fmtDay(d)
						}, d))]
					})
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
					label: "Time",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(NativeSelect, {
						value: clockTime ?? "",
						onChange: (e) => setClock(Number(e.target.value)),
						children: [times.length === 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", { children: "--:--" }), times.map((t) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
							value: t,
							children: fmtClock(t)
						}, t))]
					})
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-xs font-semibold text-primary",
				children: cfLbl
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-xs font-semibold text-fg",
				children: "C. Energy price (optional, 15 min)"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex flex-wrap gap-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					variant: "secondary",
					size: "sm",
					onClick: loadDemoPrice,
					children: "Load demo price"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(FileBtn, {
					label: "Your price",
					onBuf: (wb, name) => loadPrice(parsePrices(wb, name))
				})]
			}),
			price && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "text-[11px] italic text-muted",
				children: [
					price.zone,
					": ",
					price.T.length,
					" intervals"
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
				className: "w-full",
				onClick: confirm,
				children: "Confirm"
			})
		]
	});
}
function Step6() {
	const campaign = useRtlca((s) => s.campaign);
	const setCampaign = useRtlca((s) => s.setCampaign);
	const expN = useRtlca((s) => s.expN);
	const staticLca = useRtlca((s) => s.staticLca);
	const setStaticLca = useRtlca((s) => s.setStaticLca);
	const soglia = useRtlca((s) => s.soglia);
	const setSoglia = useRtlca((s) => s.setSoglia);
	const speed = useRtlca((s) => s.speed);
	const setSpeed = useRtlca((s) => s.setSpeed);
	const start = useRtlca((s) => s.start);
	const stop = useRtlca((s) => s.stop);
	const newCycle = useRtlca((s) => s.newCycle);
	const save = useRtlca((s) => s.saveResults);
	const running = useRtlca((s) => s.running);
	const configDone = useRtlca((s) => s.configDone);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-3",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-end gap-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
					label: "Campaign",
					className: "flex-1",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
						value: campaign,
						onChange: (e) => setCampaign(e.target.value)
					})
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
					className: "mb-2 text-sm font-semibold text-primary",
					children: ["Cycle ", expN]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "grid grid-cols-2 gap-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
					label: "Static LCA (0 = off)",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
						type: "number",
						value: staticLca,
						onChange: (e) => setStaticLca(Number(e.target.value))
					})
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
					label: "Hotspot threshold",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
						type: "number",
						value: soglia,
						onChange: (e) => setSoglia(Number(e.target.value))
					})
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
				label: "Playback",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(NativeSelect, {
					value: String(speed),
					onChange: (e) => setSpeed(e.target.value === "max" ? "max" : Number(e.target.value)),
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
							value: "1",
							children: "1×"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
							value: "2",
							children: "2×"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
							value: "4",
							children: "4×"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
							value: "8",
							children: "8×"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
							value: "max",
							children: "Max"
						})
					]
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "grid grid-cols-3 gap-2",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						variant: "go",
						disabled: !configDone || running,
						onClick: start,
						children: "Start"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						variant: "stop",
						disabled: !running,
						onClick: stop,
						children: "Stop"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						variant: "secondary",
						disabled: running,
						onClick: newCycle,
						children: "New"
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
				variant: "outline",
				className: "w-full",
				onClick: save,
				children: "Save results (Excel + JSON)"
			})
		]
	});
}
function ProcessMap() {
	const procs = useRtlca((s) => s.procs);
	const inputs = useRtlca((s) => s.inputs);
	const live = useRtlca((s) => s.live);
	const setProcOpen = useRtlca((s) => s.setProcOpen);
	const nP = procs.length;
	if (!nP) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "flex h-full min-h-64 items-center justify-center text-sm text-muted",
		children: "Add unit processes in Step 2 to see the system map."
	});
	const width = Math.max(640, nP * 220 + 80);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "h-full min-h-64 overflow-x-auto",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("svg", {
			viewBox: `0 0 ${width} 340`,
			className: "h-full min-h-64 w-full min-w-[640px]",
			role: "img",
			"aria-label": "Unit process map",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("text", {
				x: 16,
				y: 22,
				className: "fill-muted",
				fontSize: "11",
				children: "Unit processes (flow order) — click a block to inspect. RT blue, static grey, quasi-static dashed, dynamic dash-dot."
			}), procs.map((name, p) => {
				const x = 50 + p * 220;
				const y = 150;
				const w = 168;
				const h = 78;
				const alarm = live?.alarmProcs[p];
				const ins = inputs.map((f, i) => ({
					f,
					i
				})).filter((x) => x.f.proc === p && x.f.dir === "Input");
				const outs = inputs.map((f, i) => ({
					f,
					i
				})).filter((x) => x.f.proc === p && x.f.dir === "Output");
				const imp = live ? live.procImp[p] : null;
				return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("g", { children: [
					ins.map((it, k) => {
						const fx = x + 20 + k * 128 / Math.max(ins.length, 1);
						const st = flowStyle(it.f.dataType);
						return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("g", {
							onClick: () => setProcOpen(p),
							className: "cursor-pointer",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("line", {
									x1: fx,
									y1: 48,
									x2: fx,
									y2: y,
									stroke: st.color,
									strokeWidth: st.width,
									strokeDasharray: st.dash || void 0
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("polygon", {
									points: `${fx},${y} ${fx - 5},140 ${fx + 5},140`,
									fill: st.color
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("text", {
									x: fx + 6,
									y: 58,
									fontSize: "10",
									fill: st.color,
									transform: `rotate(-55 ${fx + 6} 58)`,
									children: flowLabel(it.f)
								})
							]
						}, it.i);
					}),
					outs.map((it, k) => {
						const fx = x + 20 + k * 128 / Math.max(outs.length, 1);
						const st = flowStyle(it.f.dataType);
						return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("g", {
							onClick: () => setProcOpen(p),
							className: "cursor-pointer",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("line", {
									x1: fx,
									y1: 228,
									x2: fx,
									y2: 270,
									stroke: st.color,
									strokeWidth: st.width,
									strokeDasharray: st.dash || void 0
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("polygon", {
									points: `${fx},276 ${fx - 5},266 ${fx + 5},266`,
									fill: st.color
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("text", {
									x: fx + 6,
									y: 290,
									fontSize: "10",
									fill: st.color,
									transform: `rotate(55 ${fx + 6} 290)`,
									children: flowLabel(it.f)
								})
							]
						}, it.i);
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("g", {
						onClick: () => setProcOpen(p),
						className: "cursor-pointer",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("rect", {
								x,
								y,
								width: w,
								height: h,
								rx: 10,
								fill: "var(--color-surface)",
								stroke: alarm ? "var(--color-stop)" : chartColor(p),
								strokeWidth: alarm ? 3 : 2
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("text", {
								x: x + w / 2,
								y: 178,
								textAnchor: "middle",
								fontSize: "13",
								fontWeight: "600",
								fill: "var(--color-fg)",
								children: name
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("text", {
								x: x + w / 2,
								y: 202,
								textAnchor: "middle",
								fontSize: "12",
								fontWeight: "600",
								fill: "var(--color-kpi-2)",
								children: ["impact: ", imp == null ? "—" : fmt(imp, 4)]
							})
						]
					}),
					p < nP - 1 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("g", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("line", {
						x1: x + w,
						y1: 189,
						x2: x + 220 - 8,
						y2: 189,
						stroke: "var(--color-fg)",
						strokeWidth: 2
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("polygon", {
						points: `${x + 220},189 ${x + 220 - 10},184 ${x + 220 - 10},194`,
						fill: "var(--color-fg)"
					})] })
				] }, p);
			})]
		})
	});
}
function Gauge({ title, values, names, max, readout }) {
	const rng = max > 0 ? max : 1;
	const ticks = [
		0,
		.25,
		.5,
		.75,
		1
	];
	const segs = [
		{
			a0: 0,
			a1: .5,
			c: "var(--color-go)"
		},
		{
			a0: .5,
			a1: .8,
			c: "var(--color-warn)"
		},
		{
			a0: .8,
			a1: 1,
			c: "var(--color-stop)"
		}
	];
	const arc = (t0, t1, r) => {
		const a0 = Math.PI * (1 - t0);
		const a1 = Math.PI * (1 - t1);
		const x0 = 80 + r * Math.cos(a0);
		const y0 = 88 - r * Math.sin(a0);
		const x1 = 80 + r * Math.cos(a1);
		const y1 = 88 - r * Math.sin(a1);
		return `M ${x0} ${y0} A ${r} ${r} 0 ${t1 - t0 > .5 ? 1 : 0} 1 ${x1} ${y1}`;
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex min-h-0 flex-col",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-center font-mono text-2xl font-medium tabular-nums text-kpi-2",
				children: readout
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("svg", {
				viewBox: "0 0 160 132",
				className: "mx-auto h-48 w-full max-w-xs",
				children: [
					segs.map((s) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
						d: arc(s.a0, s.a1, 62),
						fill: "none",
						stroke: s.c,
						strokeWidth: "7",
						strokeLinecap: "butt"
					}, s.a0)),
					ticks.map((t) => {
						const a = Math.PI * (1 - t);
						const x0 = 80 + 54 * Math.cos(a);
						const y0 = 88 - 54 * Math.sin(a);
						const x1 = 80 + 66 * Math.cos(a);
						const y1 = 88 - 66 * Math.sin(a);
						const lx = 80 + 74 * Math.cos(a);
						const ly = 88 - 74 * Math.sin(a);
						return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("g", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("line", {
							x1: x0,
							y1: y0,
							x2: x1,
							y2: y1,
							stroke: "var(--color-fg)",
							strokeWidth: "1"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("text", {
							x: lx,
							y: ly + 3,
							textAnchor: "middle",
							fontSize: "8",
							fill: "var(--color-muted)",
							children: fmt(t * rng, 3)
						})] }, t);
					}),
					values.map((v, i) => {
						const f = Math.max(0, Math.min(1, v / rng));
						const a = Math.PI * (1 - f);
						const L = Math.max(28, 54 - 10 * i);
						const x = 80 + L * Math.cos(a);
						const y = 88 - L * Math.sin(a);
						const c = chartColor(i);
						return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("g", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("line", {
							x1: 80,
							y1: 88,
							x2: x,
							y2: y,
							stroke: c,
							strokeWidth: "3.5"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", {
							cx: x,
							cy: y,
							r: "3.5",
							fill: c
						})] }, i);
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", {
						cx: 80,
						cy: 88,
						r: "3.5",
						fill: "var(--color-fg)"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("text", {
						x: 80,
						y: 124,
						textAnchor: "middle",
						fontSize: "10",
						fill: "var(--color-muted)",
						children: title
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
				className: "space-y-0.5 px-3 text-xs",
				children: names.map((n, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
					className: "flex justify-between gap-2 font-mono tabular-nums",
					style: { color: chartColor(i) },
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "truncate",
						children: trunc(n, 18)
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: fmt(values[i] ?? 0, 4) })]
				}, i))
			})
		]
	});
}
var tip = { contentStyle: {
	background: "var(--color-surface)",
	border: "1px solid var(--color-border)",
	borderRadius: 8,
	fontSize: 12
} };
function ResultTabs() {
	const tab = useRtlca((s) => s.tab);
	const setTab = useRtlca((s) => s.setTab);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex min-h-0 min-w-0 flex-1 flex-col",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "flex gap-1 overflow-x-auto px-1",
			children: TAB_NAMES.map((name, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				onClick: () => setTab(i),
				className: cn("h-10 min-h-10 shrink-0 rounded-t-md px-4 text-xs font-semibold tracking-wide", i === tab ? "bg-surface text-primary shadow-[var(--shadow-border)]" : "bg-transparent text-muted hover:text-fg"),
				children: name
			}, name))
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "min-h-0 flex-1 overflow-auto rounded-b-lg rounded-tr-lg bg-surface p-3 shadow-[var(--shadow-border)] md:p-4",
			children: [
				tab === 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MapTab, {}),
				tab === 1 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ImpactTab, {}),
				tab === 2 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EnergyTab, {}),
				tab === 3 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ParetoTab, {}),
				tab === 4 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LccTab, {}),
				tab === 5 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CedTab, {})
			]
		})]
	});
}
function MapTab() {
	const log = useRtlca((s) => s.log);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "grid h-full min-h-[520px] grid-rows-[minmax(240px,1fr)_220px] gap-3",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ProcessMap, {}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("pre", {
			className: "overflow-auto rounded-md bg-header p-3 font-mono text-[11px] leading-relaxed text-header-fg",
			children: log.join("\n")
		})]
	});
}
function ImpactTab() {
	const live = useRtlca((s) => s.live);
	const soglia = useRtlca((s) => s.soglia);
	const staticLca = useRtlca((s) => s.staticLca);
	const series = live?.series ?? [];
	const inst = series.map((p) => ({
		t: p.t,
		inst: p.inst,
		hot: p.hot ? p.inst : null,
		thr: soglia || null
	}));
	const cum = series.map((p) => ({
		t: p.t,
		cum: p.cum,
		stat: staticLca || null
	}));
	const nRt = live?.rtNames.length ?? 0;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "grid gap-4 lg:grid-cols-2",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { children: nRt > 0 && live ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Gauge, {
				title: "RT cumulative impact",
				values: live.gaugeCum,
				names: live.rtNames,
				max: live.gaugeMaxCum,
				readout: fmt(live.gaugeCum.reduce((a, b) => a + b, 0), 5)
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EmptyChart, { label: "Cumulative RT impact" }) }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { children: nRt > 0 && live ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Gauge, {
				title: "RT instantaneous impact",
				values: live.gaugeInst,
				names: live.rtNames,
				max: live.gaugeMaxInst,
				readout: fmt(live.gaugeInst.reduce((a, b) => a + b, 0), 5)
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EmptyChart, { label: "Instantaneous RT impact" }) }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChartCard, {
				title: "Instantaneous impact + threshold",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ResponsiveContainer, {
					width: "100%",
					height: 240,
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(LineChart, {
						data: inst,
						margin: {
							top: 8,
							right: 12,
							left: 0,
							bottom: 0
						},
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CartesianGrid, {
								stroke: "var(--color-border)",
								strokeDasharray: "3 3"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(XAxis, {
								dataKey: "t",
								tick: { fontSize: 11 }
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(YAxis, { tick: { fontSize: 11 } }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Tooltip, { ...tip }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Line, {
								type: "monotone",
								dataKey: "inst",
								name: "TOTAL",
								stroke: "var(--color-fg)",
								dot: false,
								strokeWidth: 2
							}),
							soglia > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Line, {
								type: "monotone",
								dataKey: "thr",
								name: "threshold",
								stroke: "var(--color-stop)",
								dot: false,
								strokeDasharray: "4 4"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Line, {
								type: "monotone",
								dataKey: "hot",
								name: "hotspot",
								stroke: "var(--color-stop)",
								dot: { r: 3 },
								strokeWidth: 0
							})
						]
					})
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChartCard, {
				title: "Cumulative impact vs static LCA",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ResponsiveContainer, {
					width: "100%",
					height: 240,
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(LineChart, {
						data: cum,
						margin: {
							top: 8,
							right: 12,
							left: 0,
							bottom: 0
						},
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CartesianGrid, {
								stroke: "var(--color-border)",
								strokeDasharray: "3 3"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(XAxis, {
								dataKey: "t",
								tick: { fontSize: 11 }
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(YAxis, { tick: { fontSize: 11 } }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Tooltip, { ...tip }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Line, {
								type: "monotone",
								dataKey: "cum",
								name: "RT-LCA",
								stroke: "var(--color-kpi-2)",
								dot: false,
								strokeWidth: 2
							}),
							staticLca > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Line, {
								type: "monotone",
								dataKey: "stat",
								name: "static LCA",
								stroke: "var(--color-muted)",
								dot: false
							})
						]
					})
				})
			})
		]
	});
}
function EnergyTab() {
	const live = useRtlca((s) => s.live);
	const inputs = useRtlca((s) => s.inputs);
	const mix = useRtlca((s) => s.mix);
	const valData = (live?.valHistory ?? []).map((h) => {
		const row = { tg: h.tg };
		h.vals.forEach((v, i) => {
			row[`f${i}`] = v;
		});
		return row;
	});
	const eIns = (live?.series ?? []).map((p) => {
		const row = { t: p.t };
		p.eIns.forEach((v, i) => {
			row[`e${i}`] = v;
		});
		return row;
	});
	const lastShare = live?.mixShare ?? [];
	const mixData = (mix?.src ?? []).map((src, i) => ({
		name: trunc(src, 10),
		share: (lastShare[i] ?? 0) * 100
	}));
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "grid gap-4",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChartCard, {
			title: "Values instant by instant (cycles are appended)",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ResponsiveContainer, {
				width: "100%",
				height: 260,
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(LineChart, {
					data: valData,
					margin: {
						top: 8,
						right: 12,
						left: 0,
						bottom: 0
					},
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CartesianGrid, {
							stroke: "var(--color-border)",
							strokeDasharray: "3 3"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(XAxis, {
							dataKey: "tg",
							tick: { fontSize: 11 }
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(YAxis, { tick: { fontSize: 11 } }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Tooltip, { ...tip }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Legend, { wrapperStyle: { fontSize: 11 } }),
						inputs.map((f, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Line, {
							type: "monotone",
							dataKey: `f${i}`,
							name: `#${i + 1} ${trunc(f.nome, 16)} (${f.dataType})`,
							stroke: chartColor(i),
							dot: f.dataType === "real-time",
							strokeWidth: f.dataType === "static" ? 2.2 : 1.4,
							strokeDasharray: f.dataType === "quasi-static" ? "6 4" : f.dataType === "dynamic" ? "3 3" : void 0
						}, f.id))
					]
				})
			})
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "grid gap-4 lg:grid-cols-2",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChartCard, {
				title: "Instantaneous energy (sample-and-hold)",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ResponsiveContainer, {
					width: "100%",
					height: 240,
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(LineChart, {
						data: eIns,
						margin: {
							top: 8,
							right: 12,
							left: 0,
							bottom: 0
						},
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CartesianGrid, {
								stroke: "var(--color-border)",
								strokeDasharray: "3 3"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(XAxis, {
								dataKey: "t",
								tick: { fontSize: 11 }
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(YAxis, { tick: { fontSize: 11 } }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Tooltip, { ...tip }),
							(live?.rtNames ?? []).map((n, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Line, {
								type: "stepAfter",
								dataKey: `e${i}`,
								name: n,
								stroke: chartColor(i),
								dot: { r: 2 },
								strokeWidth: 1.4
							}, n))
						]
					})
				})
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChartCard, {
				title: live?.mixLabel ? `Italian grid mix @ ${live.mixLabel}` : "Italian grid mix",
				children: mixData.length ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ResponsiveContainer, {
					width: "100%",
					height: 240,
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(BarChart, {
						data: mixData,
						margin: {
							top: 8,
							right: 12,
							left: 0,
							bottom: 8
						},
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CartesianGrid, {
								stroke: "var(--color-border)",
								strokeDasharray: "3 3"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(XAxis, {
								dataKey: "name",
								tick: { fontSize: 11 },
								interval: 0,
								angle: -20,
								textAnchor: "end",
								height: 48
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(YAxis, {
								domain: [0, 60],
								tick: { fontSize: 11 }
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Tooltip, { ...tip }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Bar, {
								dataKey: "share",
								name: "share %",
								fill: "var(--color-primary)",
								radius: [
									4,
									4,
									0,
									0
								]
							})
						]
					})
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EmptyChart, { label: "Load the Terna mix in Step 5" })
			})]
		})]
	});
}
function ParetoTab() {
	const live = useRtlca((s) => s.live);
	const procs = useRtlca((s) => s.procs);
	const inputs = useRtlca((s) => s.inputs);
	const cat = useRtlca((s) => s.db?.colLabels[s.impactCat] ?? "impact");
	const data = procs.map((name, p) => {
		const row = { name };
		inputs.forEach((f, i) => {
			if (f.proc === p) row[`f${i}`] = Math.abs(live?.flowImp[i] ?? 0);
		});
		return row;
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex h-full flex-col gap-2",
		children: [
			live?.alarm ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-sm font-semibold text-stop",
				children: live.alarm
			}) : null,
			live?.dq ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-sm font-medium text-warn",
				children: live.dq
			}) : null,
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChartCard, {
				title: `Contribution analysis per unit process — ${trunc(cat, 60)}`,
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ResponsiveContainer, {
					width: "100%",
					height: 420,
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(BarChart, {
						data,
						margin: {
							top: 8,
							right: 12,
							left: 0,
							bottom: 8
						},
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CartesianGrid, {
								stroke: "var(--color-border)",
								strokeDasharray: "3 3"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(XAxis, {
								dataKey: "name",
								tick: { fontSize: 11 }
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(YAxis, { tick: { fontSize: 11 } }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Tooltip, { ...tip }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Legend, { wrapperStyle: { fontSize: 11 } }),
							inputs.map((f, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Bar, {
								dataKey: `f${i}`,
								stackId: "a",
								name: `#${i + 1} ${trunc(f.nome, 18)}`,
								fill: chartColor(i)
							}, f.id))
						]
					})
				})
			})
		]
	});
}
function LccTab() {
	const live = useRtlca((s) => s.live);
	const procs = useRtlca((s) => s.procs);
	const inputs = useRtlca((s) => s.inputs);
	const data = procs.map((name, p) => {
		const st = live?.costStack[p];
		const row = { name };
		inputs.forEach((f, i) => {
			if (f.proc === p) row[`f${i}`] = st?.flowCosts[i] ?? 0;
		});
		row.capex = st?.capex ?? 0;
		row.labour = st?.labour ?? 0;
		row.opex = st?.opex ?? 0;
		row.carbon = st?.carbon ?? 0;
		return row;
	});
	const cum = (live?.series ?? []).map((p) => ({
		t: p.t,
		cost: p.cost,
		energy: p.costE
	}));
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "grid gap-4",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChartCard, {
			title: "Real-time LCC: cost per unit process [EUR], split by cost item",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ResponsiveContainer, {
				width: "100%",
				height: 280,
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(BarChart, {
					data,
					margin: {
						top: 8,
						right: 12,
						left: 0,
						bottom: 8
					},
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CartesianGrid, {
							stroke: "var(--color-border)",
							strokeDasharray: "3 3"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(XAxis, {
							dataKey: "name",
							tick: { fontSize: 11 }
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(YAxis, { tick: { fontSize: 11 } }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Tooltip, { ...tip }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Legend, { wrapperStyle: { fontSize: 11 } }),
						inputs.map((f, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Bar, {
							dataKey: `f${i}`,
							stackId: "c",
							name: trunc(f.nome, 16),
							fill: chartColor(i)
						}, f.id)),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Bar, {
							dataKey: "capex",
							stackId: "c",
							name: "capital",
							fill: "var(--color-muted)"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Bar, {
							dataKey: "labour",
							stackId: "c",
							name: "labour",
							fill: "var(--color-subtle)"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Bar, {
							dataKey: "opex",
							stackId: "c",
							name: "other OPEX",
							fill: "var(--color-border)"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Bar, {
							dataKey: "carbon",
							stackId: "c",
							name: "carbon cost",
							fill: "var(--color-go)"
						})
					]
				})
			})
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChartCard, {
			title: "Cumulative cost of the cycle [EUR]",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ResponsiveContainer, {
				width: "100%",
				height: 240,
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(LineChart, {
					data: cum,
					margin: {
						top: 8,
						right: 12,
						left: 0,
						bottom: 0
					},
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CartesianGrid, {
							stroke: "var(--color-border)",
							strokeDasharray: "3 3"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(XAxis, {
							dataKey: "t",
							tick: { fontSize: 11 }
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(YAxis, { tick: { fontSize: 11 } }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Tooltip, { ...tip }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Legend, { wrapperStyle: { fontSize: 11 } }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Line, {
							type: "monotone",
							dataKey: "cost",
							name: "total cost",
							stroke: "var(--color-kpi-5)",
							dot: false,
							strokeWidth: 2
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Line, {
							type: "monotone",
							dataKey: "energy",
							name: "energy cost",
							stroke: "var(--color-chart-6)",
							dot: false,
							strokeWidth: 1.4
						})
					]
				})
			})
		})]
	});
}
function CedTab() {
	const live = useRtlca((s) => s.live);
	const data = useRtlca((s) => s.procs).map((name, p) => ({
		name,
		nr: live?.cedP[p]?.[0] ?? 0,
		r: live?.cedP[p]?.[1] ?? 0
	}));
	const cum = (live?.series ?? []).map((p) => ({
		t: p.t,
		ced: p.ced,
		r: p.cedR
	}));
	const tot = live ? live.cedP.reduce((a, c) => a + c[0] + c[1], 0) : 0;
	const rshare = tot > 0 && live ? 100 * live.cedP.reduce((a, c) => a + c[1], 0) / tot : 0;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "grid gap-4",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-center text-xl font-medium tabular-nums text-dynamic",
				children: tot ? `CED total: ${fmt(tot, 4)} MJ   |   renewable share ${rshare.toFixed(0)}%` : "CED: —"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChartCard, {
				title: "Cumulative Energy Demand per unit process [MJ]: non-renewable vs renewable",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ResponsiveContainer, {
					width: "100%",
					height: 260,
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(BarChart, {
						data,
						margin: {
							top: 8,
							right: 12,
							left: 0,
							bottom: 8
						},
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CartesianGrid, {
								stroke: "var(--color-border)",
								strokeDasharray: "3 3"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(XAxis, {
								dataKey: "name",
								tick: { fontSize: 11 }
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(YAxis, { tick: { fontSize: 11 } }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Tooltip, { ...tip }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Legend, { wrapperStyle: { fontSize: 11 } }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Bar, {
								dataKey: "nr",
								stackId: "e",
								name: "non-renewable",
								fill: "var(--color-dynamic)"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Bar, {
								dataKey: "r",
								stackId: "e",
								name: "renewable",
								fill: "var(--color-go)"
							})
						]
					})
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChartCard, {
				title: "Cumulative CED of the cycle [MJ]",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ResponsiveContainer, {
					width: "100%",
					height: 220,
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(LineChart, {
						data: cum,
						margin: {
							top: 8,
							right: 12,
							left: 0,
							bottom: 0
						},
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CartesianGrid, {
								stroke: "var(--color-border)",
								strokeDasharray: "3 3"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(XAxis, {
								dataKey: "t",
								tick: { fontSize: 11 }
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(YAxis, { tick: { fontSize: 11 } }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Tooltip, { ...tip }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Legend, { wrapperStyle: { fontSize: 11 } }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Line, {
								type: "monotone",
								dataKey: "ced",
								name: "CED total",
								stroke: "var(--color-dynamic)",
								dot: false,
								strokeWidth: 2
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Line, {
								type: "monotone",
								dataKey: "r",
								name: "renewable part",
								stroke: "var(--color-go)",
								dot: false,
								strokeWidth: 1.4
							})
						]
					})
				})
			})
		]
	});
}
function ChartCard({ title, children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "min-w-0",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
			className: "mb-2 text-xs font-semibold uppercase tracking-wide text-muted",
			children: title
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "min-h-[200px]",
			children
		})]
	});
}
function EmptyChart({ label }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "flex h-48 items-center justify-center text-sm text-muted",
		children: label
	});
}
function Dialogs() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AlertDialog, {}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CostDialog, {}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ProcDialog, {}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(RtMapDialog, {}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(QsDialog, {})
	] });
}
function Overlay({ title, onClose, children, wide }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "fixed inset-0 z-50 flex items-end justify-center bg-header/40 p-0 sm:items-center sm:p-6",
		role: "dialog",
		"aria-modal": "true",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: cn("flex max-h-[92vh] w-full flex-col rounded-t-xl bg-surface shadow-[var(--shadow-border)] sm:rounded-xl", wide ? "sm:max-w-3xl" : "sm:max-w-lg"),
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center justify-between border-b border-border px-4 py-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "text-sm font-semibold",
					children: title
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					onClick: onClose,
					className: "text-sm text-muted hover:text-fg",
					children: "Close"
				})]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "min-h-0 overflow-auto p-4",
				children
			})]
		})
	});
}
function AlertDialog() {
	const alert = useRtlca((s) => s.alert);
	const setAlert = useRtlca((s) => s.setAlert);
	if (!alert) return null;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Overlay, {
		title: alert.title,
		onClose: () => setAlert(null),
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "whitespace-pre-wrap text-sm leading-relaxed text-fg",
			children: alert.message
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "mt-4 flex justify-end",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
				onClick: () => setAlert(null),
				children: "OK"
			})
		})]
	});
}
function CostDialog() {
	const open = useRtlca((s) => s.costOpen);
	const setOpen = useRtlca((s) => s.setCostOpen);
	const procs = useRtlca((s) => s.procs);
	const inputs = useRtlca((s) => s.inputs);
	const costP = useRtlca((s) => s.costP);
	const setCostP = useRtlca((s) => s.setCostP);
	const setFlowPrice = useRtlca((s) => s.setFlowPrice);
	const energyBill = useRtlca((s) => s.energyBill);
	const carbonPrice = useRtlca((s) => s.carbonPrice);
	const disrCost = useRtlca((s) => s.disrCost);
	const unitsPerCycle = useRtlca((s) => s.unitsPerCycle);
	const setGlobal = useRtlca((s) => s.setGlobalCost);
	const save = useRtlca((s) => s.saveCosts);
	const [sel, setSel] = (0, import_react.useState)(0);
	if (!open) return null;
	const nP = procs.length;
	const isGlobal = sel >= nP;
	const hourly = !isGlobal ? (costP[sel] ?? []).reduce((a, b) => a + b, 0) : 0;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Overlay, {
		title: "Costs and prices (LCC)",
		onClose: () => setOpen(false),
		wide: true,
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mb-3 text-xs italic text-muted",
				children: "Select a unit process, then edit values. Items follow Environmental LCC (capital, operating, end-of-life)."
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "grid gap-4 md:grid-cols-[200px_1fr]",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("ul", {
					className: "flex flex-col gap-1",
					children: [procs.map((p, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						onClick: () => setSel(i),
						className: cn("h-10 w-full rounded-sm px-3 text-left text-sm", sel === i ? "bg-primary text-primary-fg" : "bg-surface-2 hover:bg-border/60"),
						children: p
					}) }, p)), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						onClick: () => setSel(nP),
						className: cn("h-10 w-full rounded-sm px-3 text-left text-sm", isGlobal ? "bg-primary text-primary-fg" : "bg-surface-2 hover:bg-border/60"),
						children: "GLOBAL"
					}) })]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
					className: "w-full text-sm",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
						className: "text-left text-xs text-muted",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
								className: "pb-2 font-medium",
								children: "Cost item"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
								className: "pb-2 font-medium",
								children: "Value"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
								className: "pb-2 font-medium",
								children: "Unit"
							})
						]
					}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tbody", { children: [
						!isGlobal && COST_ITEMS.map((name, k) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
							className: "border-t border-border",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: "py-1.5 pr-2",
									children: name
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: "py-1.5",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
										type: "number",
										min: 0,
										step: "0.01",
										className: "h-9",
										value: costP[sel]?.[k] ?? 0,
										onChange: (e) => setCostP(sel, k, Number(e.target.value))
									})
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: "py-1.5 text-muted",
									children: "EUR/h"
								})
							]
						}, name)),
						!isGlobal && inputs.map((f, i) => f.proc === sel && f.dataType !== "real-time" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
							className: "border-t border-border",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("td", {
									className: "py-1.5 pr-2",
									children: [f.dir === "Output" ? "Disposal / treatment: " : "Purchase price: ", trunc(f.nome, 30)]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: "py-1.5",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
										type: "number",
										min: 0,
										step: "0.01",
										className: "h-9",
										value: f.price,
										onChange: (e) => setFlowPrice(i, Number(e.target.value))
									})
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("td", {
									className: "py-1.5 text-muted",
									children: ["EUR/", f.unit]
								})
							]
						}, f.id) : null),
						!isGlobal && inputs.some((f) => f.proc === sel && f.dataType === "real-time") && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tr", {
							className: "border-t border-border",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: "py-1.5 text-muted",
								colSpan: 3,
								children: "Energy: real-time channel, priced with the GLOBAL energy price"
							})
						}),
						isGlobal && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(GlobalRow, {
								label: "Energy price from the bill",
								unit: "EUR/kWh",
								value: energyBill,
								onChange: (v) => setGlobal("energyBill", v)
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(GlobalRow, {
								label: "Carbon price (0 = off)",
								unit: "EUR/tCO2e",
								value: carbonPrice,
								onChange: (v) => setGlobal("carbonPrice", v)
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(GlobalRow, {
								label: "Disruption cost during hotspots",
								unit: "EUR/h",
								value: disrCost,
								onChange: (v) => setGlobal("disrCost", v)
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(GlobalRow, {
								label: "Product units per cycle",
								unit: "units",
								value: unitsPerCycle,
								onChange: (v) => setGlobal("unitsPerCycle", v)
							})
						] })
					] })]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-3 text-sm font-semibold",
					children: isGlobal ? "Global economic parameters" : `${procs[sel]}: hourly items ${fmtFixed(hourly)} EUR/h`
				})] })]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-4 flex justify-end gap-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					variant: "secondary",
					onClick: () => setOpen(false),
					children: "Cancel"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					onClick: save,
					children: "Save costs"
				})]
			})
		]
	});
}
function GlobalRow({ label, unit, value, onChange }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
		className: "border-t border-border",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
				className: "py-1.5 pr-2",
				children: label
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
				className: "py-1.5",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
					type: "number",
					min: 0,
					step: "0.01",
					className: "h-9",
					value,
					onChange: (e) => onChange(Number(e.target.value))
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
				className: "py-1.5 text-muted",
				children: unit
			})
		]
	});
}
function ProcDialog() {
	const p = useRtlca((s) => s.procOpen);
	const setOpen = useRtlca((s) => s.setProcOpen);
	const procs = useRtlca((s) => s.procs);
	const inputs = useRtlca((s) => s.inputs);
	const costP = useRtlca((s) => s.costP);
	const live = useRtlca((s) => s.live);
	const cat = useRtlca((s) => s.db?.colLabels[s.impactCat] ?? "");
	const rename = useRtlca((s) => s.renameProc);
	const remove = useRtlca((s) => s.removeFlow);
	const goto = useRtlca((s) => s.gotoStep);
	const setDraft = useRtlca((s) => s.setDraft);
	const setCostOpen = useRtlca((s) => s.setCostOpen);
	const editQty = useRtlca((s) => s.editFlowQty);
	const setFlowPrice = useRtlca((s) => s.setFlowPrice);
	const [name, setName] = (0, import_react.useState)("");
	if (p == null) return null;
	const fl = inputs.map((f, i) => ({
		f,
		i
	})).filter((x) => x.f.proc === p);
	const hourly = (costP[p] ?? []).reduce((a, b) => a + b, 0);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Overlay, {
		title: `Unit process "${procs[p]}"`,
		onClose: () => setOpen(null),
		wide: true,
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mb-3 flex flex-wrap items-end gap-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
					className: "flex flex-col gap-1 text-xs font-medium text-muted",
					children: ["Name", /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
						className: "h-9 w-56",
						defaultValue: procs[p],
						onChange: (e) => setName(e.target.value)
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					variant: "secondary",
					size: "sm",
					onClick: () => rename(p, name || procs[p]),
					children: "Rename"
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "mb-3 text-xs text-muted",
				children: [
					"Position ",
					p + 1,
					" of ",
					procs.length,
					" in the chain · ",
					fl.length,
					" flows · hourly costs ",
					fmtFixed(hourly),
					" EUR/h · impact so far: ",
					live ? live.procImp[p] : "—",
					" · ",
					trunc(cat, 40)
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "overflow-x-auto",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
					className: "w-full min-w-[640px] text-sm",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
						className: "text-left text-xs text-muted",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
								className: "pb-2",
								children: "#"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
								className: "pb-2",
								children: "Flow"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
								className: "pb-2",
								children: "Dir"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
								className: "pb-2",
								children: "Taxonomy"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
								className: "pb-2",
								children: "Qty / law"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
								className: "pb-2",
								children: "Unit"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
								className: "pb-2",
								children: "Price"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
								className: "pb-2",
								children: "CF"
							})
						]
					}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", { children: fl.map(({ f, i }) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
						className: "border-t border-border",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: "py-1.5",
								children: i + 1
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: "py-1.5",
								children: f.nome
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: "py-1.5",
								children: f.dir
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: "py-1.5",
								children: f.dataType
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: "py-1.5",
								children: f.dataType === "static" || f.dataType === "quasi-static" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
									type: "number",
									className: "h-8 w-24",
									value: f.qty ?? 0,
									onChange: (e) => editQty(i, Number(e.target.value))
								}) : f.dataType === "dynamic" ? `v(t) = ${f.lawTxt}` : f.rtCol >= 0 ? `channel ${f.rtColName}` : "channel (not mapped)"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: "py-1.5",
								children: f.unit
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: "py-1.5",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
									type: "number",
									min: 0,
									className: "h-8 w-24",
									value: f.price,
									onChange: (e) => setFlowPrice(i, Number(e.target.value))
								})
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: "py-1.5 font-mono text-xs",
								children: f.cf
							})
						]
					}, f.id)) })]
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-4 flex flex-wrap gap-2",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						variant: "danger",
						size: "sm",
						onClick: () => {
							if (fl[0]) remove(fl[0].i);
						},
						children: "Remove first listed flow"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						variant: "secondary",
						size: "sm",
						onClick: () => {
							setDraft({ selectedProc: p });
							setOpen(null);
							goto(3, true);
						},
						children: "Add flow here"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						variant: "secondary",
						size: "sm",
						onClick: () => {
							setOpen(null);
							setCostOpen(true);
						},
						children: "Edit costs"
					})
				]
			})
		]
	});
}
function RtMapDialog() {
	const open = useRtlca((s) => s.rtMapOpen);
	const close = useRtlca((s) => s.closeRtMap);
	const apply = useRtlca((s) => s.applyRtMap);
	const procs = useRtlca((s) => s.procs);
	const [vals, setVals] = (0, import_react.useState)(null);
	if (!open) return null;
	const v = vals ?? open.defs;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Overlay, {
		title: "Match energy columns to unit processes (0 = ignore)",
		onClose: close,
		wide: true,
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "mb-3 text-xs text-muted",
				children: ["Chain: ", procs.map((p, i) => `${i + 1}=${p}`).join(",  ")]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "space-y-3",
				children: open.names.map((n, c) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
					className: "flex flex-col gap-1 text-sm",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [
						"Column “",
						n,
						"” [",
						open.units[c],
						"] → unit process number"
					] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
						type: "number",
						min: 0,
						max: procs.length,
						className: "h-9 w-28",
						value: v[c] ?? 0,
						onChange: (e) => {
							const next = [...v];
							next[c] = Number(e.target.value);
							setVals(next);
						}
					})]
				}, n))
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-4 flex justify-end gap-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					variant: "secondary",
					onClick: close,
					children: "Cancel"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					onClick: () => apply(v),
					children: "Apply matching"
				})]
			})
		]
	});
}
function QsDialog() {
	const open = useRtlca((s) => s.qsOpen);
	const close = useRtlca((s) => s.closeQS);
	const apply = useRtlca((s) => s.applyQS);
	const [vals, setVals] = (0, import_react.useState)(null);
	if (!open) return null;
	const v = vals ?? open.defs;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Overlay, {
		title: "Quasi-static values for this cycle",
		onClose: close,
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "space-y-3",
			children: open.prompts.map((p, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
				className: "flex flex-col gap-1 text-sm",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: p }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
					type: "number",
					className: "h-9",
					value: v[i] ?? "",
					onChange: (e) => {
						const next = [...v];
						next[i] = e.target.value;
						setVals(next);
					}
				})]
			}, p))
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mt-4 flex justify-end gap-2",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
				variant: "secondary",
				onClick: close,
				children: "Cancel"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
				onClick: () => apply(v.map(Number)),
				children: "Confirm values"
			})]
		})]
	});
}
function AppShell() {
	const status = useRtlca((s) => s.status);
	const campaign = useRtlca((s) => s.campaign);
	const expN = useRtlca((s) => s.expN);
	const live = useRtlca((s) => s.live);
	const staticLca = useRtlca((s) => s.staticLca);
	const configDone = useRtlca((s) => s.configDone);
	const delta = live && staticLca > 0 ? `${live.cumTot - staticLca >= 0 ? "+" : ""}${(100 * (live.cumTot - staticLca) / staticLca).toFixed(1)}%` : "—";
	const kpis = [
		{
			label: "Instantaneous impact",
			value: live ? fmt(live.instTot) : "—",
			color: "text-kpi-1"
		},
		{
			label: "Cumulative impact",
			value: live ? fmt(live.cumTot) : "—",
			color: "text-kpi-2"
		},
		{
			label: "Delta% vs static LCA",
			value: delta,
			color: "text-kpi-3"
		},
		{
			label: "Hotspots detected",
			value: live ? String(live.hotN) : "—",
			color: live && live.hotN > 0 ? "text-kpi-4" : "text-fg"
		},
		{
			label: "Cumulative cost [EUR]",
			value: live ? live.costTot.toFixed(2) : "—",
			color: "text-kpi-5"
		}
	];
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex min-h-dvh flex-col bg-bg text-fg",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
				className: "flex flex-wrap items-center justify-between gap-2 bg-header px-4 py-3 text-header-fg",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "min-w-0",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
						className: "text-base font-semibold tracking-tight md:text-lg",
						children: "RT-LCA / LCC process dashboard"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-[11px] text-header-muted md:text-xs",
						children: "Real-time life cycle assessment & costing of unit processes · ISO 14040/14044"
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "font-mono text-xs tabular-nums",
					children: configDone ? `${campaign} — cycle ${expN}` : "no campaign"
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "grid grid-cols-2 gap-2 px-3 py-2 md:grid-cols-5",
				children: kpis.map((k) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
					className: "rounded-md bg-surface px-3 py-2 shadow-[var(--shadow-border)]",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-[10px] font-medium uppercase tracking-wide text-subtle",
						children: k.label
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: cn("font-mono text-lg font-semibold tabular-nums md:text-xl", k.color),
						children: k.value
					})]
				}, k.label))
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "px-4 pb-2 text-sm text-muted",
				children: status
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex min-h-0 flex-1 flex-col gap-3 px-3 pb-4 lg:flex-row",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Workflow, {}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ResultTabs, {})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dialogs, {})
		]
	});
}
function Home() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AppShell, {});
}
//#endregion
export { Home as component };
