import { useEffect, useMemo, useState } from 'react'
import type { IngresoRawRow, GastoRawRow, FuenteCatalogo } from './types'
import { analisisIngresos } from './engine/analisisIngresos'
import { analisisGastos } from './engine/analisisGastos'
import { fuentesYUsos } from './engine/fuentesYUsos'
import { ley617 } from './engine/ley617'
import { seguimientoSgp } from './engine/seguimientoSgp'
import { traslados } from './engine/traslados'
import { inversionPorSectores } from './engine/inversionPorSectores'
import { indicadoresDnp } from './engine/indicadoresDnp'
import { SGP_CATALOGO } from './data/sgpCatalogo'
import type { SgpResumenRow } from './parsers/sgp'
import fuentes from './data/fuentes.json'
import sectores from './data/sectores.json'
import { CargaInsumos } from './ui/CargaInsumos'
import { AppShell, type NavItem } from './ui/AppShell'
import { buildAreas } from './ui/Dashboard'
import { Kicker } from './ui/kit'

export default function App() {
  const [ingresoRows, setIngresoRows] = useState<IngresoRawRow[]>([])
  const [gastoRows, setGastoRows] = useState<GastoRawRow[]>([])
  const [sgpResumen, setSgpResumen] = useState<SgpResumenRow[] | null>(null)

  const filasIngreso = useMemo(() => analisisIngresos(ingresoRows), [ingresoRows])
  const filasGasto = useMemo(() => analisisGastos(gastoRows), [gastoRows])
  const filasFuenteUso = useMemo(
    () =>
      ingresoRows.length > 0 && gastoRows.length > 0
        ? fuentesYUsos(fuentes as FuenteCatalogo[], ingresoRows, gastoRows)
        : [],
    [ingresoRows, gastoRows],
  )
  const indicadorLey617 = useMemo(
    () => (ingresoRows.length > 0 && gastoRows.length > 0 ? ley617(ingresoRows, gastoRows) : undefined),
    [ingresoRows, gastoRows],
  )
  const indicadoresExtra = useMemo(
    () => (ingresoRows.length > 0 && gastoRows.length > 0 ? indicadoresDnp(filasIngreso, filasGasto) : undefined),
    [ingresoRows, gastoRows, filasIngreso, filasGasto],
  )
  const filasSgp = useMemo(
    () =>
      ingresoRows.length > 0 && gastoRows.length > 0 && sgpResumen
        ? seguimientoSgp(SGP_CATALOGO, sgpResumen, ingresoRows, filasFuenteUso)
        : [],
    [ingresoRows, gastoRows, sgpResumen, filasFuenteUso],
  )
  const trasladosData = useMemo(
    () => (gastoRows.length > 0 ? traslados(gastoRows) : { filas: [], total: 0 }),
    [gastoRows],
  )
  const filasSectores = useMemo(
    () => (gastoRows.length > 0 ? inversionPorSectores(gastoRows, sectores) : []),
    [gastoRows],
  )

  const municipio = 'Municipio'
  const corte = 'corte 2025'

  const areas = useMemo(
    () => buildAreas({ filasIngreso, filasGasto, filasFuenteUso, indicadorLey617, indicadoresExtra, filasSgp, filasSectores, trasladosData, municipio, corte }),
    [filasIngreso, filasGasto, filasFuenteUso, indicadorLey617, indicadoresExtra, filasSgp, filasSectores, trasladosData],
  )

  const hasData = areas.length > 0
  const [active, setActive] = useState<string>('carga')

  // Cuando llega el primer análisis, avanzar de "carga" al resumen.
  useEffect(() => {
    if (hasData) setActive((prev) => (prev === 'carga' ? (areas[0]?.id ?? 'carga') : prev))
  }, [hasData, areas])

  const nav: NavItem[] = [
    { id: 'carga', label: 'Cargar insumos' },
    ...areas.map((a) => ({ id: a.id, label: a.label })),
  ]

  // Garantiza un destino válido si el área seleccionada deja de existir.
  const activeId = nav.some((n) => n.id === active) ? active : 'carga'
  const area = areas.find((a) => a.id === activeId)

  const carga = (
    <CargaInsumos
      onIngresos={(rows) => setIngresoRows(rows ?? [])}
      onGastos={(rows) => setGastoRows(rows ?? [])}
      onSgp={(resumen) => setSgpResumen(resumen)}
    />
  )

  return (
    <AppShell
      nav={nav}
      activeId={activeId}
      onSelect={setActive}
      insumos={{ ingresos: filasIngreso.length > 0, gastos: filasGasto.length > 0, sgp: sgpResumen != null }}
      municipio="Municipio"
      corte={hasData ? 'Vigencia actual' : undefined}
      title={activeId === 'carga' ? 'Cargar insumos' : (area?.title ?? area?.label ?? 'Análisis')}
      kicker={activeId === 'carga' ? 'Inicio' : area?.kicker}
      subtitle={
        activeId === 'carga'
          ? 'Los archivos se validan y el análisis se genera automáticamente.'
          : undefined
      }
      onPrint={() => {
        if (areas.some((a) => a.id === 'informe')) setActive('informe')
        else window.print()
      }}
    >
      {activeId === 'carga' ? (
        <div className="reveal" style={{ animationDelay: '40ms' }}>
          <div className="mb-8 max-w-2xl">
            <Kicker>Corte presupuestal</Kicker>
            <h2 className="mt-2 font-display text-3xl leading-tight text-ink sm:text-4xl">
              Carga los insumos del corte
            </h2>
            <p className="mt-3 text-ink-soft">
              Sube los reportes CCPET de ejecución y los recursos del SGP. Validamos cada archivo y
              construimos el análisis presupuestal en segundos.
            </p>
          </div>
          {carga}
        </div>
      ) : (
        <div key={activeId} className="reveal" style={{ animationDelay: '40ms' }}>
          {area?.render()}
        </div>
      )}
    </AppShell>
  )
}
