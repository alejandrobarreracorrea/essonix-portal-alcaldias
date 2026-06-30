import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { TablaFuentesYUsos } from './TablaFuentesYUsos'
import type { FilaFuenteUso } from '../types'

const fila: FilaFuenteUso = {
  codigo: 2, descripcionFuente: '1.2.1.0.00 - INGRESOS CORRIENTES DE LIBRE DESTINACION',
  piIngresos: 7564774800, pfIngresos: 7564774800, piGastos: 7564774800, pfGastos: 7564774800,
  difPptoInicial: 0, difPptoFinal: 0, recaudo: 5838830994.18, pctRecaudo: 0.7718446548,
  disponibilidades: 3985453052.98, compromisos: 3758303661.98, pctCompromisos: 0.4968163311,
  obligaciones: 2422687571.18, pagos: 2384260696.18, saldoPresupuesto: 3579321747.02,
  dispSinCompromiso: 227149391, reservas: 1335616090.8, cuentasPorPagar: 38426875,
  superavitDeficit: 2080527332.2, observaciones: '', ecb: 706484366.4,
}

describe('TablaFuentesYUsos', () => {
  it('muestra la descripción de la fuente', () => {
    render(<TablaFuentesYUsos filas={[fila]} />)
    expect(screen.getByText('1.2.1.0.00 - INGRESOS CORRIENTES DE LIBRE DESTINACION')).toBeInTheDocument()
  })
})
