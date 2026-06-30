import { describe, it, expect } from 'vitest'
import * as XLSX from 'xlsx'
import { readFileSync } from 'node:fs'
import { normalizeIngresoRows, sheetToMatrix } from '../parsers/ingresos'
import { normalizeGastoRows } from '../parsers/gastos'
import { parseSgpResumenMatrix } from '../parsers/sgp'
import { fuentesYUsos } from './fuentesYUsos'
import { seguimientoSgp } from './seguimientoSgp'
import { SGP_CATALOGO } from '../data/sgpCatalogo'
import fuentes from '../data/fuentes.json'
import type { FuenteCatalogo } from '../types'

type GoldenRow = {
  fila: number
  presupuesto: number | null
  recaudo: number | null
  compromisos: number | null
}

// ── Parse fixtures ────────────────────────────────────────────────────────────
const wbI = XLSX.read(readFileSync('tests/fixtures/ingresos.briceno.xlsx'))
const wbG = XLSX.read(readFileSync('tests/fixtures/gastos.briceno.xlsx'))
const wbS = XLSX.read(readFileSync('tests/fixtures/sgp.briceno.xlsx'))

const ingresoRows = normalizeIngresoRows(sheetToMatrix(wbI.Sheets[wbI.SheetNames[0]]))
const gastoRows = normalizeGastoRows(sheetToMatrix(wbG.Sheets[wbG.SheetNames[0]]))
const filasFuenteUso = fuentesYUsos(fuentes as FuenteCatalogo[], ingresoRows, gastoRows)

const sgpMatrix = sheetToMatrix(wbS.Sheets['Datos Reporte SGP'])
const sicodis = parseSgpResumenMatrix(sgpMatrix)

const got = seguimientoSgp(SGP_CATALOGO, sicodis, ingresoRows, filasFuenteUso)

const golden: GoldenRow[] = JSON.parse(
  readFileSync('tests/golden/sgp.expected.json', 'utf8'),
) as GoldenRow[]

const gotByFila = new Map(got.map((r) => [r.fila, r]))
const sicodisByConcepto = new Map(sicodis.map((r) => [r.concepto.trim(), r]))

// ── Assertion 1: G/J/L tol-0 vs plantilla ────────────────────────────────────
describe('Seguimiento SGP — fidelidad G/J/L vs plantilla (tolerancia 0)', () => {
  for (const g of golden) {
    it(`fila ${g.fila}: presupuesto/recaudo/compromisos === golden`, () => {
      const row = gotByFila.get(g.fila)
      expect(row, `fila ${g.fila} missing from seguimientoSgp output`).toBeDefined()
      expect(row!.presupuesto).toBe(g.presupuesto)
      expect(row!.recaudo).toBe(g.recaudo)
      expect(row!.compromisos).toBe(g.compromisos)
    })
  }
})

// ── Assertion 2: D/E/F spot-checks vs SICODIS ────────────────────────────────
describe('Seguimiento SGP — D/E/F vs SICODIS (spot-checks)', () => {
  it('fila 19 (Matrícula Gratuidad): once === 132574890, total === 132574890', () => {
    const row = gotByFila.get(19)!
    expect(row.once).toBe(132574890)
    expect(row.total).toBe(132574890)
  })

  it('fila 22 (Régimen Subsidiado): ultima === 105783768, once === 3540215001, total === 3645998769', () => {
    const row = gotByFila.get(22)!
    expect(row.ultima).toBe(105783768)
    expect(row.once).toBe(3540215001)
    expect(row.total).toBe(3645998769)
  })

  it('fila 37 (TOTAL SGP): total === 13062169364', () => {
    const row = gotByFila.get(37)!
    expect(row.total).toBe(13062169364)
  })

  it('D/E/F values match sicodis for each catalog entry with sicodisConcepto', () => {
    for (const entry of SGP_CATALOGO) {
      if (entry.sicodisConcepto === null) continue
      const sicodisRow = sicodisByConcepto.get(entry.sicodisConcepto.trim())
      if (!sicodisRow) continue
      const row = gotByFila.get(entry.fila)
      expect(row, `fila ${entry.fila} missing from seguimientoSgp output`).toBeDefined()
      expect(row!.ultima, `fila ${entry.fila} ultima`).toBe(sicodisRow.ultima)
      expect(row!.once, `fila ${entry.fila} once`).toBe(sicodisRow.once)
      expect(row!.total, `fila ${entry.fila} total`).toBe(sicodisRow.total)
    }
  })
})
