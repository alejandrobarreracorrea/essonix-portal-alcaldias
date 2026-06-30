# Plan 7 — Gráficos (Dashboard de Resumen) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Añadir una vista "Resumen" con KPIs y gráficos derivados de los datos ya calculados y validados (Ingresos, Gastos, Fuentes y Usos, Ley 617), como capa de visualización sobre cifras confiables.

**Architecture:** Un módulo de selectores puros (`src/engine/resumen.ts`) deriva los datos de los gráficos a partir de los arreglos ya computados (`FilaIngreso[]`, `FilaGasto[]`, `FilaFuenteUso[]`, `IndicadorLey617`), tomando las filas totales (rubro "1"/"2") y secciones (2.1/2.2/2.3), sin cálculos de fidelidad nuevos. Un componente `PanelResumen` muestra tarjetas KPI + gráficos con Recharts. Aparece como primera pestaña del dashboard cuando hay ingresos y gastos.

**Tech Stack:** React 18, TypeScript, Vite, Tailwind, Vitest, **Recharts** (nuevo). (Planes 1–6 completos.)

## Global Constraints

- **Sin riesgo de fidelidad:** los gráficos solo VISUALIZAN cifras ya validadas por los goldens; los selectores no recalculan ni alteran valores (solo seleccionan/ordenan/etiquetan). No tocar motores/golden previos.
- **Robustez:** los selectores buscan filas por código de rubro exacto (total "1"/"2", secciones "2.1"/"2.2"/"2.3"); si una fila no existe, devuelven 0 / la omiten (sin lanzar).
- **App 100% cliente.** Identificadores English/camelCase, textos de UI en español. Aritmética sin redondeo en los selectores (el formateo es solo para mostrar).

## Estructura de archivos

```
src/
  engine/
    resumen.ts          # NUEVO: selectores puros para KPIs y gráficos
    resumen.test.ts     # NUEVO
  ui/
    PanelResumen.tsx     # NUEVO: KPIs + gráficos (Recharts)
    PanelResumen.test.tsx # NUEVO
    Dashboard.tsx        # MODIFICAR: pestaña "Resumen" (primera)
    App.tsx              # MODIFICAR: pasar las series al Dashboard/PanelResumen
```

### Definiciones de los selectores (sobre datos ya validados)

- `kpisResumen(filasIngreso, filasGasto, indicadorLey617?)` → objeto con:
  - de la fila total de ingresos (rubro `"1"`): `ingresoPptoFinal = pptoFinal`, `ingresoRecaudo = ingreso`, `pctIngreso = pctIngreso`.
  - de la fila total de gastos (rubro `"2"`): `gastoPptoFinal = pptoFinal`, `gastoCompromisos = registros`, `gastoPagos = egresos`, `pctCompromiso = pptoFinal !== 0 ? registros / pptoFinal : 0`.
  - de Ley 617 (si viene): `ley617Pct = pctGfIcld`, `ley617Cumple = cumplimiento`.
- `cascadaGastos(filasGasto)` → `[{etapa, valor}]` de la fila total "2": Ppto Final (pptoFinal), Disponibilidades (disponibilidades), Compromisos (registros), Órdenes de pago (ordenPago), Egresos (egresos).
- `composicionGastos(filasGasto)` → `[{seccion, valor}]` para las secciones existentes entre `"2.1"` (Funcionamiento), `"2.2"` (Servicio de la deuda), `"2.3"` (Inversión), valor = `registros` de esa fila (omite las que no existan).
- `topFuentesPorRecaudo(filasFuenteUso, n=10)` → fuentes con `descripcionFuente !== 'NO APLICA'` y `recaudo > 0`, ordenadas por `recaudo` desc, primeras `n`; cada item `{ fuente: descripcionFuente, recaudo }`.

---

### Task 1: Selectores de resumen

**Files:**
- Create: `src/engine/resumen.ts`, `src/engine/resumen.test.ts`

