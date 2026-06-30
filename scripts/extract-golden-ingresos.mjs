import { writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
const XLSX = createRequire(import.meta.url)('xlsx')

const TEMPLATE =
  process.env.TEMPLATE ??
  '/Users/alejandro/Documents/DocumentosProyectoGobierno/1. Análisis Ejecución de Ingresos y Gastos Fuentes y Usos V2025 Corte 31-05-2026 Briceño.xlsx'

const text = (v) => (v == null ? '' : String(v).trim())
const num = (v) => (typeof v === 'number' ? v : v == null || v === '' ? 0 : Number(v))

const wb = XLSX.readFile(TEMPLATE)
const ws = wb.Sheets['Análisis de Ingresos']
if (!ws) {
  console.error('ERROR: No se encontró la hoja "Análisis de Ingresos"')
  console.error('Hojas disponibles:', wb.SheetNames)
  process.exit(1)
}
const m = XLSX.utils.sheet_to_json(ws, { header: 1, raw: true, defval: null })

// columnas (base 0): C=2 columna3, D=3 rubro, E=4 nombre, F=5 unidadEjec,
// G=6 fuentes, H=7 atributo, I=8 pptoInicial, J=9 adiciones, K=10 reducciones,
// L=11 pptoFinal, M=12 ingreso, N=13 pctIngreso, O=14 proyeccion, P=15 observaciones
const out = []
for (let r = 1; r < m.length; r++) {
  const row = m[r] ?? []
  const rubro = text(row[3])
  if (rubro === '') break
  out.push({
    columna3: row[2] == null ? '' : String(row[2]),
    rubro,
    nombre: text(row[4]),
    unidadEjec: text(row[5]),
    fuentes: text(row[6]),
    atributo: text(row[7]),
    pptoInicial: num(row[8]),
    adiciones: num(row[9]),
    reducciones: num(row[10]),
    pptoFinal: num(row[11]),
    ingreso: num(row[12]),
    pctIngreso: num(row[13]),
    proyeccion: num(row[14]),
    observaciones: text(row[15]),
  })
}
writeFileSync('tests/golden/ingresos.expected.json', JSON.stringify(out, null, 2))
console.log('wrote', out.length, 'filas a tests/golden/ingresos.expected.json')
