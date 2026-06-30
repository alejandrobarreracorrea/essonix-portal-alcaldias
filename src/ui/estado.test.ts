import { describe, it, expect } from 'vitest'
import { nivelIndicador } from './estado'

describe('nivelIndicador (indicador de techo)', () => {
  it('marca ok/Cumple cuando el ratio es bajo (0.48)', () => {
    const e = nivelIndicador(0.48, 1) // ratio 0.48
    expect(e.nivel).toBe('ok')
    expect(e.label).toBe('Cumple')
    expect(e.color).toMatch(/^#/)
    expect(e.bg).toMatch(/^#/)
  })

  it('marca alerta/En alerta cerca del límite (0.92)', () => {
    const e = nivelIndicador(0.92, 1) // ratio 0.92
    expect(e.nivel).toBe('alerta')
    expect(e.label).toBe('En alerta')
  })

  it('marca malo/No cumple al superar el límite (1.1)', () => {
    const e = nivelIndicador(1.1, 1) // ratio 1.1
    expect(e.nivel).toBe('malo')
    expect(e.label).toBe('No cumple')
  })

  it('usa los umbrales sobre el límite real (Ley 617, límite 0.8)', () => {
    expect(nivelIndicador(0.3848, 0.8).nivel).toBe('ok') // ratio ~0.48
    expect(nivelIndicador(0.7, 0.8).nivel).toBe('alerta') // ratio 0.875
    expect(nivelIndicador(0.85, 0.8).nivel).toBe('malo') // ratio >1
  })
})
