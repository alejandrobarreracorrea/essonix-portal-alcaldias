import type { SgpConcepto } from '../data/sgpCatalogo'
import type { SgpResumenRow } from '../parsers/sgp'
import type { FilaFuenteUso, FilaSgp, IngresoRawRow } from '../types'

/**
 * Extracts the source code from a full source string like "1.2.4.1.04 - Description".
 * Returns the part before " - " (trimmed), or the whole string (trimmed) if no separator.
 */
function codigoFuente(s: string): string {
  return s.split(' - ')[0].trim()
}

/**
 * Pure engine: produces one FilaSgp per catalog entry.
 *
 * D/E/F (ultima/once/total): from sicodis matched by sicodisConcepto (trim-compare);
 *   if sicodisConcepto is null or no match → 0/0/0.
 *
 * G (presupuesto) / J (recaudo) / L (compromisos): computed only for tipo='detalle';
 *   grupo and total rows always get null.
 *
 * Derived: H=diferencia=total-presupuesto; K=pctRecaudo; M=pctEjecucion; I=observacion.
 */
export function seguimientoSgp(
  catalogo: SgpConcepto[],
  sicodis: SgpResumenRow[],
  ingresoRows: IngresoRawRow[],
  filasFuenteUso: FilaFuenteUso[],
): FilaSgp[] {
  // Build lookup map: concepto (trimmed) → SgpResumenRow
  const sicodisMap = new Map<string, SgpResumenRow>()
  for (const row of sicodis) {
    sicodisMap.set(row.concepto.trim(), row)
  }

  return catalogo.map((s) => {
    // ── D/E/F from SICODIS ──────────────────────────────────────────────────
    let ultima = 0
    let once = 0
    let total = 0

    if (s.sicodisConcepto !== null) {
      const sicodisRow = sicodisMap.get(s.sicodisConcepto.trim())
      if (sicodisRow) {
        ultima = sicodisRow.ultima
        once = sicodisRow.once
        total = sicodisRow.total
      }
    }

    // ── G / J / L ───────────────────────────────────────────────────────────
    // Only for tipo='detalle'; grupo and total rows keep all null.
    let presupuesto: number | null = null
    let recaudo: number | null = null
    let compromisos: number | null = null

    if (s.tipo === 'detalle') {
      // G (presupuesto)
      if (s.g === 'fuente') {
        let sum = 0
        for (const r of ingresoRows) {
          if (codigoFuente(r.ccpet05) === s.fuenteCodigo) sum += r.pptoFinal
        }
        presupuesto = sum
      } else if (s.g === 'rubro') {
        let sum = 0
        for (const r of ingresoRows) {
          if (r.codigoRubro === s.rubro) sum += r.pptoFinal
        }
        presupuesto = sum
      }
      // g undefined → presupuesto stays null

      // J (recaudo)
      if (s.j === 'fuente') {
        const match = filasFuenteUso.find(
          (f) => codigoFuente(f.descripcionFuente) === s.fuenteCodigo,
        )
        recaudo = match ? match.recaudo : 0
      } else if (s.j === 'rubro') {
        let sum = 0
        for (const r of ingresoRows) {
          if (r.codigoRubro === s.rubro) sum += r.totalIngresos
        }
        recaudo = sum
      }
      // j undefined → recaudo stays null

      // L (compromisos)
      if (s.l === 'fuente') {
        const match = filasFuenteUso.find(
          (f) => codigoFuente(f.descripcionFuente) === s.fuenteCodigo,
        )
        compromisos = match ? match.compromisos : 0
      }
      // l undefined → compromisos stays null
    }

    // ── Derived ─────────────────────────────────────────────────────────────
    // Fila estructural padre (sinObservacion): presupuesto se mantiene pero
    // diferencia/observacion/recaudo/compromisos/pct se anulan para no emitir
    // recomendaciones sobre recursos ya capturados en las filas hijo.
    if (s.sinObservacion) {
      recaudo = null
      compromisos = null
    }

    const diferencia: number | null =
      s.sinObservacion ? null : presupuesto !== null ? total - presupuesto : null

    const pctRecaudo: number | null =
      recaudo !== null ? (total !== 0 ? recaudo / total : 0) : null

    const pctEjecucion: number | null =
      compromisos !== null ? (total !== 0 ? compromisos / total : 0) : null

    let observacion: string | null = null
    if (!s.sinObservacion && presupuesto !== null && diferencia !== null) {
      if (presupuesto > total) {
        observacion = `Reducir ${diferencia} en presupuesto`
      } else if (presupuesto < total) {
        const verb = s.fila === 33 || s.fila === 34 ? 'Incorporar' : 'Adicionar'
        observacion = `${verb} ${diferencia} en presupuesto`
      } else {
        observacion = 'OK'
      }
    }

    return {
      fila: s.fila,
      concepto: s.concepto,
      indent: s.indent,
      tipo: s.tipo,
      rubro: s.rubro ?? '',
      fuente: s.fuenteCodigo ?? '',
      ultima,
      once,
      total,
      presupuesto,
      diferencia,
      observacion,
      recaudo,
      pctRecaudo,
      compromisos,
      pctEjecucion,
    }
  })
}
