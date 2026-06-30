# Plan 3 — Ingesta unificada + validación + dashboard automático Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reemplazar la subida manual por pestaña por un flujo único: el usuario carga los 3 insumos (ingresos, gastos, SGP), cada uno se valida (estructura + control de totales), y el análisis disponible se genera automáticamente en un dashboard.

**Architecture:** Una pantalla de ingesta con 3 slots. Cada slot parsea el archivo (reusando los parsers existentes) y lo valida (estructura vía parser + chequeos de cuadre vía un módulo de validación nuevo). Cuando un insumo es válido, su análisis se calcula automáticamente con el motor correspondiente y aparece como pestaña en el dashboard. Sin paso manual por área. La validación es independiente de la fidelidad: usa una tolerancia de 1 peso para los chequeos de cuadre (no toca la garantía de tolerancia 0 del cálculo).

**Tech Stack:** React 18, TypeScript, Vite, SheetJS (`xlsx` 0.20.3), Tailwind CSS, Vitest. (Proyecto ya inicializado; Planes 1–2 completos: Análisis de Ingresos y Gastos con golden tests tolerancia 0.)

## Global Constraints

- **App 100% cliente**, sin backend. Identificadores English/camelCase; textos de UI en español.
- **La fidelidad (tolerancia 0) del cálculo NO se toca.** Este plan solo añade ingesta/validación/UI; no modifica los motores `analisisIngresos`/`analisisGastos` ni sus golden tests, que deben seguir verdes.
- **Validación ≠ fidelidad:** los chequeos de cuadre usan una tolerancia de **1 peso** (`EPSILON = 1`) para evitar falsos positivos por punto flotante. Es un control de sanidad del insumo, no una comparación de fidelidad.
- **Auto-generación:** en cuanto un insumo se carga y pasa validación (sin errores), su análisis se calcula y se muestra sin acción adicional del usuario.
- **No romper lo existente:** los motores, parsers y golden tests de los Planes 1–2 permanecen; la suite completa debe quedar verde.

## Alcance de este plan

Incluye: módulo de validación (ingresos, gastos, SGP), lector de hojas del archivo SGP, pantalla de ingesta unificada con 3 slots y feedback de validación, y refactor del dashboard para auto-generar las áreas disponibles (Ingresos, Gastos) como pestañas. El insumo SGP se acepta y se valida estructuralmente (su análisis se construye en un plan posterior).

Fuera de alcance (planes posteriores): las 5 áreas restantes (Fuentes y Usos, Seguimiento SGP, Ley 617, PAC, Indicadores), los gráficos, export a Excel, y persistencia. La capa de gráficos va al final, tras las 7 áreas.

## Estructura de archivos

```
src/
  validation/
    validators.ts        # NUEVO: ValidationResult + validateIngresos/validateGastos/validateSgp
    validators.test.ts   # NUEVO
  parsers/
    sgp.ts               # NUEVO: readSgpSheetNames(file) (solo nombres de hoja)
  ui/
    SlotInsumo.tsx       # NUEVO: slot genérico de carga + estado de validación
    SlotInsumo.test.tsx  # NUEVO
    CargaInsumos.tsx     # NUEVO: compone los 3 slots
    Dashboard.tsx        # NUEVO: pestañas de las áreas con datos válidos
    App.tsx              # MODIFICAR: ingesta unificada + dashboard automático
    (CargaArchivo.tsx)   # ELIMINAR: reemplazado por SlotInsumo
    TablaIngresos.tsx / TablaGastos.tsx  # sin cambios
```

### Reglas de validación (derivadas de los datos reales de Briceño)

