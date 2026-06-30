import { describe, it, expect } from 'vitest'
import type { FilaFuenteUso, FilaGasto, FilaIngreso } from '../types'
import {
  distribucionPresupuesto,
  esHoja,
  fuentesInsights,
  ingresoInsights,
} from './informeData'

/* ---------------- fábricas mínimas de fixtures ---------------- */
function gasto(rubro: string, p: Partial<FilaGasto> = {}): FilaGasto {
  return {
    extrae: '', columna1: '', concat: '', rubro, descripcion: '', cpc: '',
    unidadEjec: '', programatico: '', fuentes: '', cpi: '', atributo: '',
    pptoInicial: 0, pptoFinal: 0, disponibilidades: 0, saldoDisponible: 0,
    registros: 0, saldoDisponibilidades: 0, ordenPago: 0, saldoRegistro: 0,
    egresos: 0, egresosPapeles: 0, saldoOrdenesPago: 0, ...p,
  }
}

function fuente(descripcionFuente: string, p: Partial<FilaFuenteUso> = {}): FilaFuenteUso {
  return {
    codigo: null, descripcionFuente, piIngresos: 0, pfIngresos: 0, piGastos: 0,
    pfGastos: 0, difPptoInicial: 0, difPptoFinal: 0, recaudo: 0, pctRecaudo: 0,
    disponibilidades: 0, compromisos: 0, pctCompromisos: 0, obligaciones: 0,
    pagos: 0, saldoPresupuesto: 0, dispSinCompromiso: 0, reservas: 0,
    cuentasPorPagar: 0, superavitDeficit: 0, observaciones: '', ecb: 0, ...p,
  }
}

function ingreso(rubro: string, nombre: string, p: Partial<FilaIngreso> = {}): FilaIngreso {
  return {
    columna3: '', rubro, nombre, unidadEjec: '', fuentes: '', atributo: '',
    pptoInicial: 0, adiciones: 0, reducciones: 0, pptoFinal: 0, ingreso: 0,
    pctIngreso: 0, proyeccion: 0, observaciones: '', ...p,
  }
}

/* ---------------- distribucionPresupuesto ---------------- */
describe('distribucionPresupuesto', () => {
  const filas = [
    gasto('2', { pptoFinal: 1000, disponibilidades: 700, registros: 600, saldoDisponible: 300 }),
    gasto('2.1', { pptoFinal: 250, disponibilidades: 200, registros: 180, saldoDisponible: 50 }),
    gasto('2.3', { pptoFinal: 750, disponibilidades: 500, registros: 420, saldoDisponible: 250 }),
  ]

  it('incluye solo las secciones presentes con su pct sobre el total', () => {
    const d = distribucionPresupuesto(filas)
    expect(d.secciones.map((s) => s.rubro)).toEqual(['2.1', '2.3'])
    expect(d.secciones[0].pct).toBeCloseTo(0.25)
    expect(d.secciones[1].pct).toBeCloseTo(0.75)
    expect(d.secciones[0].compromisos).toBe(180)
    expect(d.total?.pptoFinal).toBe(1000)
  })

  it('pct=0 si no hay total (rubro 2)', () => {
    const d = distribucionPresupuesto([gasto('2.1', { pptoFinal: 250 })])
    expect(d.total).toBeNull()
    expect(d.secciones[0].pct).toBe(0)
  })
})

