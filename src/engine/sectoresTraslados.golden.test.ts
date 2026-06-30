import { describe, it, expect } from 'vitest'
import * as XLSX from 'xlsx'
import { readFileSync } from 'node:fs'
import { normalizeGastoRows } from '../parsers/gastos'
import { sheetToMatrix } from '../parsers/sheet'
import { traslados } from './traslados'
import { inversionPorSectores } from './inversionPorSectores'
import sectoresJson from '../data/sectores.json'

const sectores = sectoresJson as { codigo: string; nombre: string }[]

describe('sectoresTraslados golden (Briceño)', () => {
  const wbG = XLSX.read(readFileSync('tests/fixtures/gastos.briceno.xlsx'))
  const gastoRows = normalizeGastoRows(sheetToMatrix(wbG.Sheets[wbG.SheetNames[0]]))

  it('traslados: total créditos === 360269421 y equilibrio contracreditos', () => {
    const result = traslados(gastoRows)

    expect(result.total).toBe(360269421)
    // Self-documenting: total créditos must equal the aggregate creditos on rubro '2'
    expect(result.total).toBe(gastoRows.find(r => r.rubro === '2')!.creditos)

    const sumaContracreditos = result.filas.reduce((acc, f) => acc + f.contracreditos, 0)
    expect(sumaContracreditos).toBe(360269421)
  })

  it('inversionPorSectores: Σ pptoFinal reconcilia con agregado rubro 2.3, sector top válido', () => {
    const filas = inversionPorSectores(gastoRows, sectores)

    const sumaFilas = filas.reduce((acc, f) => acc + f.pptoFinal, 0)

    // Aggregate row for rubro '2.3'
    const agregado2_3 = gastoRows.find((r) => r.rubro === '2.3')
    expect(agregado2_3).toBeDefined()

    const agregadoPptoFinal = agregado2_3!.pptoFinal
    const diff = sumaFilas - agregadoPptoFinal

    // Report diff for diagnostics (visible in test output when it fails)
    if (Math.abs(diff) >= 1) {
      const rowsSinCCPET03 = gastoRows.filter(
        (r) => r.rubro.startsWith('2.3') && r.rubro !== '2.3' && r.programatico.trim() === '',
      )
      console.warn(
        `[sectoresTraslados golden] Brecha reconciliación: Σ sectores=${sumaFilas}, agregado 2.3=${agregadoPptoFinal}, diff=${diff}`,
      )
      console.warn(
        `[sectoresTraslados golden] Filas 2.3 sin CCPET03 (${rowsSinCCPET03.length}):`,
        rowsSinCCPET03.map((r) => ({ rubro: r.rubro, descripcion: r.descripcion, pptoFinal: r.pptoFinal })),
      )
    }

    expect(Math.abs(diff)).toBeLessThan(1)

    // Spot-check: top sector has valid name and pptoFinal > 0
    expect(filas.length).toBeGreaterThan(0)
    const top = filas[0]
    expect(top.sector).not.toBe('')
    expect(top.pptoFinal).toBeGreaterThan(0)
  })
})
