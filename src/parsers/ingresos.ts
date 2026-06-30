import * as XLSX from 'xlsx'
import type { IngresoRawRow } from '../types'
import { text, num, sheetToMatrix } from './sheet'

export { sheetToMatrix } from './sheet'

export class IngresoParseError extends Error {}

const HEADER_RUBRO = 'Código Rubro presupuestal'

const COLS = {
  codigoRubro: 'Código Rubro presupuestal',
  descripcion: 'Descripción Rubro Presupuestal',
  ccpet02: 'CCPET02 - UNIDAD EJECUTORA',
  ccpet05: 'CCPET05 - FUENTES DE FINANCIACIÓN',
  ccpet83: 'CCPET83 - ATRIBUTO EJECUCIÓN CON / SIN SITUACIÓN DE FONDOS',
  pptoInicial: 'Prespuesto Inicial',
  adicAnteriores: 'Adiciones Anteriores',
  adicPeriodo: 'Adiciones Periodo',
  reducAnteriores: 'Reduciones Anteriores',
  reducPeriodo: 'Reducciones Periodo',
  pptoFinal: 'Presupuesto Final',
  totalIngresos: 'Total de ingresos',
} as const

export function normalizeIngresoRows(matrix: unknown[][]): IngresoRawRow[] {
  const headerIdx = matrix.findIndex((r) => text(r?.[0]) === HEADER_RUBRO)
  if (headerIdx === -1) {
    throw new IngresoParseError(
      `No se encontró la fila de encabezado (columna "${HEADER_RUBRO}"). ¿Es el reporte de ejecución de ingresos correcto?`,
    )
  }
  const header = matrix[headerIdx].map((c) => text(c))
  const idxOf = (name: string): number => {
    const i = header.indexOf(name)
    if (i === -1) throw new IngresoParseError(`Falta la columna esperada "${name}".`)
    return i
  }
  const idx = Object.fromEntries(
    Object.entries(COLS).map(([k, name]) => [k, idxOf(name)]),
  ) as Record<keyof typeof COLS, number>

  const rows: IngresoRawRow[] = []
  for (let r = headerIdx + 1; r < matrix.length; r++) {
    const row = matrix[r] ?? []
    const codigoRubro = text(row[idx.codigoRubro])
    if (codigoRubro === '') break
    rows.push({
      codigoRubro,
      descripcion: text(row[idx.descripcion]),
      ccpet02: text(row[idx.ccpet02]),
      ccpet05: text(row[idx.ccpet05]),
      ccpet83: text(row[idx.ccpet83]),
      pptoInicial: num(row[idx.pptoInicial]),
      adicAnteriores: num(row[idx.adicAnteriores]),
      adicPeriodo: num(row[idx.adicPeriodo]),
      reducAnteriores: num(row[idx.reducAnteriores]),
      reducPeriodo: num(row[idx.reducPeriodo]),
      pptoFinal: num(row[idx.pptoFinal]),
      totalIngresos: num(row[idx.totalIngresos]),
    })
  }
  return rows
}

export function parseIngresoPaste(textInput: string): IngresoRawRow[] {
  const matrix = textInput
    .split(/\r?\n/)
    .map((line) => line.split('\t'))
  return normalizeIngresoRows(matrix)
}

export async function parseIngresoFile(file: File): Promise<IngresoRawRow[]> {
  const buf = await file.arrayBuffer()
  const wb = XLSX.read(buf, { type: 'array' })
  const ws = wb.Sheets[wb.SheetNames[0]]
  return normalizeIngresoRows(sheetToMatrix(ws))
}
