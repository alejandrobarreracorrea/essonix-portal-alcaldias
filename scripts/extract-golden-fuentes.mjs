import { createRequire } from 'node:module'
import { writeFileSync } from 'node:fs'
const require = createRequire(import.meta.url)
const XLSX = require('xlsx')

const TEMPLATE = process.env.TEMPLATE ??
  '/Users/alejandro/Documents/DocumentosProyectoGobierno/1. Análisis Ejecución de Ingresos y Gastos Fuentes y Usos V2025 Corte 31-05-2026 Briceño.xlsx'

const text = (v) => (v == null ? '' : String(v).trim())
const num = (v) => (typeof v === 'number' ? v : v == null || v === '' ? 0 : Number(v))

const wb = XLSX.readFile(TEMPLATE)
const ws = wb.Sheets['Fuentes y Usos']
if (!ws) { console.error('No se encontró la hoja "Fuentes y Usos"'); process.exit(1) }
const m = XLSX.utils.sheet_to_json(ws, { header: 1, raw: true, defval: null })

// idx: 2=codigo(C col3), 3=descripcionFuente(D col4), 4=piIngresos(E), 5=pfIngresos(F),
// 6=piGastos(G), 7=pfGastos(H), 8=difPptoInicial(I), 9=difPptoFinal(J), 10=recaudo(K),
// 11=pctRecaudo(L), 12=disponibilidades(M), 13=compromisos(N), 14=pctCompromisos(O),
// 15=obligaciones(P), 16=pagos(Q), 17=saldoPresupuesto(R), 18=dispSinCompromiso(S),
// 19=reservas(T), 20=cuentasPorPagar(U), 21=superavitDeficit(V), 22=observaciones(W col23), 23=ecb(X col24)
const out = []
for (let r = 3; r < m.length; r++) {
  const row = m[r] ?? []
  const descripcionFuente = text(row[3])
  if (descripcionFuente === '') break
  out.push({
    codigo: row[2] ?? null, descripcionFuente,
    piIngresos: num(row[4]), pfIngresos: num(row[5]), piGastos: num(row[6]), pfGastos: num(row[7]),
    difPptoInicial: num(row[8]), difPptoFinal: num(row[9]), recaudo: num(row[10]), pctRecaudo: num(row[11]),
    disponibilidades: num(row[12]), compromisos: num(row[13]), pctCompromisos: num(row[14]),
    obligaciones: num(row[15]), pagos: num(row[16]), saldoPresupuesto: num(row[17]),
    dispSinCompromiso: num(row[18]), reservas: num(row[19]), cuentasPorPagar: num(row[20]),
    superavitDeficit: num(row[21]), observaciones: text(row[22]), ecb: num(row[23]),
  })
}
writeFileSync('tests/golden/fuentes.expected.json', JSON.stringify(out, null, 2))
console.log('wrote', out.length, 'filas a tests/golden/fuentes.expected.json')
