import * as XLSX from 'xlsx'
import type { GastoRawRow } from '../types'
import { text, num, sheetToMatrix } from './sheet'

export class GastoParseError extends Error {}

const HEADER_RUBRO = 'Código rubro presupuestal'

const TEXT_COLS = {
  rubro: 'Código rubro presupuestal',
  descripcion: 'Descripción rubro presupuestal',
  cpc: 'CCPET01 - CPC V2.1 AC',
  unidadEjec: 'CCPET02 - UNIDAD EJECUTORA',
  programatico: 'CCPET03 - CLASIFICADOR PROGRAMÁTICO DE LA INVERSIÓN PÚBLICA',
  fuentes: 'CCPET05 - FUENTES DE FINANCIACIÓN',
  cpi: 'CCPET81 - PRODUCTO DE INVERSIÓN',
  atributo: 'CCPET83 - ATRIBUTO EJECUCIÓN CON / SIN SITUACIÓN DE FONDOS',
} as const

const NUM_COLS = {
  pptoInicial: 'Presupuesto inicial',
  pptoFinal: 'Presupuesto final',
  disponibilidades: 'Disponibilidades',
  saldoDisponible: 'Saldo disponible: Presupuesto final - disponibilidades',
  registros: 'Registros',
  saldoDisponibilidades: 'Saldo de disponibilidades: Disponibilidades - registros',
  ordenPago: 'Ordenes de pago',
  saldoRegistro: 'Saldo registro: Registros - ordenes de pago',
  egresos: 'Egresos',
  egresosPapeles: 'Egresos en papeles',
  saldoOrdenesPago: 'Saldo ordenes de pago: Ordenes de pago - egresos',
  creditos: 'Créditos presupuesto',
  contracreditos: 'Contracreditos presupuesto',
} as const

export function normalizeGastoRows(matrix: unknown[][]): GastoRawRow[] {
  const headerIdx = matrix.findIndex((r) => text(r?.[0]) === HEADER_RUBRO)
  if (headerIdx === -1) {
    throw new GastoParseError(
      `No se encontró la fila de encabezado (columna "${HEADER_RUBRO}"). ¿Es el reporte de ejecución de gastos correcto?`,
    )
  }
  const header = matrix[headerIdx].map((c) => text(c))
  const idxOf = (name: string): number => {
    const i = header.indexOf(name)
    if (i === -1) throw new GastoParseError(`Falta la columna esperada "${name}".`)
    return i
  }
  const textIdx = Object.fromEntries(
    Object.entries(TEXT_COLS).map(([k, name]) => [k, idxOf(name)]),
  ) as Record<keyof typeof TEXT_COLS, number>
  const numIdx = Object.fromEntries(
    Object.entries(NUM_COLS).map(([k, name]) => [k, idxOf(name)]),
  ) as Record<keyof typeof NUM_COLS, number>

  const rows: GastoRawRow[] = []
  for (let r = headerIdx + 1; r < matrix.length; r++) {
    const row = matrix[r] ?? []
    const rubro = text(row[textIdx.rubro])
    if (rubro === '') break
    rows.push({
      rubro,
      descripcion: text(row[textIdx.descripcion]),
      cpc: text(row[textIdx.cpc]),
      unidadEjec: text(row[textIdx.unidadEjec]),
      programatico: text(row[textIdx.programatico]),
      fuentes: text(row[textIdx.fuentes]),
      cpi: text(row[textIdx.cpi]),
      atributo: text(row[textIdx.atributo]),
      pptoInicial: num(row[numIdx.pptoInicial]),
      pptoFinal: num(row[numIdx.pptoFinal]),
      disponibilidades: num(row[numIdx.disponibilidades]),
      saldoDisponible: num(row[numIdx.saldoDisponible]),
      registros: num(row[numIdx.registros]),
      saldoDisponibilidades: num(row[numIdx.saldoDisponibilidades]),
      ordenPago: num(row[numIdx.ordenPago]),
      saldoRegistro: num(row[numIdx.saldoRegistro]),
      egresos: num(row[numIdx.egresos]),
      egresosPapeles: num(row[numIdx.egresosPapeles]),
      saldoOrdenesPago: num(row[numIdx.saldoOrdenesPago]),
      creditos: num(row[numIdx.creditos]),
      contracreditos: num(row[numIdx.contracreditos]),
    })
  }
  return rows
}

export function parseGastoPaste(textInput: string): GastoRawRow[] {
  const matrix = textInput.split(/\r?\n/).map((line) => line.split('\t'))
  return normalizeGastoRows(matrix)
}

export async function parseGastoFile(file: File): Promise<GastoRawRow[]> {
  const buf = await file.arrayBuffer()
  const wb = XLSX.read(buf, { type: 'array' })
  const ws = wb.Sheets[wb.SheetNames[0]]
  return normalizeGastoRows(sheetToMatrix(ws))
}
