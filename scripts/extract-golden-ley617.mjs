import { createRequire } from 'node:module'
import { writeFileSync } from 'node:fs'
const require = createRequire(import.meta.url)
const XLSX = require('xlsx')

const TEMPLATE = process.env.TEMPLATE ??
  '/Users/alejandro/Documents/DocumentosProyectoGobierno/1. Análisis Ejecución de Ingresos y Gastos Fuentes y Usos V2025 Corte 31-05-2026 Briceño.xlsx'

const wb = XLSX.readFile(TEMPLATE)
const ws = wb.Sheets['Ley 617']
if (!ws) { console.error('No se encontró la hoja "Ley 617"'); process.exit(1) }
const cell = (addr) => { const c = ws[addr]; return c == null ? null : c.v }

const out = {
  icldPropio: cell('H6'),
  sgpLibreDest: cell('H7'),
  totalIcld: cell('H8'),
  funcAdminCentral: cell('G11'),
  concejo: cell('G12'),
  personeria: cell('G13'),
  gfTotal: cell('G14'),
  baseAdmin: cell('H18'),
  dedSobretasaAmb: cell('H19'),
  dedSobretasaBomb: cell('H20'),
  dedSeguridadConc: cell('H21'),
  dedSeguroVida: cell('H22') ?? 0,
  dedPolizaSalud: cell('H23') ?? 0,
  dedTransporteConc: cell('H24'),
  dedDeficit: cell('H25') ?? 0,
  dedCuotasPartes: cell('H26'),
  dedMesadas: cell('H27'),
  dedColjuegos: cell('H28'),
  totalAdminDepurado: cell('H32'),
  pctGfIcld: cell('H34'),
  limite: cell('H35'),
  diferencial: cell('H36'),
  cumplimiento: cell('H37'),
}
writeFileSync('tests/golden/ley617.expected.json', JSON.stringify(out, null, 2))
console.log('wrote tests/golden/ley617.expected.json:', JSON.stringify(out))
