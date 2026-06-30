import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { TablaIngresos } from './TablaIngresos'
import type { FilaIngreso } from '../types'

const fila: FilaIngreso = {
  columna3: '1 -  - ', rubro: '1', nombre: 'INGRESOS', unidadEjec: '', fuentes: '', atributo: '',
  pptoInicial: 30807760602, adiciones: 9612520949.27, reducciones: 171780552,
  pptoFinal: 40248500999.27, ingreso: 17574447442, pctIngreso: 0.4366484963581316,
  proyeccion: 19331892186.2, observaciones: '',
}

describe('TablaIngresos', () => {
  it('muestra el rubro y el nombre de cada fila', () => {
    render(<TablaIngresos filas={[fila]} />)
    expect(screen.getByText('INGRESOS')).toBeInTheDocument()
    expect(screen.getByText('1')).toBeInTheDocument()
  })
})
