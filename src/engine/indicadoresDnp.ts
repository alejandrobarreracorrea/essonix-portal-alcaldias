import type { FilaIngreso, FilaGasto, IndicadoresDnp } from '../types'

export function indicadoresDnp(
  filasIngreso: FilaIngreso[],
  filasGasto: FilaGasto[],
): IndicadoresDnp {
  const numeradorRP = filasIngreso.find((r) => r.rubro === '1.1.01')?.ingreso ?? 0
  const denominadorRP = filasIngreso.find((r) => r.rubro === '1.1')?.ingreso ?? 0
  const valorRP = denominadorRP !== 0 ? numeradorRP / denominadorRP : 0

  const numeradorMI = filasGasto.find((r) => r.rubro === '2.3')?.registros ?? 0
  const denominadorMI = filasGasto.find((r) => r.rubro === '2')?.registros ?? 0
  const valorMI = denominadorMI !== 0 ? numeradorMI / denominadorMI : 0

  return {
    recursosPropios: {
      numerador: numeradorRP,
      denominador: denominadorRP,
      valor: valorRP,
      numeradorLabel: 'Ingresos tributarios',
      denominadorLabel: 'Ingresos corrientes',
      baseNota: 'Base: recaudo',
    },
    magnitudInversion: {
      numerador: numeradorMI,
      denominador: denominadorMI,
      valor: valorMI,
      numeradorLabel: 'Inversión',
      denominadorLabel: 'Gasto total',
      baseNota: 'Base: compromisos',
    },
  }
}
