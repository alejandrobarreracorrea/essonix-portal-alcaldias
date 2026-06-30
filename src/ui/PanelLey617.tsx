import type { IndicadorLey617 } from '../types'
import { Card } from './kit'
import { DataTable, type Column } from './DataTable'
import { Gauge } from './Gauge'
import { EstadoChip } from './EstadoChip'
import { nivelIndicador } from './estado'
import { fmtMoneda, fmtPct } from './format'

const FILAS: { label: string; key: keyof IndicadorLey617 }[] = [
  { label: 'ICLD recurso propio', key: 'icldPropio' },
  { label: 'SGP libre destinación', key: 'sgpLibreDest' },
  { label: 'Total ICLD', key: 'totalIcld' },
  { label: 'Funcionamiento Admón. Central', key: 'funcAdminCentral' },
  { label: '(−) Sobretasa ambiental', key: 'dedSobretasaAmb' },
  { label: '(−) Sobretasa bomberil', key: 'dedSobretasaBomb' },
  { label: '(−) Transporte concejales', key: 'dedTransporteConc' },
  { label: '(−) Cuotas partes', key: 'dedCuotasPartes' },
  { label: '(−) Coljuegos', key: 'dedColjuegos' },
  { label: 'Total Admón. Central (GF neto)', key: 'totalAdminDepurado' },
]

type FilaDesglose = { concepto: string; valor: number }

const COLS_DESGLOSE: Column<FilaDesglose>[] = [
  { key: 'concepto', label: 'Concepto' },
  { key: 'valor', label: 'Valor', num: true, format: (v) => fmtMoneda(v as number) },
]

export function PanelLey617({ indicador }: { indicador: IndicadorLey617 }) {
  const estado = nivelIndicador(indicador.pctGfIcld, indicador.limite)
  const desglose: FilaDesglose[] = FILAS.map((f) => ({
    concepto: f.label,
    valor: indicador[f.key] as number,
  }))

  return (
    <section className="space-y-6">
      <Card kicker="Ley 617" title="Autofinanciación de gastos de funcionamiento (GF / ICLD)">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div
            className="num text-5xl font-semibold leading-none"
            style={{ color: estado.color }}
          >
            {fmtPct(indicador.pctGfIcld)}
          </div>
          <EstadoChip estado={estado} />
        </div>
        <Gauge valor={indicador.pctGfIcld} limite={indicador.limite} estado={estado} />
      </Card>

      <DataTable columns={COLS_DESGLOSE} rows={desglose} rowKey={(r) => r.concepto} caption="Desglose del indicador Ley 617" />
    </section>
  )
}
