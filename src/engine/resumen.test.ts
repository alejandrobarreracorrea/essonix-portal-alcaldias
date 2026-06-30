import { describe, it, expect } from 'vitest'
import { kpisResumen, cascadaGastos, composicionGastos, topFuentesPorRecaudo } from './resumen'
import type { FilaIngreso, FilaGasto, FilaFuenteUso, IndicadorLey617 } from '../types'

const ingTotal: FilaIngreso = {
  columna3: '', rubro: '1', nombre: 'INGRESOS', unidadEjec: '', fuentes: '', atributo: '',
  pptoInicial: 0, adiciones: 0, reducciones: 0, pptoFinal: 40000, ingreso: 17500,
  pctIngreso: 0.4375, proyeccion: 0, observaciones: '',
}
const gas = (rubro: string, p: Partial<FilaGasto>): FilaGasto => ({
  extrae: '', columna1: '', concat: '', rubro, descripcion: '', cpc: '', unidadEjec: '',
  programatico: '', fuentes: '', cpi: '', atributo: '',
  pptoInicial: 0, pptoFinal: 0, disponibilidades: 0, saldoDisponible: 0, registros: 0,
  saldoDisponibilidades: 0, ordenPago: 0, saldoRegistro: 0, egresos: 0, egresosPapeles: 0,
  saldoOrdenesPago: 0, ...p,
})
const gasTotal = gas('2', { pptoFinal: 40000, disponibilidades: 30000, registros: 20000, ordenPago: 10000, egresos: 6000 })
const fu = (descripcionFuente: string, recaudo: number): FilaFuenteUso => ({
  codigo: null, descripcionFuente, piIngresos: 0, pfIngresos: 0, piGastos: 0, pfGastos: 0,
  difPptoInicial: 0, difPptoFinal: 0, recaudo, pctRecaudo: 0, disponibilidades: 0, compromisos: 0,
  pctCompromisos: 0, obligaciones: 0, pagos: 0, saldoPresupuesto: 0, dispSinCompromiso: 0,
  reservas: 0, cuentasPorPagar: 0, superavitDeficit: 0, observaciones: '', ecb: 0,
})
const ind: IndicadorLey617 = { pctGfIcld: 0.3848, cumplimiento: 'Cumple' } as IndicadorLey617

describe('kpisResumen', () => {
  it('toma totales de ingresos/gastos y el indicador Ley 617', () => {
    const k = kpisResumen([ingTotal], [gasTotal], ind)
    expect(k.ingresoRecaudo).toBe(17500)
    expect(k.pctIngreso).toBe(0.4375)
    expect(k.gastoCompromisos).toBe(20000)
    expect(k.pctCompromiso).toBe(20000 / 40000)
    expect(k.ley617Pct).toBe(0.3848)
    expect(k.ley617Cumple).toBe('Cumple')
  })
  it('Ley 617 nulo cuando no se pasa indicador; 0 si faltan filas total', () => {
    const k = kpisResumen([], [], undefined)
    expect(k.ley617Pct).toBeNull()
    expect(k.ingresoPptoFinal).toBe(0)
    expect(k.pctCompromiso).toBe(0)
  })
})

describe('cascadaGastos', () => {
  it('devuelve las 5 etapas de ejecución de la fila total', () => {
    const c = cascadaGastos([gasTotal])
    expect(c).toEqual([
      { etapa: 'Ppto Final', valor: 40000 },
      { etapa: 'Disponibilidades', valor: 30000 },
      { etapa: 'Compromisos', valor: 20000 },
      { etapa: 'Órdenes de pago', valor: 10000 },
      { etapa: 'Egresos', valor: 6000 },
    ])
  })
})

describe('composicionGastos', () => {
  it('incluye solo las secciones existentes con su valor de compromisos', () => {
    const filas = [gas('2.1', { registros: 7000 }), gas('2.3', { registros: 13000 })]
    expect(composicionGastos(filas)).toEqual([
      { seccion: 'Funcionamiento', valor: 7000 },
      { seccion: 'Inversión', valor: 13000 },
    ])
  })
})

describe('topFuentesPorRecaudo', () => {
  it('ordena por recaudo desc, excluye NO APLICA y recaudo<=0, limita a n', () => {
    const filas = [fu('NO APLICA', 999), fu('A', 100), fu('B', 0), fu('C', 300), fu('D', 200)]
    expect(topFuentesPorRecaudo(filas, 2)).toEqual([
      { fuente: 'C', recaudo: 300 },
      { fuente: 'D', recaudo: 200 },
    ])
  })
})
