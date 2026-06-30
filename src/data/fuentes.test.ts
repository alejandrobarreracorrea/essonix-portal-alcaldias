import { describe, it, expect } from 'vitest'
import fuentes from './fuentes.json'
import type { FuenteCatalogo } from '../types'

describe('catálogo de fuentes', () => {
  it('tiene 234 entradas en orden, empezando por NO APLICA', () => {
    const cat = fuentes as FuenteCatalogo[]
    expect(cat).toHaveLength(234)
    expect(cat[0].descripcionFuente).toBe('NO APLICA')
    expect(cat.some((f) => f.descripcionFuente === '1.2.1.0.00 - INGRESOS CORRIENTES DE LIBRE DESTINACION')).toBe(true)
  })
})
