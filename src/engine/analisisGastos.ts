import type { FilaGasto, GastoRawRow } from '../types'

export function analisisGastos(rows: GastoRawRow[]): FilaGasto[] {
  return rows.map((r) => {
    const extrae = r.rubro.slice(0, 3)
    const columna1 = extrae === '2.3' ? `${extrae} - ${r.rubro}` : ''
    return {
      extrae,
      columna1,
      concat: `${r.rubro} - ${r.unidadEjec} - ${r.fuentes}`,
      rubro: r.rubro,
      descripcion: r.descripcion,
      cpc: r.cpc,
      unidadEjec: r.unidadEjec,
      programatico: r.programatico,
      fuentes: r.fuentes,
      cpi: r.cpi,
      atributo: r.atributo,
      pptoInicial: r.pptoInicial,
      pptoFinal: r.pptoFinal,
      disponibilidades: r.disponibilidades,
      saldoDisponible: r.saldoDisponible,
      registros: r.registros,
      saldoDisponibilidades: r.saldoDisponibilidades,
      ordenPago: r.ordenPago,
      saldoRegistro: r.saldoRegistro,
      egresos: r.egresos,
      egresosPapeles: r.egresosPapeles,
      saldoOrdenesPago: r.saldoOrdenesPago,
    }
  })
}
