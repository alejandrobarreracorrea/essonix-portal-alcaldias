import { describe, it, expect } from 'vitest'
import { fuentesYUsos } from './fuentesYUsos'
import type { FuenteCatalogo, IngresoRawRow, GastoRawRow } from '../types'

const ing = (ccpet05: string, pptoInicial: number, pptoFinal: number, totalIngresos: number): IngresoRawRow => ({
  codigoRubro: 'x', descripcion: '', ccpet02: '', ccpet05, ccpet83: '',
  pptoInicial, adicAnteriores: 0, adicPeriodo: 0, reducAnteriores: 0, reducPeriodo: 0,
  pptoFinal, totalIngresos,
})
const gas = (fuentes: string, p: Partial<GastoRawRow>): GastoRawRow => ({
  rubro: 'x', descripcion: '', cpc: '', unidadEjec: '', programatico: '', fuentes, cpi: '', atributo: '',
  pptoInicial: 0, pptoFinal: 0, disponibilidades: 0, saldoDisponible: 0, registros: 0,
  saldoDisponibilidades: 0, ordenPago: 0, saldoRegistro: 0, egresos: 0, egresosPapeles: 0,
  saldoOrdenesPago: 0, ...p,
})

const F = '1.2.1.0.00 - ICLD'
const catalogo: FuenteCatalogo[] = [
  { codigo: 0, descripcionFuente: 'NO APLICA' },
  { codigo: 2, descripcionFuente: F },
]

describe('fuentesYUsos', () => {
  it('agrega ingresos y gastos por fuente y calcula derivadas', () => {
    const ingresos = [ing(F, 100, 200, 150), ing(F, 0, 50, 30), ing('OTRA', 999, 999, 999)]
    const gastos = [gas(F, { pptoInicial: 80, pptoFinal: 180, disponibilidades: 120, registros: 90, ordenPago: 40, egresos: 10, egresosPapeles: 5 })]
    const [noAplica, icld] = fuentesYUsos(catalogo, ingresos, gastos)

    // ICLD
    expect(icld.piIngresos).toBe(100)
    expect(icld.pfIngresos).toBe(250)
    expect(icld.piGastos).toBe(80)
    expect(icld.pfGastos).toBe(180)
    expect(icld.recaudo).toBe(180)
    expect(icld.disponibilidades).toBe(120)
    expect(icld.compromisos).toBe(90)
    expect(icld.obligaciones).toBe(40)
    expect(icld.pagos).toBe(15) // egresos 10 + egresosPapeles 5
    expect(icld.difPptoInicial).toBe(20) // 100 - 80
    expect(icld.difPptoFinal).toBe(70) // 250 - 180
    expect(icld.pctRecaudo).toBe(180 / 250)
    expect(icld.pctCompromisos).toBe(90 / 180)
    expect(icld.saldoPresupuesto).toBe(130) // 250 - 120
    expect(icld.dispSinCompromiso).toBe(30) // 120 - 90
    expect(icld.reservas).toBe(50) // 90 - 40
    expect(icld.cuentasPorPagar).toBe(25) // 40 - 15
    expect(icld.superavitDeficit).toBe(90) // 180 - 90
    expect(icld.ecb).toBe(15) // 90 - 50 - 25

    // NO APLICA → todo 0
    expect(noAplica.pfIngresos).toBe(0)
    expect(noAplica.pctRecaudo).toBe(0)
    expect(noAplica.ecb).toBe(0)
  })

  it('% es 0 cuando el denominador es 0 (IFERROR)', () => {
    const [, icld] = fuentesYUsos(catalogo, [ing(F, 0, 0, 100)], [])
    expect(icld.pctRecaudo).toBe(0) // pfIngresos 0
    expect(icld.pctCompromisos).toBe(0) // pfGastos 0
  })

  it('respeta el orden y el contenido del catálogo', () => {
    const filas = fuentesYUsos(catalogo, [], [])
    expect(filas.map((f) => f.descripcionFuente)).toEqual(['NO APLICA', F])
    expect(filas[1].codigo).toBe(2)
  })
})
