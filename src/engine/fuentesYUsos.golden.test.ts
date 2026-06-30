import { describe, it, expect } from 'vitest'
import * as XLSX from 'xlsx'
import { readFileSync } from 'node:fs'
import { normalizeIngresoRows } from '../parsers/ingresos'
import { normalizeGastoRows } from '../parsers/gastos'
import { sheetToMatrix } from '../parsers/sheet'
import { fuentesYUsos } from './fuentesYUsos'
import fuentes from '../data/fuentes.json'
import type { FuenteCatalogo } from '../types'

const sinObs = <T extends { observaciones?: unknown }>(f: T) => {
  const { observaciones: _omit, ...rest } = f
  return rest
}

describe('fidelidad Fuentes y Usos (Briceño) — tolerancia 0', () => {
  it('la salida del motor coincide exactamente con la plantilla', () => {
    const wbI = XLSX.read(readFileSync('tests/fixtures/ingresos.briceno.xlsx'))
    const wbG = XLSX.read(readFileSync('tests/fixtures/gastos.briceno.xlsx'))
    const ingresoRows = normalizeIngresoRows(sheetToMatrix(wbI.Sheets[wbI.SheetNames[0]]))
    const gastoRows = normalizeGastoRows(sheetToMatrix(wbG.Sheets[wbG.SheetNames[0]]))

    const got = fuentesYUsos(fuentes as FuenteCatalogo[], ingresoRows, gastoRows).map(sinObs)
    const want = (JSON.parse(readFileSync('tests/golden/fuentes.expected.json', 'utf8')) as Array<{ observaciones?: unknown }>).map(sinObs)

    expect(got).toHaveLength(want.length)
    expect(got).toEqual(want)
  })
})
