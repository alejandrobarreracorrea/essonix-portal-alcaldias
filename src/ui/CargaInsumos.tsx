import type { IngresoRawRow, GastoRawRow } from '../types'
import { validateIngresos, validateGastos, validateSgp } from '../validation/validators'
import { parseIngresoFile } from '../parsers/ingresos'
import { parseGastoFile } from '../parsers/gastos'
import { readSgpSheetNames, parseSgpResumenFile, type SgpResumenRow } from '../parsers/sgp'
import { SlotInsumo } from './SlotInsumo'

export function CargaInsumos({
  onIngresos,
  onGastos,
  onSgp,
}: {
  onIngresos: (rows: IngresoRawRow[] | null) => void
  onGastos: (rows: GastoRawRow[] | null) => void
  onSgp?: (resumen: SgpResumenRow[] | null) => void
}) {
  return (
    <div className="grid gap-5 md:grid-cols-3">
      <SlotInsumo<IngresoRawRow[]>
        titulo="Ejecución de ingresos"
        descripcion="Reporte CCPET (19_ejec_ing_combina_clasif)"
        procesar={async (file) => {
          const rows = await parseIngresoFile(file)
          return { validation: validateIngresos(rows), payload: rows }
        }}
        onResultado={(r) => onIngresos(r.validation.ok ? (r.payload as IngresoRawRow[]) : null)}
      />
      <SlotInsumo<GastoRawRow[]>
        titulo="Ejecución de gastos"
        descripcion="Reporte CCPET (19_ejec_egr_combina_clasif)"
        procesar={async (file) => {
          const rows = await parseGastoFile(file)
          return { validation: validateGastos(rows), payload: rows }
        }}
        onResultado={(r) => onGastos(r.validation.ok ? (r.payload as GastoRawRow[]) : null)}
      />
      <SlotInsumo<SgpResumenRow[]>
        titulo="Recursos del SGP"
        descripcion="Reporte SICODIS (ResumenDistribucionSGP…)"
        procesar={async (file) => {
          const sheets = await readSgpSheetNames(file)
          const validation = validateSgp(sheets)
          // Solo parseamos el Resumen si la estructura es válida.
          const resumen = validation.ok ? await parseSgpResumenFile(file) : null
          return { validation, payload: resumen }
        }}
        onResultado={(r) => {
          const resumen = r.validation.ok ? r.payload : null
          onSgp?.(resumen != null && resumen.length === 0 ? null : resumen)
        }}
      />
    </div>
  )
}
