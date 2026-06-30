import { describe, it, expect } from 'vitest'
import { analisisIngresos } from './analisisIngresos'
import type { IngresoRawRow } from '../types'

const base: IngresoRawRow = {
  codigoRubro: '1', descripcion: 'INGRESOS', ccpet02: '', ccpet05: '', ccpet83: '',
  pptoInicial: 30807760602, adicAnteriores: 0, adicPeriodo: 9612520949.27,
  reducAnteriores: 0, reducPeriodo: 171780552, pptoFinal: 40248500999.27,
  totalIngresos: 17574447442,
}

describe('analisisIngresos', () => {
  it('reproduce la fila total con valores idénticos a la plantilla', () => {
    const [f] = analisisIngresos([base])
    expect(f.pptoInicial).toBe(30807760602)
    expect(f.adiciones).toBe(9612520949.27)
    expect(f.reducciones).toBe(171780552)
    expect(f.pptoFinal).toBe(40248500999.27)
    expect(f.ingreso).toBe(17574447442)
    expect(f.pctIngreso).toBe(0.4366484963581316)
    expect(f.proyeccion).toBe(19331892186.2)
    expect(f.columna3).toBe('1 -  - ')
    expect(f.observaciones).toBe('')
  })

  it('columna3 = rubro - unidadEjec - fuentes', () => {
    const [f] = analisisIngresos([{
      ...base, codigoRubro: '1.1.01.01.014.01',
      ccpet02: '16.0 - ENTIDADES TERRITORIALES - ADMINISTRACION CENTRAL',
      ccpet05: '1.2.3.1.01 - SOBRETASA',
    }])
    expect(f.columna3).toBe('1.1.01.01.014.01 - 16.0 - ENTIDADES TERRITORIALES - ADMINISTRACION CENTRAL - 1.2.3.1.01 - SOBRETASA')
  })

  it('pctIngreso es 0 cuando el presupuesto final es 0 (división por cero)', () => {
    const [f] = analisisIngresos([{ ...base, pptoFinal: 0, totalIngresos: 30594839 }])
    expect(f.pctIngreso).toBe(0)
    expect(f.proyeccion).toBe(33654322.9)
  })
})
