import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { SlotInsumo } from './SlotInsumo'
import type { ValidationResult } from '../validation/validators'

function selectFile(input: HTMLElement, name: string) {
  const file = new File(['x'], name, { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
  fireEvent.change(input, { target: { files: [file] } })
  return file
}

describe('SlotInsumo', () => {
  it('muestra el título y, tras una validación OK, un estado de éxito y llama onResultado', async () => {
    const ok: ValidationResult = { ok: true, issues: [] }
    const onResultado = vi.fn()
    const { container } = render(
      <SlotInsumo
        titulo="Ejecución de ingresos"
        descripcion="Reporte CCPET"
        procesar={async () => ({ validation: ok, payload: [1, 2, 3] })}
        onResultado={onResultado}
      />,
    )
    expect(screen.getByText('Ejecución de ingresos')).toBeInTheDocument()
    const input = container.querySelector('input[type="file"]')!
    selectFile(input, 'ingresos.xlsx')
    await waitFor(() => expect(onResultado).toHaveBeenCalledTimes(1))
    expect(onResultado).toHaveBeenCalledWith(
      expect.objectContaining({ payload: [1, 2, 3], fileName: 'ingresos.xlsx' }),
    )
    expect(await screen.findByText(/válido/i)).toBeInTheDocument()
  })

  it('muestra los mensajes de error cuando la validación falla', async () => {
    const bad: ValidationResult = { ok: false, issues: [{ level: 'error', message: 'No parece el reporte de ingresos.' }] }
    const onResultado = vi.fn()
    const { container } = render(
      <SlotInsumo
        titulo="Ejecución de ingresos"
        descripcion="Reporte CCPET"
        procesar={async () => ({ validation: bad, payload: null })}
        onResultado={onResultado}
      />,
    )
    selectFile(container.querySelector('input[type="file"]')!, 'malo.xlsx')
    expect(await screen.findByText('No parece el reporte de ingresos.')).toBeInTheDocument()
  })
})
