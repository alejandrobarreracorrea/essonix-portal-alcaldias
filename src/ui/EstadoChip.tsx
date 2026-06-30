import type { EstadoIndicador } from './estado'

/**
 * Chip de estado tipo semáforo: punto + etiqueta en los colores del estado.
 * Usa estilos inline (hex de tokens) para renderizar el color de forma fiable.
 */
export function EstadoChip({ estado }: { estado: EstadoIndicador }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold"
      style={{ backgroundColor: estado.bg, color: estado.color }}
    >
      <span
        className="h-2 w-2 shrink-0 rounded-full"
        style={{ backgroundColor: estado.color }}
        aria-hidden
      />
      {estado.label}
    </span>
  )
}
