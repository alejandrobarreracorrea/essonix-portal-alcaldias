import * as XLSX from 'xlsx'

export const text = (v: unknown): string => (v == null ? '' : String(v).trim())

export const num = (v: unknown): number => {
  if (typeof v === 'number') return v
  if (v == null || v === '') return 0
  const n = Number(String(v).trim())
  return Number.isNaN(n) ? 0 : n
}

export function sheetToMatrix(ws: XLSX.WorkSheet): unknown[][] {
  return XLSX.utils.sheet_to_json(ws, { header: 1, raw: true, defval: null }) as unknown[][]
}
