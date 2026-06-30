import { describe, it, expect } from 'vitest'
import { seguimientoSgp } from './seguimientoSgp'
import type { SgpConcepto } from '../../src/data/sgpCatalogo'
import type { SgpResumenRow } from '../../src/parsers/sgp'
import type { IngresoRawRow, FilaFuenteUso } from '../../src/types'

// ---------------------------------------------------------------------------
// Synthetic minimal catalog
// ---------------------------------------------------------------------------
const catalog: SgpConcepto[] = [
  // fila 1: grupo → only D/E/F; G/J/L/derivadas = null
  { fila: 1, concepto: 'Grupo A', indent: 0, tipo: 'grupo', sicodisConcepto: 'Grupo A' },

  // fila 2: detalle, g=fuente, j=fuente, l=fuente
  //         presupuesto=5000 > total=2200 → Reducir; H=-2800
  {
    fila: 2, concepto: 'Detalle Fuente', indent: 1, tipo: 'detalle',
    rubro: 'R1', fuenteCodigo: 'F1',
    g: 'fuente', j: 'fuente', l: 'fuente',
    sicodisConcepto: 'Concepto 1',
  },

  // fila 3: detalle, g=rubro, j=rubro (no l)
  //         presupuesto=6000 > total=3300 → Reducir; compromisos=null
  {
    fila: 3, concepto: 'Detalle Rubro', indent: 1, tipo: 'detalle',
    rubro: 'R2', fuenteCodigo: 'F2',
    g: 'rubro', j: 'rubro',
    sicodisConcepto: 'Concepto 2',
  },

  // fila 4: sicodisConcepto=null → D/E/F=0/0/0; total=0 → K/M=0
  {
    fila: 4, concepto: 'Sin SICODIS', indent: 0, tipo: 'detalle',
    rubro: 'R3', fuenteCodigo: 'F3',
    g: 'fuente', j: 'fuente', l: 'fuente',
    sicodisConcepto: null,
  },

  // fila 5: detalle, g=fuente, j=fuente, l=fuente
  //         presupuesto=5000 < total=8000 → Adicionar (fila not 33/34)
  {
    fila: 5, concepto: 'Adicionar Test', indent: 0, tipo: 'detalle',
    rubro: 'R5', fuenteCodigo: 'F5',
    g: 'fuente', j: 'fuente', l: 'fuente',
    sicodisConcepto: 'Concepto 5',
  },

  // fila 6: detalle, g=fuente, j=fuente, l=fuente
  //         presupuesto=7000 === total=7000 → OK
  {
    fila: 6, concepto: 'OK Test', indent: 0, tipo: 'detalle',
    rubro: 'R6', fuenteCodigo: 'F6',
    g: 'fuente', j: 'fuente', l: 'fuente',
    sicodisConcepto: 'Concepto 6',
  },

  // fila 33: detalle, g=rubro, no j/l → presupuesto<total → Incorporar (fila 33)
  {
    fila: 33, concepto: 'Ribereños', indent: 0, tipo: 'detalle',
    rubro: 'R33',
    g: 'rubro',
    sicodisConcepto: 'Ribereños',
  },

  // fila 34: detalle, g=rubro, no j/l → presupuesto<total → Incorporar (fila 34)
  {
    fila: 34, concepto: 'Resguardos', indent: 0, tipo: 'detalle',
    rubro: 'R34',
    g: 'rubro',
    sicodisConcepto: 'Resguardos',
  },
]

// ---------------------------------------------------------------------------
// Synthetic SICODIS rows
// ---------------------------------------------------------------------------
const sicodis: SgpResumenRow[] = [
  { concepto: 'Grupo A',    ultima: 100, once: 1000, total: 1100 },
  { concepto: 'Concepto 1', ultima: 200, once: 2000, total: 2200 },
  { concepto: 'Concepto 2', ultima: 300, once: 3000, total: 3300 },
  // No entry for null sicodisConcepto (fila 4)
  { concepto: 'Concepto 5', ultima: 50,  once: 500,  total: 8000 },
  { concepto: 'Concepto 6', ultima: 60,  once: 600,  total: 7000 },
  { concepto: 'Ribereños',  ultima: 70,  once: 700,  total: 550  },
  { concepto: 'Resguardos', ultima: 80,  once: 800,  total: 600  },
]

