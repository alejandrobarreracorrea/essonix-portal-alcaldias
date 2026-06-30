import type { IndicadorDnp, IndicadorLey617, IndicadoresDnp } from '../types'
import { Badge, Card } from './kit'
import { Gauge } from './Gauge'
import { EstadoChip } from './EstadoChip'
import { nivelIndicador } from './estado'
import { fmtMoneda, fmtPct } from './format'

const PENDIENTES: { titulo: string; formula: string }[] = [
  { titulo: '2. Respaldo del servicio de la deuda', formula: '(Servicio de la deuda / Ingresos disponibles) × 100' },
  { titulo: '3. Dependencia de las transferencias de la Nación y las Regalías', formula: '(Transferencias de la Nación + Regalías SGR) / Ingresos totales' },
  { titulo: '6. Capacidad de ahorro', formula: 'Ahorro corriente / Ingresos corrientes' },
]

function IndicadorDnpCard({
  titulo,
  formula,
  indicador,
}: {
  titulo: string
  formula: string
  indicador: IndicadorDnp
}) {
  return (
    <div className="rounded-card border border-line bg-surface p-5 shadow-card">
      <p className="mb-1 font-semibold leading-snug text-ink">{titulo}</p>
      <p className="text-xs text-ink-soft">{formula}</p>
      <div className="num mt-3 text-3xl font-semibold leading-none text-ink">
        {fmtPct(indicador.valor)}
      </div>
      <div className="mt-2 space-y-0.5 text-xs text-ink-soft">
        <div>
          <span className="font-mono">{indicador.numeradorLabel}:</span>{' '}
          <span className="num">{fmtMoneda(indicador.numerador)}</span>
        </div>
        <div>
          <span className="font-mono">{indicador.denominadorLabel}:</span>{' '}
          <span className="num">{fmtMoneda(indicador.denominador)}</span>
        </div>
      </div>
      <p className="mt-2 text-[11px] italic text-ink-soft">
        {indicador.baseNota} · Metodología DNP — sujeto a confirmación.
      </p>
    </div>
  )
}

function PendienteCard({ titulo, formula }: { titulo: string; formula: string }) {
  return (
    <div className="rounded-card border border-dashed border-line bg-surface/60 p-5">
      <div className="mb-3 flex items-start justify-between gap-3">
        <p className="font-semibold leading-snug text-ink">{titulo}</p>
        <div className="shrink-0">
          <Badge tone="gold">No calculado en la plantilla</Badge>
        </div>
      </div>
      <p className="text-xs text-ink-soft">{formula}</p>
      <p className="mt-2 text-xs italic text-ink-soft">Requiere fuentes adicionales.</p>
    </div>
  )
}

export function PanelIndicadores({
  indicadorLey617,
  indicadoresExtra,
}: {
  indicadorLey617: IndicadorLey617
  indicadoresExtra?: IndicadoresDnp
}) {
  const estado = nivelIndicador(indicadorLey617.pctGfIcld, indicadorLey617.limite)
  return (
    <section className="space-y-6">
      <Card kicker="Indicador Ley 617" title="1. Autofinanciación de los gastos de funcionamiento">
        <p className="-mt-2 mb-3 text-xs text-ink-soft">
          (Gastos de funcionamiento / ICLD) × 100 — Indicador Ley 617
        </p>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div
            className="num text-5xl font-semibold leading-none"
            style={{ color: estado.color }}
          >
            {fmtPct(indicadorLey617.pctGfIcld)}
          </div>
          <EstadoChip estado={estado} />
        </div>
        <Gauge valor={indicadorLey617.pctGfIcld} limite={indicadorLey617.limite} estado={estado} />
      </Card>

      <div className="grid gap-4 sm:grid-cols-2">
        {/* #2 y #3 — siempre pendientes de insumo */}
        {PENDIENTES.slice(0, 2).map((d) => (
          <PendienteCard key={d.titulo} titulo={d.titulo} formula={d.formula} />
        ))}

        {/* #4 Generación de recursos propios */}
        {indicadoresExtra ? (
          <IndicadorDnpCard
            titulo="4. Generación de recursos propios"
            formula="Ingresos tributarios / Ingresos corrientes"
            indicador={indicadoresExtra.recursosPropios}
          />
        ) : (
          <PendienteCard
            titulo="4. Generación de recursos propios"
            formula="Ingresos tributarios / Ingresos corrientes"
          />
        )}

        {/* #5 Magnitud de la inversión */}
        {indicadoresExtra ? (
          <IndicadorDnpCard
            titulo="5. Magnitud de la inversión"
            formula="Gasto de capital / Gasto total"
            indicador={indicadoresExtra.magnitudInversion}
          />
        ) : (
          <PendienteCard
            titulo="5. Magnitud de la inversión"
            formula="Gasto de capital / Gasto total"
          />
        )}

        {/* #6 — pendiente de insumo */}
        <PendienteCard titulo={PENDIENTES[2].titulo} formula={PENDIENTES[2].formula} />
      </div>
    </section>
  )
}
