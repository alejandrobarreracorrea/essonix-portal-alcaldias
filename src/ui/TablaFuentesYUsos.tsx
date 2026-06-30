import type { FilaFuenteUso } from '../types'
import { DataTable, type Column } from './DataTable'
import { fmtMoneda2, fmtPct } from './format'

const money = (v: unknown) => fmtMoneda2(v as number)
const pct = (v: unknown) => fmtPct(v as number)

const COLUMNAS: Column<FilaFuenteUso>[] = [
  { key: 'descripcionFuente', label: 'Fuente', nowrap: true },
  { key: 'pfIngresos', label: 'Ppto Final Ingresos', num: true, format: money },
  { key: 'pfGastos', label: 'Ppto Final Gastos', num: true, format: money },
  { key: 'recaudo', label: 'Recaudo', num: true, format: money },
  { key: 'pctRecaudo', label: '% Recaudo', num: true, format: pct },
  { key: 'disponibilidades', label: 'Disponibilidades', num: true, format: money },
  { key: 'compromisos', label: 'Compromisos', num: true, format: money },
  { key: 'pctCompromisos', label: '% Compromisos', num: true, format: pct },
  { key: 'obligaciones', label: 'Obligaciones', num: true, format: money },
  { key: 'pagos', label: 'Pagos', num: true, format: money },
  { key: 'reservas', label: 'Reservas', num: true, format: money },
  { key: 'cuentasPorPagar', label: 'Cuentas por Pagar', num: true, format: money },
  { key: 'superavitDeficit', label: 'Superávit/Déficit', num: true, format: money },
  { key: 'ecb', label: 'ECB', num: true, format: money },
]

export function TablaFuentesYUsos({ filas }: { filas: FilaFuenteUso[] }) {
  return (
    <DataTable
      columns={COLUMNAS}
      rows={filas}
      rowKey={(f, i) => `${f.descripcionFuente}-${i}`}
      caption="Fuentes y usos de recursos"
    />
  )
}
