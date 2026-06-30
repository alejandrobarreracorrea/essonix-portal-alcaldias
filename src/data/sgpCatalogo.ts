export type SgpConcepto = {
  fila: number
  concepto: string
  indent: 0 | 1 | 2
  tipo: 'grupo' | 'detalle' | 'total'
  rubro?: string
  fuenteCodigo?: string
  sicodisConcepto: string | null   // nombre exacto en SICODIS Resumen (col B); null = sin fuente → 0/0/0
  g?: 'fuente' | 'rubro'
  j?: 'fuente' | 'rubro'
  l?: 'fuente'
  /** Fila estructural padre: presupuesto se computa pero diferencia/observacion/recaudo/compromisos/pct se anulan. */
  sinObservacion?: boolean
}

export const SGP_CATALOGO: SgpConcepto[] = [
  { fila: 16, concepto: 'Educación', indent: 0, tipo: 'grupo', sicodisConcepto: 'Educación' },
  { fila: 17, concepto: 'Prestación de Servicios', indent: 1, tipo: 'grupo', sicodisConcepto: 'Prestación Servicios' },
  { fila: 18, concepto: 'Calidad', indent: 1, tipo: 'detalle', rubro: '', g: 'rubro', sinObservacion: true, sicodisConcepto: 'Calidad' },
  { fila: 19, concepto: 'Matrícula Gratuidad', indent: 2, tipo: 'detalle', rubro: '1.1.02.06.001.01.03.02', fuenteCodigo: '1.2.4.1.04', g: 'fuente', j: 'fuente', l: 'fuente', sicodisConcepto: 'Calidad (Gratuidad)' },
  { fila: 20, concepto: 'Matrícula Oficial', indent: 2, tipo: 'detalle', rubro: '1.1.02.06.001.01.03.01', fuenteCodigo: '1.2.4.1.03', g: 'fuente', j: 'fuente', l: 'fuente', sicodisConcepto: 'Calidad (Matrícula)' },
  { fila: 21, concepto: 'Salud', indent: 0, tipo: 'grupo', sicodisConcepto: 'Salud' },
  { fila: 22, concepto: 'Régimen Subsidiado', indent: 1, tipo: 'detalle', rubro: '1.1.02.06.001.02.01', fuenteCodigo: '1.2.4.2.01', g: 'fuente', j: 'fuente', l: 'fuente', sicodisConcepto: 'Régimen Subsidiado' },
  { fila: 23, concepto: 'Salud Pública', indent: 1, tipo: 'detalle', rubro: '1.1.02.06.001.02.02', fuenteCodigo: '1.2.4.2.02', g: 'fuente', j: 'fuente', l: 'fuente', sicodisConcepto: 'Salud Pública' },
  { fila: 24, concepto: 'Prestación de Servicios', indent: 1, tipo: 'detalle', rubro: '1.1.02.06.001.02.04', fuenteCodigo: '1.2.4.2.04', g: 'fuente', j: 'fuente', l: 'fuente', sicodisConcepto: 'Subsidio a la Oferta' },
  { fila: 25, concepto: 'Agua Potable', indent: 0, tipo: 'detalle', rubro: '1.1.02.06.001.05', fuenteCodigo: '1.2.4.6.00', g: 'fuente', j: 'fuente', l: 'fuente', sicodisConcepto: 'Agua Potable' },
  { fila: 26, concepto: 'Propósito General - Destinación', indent: 0, tipo: 'grupo', sicodisConcepto: 'Propósito General' },
  { fila: 27, concepto: 'Libre Destinación', indent: 1, tipo: 'detalle', rubro: '1.1.02.06.001.03.04', fuenteCodigo: '1.2.4.3.04', g: 'rubro', j: 'rubro', l: 'fuente', sicodisConcepto: 'Libre Destinación' },
  { fila: 28, concepto: 'Deporte', indent: 1, tipo: 'detalle', rubro: '1.1.02.06.001.03.01', fuenteCodigo: '1.2.4.3.01', g: 'fuente', j: 'fuente', l: 'fuente', sicodisConcepto: 'Deporte' },
  { fila: 29, concepto: 'Cultura', indent: 1, tipo: 'detalle', rubro: '1.1.02.06.001.03.02', fuenteCodigo: '1.2.4.3.02', g: 'fuente', j: 'fuente', l: 'fuente', sicodisConcepto: 'Cultura' },
  { fila: 30, concepto: 'Libre Inversión', indent: 1, tipo: 'detalle', rubro: '1.1.02.06.001.03.03', fuenteCodigo: '1.2.4.3.03', g: 'fuente', j: 'fuente', l: 'fuente', sicodisConcepto: 'Libre Inversión' },
  { fila: 31, concepto: 'Fonpet(2)', indent: 1, tipo: 'grupo', sicodisConcepto: 'Fonpet' },
  { fila: 32, concepto: 'Alimentación Escolar', indent: 0, tipo: 'detalle', rubro: '1.1.02.06.001.04.01', fuenteCodigo: '1.2.4.4.01', g: 'rubro', j: 'fuente', l: 'fuente', sicodisConcepto: 'Alimentación Escolar' },
  { fila: 33, concepto: 'Ribereños', indent: 0, tipo: 'detalle', rubro: '1.1.02.06.001.04.02', g: 'rubro', sicodisConcepto: 'Ribereños' },
  { fila: 34, concepto: 'Resguardos Indígenas', indent: 0, tipo: 'detalle', rubro: '1.1.02.06.001.04.03', g: 'rubro', sicodisConcepto: 'Resguardos Indígenas' },
  { fila: 35, concepto: 'Fonpet', indent: 0, tipo: 'grupo', sicodisConcepto: 'Fonpet 2.9%' },
  { fila: 36, concepto: 'Primera Infancia', indent: 0, tipo: 'grupo', sicodisConcepto: null },
  { fila: 37, concepto: 'TOTAL SGP', indent: 0, tipo: 'total', sicodisConcepto: 'Total SGP' },
]