- **Ingresos** (sobre la fila total, rubro `"1"`): `pptoFinal ≈ pptoInicial + adiciones − reducciones` (con `adiciones = adicAnteriores + adicPeriodo`, `reducciones = reducAnteriores + reducPeriodo`). En Briceño: `30807760602 + 9612520949.27 − 171780552 = 40248500999.27` = pptoFinal. Si no cuadra (>1 peso) → error.
- **Gastos** (sobre la fila total, rubro `"2"`), 4 identidades de la cascada de ejecución:
  - `saldoDisponible ≈ pptoFinal − disponibilidades`  (40248500999.27 − 29932416102.76 = 10316084896.51)
  - `saldoDisponibilidades ≈ disponibilidades − registros`  (… = 9758036600.19)
  - `saldoRegistro ≈ registros − ordenPago`  (… = 9660322628.19)
  - `saldoOrdenesPago ≈ ordenPago − egresos − egresosPapeles`  (10514056874.38 − 6769591638.97 − 3591312004.41 ≈ 153153230.999998)
  Cualquier desajuste (>1 peso) → error.
- **SGP** (estructura): el libro debe contener las hojas `"Datos Reporte SGP"` y `"Datos Reporte SGP Detalle"`. Su análisis se construye después; aquí solo se valida que sea el reporte de SICODIS.
- **Estructura general:** la validación de "archivo equivocado / columnas faltantes" la provee el parser existente (lanza `IngresoParseError`/`GastoParseError`); el slot la captura y la muestra como error de validación.

---

### Task 1: Módulo de validación

**Files:**
- Create: `src/validation/validators.ts`, `src/validation/validators.test.ts`

**Interfaces:**
- Consumes: `IngresoRawRow`, `GastoRawRow` de `../types`.
- Produces:
  - `type ValidationIssue = { level: 'error' | 'warning'; message: string }`
  - `type ValidationResult = { ok: boolean; issues: ValidationIssue[] }`
  - `function validateIngresos(rows: IngresoRawRow[]): ValidationResult`
  - `function validateGastos(rows: GastoRawRow[]): ValidationResult`
  - `function validateSgp(sheetNames: string[]): ValidationResult`

- [ ] **Step 1: Escribir los tests (fallan)**

Create `src/validation/validators.test.ts`:
```ts
import { describe, it, expect } from 'vitest'
import { validateIngresos, validateGastos, validateSgp } from './validators'
import type { IngresoRawRow, GastoRawRow } from '../types'

const ingTotal: IngresoRawRow = {
  codigoRubro: '1', descripcion: 'INGRESOS', ccpet02: '', ccpet05: '', ccpet83: '',
  pptoInicial: 30807760602, adicAnteriores: 0, adicPeriodo: 9612520949.27,
  reducAnteriores: 0, reducPeriodo: 171780552, pptoFinal: 40248500999.27,
  totalIngresos: 17574447442,
}
const gasTotal: GastoRawRow = {
  rubro: '2', descripcion: 'GASTOS', cpc: '', unidadEjec: '', programatico: '',
  fuentes: '', cpi: '', atributo: '',
  pptoInicial: 30807760602, pptoFinal: 40248500999.27, disponibilidades: 29932416102.76,
  saldoDisponible: 10316084896.51, registros: 20174379502.57, saldoDisponibilidades: 9758036600.19,
  ordenPago: 10514056874.38, saldoRegistro: 9660322628.19, egresos: 6769591638.97,
  egresosPapeles: 3591312004.41, saldoOrdenesPago: 153153230.999998,
}

describe('validateIngresos', () => {
  it('acepta el total que cuadra (Briceño)', () => {
    const r = validateIngresos([ingTotal])
    expect(r.ok).toBe(true)
    expect(r.issues).toHaveLength(0)
  })
  it('rechaza si falta la fila total rubro 1', () => {
    const r = validateIngresos([{ ...ingTotal, codigoRubro: '1.1' }])
    expect(r.ok).toBe(false)
    expect(r.issues[0].message).toMatch(/fila total de INGRESOS/i)
  })
  it('rechaza si el presupuesto final no cuadra', () => {
    const r = validateIngresos([{ ...ingTotal, pptoFinal: 40248500999.27 + 5 }])
    expect(r.ok).toBe(false)
    expect(r.issues.some((i) => i.level === 'error')).toBe(true)
  })
  it('rechaza archivo vacío', () => {
    expect(validateIngresos([]).ok).toBe(false)
  })
})

describe('validateGastos', () => {
  it('acepta el total que cuadra (Briceño)', () => {
    const r = validateGastos([gasTotal])
    expect(r.ok).toBe(true)
    expect(r.issues).toHaveLength(0)
  })
  it('rechaza si una identidad de saldo no cuadra', () => {
    const r = validateGastos([{ ...gasTotal, saldoOrdenesPago: 999 }])
    expect(r.ok).toBe(false)
    expect(r.issues.some((i) => /Saldo órdenes de pago/i.test(i.message))).toBe(true)
  })
  it('rechaza si falta la fila total rubro 2', () => {
    expect(validateGastos([{ ...gasTotal, rubro: '2.1' }]).ok).toBe(false)
  })
})

describe('validateSgp', () => {
  it('acepta cuando están las dos hojas requeridas', () => {
    expect(validateSgp(['Datos Reporte SGP', 'Datos Reporte SGP Detalle']).ok).toBe(true)
  })
  it('rechaza cuando falta una hoja', () => {
    const r = validateSgp(['Datos Reporte SGP'])
    expect(r.ok).toBe(false)
    expect(r.issues[0].message).toMatch(/Datos Reporte SGP Detalle/)
  })
})
```

