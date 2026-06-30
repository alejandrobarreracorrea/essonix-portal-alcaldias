// Helpers de formato compartidos. Solo afectan el display; los valores
// subyacentes no se redondean ni se mutan.

/** Pesos colombianos sin decimales (KPIs y tablas grandes). */
export function fmtMoneda(n: number | null | undefined): string {
  if (n == null || !Number.isFinite(n)) return '—'
  return n.toLocaleString('es-CO', { maximumFractionDigits: 0 })
}

/**
 * Pesos colombianos con 2 decimales, para las tablas de detalle donde el
 * usuario reconcilia contra la plantilla Excel. Solo afecta el display.
 */
export function fmtMoneda2(n: number | null | undefined): string {
  if (n == null || !Number.isFinite(n)) return '—'
  return n.toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

/** Porcentaje; recibe una fracción (0.83) y devuelve "83 %". */
export function fmtPct(n: number | null | undefined): string {
  if (n == null || !Number.isFinite(n)) return '—'
  return (n * 100).toLocaleString('es-CO', { maximumFractionDigits: 2 }) + ' %'
}

/** Millones para ejes de gráficos: 1_234_000_000 → "1.234 M". */
export function fmtMill(n: number | null | undefined): string {
  if (n == null || !Number.isFinite(n)) return '—'
  return (n / 1e6).toLocaleString('es-CO', { maximumFractionDigits: 0 }) + ' M'
}

/** Trunca un texto largo con … conservando un máximo de caracteres. */
export function truncar(s: string, max = 40): string {
  if (!s) return ''
  return s.length > max ? s.slice(0, max - 1).trimEnd() + '…' : s
}
