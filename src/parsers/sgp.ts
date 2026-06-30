import * as XLSX from 'xlsx'
import { sheetToMatrix, text, num } from './sheet'

/** Lee solo los nombres de hoja del archivo SGP (SICODIS), sin parsear celdas. */
export async function readSgpSheetNames(file: File): Promise<string[]> {
  const buf = await file.arrayBuffer()
  const wb = XLSX.read(buf, { type: 'array', bookSheets: true })
  return wb.SheetNames
}

export type SgpResumenRow = {
  concepto: string
  ultima: number
  once: number
  total: number
}

/**
 * Localiza la fila de encabezado donde col B (índice 1) === 'Concepto',
 * luego extrae filas de datos (concepto=col B, ultima/once/total=cols C/D/E)
 * hasta la fila cuyo concepto === 'Total SGP' inclusive.
 * Omite filas completamente vacías (sin concepto).
 */
export function parseSgpResumenMatrix(matrix: unknown[][]): SgpResumenRow[] {
  // Find the header row where col B (index 1) === 'Concepto'
  const headerIdx = matrix.findIndex(row => text(row[1]) === 'Concepto')
  if (headerIdx === -1) return []

  const result: SgpResumenRow[] = []

  for (let i = headerIdx + 1; i < matrix.length; i++) {
    const row = matrix[i]
    const concepto = text(row[1])

    // Skip fully-empty rows (no concepto)
    if (concepto === '') continue

    result.push({
      concepto,
      ultima: num(row[2]),
      once: num(row[3]),
      total: num(row[4]),
    })

    // Stop after 'Total SGP' (inclusive)
    if (concepto === 'Total SGP') break
  }

  return result
}

/**
 * Lee el archivo SICODIS SGP, toma la hoja 'Datos Reporte SGP',
 * convierte a matriz y aplica parseSgpResumenMatrix.
 */
export async function parseSgpResumenFile(file: File): Promise<SgpResumenRow[]> {
  const buf = await file.arrayBuffer()
  const wb = XLSX.read(buf, { type: 'array' })
  const ws = wb.Sheets['Datos Reporte SGP']
  if (!ws) return []
  const matrix = sheetToMatrix(ws)
  return parseSgpResumenMatrix(matrix)
}
