import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { TablaGastos } from './TablaGastos'
import type { FilaGasto } from '../types'

const fila: FilaGasto = {
  extrae: '2', columna1: '', concat: '2 -  - ', rubro: '2', descripcion: 'GASTOS',
  cpc: '', unidadEjec: '', programatico: '', fuentes: '', cpi: '', atributo: '',
  pptoInicial: 30807760602, pptoFinal: 40248500999.27, disponibilidades: 29932416102.76,
  saldoDisponible: 10316084896.51, registros: 20174379502.57, saldoDisponibilidades: 9758036600.19,
  ordenPago: 10514056874.38, saldoRegistro: 9660322628.19, egresos: 6769591638.97,
  egresosPapeles: 3591312004.41, saldoOrdenesPago: 153153230.999998,
}

describe('TablaGastos', () => {
  it('muestra el rubro y el nombre de cada fila', () => {
    render(<TablaGastos filas={[fila]} />)
    expect(screen.getByText('GASTOS')).toBeInTheDocument()
    expect(screen.getByText('2')).toBeInTheDocument()
  })
})
