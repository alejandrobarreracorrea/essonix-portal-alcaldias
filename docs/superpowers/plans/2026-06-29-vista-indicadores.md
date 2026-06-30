# Plan 6 — Vista de Indicadores Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reproducir la hoja "Indicadores" como una vista que muestra el Indicador 1 (Autofinanciación de gastos de funcionamiento) con su valor real calculado (reutilizando el motor de Ley 617) y las definiciones de los indicadores 2–6 como referencia, sin fabricar valores que la plantilla no calcula.

**Architecture:** Componente presentacional puro `PanelIndicadores` que recibe el `IndicadorLey617` ya calculado (de App vía el motor `ley617`) y muestra el Indicador 1 = (Gastos de funcionamiento / ICLD) × 100. Los indicadores 2–6 se listan con su definición/fórmula DNP marcados como "no calculado en la plantilla". No hay motor nuevo ni golden (la hoja "Indicadores" del Excel es documental: solo títulos + imágenes; el único valor calculado del libro es el Indicador 1, que vive en la hoja "Ley 617" y ya está cubierto por el Plan 5).

**Tech Stack:** React 18, TypeScript, Vite, Tailwind, Vitest. (Planes 1–5 completos.)

## Global Constraints

- **No fabricar fidelidad:** la hoja "Indicadores" del template no calcula los indicadores 2–6; esta vista NO debe inventar esos números. Solo el Indicador 1 muestra valor (reusa `IndicadorLey617.pctGfIcld`).
- **Reuso:** el Indicador 1 se toma del resultado existente `ley617` (no recalcular).
- **App 100% cliente.** Identificadores English/camelCase, textos de UI en español. No tocar motores/golden previos.

## Contexto (de la ingeniería inversa)

La hoja "Indicadores" es documental (7 títulos + 7 imágenes PNG de definiciones). Definiciones DNP (de las imágenes):
1. Autofinanciación de los gastos de funcionamiento = (Gastos de funcionamiento / ICLD) × 100 — **CALCULADO** (Ley 617).
2. Respaldo del servicio de la deuda = (Servicio de la deuda / Ingresos disponibles) × 100.
3. Dependencia de las transferencias de la Nación y las Regalías = (Transferencias de la Nación + Regalías SGR) / Ingresos totales.
4. Generación de recursos propios = Ingresos tributarios / Ingresos corrientes.
5. Magnitud de la inversión = Gasto de capital / Gasto total.
6. Capacidad de ahorro = Ahorro corriente / Ingresos corrientes.

## Estructura de archivos

```
src/ui/
  PanelIndicadores.tsx       # NUEVO
  PanelIndicadores.test.tsx  # NUEVO
  Dashboard.tsx              # MODIFICAR: pestaña "Indicadores"
  App.tsx                    # MODIFICAR: pasar indicadorLey617 también a la vista Indicadores
```

---

### Task 1: Panel de Indicadores + pestaña

**Files:**
- Create: `src/ui/PanelIndicadores.tsx`, `src/ui/PanelIndicadores.test.tsx`
- Modify: `src/ui/Dashboard.tsx`, `src/App.tsx`

**Interfaces:**
- Consumes: `IndicadorLey617` (de `../types`).
- Produces: `function PanelIndicadores({ indicadorLey617 }: { indicadorLey617: IndicadorLey617 }): JSX.Element` y una pestaña "Indicadores" en el dashboard (aparece cuando hay ingresos Y gastos, igual que Ley 617).

- [ ] **Step 1: Escribir el test del panel (falla)**

Create `src/ui/PanelIndicadores.test.tsx`:
```tsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { PanelIndicadores } from './PanelIndicadores'
import type { IndicadorLey617 } from '../types'

const ind: IndicadorLey617 = {
  icldPropio: 5838830994.18, sgpLibreDest: 1083338192, totalIcld: 6922169186.18,
  funcAdminCentral: 2785887779.98, concejo: 193257794, personeria: 85695471, gfTotal: 3064841044.98,
  baseAdmin: 2785887779.98, dedSobretasaAmb: 30636311, dedSobretasaBomb: 48759212,
  dedSeguridadConc: 0, dedSeguroVida: 0, dedPolizaSalud: 0, dedTransporteConc: 15566000,
  dedDeficit: 0, dedCuotasPartes: 2291889, dedMesadas: 0, dedColjuegos: 25000000,
  totalAdminDepurado: 2663634367.98, pctGfIcld: 0.3847976402105142, limite: 0.8,
  diferencial: 0.41520235978948583, cumplimiento: 'Cumple',
}

describe('PanelIndicadores', () => {
  it('muestra el Indicador 1 calculado (× 100) y su cumplimiento', () => {
    render(<PanelIndicadores indicadorLey617={ind} />)
    expect(screen.getByText('1. Autofinanciación de los gastos de funcionamiento')).toBeInTheDocument()
    expect(screen.getByText(/38,48 %|38.48 %/)).toBeInTheDocument()
    expect(screen.getByText('Cumple')).toBeInTheDocument()
  })

  it('lista los indicadores 2–6 con su definición y marca que no los calcula la plantilla', () => {
    render(<PanelIndicadores indicadorLey617={ind} />)
    expect(screen.getByText('4. Generación de recursos propios')).toBeInTheDocument()
    expect(screen.getAllByText(/No calculado en la plantilla/i).length).toBeGreaterThanOrEqual(1)
  })
})
```

