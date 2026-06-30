import {
  Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts'
import type { TooltipValueType } from 'recharts'
import type { FilaFuenteUso, FilaGasto, FilaIngreso, IndicadorLey617 } from '../types'
import { cascadaGastos, composicionGastos, kpisResumen, topFuentesPorRecaudo } from '../engine/resumen'
import { Card, StatTile } from './kit'
import { AXIS, CHART_COLORS, GRID, TOOLTIP_STYLE } from './charts'
import { nivelIndicador } from './estado'
import { fmtMill, fmtMoneda, fmtPct, truncar } from './format'

const fmtTooltip = (v: TooltipValueType | undefined) =>
  typeof v === 'number' ? fmtMoneda(v) : String(v ?? '')

const LEGEND_STYLE = { fontSize: 12, color: 'var(--ink)' } as const
const LABEL_STYLE = { color: 'var(--ink)', fontWeight: 600 } as const
const ITEM_STYLE = { color: 'var(--ink)', fontFamily: '"Spline Sans Mono", monospace' } as const

export function PanelResumen({
  filasIngreso, filasGasto, filasFuenteUso, indicadorLey617,
}: {
  filasIngreso: FilaIngreso[]
  filasGasto: FilaGasto[]
  filasFuenteUso: FilaFuenteUso[]
  indicadorLey617?: IndicadorLey617
}) {
  const k = kpisResumen(filasIngreso, filasGasto, indicadorLey617)
  const cascada = cascadaGastos(filasGasto)
  const composicion = composicionGastos(filasGasto)
  const topFuentes = topFuentesPorRecaudo(filasFuenteUso, 10)
  const estado617 = indicadorLey617
    ? nivelIndicador(indicadorLey617.pctGfIcld, indicadorLey617.limite)
    : null

  return (
    <section className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile label="Recaudo de ingresos" value={fmtMoneda(k.ingresoRecaudo)} delta={`${fmtPct(k.pctIngreso)} del ppto final`} />
        <StatTile label="Compromisos de gastos" value={fmtMoneda(k.gastoCompromisos)} delta={`${fmtPct(k.pctCompromiso)} del ppto final`} />
        <StatTile label="Pagos (egresos)" value={fmtMoneda(k.gastoPagos)} />
        <StatTile
          label="Ley 617 (GF/ICLD)"
          tone="gold"
          accentColor={estado617?.color}
          valueColor={estado617?.color}
          value={k.ley617Pct != null ? fmtPct(k.ley617Pct) : '—'}
          delta={k.ley617Cumple ?? undefined}
          deltaTone={k.ley617Cumple === 'Cumple' ? 'up' : 'down'}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card kicker="Ejecución" title="Ejecución de gastos (millones)">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={cascada} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid stroke={GRID} strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="etapa" tick={{ fontSize: 11, fill: AXIS }} stroke={GRID} />
              <YAxis tickFormatter={fmtMill} tick={{ fontSize: 11, fill: AXIS }} stroke={GRID} width={56} />
              <Tooltip formatter={fmtTooltip} contentStyle={TOOLTIP_STYLE} labelStyle={LABEL_STYLE} itemStyle={ITEM_STYLE} cursor={{ fill: 'rgba(14,92,70,.06)' }} />
              <Bar dataKey="valor" name="Valor" fill={CHART_COLORS[0]} radius={[4, 4, 0, 0]} maxBarSize={64} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card kicker="Composición" title="Composición de gastos (compromisos)">
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={composicion} dataKey="valor" nameKey="seccion" outerRadius={90} innerRadius={48} paddingAngle={2} stroke="var(--surface)" strokeWidth={2}>
                {composicion.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
              </Pie>
              <Tooltip formatter={fmtTooltip} contentStyle={TOOLTIP_STYLE} labelStyle={LABEL_STYLE} itemStyle={ITEM_STYLE} />
              <Legend wrapperStyle={LEGEND_STYLE} />
            </PieChart>
          </ResponsiveContainer>
        </Card>
      </div>

      <Card kicker="Recaudo" title="Top 10 fuentes por recaudo (millones)">
        <ResponsiveContainer width="100%" height={Math.max(240, topFuentes.length * 38)}>
          <BarChart data={topFuentes} layout="vertical" margin={{ top: 8, right: 16, left: 8, bottom: 0 }}>
            <CartesianGrid stroke={GRID} strokeDasharray="3 3" horizontal={false} />
            <XAxis type="number" tickFormatter={fmtMill} tick={{ fontSize: 11, fill: AXIS }} stroke={GRID} />
            <YAxis
              type="category"
              dataKey="fuente"
              width={250}
              interval={0}
              tick={{ fontSize: 11, fill: AXIS }}
              stroke={GRID}
              tickFormatter={(v: string) => truncar(v, 34)}
            />
            <Tooltip formatter={fmtTooltip} contentStyle={TOOLTIP_STYLE} labelStyle={LABEL_STYLE} itemStyle={ITEM_STYLE} cursor={{ fill: 'rgba(14,92,70,.06)' }} />
            <Bar dataKey="recaudo" name="Recaudo" fill={CHART_COLORS[0]} radius={[0, 4, 4, 0]} maxBarSize={22} />
          </BarChart>
        </ResponsiveContainer>
      </Card>
    </section>
  )
}
