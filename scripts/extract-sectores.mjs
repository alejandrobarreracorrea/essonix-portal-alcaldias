import { createRequire } from 'node:module'
import { writeFileSync } from 'node:fs'
const require = createRequire(import.meta.url)
const XLSX = require('xlsx')

const TEMPLATE = process.env.TEMPLATE ??
  '/Users/alejandro/Documents/DocumentosProyectoGobierno/1. Análisis Ejecución de Ingresos y Gastos Fuentes y Usos V2025 Corte 31-05-2026 Briceño.xlsx'

const text = (v) => (v == null ? '' : String(v).trim())

const wb = XLSX.readFile(TEMPLATE)
const ws = wb.Sheets['Clasificador Prog. Inversion']
if (!ws) { console.error('No se encontró la hoja "Clasificador Prog. Inversion"'); process.exit(1) }
const m = XLSX.utils.sheet_to_json(ws, { header: 1, raw: true, defval: null })

const out = []
for (let r = 0; r < m.length; r++) {
  const row = m[r] ?? []
  if (text(row[2]) === 'Sector') {
    out.push({ codigo: text(row[0]), nombre: text(row[1]) })
  }
}

writeFileSync('src/data/sectores.json', JSON.stringify(out, null, 2))
console.log('wrote', out.length, 'sectores a src/data/sectores.json')

const justicia = out.find((s) => s.codigo === '12')
if (justicia) {
  console.log('12 →', justicia.nombre)
} else {
  console.warn('AVISO: no se encontró el sector con código "12"')
}