// ---------------------------------------------------------------------------
// Synthetic IngresoRawRow rows
// ---------------------------------------------------------------------------
function ingreso(
  codigoRubro: string,
  ccpet05: string,
  pptoFinal: number,
  totalIngresos: number,
): IngresoRawRow {
  return {
    codigoRubro, descripcion: '', ccpet02: '', ccpet05, ccpet83: '',
    pptoInicial: 0, adicAnteriores: 0, adicPeriodo: 0,
    reducAnteriores: 0, reducPeriodo: 0,
    pptoFinal, totalIngresos,
  }
}

const ingresoRows: IngresoRawRow[] = [
  // fila 2: g=fuente 'F1'; ccpet05='F1 - Description' → codigoFuente='F1'
  ingreso('R1', 'F1 - Description', 5000, 4500),
  // fila 3: g=rubro 'R2'
  ingreso('R2', '', 6000, 5000),
  // fila 4: g=fuente 'F3' (sicodisConcepto=null → total=0)
  ingreso('R3', 'F3 - Desc', 7000, 6000),
  // fila 5: g=fuente 'F5'; pptoFinal=5000 < sicodis total=8000 → Adicionar
  ingreso('R5', 'F5 - Desc', 5000, 4000),
  // fila 6: g=fuente 'F6'; pptoFinal=7000 === sicodis total=7000 → OK
  ingreso('R6', 'F6 - Desc', 7000, 6000),
  // fila 33: g=rubro 'R33'; pptoFinal=300 < sicodis total=550 → Incorporar
  ingreso('R33', '', 300, 0),
  // fila 34: g=rubro 'R34'; pptoFinal=400 < sicodis total=600 → Incorporar
  ingreso('R34', '', 400, 0),
]

// ---------------------------------------------------------------------------
// Synthetic FilaFuenteUso rows
// ---------------------------------------------------------------------------
function fuenteUso(descripcionFuente: string, recaudo: number, compromisos: number): FilaFuenteUso {
  return {
    codigo: null, descripcionFuente,
    piIngresos: 0, pfIngresos: 0, piGastos: 0, pfGastos: 0,
    difPptoInicial: 0, difPptoFinal: 0,
    recaudo, pctRecaudo: 0,
    disponibilidades: 0, compromisos, pctCompromisos: 0,
    obligaciones: 0, pagos: 0, saldoPresupuesto: 0,
    dispSinCompromiso: 0, reservas: 0, cuentasPorPagar: 0,
    superavitDeficit: 0, observaciones: '', ecb: 0,
  }
}