**Interfaces:**
- Consumes: `FilaIngreso`, `FilaGasto`, `FilaFuenteUso`, `IndicadorLey617` (de `../types`).
- Produces:
  - `type KpisResumen = { ingresoPptoFinal: number; ingresoRecaudo: number; pctIngreso: number; gastoPptoFinal: number; gastoCompromisos: number; gastoPagos: number; pctCompromiso: number; ley617Pct: number | null; ley617Cumple: string | null }`
  - `function kpisResumen(filasIngreso: FilaIngreso[], filasGasto: FilaGasto[], indicadorLey617?: IndicadorLey617): KpisResumen`
  - `function cascadaGastos(filasGasto: FilaGasto[]): { etapa: string; valor: number }[]`
  - `function composicionGastos(filasGasto: FilaGasto[]): { seccion: string; valor: number }[]`
  - `function topFuentesPorRecaudo(filasFuenteUso: FilaFuenteUso[], n?: number): { fuente: string; recaudo: number }[]`

- [ ] **Step 1: Escribir los tests (fallan)**

Create `src/engine/resumen.test.ts`:
```ts
import { describe, it, expect } from 'vitest'
import { kpisResumen, cascadaGastos, composicionGastos, topFuentesPorRecaudo } from './resumen'
import type { FilaIngreso, FilaGasto, FilaFuenteUso, IndicadorLey617 } from '../types'

const ingTotal: FilaIngreso = {
  columna3: '', rubro: '1', nombre: 'INGRESOS', unidadEjec: '', fuentes: '', atributo: '',
  pptoInicial: 0, adiciones: 0, reducciones: 0, pptoFinal: 40000, ingreso: 17500,
  pctIngreso: 0.4375, proyeccion: 0, observaciones: '',
}
const gas = (rubro: string, p: Partial<FilaGasto>): FilaGasto => ({
  extrae: '', columna1: '', concat: '', rubro, descripcion: '', cpc: '', unidadEjec: '',
  programatico: '', fuentes: '', cpi: '', atributo: '',
  pptoInicial: 0, pptoFinal: 0, disponibilidades: 0, saldoDisponible: 0, registros: 0,
  saldoDisponibilidades: 0, ordenPago: 0, saldoRegistro: 0, egresos: 0, egresosPapeles: 0,
  saldoOrdenesPago: 0, ...p,
})
const gasTotal = gas('2', { pptoFinal: 40000, disponibilidades: 30000, registros: 20000, ordenPago: 10000, egresos: 6000 })
const fu = (descripcionFuente: string, recaudo: number): FilaFuenteUso => ({
  codigo: null, descripcionFuente, piIngresos: 0, pfIngresos: 0, piGastos: 0, pfGastos: 0,
  difPptoInicial: 0, difPptoFinal: 0, recaudo, pctRecaudo: 0, disponibilidades: 0, compromisos: 0,
  pctCompromisos: 0, obligaciones: 0, pagos: 0, saldoPresupuesto: 0, dispSinCompromiso: 0,
  reservas: 0, cuentasPorPagar: 0, superavitDeficit: 0, observaciones: '', ecb: 0,
})
const ind: IndicadorLey617 = { pctGfIcld: 0.3848, cumplimiento: 'Cumple' } as IndicadorLey617

describe('kpisResumen', () => {
  it('toma totales de ingresos/gastos y el indicador Ley 617', () => {
    const k = kpisResumen([ingTotal], [gasTotal], ind)
    expect(k.ingresoRecaudo).toBe(17500)
    expect(k.pctIngreso).toBe(0.4375)
    expect(k.gastoCompromisos).toBe(20000)
    expect(k.pctCompromiso).toBe(20000 / 40000)
    expect(k.ley617Pct).toBe(0.3848)
    expect(k.ley617Cumple).toBe('Cumple')
  })
  it('Ley 617 nulo cuando no se pasa indicador; 0 si faltan filas total', () => {
    const k = kpisResumen([], [], undefined)
    expect(k.ley617Pct).toBeNull()
    expect(k.ingresoPptoFinal).toBe(0)
    expect(k.pctCompromiso).toBe(0)
  })
})

describe('cascadaGastos', () => {
  it('devuelve las 5 etapas de ejecución de la fila total', () => {
    const c = cascadaGastos([gasTotal])
    expect(c).toEqual([
      { etapa: 'Ppto Final', valor: 40000 },
      { etapa: 'Disponibilidades', valor: 30000 },
      { etapa: 'Compromisos', valor: 20000 },
      { etapa: 'Órdenes de pago', valor: 10000 },
      { etapa: 'Egresos', valor: 6000 },
    ])
  })
})

describe('composicionGastos', () => {
  it('incluye solo las secciones existentes con su valor de compromisos', () => {
    const filas = [gas('2.1', { registros: 7000 }), gas('2.3', { registros: 13000 })]
    expect(composicionGastos(filas)).toEqual([
      { seccion: 'Funcionamiento', valor: 7000 },
      { seccion: 'Inversión', valor: 13000 },
    ])
  })
})

describe('topFuentesPorRecaudo', () => {
  it('ordena por recaudo desc, excluye NO APLICA y recaudo<=0, limita a n', () => {
    const filas = [fu('NO APLICA', 999), fu('A', 100), fu('B', 0), fu('C', 300), fu('D', 200)]
    expect(topFuentesPorRecaudo(filas, 2)).toEqual([
      { fuente: 'C', recaudo: 300 },
      { fuente: 'D', recaudo: 200 },
    ])
  })
})
```

