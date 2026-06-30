import { fmtPct } from './format'
import { nivelIndicador, type EstadoIndicador } from './estado'

/**
 * Medidor horizontal editorial con semáforo. La pista 0–escala muestra:
 *  - bandas de zona tenues (verde / ámbar / rojo) relativas al límite,
 *  - el relleno del valor con color de estado (verde / ámbar / rojo),
 *  - la marca dorada punteada del límite con una sola etiqueta.
 *
 * Los colores del relleno y las zonas se aplican con `backgroundColor` inline
 * (hex de tokens) para que SIEMPRE se rendericen — las clases Tailwind basadas
 * en var() no pintan color de forma fiable en este contexto.
 *
 * `valor` y `limite` son fracciones (0.38, 0.8).
 */
export function Gauge({
  valor,
  limite,
  estado,
}: {
  valor: number
  limite: number
  /** Estado precalculado; si se omite, se calcula con nivelIndicador. */
  estado?: EstadoIndicador
}) {
  const e = estado ?? nivelIndicador(valor, limite)

  // Escala estable 0–100% cuando todo es ≤ 1; solo se expande si valor > 1.
  const escala = Math.max(1, valor) * 1.02
  const fill = Math.max(0, Math.min(1, valor / escala))
  const marca = Math.max(0, Math.min(1, limite / escala))
  const inicioAmbar = Math.max(0, Math.min(1, (0.85 * limite) / escala))

  return (
    <div className="mt-2">
      <div
        className="relative h-3 w-full overflow-hidden rounded-full ring-1 ring-inset ring-line"
        role="img"
        aria-label={`Indicador en ${fmtPct(valor)}, límite ${fmtPct(limite)} — ${e.label}`}
      >
        {/* Zonas de fondo: verde 0→0.85·límite, ámbar →límite, rojo →fin */}
        <div className="absolute inset-0" aria-hidden>
          <div
            className="absolute inset-y-0 left-0"
            style={{ width: `${inicioAmbar * 100}%`, backgroundColor: '#0E5C46', opacity: 0.1 }}
          />
          <div
            className="absolute inset-y-0"
            style={{
              left: `${inicioAmbar * 100}%`,
              width: `${Math.max(0, marca - inicioAmbar) * 100}%`,
              backgroundColor: '#B7791F',
              opacity: 0.14,
            }}
          />
          <div
            className="absolute inset-y-0 right-0"
            style={{ left: `${marca * 100}%`, backgroundColor: '#B24A33', opacity: 0.12 }}
          />
        </div>

        {/* Relleno del valor con color de estado (siempre visible) */}
        <div
          className="absolute inset-y-0 left-0 rounded-full"
          style={{ width: `${fill * 100}%`, backgroundColor: e.color }}
        />

        {/* Marca del límite — dorada punteada */}
        <div
          className="absolute top-[-3px] bottom-[-3px] w-0 border-l-2 border-dashed"
          style={{ left: `${marca * 100}%`, borderColor: '#C0892D' }}
          aria-hidden
        />
      </div>

      <div className="relative mt-1.5 h-4 text-[11px] text-ink-soft">
        <span className="num absolute left-0">0 %</span>
        <span
          className="num absolute -translate-x-1/2 whitespace-nowrap font-medium"
          style={{ left: `${marca * 100}%`, color: '#C0892D' }}
        >
          Límite {fmtPct(limite)}
        </span>
      </div>
    </div>
  )
}
