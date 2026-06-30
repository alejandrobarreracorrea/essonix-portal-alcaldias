import type { ReactNode } from 'react'
import type { FilaSgp } from '../types'
import { fmtPct } from './format'

/* ------------------------------------------------------------------ */
/* Constantes de color del semáforo (mayor = mejor)                    */
/* ------------------------------------------------------------------ */
export const VERDE = '#0E5C46'
export const AMBAR = '#B7791F'
export const ROJO = '#B24A33'

/**
 * Devuelve el color semáforo para una fracción donde mayor es mejor.
 * ≥ 0.9 → verde · ≥ 0.5 → ámbar · resto → rojo
 */
export function colorPorNivel(frac: number): string {
  if (frac >= 0.9) return VERDE
  if (frac >= 0.5) return AMBAR
  return ROJO
}

/**
 * Calcula el % de ejecución global del SGP:
 * Σcompromisos / Σtotal sobre filas donde compromisos != null && total > 0.
 */
export function pctEjecucionGlobalSgp(filas: FilaSgp[]): number {
  let sumComp = 0
  let sumTotal = 0
  for (const f of filas) {
    if (f.compromisos != null && f.total > 0) {
      sumComp += f.compromisos
      sumTotal += f.total
    }
  }
  return sumTotal !== 0 ? sumComp / sumTotal : 0
}

/** Celda de % con punto de color semáforo (ejecución: mayor mejor). */
export function pctEjecCell(p: number): ReactNode {
  const color = colorPorNivel(p)
  return (
    <span className="inline-flex items-center justify-end gap-1.5">
      <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: color }} aria-hidden />
      <span style={{ color }}>{fmtPct(p)}</span>
    </span>
  )
}
