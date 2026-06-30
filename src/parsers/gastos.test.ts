import { describe, it, expect } from 'vitest'
import { normalizeGastoRows, parseGastoPaste, GastoParseError } from './gastos'

const HEADER = [
  'Código rubro presupuestal', 'Descripción rubro presupuestal', 'CCPET01 - CPC V2.1 AC',
  'CCPET02 - UNIDAD EJECUTORA', 'CCPET03 - CLASIFICADOR PROGRAMÁTICO DE LA INVERSIÓN PÚBLICA',
  'CCPET04 - TERCEROS', 'CCPET05 - FUENTES DE FINANCIACIÓN', 'CCPET30 - DETALLE SECTORIAL',
  'CCPET50 - FONDO LOCAL DE SALUD', 'CCPET80 - LÍNEA ESTRATÉGICA', 'CCPET81 - PRODUCTO DE INVERSIÓN',
  'CCPET83 - ATRIBUTO EJECUCIÓN CON / SIN SITUACIÓN DE FONDOS', 'CCPET84 - ATRIBUTO DESTINACIÓN DE LA RENTA',
  'CCPET85 - INDICADOR DE INVERSIÓN', 'CCPET86 - AUXILIAR ECB Y RF', 'Presupuesto inicial',
  'Adiciones', 'Reducciones', 'Créditos presupuesto', 'Contracreditos presupuesto',
  'Créditos clasificadores', 'Contracreditos clasificadores', 'Aplazamientos', 'Desaplazamientos',
  'Presupuesto final', 'Disponibilidades', 'Saldo disponible: Presupuesto final - disponibilidades',
  'Registros', 'Saldo de disponibilidades: Disponibilidades - registros', 'Ordenes de pago',
  'Saldo registro: Registros - ordenes de pago', 'Egresos', 'Egresos en papeles',
  'Saldo ordenes de pago: Ordenes de pago - egresos',
]
// fila total "2 GASTOS" (34 columnas; clasificadores vacíos)
const TOTAL = ['2', 'GASTOS', null, null, null, null, null, null, null, null, null, null, null, null, null,
  30807760602, 1234, 1234, 1234, 1234, 1234, 1234, 1234, 1234, 40248500999.27,
  29932416102.76, 10316084896.51, 20174379502.57, 9758036600.19, 10514056874.38,
  9660322628.19, 6769591638.97, 3591312004.41, 153153230.999998]

describe('normalizeGastoRows', () => {
  it('encuentra el encabezado y mapea las columnas por nombre', () => {
    const matrix = [['MUNICIPIO'], [], [], HEADER, TOTAL]
    const rows = normalizeGastoRows(matrix)
    expect(rows).toHaveLength(1)
    expect(rows[0]).toEqual({
      rubro: '2', descripcion: 'GASTOS', cpc: '', unidadEjec: '', programatico: '',
      fuentes: '', cpi: '', atributo: '',
      pptoInicial: 30807760602, pptoFinal: 40248500999.27, disponibilidades: 29932416102.76,
      saldoDisponible: 10316084896.51, registros: 20174379502.57, saldoDisponibilidades: 9758036600.19,
      ordenPago: 10514056874.38, saldoRegistro: 9660322628.19, egresos: 6769591638.97,
      egresosPapeles: 3591312004.41, saldoOrdenesPago: 153153230.999998,
      creditos: 1234, contracreditos: 1234,
    })
  })

  it('corta en la primera fila sin código de rubro', () => {
    const matrix = [HEADER, TOTAL, [null], TOTAL]
    expect(normalizeGastoRows(matrix)).toHaveLength(1)
  })

  it('lanza GastoParseError si falta el encabezado', () => {
    expect(() => normalizeGastoRows([['x'], [1, 2]])).toThrow(GastoParseError)
  })

  it('lanza GastoParseError si falta una columna esperada', () => {
    const incompleto = HEADER.slice(0, 30)
    expect(() => normalizeGastoRows([incompleto, TOTAL])).toThrow(GastoParseError)
  })
})

describe('parseGastoPaste', () => {
  it('parsea TSV con encabezado', () => {
    const tsv = [HEADER.join('\t'), TOTAL.map((v) => (v == null ? '' : v)).join('\t')].join('\n')
    const rows = parseGastoPaste(tsv)
    expect(rows).toHaveLength(1)
    expect(rows[0].saldoOrdenesPago).toBe(153153230.999998)
  })
})
