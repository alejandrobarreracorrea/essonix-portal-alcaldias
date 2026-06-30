import { describe, it, expect } from 'vitest'
import { validateIngresos, validateGastos, validateSgp } from './validators'
import type { IngresoRawRow, GastoRawRow } from '../types'

const ingTotal: IngresoRawRow = {
  codigoRubro: '1', descripcion: 'INGRESOS', ccpet02: '', ccpet05: '', ccpet83: '',
  pptoInicial: 30807760602, adicAnteriores: 0, adicPeriodo: 9612520949.27,
  reducAnteriores: 0, reducPeriodo: 171780552, pptoFinal: 40248500999.27,
  totalIngresos: 17574447442,
}
const gasTotal: GastoRawRow = {
  rubro: '2', descripcion: 'GASTOS', cpc: '', unidadEjec: '', programatico: '',
  fuentes: '', cpi: '', atributo: '',
  pptoInicial: 30807760602, pptoFinal: 40248500999.27, disponibilidades: 29932416102.76,
  saldoDisponible: 10316084896.51, registros: 20174379502.57, saldoDisponibilidades: 9758036600.19,
  ordenPago: 10514056874.38, saldoRegistro: 9660322628.19, egresos: 6769591638.97,
  egresosPapeles: 3591312004.41, saldoOrdenesPago: 153153230.999998,
}

describe('validateIngresos', () => {
  it('acepta el total que cuadra (Briceño)', () => {
    const r = validateIngresos([ingTotal])
    expect(r.ok).toBe(true)
    expect(r.issues).toHaveLength(0)
  })
  it('rechaza si falta la fila total rubro 1', () => {
    const r = validateIngresos([{ ...ingTotal, codigoRubro: '1.1' }])
    expect(r.ok).toBe(false)
    expect(r.issues[0].message).toMatch(/fila total de INGRESOS/i)
  })
  it('rechaza si el presupuesto final no cuadra', () => {
    const r = validateIngresos([{ ...ingTotal, pptoFinal: 40248500999.27 + 5 }])
    expect(r.ok).toBe(false)
    expect(r.issues.some((i) => i.level === 'error')).toBe(true)
  })
  it('rechaza archivo vacío', () => {
    expect(validateIngresos([]).ok).toBe(false)
  })
})

describe('validateGastos', () => {
  it('acepta el total que cuadra (Briceño)', () => {
    const r = validateGastos([gasTotal])
    expect(r.ok).toBe(true)
    expect(r.issues).toHaveLength(0)
  })
  it('rechaza si una identidad de saldo no cuadra', () => {
    const r = validateGastos([{ ...gasTotal, saldoOrdenesPago: 999 }])
    expect(r.ok).toBe(false)
    expect(r.issues.some((i) => /Saldo órdenes de pago/i.test(i.message))).toBe(true)
  })
  it('rechaza si falta la fila total rubro 2', () => {
    expect(validateGastos([{ ...gasTotal, rubro: '2.1' }]).ok).toBe(false)
  })
})

describe('validateSgp', () => {
  it('acepta cuando están las dos hojas requeridas', () => {
    expect(validateSgp(['Datos Reporte SGP', 'Datos Reporte SGP Detalle']).ok).toBe(true)
  })
  it('rechaza cuando falta una hoja', () => {
    const r = validateSgp(['Datos Reporte SGP'])
    expect(r.ok).toBe(false)
    expect(r.issues[0].message).toMatch(/Datos Reporte SGP Detalle/)
  })
})