const filasFuenteUso: FilaFuenteUso[] = [
  // fila 2: codigoFuente('F1 - Description') = 'F1' → recaudo=4500, compromisos=3000
  fuenteUso('F1 - Description', 4500, 3000),
  // fila 4: 'F3 - Desc' → but sicodisConcepto=null → total=0; K/M=0
  fuenteUso('F3 - Desc', 0, 0),
  // fila 5: 'F5 - Desc' → recaudo=3000, compromisos=2000
  fuenteUso('F5 - Desc', 3000, 2000),
  // fila 6: 'F6 - Desc' → recaudo=6000, compromisos=7000 (equal total for OK)
  fuenteUso('F6 - Desc', 6000, 7000),
  // No entry for 'F2' or 'F33'/'F34' (they don't have fuenteCodigo)
]

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe('seguimientoSgp', () => {
  const result = seguimientoSgp(catalog, sicodis, ingresoRows, filasFuenteUso)

  const row = (fila: number) => {
    const r = result.find(r => r.fila === fila)
    if (!r) throw new Error(`fila ${fila} not found in result`)
    return r
  }

  // ─── D/E/F from SICODIS ──────────────────────────────────────────────────
  it('D/E/F come from SICODIS for grupo row', () => {
    const r = row(1)
    expect(r.ultima).toBe(100)
    expect(r.once).toBe(1000)
    expect(r.total).toBe(1100)
  })

  it('D/E/F come from SICODIS for detalle row', () => {
    const r = row(2)
    expect(r.ultima).toBe(200)
    expect(r.once).toBe(2000)
    expect(r.total).toBe(2200)
  })

  it('D/E/F = 0/0/0 when sicodisConcepto is null', () => {
    const r = row(4)
    expect(r.ultima).toBe(0)
    expect(r.once).toBe(0)
    expect(r.total).toBe(0)
  })

  // ─── grupo/total row: G/J/L/H/I/K/M all null ─────────────────────────────
  it('grupo row has presupuesto/recaudo/compromisos/derivadas all null', () => {
    const r = row(1)
    expect(r.presupuesto).toBeNull()
    expect(r.recaudo).toBeNull()
    expect(r.compromisos).toBeNull()
    expect(r.diferencia).toBeNull()
    expect(r.observacion).toBeNull()
    expect(r.pctRecaudo).toBeNull()
    expect(r.pctEjecucion).toBeNull()
  })

  // ─── G by fuente ─────────────────────────────────────────────────────────
  it('G by fuente: Σ pptoFinal where codigoFuente(ccpet05) === fuenteCodigo', () => {
    expect(row(2).presupuesto).toBe(5000)
  })

  // ─── G by rubro ──────────────────────────────────────────────────────────
  it('G by rubro: Σ pptoFinal where codigoRubro === rubro', () => {
    expect(row(3).presupuesto).toBe(6000)
  })

  // ─── J by fuente (from FilaFuenteUso) ────────────────────────────────────
  it('J by fuente: FilaFuenteUso.recaudo matched by codigoFuente(descripcionFuente)', () => {
    expect(row(2).recaudo).toBe(4500)
  })

  it('J by fuente: 0 when no matching FilaFuenteUso', () => {
    // fila 4 has j=fuente 'F3' - there is a FuenteUso entry with recaudo=0
    expect(row(4).recaudo).toBe(0)
  })

  // ─── J by rubro (Σ totalIngresos) ────────────────────────────────────────
  it('J by rubro: Σ totalIngresos where codigoRubro === rubro', () => {
    expect(row(3).recaudo).toBe(5000)
  })

  // ─── L by fuente ─────────────────────────────────────────────────────────
  it('L by fuente: FilaFuenteUso.compromisos matched by codigoFuente', () => {
    expect(row(2).compromisos).toBe(3000)
  })

  it('L undefined → compromisos null', () => {
    expect(row(3).compromisos).toBeNull()
  })

  // ─── H = F − G ───────────────────────────────────────────────────────────
  it('H = total - presupuesto (positive when presupuesto < total)', () => {
    const r = row(5) // total=8000, presupuesto=5000 → diferencia=3000
    expect(r.diferencia).toBe(3000)
  })

  it('H = total - presupuesto (negative when presupuesto > total)', () => {
    const r = row(2) // total=2200, presupuesto=5000 → diferencia=-2800
    expect(r.diferencia).toBe(-2800)
  })

  // ─── Observación ─────────────────────────────────────────────────────────
  it('observacion: Reducir when presupuesto > total', () => {
    const r = row(2) // presupuesto=5000 > total=2200; diferencia=-2800
    expect(r.observacion).toBe('Reducir -2800 en presupuesto')
  })

  it('observacion: Adicionar when presupuesto < total (fila not 33/34)', () => {
    const r = row(5) // presupuesto=5000 < total=8000; diferencia=3000
    expect(r.observacion).toBe('Adicionar 3000 en presupuesto')
  })

  it('observacion: OK when presupuesto === total', () => {
    const r = row(6) // presupuesto=7000 === total=7000
    expect(r.observacion).toBe('OK')
  })

  it('observacion: Incorporar for fila 33 when presupuesto < total', () => {
    const r = row(33) // presupuesto=300 < total=550; diferencia=250
    expect(r.observacion).toBe('Incorporar 250 en presupuesto')
  })

  it('observacion: Incorporar for fila 34 when presupuesto < total', () => {
    const r = row(34) // presupuesto=400 < total=600; diferencia=200
    expect(r.observacion).toBe('Incorporar 200 en presupuesto')
  })

  it('observacion: null when presupuesto is null (grupo)', () => {
    expect(row(1).observacion).toBeNull()
  })

  // ─── K/M with total = 0 → 0 ──────────────────────────────────────────────
  it('pctRecaudo = 0 when total = 0', () => {
    const r = row(4) // total=0 (sicodisConcepto=null → D/E/F=0)
    expect(r.pctRecaudo).toBe(0)
  })

  it('pctEjecucion = 0 when total = 0', () => {
    const r = row(4) // total=0
    expect(r.pctEjecucion).toBe(0)
  })

  it('pctRecaudo = recaudo/total when total != 0', () => {
    const r = row(2) // recaudo=4500, total=2200
    expect(r.pctRecaudo).toBe(4500 / 2200)
  })

  it('pctEjecucion = compromisos/total when total != 0', () => {
    const r = row(2) // compromisos=3000, total=2200
    expect(r.pctEjecucion).toBe(3000 / 2200)
  })

  it('pctRecaudo = null when j is undefined', () => {
    expect(row(33).pctRecaudo).toBeNull()
  })

  it('pctEjecucion = null when l is undefined', () => {
    expect(row(3).pctEjecucion).toBeNull()
  })

  // ─── Output shape ─────────────────────────────────────────────────────────
  it('output length equals catalog length', () => {
    expect(result).toHaveLength(catalog.length)
  })

  it('rubro/fuente reflect catalog values', () => {
    const r = row(2)
    expect(r.rubro).toBe('R1')
    expect(r.fuente).toBe('F1')
  })

  it('rubro/fuente are empty string when undefined in catalog', () => {
    const r = row(33) // no fuenteCodigo
    expect(r.fuente).toBe('')
  })
})

