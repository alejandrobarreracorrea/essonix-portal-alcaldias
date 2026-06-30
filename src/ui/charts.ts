// Paleta cohesiva de gráficos, derivada de los tokens de identidad.
// Orden intencional para que las series tengan jerarquía editorial.

export const CHART_COLORS = [
  '#0e5c46', // forest
  '#c0892d', // gold
  '#2a8c7a', // teal
  '#b24a33', // clay
  '#6fa08c', // sage
  '#d9b679', // sand
  '#0c4d3a', // forest-700
  '#8a5a16', // gold-deep
] as const

/** Color de texto para ejes. */
export const AXIS = '#9a8f7a'

/** Color de líneas guía / grid. */
export const GRID = '#e4ded2'

/** Estilo de tooltip coherente con los tokens (para Recharts). */
export const TOOLTIP_STYLE = {
  background: 'var(--surface)',
  border: '1px solid var(--line)',
  borderRadius: 12,
  color: 'var(--ink)',
  boxShadow: '0 16px 34px -20px rgba(10,61,46,.25)',
} as const
