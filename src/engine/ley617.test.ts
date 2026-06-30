import { describe, it, expect } from 'vitest'
import { ley617 } from './ley617'
import type { IngresoRawRow, GastoRawRow } from '../types'

const ing = (ccpet05: string, totalIngresos: number): IngresoRawRow => ({
  codigoRubro: 'x', descripcion: '', ccpet02: '', ccpet05, ccpet83: '',
  pptoInicial: 0, adicAnteriores: 0, adicPeriodo: 0, reducAnteriores: 0, reducPeriodo: 0,
  pptoFinal: 0, totalIngresos,
})
const gas = (p: Partial<GastoRawRow>): GastoRawRow => ({
  rubro: 'x', descripcion: '', cpc: '', unidadEjec: '', programatico: '', fuentes: '', cpi: '', atributo: '',
  pptoInicial: 0, pptoFinal: 0, disponibilidades: 0, saldoDisponible: 0, registros: 0,
  saldoDisponibilidades: 0, ordenPago: 0, saldoRegistro: 0, egresos: 0, egresosPapeles: 0,
  saldoOrdenesPago: 0, ...p,
})

const ICLD = '1.2.1.0.00 - INGRESOS CORRIENTES DE LIBRE DESTINACION'
const SGP = '1.2.4.3.04 - SGP-PROPOSITO GENERAL-LIBRE DESTINACION MUNICIPIOS CATEGORIAS 4, 5 Y 6'

describe('ley617', () => {
  it('calcula el indicador y el cumplimiento', () => {
    const ingresos = [ing(ICLD, 1000), ing(SGP, 200), ing('OTRA', 9999)]
    const gastos = [
      gas({ rubro: '2.1', registros: 500 }),               // funcionamiento total (lookup)
      gas({ unidadEjec: '18.0 - ENTIDADES TERRITORIALES - CONCEJO', registros: 100 }),
      gas({ unidadEjec: '20.0 - ENTIDADES TERRITORIALES - PERSONERIA', registros: 50 }),
      gas({ fuentes: '1.2.3.1.14 - SOBRETASA BOMBERIL', registros: 30 }),
    ]
    const r = ley617(ingresos, gastos)
    expect(r.totalIcld).toBe(1200)
    expect(r.concejo).toBe(100)
    expect(r.personeria).toBe(50)
    expect(r.funcAdminCentral).toBe(350) // 500 - 100 - 50
    expect(r.dedSobretasaBomb).toBe(30)
    expect(r.totalAdminDepurado).toBe(320) // 350 - 30 (resto deducciones 0)
    expect(r.pctGfIcld).toBe(320 / 1200)
    expect(r.diferencial).toBe(0.8 - 320 / 1200)
    expect(r.cumplimiento).toBe('Cumple')
  })

  it('lookup usa la PRIMERA coincidencia, no suma', () => {
    const gastos = [gas({ rubro: '2.1', registros: 500 }), gas({ rubro: '2.1', registros: 999 })]
    expect(ley617([], gastos).funcAdminCentral).toBe(500)
  })

  it('% es 0 si el ICLD es 0 (IFERROR) y marca No Cumple si supera el límite', () => {
    const sinIcld = ley617([], [gas({ rubro: '2.1', registros: 500 })])
    expect(sinIcld.pctGfIcld).toBe(0)
    expect(sinIcld.cumplimiento).toBe('Cumple') // 0 < 0.8
    const supera = ley617([ing(ICLD, 100)], [gas({ rubro: '2.1', registros: 90 })])
    expect(supera.pctGfIcld).toBe(0.9)
    expect(supera.cumplimiento).toBe('No Cumple')
  })
})
