import { createRequire } from 'node:module'
import { writeFileSync } from 'node:fs'
const require = createRequire(import.meta.url)
const XLSX = require('xlsx')

const TEMPLATE = process.env.TEMPLATE ??
  '/Users/alejandro/Documents/DocumentosProyectoGobierno/1. Análisis Ejecución de Ingresos y Gastos Fuentes y Usos V2025 Corte 31-05-2026 Briceño.xlsx'

const text = (v) => (v == null ? '' : String(v).trim())

const wb = XLSX.readFile(TEMPLATE)
const ws = wb.Sheets['Fuentes y Usos']
if (!ws) { console.error('No se encontró la hoja "Fuentes y Usos"'); process.exit(1) }
const m = XLSX.utils.sheet_to_json(ws, { header: 1, raw: true, defval: null })

// Encabezado en fila 3 (m[2]); datos desde fila 4 (m[3]). col3=Código=idx2, col4=Descripción=idx3.
const out = []
for (let r = 3; r < m.length; r++) {
  const row = m[r] ?? []
  const descripcionFuente = text(row[3])
  if (descripcionFuente === '') break
  out.push({ codigo: row[2] ?? null, descripcionFuente })
}
writeFileSync('src/data/fuentes.json', JSON.stringify(out, null, 2))
console.log('wrote', out.length, 'fuentes a src/data/fuentes.json')