- [ ] **Step 2: Correr (verificar que falla)**

Run: `npm test -- src/ui/PanelIndicadores.test.tsx`
Expected: FAIL (`PanelIndicadores` no existe).

- [ ] **Step 3: Implementar `PanelIndicadores`**

Create `src/ui/PanelIndicadores.tsx`:
```tsx
import type { IndicadorLey617 } from '../types'

const fmtPct = (n: number) => (n * 100).toLocaleString('es-CO', { maximumFractionDigits: 2 }) + ' %'

const DEFINICIONES: { titulo: string; formula: string }[] = [
  { titulo: '2. Respaldo del servicio de la deuda', formula: '(Servicio de la deuda / Ingresos disponibles) × 100' },
  { titulo: '3. Dependencia de las transferencias de la Nación y las Regalías', formula: '(Transferencias de la Nación + Regalías SGR) / Ingresos totales' },
  { titulo: '4. Generación de recursos propios', formula: 'Ingresos tributarios / Ingresos corrientes' },
  { titulo: '5. Magnitud de la inversión', formula: 'Gasto de capital / Gasto total' },
  { titulo: '6. Capacidad de ahorro', formula: 'Ahorro corriente / Ingresos corrientes' },
]

export function PanelIndicadores({ indicadorLey617 }: { indicadorLey617: IndicadorLey617 }) {
  const cumple = indicadorLey617.cumplimiento === 'Cumple'
  return (
    <section className="space-y-4">
      <div className="rounded-lg border p-4">
        <p className="font-semibold">1. Autofinanciación de los gastos de funcionamiento</p>
        <p className="text-xs text-slate-500">(Gastos de funcionamiento / ICLD) × 100 — Indicador Ley 617</p>
        <div className="mt-1 flex items-baseline gap-3">
          <span className="text-3xl font-bold">{fmtPct(indicadorLey617.pctGfIcld)}</span>
          <span className={`rounded px-2 py-0.5 text-sm font-medium ${cumple ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            {indicadorLey617.cumplimiento}
          </span>
          <span className="text-sm text-slate-500">Límite {fmtPct(indicadorLey617.limite)}</span>
        </div>
      </div>

      <div className="space-y-2">
        {DEFINICIONES.map((d) => (
          <div key={d.titulo} className="rounded-lg border border-dashed p-4">
            <p className="font-semibold">{d.titulo}</p>
            <p className="text-xs text-slate-500">{d.formula}</p>
            <p className="mt-1 text-xs italic text-amber-700">No calculado en la plantilla (requiere fuentes adicionales).</p>
          </div>
        ))}
      </div>
    </section>
  )
}
```

- [ ] **Step 4: Correr (verificar que pasa)**

Run: `npm test -- src/ui/PanelIndicadores.test.tsx`
Expected: PASS (2 casos).

- [ ] **Step 5: Añadir la pestaña al Dashboard**

In `src/ui/Dashboard.tsx`:
- Import `import { PanelIndicadores } from './PanelIndicadores'` (el tipo `IndicadorLey617` ya está importado por el Plan 5).
- Tras el área de Ley 617, añadir (reusa la misma prop opcional `indicadorLey617`):
```tsx
  if (indicadorLey617) {
    areas.push({
      id: 'indicadores',
      label: 'Indicadores',
      render: () => <PanelIndicadores indicadorLey617={indicadorLey617} />,
    })
  }
```

- [ ] **Step 6: (App) — sin cambios de cálculo**

`src/App.tsx` ya calcula y pasa `indicadorLey617` al Dashboard (Plan 5). No requiere cambios adicionales (el Dashboard usa la misma prop para la pestaña Indicadores). Verificar que efectivamente se pasa.

- [ ] **Step 7: Verificar suite y build**

Run: `npm test`
Expected: PASS — toda la suite (los goldens previos intactos + los 2 nuevos del panel).

Run: `npm run build`
Expected: build exitoso, sin errores de TypeScript.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat: vista de Indicadores (Indicador 1 calculado + definiciones 2-6)"
```

---

## Self-Review

**Cobertura:** Indicador 1 con valor real reutilizando `ley617` + definiciones 2–6 como referencia sin fabricar números → Task 1. Fiel a la hoja documental "Indicadores". ✓

**Placeholders:** sin TBD/TODO; código completo.

**Consistencia de tipos:** `PanelIndicadores` consume `IndicadorLey617` (existente); el Dashboard reusa la prop `indicadorLey617` (ya pasada por App en el Plan 5). No hay motor nuevo ni golden. No se tocan motores/golden previos.
