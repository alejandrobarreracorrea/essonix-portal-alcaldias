import { describe, it, expect } from 'vitest'
import sectores from './sectores.json'

describe('sectores.json', () => {
  it('tiene más de 10 entradas', () => {
    expect(sectores.length).toBeGreaterThan(10)
  })

  it('el código "12" mapea a un nombre que contiene "Justicia"', () => {
    const entry = sectores.find((s) => s.codigo === '12')
    expect(entry).toBeDefined()
    expect(entry!.nombre).toContain('Justicia')
  })

  it('todos los códigos son de 2 dígitos', () => {
    for (const s of sectores) {
      expect(s.codigo).toMatch(/^\d{2}$/)
    }
  })
})
