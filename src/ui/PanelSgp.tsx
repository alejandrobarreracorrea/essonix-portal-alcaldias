import type { ReactNode } from 'react'
import type { FilaSgp } from '../types'
import { Card, StatTile } from './kit'
import { fmtMoneda, fmtPct } from './format'
import { colorPorNivel, pctEjecucionGlobalSgp } from './trafficLight'

/** Celda de % con punto de color semáforo (mayor = mejor). Null → vacío. */
function pctCell(p: number | null): ReactNode {
  if (p == null) return null
  const color = colorPorNivel(p)
  return (
    <span className="inline-flex items-center justify-end gap-1.5">
      <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: color }} aria-hidden />
      <span style={{ color }}>{fmtPct(p)}</span>
    </span>
  )
}

/** Cifra mono; null → vacío. */
function num(n: number | null): ReactNode {
  if (n == null) return null
  return <span className="num tabular-nums">{fmtMoneda(n)}</span>
}

type ColAlign = 'left' | 'right'
const COLS: { label: string; align: ColAlign }[] = [
  { label: 'Concepto', align: 'left' },
  { label: 'Última Doceava', align: 'right' },
  { label: 'Once Doceavas', align: 'right' },
  { label: 'Total', align: 'right' },
  { label: 'Presupuesto', align: 'right' },
  { label: 'Diferencia', align: 'right' },
  { label: 'Observación', align: 'left' },
  { label: 'Recaudo', align: 'right' },
  { label: '% Recaudo', align: 'right' },
  { label: 'Compromisos', align: 'right' },
  { label: '% Ejecución', align: 'right' },
]

export function PanelSgp({ filas }: { filas: FilaSgp[] }) {
  const totalRow = filas.find((f) => f.tipo === 'total')
  const totalSgp = totalRow?.total ?? 0

  // % ejecución global: Σ compromisos / Σ total sobre filas con compromisos != null && total > 0.
  let sumComp = 0
  for (const f of filas) {
    if (f.compromisos != null && f.total > 0) {
      sumComp += f.compromisos
    }
  }
  const pctEjecGlobal = pctEjecucionGlobalSgp(filas)

  return (
    <section className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatTile label="Total SGP (corte)" value={fmtMoneda(totalSgp)} />
        <StatTile
          label="Ejecución global SGP"
          tone="gold"
          accentColor={colorPorNivel(pctEjecGlobal)}
          valueColor={colorPorNivel(pctEjecGlobal)}
          value={fmtPct(pctEjecGlobal)}
          delta={`${fmtMoneda(sumComp)} comprometidos`}
        />
      </div>

      <Card kicker="Sistema General de Participaciones" title="Seguimiento SGP">
        <div
          className="scroll-fino overflow-auto rounded-card border border-line bg-surface"
          style={{ maxHeight: '70vh' }}
        >
          <table className="w-full border-collapse text-sm">
            <caption className="sr-only">Ficha de seguimiento del SGP por concepto</caption>
            <thead className="sticky top-0 z-10">
              <tr className="bg-forest-deep">
                {COLS.map((c) => (
                  <th
                    key={c.label}
                    scope="col"
                    className={[
                      'whitespace-nowrap px-3 py-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-paper/90',
                      c.align === 'right' ? 'text-right' : 'text-left',
                    ].join(' ')}
                  >
                    {c.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filas.map((f) => {
                const enfasis = f.tipo === 'grupo' || f.tipo === 'total'
                return (
                  <tr
                    key={f.fila}
                    className={[
                      'border-b border-line transition-colors hover:bg-surface-2',
                      f.tipo === 'total' ? 'bg-surface-2' : 'odd:bg-surface even:bg-surface-2',
                    ].join(' ')}
                  >
                    <td
                      className={[
                        'whitespace-nowrap px-3 py-2.5 text-ink',
                        enfasis ? 'font-semibold' : 'font-medium',
                      ].join(' ')}
                      style={{ paddingLeft: `${0.75 + f.indent * 1.25}rem` }}
                    >
                      {f.concepto}
                    </td>
                    {[f.ultima, f.once, f.total].map((v, i) => (
                      <td
                        key={i}
                        className={['px-3 py-2.5 text-right text-ink', enfasis ? 'font-semibold' : ''].join(' ')}
                      >
                        {num(v)}
                      </td>
                    ))}
                    <td className={['px-3 py-2.5 text-right text-ink', enfasis ? 'font-semibold' : ''].join(' ')}>
                      {num(f.presupuesto)}
                    </td>
                    <td className={['px-3 py-2.5 text-right text-ink', enfasis ? 'font-semibold' : ''].join(' ')}>
                      {num(f.diferencia)}
                    </td>
                    <td className="px-3 py-2.5 text-left text-ink-soft">{f.observacion ?? null}</td>
                    <td className={['px-3 py-2.5 text-right text-ink', enfasis ? 'font-semibold' : ''].join(' ')}>
                      {num(f.recaudo)}
                    </td>
                    <td className="px-3 py-2.5 text-right num tabular-nums">{pctCell(f.pctRecaudo)}</td>
                    <td className={['px-3 py-2.5 text-right text-ink', enfasis ? 'font-semibold' : ''].join(' ')}>
                      {num(f.compromisos)}
                    </td>
                    <td className="px-3 py-2.5 text-right num tabular-nums">{pctCell(f.pctEjecucion)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </section>
  )
}
