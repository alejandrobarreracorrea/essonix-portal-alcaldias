import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { PanelSgp } from './PanelSgp'
import type { FilaSgp } from '../types'

const filas: FilaSgp[] = [
  {
    fila: 25, concepto: 'Agua Potable', indent: 0, tipo: 'detalle', rubro: '1.1.02.06.001.05',
    fuente: '1.2.4.6.00', ultima: 100, once: 1100, total: 1200,
    presupuesto: 1200, diferencia: 0, observacion: 'OK',
    recaudo: 600, pctRecaudo: 0.5, compromisos: 1140, pctEjecucion: 0.95,
  },
  {
    fila: 37, concepto: 'TOTAL SGP', indent: 0, tipo: 'total', rubro: '', fuente: '',
    ultima: 100, once: 1100, total: 1200,
    presupuesto: null, diferencia: null, observacion: null,
    recaudo: null, pctRecaudo: null, compromisos: null, pctEjecucion: null,
  },
]

describe('PanelSgp', () => {
  it('renderiza el encabezado Seguimiento SGP y los conceptos de la ficha', () => {
    render(<PanelSgp filas={filas} />)
    expect(screen.getByText('Seguimiento SGP')).toBeInTheDocument()
    expect(screen.getByText('Agua Potable')).toBeInTheDocument()
    expect(screen.getByText('TOTAL SGP')).toBeInTheDocument()
  })
})
