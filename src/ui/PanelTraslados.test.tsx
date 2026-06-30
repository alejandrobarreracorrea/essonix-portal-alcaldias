import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { PanelTraslados } from './PanelTraslados'
import type { FilaTraslado } from '../types'

const filas: FilaTraslado[] = [
  { fuente: '01 - Recursos propios', creditos: 5000, contracreditos: 3000, diferencia: 2000 },
  { fuente: '02 - SGP', creditos: 1000, contracreditos: 3000, diferencia: -2000 },
]

describe('PanelTraslados', () => {
  it('renderiza el encabezado y el total de traslados', () => {
    render(<PanelTraslados filas={filas} total={6000} />)
    expect(screen.getByText('Traslados presupuestales por fuente')).toBeInTheDocument()
    expect(screen.getByText('6.000')).toBeInTheDocument()
  })
})
