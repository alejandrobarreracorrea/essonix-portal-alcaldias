import type { ReactNode } from 'react'
import type { FilaTraslado } from '../types'
import { Badge, Card, StatTile } from './kit'
import { DataTable, type Column } from './DataTable'
import { fmtMoneda } from './format'
import { VERDE, ROJO } from './trafficLight'

const money = (v: unknown) => fmtMoneda(v as number)

/** Diferencia coloreada: 0 = verde (equilibrado), ≠0 = clay (revisar). */
function difCell(v: number): ReactNode {
  const color = v === 0 ? VERDE : ROJO
  return <span className="num font-semibold" style={{ color }}>{fmtMoneda(v)}</span>
}

export function PanelTraslados({
  filas,
  total,
}: {
  filas: FilaTraslado[]
  total: number
}) {
  const sumaDiferencia = filas.reduce((acc, f) => acc + f.diferencia, 0)
  const equilibrado = Math.abs(sumaDiferencia) < 1

  const cols: Column<FilaTraslado>[] = [
    { key: 'fuente', label: 'Fuente' },
    { key: 'creditos', label: 'Créditos', num: true, format: money },
    { key: 'contracreditos', label: 'Contracréditos', num: true, format: money },
    { key: 'diferencia', label: 'Diferencia', num: true, format: (v) => difCell(v as number) },
  ]

  return (
    <section className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatTile label="Total de traslados (créditos)" value={fmtMoneda(total)} />
        <StatTile
          label="Equilibrio de traslados"
          tone="gold"
          accentColor={equilibrado ? VERDE : ROJO}
          valueColor={equilibrado ? VERDE : ROJO}
          value={equilibrado ? 'Equilibrado' : 'Revisar'}
          mono={false}
          delta={`Σ diferencia ${fmtMoneda(sumaDiferencia)}`}
          deltaTone={equilibrado ? 'up' : 'down'}
        />
      </div>

      <Card
        kicker="Créditos / Contracréditos"
        title="Traslados presupuestales por fuente"
        action={
          equilibrado ? (
            <Badge tone="ok">Equilibrado</Badge>
          ) : (
            <Badge tone="alert">Revisar</Badge>
          )
        }
      >
        <DataTable
          columns={cols}
          rows={filas}
          rowKey={(r, i) => `${r.fuente}-${i}`}
          caption="Detalle de traslados por fuente"
        />
      </Card>
    </section>
  )
}
