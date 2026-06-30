import { writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
const XLSX = createRequire(import.meta.url)('xlsx')

const TEMPLATE =
  process.env.TEMPLATE ??
  '/Users/alejandro/Documents/DocumentosProyectoGobierno/1. Análisis Ejecución de Ingresos y Gastos Fuentes y Usos V2025 Corte 31-05-2026 Briceño.xlsx'

const wb = XLSX.readFile(TEMPLATE)
const ws = wb.Sheets['Seguimiento SGP']
if (!ws) {
  console.error('ERROR: No se encontró la hoja "Seguimiento SGP"')
  console.error('Hojas disponibles:', wb.SheetNames)
  process.exit(1)
}

// header:1, raw:true reads cached (display) values; defval:null → empty cells are null
const m = XLSX.utils.sheet_to_json(ws, { header: 1, raw: true, defval: null })

const numOrNull = (v) => (typeof v === 'number' ? v : null)

const out = []
for (let fila = 16; fila <= 37; fila++) {
  const row = m[fila - 1] ?? []
  out.push({
    fila,
    presupuesto: numOrNull(row[6]),  // col G = index 6
    recaudo: numOrNull(row[9]),      // col J = index 9
    compromisos: numOrNull(row[11]), // col L = index 11
  })
}

// Spot-check
const f19 = out.find((r) => r.fila === 19)
const f27 = out.find((r) => r.fila === 27)
const f30 = out.find((r) => r.fila === 30)
console.log('fila19 presupuesto =', f19?.presupuesto, '(expected 132574890)')
console.log('fila27 presupuesto =', f27?.presupuesto, '(expected 2742015215)')
console.log('fila27 recaudo     =', f27?.recaudo, '(expected 1083338192)')
console.log('fila30 compromisos =', f30?.compromisos, '(expected 1774921458.18)')
console.log()
console.log('All extracted rows:')
out.forEach((r) => console.log(JSON.stringify(r)))

writeFileSync('tests/golden/sgp.expected.json', JSON.stringify(out, null, 2))
console.log('\nWrote', out.length, 'filas a tests/golden/sgp.expected.json')