- [ ] **Step 2: Correr (verificar que falla)**

Run: `npm test -- src/validation/validators.test.ts`
Expected: FAIL (módulo `./validators` no existe).

- [ ] **Step 3: Implementar `validators.ts`**

Create `src/validation/validators.ts`:
```ts
import type { IngresoRawRow, GastoRawRow } from '../types'

export type ValidationIssue = { level: 'error' | 'warning'; message: string }
export type ValidationResult = { ok: boolean; issues: ValidationIssue[] }

// Tolerancia de cuadre para validación (NO es la tolerancia de fidelidad, que es 0).
const EPSILON = 1

const result = (issues: ValidationIssue[]): ValidationResult => ({
  ok: issues.every((i) => i.level !== 'error'),
  issues,
})

export function validateIngresos(rows: IngresoRawRow[]): ValidationResult {
  const issues: ValidationIssue[] = []
  if (rows.length === 0) {
    return result([{ level: 'error', message: 'El archivo de ingresos no contiene filas de datos.' }])
  }
  const total = rows.find((r) => r.codigoRubro === '1')
  if (!total) {
    return result([{ level: 'error', message: 'No se encontró la fila total de INGRESOS (rubro "1"). ¿El archivo está completo?' }])
  }
  const adiciones = total.adicAnteriores + total.adicPeriodo
  const reducciones = total.reducAnteriores + total.reducPeriodo
  const esperado = total.pptoInicial + adiciones - reducciones
  if (Math.abs(esperado - total.pptoFinal) > EPSILON) {
    issues.push({
      level: 'error',
      message: `El presupuesto final del total no cuadra: inicial + adiciones − reducciones = ${esperado}, pero el archivo dice ${total.pptoFinal}.`,
    })
  }
  return result(issues)
}

export function validateGastos(rows: GastoRawRow[]): ValidationResult {
  const issues: ValidationIssue[] = []
  if (rows.length === 0) {
    return result([{ level: 'error', message: 'El archivo de gastos no contiene filas de datos.' }])
  }
  const total = rows.find((r) => r.rubro === '2')
  if (!total) {
    return result([{ level: 'error', message: 'No se encontró la fila total de GASTOS (rubro "2"). ¿El archivo está completo?' }])
  }
  const checks: [string, number, number][] = [
    ['Saldo disponible', total.saldoDisponible, total.pptoFinal - total.disponibilidades],
    ['Saldo de disponibilidades', total.saldoDisponibilidades, total.disponibilidades - total.registros],
    ['Saldo registro', total.saldoRegistro, total.registros - total.ordenPago],
    ['Saldo órdenes de pago', total.saldoOrdenesPago, total.ordenPago - total.egresos - total.egresosPapeles],
  ]
  for (const [nombre, real, esperado] of checks) {
    if (Math.abs(real - esperado) > EPSILON) {
      issues.push({ level: 'error', message: `${nombre} del total no cuadra (${real} vs esperado ${esperado}).` })
    }
  }
  return result(issues)
}

export function validateSgp(sheetNames: string[]): ValidationResult {
  const requeridas = ['Datos Reporte SGP', 'Datos Reporte SGP Detalle']
  const issues: ValidationIssue[] = requeridas
    .filter((s) => !sheetNames.includes(s))
    .map((s) => ({ level: 'error', message: `Falta la hoja "${s}". ¿Es el reporte de SICODIS (SGP) correcto?` }))
  return result(issues)
}
```

