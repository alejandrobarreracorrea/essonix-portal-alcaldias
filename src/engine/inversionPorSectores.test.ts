import { describe, it, expect } from 'vitest'
import { inversionPorSectores } from './inversionPorSectores'
import type { GastoRawRow } from '../types'

const gas = (rubro: string, programatico: string, p: Partial<GastoRawRow>): GastoRawRow => ({
  rubro, descripcion: '', cpc: '', unidadEjec: '', programatico, fuentes: '', cpi: '', atributo: '',
  pptoInicial: 0, pptoFinal: 0, disponibilidades: 0, saldoDisponible: 0, registros: 0,
  saldoDisponibilidades: 0, ordenPago: 0, saldoRegistro: 0, egresos: 0, egresosPapeles: 0,
  saldoOrdenesPago: 0, ...p,
})

const catalogo = [
  { codigo: '24', nombre: 'Transporte' },
  { codigo: '12', nombre: 'Justicia' },
]

describe('inversionPorSectores', () => {
  it('agrupa filas 2.3 con CCPET03, ignora 2.1 y 2.3 sin CCPET03', () => {
    const rows: GastoRawRow[] = [
      gas('2.3.1.01.100', '24 | Transporte Infraestructura', { pptoFinal: 1000, registros: 600, disponibilidades: 700 }),
      gas('2.3.2.01.200', '12 | Justicia Convivencia', { pptoFinal: 500, registros: 100, disponibilidades: 100 }),
      gas('2.1.1.01.300', '24 | Transportes', { pptoFinal: 999, registros: 999, disponibilidades: 999 }), // 2.1 → ignorada
      gas('2.3.3.01.400', '', { pptoFinal: 999, registros: 999, disponibilidades: 999 }), // sin CCPET03 → ignorada
    ]

    const filas = inversionPorSectores(rows, catalogo)

    expect(filas).toHaveLength(2)

    // Sorted by pptoFinal desc: Transporte (1000) first
    const [transporte, justicia] = filas

    expect(transporte.codigo).toBe('24')
    expect(transporte.sector).toBe('Transporte')
    expect(transporte.pptoFinal).toBe(1000)
    expect(transporte.registros).toBe(600)
    expect(transporte.disponibilidades).toBe(700)
    expect(transporte.saldoDisponible).toBe(300) // 1000 - 700
    expect(transporte.ejecucion).toBeCloseTo(0.6) // 600 / 1000

    expect(justicia.codigo).toBe('12')
    expect(justicia.sector).toBe('Justicia')
    expect(justicia.pptoFinal).toBe(500)
    expect(justicia.registros).toBe(100)
    expect(justicia.disponibilidades).toBe(100)
    expect(justicia.saldoDisponible).toBe(400) // 500 - 100
    expect(justicia.ejecucion).toBeCloseTo(0.2) // 100 / 500
  })

  it('acumula múltiples filas del mismo sector', () => {
    const rows: GastoRawRow[] = [
      gas('2.3.1.01.100', '24 | Transporte A', { pptoFinal: 600, registros: 300, disponibilidades: 400 }),
      gas('2.3.1.01.200', '24 | Transporte B', { pptoFinal: 400, registros: 100, disponibilidades: 200 }),
    ]

    const filas = inversionPorSectores(rows, catalogo)
    expect(filas).toHaveLength(1)
    expect(filas[0].pptoFinal).toBe(1000)
    expect(filas[0].registros).toBe(400)
    expect(filas[0].disponibilidades).toBe(600)
    expect(filas[0].saldoDisponible).toBe(400)
    expect(filas[0].ejecucion).toBeCloseTo(0.4)
  })

  it('usa el código como sector cuando no está en el catálogo', () => {
    const rows: GastoRawRow[] = [
      gas('2.3.1.01.100', '99 | Sector Desconocido', { pptoFinal: 200, registros: 100, disponibilidades: 100 }),
    ]

    const filas = inversionPorSectores(rows, catalogo)
    expect(filas).toHaveLength(1)
    expect(filas[0].codigo).toBe('99')
    expect(filas[0].sector).toBe('99') // fallback al código
  })

  it('ejecucion es 0 cuando pptoFinal es 0', () => {
    const rows: GastoRawRow[] = [
      gas('2.3.1.01.100', '24 | Transporte', { pptoFinal: 0, registros: 0, disponibilidades: 0 }),
    ]
    const filas = inversionPorSectores(rows, catalogo)
    expect(filas[0].ejecucion).toBe(0)
  })

  it('retorna lista vacía cuando no hay filas 2.3 con CCPET03', () => {
    const rows: GastoRawRow[] = [
      gas('1.1.1', '24 | X', { pptoFinal: 100, registros: 50, disponibilidades: 50 }),
      gas('2.3', '', { pptoFinal: 100, registros: 50, disponibilidades: 50 }),
    ]
    expect(inversionPorSectores(rows, catalogo)).toHaveLength(0)
  })
})