- [ ] **Step 2: Correr (verificar que falla)**

Run: `npm test -- src/engine/resumen.test.ts`
Expected: FAIL (`./resumen` no existe).

- [ ] **Step 3: Implementar `resumen.ts`**

Create `src/engine/resumen.ts`:
```ts
import type { FilaFuenteUso, FilaGasto, FilaIngreso, IndicadorLey617 } from '../types'

export type KpisResumen = {
  ingresoPptoFinal: number
  ingresoRecaudo: number
  pctIngreso: number
  gastoPptoFinal: number
  gastoCompromisos: number
  gastoPagos: number
  pctCompromiso: number
  ley617Pct: number | null
  ley617Cumple: string | null
}

const ZERO_ING = { pptoFinal: 0, ingreso: 0, pctIngreso: 0 }
const ZERO_GAS = { pptoFinal: 0, disponibilidades: 0, registros: 0, ordenPago: 0, egresos: 0 }

export function kpisResumen(
  filasIngreso: FilaIngreso[],
  filasGasto: FilaGasto[],
  indicadorLey617?: IndicadorLey617,
): KpisResumen {
  const ti = filasIngreso.find((f) => f.rubro === '1') ?? ZERO_ING
  const tg = filasGasto.find((f) => f.rubro === '2') ?? ZERO_GAS
  return {
    ingresoPptoFinal: ti.pptoFinal,
    ingresoRecaudo: ti.ingreso,
    pctIngreso: ti.pctIngreso,
    gastoPptoFinal: tg.pptoFinal,
    gastoCompromisos: tg.registros,
    gastoPagos: tg.egresos,
    pctCompromiso: tg.pptoFinal !== 0 ? tg.registros / tg.pptoFinal : 0,
    ley617Pct: indicadorLey617 ? indicadorLey617.pctGfIcld : null,
    ley617Cumple: indicadorLey617 ? indicadorLey617.cumplimiento : null,
  }
}

export function cascadaGastos(filasGasto: FilaGasto[]): { etapa: string; valor: number }[] {
  const t = filasGasto.find((f) => f.rubro === '2') ?? ZERO_GAS
  return [
    { etapa: 'Ppto Final', valor: t.pptoFinal },
    { etapa: 'Disponibilidades', valor: t.disponibilidades },
    { etapa: 'Compromisos', valor: t.registros },
    { etapa: 'Órdenes de pago', valor: t.ordenPago },
    { etapa: 'Egresos', valor: t.egresos },
  ]
}

export function composicionGastos(filasGasto: FilaGasto[]): { seccion: string; valor: number }[] {
  const secciones: { rubro: string; seccion: string }[] = [
    { rubro: '2.1', seccion: 'Funcionamiento' },
    { rubro: '2.2', seccion: 'Servicio de la deuda' },
    { rubro: '2.3', seccion: 'Inversión' },
  ]
  const out: { seccion: string; valor: number }[] = []
  for (const s of secciones) {
    const fila = filasGasto.find((f) => f.rubro === s.rubro)
    if (fila) out.push({ seccion: s.seccion, valor: fila.registros })
  }
  return out
}

export function topFuentesPorRecaudo(
  filasFuenteUso: FilaFuenteUso[],
  n = 10,
): { fuente: string; recaudo: number }[] {
  return filasFuenteUso
    .filter((f) => f.descripcionFuente !== 'NO APLICA' && f.recaudo > 0)
    .sort((a, b) => b.recaudo - a.recaudo)
    .slice(0, n)
    .map((f) => ({ fuente: f.descripcionFuente, recaudo: f.recaudo }))
}
```

