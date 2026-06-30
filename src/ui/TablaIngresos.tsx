import type { FilaIngreso } from '../types'
import { DataTable, type Column } from './DataTable'
import { fmtMoneda2, fmtPct } from './format'

const money = (v: unknown) => fmtMoneda2(v as number)

const COLUMNAS: Column<FilaIngreso>[] = [
  { key: 'rubro', label: 'Rubro', nowrap: true },
  { key: 'nombre', label: 'Nombre' },
  { key: 'unidadEjec', label: 'Unidad Ejec.' },
  { key: 'fuentes', label: 'Fuentes' },
  { key: 'atributo', label: 'Atributo' },
  { key: 'pptoInicial', label: 'Ppto Inicial', num: true, format: money },
  { key: 'adiciones', label: 'Adiciones', num: true, format: money },
  { key: 'reducciones', label: 'Reducciones', num: true, format: money },
  { key: 'pptoFinal', label: 'Ppto Final', num: true, format: money },
  { key: 'ingreso', label: 'Ingreso', num: true, format: money },
  { key: 'pctIngreso', label: '% Ingreso', num: true, format: (v) => fmtPct(v as number) },
  { key: 'proyeccion', label: 'Proyección', num: true, format: money },
]

export function TablaIngresos({ filas }: { filas: FilaIngreso[] }) {
  return (
    <DataTable
      columns={COLUMNAS}
      rows={filas}
      rowKey={(f, i) => `${f.rubro}-${i}`}
      caption="Detalle de ingresos por rubro"
    />
  )
}
