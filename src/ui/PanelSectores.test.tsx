import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { PanelSectores } from './PanelSectores'
import type { FilaSector } from '../types'

const filas: FilaSector[] = [
  {
    codigo: '22', sector: 'Educación', pptoFinal: 1000, registros: 900,
    disponibilidades: 950, saldoDisponible: 50, ejecucion: 0.9,
  },
  {
    codigo: '19', sector: 'Salud y Protección Social', pptoFinal: 600, registros: 300,
    disponibilidades: 400, saldoDisponible: 200, ejecucion: 0.5,
  },
]

describe('PanelSectores', () => {
  it('renderiza el encabezado y un sector', () => {
    render(<PanelSectores filas={filas} />)
    expect(screen.getByText('Inversión por sectores')).toBeInTheDocument()
    expect(screen.getByText('Educación')).toBeInTheDocument()
  })
})
