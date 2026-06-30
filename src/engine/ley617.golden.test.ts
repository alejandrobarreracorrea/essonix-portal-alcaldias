import { describe, it, expect } from 'vitest'
import * as XLSX from 'xlsx'
import { readFileSync } from 'node:fs'
import { normalizeIngresoRows } from '../parsers/ingresos'
import { normalizeGastoRows } from '../parsers/gastos'
import { sheetToMatrix } from '../parsers/sheet'
import { ley617 } from './ley617'

describe('fidelidad Ley 617 (Briceño) — tolerancia 0', () => {
  it('la salida del motor coincide exactamente con la hoja "Ley 617"', () => {
    const wbI = XLSX.read(readFileSync('tests/fixtures/ingresos.briceno.xlsx'))
    const wbG = XLSX.read(readFileSync('tests/fixtures/gastos.briceno.xlsx'))
    const ingresoRows = normalizeIngresoRows(sheetToMatrix(wbI.Sheets[wbI.SheetNames[0]]))
    const gastoRows = normalizeGastoRows(sheetToMatrix(wbG.Sheets[wbG.SheetNames[0]]))

    const got = ley617(ingresoRows, gastoRows)
    const want = JSON.parse(readFileSync('tests/golden/ley617.expected.json', 'utf8'))

    expect(got).toEqual(want)
  })
})
