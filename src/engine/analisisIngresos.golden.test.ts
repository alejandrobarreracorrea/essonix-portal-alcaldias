import { describe, it, expect } from 'vitest'
import * as XLSX from 'xlsx'
import { readFileSync } from 'node:fs'
import { normalizeIngresoRows, sheetToMatrix } from '../parsers/ingresos'
import { analisisIngresos } from './analisisIngresos'

type FilaSinObs = Record<string, unknown>
const sinObs = (f: { observaciones?: unknown }): FilaSinObs => {
  const { observaciones: _omit, ...rest } = f
  return rest
}

describe('fidelidad Análisis de Ingresos (Briceño) — tolerancia 0', () => {
  it('la salida del motor coincide exactamente con la plantilla', () => {
    const wb = XLSX.read(readFileSync('tests/fixtures/ingresos.briceno.xlsx'))
    const rows = normalizeIngresoRows(sheetToMatrix(wb.Sheets[wb.SheetNames[0]]))
    const got = analisisIngresos(rows).map(sinObs)

    const expected = JSON.parse(
      readFileSync('tests/golden/ingresos.expected.json', 'utf8'),
    ) as Array<{ observaciones?: unknown }>
    const want = expected.map(sinObs)

    expect(got).toHaveLength(want.length)
    expect(got).toEqual(want)
  })
})
