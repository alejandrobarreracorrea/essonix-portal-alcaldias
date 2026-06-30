import type { GastoRawRow, IndicadorLey617, IngresoRawRow } from '../types'

const ICLD_PROPIO = '1.2.1.0.00 - INGRESOS CORRIENTES DE LIBRE DESTINACION'
const SGP_LIBRE_DEST = '1.2.4.3.04 - SGP-PROPOSITO GENERAL-LIBRE DESTINACION MUNICIPIOS CATEGORIAS 4, 5 Y 6'
const RUBRO_FUNCIONAMIENTO = '2.1'
const UNIDAD_CONCEJO = '18.0 - ENTIDADES TERRITORIALES - CONCEJO'
const UNIDAD_PERSONERIA = '20.0 - ENTIDADES TERRITORIALES - PERSONERIA'
const FUENTE_SOBRETASA_AMB = '1.2.3.1.01 - SOBRETASA - PARTICIPACION AMBIENTAL - CORPORACIONES AUTONOMAS REGIONALES'
const FUENTE_SOBRETASA_BOMB = '1.2.3.1.14 - SOBRETASA BOMBERIL'
const RUBRO_SEGURIDAD_CONC = '2.1.1.01.02.020.02'
const RUBRO_TRANSPORTE_CONC = '2.1.1.01.03.125'
const RUBRO_CUOTAS_PARTES = '2.1.3.07.02.002'
const FUENTE_RETIROS_FONPET = '1.3.1.1.10 - RETIROS FONPET'
const FUENTE_COLJUEGOS = '1.2.3.2.28 - DERECHOS POR LA EXPLOTACION JUEGOS DE SUERTE Y AZAR'
const LIMITE_617 = 0.8

export function ley617(ingresoRows: IngresoRawRow[], gastoRows: GastoRawRow[]): IndicadorLey617 {
  const sumIngresoPorFuente = (f: string) =>
    ingresoRows.reduce((a, r) => (r.ccpet05.trim() === f ? a + (r.totalIngresos || 0) : a), 0)
  const sumGastoPorUnidad = (u: string) =>
    gastoRows.reduce((a, r) => (r.unidadEjec.trim() === u ? a + (r.registros || 0) : a), 0)
  const sumGastoPorFuente = (f: string) =>
    gastoRows.reduce((a, r) => (r.fuentes.trim() === f ? a + (r.registros || 0) : a), 0)
  const lookupRubro = (cod: string) => {
    const row = gastoRows.find((r) => r.rubro.trim() === cod)
    return row ? row.registros || 0 : 0
  }
  const lookupFuente = (f: string) => {
    const row = gastoRows.find((r) => r.fuentes.trim() === f)
    return row ? row.registros || 0 : 0
  }

  const icldPropio = sumIngresoPorFuente(ICLD_PROPIO)
  const sgpLibreDest = sumIngresoPorFuente(SGP_LIBRE_DEST)
  const totalIcld = icldPropio + sgpLibreDest

  const concejo = sumGastoPorUnidad(UNIDAD_CONCEJO)
  const personeria = sumGastoPorUnidad(UNIDAD_PERSONERIA)
  const funcAdminCentral = lookupRubro(RUBRO_FUNCIONAMIENTO) - concejo - personeria
  const gfTotal = funcAdminCentral + concejo + personeria

  const baseAdmin = funcAdminCentral
  const dedSobretasaAmb = sumGastoPorFuente(FUENTE_SOBRETASA_AMB)
  const dedSobretasaBomb = sumGastoPorFuente(FUENTE_SOBRETASA_BOMB)
  const dedSeguridadConc = lookupRubro(RUBRO_SEGURIDAD_CONC)
  const dedSeguroVida = 0
  const dedPolizaSalud = 0
  const dedTransporteConc = lookupRubro(RUBRO_TRANSPORTE_CONC)
  const dedDeficit = 0
  const dedCuotasPartes = lookupRubro(RUBRO_CUOTAS_PARTES)
  const dedMesadas = lookupFuente(FUENTE_RETIROS_FONPET)
  const dedColjuegos = lookupFuente(FUENTE_COLJUEGOS)

  // Orden EXACTO de la plantilla: H18-H19-H20-H21-H22-H23-H24-H25-H26-H28-H27
  const totalAdminDepurado =
    baseAdmin - dedSobretasaAmb - dedSobretasaBomb - dedSeguridadConc - dedSeguroVida -
    dedPolizaSalud - dedTransporteConc - dedDeficit - dedCuotasPartes - dedColjuegos - dedMesadas

  const pctGfIcld = totalIcld !== 0 ? totalAdminDepurado / totalIcld : 0
  const diferencial = LIMITE_617 - pctGfIcld
  const cumplimiento = pctGfIcld < LIMITE_617 ? 'Cumple' : 'No Cumple'

  return {
    icldPropio, sgpLibreDest, totalIcld,
    funcAdminCentral, concejo, personeria, gfTotal, baseAdmin,
    dedSobretasaAmb, dedSobretasaBomb, dedSeguridadConc, dedSeguroVida, dedPolizaSalud,
    dedTransporteConc, dedDeficit, dedCuotasPartes, dedMesadas, dedColjuegos,
    totalAdminDepurado, pctGfIcld, limite: LIMITE_617, diferencial, cumplimiento,
  }
}
