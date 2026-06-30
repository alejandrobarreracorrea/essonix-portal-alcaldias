import type { FilaFuenteUso, FuenteCatalogo, GastoRawRow, IngresoRawRow } from '../types'

// Suma, en orden de aparición, los valores cuyo campo clave (normalizado con trim)
// coincide exactamente con la fuente. Reproduce SUMIF respetando el orden de filas.
function sumBy<T>(rows: T[], fuente: string, keyOf: (r: T) => string, valOf: (r: T) => number): number {
  let acc = 0
  for (const r of rows) {
    if (keyOf(r).trim() === fuente) acc += valOf(r) || 0
  }
  return acc
}

export function fuentesYUsos(
  catalogo: FuenteCatalogo[],
  ingresoRows: IngresoRawRow[],
  gastoRows: GastoRawRow[],
): FilaFuenteUso[] {
  return catalogo.map((f) => {
    const fuente = f.descripcionFuente.trim()

    const piIngresos = sumBy(ingresoRows, fuente, (r) => r.ccpet05, (r) => r.pptoInicial)
    const pfIngresos = sumBy(ingresoRows, fuente, (r) => r.ccpet05, (r) => r.pptoFinal)
    const recaudo = sumBy(ingresoRows, fuente, (r) => r.ccpet05, (r) => r.totalIngresos)

    const piGastos = sumBy(gastoRows, fuente, (r) => r.fuentes, (r) => r.pptoInicial)
    const pfGastos = sumBy(gastoRows, fuente, (r) => r.fuentes, (r) => r.pptoFinal)
    const disponibilidades = sumBy(gastoRows, fuente, (r) => r.fuentes, (r) => r.disponibilidades)
    const compromisos = sumBy(gastoRows, fuente, (r) => r.fuentes, (r) => r.registros)
    const obligaciones = sumBy(gastoRows, fuente, (r) => r.fuentes, (r) => r.ordenPago)
    const pagos =
      sumBy(gastoRows, fuente, (r) => r.fuentes, (r) => r.egresos) +
      sumBy(gastoRows, fuente, (r) => r.fuentes, (r) => r.egresosPapeles)

    const difPptoInicial = piIngresos - piGastos
    const difPptoFinal = pfIngresos - pfGastos
    const pctRecaudo = pfIngresos !== 0 ? recaudo / pfIngresos : 0
    const pctCompromisos = pfGastos !== 0 ? compromisos / pfGastos : 0
    const saldoPresupuesto = pfIngresos - disponibilidades
    const dispSinCompromiso = disponibilidades - compromisos
    const reservas = compromisos - obligaciones
    const cuentasPorPagar = obligaciones - pagos
    const superavitDeficit = recaudo - compromisos
    const ecb = superavitDeficit - reservas - cuentasPorPagar

    return {
      codigo: f.codigo,
      descripcionFuente: f.descripcionFuente,
      piIngresos, pfIngresos, piGastos, pfGastos,
      difPptoInicial, difPptoFinal,
      recaudo, pctRecaudo,
      disponibilidades, compromisos, pctCompromisos,
      obligaciones, pagos,
      saldoPresupuesto, dispSinCompromiso, reservas, cuentasPorPagar,
      superavitDeficit, observaciones: '', ecb,
    }
  })
}
