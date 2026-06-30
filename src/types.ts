export type IngresoRawRow = {
  codigoRubro: string
  descripcion: string
  ccpet02: string
  ccpet05: string
  ccpet83: string
  pptoInicial: number
  adicAnteriores: number
  adicPeriodo: number
  reducAnteriores: number
  reducPeriodo: number
  pptoFinal: number
  totalIngresos: number
}

export type FilaIngreso = {
  columna3: string
  rubro: string
  nombre: string
  unidadEjec: string
  fuentes: string
  atributo: string
  pptoInicial: number
  adiciones: number
  reducciones: number
  pptoFinal: number
  ingreso: number
  pctIngreso: number
  proyeccion: number
  observaciones: string
}

export type GastoRawRow = {
  rubro: string
  descripcion: string
  cpc: string
  unidadEjec: string
  programatico: string
  fuentes: string
  cpi: string
  atributo: string
  pptoInicial: number
  pptoFinal: number
  disponibilidades: number
  saldoDisponible: number
  registros: number
  saldoDisponibilidades: number
  ordenPago: number
  saldoRegistro: number
  egresos: number
  egresosPapeles: number
  saldoOrdenesPago: number
  creditos?: number
  contracreditos?: number
}

export type FilaTraslado = {
  fuente: string
  creditos: number
  contracreditos: number
  diferencia: number
}

export type FilaSector = {
  codigo: string
  sector: string
  pptoFinal: number
  registros: number
  disponibilidades: number
  saldoDisponible: number
  ejecucion: number
}

export type FilaGasto = {
  extrae: string
  columna1: string
  concat: string
  rubro: string
  descripcion: string
  cpc: string
  unidadEjec: string
  programatico: string
  fuentes: string
  cpi: string
  atributo: string
  pptoInicial: number
  pptoFinal: number
  disponibilidades: number
  saldoDisponible: number
  registros: number
  saldoDisponibilidades: number
  ordenPago: number
  saldoRegistro: number
  egresos: number
  egresosPapeles: number
  saldoOrdenesPago: number
}

export type FuenteCatalogo = {
  codigo: number | string | null
  descripcionFuente: string
}

export type FilaFuenteUso = {
  codigo: number | string | null
  descripcionFuente: string
  piIngresos: number
  pfIngresos: number
  piGastos: number
  pfGastos: number
  difPptoInicial: number
  difPptoFinal: number
  recaudo: number
  pctRecaudo: number
  disponibilidades: number
  compromisos: number
  pctCompromisos: number
  obligaciones: number
  pagos: number
  saldoPresupuesto: number
  dispSinCompromiso: number
  reservas: number
  cuentasPorPagar: number
  superavitDeficit: number
  observaciones: string
  ecb: number
}

export type FilaSgp = {
  fila: number
  concepto: string
  indent: number
  tipo: 'grupo' | 'detalle' | 'total'
  rubro: string
  fuente: string
  ultima: number
  once: number
  total: number
  presupuesto: number | null
  diferencia: number | null
  observacion: string | null
  recaudo: number | null
  pctRecaudo: number | null
  compromisos: number | null
  pctEjecucion: number | null
}

export type IndicadorDnp = {
  numerador: number
  denominador: number
  valor: number
  numeradorLabel: string
  denominadorLabel: string
  baseNota: string
}

export type IndicadoresDnp = {
  recursosPropios: IndicadorDnp
  magnitudInversion: IndicadorDnp
}

export type IndicadorLey617 = {
  icldPropio: number
  sgpLibreDest: number
  totalIcld: number
  funcAdminCentral: number
  concejo: number
  personeria: number
  gfTotal: number
  baseAdmin: number
  dedSobretasaAmb: number
  dedSobretasaBomb: number
  dedSeguridadConc: number
  dedSeguroVida: number
  dedPolizaSalud: number
  dedTransporteConc: number
  dedDeficit: number
  dedCuotasPartes: number
  dedMesadas: number
  dedColjuegos: number
  totalAdminDepurado: number
  pctGfIcld: number
  limite: number
  diferencial: number
  cumplimiento: string
}
