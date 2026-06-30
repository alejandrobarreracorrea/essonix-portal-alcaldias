import type { FilaSector, GastoRawRow } from '../types'

export function inversionPorSectores(
  gastoRows: GastoRawRow[],
  sectores: { codigo: string; nombre: string }[],
): FilaSector[] {
  const sectorMap = new Map<string, string>()
  for (const s of sectores) {
    sectorMap.set(s.codigo, s.nombre)
  }

  const pptoMap = new Map<string, number>()
  const regMap = new Map<string, number>()
  const dispMap = new Map<string, number>()
  const order: string[] = []

  for (const row of gastoRows) {
    if (!row.rubro.startsWith('2.3')) continue
    if (row.programatico.trim() === '') continue

    const codigo = row.programatico.split('|')[0].trim()

    if (!pptoMap.has(codigo)) {
      pptoMap.set(codigo, 0)
      regMap.set(codigo, 0)
      dispMap.set(codigo, 0)
      order.push(codigo)
    }

    pptoMap.set(codigo, (pptoMap.get(codigo) ?? 0) + row.pptoFinal)
    regMap.set(codigo, (regMap.get(codigo) ?? 0) + row.registros)
    dispMap.set(codigo, (dispMap.get(codigo) ?? 0) + row.disponibilidades)
  }

  const filas: FilaSector[] = []
  for (const codigo of order) {
    const pptoFinal = pptoMap.get(codigo) ?? 0
    const registros = regMap.get(codigo) ?? 0
    const disponibilidades = dispMap.get(codigo) ?? 0
    filas.push({
      codigo,
      sector: sectorMap.get(codigo) ?? codigo,
      pptoFinal,
      registros,
      disponibilidades,
      saldoDisponible: pptoFinal - disponibilidades,
      ejecucion: pptoFinal !== 0 ? registros / pptoFinal : 0,
    })
  }

  // Sort by pptoFinal desc
  filas.sort((a, b) => b.pptoFinal - a.pptoFinal)

  return filas
}
