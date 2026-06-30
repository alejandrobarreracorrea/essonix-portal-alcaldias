import type { ReactNode } from 'react'

export type NavItem = { id: string; label: string }

export type InsumoStatus = {
  ingresos: boolean
  gastos: boolean
  sgp: boolean
}

function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ')
}

/* Marca: tile gold sólido con iniciales */
function BrandMark() {
  return (
    <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gold shadow-[0_8px_20px_-8px_rgba(192,137,45,.8)]">
      <span className="font-display text-sm font-bold text-forest-ink">PA</span>
    </div>
  )
}

/* Punto de estado de insumo: relleno gold si válido, contorno si pendiente */
function StatusRow({ label, ok }: { label: string; ok: boolean }) {
  return (
    <div className="flex items-center gap-2.5 text-[13px]">
      {ok ? (
        <span className="grid h-4 w-4 place-items-center rounded-full bg-gold text-[10px] font-bold text-forest-ink">
          ✓
        </span>
      ) : (
        <span className="h-4 w-4 rounded-full border border-[#3a5c50]" />
      )}
      <span className={cx(ok ? 'text-paper' : 'text-[#8fb3a6]')}>{label}</span>
    </div>
  )
}

function PrinterIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden focusable="false">
      <path
        d="M6 9V3h12v6M6 18H4a2 2 0 0 1-2-2v-4a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2h-2M6 14h12v7H6z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function AppShell({
  nav,
  activeId,
  onSelect,
  insumos,
  title,
  subtitle,
  kicker,
  corte,
  municipio = 'Municipio',
  onPrint,
  children,
}: {
  nav: NavItem[]
  activeId: string
  onSelect: (id: string) => void
  insumos: InsumoStatus
  title: ReactNode
  subtitle?: ReactNode
  kicker?: ReactNode
  corte?: string
  municipio?: string
  onPrint?: () => void
  children: ReactNode
}) {
  return (
    <div className="flex min-h-screen">
      {/* ----------------------------- Sidebar ----------------------------- */}
      <aside
        className="no-print sidebar sticky top-0 hidden h-screen w-[268px] shrink-0 flex-col text-paper shadow-sidebar md:flex"
      >
        {/* Brand */}
        <div className="flex items-center gap-3 px-6 pb-6 pt-7">
          <BrandMark />
          <div className="leading-tight">
            <div className="font-display text-[15px] font-semibold text-paper">Plataforma Alcaldías</div>
            <div className="text-[11px] tracking-wide text-[#8fb3a6]">Análisis Presupuestal CCPET</div>
          </div>
        </div>

        {/* Estado de insumos */}
        <div className="mx-6 mb-6 space-y-2.5 rounded-xl border border-[#1c4a3a] bg-[#ffffff0a] px-4 py-3.5">
          <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-gold-soft">
            Insumos del corte
          </div>
          <StatusRow label="Ejecución de ingresos" ok={insumos.ingresos} />
          <StatusRow label="Ejecución de gastos" ok={insumos.gastos} />
          <StatusRow label="Recursos del SGP" ok={insumos.sgp} />
        </div>

        {/* Navegación */}
        <nav className="flex-1 space-y-0.5 px-3" aria-label="Secciones">
          {nav.map((item) => {
            const active = item.id === activeId
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelect(item.id)}
                aria-current={active ? 'page' : undefined}
                className={cx(
                  'relative flex w-full items-center rounded-lg px-4 py-2.5 text-left text-sm transition-colors',
                  active
                    ? 'bg-[#ffffff12] font-medium text-paper'
                    : 'text-[#8fb3a6] hover:bg-[#ffffff0d] hover:text-paper',
                )}
              >
                {active ? (
                  <span className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-full bg-gold" />
                ) : null}
                {item.label}
              </button>
            )
          })}
        </nav>

        {/* Footer */}
        <div className="border-t border-[#1c4a3a] px-6 py-4">
          <div className="flex items-center gap-2 text-[11px] text-[#8fb3a6]">
            <span className="truncate" title={`${municipio}${corte ? ` · ${corte}` : ''}`}>
              {municipio}
              {corte ? <span className="text-paper/70"> · {corte}</span> : null}
            </span>
          </div>
          <div className="mt-1 text-[10px] uppercase tracking-[0.2em] text-[#5e8a7b]">v MVP</div>
        </div>
      </aside>

      {/* ------------------------------ Main ------------------------------ */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Topbar móvil: nav horizontal */}
        <div className="no-print flex gap-1 overflow-x-auto border-b border-line bg-forest-deep px-3 py-2 md:hidden">
          {nav.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelect(item.id)}
              className={cx(
                'whitespace-nowrap rounded-lg px-3 py-1.5 text-xs',
                item.id === activeId ? 'bg-[#ffffff14] text-paper' : 'text-[#8fb3a6]',
              )}
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* Topbar */}
        <header className="no-print sticky top-0 z-20 border-b border-line bg-[#f3f0e8e6] backdrop-blur">
          <div className="mx-auto flex max-w-[1200px] items-center justify-between gap-4 px-6 py-4 lg:px-8">
            <div className="min-w-0">
              {kicker ? (
                <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gold">
                  {kicker}
                </div>
              ) : null}
              <h1 className="truncate font-display text-2xl text-ink">{title}</h1>
              {subtitle ? <p className="truncate text-sm text-ink-soft">{subtitle}</p> : null}
            </div>
            <div className="flex shrink-0 items-center gap-3">
              {corte ? (
                <span className="hidden items-center gap-1.5 rounded-full border border-line bg-surface px-3 py-1.5 text-xs text-ink-soft sm:inline-flex">
                  <span className="h-1.5 w-1.5 rounded-full bg-gold" />
                  Corte <span className="num text-ink">{corte}</span>
                </span>
              ) : null}
              <button
                type="button"
                onClick={onPrint}
                aria-label="Imprimir informe"
                className="inline-flex items-center gap-2 rounded-xl bg-forest px-4 py-2 text-sm font-medium text-paper transition-colors hover:bg-forest-700"
              >
                <PrinterIcon />
                <span className="hidden sm:inline">Imprimir / Informe</span>
              </button>
            </div>
          </div>
        </header>

        {/* Contenido */}
        <main className="scroll-fino flex-1 overflow-x-hidden">
          <div className="mx-auto max-w-[1200px] px-6 py-8 lg:px-8">{children}</div>
        </main>
      </div>
    </div>
  )
}