- [ ] **Step 4: Correr (verificar que pasa)**

Run: `npm test -- src/validation/validators.test.ts`
Expected: PASS (9 casos).

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: módulo de validación de insumos (estructura + control de totales)"
```

---

### Task 2: Lector de hojas del archivo SGP

**Files:**
- Create: `src/parsers/sgp.ts`, `src/parsers/sgp.test.ts`
- Use as fixture: `tests/fixtures/sgp.briceno.xlsx` (copia del insumo SGP)

**Interfaces:**
- Consumes: `xlsx`.
- Produces: `function readSgpSheetNames(file: File): Promise<string[]>`

- [ ] **Step 1: Copiar el insumo SGP como fixture**

Run:
```bash
cp "/Users/alejandro/Documents/DocumentosProyectoGobierno/ResumenDistribucionSGPUltimaYOnce.xlsx" tests/fixtures/sgp.briceno.xlsx
```

- [ ] **Step 2: Escribir el test (falla)**

Create `src/parsers/sgp.test.ts`:
```ts
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { readSgpSheetNames } from './sgp'

// Helper: construye un File a partir del fixture en disco (entorno jsdom).
function fixtureFile(path: string, name: string): File {
  const buf = readFileSync(path)
  return new File([buf], name, { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
}

describe('readSgpSheetNames', () => {
  it('devuelve los nombres de hoja del reporte SICODIS', async () => {
    const file = fixtureFile('tests/fixtures/sgp.briceno.xlsx', 'sgp.xlsx')
    const names = await readSgpSheetNames(file)
    expect(names).toContain('Datos Reporte SGP')
    expect(names).toContain('Datos Reporte SGP Detalle')
  })
})
```

- [ ] **Step 3: Correr (verificar que falla)**

Run: `npm test -- src/parsers/sgp.test.ts`
Expected: FAIL (módulo `./sgp` no existe).

- [ ] **Step 4: Implementar `sgp.ts`**

Create `src/parsers/sgp.ts`:
```ts
import * as XLSX from 'xlsx'

/** Lee solo los nombres de hoja del archivo SGP (SICODIS), sin parsear celdas. */
export async function readSgpSheetNames(file: File): Promise<string[]> {
  const buf = await file.arrayBuffer()
  const wb = XLSX.read(buf, { type: 'array', bookSheets: true })
  return wb.SheetNames
}
```

- [ ] **Step 5: Correr (verificar que pasa)**

Run: `npm test -- src/parsers/sgp.test.ts`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: lector de hojas del insumo SGP (SICODIS) + fixture"
```

---

### Task 3: Slot de carga genérico con validación

**Files:**
- Create: `src/ui/SlotInsumo.tsx`, `src/ui/SlotInsumo.test.tsx`

**Interfaces:**
- Consumes: `ValidationResult` de `../validation/validators`.
- Produces:
  - `type SlotResultado<P> = { validation: ValidationResult; payload: P | null; fileName: string }`
  - `function SlotInsumo<P>(props): JSX.Element` con props:
    - `titulo: string`, `descripcion: string`
    - `procesar: (file: File) => Promise<{ validation: ValidationResult; payload: P | null }>`
    - `onResultado: (r: SlotResultado<P>) => void`

- [ ] **Step 1: Escribir el test (falla)**

Create `src/ui/SlotInsumo.test.tsx`:
```tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { SlotInsumo } from './SlotInsumo'
import type { ValidationResult } from '../validation/validators'

function selectFile(input: HTMLElement, name: string) {
  const file = new File(['x'], name, { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
  fireEvent.change(input, { target: { files: [file] } })
  return file
}

describe('SlotInsumo', () => {
  it('muestra el título y, tras una validación OK, un estado de éxito y llama onResultado', async () => {
    const ok: ValidationResult = { ok: true, issues: [] }
    const onResultado = vi.fn()
    const { container } = render(
      <SlotInsumo
        titulo="Ejecución de ingresos"
        descripcion="Reporte CCPET"
        procesar={async () => ({ validation: ok, payload: [1, 2, 3] })}
        onResultado={onResultado}
      />,
    )
    expect(screen.getByText('Ejecución de ingresos')).toBeInTheDocument()
    const input = container.querySelector('input[type="file"]')!
    selectFile(input, 'ingresos.xlsx')
    await waitFor(() => expect(onResultado).toHaveBeenCalledTimes(1))
    expect(onResultado).toHaveBeenCalledWith(
      expect.objectContaining({ payload: [1, 2, 3], fileName: 'ingresos.xlsx' }),
    )
    expect(await screen.findByText(/válido/i)).toBeInTheDocument()
  })

  it('muestra los mensajes de error cuando la validación falla', async () => {
    const bad: ValidationResult = { ok: false, issues: [{ level: 'error', message: 'No parece el reporte de ingresos.' }] }
    const onResultado = vi.fn()
    const { container } = render(
      <SlotInsumo
        titulo="Ejecución de ingresos"
        descripcion="Reporte CCPET"
        procesar={async () => ({ validation: bad, payload: null })}
        onResultado={onResultado}
      />,
    )
    selectFile(container.querySelector('input[type="file"]')!, 'malo.xlsx')
    expect(await screen.findByText('No parece el reporte de ingresos.')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Correr (verificar que falla)**

Run: `npm test -- src/ui/SlotInsumo.test.tsx`
Expected: FAIL (`SlotInsumo` no existe).

- [ ] **Step 3: Implementar `SlotInsumo`**

Create `src/ui/SlotInsumo.tsx`:
```tsx
import { useState } from 'react'
import type { ValidationResult } from '../validation/validators'

export type SlotResultado<P> = { validation: ValidationResult; payload: P | null; fileName: string }

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
  return (
    <section className="space-y-2 rounded-lg border p-4">
      <div>
        <h3 className="font-semibold">{titulo}</h3>
        <p className="text-xs text-slate-500">{descripcion}</p>
      </div>
      <input
        type="file"
        accept=".xlsx"
        className="text-sm"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) onFile(file)
        }}
      />
      {cargando && <p className="text-sm text-slate-500">Procesando…</p>}
      {estado && !cargando && (
        <div className="text-sm">
          <p className="text-slate-600">{estado.fileName}</p>
          {ok ? (
            <p className="font-medium text-green-700">✓ Archivo válido</p>
          ) : (
            <ul className="list-inside list-disc text-red-600">
              {estado.validation.issues.map((i, k) => (
                <li key={k}>{i.message}</li>
              ))}
            </ul>
          )}
        </div>
      )}
    </section>
  )
}
```

- [ ] **Step 4: Correr (verificar que pasa)**

Run: `npm test -- src/ui/SlotInsumo.test.tsx`
Expected: PASS (2 casos).

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: slot de carga genérico con feedback de validación"
```

