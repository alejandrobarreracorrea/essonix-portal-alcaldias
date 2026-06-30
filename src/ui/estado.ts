// Semáforo de cumplimiento para indicadores de techo (menor es mejor):
// el `limite` es un máximo permitido (p. ej. Ley 617, límite 0.8).
//
// Los colores son cadenas CSS explícitas (hex de los tokens de diseño) para
// usarse como estilos inline y renderizar de forma fiable — evitamos las clases
// Tailwind basadas en var() que en ciertos contextos no pintan color.

export type NivelIndicador = 'ok' | 'alerta' | 'malo'

export interface EstadoIndicador {
  nivel: NivelIndicador
  color: string
  bg: string
  label: string
}

// Hexes alineados con los tokens del sistema de diseño.
const VERDE = '#0E5C46'
const VERDE_BG = '#E3F0EA'
const AMBAR = '#B7791F'
const AMBAR_BG = '#FBF1D9'
const ROJO = '#B24A33'
const ROJO_BG = '#F6E2DC'

/**
 * Clasifica un indicador de techo (menor es mejor) en semáforo:
 * - ok (verde)     si ratio < 0.85          → "Cumple"
 * - alerta (ámbar) si 0.85 ≤ ratio < 1      → "En alerta"
 * - malo (rojo)    si ratio ≥ 1             → "No cumple"
 */
export function nivelIndicador(valor: number, limite: number): EstadoIndicador {
  const ratio = limite > 0 ? valor / limite : 0

  if (ratio >= 1) {
    return { nivel: 'malo', color: ROJO, bg: ROJO_BG, label: 'No cumple' }
  }
  if (ratio >= 0.85) {
    return { nivel: 'alerta', color: AMBAR, bg: AMBAR_BG, label: 'En alerta' }
  }
  return { nivel: 'ok', color: VERDE, bg: VERDE_BG, label: 'Cumple' }
}
