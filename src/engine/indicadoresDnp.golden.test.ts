import { describe, it, expect } from 'vitest'
import * as XLSX from 'xlsx'
import { readFileSync } from 'node:fs'
import { normalizeIngresoRows, sheetToMatrix } from '../parsers/ingresos'
import { normalizeGastoRows } from '../parsers/gastos'
import { sheetToMatrix as sheetToMatrixSheet } from '../parsers/sheet'
import { analisisIngresos } from './analisisIngresos'
import { analisisGastos } from './analisisGastos'
import { indicadoresDnp } from './indicadoresDnp'

describe('indicadoresDnp — consistencia con archivo fuente (Briceño)', () => {
  it('recursosPropios y magnitudInversion coinciden con valores del archivo fuente', () => {
    const wbI = XLSX.read(readFileSync('tests/fixtures/ingresos.briceno.xlsx'))
    const filasIngreso = analisisIngresos(
      normalizeIngresoRows(sheetToMatrix(wbI.Sheets[wbI.SheetNames[0]])),
    )

    const wbG = XLSX.read(readFileSync('tests/fixtures/gastos.briceno.xlsx'))
    const filasGasto = analisisGastos(
      normalizeGastoRows(sheetToMatrixSheet(wbG.Sheets[wbG.SheetNames[0]])),
    )

    const result = indicadoresDnp(filasIngreso, filasGasto)

    // #4 Recursos propios — base recaudo
    expect(result.recursosPropios.numerador).toBe(6577853241.83)
    expect(result.recursosPropios.denominador).toBe(15240418188.64)

    // #5 Magnitud inversión — base compromisos
    expect(result.magnitudInversion.denominador).toBe(20174379502.57)
    expect(result.magnitudInversion.numerador).toBeGreaterThan(0)
    expect(result.magnitudInversion.valor).toBe(
      result.magnitudInversion.numerador / result.magnitudInversion.denominador,
    )
  })
})
