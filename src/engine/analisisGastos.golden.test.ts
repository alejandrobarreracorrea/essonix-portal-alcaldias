import { describe, it, expect } from 'vitest'
import * as XLSX from 'xlsx'
import { readFileSync } from 'node:fs'
import { normalizeGastoRows } from '../parsers/gastos'
import { sheetToMatrix } from '../parsers/sheet'
import { analisisGastos } from './analisisGastos'

describe('fidelidad Análisis de Gastos (Briceño) — tolerancia 0', () => {
  it('la salida del motor coincide exactamente con la plantilla', () => {
    const wb = XLSX.read(readFileSync('tests/fixtures/gastos.briceno.xlsx'))
    const rows = normalizeGastoRows(sheetToMatrix(wb.Sheets[wb.SheetNames[0]]))
    const got = analisisGastos(rows)

    const want = JSON.parse(
      readFileSync('tests/golden/gastos.expected.json', 'utf8'),
    ) as unknown[]

    expect(got).toHaveLength(want.length)
    expect(got).toEqual(want)
  })
})
