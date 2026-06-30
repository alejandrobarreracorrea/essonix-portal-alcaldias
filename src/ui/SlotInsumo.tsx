import { useId, useState } from 'react'
import type { ValidationResult } from '../validation/validators'

export type SlotResultado<P> = { validation: ValidationResult; payload: P | null; fileName: string }

function FileGlyph({ tone }: { tone: 'idle' | 'ok' | 'error' }) {
  const color = tone === 'ok' ? 'var(--forest)' : tone === 'error' ? 'var(--clay)' : 'var(--gold)'
  const bg = tone === 'ok' ? '#e3f0ea' : tone === 'error' ? '#f5e1da' : '#f6e9cc'
  return (
    <span
      className="grid h-14 w-14 shrink-0 place-items-center rounded-full"
      style={{ backgroundColor: bg }}
      aria-hidden
    >
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path
          d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8l-5-5Z"
          stroke={color}
          strokeWidth="1.8"
          strokeLinejoin="round"
        />
        <path d="M14 3v5h5" stroke={color} strokeWidth="1.8" strokeLinejoin="round" />
      </svg>
    </span>
  )
}

export function SlotInsumo<P>({
  titulo,
  descripcion,
  procesar,
  onResultado,
}: {
  titulo: string
  descripcion: string
  procesar: (file: File) => Promise<{ validation: ValidationResult; payload: P | null }>
  onResultado: (r: SlotResultado<P>) => void
}) {
  const [estado, setEstado] = useState<{ validation: ValidationResult; fileName: string } | null>(null)
  const [cargando, setCargando] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const inputId = useId()

  const onFile = async (file: File) => {
    setCargando(true)
    try {
      const { validation, payload } = await procesar(file)
      setEstado({ validation, fileName: file.name })
      onResultado({ validation, payload, fileName: file.name })
    } catch (e) {
      const validation: ValidationResult = {
        ok: false,
        issues: [{ level: 'error', message: e instanceof Error ? e.message : 'No se pudo leer el archivo.' }],
      }
      setEstado({ validation, fileName: file.name })
      onResultado({ validation, payload: null, fileName: file.name })
    } finally {
      setCargando(false)
    }
  }

  const ok = estado?.validation.ok === true
  const tone: 'idle' | 'ok' | 'error' = estado ? (ok ? 'ok' : 'error') : 'idle'

  return (
    <section className="flex flex-col">
      <label
        htmlFor={inputId}
        onDragOver={(e) => {
          e.preventDefault()
          setDragOver(true)
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault()
          setDragOver(false)
          const file = e.dataTransfer.files?.[0]
          if (file) void onFile(file)
        }}
        className={[
          'group flex h-full min-h-[200px] cursor-pointer flex-col rounded-card border-2 border-dashed p-6 transition-colors',
          dragOver
            ? 'border-gold bg-[#f6e9cc] shadow-card'
            : ok
              ? 'border-forest bg-surface'
              : tone === 'error'
                ? 'border-clay bg-surface'
                : 'border-line bg-surface hover:border-gold hover:bg-surface-2',
        ].join(' ')}
      >
        <div className="flex items-start gap-3">
          <FileGlyph tone={tone} />
          <div className="min-w-0">
            <h3 className="font-display text-base font-semibold text-ink">{titulo}</h3>
            <p className="mt-0.5 text-xs leading-snug text-ink-soft">{descripcion}</p>
          </div>
        </div>

        <input
          id={inputId}
          type="file"
          accept=".xlsx"
          className="sr-only"
          onChange={(e) => {
            const input = e.target
            const file = input.files?.[0]
            if (file) {
              input.value = ''
              void onFile(file)
            }
          }}
        />

        {!estado && !cargando ? (
          <p className="mt-4 text-xs text-ink-soft">
            <span className="font-medium text-forest group-hover:underline">Selecciona</span> o arrastra
            el archivo <span className="num">.xlsx</span>
          </p>
        ) : null}

        {cargando ? <p className="mt-4 text-sm text-ink-soft">Procesando…</p> : null}

        {estado && !cargando ? (
          <div className="mt-4 text-sm">
            <p className="truncate text-xs text-ink-soft" title={estado.fileName}>
              {estado.fileName}
            </p>
            {ok ? (
              <>
                <p className="mt-1 flex items-center gap-1.5 font-medium text-forest">✓ Archivo válido</p>
                {estado.validation.issues.length > 0 ? (
                  <ul className="mt-1 list-inside list-disc text-xs text-gold">
                    {estado.validation.issues.map((i, k) => (
                      <li key={k}>{i.message}</li>
                    ))}
                  </ul>
                ) : null}
              </>
            ) : (
              <ul className="mt-1 list-inside list-disc text-xs text-clay">
                {estado.validation.issues.map((i, k) => (
                  <li key={k}>{i.message}</li>
                ))}
              </ul>
            )}
          </div>
        ) : null}
      </label>
    </section>
  )
}
