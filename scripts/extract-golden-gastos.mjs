import { createRequire } from 'node:module'
import { writeFileSync } from 'node:fs'
const require = createRequire(import.meta.url)
const XLSX = require('xlsx')

const TEMPLATE = process.env.TEMPLATE ??
  '/Users/alejandro/Documents/DocumentosProyectoGobierno/1. Análisis Ejecución de Ingresos y Gastos Fuentes y Usos V2025 Corte 31-05-2026 Briceño.xlsx'

const text = (v) => (v == null ? '' : String(v).trim())
const raw = (v) => (v == null ? '' : String(v)) // sin trim: columnas calculadas byte-exact
const num = (v) => (typeof v === 'number' ? v : v == null || v === '' ? 0 : Number(v))

const wb = XLSX.readFile(TEMPLATE)
const ws = wb.Sheets['Análisis de Gastos']
if (!ws) {
  console.error('No se encontró la hoja "Análisis de Gastos"')
  process.exit(1)
}
const m = XLSX.utils.sheet_to_json(ws, { header: 1, raw: true, defval: null })

// índices base 0: A0 extrae, B1 columna1, C2 concat, D3 rubro, E4 descripcion,
// F5 cpc, G6 unidadEjec, H7 programatico, I8 fuentes, J9 cpi, K10 atributo,
// L11 pptoInicial, M12 pptoFinal, N13 disponibilidades, O14 saldoDisponible,
// P15 registros, Q16 saldoDisponibilidades, R17 ordenPago, S18 saldoRegistro,
// T19 egresos, U20 egresosPapeles, V21 saldoOrdenesPago
const out = []
for (let r = 1; r < m.length; r++) {
  const row = m[r] ?? []
  const rubro = text(row[3])
  if (rubro === '') break
  out.push({
    extrae: raw(row[0]), columna1: raw(row[1]), concat: raw(row[2]),
    rubro, descripcion: text(row[4]), cpc: text(row[5]), unidadEjec: text(row[6]),
    programatico: text(row[7]), fuentes: text(row[8]), cpi: text(row[9]), atributo: text(row[10]),
    pptoInicial: num(row[11]), pptoFinal: num(row[12]), disponibilidades: num(row[13]),
    saldoDisponible: num(row[14]), registros: num(row[15]), saldoDisponibilidades: num(row[16]),
    ordenPago: num(row[17]), saldoRegistro: num(row[18]), egresos: num(row[19]),
    egresosPapeles: num(row[20]), saldoOrdenesPago: num(row[21]),
  })
}
writeFileSync('tests/golden/gastos.expected.json', JSON.stringify(out, null, 2))
console.log('wrote', out.length, 'filas a tests/golden/gastos.expected.json')
