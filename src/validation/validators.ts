import type { IngresoRawRow, GastoRawRow } from '../types'

export type ValidationIssue = { level: 'error' | 'warning'; message: string }
export type ValidationResult = { ok: boolean; issues: ValidationIssue[] }

// Tolerancia de cuadre para validación (NO es la tolerancia de fidelidad, que es 0).
const EPSILON = 1

const fmt = (n: number) => n.toLocaleString('es-CO', { maximumFractionDigits: 2 })

const result = (issues: ValidationIssue[]): ValidationResult => ({
  ok: issues.every((i) => i.level !== 'error'),
  issues,
})

export function validateIngresos(rows: IngresoRawRow[]): ValidationResult {
  const issues: ValidationIssue[] = []
  if (rows.length === 0) {
    return result([{ level: 'error', message: 'El archivo de ingresos no contiene filas de datos.' }])
  }
  const total = rows.find((r) => r.codigoRubro === '1')
  if (!total) {
    return result([{ level: 'error', message: 'No se encontró la fila total de INGRESOS (rubro "1"). ¿El archivo está completo?' }])
  }
  const adiciones = total.adicAnteriores + total.adicPeriodo
  const reducciones = total.reducAnteriores + total.reducPeriodo
  const esperado = total.pptoInicial + adiciones - reducciones
  if (Math.abs(esperado - total.pptoFinal) > EPSILON) {
    issues.push({
      level: 'error',
      message: `El presupuesto final del total no cuadra: inicial + adiciones − reducciones = ${fmt(esperado)}, pero el archivo dice ${fmt(total.pptoFinal)}.`,
    })
  }
  return result(issues)
}

export function validateGastos(rows: GastoRawRow[]): ValidationResult {
  const issues: ValidationIssue[] = []
  if (rows.length === 0) {
    return result([{ level: 'error', message: 'El archivo de gastos no contiene filas de datos.' }])
  }
  const total = rows.find((r) => r.rubro === '2')
  if (!total) {
    return result([{ level: 'error', message: 'No se encontró la fila total de GASTOS (rubro "2"). ¿El archivo está completo?' }])
  }
  const checks: [string, number, number][] = [
    ['Saldo disponible', total.saldoDisponible, total.pptoFinal - total.disponibilidades],
    ['Saldo de disponibilidades', total.saldoDisponibilidades, total.disponibilidades - total.registros],
    ['Saldo registro', total.saldoRegistro, total.registros - total.ordenPago],
    ['Saldo órdenes de pago', total.saldoOrdenesPago, total.ordenPago - total.egresos - total.egresosPapeles],
  ]
  for (const [nombre, real, esperado] of checks) {
    if (Math.abs(real - esperado) > EPSILON) {
      issues.push({ level: 'error', message: `${nombre} del total no cuadra (${fmt(real)} vs esperado ${fmt(esperado)}).` })
    }
  }
  return result(issues)
}

export function validateSgp(sheetNames: string[]): ValidationResult {
  const requeridas = ['Datos Reporte SGP', 'Datos Reporte SGP Detalle']
  const issues: ValidationIssue[] = requeridas
    .filter((s) => !sheetNames.includes(s))
    .map((s) => ({ level: 'error', message: `Falta la hoja "${s}". ¿Es el reporte de SICODIS (SGP) correcto?` }))
  return result(issues)
}
