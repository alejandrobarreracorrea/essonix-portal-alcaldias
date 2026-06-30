import {
  Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts'
import type { TooltipValueType } from 'recharts'
import type { FilaSector } from '../types'
import { Card } from './kit'
import { DataTable, type Column } from './DataTable'
import { AXIS, CHART_COLORS, GRID, TOOLTIP_STYLE } from './charts'
import { fmtMill, fmtMoneda, truncar } from './format'
import { pctEjecCell } from './trafficLight'

const fmtTooltip = (v: TooltipValueType | undefined) =>
  typeof v === 'number' ? fmtMoneda(v) : String(v ?? '')

const LABEL_STYLE = { color: 'var(--ink)', fontWeight: 600 } as const
const ITEM_STYLE = { color: 'var(--ink)', fontFamily: '"Spline Sans Mono", monospace' } as const

const money = (v: unknown) => fmtMoneda(v as number)

export function PanelSectores({ filas }: { filas: FilaSector[] }) {
  const chartData = filas.map((f) => ({ sector: f.sector, pptoFinal: f.pptoFinal }))

  const cols: Column<FilaSector>[] = [
    { key: 'sector', label: 'Sector', format: (v) => truncar(v as string, 48) },
    { key: 'pptoFinal', label: 'Ppto Final', num: true, format: money },
    { key: 'registros', label: 'Registros', num: true, format: money },
    { key: 'ejecucion', label: '% Ejecución', num: true, format: (v) => pctEjecCell(v as number) },
    { key: 'saldoDisponible', label: 'Saldo Disponible', num: true, format: money },
  ]

  return (
    <section className="space-y-6">
      <Card kicker="Inversión (rubro 2.3)" title="Inversión por sector (ppto final)">
        <ResponsiveContainer width="100%" height={Math.max(260, chartData.length * 34)}>
          <BarChart data={chartData} layout="vertical" margin={{ top: 8, right: 16, left: 8, bottom: 0 }}>
            <CartesianGrid stroke={GRID} strokeDasharray="3 3" horizontal={false} />
            <XAxis type="number" tickFormatter={fmtMill} tick={{ fontSize: 11, fill: AXIS }} stroke={GRID} />
            <YAxis
              type="category"
              dataKey="sector"
              width={220}
              interval={0}
              tick={{ fontSize: 11, fill: AXIS }}
              stroke={GRID}
              tickFormatter={(v: string) => truncar(v, 30)}
            />
            <Tooltip formatter={fmtTooltip} contentStyle={TOOLTIP_STYLE} labelStyle={LABEL_STYLE} itemStyle={ITEM_STYLE} cursor={{ fill: 'rgba(14,92,70,.06)' }} />
            <Bar dataKey="pptoFinal" name="Ppto final" radius={[0, 4, 4, 0]} maxBarSize={22}>
              {chartData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </Card>

      <Card kicker="Detalle por sector" title="Inversión por sectores">
        <DataTable
          columns={cols}
          rows={filas}
          rowKey={(r) => r.codigo}
          caption="Inversión por sector del gasto"
        />
      </Card>
    </section>
  )
}
