import type { FilaGasto } from '../types'
import { DataTable, type Column } from './DataTable'
import { fmtMoneda2 } from './format'

const money = (v: unknown) => fmtMoneda2(v as number)

const COLUMNAS: Column<FilaGasto>[] = [
  { key: 'rubro', label: 'Rubro', nowrap: true },
  { key: 'descripcion', label: 'Descripción' },
  { key: 'unidadEjec', label: 'Unidad Ejec.' },
  { key: 'fuentes', label: 'Fuentes' },
  { key: 'cpi', label: 'CPI' },
  { key: 'atributo', label: 'Atributo' },
  { key: 'pptoInicial', label: 'Ppto Inicial', num: true, format: money },
  { key: 'pptoFinal', label: 'Ppto Final', num: true, format: money },
  { key: 'disponibilidades', label: 'Disponibilidades', num: true, format: money },
  { key: 'saldoDisponible', label: 'Saldo Disponible', num: true, format: money },
  { key: 'registros', label: 'Registros', num: true, format: money },
  { key: 'saldoDisponibilidades', label: 'Saldo Disp.', num: true, format: money },
  { key: 'ordenPago', label: 'Orden de Pago', num: true, format: money },
  { key: 'saldoRegistro', label: 'Saldo Registro', num: true, format: money },
  { key: 'egresos', label: 'Egresos', num: true, format: money },
  { key: 'egresosPapeles', label: 'Egresos Papeles', num: true, format: money },
  { key: 'saldoOrdenesPago', label: 'Saldo Órd. Pago', num: true, format: money },
]

export function TablaGastos({ filas }: { filas: FilaGasto[] }) {
  return (
    <DataTable
      columns={COLUMNAS}
      rows={filas}
      rowKey={(f, i) => `${f.rubro}-${i}`}
      caption="Detalle de gastos por rubro"
    />
  )
}
