import { describe, it, expect } from 'vitest'
import { text, num } from './sheet'

describe('text', () => {
  it('None/undefined → cadena vacía', () => {
    expect(text(null)).toBe('')
    expect(text(undefined)).toBe('')
  })
  it('recorta espacios', () => {
    expect(text('  hola  ')).toBe('hola')
  })
  it('convierte números a string', () => {
    expect(text(5)).toBe('5')
  })
})

describe('num', () => {
  it('pasa números tal cual (sin redondeo)', () => {
    expect(num(40248500999.27)).toBe(40248500999.27)
  })
  it('None/cadena vacía → 0', () => {
    expect(num(null)).toBe(0)
    expect(num('')).toBe(0)
  })
  it('string numérico → número exacto', () => {
    expect(num('153153230.999998')).toBe(153153230.999998)
  })
  it('string no parseable → 0', () => {
    expect(num('N/A')).toBe(0)
  })
})
