import type { FilaTraslado, GastoRawRow } from '../types'

/** Extracts the código portion before the first ' - ' separator. */
function codigoFuente(s: string): string {
  return s.split(' - ')[0].trim()
}

export function traslados(gastoRows: GastoRawRow[]): { filas: FilaTraslado[]; total: number } {
  // Maintain first-occurrence label per código
  const labels = new Map<string, string>()
  const credMap = new Map<string, number>()
  const contMap = new Map<string, number>()
  const order: string[] = []

  for (const row of gastoRows) {
    const fuente = row.fuentes.trim()
    if (fuente === '') continue

    const codigo = codigoFuente(fuente)

    if (!labels.has(codigo)) {
      labels.set(codigo, fuente)
      credMap.set(codigo, 0)
      contMap.set(codigo, 0)
      order.push(codigo)
    }

    credMap.set(codigo, (credMap.get(codigo) ?? 0) + (row.creditos ?? 0))
    contMap.set(codigo, (contMap.get(codigo) ?? 0) + (row.contracreditos ?? 0))
  }

  const filas: FilaTraslado[] = []
  for (const codigo of order) {
    const creditos = credMap.get(codigo) ?? 0
    const contracreditos = contMap.get(codigo) ?? 0
    if (creditos === 0 && contracreditos === 0) continue
    filas.push({
      fuente: labels.get(codigo)!,
      creditos,
      contracreditos,
      diferencia: creditos - contracreditos,
    })
  }

  // Sort by creditos desc
  filas.sort((a, b) => b.creditos - a.creditos)

  const total = filas.reduce((acc, f) => acc + f.creditos, 0)

  return { filas, total }
}
