import type { ReactNode } from 'react'

function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ')
}

/* ------------------------------------------------------------------ */
/* Kicker — etiqueta editorial en mayúsculas con tracking, color gold  */
/* ------------------------------------------------------------------ */
export function Kicker({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span className={cx('text-[11px] font-semibold uppercase tracking-[0.18em] text-gold', className)}>
      {children}
    </span>
  )
}

/* ------------------------------------------------------------------ */
/* SectionHeading — kicker opcional + título display + regla fina      */
/* ------------------------------------------------------------------ */
export function SectionHeading({
  children,
  kicker,
  action,
  className,
}: {
  children: ReactNode
  kicker?: ReactNode
  action?: ReactNode
  className?: string
}) {
  return (
    <div className={cx('mb-4', className)}>
      <div className="flex items-end justify-between gap-4">
        <div>
          {kicker ? <div className="mb-1"><Kicker>{kicker}</Kicker></div> : null}
          <h2 className="font-display text-xl leading-tight text-ink">{children}</h2>
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
      <div className="mt-3 h-px w-full bg-line" />
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Card — superficie editorial                                         */
/* ------------------------------------------------------------------ */
export function Card({
  title,
  kicker,
  action,
  children,
  className,
}: {
  title?: ReactNode
  kicker?: ReactNode
  action?: ReactNode
  children: ReactNode
  className?: string
}) {
  return (
    <section
      className={cx(
        'rounded-card border border-line bg-surface p-6 shadow-card',
        className,
      )}
    >
      {title ? (
        <SectionHeading kicker={kicker} action={action}>
          {title}
        </SectionHeading>
      ) : null}
      {children}
    </section>
  )
}

/* ------------------------------------------------------------------ */
/* Badge — pill de estado                                              */
/* ------------------------------------------------------------------ */
type BadgeTone = 'ok' | 'alert' | 'neutral' | 'gold'

const BADGE_TONES: Record<BadgeTone, string> = {
  ok: 'bg-[#e3f0ea] text-forest',
  alert: 'bg-[#f5e1da] text-clay',
  neutral: 'bg-surface-2 text-ink-soft border border-line',
  gold: 'bg-[#f6e9cc] text-[#8a5a16]',
}

export function Badge({ tone = 'neutral', children }: { tone?: BadgeTone; children: ReactNode }) {
  return (
    <span
      className={cx(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold',
        BADGE_TONES[tone],
      )}
    >
      {children}
    </span>
  )
}

/* ------------------------------------------------------------------ */
/* StatTile — KPI editorial con borde superior de acento               */
/* ------------------------------------------------------------------ */
export function StatTile({
  label,
  value,
  delta,
  deltaTone = 'up',
  tone = 'forest',
  mono = true,
  accentColor,
  valueColor,
  className,
}: {
  label: ReactNode
  value: ReactNode
  delta?: ReactNode
  deltaTone?: 'up' | 'down'
  tone?: 'forest' | 'gold'
  mono?: boolean
  /** Color explícito (hex) para el borde superior de acento (p. ej. semáforo). */
  accentColor?: string
  /** Color explícito (hex) para la cifra (p. ej. semáforo). */
  valueColor?: string
  className?: string
}) {
  return (
    <div
      className={cx(
        'relative overflow-hidden rounded-card border border-line bg-surface p-5 shadow-card',
        className,
      )}
    >
      <div
        className={cx(
          'absolute inset-x-0 top-0 h-[3px]',
          accentColor ? '' : tone === 'gold' ? 'bg-gold' : 'bg-forest',
        )}
        style={accentColor ? { backgroundColor: accentColor } : undefined}
      />
      <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-soft">
        {label}
      </div>
      <div
        className={cx(
          'mt-2 leading-tight text-ink',
          mono ? 'num font-semibold' : 'font-display font-semibold',
        )}
        style={{
          fontSize: 'clamp(1rem, 1.55vw, 1.5rem)',
          letterSpacing: '-0.015em',
          fontVariantNumeric: 'tabular-nums',
          ...(valueColor ? { color: valueColor } : null),
        }}
      >
        {value}
      </div>
      {delta != null ? (
        <div
          className={cx(
            'mt-2 inline-flex items-center gap-1 text-sm font-medium',
            deltaTone === 'down' ? 'text-clay' : 'text-forest',
          )}
        >
          <span aria-hidden>{deltaTone === 'down' ? '↘' : '↗'}</span>
          <span className="num">{delta}</span>
        </div>
      ) : null}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* SectionDivider — hairline con cuadrito gold a la izquierda          */
/* ------------------------------------------------------------------ */
export function SectionDivider({ label, className }: { label?: ReactNode; className?: string }) {
  return (
    <div className={cx('flex items-center gap-3', className)}>
      <span className="h-2 w-2 shrink-0 bg-gold" />
      {label ? <Kicker>{label}</Kicker> : null}
      <span className="h-px flex-1 bg-line" />
    </div>
  )
}