---

### Task 4: Ingesta unificada + dashboard automático

**Files:**
- Create: `src/ui/CargaInsumos.tsx`, `src/ui/Dashboard.tsx`
- Modify: `src/App.tsx`
- Delete: `src/ui/CargaArchivo.tsx`

**Interfaces:**
- Consumes: `SlotInsumo`, `SlotResultado` (Task 3); `validateIngresos`, `validateGastos`, `validateSgp` (Task 1); `readSgpSheetNames` (Task 2); `parseIngresoFile` (`../parsers/ingresos`), `parseGastoFile` (`../parsers/gastos`); `analisisIngresos`, `analisisGastos`; `TablaIngresos`, `TablaGastos`; `IngresoRawRow`, `GastoRawRow`.
- Produces:
  - `CargaInsumos` — 3 slots (ingresos, gastos, SGP) que reportan filas validadas hacia arriba.
  - `Dashboard` — pestañas para las áreas con datos válidos.
  - `App` — orquesta ingesta + dashboard automático.

- [ ] **Step 1: Implementar `CargaInsumos`**

Create `src/ui/CargaInsumos.tsx`:
```tsx
import type { IngresoRawRow, GastoRawRow } from '../types'
import { validateIngresos, validateGastos, validateSgp } from '../validation/validators'
import { parseIngresoFile } from '../parsers/ingresos'
import { parseGastoFile } from '../parsers/gastos'
import { readSgpSheetNames } from '../parsers/sgp'
import { SlotInsumo } from './SlotInsumo'

export function CargaInsumos({
  onIngresos,
  onGastos,
}: {
  onIngresos: (rows: IngresoRawRow[] | null) => void
  onGastos: (rows: GastoRawRow[] | null) => void
}) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
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
      <SlotInsumo<string[]>
        titulo="Recursos del SGP"
        descripcion="Reporte SICODIS (ResumenDistribucionSGP…)"
        procesar={async (file) => {
          const sheets = await readSgpSheetNames(file)
          return { validation: validateSgp(sheets), payload: sheets }
        }}
        onResultado={() => { /* el análisis de SGP se construye en un plan posterior */ }}
      />
    </div>
  )
}
```

