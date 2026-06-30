import { useState } from 'react'
import type { JSX } from 'react'
import type { FilaIngreso, FilaGasto, FilaFuenteUso, FilaSgp, FilaSector, FilaTraslado, IndicadorLey617, IndicadoresDnp } from '../types'
import { TablaIngresos } from './TablaIngresos'
import { TablaGastos } from './TablaGastos'
import { TablaFuentesYUsos } from './TablaFuentesYUsos'
import { PanelLey617 } from './PanelLey617'
import { PanelIndicadores } from './PanelIndicadores'
import { PanelResumen } from './PanelResumen'
import { PanelSgp } from './PanelSgp'
import { PanelSectores } from './PanelSectores'
import { PanelTraslados } from './PanelTraslados'
import { Informe } from './Informe'

export type Area = {
  id: string
  /** Etiqueta de la pestaña/nav (puede incluir conteos). */
  label: string
  /** Título editorial para la topbar del AppShell. */
  title?: string
  /** Kicker editorial para la topbar. */
  kicker?: string
  render: () => JSX.Element
}

export type DashboardData = {
  filasIngreso: FilaIngreso[]
  filasGasto: FilaGasto[]
  filasFuenteUso?: FilaFuenteUso[]
  indicadorLey617?: IndicadorLey617
  indicadoresExtra?: IndicadoresDnp
  filasSgp?: FilaSgp[]
  filasSectores?: FilaSector[]
  trasladosData?: { filas: FilaTraslado[]; total: number }
  /** Placeholders de contexto para el informe (portada/footer). */
  municipio?: string
  corte?: string
}

/**
 * Construye la lista de áreas disponibles según los datos cargados.
 * Compartido por el AppShell (App) y el componente Dashboard.
 */
export function buildAreas({
  filasIngreso,
  filasGasto,
  filasFuenteUso = [],
  indicadorLey617,
  indicadoresExtra,
  filasSgp = [],
  filasSectores = [],
  trasladosData = { filas: [], total: 0 },
  municipio,
  corte,
}: DashboardData): Area[] {
  const areas: Area[] = []
  if (filasIngreso.length > 0 && filasGasto.length > 0) {
    areas.push({
      id: 'resumen',
      label: 'Resumen',
      title: 'Resumen ejecutivo',
      kicker: 'Visión general',
      render: () => (
        <PanelResumen
          filasIngreso={filasIngreso}
          filasGasto={filasGasto}
          filasFuenteUso={filasFuenteUso ?? []}
          indicadorLey617={indicadorLey617}
        />
      ),
    })
  }
  if (filasIngreso.length > 0) {
    areas.push({
      id: 'ingresos',
      label: `Análisis de Ingresos (${filasIngreso.length})`,
      title: 'Análisis de Ingresos',
      kicker: 'Ejecución presupuestal',
      render: () => <TablaIngresos filas={filasIngreso} />,
    })
  }
  if (filasGasto.length > 0) {
    areas.push({
      id: 'gastos',
      label: `Análisis de Gastos (${filasGasto.length})`,
      title: 'Análisis de Gastos',
      kicker: 'Ejecución presupuestal',
      render: () => <TablaGastos filas={filasGasto} />,
    })
  }
  if (filasFuenteUso.length > 0) {
    areas.push({
      id: 'fuentes',
      label: `Fuentes y Usos (${filasFuenteUso.length})`,
      title: 'Fuentes y Usos',
      kicker: 'Conciliación',
      render: () => <TablaFuentesYUsos filas={filasFuenteUso} />,
    })
  }
  if (filasSectores.length > 0) {
    areas.push({
      id: 'sectores',
      label: `Inversión por sectores (${filasSectores.length})`,
      title: 'Inversión por sectores',
      kicker: 'Inversión (rubro 2.3)',
      render: () => <PanelSectores filas={filasSectores} />,
    })
  }
  if (trasladosData.filas.length > 0) {
    areas.push({
      id: 'traslados',
      label: `Traslados (${trasladosData.filas.length})`,
      title: 'Traslados presupuestales',
      kicker: 'Créditos / Contracréditos',
      render: () => <PanelTraslados filas={trasladosData.filas} total={trasladosData.total} />,
    })
  }
  if (filasSgp.length > 0) {
    areas.push({
      id: 'sgp',
      label: 'Seguimiento SGP',
      title: 'Seguimiento SGP',
      kicker: 'Sistema General de Participaciones',
      render: () => <PanelSgp filas={filasSgp} />,
    })
  }
  if (indicadorLey617) {
    areas.push({
      id: 'ley617',
      label: 'Ley 617',
      title: 'Ley 617',
      kicker: 'Límite de gasto',
      render: () => <PanelLey617 indicador={indicadorLey617} />,
    })
  }
  if (indicadorLey617) {
    areas.push({
      id: 'indicadores',
      label: 'Indicadores',
      title: 'Indicadores',
      kicker: 'Tablero',
      render: () => <PanelIndicadores indicadorLey617={indicadorLey617} indicadoresExtra={indicadoresExtra} />,
    })
  }
  if (filasIngreso.length > 0 && filasGasto.length > 0) {
    areas.push({
      id: 'informe',
      label: 'Informe',
      title: 'Informe de Análisis Presupuestal',
      kicker: 'Reporte ejecutivo',
      render: () => (
        <Informe
          filasIngreso={filasIngreso}
          filasGasto={filasGasto}
          filasFuenteUso={filasFuenteUso ?? []}
          indicadorLey617={indicadorLey617}
          indicadoresExtra={indicadoresExtra}
          filasSgp={filasSgp}
          filasSectores={filasSectores}
          trasladosData={trasladosData}
          municipio={municipio}
          corte={corte}
        />
      ),
    })
  }
  return areas
}

export function Dashboard(props: DashboardData) {
  const areas = buildAreas(props)
  const [activaId, setActivaId] = useState<string | null>(null)
  if (areas.length === 0) {
    return <p className="text-sm text-ink-soft">Carga y valida los insumos para generar el análisis.</p>
  }
  const activa = areas.find((a) => a.id === activaId) ?? areas[0]

  return (
    <div className="space-y-3">
      <nav className="flex gap-2 border-b border-line">
        {areas.map((a) => (
          <button
            key={a.id}
            onClick={() => setActivaId(a.id)}
            className={`px-4 py-2 text-sm font-medium ${a.id === activa.id ? 'border-b-2 border-forest text-ink' : 'text-ink-soft'}`}
          >
            {a.label}
          </button>
        ))}
      </nav>
      {activa.render()}
    </div>
  )
}
