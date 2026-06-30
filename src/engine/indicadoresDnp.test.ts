import { describe, it, expect } from 'vitest'
import type { FilaIngreso, FilaGasto } from '../types'
import { indicadoresDnp } from './indicadoresDnp'

function makeIngreso(rubro: string, ingreso: number): FilaIngreso {
  return {
    columna3: rubro,
    rubro,
    nombre: '',
    unidadEjec: '',
    fuentes: '',
    atributo: '',
    pptoInicial: 0,
    adiciones: 0,
    reducciones: 0,
    pptoFinal: 0,
    ingreso,
    pctIngreso: 0,
    proyeccion: 0,
    observaciones: '',
  }
}

function makeGasto(rubro: string, registros: number): FilaGasto {
  return {
    extrae: rubro.slice(0, 3),
    columna1: '',
    concat: rubro,
    rubro,
    descripcion: '',
    cpc: '',
    unidadEjec: '',
    programatico: '',
    fuentes: '',
    cpi: '',
    atributo: '',
    pptoInicial: 0,
    pptoFinal: 0,
    disponibilidades: 0,
    saldoDisponible: 0,
    registros,
    saldoDisponibilidades: 0,
    ordenPago: 0,
    saldoRegistro: 0,
    egresos: 0,
    egresosPapeles: 0,
    saldoOrdenesPago: 0,
  }
}

describe('indicadoresDnp', () => {
  const filasIngreso = [
    makeIngreso('1.1.01', 400),
    makeIngreso('1.1', 1000),
  ]
  const filasGasto = [
    makeGasto('2.3', 750),
    makeGasto('2', 1000),
  ]

  it('recursosPropios.valor = 0.4 con datos sintéticos', () => {
    const result = indicadoresDnp(filasIngreso, filasGasto)
    expect(result.recursosPropios.numerador).toBe(400)
    expect(result.recursosPropios.denominador).toBe(1000)
    expect(result.recursosPropios.valor).toBe(0.4)
  })

  it('magnitudInversion.valor = 0.75 con datos sintéticos', () => {
    const result = indicadoresDnp(filasIngreso, filasGasto)
    expect(result.magnitudInversion.numerador).toBe(750)
    expect(result.magnitudInversion.denominador).toBe(1000)
    expect(result.magnitudInversion.valor).toBe(0.75)
  })

  it('recursosPropios.valor = 0 cuando denominador es 0', () => {
    const result = indicadoresDnp(
      [makeIngreso('1.1.01', 400), makeIngreso('1.1', 0)],
      filasGasto,
    )
    expect(result.recursosPropios.valor).toBe(0)
  })

  it('magnitudInversion.valor = 0 cuando denominador es 0', () => {
    const result = indicadoresDnp(filasIngreso, [
      makeGasto('2.3', 750),
      makeGasto('2', 0),
    ])
    expect(result.magnitudInversion.valor).toBe(0)
  })

  it('numerador = 0 cuando rubro 1.1.01 ausente', () => {
    const result = indicadoresDnp([makeIngreso('1.1', 1000)], filasGasto)
    expect(result.recursosPropios.numerador).toBe(0)
  })

  it('numerador = 0 cuando rubro 2.3 ausente', () => {
    const result = indicadoresDnp(filasIngreso, [makeGasto('2', 1000)])
    expect(result.magnitudInversion.numerador).toBe(0)
  })

  it('labels y baseNota presentes en recursosPropios', () => {
    const result = indicadoresDnp(filasIngreso, filasGasto)
    expect(result.recursosPropios.numeradorLabel).toBe('Ingresos tributarios')
    expect(result.recursosPropios.denominadorLabel).toBe('Ingresos corrientes')
    expect(result.recursosPropios.baseNota).toBe('Base: recaudo')
  })

  it('labels y baseNota presentes en magnitudInversion', () => {
    const result = indicadoresDnp(filasIngreso, filasGasto)
    expect(result.magnitudInversion.numeradorLabel).toBe('Inversión')
    expect(result.magnitudInversion.denominadorLabel).toBe('Gasto total')
    expect(result.magnitudInversion.baseNota).toBe('Base: compromisos')
  })
})
