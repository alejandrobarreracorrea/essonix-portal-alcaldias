import type { FilaFuenteUso, FilaGasto, FilaIngreso, IndicadorLey617 } from '../types'

export type KpisResumen = {
  ingresoPptoFinal: number
  ingresoRecaudo: number
  pctIngreso: number
  gastoPptoFinal: number
  gastoCompromisos: number
  gastoPagos: number
  pctCompromiso: number
  ley617Pct: number | null
  ley617Cumple: string | null
}

const ZERO_ING = { pptoFinal: 0, ingreso: 0, pctIngreso: 0 }
const ZERO_GAS = { pptoFinal: 0, disponibilidades: 0, registros: 0, ordenPago: 0, egresos: 0 }

export function kpisResumen(
  filasIngreso: FilaIngreso[],
  filasGasto: FilaGasto[],
  indicadorLey617?: IndicadorLey617,
): KpisResumen {
  const ti = filasIngreso.find((f) => f.rubro === '1') ?? ZERO_ING
  const tg = filasGasto.find((f) => f.rubro === '2') ?? ZERO_GAS
  return {
    ingresoPptoFinal: ti.pptoFinal,
    ingresoRecaudo: ti.ingreso,
    pctIngreso: ti.pctIngreso,
    gastoPptoFinal: tg.pptoFinal,
    gastoCompromisos: tg.registros,
    gastoPagos: tg.egresos,
    pctCompromiso: tg.pptoFinal !== 0 ? tg.registros / tg.pptoFinal : 0,
    ley617Pct: indicadorLey617 ? indicadorLey617.pctGfIcld : null,
    ley617Cumple: indicadorLey617 ? indicadorLey617.cumplimiento : null,
  }
}

export function cascadaGastos(filasGasto: FilaGasto[]): { etapa: string; valor: number }[] {
  const t = filasGasto.find((f) => f.rubro === '2') ?? ZERO_GAS
  return [
    { etapa: 'Ppto Final', valor: t.pptoFinal },
    { etapa: 'Disponibilidades', valor: t.disponibilidades },
    { etapa: 'Compromisos', valor: t.registros },
    { etapa: 'Órdenes de pago', valor: t.ordenPago },
    { etapa: 'Egresos', valor: t.egresos },
  ]
}

export function composicionGastos(filasGasto: FilaGasto[]): { seccion: string; valor: number }[] {
  const secciones: { rubro: string; seccion: string }[] = [
    { rubro: '2.1', seccion: 'Funcionamiento' },
    { rubro: '2.2', seccion: 'Servicio de la deuda' },
    { rubro: '2.3', seccion: 'Inversión' },
  ]
  const out: { seccion: string; valor: number }[] = []
  for (const s of secciones) {
    const fila = filasGasto.find((f) => f.rubro === s.rubro)
    if (fila) out.push({ seccion: s.seccion, valor: fila.registros })
  }
  return out
}

export function topFuentesPorRecaudo(
  filasFuenteUso: FilaFuenteUso[],
  n = 10,
): { fuente: string; recaudo: number }[] {
  return filasFuenteUso
    .filter((f) => f.descripcionFuente !== 'NO APLICA' && f.recaudo > 0)
    .sort((a, b) => b.recaudo - a.recaudo)
    .slice(0, n)
    .map((f) => ({ fuente: f.descripcionFuente, recaudo: f.recaudo }))
}
