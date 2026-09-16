import type { Database } from "./types";

/**
 * Estrae i fattori CED (Cumulative Energy Demand) [non-rinnovabile, rinnovabile]
 * da una riga del dataset [MJ per unità].
 * Se le sotto-colonne mancano, il totale viene assegnato alla quota non rinnovabile.
 */
export function cedFactors(db: Database, ip: number): [number, number] {
  if (db.cedCol == null || db.cedCol < 0) return [0, 0];

  const r = db.procRow[ip];
  if (r == null) return [0, 0];

  let nr = 0;
  let rn = 0;

  const nrCols = db.cedNRCols || [];
  const rCols = db.cedRCols || [];

  // Somma le quote non rinnovabili
  for (const c of nrCols) {
    const v = db.raw[r]?.[db.coefCols[c]!];
    if (typeof v === "number" && Number.isFinite(v)) nr += v;
  }

  // Somma le quote rinnovabili
  for (const c of rCols) {
    const v = db.raw[r]?.[db.coefCols[c]!];
    if (typeof v === "number" && Number.isFinite(v)) rn += v;
  }

  // Fallback: se non ci sono colonne specifiche, assegna il totale al non-rinnovabile
  if (nrCols.length === 0 && rCols.length === 0) {
    const v = db.raw[r]?.[db.coefCols[db.cedCol]!];
    if (typeof v === "number" && Number.isFinite(v)) nr = v;
  }

  return [nr, rn];
}