// ---------------------------------------------------------------------------
// sinObservacion flag — fila estructural padre (e.g. fila 18 "Calidad")
// ---------------------------------------------------------------------------
describe('seguimientoSgp — sinObservacion flag', () => {
  const catalogSinObs: SgpConcepto[] = [
    // Fila estructural padre: g='rubro', rubro='' → presupuesto=0 (ningún ingreso lo llena)
    // sinObservacion=true → diferencia/observacion/recaudo/compromisos/pct* deben ser null
    {
      fila: 18, concepto: 'Calidad', indent: 1, tipo: 'detalle',
      rubro: '', g: 'rubro', sinObservacion: true,
      sicodisConcepto: 'Calidad',
    },
  ]

  const sicodisSinObs: SgpResumenRow[] = [
    // total > 0 para que, SIN el flag, se generaría "Adicionar {total} en presupuesto"
    { concepto: 'Calidad', ultima: 0, once: 500000, total: 500000 },
  ]

  // Ningún ingreso tiene codigoRubro === '' → presupuesto = 0
  const resultSinObs = seguimientoSgp(catalogSinObs, sicodisSinObs, [], [])
  const r18 = resultSinObs[0]

  it('presupuesto es 0 (golden-safe)', () => {
    expect(r18.presupuesto).toBe(0)
  })

  it('diferencia es null (no se emite recomendación)', () => {
    expect(r18.diferencia).toBeNull()
  })

  it('observacion es null (no se emite recomendación)', () => {
    expect(r18.observacion).toBeNull()
  })

  it('recaudo es null', () => {
    expect(r18.recaudo).toBeNull()
  })

  it('compromisos es null', () => {
    expect(r18.compromisos).toBeNull()
  })

  it('pctRecaudo es null', () => {
    expect(r18.pctRecaudo).toBeNull()
  })

  it('pctEjecucion es null', () => {
    expect(r18.pctEjecucion).toBeNull()
  })

  it('D/E/F (ultima/once/total) se mantienen desde SICODIS', () => {
    expect(r18.ultima).toBe(0)
    expect(r18.once).toBe(500000)
    expect(r18.total).toBe(500000)
  })
})