- [ ] **Step 4: Correr (verificar que pasa)**

Run: `npm test -- src/engine/resumen.test.ts`
Expected: PASS (todos los casos).

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: selectores de resumen para KPIs y gráficos"
```

---

### Task 2: Panel de Resumen con gráficos (Recharts) + pestaña

**Files:**
- Modify: `package.json` (dep `recharts`)
- Create: `src/ui/PanelResumen.tsx`, `src/ui/PanelResumen.test.tsx`
- Modify: `src/ui/Dashboard.tsx`, `src/App.tsx`

**Interfaces:**
- Consumes: `FilaIngreso`, `FilaGasto`, `FilaFuenteUso`, `IndicadorLey617`; selectores de `../engine/resumen`; `recharts`.
- Produces: `PanelResumen` (KPIs + gráficos) y una pestaña "Resumen" (primera) en el dashboard, visible cuando hay ingresos y gastos.

- [ ] **Step 1: Instalar Recharts**

Run: `npm install recharts`
Expected: se añade `recharts` a `dependencies`.

- [ ] **Step 2: Escribir el test del panel (falla)**

Create `src/ui/PanelResumen.test.tsx`:
```tsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { PanelResumen } from './PanelResumen'
import type { FilaIngreso, FilaGasto } from '../types'

const ingTotal: FilaIngreso = {
  columna3: '', rubro: '1', nombre: 'INGRESOS', unidadEjec: '', fuentes: '', atributo: '',
  pptoInicial: 0, adiciones: 0, reducciones: 0, pptoFinal: 40000, ingreso: 17500,
  pctIngreso: 0.4375, proyeccion: 0, observaciones: '',
}
const gasTotal: FilaGasto = {
  extrae: '', columna1: '', concat: '', rubro: '2', descripcion: '', cpc: '', unidadEjec: '',
  programatico: '', fuentes: '', cpi: '', atributo: '',
  pptoInicial: 0, pptoFinal: 40000, disponibilidades: 30000, saldoDisponible: 0, registros: 20000,
  saldoDisponibilidades: 0, ordenPago: 10000, saldoRegistro: 0, egresos: 6000, egresosPapeles: 0,
  saldoOrdenesPago: 0,
}