- [ ] **Step 2: Implementar `Dashboard`**

Create `src/ui/Dashboard.tsx`:
```tsx
import { useState } from 'react'
import type { FilaIngreso, FilaGasto } from '../types'
import { TablaIngresos } from './TablaIngresos'
import { TablaGastos } from './TablaGastos'

type Area = { id: string; label: string; render: () => JSX.Element }

export function Dashboard({
  filasIngreso,
  filasGasto,
}: {
  filasIngreso: FilaIngreso[]
  filasGasto: FilaGasto[]
}) {
  const areas: Area[] = []
  if (filasIngreso.length > 0) {
    areas.push({
      id: 'ingresos',
      label: `Análisis de Ingresos (${filasIngreso.length})`,
      render: () => <TablaIngresos filas={filasIngreso} />,
    })
  }
  if (filasGasto.length > 0) {
    areas.push({
      id: 'gastos',
      label: `Análisis de Gastos (${filasGasto.length})`,
      render: () => <TablaGastos filas={filasGasto} />,
    })
  }

  const [activa, setActiva] = useState(0)
  if (areas.length === 0) {
    return <p className="text-sm text-slate-500">Carga y valida los insumos para generar el análisis.</p>
  }
  const idx = Math.min(activa, areas.length - 1)

  return (
    <div className="space-y-3">
      <nav className="flex gap-2 border-b">
        {areas.map((a, i) => (
          <button
            key={a.id}
            onClick={() => setActiva(i)}
            className={`px-4 py-2 text-sm font-medium ${i === idx ? 'border-b-2 border-slate-800 text-slate-900' : 'text-slate-500'}`}
          >
            {a.label}
          </button>
        ))}
      </nav>
      {areas[idx].render()}
    </div>
  )
}
```

