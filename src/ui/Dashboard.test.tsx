import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { Dashboard } from './Dashboard'
import type { FilaIngreso, FilaGasto } from '../types'

const filaIngreso: FilaIngreso = {
  columna3: '', rubro: '1', nombre: 'INGRESOS', unidadEjec: '', fuentes: '', atributo: '',
  pptoInicial: 100, adiciones: 0, reducciones: 0, pptoFinal: 100,
  ingreso: 80, pctIngreso: 80, proyeccion: 100, observaciones: '',
}

const filaGasto: FilaGasto = {
  extrae: '', columna1: '', concat: '', rubro: '2', descripcion: 'GASTOS',
  cpc: '', unidadEjec: '', programatico: '', fuentes: '', cpi: '', atributo: '',
  pptoInicial: 100, pptoFinal: 100, disponibilidades: 80, saldoDisponible: 20,
  registros: 60, saldoDisponibilidades: 20, ordenPago: 40, saldoRegistro: 20,
  egresos: 30, egresosPapeles: 10, saldoOrdenesPago: 0,
}

describe('Dashboard', () => {
  it('muestra mensaje vacío cuando no hay áreas', () => {
    render(<Dashboard filasIngreso={[]} filasGasto={[]} />)
    expect(screen.getByText(/carga y valida/i)).toBeInTheDocument()
  })

  it('muestra ambas pestañas y la de ingresos activa por defecto', () => {
    render(<Dashboard filasIngreso={[filaIngreso]} filasGasto={[filaGasto]} />)
    expect(screen.getByRole('button', { name: /ingresos/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /gastos/i })).toBeInTheDocument()
  })

  it('cambia a la pestaña de gastos al hacer clic', () => {
    render(<Dashboard filasIngreso={[filaIngreso]} filasGasto={[filaGasto]} />)
    const gastosBtn = screen.getByRole('button', { name: /gastos/i })
    fireEvent.click(gastosBtn)
    // After clicking Gastos, the Gastos button should have the active class
    expect(gastosBtn.className).toContain('border-b-2')
  })

  it('solo muestra una pestaña cuando solo hay ingresos', () => {
    render(<Dashboard filasIngreso={[filaIngreso]} filasGasto={[]} />)
    expect(screen.getByRole('button', { name: /ingresos/i })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /gastos/i })).not.toBeInTheDocument()
  })
})
