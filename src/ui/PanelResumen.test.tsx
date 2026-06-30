import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { PanelResumen } from './PanelResumen'
import type { FilaIngreso, FilaGasto } from '../types'

const ingTotal: FilaIngreso = {
  columna3: '', rubro: '1', nombre: 'INGRESOS', unidadEjec: '', fuentes: '', atributo: '',
  pptoInicial: 0, adiciones: 0, reducciones: 0, pptoFinal: 40000, ingreso: 17500,
  pctIngreso: 0.4375, proyeccion: 0, observaciones: '',
}
const gasTotal: FilaGasto = {
  extrae: '', columna1: '', concat: '', rubro: '2', descripcion: '', cpc: '', unidadEjec: '',
  programatico: '', fuentes: '', cpi: '', atributo: '',
  pptoInicial: 0, pptoFinal: 40000, disponibilidades: 30000, saldoDisponible: 0, registros: 20000,
  saldoDisponibilidades: 0, ordenPago: 10000, saldoRegistro: 0, egresos: 6000, egresosPapeles: 0,
  saldoOrdenesPago: 0,
}

describe('PanelResumen', () => {
  it('muestra las tarjetas KPI con el recaudo y los compromisos', () => {
    render(<PanelResumen filasIngreso={[ingTotal]} filasGasto={[gasTotal]} filasFuenteUso={[]} indicadorLey617={undefined} />)
    expect(screen.getByText('Recaudo de ingresos')).toBeInTheDocument()
    expect(screen.getByText('Compromisos de gastos')).toBeInTheDocument()
  })
})
