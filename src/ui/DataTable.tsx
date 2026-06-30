import type { ReactNode } from 'react'

export type Column<T> = {
  key: string
  label: ReactNode
  /** Alineación del contenido de la celda. Por defecto: izquierda. */
  align?: 'left' | 'right' | 'center'
  /** Marca la columna como numérica (aplica .num y alinea a la derecha). */
  num?: boolean
  /** Formateador del valor crudo a texto/nodo. */
  format?: (value: unknown, row: T) => ReactNode
  /** Ancho fijo opcional (CSS, p. ej. '160px'). */
  width?: string
  /** Evita el salto de línea en la celda. */
  nowrap?: boolean
}

function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ')
}

/**
 * Tabla de datos editorial: contenedor con scroll, thead pegajoso en
 * verde bosque, filas con hairline y zebra muy sutil, celdas numéricas
 * en mono alineadas a la derecha.
 */
export function DataTable<T extends Record<string, unknown>>({
  columns,
  rows,
  maxHeight = '70vh',
  rowKey,
  caption,
  className,
}: {
  columns: Column<T>[]
  rows: T[]
  maxHeight?: string
  rowKey?: (row: T, index: number) => string | number
  caption?: ReactNode
  className?: string
}) {
  return (
    <div
      className={cx(
        'scroll-fino overflow-auto rounded-card border border-line bg-surface shadow-card',
        className,
      )}
      style={{ maxHeight }}
    >
      <table className="w-full border-collapse text-sm">
        {caption ? <caption className="sr-only">{caption}</caption> : null}
        <thead className="sticky top-0 z-10">
          <tr className="bg-forest-deep">
            {columns.map((c) => (
              <th
                key={c.key}
                scope="col"
                style={c.width ? { width: c.width } : undefined}
                className={cx(
                  'whitespace-nowrap px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-paper/90',
                  c.num || c.align === 'right'
                    ? 'text-right'
                    : c.align === 'center'
                      ? 'text-center'
                      : 'text-left',
                )}
              >
                {c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr
              key={rowKey ? rowKey(row, i) : i}
              className="border-b border-line odd:bg-surface even:bg-surface-2 transition-colors hover:bg-surface-2"
            >
              {columns.map((c, ci) => {
                const raw = row[c.key]
                const content = c.format ? c.format(raw, row) : (raw as ReactNode)
                const isNum = c.num || c.align === 'right'
                return (
                  <td
                    key={c.key}
                    className={cx(
                      'px-4 py-2.5 align-top',
                      isNum ? 'num text-right tabular-nums text-ink' : 'text-ink',
                      c.align === 'center' && 'text-center',
                      c.nowrap && 'whitespace-nowrap',
                      ci === 0 && !isNum && 'whitespace-nowrap font-medium',
                    )}
                  >
                    {content as ReactNode}
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
