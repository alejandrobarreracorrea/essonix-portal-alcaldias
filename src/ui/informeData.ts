// Selectores puros para el Informe v2. Toda la lógica de derivación de
// insights vive aquí (capa de presentación). No se redondea ni se formatea:
// el formateo de cifras ocurre solo en el componente.

import type { FilaFuenteUso, FilaGasto, FilaIngreso } from '../types'

/* ------------------------------------------------------------------ */
/* Distribución del presupuesto por tipo de gasto (2.1 / 2.2 / 2.3)    */
/* ------------------------------------------------------------------ */
export type SeccionDistribucion = {
  rubro: string
  seccion: string
  pptoFinal: number
  disponibilidades: number
  compromisos: number
  saldoDisponible: number
  pct: number
}

export type DistribucionPresupuesto = {
  total: {
    pptoFinal: number
    disponibilidades: number
    compromisos: number
    saldoDisponible: number
  } | null
  secciones: SeccionDistribucion[]
}

const SECCIONES_GASTO: { rubro: string; seccion: string }[] = [
  { rubro: '2.1', seccion: 'Funcionamiento' },
  { rubro: '2.2', seccion: 'Servicio de la deuda' },
  { rubro: '2.3', seccion: 'Inversión' },
]

export function distribucionPresupuesto(filasGasto: FilaGasto[]): DistribucionPresupuesto {
  const totalRow = filasGasto.find((f) => f.rubro === '2')
  const totalPptoFinal = totalRow ? totalRow.pptoFinal : 0

  const secciones: SeccionDistribucion[] = []
  for (const s of SECCIONES_GASTO) {
    const fila = filasGasto.find((f) => f.rubro === s.rubro)
    if (!fila) continue
    secciones.push({
      rubro: s.rubro,
      seccion: s.seccion,
      pptoFinal: fila.pptoFinal,
      disponibilidades: fila.disponibilidades,
      compromisos: fila.registros,
      saldoDisponible: fila.saldoDisponible,
      pct: totalPptoFinal > 0 ? fila.pptoFinal / totalPptoFinal : 0,
    })
  }

  return {
    total: totalRow
      ? {
          pptoFinal: totalRow.pptoFinal,
          disponibilidades: totalRow.disponibilidades,
          compromisos: totalRow.registros,
          saldoDisponible: totalRow.saldoDisponible,
        }
      : null,
    secciones,
  }
}

/* ------------------------------------------------------------------ */
/* Insights de fuentes y usos                                          */
/* ------------------------------------------------------------------ */
export type FuentesInsights = {
  gradoEjecucionGasto: number
  topSaldo: FilaFuenteUso[]
  altaEjecucion: FilaFuenteUso[]
  altaEjecucionCount: number
  cero: FilaFuenteUso[]
  ceroCount: number
  reservasTotal: number
  topReservas: FilaFuenteUso[]
  cuentasPorPagarTotal: number
  topCxP: FilaFuenteUso[]
}

const esAplica = (f: FilaFuenteUso) => f.descripcionFuente !== 'NO APLICA'

export function fuentesInsights(filasFuenteUso: FilaFuenteUso[], n = 8): FuentesInsights {
  const fuentes = filasFuenteUso.filter(esAplica)

  const sumPfGastos = fuentes.reduce((s, f) => s + f.pfGastos, 0)
  const sumCompromisos = fuentes.reduce((s, f) => s + f.compromisos, 0)
  const gradoEjecucionGasto = sumPfGastos > 0 ? sumCompromisos / sumPfGastos : 0

  const topSaldo = fuentes
    .filter((f) => f.saldoPresupuesto > 0)
    .sort((a, b) => b.saldoPresupuesto - a.saldoPresupuesto)
    .slice(0, n)

  const altaEjecucionAll = fuentes
    .filter((f) => f.pfGastos > 0 && f.pctCompromisos >= 0.9)
    .sort((a, b) => b.pctCompromisos - a.pctCompromisos)

  const ceroAll = fuentes
    .filter((f) => f.pfGastos > 0 && f.compromisos === 0)
    .sort((a, b) => b.pfGastos - a.pfGastos)

  const reservasTotal = fuentes.reduce((s, f) => s + f.reservas, 0)
  const topReservas = fuentes
    .filter((f) => f.reservas > 0)
    .sort((a, b) => b.reservas - a.reservas)
    .slice(0, n)

  const cuentasPorPagarTotal = fuentes.reduce((s, f) => s + f.cuentasPorPagar, 0)
  const topCxP = fuentes
    .filter((f) => f.cuentasPorPagar > 0)
    .sort((a, b) => b.cuentasPorPagar - a.cuentasPorPagar)
    .slice(0, n)

  return {
    gradoEjecucionGasto,
    topSaldo,
    altaEjecucion: altaEjecucionAll.slice(0, n),
    altaEjecucionCount: altaEjecucionAll.length,
    cero: ceroAll.slice(0, n),
    ceroCount: ceroAll.length,
    reservasTotal,
    topReservas,
    cuentasPorPagarTotal,
    topCxP,
  }
}

/* ------------------------------------------------------------------ */
/* Insights de ingresos (sobre rentas hoja)                            */
/* ------------------------------------------------------------------ */
export type IngresoInsights = {
  recaudoTotal: number
  pptoFinalTotal: number
  pct: number
  topRentas: FilaIngreso[]
  altaEjecucion: FilaIngreso[]
  altaEjecucionCount: number
  sinRecaudo: FilaIngreso[]
  sinRecaudoCount: number
  predial: FilaIngreso[]
}

/** Una fila es hoja si ninguna otra fila tiene rubro que empiece por `rubro + '.'`. */
export function esHoja(fila: FilaIngreso, filas: FilaIngreso[]): boolean {
  const prefijo = fila.rubro + '.'
  return !filas.some((f) => f !== fila && f.rubro.startsWith(prefijo))
}

export function ingresoInsights(filasIngreso: FilaIngreso[], n = 8): IngresoInsights {
  const total = filasIngreso.find((f) => f.rubro === '1')
  const recaudoTotal = total ? total.ingreso : 0
  const pptoFinalTotal = total ? total.pptoFinal : 0
  const pct = total ? total.pctIngreso : 0

  const hojas = filasIngreso.filter((f) => f.rubro !== '1' && esHoja(f, filasIngreso))

  const topRentas = [...hojas].sort((a, b) => b.ingreso - a.ingreso).slice(0, n)

  const altaEjecucionAll = hojas
    .filter((f) => f.pptoFinal > 0 && f.pctIngreso >= 0.9)
    .sort((a, b) => b.pctIngreso - a.pctIngreso)

  const sinRecaudoAll = hojas
    .filter((f) => f.ingreso === 0 && f.pptoFinal > 0)
    .sort((a, b) => b.pptoFinal - a.pptoFinal)

  const predial = hojas
    .filter((f) => f.nombre.toUpperCase().includes('PREDIAL'))
    .sort((a, b) => b.ingreso - a.ingreso)

  return {
    recaudoTotal,
    pptoFinalTotal,
    pct,
    topRentas,
    altaEjecucion: altaEjecucionAll.slice(0, n),
    altaEjecucionCount: altaEjecucionAll.length,
    sinRecaudo: sinRecaudoAll.slice(0, n),
    sinRecaudoCount: sinRecaudoAll.length,
    predial,
  }
}