/* ---------------- fuentesInsights ---------------- */
describe('fuentesInsights', () => {
  const filas = [
    fuente('NO APLICA', { pfGastos: 9999, compromisos: 9999, saldoPresupuesto: 9999 }),
    fuente('SGP Educación', { pfGastos: 1000, compromisos: 950, pctCompromisos: 0.95, saldoPresupuesto: 50, reservas: 30, cuentasPorPagar: 10 }),
    fuente('Recursos propios', { pfGastos: 1000, compromisos: 0, pctCompromisos: 0, saldoPresupuesto: 1000 }),
    fuente('Regalías', { pfGastos: 500, compromisos: 460, pctCompromisos: 0.92, saldoPresupuesto: 40, reservas: 5, cuentasPorPagar: 100 }),
    fuente('Sin presupuesto', { pfGastos: 0, compromisos: 0, saldoPresupuesto: 0 }),
  ]

  it('excluye NO APLICA y calcula grado de ejecución del gasto', () => {
    const i = fuentesInsights(filas)
    // (950 + 0 + 460) / (1000 + 1000 + 500) = 1410/2500
    expect(i.gradoEjecucionGasto).toBeCloseTo(1410 / 2500)
  })

  it('cuenta fuentes con ejecución 0% (pfGastos>0 && compromisos===0)', () => {
    const i = fuentesInsights(filas)
    expect(i.ceroCount).toBe(1)
    expect(i.cero[0].descripcionFuente).toBe('Recursos propios')
  })

  it('lista alta ejecución (≥90%) ordenada desc', () => {
    const i = fuentesInsights(filas)
    expect(i.altaEjecucionCount).toBe(2)
    expect(i.altaEjecucion.map((f) => f.descripcionFuente)).toEqual(['SGP Educación', 'Regalías'])
  })

  it('suma reservas y cuentas por pagar, top desc', () => {
    const i = fuentesInsights(filas)
    expect(i.reservasTotal).toBe(35)
    expect(i.topReservas[0].descripcionFuente).toBe('SGP Educación')
    expect(i.cuentasPorPagarTotal).toBe(110)
    expect(i.topCxP[0].descripcionFuente).toBe('Regalías')
  })

  it('grado de ejecución 0 si ΣpfGastos=0', () => {
    expect(fuentesInsights([fuente('x')]).gradoEjecucionGasto).toBe(0)
  })
})

/* ---------------- ingresoInsights ---------------- */
describe('ingresoInsights', () => {
  const filas = [
    ingreso('1', 'INGRESOS', { pptoFinal: 1000, ingreso: 600, pctIngreso: 0.6 }),
    ingreso('1.1', 'TRIBUTARIOS', { pptoFinal: 800, ingreso: 500 }), // aggregate (tiene hijos)
    ingreso('1.1.1', 'IMPUESTO PREDIAL UNIFICADO', { pptoFinal: 400, ingreso: 380, pctIngreso: 0.95 }),
    ingreso('1.1.2', 'INDUSTRIA Y COMERCIO', { pptoFinal: 400, ingreso: 120, pctIngreso: 0.3 }),
    ingreso('1.2', 'NO TRIBUTARIOS', { pptoFinal: 200, ingreso: 0, pctIngreso: 0 }), // hoja sin recaudo
  ]

  it('detecta hojas correctamente (excluye agregados)', () => {
    const f11 = filas.find((f) => f.rubro === '1.1')!
    const f111 = filas.find((f) => f.rubro === '1.1.1')!
    expect(esHoja(f11, filas)).toBe(false)
    expect(esHoja(f111, filas)).toBe(true)
  })

  it('total recaudo y pct desde rubro 1', () => {
    const i = ingresoInsights(filas)
    expect(i.recaudoTotal).toBe(600)
    expect(i.pct).toBeCloseTo(0.6)
  })

  it('cuenta rentas ≥90% y sin recaudo (solo hojas)', () => {
    const i = ingresoInsights(filas)
    expect(i.altaEjecucionCount).toBe(1)
    expect(i.altaEjecucion[0].rubro).toBe('1.1.1')
    expect(i.sinRecaudoCount).toBe(1)
    expect(i.sinRecaudo[0].rubro).toBe('1.2')
  })

  it('identifica predial entre las hojas', () => {
    const i = ingresoInsights(filas)
    expect(i.predial.map((f) => f.rubro)).toEqual(['1.1.1'])
  })

  it('topRentas ordena hojas por recaudo desc', () => {
    const i = ingresoInsights(filas)
    expect(i.topRentas[0].rubro).toBe('1.1.1')
  })
})
