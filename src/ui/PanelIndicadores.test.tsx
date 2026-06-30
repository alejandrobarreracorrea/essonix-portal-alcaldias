import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { PanelIndicadores } from './PanelIndicadores'
import type { IndicadorLey617, IndicadoresDnp } from '../types'

const ind: IndicadorLey617 = {
  icldPropio: 5838830994.18, sgpLibreDest: 1083338192, totalIcld: 6922169186.18,
  funcAdminCentral: 2785887779.98, concejo: 193257794, personeria: 85695471, gfTotal: 3064841044.98,
  baseAdmin: 2785887779.98, dedSobretasaAmb: 30636311, dedSobretasaBomb: 48759212,
  dedSeguridadConc: 0, dedSeguroVida: 0, dedPolizaSalud: 0, dedTransporteConc: 15566000,
  dedDeficit: 0, dedCuotasPartes: 2291889, dedMesadas: 0, dedColjuegos: 25000000,
  totalAdminDepurado: 2663634367.98, pctGfIcld: 0.3847976402105142, limite: 0.8,
  diferencial: 0.41520235978948583, cumplimiento: 'Cumple',
}

const extra: IndicadoresDnp = {
  recursosPropios: {
    numerador: 431000000,
    denominador: 1000000000,
    valor: 0.431,
    numeradorLabel: 'Ingresos tributarios',
    denominadorLabel: 'Ingresos corrientes',
    baseNota: 'Base: recaudo',
  },
  magnitudInversion: {
    numerador: 650000000,
    denominador: 1000000000,
    valor: 0.65,
    numeradorLabel: 'Inversión',
    denominadorLabel: 'Gasto total',
    baseNota: 'Base: compromisos',
  },
}

describe('PanelIndicadores', () => {
  it('muestra el Indicador 1 calculado (× 100) y su cumplimiento', () => {
    render(<PanelIndicadores indicadorLey617={ind} />)
    expect(screen.getByText('1. Autofinanciación de los gastos de funcionamiento')).toBeInTheDocument()
    expect(screen.getByText(/38,48 %|38.48 %/)).toBeInTheDocument()
    expect(screen.getByText('Cumple')).toBeInTheDocument()
  })

  it('sin indicadoresExtra muestra #4 como pendiente', () => {
    render(<PanelIndicadores indicadorLey617={ind} />)
    expect(screen.getByText('4. Generación de recursos propios')).toBeInTheDocument()
    expect(screen.getAllByText(/No calculado en la plantilla/i).length).toBeGreaterThanOrEqual(1)
  })

  it('con indicadoresExtra muestra el valor de #4 y #5, y #6 sigue como No calculado', () => {
    render(<PanelIndicadores indicadorLey617={ind} indicadoresExtra={extra} />)
    // #4 muestra su porcentaje calculado (0.431 → 43,1 % en es-CO o 43.1 % en en-US)
    expect(screen.getByText(/43,1 %|43\.1 %/)).toBeInTheDocument()
    // #5 muestra su porcentaje calculado (0.65 → 65 %)
    expect(screen.getByText(/65 %/)).toBeInTheDocument()
    // #6 sigue pendiente
    expect(screen.getByText('6. Capacidad de ahorro')).toBeInTheDocument()
    expect(screen.getAllByText(/No calculado en la plantilla/i).length).toBeGreaterThanOrEqual(1)
  })
})