- [ ] **Step 3: Reescribir `App.tsx` y borrar `CargaArchivo.tsx`**

Replace `src/App.tsx`:
```tsx
import { useMemo, useState } from 'react'
import type { IngresoRawRow, GastoRawRow } from './types'
import { analisisIngresos } from './engine/analisisIngresos'
import { analisisGastos } from './engine/analisisGastos'
import { CargaInsumos } from './ui/CargaInsumos'
import { Dashboard } from './ui/Dashboard'

export default function App() {
  const [ingresoRows, setIngresoRows] = useState<IngresoRawRow[]>([])
  const [gastoRows, setGastoRows] = useState<GastoRawRow[]>([])

  const filasIngreso = useMemo(() => analisisIngresos(ingresoRows), [ingresoRows])
  const filasGasto = useMemo(() => analisisGastos(gastoRows), [gastoRows])

  return (
    <main className="mx-auto max-w-7xl space-y-6 p-6">
      <header>
        <h1 className="text-2xl font-bold">Plataforma Alcaldías — Análisis Presupuestal</h1>
        <p className="text-sm text-slate-500">
          Carga los insumos; se validan y el análisis se genera automáticamente.
        </p>
      </header>

      <CargaInsumos
        onIngresos={(rows) => setIngresoRows(rows ?? [])}
        onGastos={(rows) => setGastoRows(rows ?? [])}
      />

      <Dashboard filasIngreso={filasIngreso} filasGasto={filasGasto} />
    </main>
  )
}
```

Then delete the now-unused component:
```bash
git rm src/ui/CargaArchivo.tsx
```

- [ ] **Step 4: Verificar suite y build**

Run: `npm test`
Expected: PASS — toda la suite (validators, sgp, SlotInsumo, parsers, motores, goldens ingresos+gastos, tablas). Confirmar que no quedan imports a `CargaArchivo`.

Run: `npm run build`
Expected: build exitoso, sin errores de TypeScript.

- [ ] **Step 5: Verificación manual (opcional)**

Run: `npm run dev`. En la pantalla única, cargar los 3 insumos de Briceño desde `~/Documents/DocumentosProyectoGobierno/`. Confirmar: los 3 slots muestran "✓ Archivo válido"; aparecen automáticamente las pestañas "Análisis de Ingresos (237)" y "Análisis de Gastos (628)". Probar un archivo equivocado (p. ej. subir el de gastos en el slot de ingresos) y confirmar el mensaje de error de validación.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: ingesta unificada de los 3 insumos con dashboard automático"
```

---

## Self-Review

**Cobertura de la dirección del usuario (Plan 3):**
- Cargar los 3 insumos juntos → Task 4 (`CargaInsumos`, 3 slots). ✓
- Validación de estructura + control de totales → Task 1 (validators) + Task 2 (estructura SGP); estructura "archivo equivocado" la cubre el parser existente vía el slot. ✓
- Auto-generación del análisis disponible (sin paso manual) → Task 4 (Dashboard se llena solo al validar). ✓
- SGP aceptado y validado estructuralmente (análisis posterior) → Tasks 1–2 + slot SGP. ✓
- Gráficos → fuera de alcance (van al final, tras las 7 áreas). ✓
- Fidelidad tolerancia 0 intacta: no se tocan motores ni golden tests; la suite completa debe seguir verde. ✓

**Escaneo de placeholders:** sin TBD/TODO; todo el código está completo.

**Consistencia de tipos:** `ValidationResult`/`ValidationIssue` definidos en Task 1 y consumidos por SlotInsumo (Task 3) y CargaInsumos (Task 4). `SlotResultado<P>` genérico; los payloads (`IngresoRawRow[]`, `GastoRawRow[]`, `string[]`) coinciden con lo que producen los parsers/lectores. `Dashboard` consume `FilaIngreso`/`FilaGasto` (motores existentes). Se elimina `CargaArchivo` y nada lo referencia tras el refactor de `App`.
