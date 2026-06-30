import { describe, it, expect } from 'vitest'
import { traslados } from './traslados'
import type { GastoRawRow } from '../types'

const gas = (fuentes: string, p: Partial<GastoRawRow>): GastoRawRow => ({
  rubro: 'x', descripcion: '', cpc: '', unidadEjec: '', programatico: '', fuentes, cpi: '', atributo: '',
  pptoInicial: 0, pptoFinal: 0, disponibilidades: 0, saldoDisponible: 0, registros: 0,
  saldoDisponibilidades: 0, ordenPago: 0, saldoRegistro: 0, egresos: 0, egresosPapeles: 0,
  saldoOrdenesPago: 0, ...p,
})

const FUENTE_A = '001 - Recursos Propios'
const FUENTE_B = '002 - SGP Educacion'

describe('traslados', () => {
  it('agrupa por código de fuente, suma créditos/contracréditos y calcula diferencia', () => {
    const rows: GastoRawRow[] = [
      gas(FUENTE_A, { creditos: 100, contracreditos: 40 }),
      gas(FUENTE_A, { creditos: 0, contracreditos: 60 }),
      gas(FUENTE_B, { creditos: 50, contracreditos: 0 }),
      gas('', { creditos: 999, contracreditos: 999 }), // sin fuente → ignorada
    ]

    const result = traslados(rows)

    expect(result.filas).toHaveLength(2)

    // Sorted by creditos desc: A (100) first, B (50) second
    const [a, b] = result.filas

    expect(a.fuente).toBe(FUENTE_A)
    expect(a.creditos).toBe(100)
    expect(a.contracreditos).toBe(100)
    expect(a.diferencia).toBe(0)

    expect(b.fuente).toBe(FUENTE_B)
    expect(b.creditos).toBe(50)
    expect(b.contracreditos).toBe(0)
    expect(b.diferencia).toBe(50)

    expect(result.total).toBe(150)
  })

  it('usa la etiqueta completa de la primera aparición de cada código', () => {
    const rows: GastoRawRow[] = [
      gas('001 - Nombre Largo Primera Vez', { creditos: 10, contracreditos: 0 }),
      gas('001 - Nombre Diferente Segunda Vez', { creditos: 5, contracreditos: 0 }),
    ]
    const { filas } = traslados(rows)
    expect(filas).toHaveLength(1)
    expect(filas[0].fuente).toBe('001 - Nombre Largo Primera Vez')
    expect(filas[0].creditos).toBe(15)
  })

  it('excluye fuentes donde ambos creditos y contracreditos son 0', () => {
    const rows: GastoRawRow[] = [
      gas('001 - Activa', { creditos: 10, contracreditos: 0 }),
      gas('002 - Cero', { creditos: 0, contracreditos: 0 }),
    ]
    const { filas } = traslados(rows)
    expect(filas).toHaveLength(1)
    expect(filas[0].fuente).toBe('001 - Activa')
  })

  it('retorna filas vacías y total 0 cuando no hay filas con fuente', () => {
    const rows: GastoRawRow[] = [
      gas('', { creditos: 100, contracreditos: 50 }),
    ]
    const result = traslados([])
    expect(result.filas).toHaveLength(0)
    expect(result.total).toBe(0)

    const result2 = traslados(rows)
    expect(result2.filas).toHaveLength(0)
    expect(result2.total).toBe(0)
  })

  it('diferencia puede ser negativa cuando contracreditos > creditos', () => {
    const rows: GastoRawRow[] = [
      gas('003 - Fuente C', { creditos: 20, contracreditos: 80 }),
    ]
    const { filas } = traslados(rows)
    expect(filas[0].diferencia).toBe(-60)
  })
})
