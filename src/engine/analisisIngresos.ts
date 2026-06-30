import type { FilaIngreso, IngresoRawRow } from '../types'

export function analisisIngresos(rows: IngresoRawRow[]): FilaIngreso[] {
  return rows.map((r) => {
    const adiciones = r.adicAnteriores + r.adicPeriodo
    const reducciones = r.reducAnteriores + r.reducPeriodo
    const ingreso = r.totalIngresos
    const pptoFinal = r.pptoFinal
    return {
      columna3: `${r.codigoRubro} - ${r.ccpet02} - ${r.ccpet05}`,
      rubro: r.codigoRubro,
      nombre: r.descripcion,
      unidadEjec: r.ccpet02,
      fuentes: r.ccpet05,
      atributo: r.ccpet83,
      pptoInicial: r.pptoInicial,
      adiciones,
      reducciones,
      pptoFinal,
      ingreso,
      pctIngreso: pptoFinal === 0 ? 0 : ingreso / pptoFinal,
      proyeccion: (ingreso / 10) * 11,
      observaciones: '',
    }
  })
}
