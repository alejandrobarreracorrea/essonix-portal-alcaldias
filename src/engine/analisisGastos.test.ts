import { describe, it, expect } from 'vitest'
import { analisisGastos } from './analisisGastos'
import type { GastoRawRow } from '../types'

const base: GastoRawRow = {
  rubro: '2', descripcion: 'GASTOS', cpc: '', unidadEjec: '', programatico: '',
  fuentes: '', cpi: '', atributo: '',
  pptoInicial: 30807760602, pptoFinal: 40248500999.27, disponibilidades: 29932416102.76,
  saldoDisponible: 10316084896.51, registros: 20174379502.57, saldoDisponibilidades: 9758036600.19,
  ordenPago: 10514056874.38, saldoRegistro: 9660322628.19, egresos: 6769591638.97,
  egresosPapeles: 3591312004.41, saldoOrdenesPago: 153153230.999998,
}

describe('analisisGastos', () => {
  it('reproduce la fila total con valores idénticos y columnas calculadas', () => {
    const [f] = analisisGastos([base])
    expect(f.extrae).toBe('2')
    expect(f.columna1).toBe('')
    expect(f.concat).toBe('2 -  - ')
    expect(f.pptoFinal).toBe(40248500999.27)
    expect(f.saldoOrdenesPago).toBe(153153230.999998)
  })

  it('extrae = primeros 3 caracteres del rubro', () => {
    expect(analisisGastos([{ ...base, rubro: '2.1.1' }])[0].extrae).toBe('2.1')
    expect(analisisGastos([{ ...base, rubro: '2.3.8.05.01' }])[0].extrae).toBe('2.3')
  })

  it('columna1 solo se llena cuando extrae === "2.3" (inversión)', () => {
    const inv = analisisGastos([{
      ...base, rubro: '2.3.1.01.01.001.01',
      unidadEjec: '16.0 - ENTIDADES TERRITORIALES - ADMINISTRACION CENTRAL',
      fuentes: '1.2.1.0.00 - INGRESOS CORRIENTES DE LIBRE DESTINACION',
    }])[0]
    expect(inv.columna1).toBe('2.3 - 2.3.1.01.01.001.01')
    expect(inv.concat).toBe('2.3.1.01.01.001.01 - 16.0 - ENTIDADES TERRITORIALES - ADMINISTRACION CENTRAL - 1.2.1.0.00 - INGRESOS CORRIENTES DE LIBRE DESTINACION')
    expect(analisisGastos([{ ...base, rubro: '2.1.1' }])[0].columna1).toBe('')
  })

  it('los saldos se COPIAN del insumo, no se recalculan', () => {
    // ordenPago - egresos = 70, pero el saldo de origen es 60 (= ordenPago - egresos - egresosPapeles)
    const [f] = analisisGastos([{
      ...base, ordenPago: 100, egresos: 30, egresosPapeles: 10, saldoOrdenesPago: 60,
    }])
    expect(f.saldoOrdenesPago).toBe(60)
  })
})
