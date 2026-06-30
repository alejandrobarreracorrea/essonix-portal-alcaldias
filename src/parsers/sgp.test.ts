import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { readSgpSheetNames, parseSgpResumenMatrix } from './sgp'

// Helper: construye un File a partir del fixture en disco (entorno jsdom).
function fixtureFile(path: string, name: string): File {
  const buf = readFileSync(path)
  return new File([buf], name, { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
}

describe('readSgpSheetNames', () => {
  it('devuelve los nombres de hoja del reporte SICODIS', async () => {
    const file = fixtureFile('tests/fixtures/sgp.briceno.xlsx', 'sgp.xlsx')
    const names = await readSgpSheetNames(file)
    expect(names).toContain('Datos Reporte SGP')
    expect(names).toContain('Datos Reporte SGP Detalle')
  })
})

describe('parseSgpResumenMatrix', () => {
  // Synthetic matrix that mimics the real SICODIS "Datos Reporte SGP" sheet:
  //   - Some title rows before the header
  //   - Header row where col B (index 1) === 'Concepto'
  //   - Data rows: col index1=concepto, index2=ultima, index3=once, index4=total
  //   - Should stop AFTER the row whose concepto === 'Total SGP' (inclusive)
  //   - Should skip fully-empty rows in between

  const matrix: unknown[][] = [
    // Row 0: title row (ignored)
    [null, 'Reporte SGP SICODIS', null, null, null],
    // Row 1: another title row (ignored)
    [null, 'Municipio: Briceño', null, null, null],
    // Row 2: empty row (ignored)
    [null, null, null, null, null],
    // Row 3: header row — col B index1 === 'Concepto'
    [null, 'Concepto', 'Última Cuota', 'Once Cuotas', 'Total'],
    // Row 4: data — Educación
    [null, 'Educación', 0, 288559412, 288559412],
    // Row 5: data — Calidad (Gratuidad)
    [null, 'Calidad (Gratuidad)', 0, 132574890, 132574890],
    // Row 6: empty data row — should be skipped
    [null, null, null, null, null],
    // Row 7: data — Total SGP (should be included and stop here)
    [null, 'Total SGP', 0, 13062169364, 13062169364],
    // Row 8: data after Total SGP — should NOT be included
    [null, 'Otra sección', 0, 999, 999],
  ]

  it('extrae filas de datos desde la fila de encabezado hasta Total SGP inclusive', () => {
    const rows = parseSgpResumenMatrix(matrix)

    expect(rows).toHaveLength(3)

    expect(rows[0]).toEqual({
      concepto: 'Educación',
      ultima: 0,
      once: 288559412,
      total: 288559412,
    })

    expect(rows[1]).toEqual({
      concepto: 'Calidad (Gratuidad)',
      ultima: 0,
      once: 132574890,
      total: 132574890,
    })

    expect(rows[2]).toEqual({
      concepto: 'Total SGP',
      ultima: 0,
      once: 13062169364,
      total: 13062169364,
    })
  })

  it('omite filas completamente vacías', () => {
    const rows = parseSgpResumenMatrix(matrix)
    const conceptos = rows.map(r => r.concepto)
    expect(conceptos).not.toContain('')
  })

  it('no incluye filas después de Total SGP', () => {
    const rows = parseSgpResumenMatrix(matrix)
    const conceptos = rows.map(r => r.concepto)
    expect(conceptos).not.toContain('Otra sección')
  })

  it('devuelve array vacío si no hay fila de encabezado', () => {
    const noHeader: unknown[][] = [
      [null, 'Sin cabecera', null, null, null],
      [null, 'Educación', 0, 100, 100],
    ]
    expect(parseSgpResumenMatrix(noHeader)).toEqual([])
  })
})
