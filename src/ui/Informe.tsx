import type { ReactNode } from 'react'
import {
  Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts'
import type { TooltipValueType } from 'recharts'
import type { FilaFuenteUso, FilaGasto, FilaIngreso, FilaSector, FilaSgp, FilaTraslado, IndicadorLey617, IndicadoresDnp } from '../types'
import { kpisResumen } from '../engine/resumen'
import { Badge, Kicker, StatTile } from './kit'
import { DataTable, type Column } from './DataTable'
import { Gauge } from './Gauge'
import { EstadoChip } from './EstadoChip'
import { nivelIndicador, type EstadoIndicador } from './estado'
import { AXIS, CHART_COLORS, GRID, TOOLTIP_STYLE } from './charts'
import { fmtMill, fmtMoneda, fmtPct, truncar } from './format'
import {
  distribucionPresupuesto,
  fuentesInsights,
  ingresoInsights,
  type SeccionDistribucion,
} from './informeData'

const money = (v: unknown) => fmtMoneda(v as number)
const pct = (v: unknown) => fmtPct(v as number)

const LEGEND_STYLE = { fontSize: 12, color: 'var(--ink)' } as const
const LABEL_STYLE = { color: 'var(--ink)', fontWeight: 600 } as const
const ITEM_STYLE = { color: 'var(--ink)', fontFamily: '"Spline Sans Mono", monospace' } as const
const fmtTooltip = (v: TooltipValueType | undefined) =>
  typeof v === 'number' ? fmtMoneda(v) : String(v ?? '')

import { colorPorNivel, pctEjecCell, pctEjecucionGlobalSgp, ROJO, VERDE } from './trafficLight'

/* ------------------------------------------------------------------ */
/* Encabezado de sección editorial                                     */
/* ------------------------------------------------------------------ */
function ReportSection({
  n, kicker, title, children, intro,
}: {
  n: string
  kicker: string
  title: string
  intro?: ReactNode
  children: ReactNode
}) {
  return (
    <section className="informe-section break-inside-avoid">
      <div className="mb-4">
        <div className="flex items-baseline gap-3">
          <span className="num text-sm font-semibold text-gold">{n}</span>
          <Kicker>{kicker}</Kicker>
        </div>
        <h2 className="mt-1 font-display text-2xl leading-tight text-ink">{title}</h2>
        <div className="mt-3 h-px w-full bg-line" />
      </div>
      {intro ? <p className="mb-5 max-w-3xl text-[15px] leading-relaxed text-ink-soft">{intro}</p> : null}
      {children}
    </section>
  )
}

function SubBlock({ title, children, hint }: { title: string; hint?: ReactNode; children: ReactNode }) {
  return (
    <div className="break-inside-avoid">
      <div className="mb-2 flex items-center justify-between gap-3">
        <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-soft">{title}</div>
        {hint ? <div className="shrink-0">{hint}</div> : null}
      </div>
      {children}
    </div>
  )
}

const N = (v: number) => <span className="num text-ink">{fmtMoneda(v)}</span>
const P = (v: number) => <span className="num text-ink">{fmtPct(v)}</span>
const C = (v: number) => <span className="num font-semibold text-ink">{v}</span>

export function Informe({
  filasIngreso,
  filasGasto,
  filasFuenteUso,
  indicadorLey617,
  indicadoresExtra,
  filasSgp = [],
  filasSectores = [],
  trasladosData = { filas: [], total: 0 },
  municipio = 'Municipio',
  corte = 'corte 2025',
  onPrint,
}: {
  filasIngreso: FilaIngreso[]
  filasGasto: FilaGasto[]
  filasFuenteUso: FilaFuenteUso[]
  indicadorLey617?: IndicadorLey617
  indicadoresExtra?: IndicadoresDnp
  filasSgp?: FilaSgp[]
  filasSectores?: FilaSector[]
  trasladosData?: { filas: FilaTraslado[]; total: number }
  municipio?: string
  corte?: string
  onPrint?: () => void
}) {
  const k = kpisResumen(filasIngreso, filasGasto, indicadorLey617)
  const dist = distribucionPresupuesto(filasGasto)
  const fuentes = fuentesInsights(filasFuenteUso, 8)
  const ingresos = ingresoInsights(filasIngreso, 8)

  const estado617: EstadoIndicador | null = indicadorLey617
    ? nivelIndicador(indicadorLey617.pctGfIcld, indicadorLey617.limite)
    : null
  const generado = new Date().toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' })
  const print = onPrint ?? (() => window.print())

  /* ---- SGP (Seguimiento) ---- */
  const tieneSgp = filasSgp.length > 0
  const sgpTotalRow = filasSgp.find((f) => f.tipo === 'total')
  const sgpTotal = sgpTotalRow?.total ?? 0
  const sgpDetalle = filasSgp.filter((f) => f.compromisos != null && f.total > 0)
  let sgpSumComp = 0
  for (const f of sgpDetalle) {
    sgpSumComp += f.compromisos as number
  }
  const sgpPctEjec = pctEjecucionGlobalSgp(filasSgp)
  const sgpConPct = sgpDetalle.filter((f) => f.pctEjecucion != null)
  const sgpMayor = sgpConPct.reduce<FilaSgp | null>(
    (best, f) => (best == null || (f.pctEjecucion as number) > (best.pctEjecucion as number) ? f : best),
    null,
  )
  const sgpMenor = sgpConPct.reduce<FilaSgp | null>(
    (worst, f) => (worst == null || (f.pctEjecucion as number) < (worst.pctEjecucion as number) ? f : worst),
    null,
  )
  // Filas para la tabla resumida (conceptos con ejecución).
  const sgpRows = filasSgp.filter((f) => f.tipo === 'detalle' && f.total > 0)
  const colSgp: Column<FilaSgp>[] = [
    { key: 'concepto', label: 'Concepto', nowrap: true },
    { key: 'total', label: 'Total SGP', num: true, format: money },
    { key: 'pctEjecucion', label: '% Ejec.', num: true, format: (v) => (v == null ? null : pctEjecCell(v as number)) },
    { key: 'pctRecaudo', label: '% Recaudo', num: true, format: (v) => (v == null ? null : pctEjecCell(v as number)) },
  ]

  // Datos para el donut de distribución.
  const donut = dist.secciones.map((s) => ({ seccion: s.seccion, pptoFinal: s.pptoFinal }))
  // Barras CDP vs saldo disponible por tipo de gasto (en millones).
  const barrasDist = dist.secciones.map((s) => ({
    seccion: truncar(s.seccion, 18),
    Disponibilidades: s.disponibilidades,
    'Saldo disponible': s.saldoDisponible,
  }))
  const pctSeccion = (rubro: string) => dist.secciones.find((s) => s.rubro === rubro)?.pct ?? 0

  /* ---- columnas de tablas ---- */
  const colDist: Column<SeccionDistribucion>[] = [
    { key: 'seccion', label: 'Tipo de gasto', nowrap: true },
    { key: 'pptoFinal', label: 'Ppto Final', num: true, format: money },
    { key: 'pct', label: '% del total', num: true, format: pct },
    { key: 'disponibilidades', label: 'CDP', num: true, format: money },
    { key: 'compromisos', label: 'Compromisos', num: true, format: money },
    { key: 'saldoDisponible', label: 'Saldo disp.', num: true, format: money },
  ]

  const colSaldo: Column<FilaFuenteUso>[] = [
    { key: 'descripcionFuente', label: 'Fuente', format: (v) => truncar(v as string, 46) },
    { key: 'pfGastos', label: 'Ppto Gastos', num: true, format: money },
    { key: 'compromisos', label: 'Compromisos', num: true, format: money },
    { key: 'pctCompromisos', label: '% Ejec.', num: true, format: (v) => pctEjecCell(v as number) },
    { key: 'saldoPresupuesto', label: 'Saldo ppto', num: true, format: money },
  ]
  const colAlta: Column<FilaFuenteUso>[] = [
    { key: 'descripcionFuente', label: 'Fuente', format: (v) => truncar(v as string, 50) },
    { key: 'pfGastos', label: 'Ppto Gastos', num: true, format: money },
    { key: 'compromisos', label: 'Compromisos', num: true, format: money },
    { key: 'pctCompromisos', label: '% Ejec.', num: true, format: (v) => pctEjecCell(v as number) },
  ]
  const colCero: Column<FilaFuenteUso>[] = [
    { key: 'descripcionFuente', label: 'Fuente', format: (v) => truncar(v as string, 50) },
    { key: 'pfGastos', label: 'Ppto Gastos', num: true, format: money },
    {
      key: 'pctCompromisos', label: '% Ejec.', num: true,
      format: () => <span className="num font-semibold" style={{ color: ROJO }}>0 %</span>,
    },
  ]
  const colReservas: Column<FilaFuenteUso>[] = [
    { key: 'descripcionFuente', label: 'Fuente', format: (v) => truncar(v as string, 50) },
    { key: 'reservas', label: 'Reservas', num: true, format: money },
  ]
  const colCxP: Column<FilaFuenteUso>[] = [
    { key: 'descripcionFuente', label: 'Fuente', format: (v) => truncar(v as string, 50) },
    { key: 'cuentasPorPagar', label: 'Cuentas por pagar', num: true, format: money },
  ]

  const colRenta: Column<FilaIngreso>[] = [
    { key: 'rubro', label: 'Rubro', nowrap: true },
    { key: 'nombre', label: 'Renta', format: (v) => truncar(v as string, 46) },
    { key: 'pptoFinal', label: 'Ppto Final', num: true, format: money },
    { key: 'ingreso', label: 'Recaudo', num: true, format: money },
    { key: 'pctIngreso', label: '% Ejec.', num: true, format: (v) => pctEjecCell(v as number) },
  ]
  const colSinRecaudo: Column<FilaIngreso>[] = [
    { key: 'rubro', label: 'Rubro', nowrap: true },
    { key: 'nombre', label: 'Renta', format: (v) => truncar(v as string, 50) },
    { key: 'pptoFinal', label: 'Ppto Final', num: true, format: money },
    {
      key: 'pctIngreso', label: '% Ejec.', num: true,
      format: () => <span className="num font-semibold" style={{ color: ROJO }}>0 %</span>,
    },
  ]

  /* ---- Inversión por sectores ---- */
  const tieneSectores = filasSectores.length > 0
  const sectoresTotal = filasSectores.reduce((acc, f) => acc + f.pptoFinal, 0)
  const sectorMayor = filasSectores[0] // ordenado desc por pptoFinal
  const sectorMayorEjec = filasSectores.reduce<FilaSector | null>(
    (best, f) => (best == null || f.ejecucion > best.ejecucion ? f : best),
    null,
  )
  const sectoresTop = filasSectores.slice(0, 8)
  const colSectores: Column<FilaSector>[] = [
    { key: 'sector', label: 'Sector', format: (v) => truncar(v as string, 44) },
    { key: 'pptoFinal', label: 'Ppto Final', num: true, format: money },
    { key: 'registros', label: 'Registros', num: true, format: money },
    { key: 'ejecucion', label: '% Ejec.', num: true, format: (v) => pctEjecCell(v as number) },
    { key: 'saldoDisponible', label: 'Saldo disp.', num: true, format: money },
  ]

  /* ---- Traslados presupuestales ---- */
  const tieneTraslados = trasladosData.filas.length > 0
  const trasladosTotal = trasladosData.total
  const trasladosSumDif = trasladosData.filas.reduce((acc, f) => acc + f.diferencia, 0)
  const trasladosEquilibrado = Math.abs(trasladosSumDif) < 1
  const colTraslados: Column<FilaTraslado>[] = [
    { key: 'fuente', label: 'Fuente', format: (v) => truncar(v as string, 50) },
    { key: 'creditos', label: 'Créditos', num: true, format: money },
    { key: 'contracreditos', label: 'Contracréditos', num: true, format: money },
    {
      key: 'diferencia', label: 'Diferencia', num: true,
      format: (v) => (
        <span className="num font-semibold" style={{ color: (v as number) === 0 ? VERDE : ROJO }}>
          {fmtMoneda(v as number)}
        </span>
      ),
    },
  ]

  /* ---- Numeración dinámica de secciones ---- */
  let secCount = 4
  const num2 = (i: number) => String(i).padStart(2, '0')
  const nLey617 = indicadorLey617 && estado617 ? num2((secCount += 1)) : null
  const nSgp = tieneSgp ? num2((secCount += 1)) : null
  const nSectores = tieneSectores ? num2((secCount += 1)) : null
  const nTraslados = tieneTraslados ? num2((secCount += 1)) : null
  const nPendientes = num2((secCount += 1))

  return (
    <article className="informe space-y-12">
      {/* Acciones (no se imprimen) */}
      <div className="no-print flex justify-end">
        <button
          type="button"
          onClick={print}
          aria-label="Imprimir o exportar el informe a PDF"
          className="inline-flex items-center gap-2 rounded-xl bg-forest px-4 py-2 text-sm font-medium text-paper transition-colors hover:bg-forest-700"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden focusable="false">
            <path d="M6 9V3h12v6M6 18H4a2 2 0 0 1-2-2v-4a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2h-2M6 14h12v7H6z"
              stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Imprimir / Exportar PDF
        </button>
      </div>

      {/* Portada */}
      <header className="informe-section break-inside-avoid border-b border-line pb-8">
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gold">
            <span className="font-display text-sm font-bold text-forest-ink">PA</span>
          </span>
          <div className="leading-tight">
            <div className="font-display text-[15px] font-semibold text-ink">Plataforma Alcaldías</div>
            <div className="text-[11px] tracking-wide text-ink-soft">Análisis Presupuestal CCPET</div>
          </div>
        </div>
        <div className="mt-6">
          <Kicker>Informe ejecutivo</Kicker>
          <h1 className="mt-2 font-display text-4xl leading-[1.05] text-ink sm:text-5xl">
            Informe de Análisis Presupuestal
          </h1>
          <p className="mt-3 text-lg text-ink-soft">
            {municipio} · <span className="num">{corte}</span>
          </p>
          <p className="mt-1 text-sm text-ink-soft">Generado el {generado}</p>
        </div>
      </header>

      {/* 01 — Resumen ejecutivo */}
      <ReportSection
        n="01"
        kicker="Visión general"
        title="Resumen ejecutivo"
        intro={
          <>
            Al corte, el municipio registra un recaudo de {N(k.ingresoRecaudo)} ({P(k.pctIngreso)} del presupuesto
            final de ingresos) y compromisos de gasto por {N(k.gastoCompromisos)} ({P(k.pctCompromiso)} del
            presupuesto), con pagos efectivos por {N(k.gastoPagos)}.
            {k.ley617Pct != null ? <> El indicador de Ley 617 se ubica en {P(k.ley617Pct)} ({k.ley617Cumple}).</> : null}
          </>
        }
      >
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatTile label="Recaudo de ingresos" value={fmtMoneda(k.ingresoRecaudo)} delta={`${fmtPct(k.pctIngreso)} del ppto`} />
          <StatTile label="Compromisos de gastos" value={fmtMoneda(k.gastoCompromisos)} delta={`${fmtPct(k.pctCompromiso)} del ppto`} />
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
      </ReportSection>

      {/* 02 — Distribución del presupuesto */}
      <ReportSection
        n="02"
        kicker="Estructura del gasto"
        title="Distribución del presupuesto"
        intro={
          dist.total ? (
            <>
              El presupuesto de gastos se sitúa en {N(dist.total.pptoFinal)}. De este total, la inversión representa
              el {P(pctSeccion('2.3'))}, el funcionamiento el {P(pctSeccion('2.1'))} y el servicio de la deuda
              el {P(pctSeccion('2.2'))}.
            </>
          ) : (
            'No se identificó el total de gastos (rubro 2) en el insumo cargado.'
          )
        }
      >
        <div className="grid gap-6 lg:grid-cols-2">
          <SubBlock title="Distribución por tipo de gasto (ppto final)">
            <div className="rounded-card border border-line bg-surface p-4 shadow-card">
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie data={donut} dataKey="pptoFinal" nameKey="seccion" outerRadius={92} innerRadius={50} paddingAngle={2} stroke="var(--surface)" strokeWidth={2}>
                    {donut.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={fmtTooltip} contentStyle={TOOLTIP_STYLE} labelStyle={LABEL_STYLE} itemStyle={ITEM_STYLE} />
                  <Legend wrapperStyle={LEGEND_STYLE} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </SubBlock>
          <SubBlock title="CDP (disponibilidades) vs saldo disponible (millones)">
            <div className="rounded-card border border-line bg-surface p-4 shadow-card">
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={barrasDist} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid stroke={GRID} strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="seccion" tick={{ fontSize: 11, fill: AXIS }} stroke={GRID} />
                  <YAxis tickFormatter={fmtMill} tick={{ fontSize: 11, fill: AXIS }} stroke={GRID} width={56} />
                  <Tooltip formatter={fmtTooltip} contentStyle={TOOLTIP_STYLE} labelStyle={LABEL_STYLE} itemStyle={ITEM_STYLE} cursor={{ fill: 'rgba(14,92,70,.06)' }} />
                  <Legend wrapperStyle={LEGEND_STYLE} />
                  <Bar dataKey="Disponibilidades" fill={CHART_COLORS[0]} radius={[4, 4, 0, 0]} maxBarSize={40} />
                  <Bar dataKey="Saldo disponible" fill={CHART_COLORS[1]} radius={[4, 4, 0, 0]} maxBarSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </SubBlock>
        </div>
        {dist.secciones.length > 0 ? (
          <div className="mt-6">
            <SubBlock title="Detalle por tipo de gasto">
              <DataTable columns={colDist} rows={dist.secciones} rowKey={(r) => r.rubro} maxHeight="none" caption="Distribución del presupuesto por tipo de gasto" />
            </SubBlock>
          </div>
        ) : null}
      </ReportSection>

      {/* 03 — Análisis de fuentes */}
      <ReportSection
        n="03"
        kicker="Conciliación de fuentes"
        title="Análisis de fuentes"
        intro={
          <>
            El grado de ejecución del gasto frente a las fuentes es del {P(fuentes.gradoEjecucionGasto)}. Hay {C(fuentes.ceroCount)} fuente(s)
            con ejecución del 0 % y {C(fuentes.altaEjecucionCount)} con ejecución superior al 90 %. Las reservas presupuestales
            totalizan {N(fuentes.reservasTotal)} y las cuentas por pagar {N(fuentes.cuentasPorPagarTotal)}.
          </>
        }
      >
        <div className="space-y-8">
          {fuentes.topSaldo.length > 0 ? (
            <SubBlock title="Fuentes con mayores saldos presupuestales" hint={<Badge tone="gold">Semáforo de ejecución</Badge>}>
              <DataTable columns={colSaldo} rows={fuentes.topSaldo} rowKey={(r, i) => `${r.descripcionFuente}-${i}`} maxHeight="none" caption="Fuentes con mayores saldos" />
            </SubBlock>
          ) : null}

          {fuentes.cero.length > 0 ? (
            <SubBlock
              title={`Fuentes con ejecución del 0 % (${fuentes.ceroCount})`}
              hint={<Badge tone="alert">Sin compromisos</Badge>}
            >
              <p className="mb-2 text-sm text-ink-soft">
                Hay {C(fuentes.ceroCount)} fuente(s) con presupuesto de gasto asignado pero sin compromisos al corte.
              </p>
              <DataTable columns={colCero} rows={fuentes.cero} rowKey={(r, i) => `${r.descripcionFuente}-${i}`} maxHeight="none" caption="Fuentes con ejecución 0%" />
            </SubBlock>
          ) : null}

          {fuentes.altaEjecucion.length > 0 ? (
            <SubBlock title={`Fuentes con ejecución superior al 90 % (${fuentes.altaEjecucionCount})`} hint={<Badge tone="ok">Alta ejecución</Badge>}>
              <DataTable columns={colAlta} rows={fuentes.altaEjecucion} rowKey={(r, i) => `${r.descripcionFuente}-${i}`} maxHeight="none" caption="Fuentes de alta ejecución" />
            </SubBlock>
          ) : null}

          <div className="grid gap-6 lg:grid-cols-2">
            {fuentes.topReservas.length > 0 ? (
              <SubBlock title={`Reservas presupuestales · total ${fmtMoneda(fuentes.reservasTotal)}`}>
                <DataTable columns={colReservas} rows={fuentes.topReservas} rowKey={(r, i) => `${r.descripcionFuente}-${i}`} maxHeight="none" caption="Reservas por fuente" />
              </SubBlock>
            ) : null}
            {fuentes.topCxP.length > 0 ? (
              <SubBlock title={`Cuentas por pagar · total ${fmtMoneda(fuentes.cuentasPorPagarTotal)}`}>
                <DataTable columns={colCxP} rows={fuentes.topCxP} rowKey={(r, i) => `${r.descripcionFuente}-${i}`} maxHeight="none" caption="Cuentas por pagar por fuente" />
              </SubBlock>
            ) : null}
          </div>
        </div>
      </ReportSection>

      {/* 04 — Estado del ingreso */}
      <ReportSection
        n="04"
        kicker="Ejecución de ingresos"
        title="Estado del ingreso"
        intro={
          <>
            El recaudo asciende a {N(ingresos.recaudoTotal)}, equivalente al {P(ingresos.pct)} del presupuesto final de
            ingresos ({N(ingresos.pptoFinalTotal)}). Se identifican {C(ingresos.altaEjecucionCount)} renta(s) con ejecución
            superior al 90 % y {C(ingresos.sinRecaudoCount)} renta(s) sin recaudo.
          </>
        }
      >
        <div className="space-y-8">
          {ingresos.topRentas.length > 0 ? (
            <SubBlock title="Rentas más representativas por recaudo" hint={<Badge tone="gold">Semáforo de ejecución</Badge>}>
              <DataTable columns={colRenta} rows={ingresos.topRentas} rowKey={(r) => r.rubro} maxHeight="none" caption="Rentas más representativas" />
            </SubBlock>
          ) : null}

          {ingresos.altaEjecucion.length > 0 ? (
            <SubBlock title={`Rentas con ejecución superior al 90 % (${ingresos.altaEjecucionCount})`} hint={<Badge tone="ok">Alta ejecución</Badge>}>
              <DataTable columns={colRenta} rows={ingresos.altaEjecucion} rowKey={(r) => r.rubro} maxHeight="none" caption="Rentas de alta ejecución" />
            </SubBlock>
          ) : null}

          {ingresos.sinRecaudo.length > 0 ? (
            <SubBlock title={`Rentas sin recaudo (${ingresos.sinRecaudoCount})`} hint={<Badge tone="alert">0 % de ejecución</Badge>}>
              <DataTable columns={colSinRecaudo} rows={ingresos.sinRecaudo} rowKey={(r) => r.rubro} maxHeight="none" caption="Rentas sin recaudo" />
            </SubBlock>
          ) : null}

          {ingresos.predial.length > 0 ? (
            <SubBlock title="Impuesto predial (urbano / rural)">
              <DataTable columns={colRenta} rows={ingresos.predial} rowKey={(r) => r.rubro} maxHeight="none" caption="Impuesto predial" />
            </SubBlock>
          ) : null}
        </div>
      </ReportSection>

      {/* 05 — Ley 617 */}
      {indicadorLey617 && estado617 && nLey617 ? (
        <ReportSection
          n={nLey617}
          kicker="Límites de gasto"
          title="Ley 617 — Autofinanciación de funcionamiento"
          intro={
            <>
              La relación gastos de funcionamiento sobre ICLD se ubica en {P(indicadorLey617.pctGfIcld)} frente al
              límite del {P(indicadorLey617.limite)}: el municipio {indicadorLey617.cumplimiento === 'Cumple' ? 'cumple' : 'no cumple'} el
              indicador, con un diferencial de {P(indicadorLey617.diferencial)}.
            </>
          }
        >
          <div className="rounded-card border border-line bg-surface p-6 shadow-card break-inside-avoid">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div className="num text-5xl font-semibold leading-none" style={{ color: estado617.color }}>
                {fmtPct(indicadorLey617.pctGfIcld)}
              </div>
              <EstadoChip estado={estado617} />
            </div>
            <Gauge valor={indicadorLey617.pctGfIcld} limite={indicadorLey617.limite} estado={estado617} />
          </div>

          {indicadoresExtra ? (
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {[
                { titulo: '4. Generación de recursos propios', ind: indicadoresExtra.recursosPropios },
                { titulo: '5. Magnitud de la inversión', ind: indicadoresExtra.magnitudInversion },
              ].map(({ titulo, ind }) => (
                <div key={titulo} className="rounded-card border border-line bg-surface p-4 shadow-card break-inside-avoid">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-soft mb-1">
                    Otros indicadores DNP
                  </div>
                  <p className="font-semibold leading-snug text-ink">{titulo}</p>
                  <div className="num mt-2 text-2xl font-semibold text-ink">{fmtPct(ind.valor)}</div>
                  <div className="mt-1 text-xs text-ink-soft">
                    {ind.numeradorLabel}: <span className="num">{fmtMoneda(ind.numerador)}</span>
                    {' · '}
                    {ind.denominadorLabel}: <span className="num">{fmtMoneda(ind.denominador)}</span>
                  </div>
                  <p className="mt-1 text-[11px] italic text-ink-soft">
                    {ind.baseNota} · Metodología DNP — sujeto a confirmación.
                  </p>
                </div>
              ))}
            </div>
          ) : null}

          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            <SubBlock title="Desglose del indicador">
              <DataTable
                columns={[
                  { key: 'concepto', label: 'Concepto' },
                  { key: 'valor', label: 'Valor', num: true, format: (v, r) => (r.es617 ? fmtPct(v as number) : fmtMoneda(v as number)) },
                ] as Column<{ concepto: string; valor: number; es617?: boolean }>[]}
                rows={[
                  { concepto: 'A · ICLD propio', valor: indicadorLey617.icldPropio },
                  { concepto: 'B · SGP libre destinación', valor: indicadorLey617.sgpLibreDest },
                  { concepto: 'C · Total ICLD neto', valor: indicadorLey617.totalIcld },
                  { concepto: 'D · GF Admón. central depurado', valor: indicadorLey617.totalAdminDepurado },
                  { concepto: 'E · Indicador GF / ICLD', valor: indicadorLey617.pctGfIcld, es617: true },
                  { concepto: 'Límite legal', valor: indicadorLey617.limite, es617: true },
                ]}
                rowKey={(r) => r.concepto}
                maxHeight="none"
                caption="Desglose Ley 617"
              />
              <div className="mt-3">
                <EstadoChip estado={estado617} />
              </div>
            </SubBlock>
            <SubBlock title="Gastos de Concejo y Personería (compromisos)">
              <DataTable
                columns={[
                  { key: 'concepto', label: 'Órgano' },
                  { key: 'valor', label: 'Compromisos', num: true, format: money },
                ] as Column<{ concepto: string; valor: number }>[]}
                rows={[
                  { concepto: 'Concejo municipal', valor: indicadorLey617.concejo },
                  { concepto: 'Personería municipal', valor: indicadorLey617.personeria },
                  { concepto: 'Func. Admón. central', valor: indicadorLey617.funcAdminCentral },
                ]}
                rowKey={(r) => r.concepto}
                maxHeight="none"
                caption="Concejo y Personería"
              />
            </SubBlock>
          </div>
        </ReportSection>
      ) : null}

      {/* 06 — Seguimiento SGP */}
      {tieneSgp && nSgp ? (
        <ReportSection
          n={nSgp}
          kicker="Sistema General de Participaciones"
          title="Seguimiento SGP"
          intro={
            <>
              Los recursos del SGP del corte ascienden a {N(sgpTotal)} (según el SICODIS). El grado de
              ejecución global frente a esos recursos es del {P(sgpPctEjec)}, con compromisos por {N(sgpSumComp)}.
              {sgpMayor ? (
                <> El concepto con mayor ejecución es {sgpMayor.concepto} ({P(sgpMayor.pctEjecucion as number)})</>
              ) : null}
              {sgpMenor && sgpMenor !== sgpMayor ? (
                <> y el de menor ejecución es {sgpMenor.concepto} ({P(sgpMenor.pctEjecucion as number)}).</>
              ) : sgpMayor ? <>.</> : null}
            </>
          }
        >
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <StatTile label="Total SGP (corte)" value={fmtMoneda(sgpTotal)} />
            <StatTile
              label="Ejecución global SGP"
              tone="gold"
              accentColor={colorPorNivel(sgpPctEjec)}
              valueColor={colorPorNivel(sgpPctEjec)}
              value={fmtPct(sgpPctEjec)}
              delta={`${fmtMoneda(sgpSumComp)} comprometidos`}
            />
          </div>
          {sgpRows.length > 0 ? (
            <div className="mt-6">
              <SubBlock title="Ejecución por concepto" hint={<Badge tone="gold">Semáforo de ejecución</Badge>}>
                <DataTable columns={colSgp} rows={sgpRows} rowKey={(r) => r.fila} maxHeight="none" caption="Seguimiento del SGP por concepto" />
              </SubBlock>
            </div>
          ) : null}
        </ReportSection>
      ) : null}

      {/* Inversión por sectores */}
      {tieneSectores && nSectores ? (
        <ReportSection
          n={nSectores}
          kicker="Inversión (rubro 2.3)"
          title="Inversión por sectores"
          intro={
            <>
              La inversión (rubro 2.3) se distribuye entre {C(filasSectores.length)} sector(es), con un presupuesto
              final total de {N(sectoresTotal)}.
              {sectorMayor ? (
                <> El sector con mayor inversión es {sectorMayor.sector} con {N(sectorMayor.pptoFinal)}
                  {sectoresTotal > 0 ? <> ({P(sectorMayor.pptoFinal / sectoresTotal)} del total de inversión)</> : null}.</>
              ) : null}
              {sectorMayorEjec ? (
                <> El de mayor ejecución es {sectorMayorEjec.sector} ({P(sectorMayorEjec.ejecucion)}).</>
              ) : null}
            </>
          }
        >
          <SubBlock title="Inversión por sector (top 8)" hint={<Badge tone="gold">Semáforo de ejecución</Badge>}>
            <DataTable columns={colSectores} rows={sectoresTop} rowKey={(r) => r.codigo} maxHeight="none" caption="Inversión por sector" />
          </SubBlock>
        </ReportSection>
      ) : null}

      {/* Traslados presupuestales */}
      {tieneTraslados && nTraslados ? (
        <ReportSection
          n={nTraslados}
          kicker="Créditos / Contracréditos"
          title="Traslados presupuestales"
          intro={
            <>
              Los traslados presupuestales del corte ascienden a {N(trasladosTotal)} en créditos, distribuidos
              en {C(trasladosData.filas.length)} fuente(s).
              {trasladosEquilibrado
                ? ' Se mantuvo el equilibrio entre fuentes (créditos y contracréditos compensados).'
                : ' Se observa un desbalance entre créditos y contracréditos que conviene revisar.'}
            </>
          }
        >
          <SubBlock
            title="Traslados por fuente"
            hint={trasladosEquilibrado ? <Badge tone="ok">Equilibrado</Badge> : <Badge tone="alert">Revisar</Badge>}
          >
            <DataTable columns={colTraslados} rows={trasladosData.filas} rowKey={(r, i) => `${r.fuente}-${i}`} maxHeight="none" caption="Traslados presupuestales por fuente" />
          </SubBlock>
        </ReportSection>
      ) : null}

      {/* Secciones pendientes de insumo */}
      <ReportSection
        n={nPendientes}
        kicker="Alcance pendiente"
        title="Secciones pendientes de insumo"
        intro={
          <>
            Las siguientes secciones no se construyen aún porque dependen de insumos o definiciones del cliente.
            No se reportan cifras para evitar resultados sin respaldo. Detalle en{' '}
            <code className="num text-ink">docs/PENDIENTES-CLIENTE.md</code>.
          </>
        }
      >
        <div className="grid gap-4 sm:grid-cols-2">
          {[
            ...(tieneSectores
              ? []
              : [
                  {
                    t: 'Inversión por sectores',
                    d: 'Requiere el clasificador de sectores / programático para agrupar la inversión (rubro 2.3) por sector. La columna programática no se mapea aún a sectores.',
                  },
                ]),
            ...(tieneSgp
              ? []
              : [
                  {
                    t: 'Sistema General de Participaciones — detalle vs SICODIS',
                    d: 'Requiere el export de SICODIS del MISMO corte de la ejecución. El SICODIS entregado corresponde a otra vigencia, por lo que no valida a tolerancia 0.',
                  },
                ]),
            ...(tieneTraslados
              ? []
              : [
                  {
                    t: 'Traslados presupuestales (créditos / contracréditos)',
                    d: 'Las columnas de créditos y contracréditos no se parsean todavía; sin ellas no se puede reconstruir el movimiento de traslados.',
                  },
                ]),
            {
              t: 'Límite de gasto Concejo / Personería por SMMLV',
              d: 'Requiere el número de SMMLV y el valor del SMMLV vigente para calcular el techo legal de Concejo y Personería.',
            },
          ].map((c) => (
            <div
              key={c.t}
              className="break-inside-avoid rounded-card border border-dashed border-line bg-surface-2/60 p-5"
            >
              <Badge tone="neutral">Pendiente de insumo</Badge>
              <h3 className="mt-3 font-display text-lg leading-snug text-ink">{c.t}</h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-soft">{c.d}</p>
            </div>
          ))}
        </div>
      </ReportSection>

      {/* Footer */}
      <footer className="informe-section break-inside-avoid border-t border-line pt-6">
        <p className="text-xs text-ink-soft">
          Elaborado a partir de los reportes CCPET de ejecución y SICODIS.
        </p>
        <p className="mt-1 text-xs text-ink-soft">
          {municipio} · <span className="num">{corte}</span> · Plataforma Alcaldías
        </p>
      </footer>
    </article>
  )
}
