import { describe, it, expect } from 'vitest'
import { normalizeIngresoRows, parseIngresoPaste, IngresoParseError } from './ingresos'

const HEADER = [
  'Código Rubro presupuestal', 'Descripción Rubro Presupuestal',
  'CCPET01 - CPC V2.1 AC', 'CCPET02 - UNIDAD EJECUTORA', 'CCPET04 - TERCEROS',
  'CCPET05 - FUENTES DE FINANCIACIÓN', 'CCPET07 - AUXILIAR INTERESES DE MORA',
  'CCPET08 - AUXILIAR RENDIMIENTOS FINANCIEROS', 'CCPET30 - DETALLE SECTORIAL',
  'CCPET50 - FONDO LOCAL DE SALUD', 'CCPET82 - ATRIBUTO VIGENCIA IMPUESTOS',
  'CCPET83 - ATRIBUTO EJECUCIÓN CON / SIN SITUACIÓN DE FONDOS',
  'CCPET84 - ATRIBUTO DESTINACIÓN DE LA RENTA', 'CCPET86 - AUXILIAR ECB Y RF',
  'Prespuesto Inicial', 'Adiciones Anteriores', 'Adiciones Periodo',
  'Reduciones Anteriores', 'Reducciones Periodo', 'Presupuesto Final',
  'Ingresos Anteriores', 'Ingresos Periodo', 'Ingresos en Papeles Anteriores',
  'Ingresos en Papeles Periodo', 'Total de ingresos', 'Saldo por Recaudar', 'Saldo por exceso',
]
// fila total "1 INGRESOS" (clasificadores vacíos)
const TOTAL = ['1', 'INGRESOS', null, null, null, null, null, null, null, null, null, null, null, null,
  30807760602, 0, 9612520949.27, 0, 171780552, 40248500999.27, 1885385010.27, 12094348423.23, 0, 3594714008.5, 17574447442, 22674053557.27, 0]
// fila detalle con clasificadores
const DETALLE = ['1.1.01.01.014.01', 'SOBRETASA AMBIENTAL - URBANO', null,
  '16.0 - ENTIDADES TERRITORIALES - ADMINISTRACION CENTRAL', null,
  '1.2.3.1.01 - SOBRETASA - PARTICIPACION AMBIENTAL', null, null, null, null, null,
  'C - Con Situación de Fondos', null, null,
  15820739, 0, 0, 0, 0, 15820739, 0, 15372850, 0, 0, 15372850, 447889, 0]

describe('normalizeIngresoRows', () => {
  it('encuentra el encabezado tras filas de título y normaliza por nombre de columna', () => {
    const matrix = [['MUNICIPIO DE BRICEÑO'], [], [], HEADER, TOTAL, DETALLE]
    const rows = normalizeIngresoRows(matrix)
    expect(rows).toHaveLength(2)
    expect(rows[0]).toEqual({
      codigoRubro: '1', descripcion: 'INGRESOS', ccpet02: '', ccpet05: '', ccpet83: '',
      pptoInicial: 30807760602, adicAnteriores: 0, adicPeriodo: 9612520949.27,
      reducAnteriores: 0, reducPeriodo: 171780552, pptoFinal: 40248500999.27,
      totalIngresos: 17574447442,
    })
    expect(rows[1].ccpet02).toBe('16.0 - ENTIDADES TERRITORIALES - ADMINISTRACION CENTRAL')
    expect(rows[1].ccpet83).toBe('C - Con Situación de Fondos')
  })

  it('corta los datos en la primera fila sin código de rubro', () => {
    const matrix = [HEADER, TOTAL, [null], DETALLE]
    expect(normalizeIngresoRows(matrix)).toHaveLength(1)
  })

  it('lanza IngresoParseError si falta el encabezado', () => {
    expect(() => normalizeIngresoRows([['otra cosa'], [1, 2, 3]])).toThrow(IngresoParseError)
  })
})

describe('parseIngresoPaste', () => {
  it('parsea TSV con encabezado', () => {
    const tsv = [HEADER.join('\t'), TOTAL.map(v => (v == null ? '' : v)).join('\t')].join('\n')
    const rows = parseIngresoPaste(tsv)
    expect(rows).toHaveLength(1)
    expect(rows[0].totalIngresos).toBe(17574447442)
  })
})