describe('PanelResumen', () => {
  it('muestra las tarjetas KPI con el recaudo y los compromisos', () => {
    render(<PanelResumen filasIngreso={[ingTotal]} filasGasto={[gasTotal]} filasFuenteUso={[]} indicadorLey617={undefined} />)
    expect(screen.getByText('Recaudo de ingresos')).toBeInTheDocument()
    expect(screen.getByText('Compromisos de gastos')).toBeInTheDocument()
  })
})
```

(Nota: Recharts usa `ResponsiveContainer` que en jsdom puede renderizar sin dimensiones; el test solo verifica las tarjetas KPI de texto, no el SVG del gráfico.)

- [ ] **Step 3: Correr (verificar que falla)**

Run: `npm test -- src/ui/PanelResumen.test.tsx`
Expected: FAIL (`PanelResumen` no existe).

- [ ] **Step 4: Implementar `PanelResumen`**

Create `src/ui/PanelResumen.tsx`:
```tsx
import {
  Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts'
import type { FilaFuenteUso, FilaGasto, FilaIngreso, IndicadorLey617 } from '../types'
import { cascadaGastos, composicionGastos, kpisResumen, topFuentesPorRecaudo } from '../engine/resumen'

const fmtNum = (n: number) => n.toLocaleString('es-CO', { maximumFractionDigits: 0 })
const fmtPct = (n: number) => (n * 100).toLocaleString('es-CO', { maximumFractionDigits: 2 }) + ' %'
const fmtMill = (n: number) => (n / 1_000_000).toLocaleString('es-CO', { maximumFractionDigits: 0 }) + ' M'
const COLORES = ['#0f766e', '#b45309', '#1d4ed8', '#9333ea', '#dc2626', '#0891b2', '#65a30d', '#c026d3', '#ea580c', '#4f46e5']

function Kpi({ titulo, valor, sub }: { titulo: string; valor: string; sub?: string }) {
  return (
    <div className="rounded-lg border p-4">
      <p className="text-xs text-slate-500">{titulo}</p>
      <p className="text-xl font-bold">{valor}</p>
      {sub && <p className="text-xs text-slate-500">{sub}</p>}
    </div>
  )
}

export function PanelResumen({
  filasIngreso, filasGasto, filasFuenteUso, indicadorLey617,
}: {
  filasIngreso: FilaIngreso[]
  filasGasto: FilaGasto[]
  filasFuenteUso: FilaFuenteUso[]
  indicadorLey617?: IndicadorLey617
}) {
  const k = kpisResumen(filasIngreso, filasGasto, indicadorLey617)
  const cascada = cascadaGastos(filasGasto)
  const composicion = composicionGastos(filasGasto)
  const topFuentes = topFuentesPorRecaudo(filasFuenteUso, 10)

  return (
    <section className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi titulo="Recaudo de ingresos" valor={fmtNum(k.ingresoRecaudo)} sub={`${fmtPct(k.pctIngreso)} del ppto final`} />
        <Kpi titulo="Compromisos de gastos" valor={fmtNum(k.gastoCompromisos)} sub={`${fmtPct(k.pctCompromiso)} del ppto final`} />
        <Kpi titulo="Pagos (egresos)" valor={fmtNum(k.gastoPagos)} />
        <Kpi titulo="Ley 617 (GF/ICLD)" valor={k.ley617Pct != null ? fmtPct(k.ley617Pct) : '—'} sub={k.ley617Cumple ?? ''} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-lg border p-4">
          <h3 className="mb-2 text-sm font-semibold">Ejecución de gastos (millones)</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={cascada}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="etapa" tick={{ fontSize: 11 }} />
              <YAxis tickFormatter={fmtMill} tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v: number) => fmtNum(v)} />
              <Bar dataKey="valor" fill="#0f766e" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-lg border p-4">
          <h3 className="mb-2 text-sm font-semibold">Composición de gastos (compromisos)</h3>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={composicion} dataKey="valor" nameKey="seccion" outerRadius={90} label={(e) => e.seccion}>
                {composicion.map((_, i) => <Cell key={i} fill={COLORES[i % COLORES.length]} />)}
              </Pie>
              <Tooltip formatter={(v: number) => fmtNum(v)} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="rounded-lg border p-4">
        <h3 className="mb-2 text-sm font-semibold">Top 10 fuentes por recaudo (millones)</h3>
        <ResponsiveContainer width="100%" height={Math.max(220, topFuentes.length * 32)}>
          <BarChart data={topFuentes} layout="vertical" margin={{ left: 40 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" tickFormatter={fmtMill} tick={{ fontSize: 11 }} />
            <YAxis type="category" dataKey="fuente" width={220} tick={{ fontSize: 10 }} />
            <Tooltip formatter={(v: number) => fmtNum(v)} />
            <Bar dataKey="recaudo" fill="#1d4ed8" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </section>
  )
}
```

- [ ] **Step 5: Correr (verificar que pasa)**

Run: `npm test -- src/ui/PanelResumen.test.tsx`
Expected: PASS (las tarjetas KPI se renderizan; el SVG de Recharts puede no tener tamaño en jsdom, pero el test no lo verifica).

- [ ] **Step 6: Añadir la pestaña "Resumen" (primera) al Dashboard**

In `src/ui/Dashboard.tsx`:
- Import `import { PanelResumen } from './PanelResumen'` y los tipos `FilaFuenteUso` (ya importado), `IndicadorLey617` (ya importado).
- Añadir props: `filasIngreso`/`filasGasto`/`filasFuenteUso`/`indicadorLey617` ya llegan; el Dashboard ya recibe `filasIngreso`, `filasGasto`, `filasFuenteUso`, `indicadorLey617`.
- ANTES del bloque que agrega el área de ingresos (para que "Resumen" sea la primera pestaña), añadir:
```tsx
  if (filasIngreso.length > 0 && filasGasto.length > 0) {
    areas.push({
      id: 'resumen',
      label: 'Resumen',
      render: () => (
        <PanelResumen
          filasIngreso={filasIngreso}
          filasGasto={filasGasto}
          filasFuenteUso={filasFuenteUso ?? []}
          indicadorLey617={indicadorLey617}
        />
      ),
    })
  }
```
(Asegurar que `filasFuenteUso` e `indicadorLey617` estén en la firma de props del Dashboard; ya se añadieron en Planes 4–5 como opcionales.)

- [ ] **Step 7: App — confirmar props**

`src/App.tsx` ya pasa `filasIngreso`, `filasGasto`, `filasFuenteUso`, `indicadorLey617` al Dashboard (Planes 4–5). Verificar que las 4 se pasan; no requiere cálculo nuevo.

- [ ] **Step 8: Verificar suite y build**

Run: `npm test`
Expected: PASS — toda la suite (selectores + panel + goldens previos intactos).

Run: `npm run build`
Expected: build exitoso, sin errores de TypeScript. (Aviso de tamaño de chunk por recharts/xlsx es esperado, no es error.)

- [ ] **Step 9: Verificación manual (opcional)**

Run: `npm run dev`. Cargar ingresos + gastos de Briceño; confirmar la pestaña "Resumen" (primera) con KPIs y los 3 gráficos.

- [ ] **Step 10: Commit**

```bash
git add -A
git commit -m "feat: dashboard de Resumen con KPIs y gráficos (Recharts)"
```

---

## Self-Review

**Cobertura:** KPIs + gráficos (ejecución de gastos, composición funcionamiento/inversión, top fuentes por recaudo, indicador Ley 617) sobre datos ya validados → Tasks 1–2. ✓

**Placeholders:** sin TBD/TODO; código completo.

**Consistencia de tipos:** selectores en `resumen.ts` consumen `FilaIngreso/FilaGasto/FilaFuenteUso/IndicadorLey617` (existentes) y devuelven tipos propios; `PanelResumen` usa esos selectores + Recharts; el Dashboard reusa las props ya pasadas por App (Planes 4–5). No hay motor de fidelidad nuevo ni golden; no se tocan motores/golden previos.
