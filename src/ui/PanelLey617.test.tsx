import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { PanelLey617 } from './PanelLey617'
import type { IndicadorLey617 } from '../types'

const ind: IndicadorLey617 = {
  icldPropio: 5838830994.18, sgpLibreDest: 1083338192, totalIcld: 6922169186.18,
  funcAdminCentral: 2785887779.98, concejo: 193257794, personeria: 85695471, gfTotal: 3064841044.98,
  baseAdmin: 2785887779.98, dedSobretasaAmb: 30636311, dedSobretasaBomb: 48759212,
  dedSeguridadConc: 0, dedSeguroVida: 0, dedPolizaSalud: 0, dedTransporteConc: 15566000,
  dedDeficit: 0, dedCuotasPartes: 2291889, dedMesadas: 0, dedColjuegos: 25000000,
  totalAdminDepurado: 2663634367.98, pctGfIcld: 0.3847976402105142, limite: 0.8,
  diferencial: 0.41520235978948583, cumplimiento: 'Cumple',
}

describe('PanelLey617', () => {
  it('muestra el % del indicador y el cumplimiento', () => {
    render(<PanelLey617 indicador={ind} />)
    expect(screen.getByText('Cumple')).toBeInTheDocument()
    expect(screen.getByText(/38,48 %|38.48 %/)).toBeInTheDocument()
  })
})
