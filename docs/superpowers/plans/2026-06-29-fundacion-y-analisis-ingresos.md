# Plan 1 — Fundación + Análisis de Ingresos Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Montar el proyecto React y reproducir la hoja "Análisis de Ingresos" de la plantilla con valores idénticos (tolerancia 0), validados por un golden test contra los datos reales de Briceño.

**Architecture:** App 100% cliente (React+TS+Vite). Los insumos `.xlsx` (o pegado manual) se parsean a filas normalizadas; un motor de funciones puras en TypeScript reproduce el análisis; el resultado se muestra en una tabla web. La fidelidad se garantiza con golden tests (Vitest) que comparan la salida del motor contra los valores calculados extraídos de la plantilla.

**Tech Stack:** React 18, TypeScript, Vite, SheetJS (`xlsx`), Tailwind CSS, Vitest.

## Global Constraints

- **Fidelidad tolerancia 0:** cada valor calculado debe ser exactamente igual al de la plantilla (comparación estricta `===` sobre el valor numérico/string, no sobre texto formateado). El campo `observaciones` es entrada manual del analista (no calculado) y se EXCLUYE de la comparación de fidelidad.
- **Motor = funciones puras:** los módulos en `src/engine/` no tocan DOM, red ni estado; reciben datos y devuelven datos.
- **Sin backend:** todo corre en el navegador. Nada de servidores en este plan.
- **Aritmética:** usar IEEE-754 estándar de JS sin redondeos. Excel guarda los flotantes completos; reproducir el mismo orden de operaciones da resultados idénticos.
- **Idioma:** identificadores de código en inglés/camelCase; textos de UI y nombres de dominio en español.
- **Node:** v20.x (disponible en el entorno).

## Alcance de este plan

Incluye: scaffold del proyecto, parser de ingresos (archivo y pegado), motor `analisisIngresos`, golden test de fidelidad, y UI mínima para cargar insumos y ver la tabla de Análisis de Ingresos.

Se difiere a planes posteriores (explícitamente fuera de alcance aquí): export a Excel, persistencia Dexie/IndexedDB, y las otras 6 áreas (Gastos, Fuentes y Usos, SGP, Ley 617, PAC, Indicadores).

## Estructura de archivos

```
package.json, vite.config.ts, tsconfig.json, tailwind.config.js, postcss.config.js, index.html
src/
  main.tsx                      # bootstrap React
  App.tsx                       # pantalla principal (carga insumo + tabla)
  index.css                     # directivas Tailwind
  types.ts                      # IngresoRawRow, FilaIngreso
  parsers/
    ingresos.ts                 # sheetToMatrix, normalizeIngresoRows, parseIngresoPaste, parseIngresoFile
    ingresos.test.ts            # tests del parser (sintéticos)
  engine/
    analisisIngresos.ts         # analisisIngresos(rows) -> FilaIngreso[]
    analisisIngresos.test.ts    # tests del motor (sintéticos)
    analisisIngresos.golden.test.ts  # golden de fidelidad (Briceño)
  ui/
    TablaIngresos.tsx           # render de FilaIngreso[]
    CargaInsumo.tsx             # subir .xlsx o pegar
scripts/
  extract-golden-ingresos.mjs   # extrae valores esperados de la plantilla
tests/
  fixtures/ingresos.briceno.xlsx       # copia del insumo crudo de ingresos (Briceño)
  golden/ingresos.expected.json        # valores esperados extraídos de la plantilla
```

### Referencia de dominio (Análisis de Ingresos)

`Análisis de Ingresos` es una copia fila‑a‑fila del insumo crudo de ingresos. Mapeo insumo crudo → salida (índices de columna del insumo, base 1; encabezado en la fila que contiene `Código Rubro presupuestal`):

| Campo salida (`FilaIngreso`) | Origen |
|---|---|
| `rubro` | "Código Rubro presupuestal" |
| `nombre` | "Descripción Rubro Presupuestal" |
| `unidadEjec` | "CCPET02 - UNIDAD EJECUTORA" |
| `fuentes` | "CCPET05 - FUENTES DE FINANCIACIÓN" |
| `atributo` | "CCPET83 - ATRIBUTO EJECUCIÓN CON / SIN SITUACIÓN DE FONDOS" |
| `pptoInicial` | "Prespuesto Inicial" (sic, así viene en la fuente) |
| `adiciones` | "Adiciones Anteriores" + "Adiciones Periodo" |
| `reducciones` | "Reduciones Anteriores" (sic) + "Reducciones Periodo" |
| `pptoFinal` | "Presupuesto Final" |
| `ingreso` | "Total de ingresos" |
| `columna3` | `` `${rubro} - ${unidadEjec} - ${fuentes}` `` |
| `pctIngreso` | `pptoFinal === 0 ? 0 : ingreso / pptoFinal` |
| `proyeccion` | `(ingreso / 10) * 11` |
| `observaciones` | manual → `''` (no se compara) |

Valores golden de control (fila total "1 INGRESOS"): pptoInicial 30807760602; adiciones 9612520949.27; reducciones 171780552; pptoFinal 40248500999.27; ingreso 17574447442; pctIngreso 0.4366484963581316; proyeccion 19331892186.2; columna3 `"1 -  - "`.

---

### Task 1: Scaffold del proyecto

**Files:**
- Create: `package.json`, `vite.config.ts`, `tsconfig.json`, `tsconfig.node.json`, `tailwind.config.js`, `postcss.config.js`, `index.html`, `src/main.tsx`, `src/App.tsx`, `src/index.css`
- Test: `src/smoke.test.ts`

**Interfaces:**
- Consumes: nada.
- Produces: proyecto Vite+React+TS arrancable; `npm test` (Vitest) y `npm run build` funcionando.

- [ ] **Step 1: Crear el proyecto Vite (React + TS)**

Run:
```bash
cd /Users/alejandro/Essionix/PlataformaAlcaldias
npm create vite@latest . -- --template react-ts
```
Si pregunta por archivos existentes (ya hay `docs/`, `.git`, `.gitignore`), elegir "Ignore files and continue".

- [ ] **Step 2: Instalar dependencias (runtime, dev y herramientas)**

Run:
```bash
npm install
npm install xlsx
npm install -D vitest @testing-library/react @testing-library/jest-dom jsdom tailwindcss@^3 postcss autoprefixer
npx tailwindcss init -p
```

- [ ] **Step 3: Configurar Vitest en `vite.config.ts`**

```ts
/// <reference types="vitest" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/setupTests.ts'],
  },
})
```

Create `src/setupTests.ts`:
```ts
import '@testing-library/jest-dom'
```

- [ ] **Step 4: Configurar Tailwind**

Edit `tailwind.config.js`:
```js
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: { extend: {} },
  plugins: [],
}
```

Replace `src/index.css` with:
```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

- [ ] **Step 5: Reemplazar `src/App.tsx` por una pantalla mínima**

```tsx
export default function App() {
  return (
    <main className="mx-auto max-w-6xl p-6">
      <h1 className="text-2xl font-bold">Plataforma Alcaldías — Análisis Presupuestal</h1>
    </main>
  )
}
```

- [ ] **Step 6: Añadir el script `test` en `package.json`**

En `"scripts"` añadir: `"test": "vitest run"`.

- [ ] **Step 7: Escribir un smoke test**

Create `src/smoke.test.ts`:
```ts
import { describe, it, expect } from 'vitest'

describe('smoke', () => {
  it('suma básica', () => {
    expect(1 + 1).toBe(2)
  })
})
```

- [ ] **Step 8: Correr test y build**

Run: `npm test`
Expected: PASS (1 test, `smoke`).

Run: `npm run build`
Expected: build exitoso, sin errores de TypeScript.

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "chore: scaffold Vite+React+TS con Tailwind y Vitest"
```

---

### Task 2: Parser de ingresos

**Files:**
- Create: `src/types.ts`, `src/parsers/ingresos.ts`
- Test: `src/parsers/ingresos.test.ts`

**Interfaces:**
- Consumes: `xlsx` (SheetJS).
- Produces:
  - `type IngresoRawRow = { codigoRubro: string; descripcion: string; ccpet02: string; ccpet05: string; ccpet83: string; pptoInicial: number; adicAnteriores: number; adicPeriodo: number; reducAnteriores: number; reducPeriodo: number; pptoFinal: number; totalIngresos: number }`
  - `class IngresoParseError extends Error {}`
  - `function sheetToMatrix(ws: import('xlsx').WorkSheet): unknown[][]`
  - `function normalizeIngresoRows(matrix: unknown[][]): IngresoRawRow[]`
  - `function parseIngresoPaste(text: string): IngresoRawRow[]`
  - `function parseIngresoFile(file: File): Promise<IngresoRawRow[]>`

- [ ] **Step 1: Definir tipos compartidos**

Create `src/types.ts`:
```ts
export type IngresoRawRow = {
  codigoRubro: string
  descripcion: string
  ccpet02: string
  ccpet05: string
  ccpet83: string
  pptoInicial: number
  adicAnteriores: number
  adicPeriodo: number
  reducAnteriores: number
  reducPeriodo: number
  pptoFinal: number
  totalIngresos: number
}

export type FilaIngreso = {
  columna3: string
  rubro: string
  nombre: string
  unidadEjec: string
  fuentes: string
  atributo: string
  pptoInicial: number
  adiciones: number
  reducciones: number
  pptoFinal: number
  ingreso: number
  pctIngreso: number
  proyeccion: number
  observaciones: string
}
```

- [ ] **Step 2: Escribir el test del parser (falla)**

Create `src/parsers/ingresos.test.ts`:
```ts
import { describe, it, expect } from 'vitest'
import { normalizeIngresoRows, parseIngresoPaste, IngresoParseError } from './ingresos'

const HEADER = [
  'Código Rubro presupuestal', 'Descripción Rubro Presupuestal',
  'CCPET01 - CPC V2.1 AC', 'CCPET02 - UNIDAD EJECUTORA', 'CCPET04 - TERCEROS',
  'CCPET05 - FUENTES DE FINANCIACIÓN', 'CCPET07 - AUXILIAR INTERESES DE MORA',
  'CCPET08 - AUXILIAR RENDIMIENTOS FINANCIEROS', 'CCPET30 - DETALLE SECTORIAL',
  'CCPET50 - FONDO LOCAL DE SALUD', 'CCPET82 - ATRIBUTO VIGENCIA IMPUESTOS',
  'CCPET83 - ATRIBUTO EJECUCIÓN CON / SIN SITUACIÓN DE FONDOS',
  'CCPET84 - ATRIBUTO DESTINACIÓN DE LA RENTA', 'CCPET86 - AUXILIAR ECB Y RF',
  'Prespuesto Inicial', 'Adiciones Anteriores', 'Adiciones Periodo',
  'Reduciones Anteriores', 'Reducciones Periodo', 'Presupuesto Final',
  'Ingresos Anteriores', 'Ingresos Periodo', 'Ingresos en Papeles Anteriores',
  'Ingresos en Papeles Periodo', 'Total de ingresos', 'Saldo por Recaudar', 'Saldo por exceso',
]
// fila total "1 INGRESOS" (clasificadores vacíos)
const TOTAL = ['1', 'INGRESOS', null, null, null, null, null, null, null, null, null, null, null, null,
  30807760602, 0, 9612520949.27, 0, 171780552, 40248500999.27, 1885385010.27, 12094348423.23, 0, 3594714008.5, 17574447442, 22674053557.27, 0]
// fila detalle con clasificadores
const DETALLE = ['1.1.01.01.014.01', 'SOBRETASA AMBIENTAL - URBANO', null,
  '16.0 - ENTIDADES TERRITORIALES - ADMINISTRACION CENTRAL', null,
  '1.2.3.1.01 - SOBRETASA - PARTICIPACION AMBIENTAL', null, null, null, null, null,
  'C - Con Situación de Fondos', null, null,
  15820739, 0, 0, 0, 0, 15820739, 0, 15372850, 0, 0, 15372850, 447889, 0]

describe('normalizeIngresoRows', () => {
  it('encuentra el encabezado tras filas de título y normaliza por nombre de columna', () => {
    const matrix = [['MUNICIPIO DE BRICEÑO'], [], [], HEADER, TOTAL, DETALLE]
    const rows = normalizeIngresoRows(matrix)
    expect(rows).toHaveLength(2)
    expect(rows[0]).toEqual({
      codigoRubro: '1', descripcion: 'INGRESOS', ccpet02: '', ccpet05: '', ccpet83: '',
      pptoInicial: 30807760602, adicAnteriores: 0, adicPeriodo: 9612520949.27,
      reducAnteriores: 0, reducPeriodo: 171780552, pptoFinal: 40248500999.27,
      totalIngresos: 17574447442,
    })
    expect(rows[1].ccpet02).toBe('16.0 - ENTIDADES TERRITORIALES - ADMINISTRACION CENTRAL')
    expect(rows[1].ccpet83).toBe('C - Con Situación de Fondos')
  })

  it('corta los datos en la primera fila sin código de rubro', () => {
    const matrix = [HEADER, TOTAL, [null], DETALLE]
    expect(normalizeIngresoRows(matrix)).toHaveLength(1)
  })

  it('lanza IngresoParseError si falta el encabezado', () => {
    expect(() => normalizeIngresoRows([['otra cosa'], [1, 2, 3]])).toThrow(IngresoParseError)
  })
})

describe('parseIngresoPaste', () => {
  it('parsea TSV con encabezado', () => {
    const tsv = [HEADER.join('\t'), TOTAL.map(v => (v == null ? '' : v)).join('\t')].join('\n')
    const rows = parseIngresoPaste(tsv)
    expect(rows).toHaveLength(1)
    expect(rows[0].totalIngresos).toBe(17574447442)
  })
})
```

- [ ] **Step 3: Correr el test (verificar que falla)**

Run: `npm test -- src/parsers/ingresos.test.ts`
Expected: FAIL (módulo `./ingresos` no exporta esas funciones).

- [ ] **Step 4: Implementar el parser**

Create `src/parsers/ingresos.ts`:
```ts
import * as XLSX from 'xlsx'
import type { IngresoRawRow } from '../types'

export class IngresoParseError extends Error {}

const HEADER_RUBRO = 'Código Rubro presupuestal'

const COLS = {
  codigoRubro: 'Código Rubro presupuestal',
  descripcion: 'Descripción Rubro Presupuestal',
  ccpet02: 'CCPET02 - UNIDAD EJECUTORA',
  ccpet05: 'CCPET05 - FUENTES DE FINANCIACIÓN',
  ccpet83: 'CCPET83 - ATRIBUTO EJECUCIÓN CON / SIN SITUACIÓN DE FONDOS',
  pptoInicial: 'Prespuesto Inicial',
  adicAnteriores: 'Adiciones Anteriores',
  adicPeriodo: 'Adiciones Periodo',
  reducAnteriores: 'Reduciones Anteriores',
  reducPeriodo: 'Reducciones Periodo',
  pptoFinal: 'Presupuesto Final',
  totalIngresos: 'Total de ingresos',
} as const

const text = (v: unknown): string => (v == null ? '' : String(v).trim())
const num = (v: unknown): number => {
  if (typeof v === 'number') return v
  if (v == null || v === '') return 0
  const n = Number(String(v).trim())
  return Number.isNaN(n) ? 0 : n
}

export function sheetToMatrix(ws: XLSX.WorkSheet): unknown[][] {
  return XLSX.utils.sheet_to_json(ws, { header: 1, raw: true, defval: null }) as unknown[][]
}

export function normalizeIngresoRows(matrix: unknown[][]): IngresoRawRow[] {
  const headerIdx = matrix.findIndex((r) => text(r?.[0]) === HEADER_RUBRO)
  if (headerIdx === -1) {
    throw new IngresoParseError(
      `No se encontró la fila de encabezado (columna "${HEADER_RUBRO}"). ¿Es el reporte de ejecución de ingresos correcto?`,
    )
  }
  const header = matrix[headerIdx].map((c) => text(c))
  const idxOf = (name: string): number => {
    const i = header.indexOf(name)
    if (i === -1) throw new IngresoParseError(`Falta la columna esperada "${name}".`)
    return i
  }
  const idx = Object.fromEntries(
    Object.entries(COLS).map(([k, name]) => [k, idxOf(name)]),
  ) as Record<keyof typeof COLS, number>

  const rows: IngresoRawRow[] = []
  for (let r = headerIdx + 1; r < matrix.length; r++) {
    const row = matrix[r] ?? []
    const codigoRubro = text(row[idx.codigoRubro])
    if (codigoRubro === '') break
    rows.push({
      codigoRubro,
      descripcion: text(row[idx.descripcion]),
      ccpet02: text(row[idx.ccpet02]),
      ccpet05: text(row[idx.ccpet05]),
      ccpet83: text(row[idx.ccpet83]),
      pptoInicial: num(row[idx.pptoInicial]),
      adicAnteriores: num(row[idx.adicAnteriores]),
      adicPeriodo: num(row[idx.adicPeriodo]),
      reducAnteriores: num(row[idx.reducAnteriores]),
      reducPeriodo: num(row[idx.reducPeriodo]),
      pptoFinal: num(row[idx.pptoFinal]),
      totalIngresos: num(row[idx.totalIngresos]),
    })
  }
  return rows
}

export function parseIngresoPaste(textInput: string): IngresoRawRow[] {
  const matrix = textInput
    .split(/\r?\n/)
    .map((line) => line.split('\t'))
  return normalizeIngresoRows(matrix)
}

export async function parseIngresoFile(file: File): Promise<IngresoRawRow[]> {
  const buf = await file.arrayBuffer()
  const wb = XLSX.read(buf, { type: 'array' })
  const ws = wb.Sheets[wb.SheetNames[0]]
  return normalizeIngresoRows(sheetToMatrix(ws))
}
```

- [ ] **Step 5: Correr el test (verificar que pasa)**

Run: `npm test -- src/parsers/ingresos.test.ts`
Expected: PASS (todos los casos de `normalizeIngresoRows` y `parseIngresoPaste`).

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: parser de ejecución de ingresos (archivo y pegado)"
```

---

### Task 3: Motor `analisisIngresos`

**Files:**
- Create: `src/engine/analisisIngresos.ts`
- Test: `src/engine/analisisIngresos.test.ts`

**Interfaces:**
- Consumes: `IngresoRawRow` (Task 2), `FilaIngreso` (Task 2 `types.ts`).
- Produces: `function analisisIngresos(rows: IngresoRawRow[]): FilaIngreso[]`

- [ ] **Step 1: Escribir el test del motor (falla)**

Create `src/engine/analisisIngresos.test.ts`:
```ts
import { describe, it, expect } from 'vitest'
import { analisisIngresos } from './analisisIngresos'
import type { IngresoRawRow } from '../types'

const base: IngresoRawRow = {
  codigoRubro: '1', descripcion: 'INGRESOS', ccpet02: '', ccpet05: '', ccpet83: '',
  pptoInicial: 30807760602, adicAnteriores: 0, adicPeriodo: 9612520949.27,
  reducAnteriores: 0, reducPeriodo: 171780552, pptoFinal: 40248500999.27,
  totalIngresos: 17574447442,
}

describe('analisisIngresos', () => {
  it('reproduce la fila total con valores idénticos a la plantilla', () => {
    const [f] = analisisIngresos([base])
    expect(f.pptoInicial).toBe(30807760602)
    expect(f.adiciones).toBe(9612520949.27)
    expect(f.reducciones).toBe(171780552)
    expect(f.pptoFinal).toBe(40248500999.27)
    expect(f.ingreso).toBe(17574447442)
    expect(f.pctIngreso).toBe(0.4366484963581316)
    expect(f.proyeccion).toBe(19331892186.2)
    expect(f.columna3).toBe('1 -  - ')
    expect(f.observaciones).toBe('')
  })

  it('columna3 = rubro - unidadEjec - fuentes', () => {
    const [f] = analisisIngresos([{
      ...base, codigoRubro: '1.1.01.01.014.01',
      ccpet02: '16.0 - ENTIDADES TERRITORIALES - ADMINISTRACION CENTRAL',
      ccpet05: '1.2.3.1.01 - SOBRETASA',
    }])
    expect(f.columna3).toBe('1.1.01.01.014.01 - 16.0 - ENTIDADES TERRITORIALES - ADMINISTRACION CENTRAL - 1.2.3.1.01 - SOBRETASA')
  })

  it('pctIngreso es 0 cuando el presupuesto final es 0 (división por cero)', () => {
    const [f] = analisisIngresos([{ ...base, pptoFinal: 0, totalIngresos: 30594839 }])
    expect(f.pctIngreso).toBe(0)
    expect(f.proyeccion).toBe(33654322.9)
  })
})
```

- [ ] **Step 2: Correr el test (verificar que falla)**

Run: `npm test -- src/engine/analisisIngresos.test.ts`
Expected: FAIL (`analisisIngresos` no existe).

- [ ] **Step 3: Implementar el motor**

Create `src/engine/analisisIngresos.ts`:
```ts
import type { FilaIngreso, IngresoRawRow } from '../types'

export function analisisIngresos(rows: IngresoRawRow[]): FilaIngreso[] {
  return rows.map((r) => {
    const adiciones = r.adicAnteriores + r.adicPeriodo
    const reducciones = r.reducAnteriores + r.reducPeriodo
    const ingreso = r.totalIngresos
    const pptoFinal = r.pptoFinal
    return {
      columna3: `${r.codigoRubro} - ${r.ccpet02} - ${r.ccpet05}`,
      rubro: r.codigoRubro,
      nombre: r.descripcion,
      unidadEjec: r.ccpet02,
      fuentes: r.ccpet05,
      atributo: r.ccpet83,
      pptoInicial: r.pptoInicial,
      adiciones,
      reducciones,
      pptoFinal,
      ingreso,
      pctIngreso: pptoFinal === 0 ? 0 : ingreso / pptoFinal,
      proyeccion: (ingreso / 10) * 11,
      observaciones: '',
    }
  })
}
```

- [ ] **Step 4: Correr el test (verificar que pasa)**

Run: `npm test -- src/engine/analisisIngresos.test.ts`
Expected: PASS (3 casos).

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: motor analisisIngresos (transformación fila a fila)"
```

---

### Task 4: Golden test de fidelidad (Briceño)

**Files:**
- Create: `scripts/extract-golden-ingresos.mjs`, `tests/fixtures/ingresos.briceno.xlsx` (copia), `tests/golden/ingresos.expected.json` (generado)
- Test: `src/engine/analisisIngresos.golden.test.ts`

**Interfaces:**
- Consumes: `normalizeIngresoRows`, `sheetToMatrix` (Task 2), `analisisIngresos` (Task 3).
- Produces: prueba de extremo a extremo `insumo crudo Briceño → parser → motor === valores de la plantilla`, tolerancia 0.

- [ ] **Step 1: Copiar el insumo crudo de ingresos como fixture**

Run:
```bash
mkdir -p tests/fixtures tests/golden
cp "/Users/alejandro/Documents/DocumentosProyectoGobierno/19_ejec_ing_combina_clasif.xlsx" tests/fixtures/ingresos.briceno.xlsx
```
(Es data de ejecución presupuestal pública del municipio; se versiona como fixture de prueba.)

- [ ] **Step 2: Escribir el script de extracción de valores esperados**

Create `scripts/extract-golden-ingresos.mjs`:
```js
import * as XLSX from 'xlsx'
import { writeFileSync } from 'node:fs'

const TEMPLATE = process.env.TEMPLATE ??
  '/Users/alejandro/Documents/DocumentosProyectoGobierno/1. Análisis Ejecución de Ingresos y Gastos Fuentes y Usos V2025 Corte 31-05-2026 Briceño.xlsx'

const text = (v) => (v == null ? '' : String(v).trim())
const num = (v) => (typeof v === 'number' ? v : v == null || v === '' ? 0 : Number(v))

const wb = XLSX.readFile(TEMPLATE)
const ws = wb.Sheets['Análisis de Ingresos']
const m = XLSX.utils.sheet_to_json(ws, { header: 1, raw: true, defval: null })

// columnas (base 0): C=2 columna3, D=3 rubro, E=4 nombre, F=5 unidadEjec,
// G=6 fuentes, H=7 atributo, I=8 pptoInicial, J=9 adiciones, K=10 reducciones,
// L=11 pptoFinal, M=12 ingreso, N=13 pctIngreso, O=14 proyeccion, P=15 observaciones
const out = []
for (let r = 1; r < m.length; r++) {
  const row = m[r] ?? []
  const rubro = text(row[3])
  if (rubro === '') break
  out.push({
    columna3: text(row[2]), rubro, nombre: text(row[4]),
    unidadEjec: text(row[5]), fuentes: text(row[6]), atributo: text(row[7]),
    pptoInicial: num(row[8]), adiciones: num(row[9]), reducciones: num(row[10]),
    pptoFinal: num(row[11]), ingreso: num(row[12]), pctIngreso: num(row[13]),
    proyeccion: num(row[14]), observaciones: text(row[15]),
  })
}
writeFileSync('tests/golden/ingresos.expected.json', JSON.stringify(out, null, 2))
console.log('wrote', out.length, 'filas a tests/golden/ingresos.expected.json')
```

- [ ] **Step 3: Generar el JSON de valores esperados**

Run: `node scripts/extract-golden-ingresos.mjs`
Expected: imprime `wrote 237 filas a tests/golden/ingresos.expected.json` y crea el archivo.

- [ ] **Step 4: Escribir el golden test**

Create `src/engine/analisisIngresos.golden.test.ts`:
```ts
import { describe, it, expect } from 'vitest'
import * as XLSX from 'xlsx'
import { readFileSync } from 'node:fs'
import { normalizeIngresoRows, sheetToMatrix } from '../parsers/ingresos'
import { analisisIngresos } from './analisisIngresos'

type FilaSinObs = Record<string, unknown>
const sinObs = (f: { observaciones?: unknown }): FilaSinObs => {
  const { observaciones: _omit, ...rest } = f
  return rest
}

describe('fidelidad Análisis de Ingresos (Briceño) — tolerancia 0', () => {
  it('la salida del motor coincide exactamente con la plantilla', () => {
    const wb = XLSX.readFile('tests/fixtures/ingresos.briceno.xlsx')
    const rows = normalizeIngresoRows(sheetToMatrix(wb.Sheets[wb.SheetNames[0]]))
    const got = analisisIngresos(rows).map(sinObs)

    const expected = JSON.parse(
      readFileSync('tests/golden/ingresos.expected.json', 'utf8'),
    ) as Array<{ observaciones?: unknown }>
    const want = expected.map(sinObs)

    expect(got).toHaveLength(want.length)
    expect(got).toEqual(want)
  })
})
```

- [ ] **Step 5: Correr el golden test (verificar que pasa)**

Run: `npm test -- src/engine/analisisIngresos.golden.test.ts`
Expected: PASS. 237 filas coinciden exactamente (campo `observaciones` excluido).

Si falla: comparar `got[i]` vs `want[i]` de la primera fila divergente; revisar mapeo de columnas/combinación de adiciones-reducciones. NO ajustar la tolerancia: el criterio es igualdad exacta.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "test: golden de fidelidad de Análisis de Ingresos (Briceño, tolerancia 0)"
```

---

### Task 5: UI mínima — cargar insumo y ver la tabla

**Files:**
- Create: `src/ui/CargaInsumo.tsx`, `src/ui/TablaIngresos.tsx`
- Modify: `src/App.tsx`
- Test: `src/ui/TablaIngresos.test.tsx`

**Interfaces:**
- Consumes: `parseIngresoFile`, `parseIngresoPaste`, `IngresoParseError` (Task 2); `analisisIngresos` (Task 3); `FilaIngreso` (Task 2).
- Produces: pantalla que permite subir `.xlsx` o pegar datos, y muestra la tabla de Análisis de Ingresos.

- [ ] **Step 1: Escribir el test de la tabla (falla)**

Create `src/ui/TablaIngresos.test.tsx`:
```tsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { TablaIngresos } from './TablaIngresos'
import type { FilaIngreso } from '../types'

const fila: FilaIngreso = {
  columna3: '1 -  - ', rubro: '1', nombre: 'INGRESOS', unidadEjec: '', fuentes: '', atributo: '',
  pptoInicial: 30807760602, adiciones: 9612520949.27, reducciones: 171780552,
  pptoFinal: 40248500999.27, ingreso: 17574447442, pctIngreso: 0.4366484963581316,
  proyeccion: 19331892186.2, observaciones: '',
}

describe('TablaIngresos', () => {
  it('muestra el rubro y el nombre de cada fila', () => {
    render(<TablaIngresos filas={[fila]} />)
    expect(screen.getByText('INGRESOS')).toBeInTheDocument()
    expect(screen.getByText('1')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Correr el test (verificar que falla)**

Run: `npm test -- src/ui/TablaIngresos.test.tsx`
Expected: FAIL (`TablaIngresos` no existe).

- [ ] **Step 3: Implementar `TablaIngresos`**

Create `src/ui/TablaIngresos.tsx`:
```tsx
import type { FilaIngreso } from '../types'

const fmtNum = (n: number) =>
  n.toLocaleString('es-CO', { maximumFractionDigits: 2 })
const fmtPct = (n: number) =>
  (n * 100).toLocaleString('es-CO', { maximumFractionDigits: 2 }) + ' %'

export function TablaIngresos({ filas }: { filas: FilaIngreso[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full border-collapse text-sm">
        <thead className="bg-slate-100">
          <tr>
            {['Rubro', 'Nombre', 'Unidad Ejec.', 'Fuentes', 'Atributo',
              'Ppto Inicial', 'Adiciones', 'Reducciones', 'Ppto Final',
              'Ingreso', '% Ingreso', 'Proyección'].map((h) => (
              <th key={h} className="border px-2 py-1 text-left font-semibold">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {filas.map((f, i) => (
            <tr key={`${f.rubro}-${i}`} className="odd:bg-white even:bg-slate-50">
              <td className="border px-2 py-1 whitespace-nowrap">{f.rubro}</td>
              <td className="border px-2 py-1">{f.nombre}</td>
              <td className="border px-2 py-1">{f.unidadEjec}</td>
              <td className="border px-2 py-1">{f.fuentes}</td>
              <td className="border px-2 py-1">{f.atributo}</td>
              <td className="border px-2 py-1 text-right">{fmtNum(f.pptoInicial)}</td>
              <td className="border px-2 py-1 text-right">{fmtNum(f.adiciones)}</td>
              <td className="border px-2 py-1 text-right">{fmtNum(f.reducciones)}</td>
              <td className="border px-2 py-1 text-right">{fmtNum(f.pptoFinal)}</td>
              <td className="border px-2 py-1 text-right">{fmtNum(f.ingreso)}</td>
              <td className="border px-2 py-1 text-right">{fmtPct(f.pctIngreso)}</td>
              <td className="border px-2 py-1 text-right">{fmtNum(f.proyeccion)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
```

- [ ] **Step 4: Correr el test (verificar que pasa)**

Run: `npm test -- src/ui/TablaIngresos.test.tsx`
Expected: PASS.

- [ ] **Step 5: Implementar `CargaInsumo` (subir archivo o pegar)**

Create `src/ui/CargaInsumo.tsx`:
```tsx
import { useState } from 'react'
import type { IngresoRawRow } from '../types'
import { parseIngresoFile, parseIngresoPaste, IngresoParseError } from '../parsers/ingresos'

export function CargaInsumo({ onRows }: { onRows: (rows: IngresoRawRow[]) => void }) {
  const [error, setError] = useState<string | null>(null)
  const [pegado, setPegado] = useState('')

  const handle = async (fn: () => Promise<IngresoRawRow[]> | IngresoRawRow[]) => {
    setError(null)
    try {
      onRows(await fn())
    } catch (e) {
      setError(e instanceof IngresoParseError ? e.message : 'No se pudo leer el insumo.')
    }
  }

  return (
    <section className="space-y-3 rounded border p-4">
      <div>
        <label className="block text-sm font-medium">Subir ejecución de ingresos (.xlsx)</label>
        <input
          type="file"
          accept=".xlsx"
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) handle(() => parseIngresoFile(file))
          }}
        />
      </div>
      <div>
        <label className="block text-sm font-medium">o pegar datos (incluyendo la fila de encabezado)</label>
        <textarea
          className="h-28 w-full rounded border p-2 font-mono text-xs"
          value={pegado}
          onChange={(e) => setPegado(e.target.value)}
        />
        <button
          className="mt-1 rounded bg-slate-800 px-3 py-1 text-sm text-white"
          onClick={() => handle(() => parseIngresoPaste(pegado))}
        >
          Procesar pegado
        </button>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </section>
  )
}
```

- [ ] **Step 6: Conectar todo en `App.tsx`**

Replace `src/App.tsx`:
```tsx
import { useMemo, useState } from 'react'
import type { IngresoRawRow } from './types'
import { analisisIngresos } from './engine/analisisIngresos'
import { CargaInsumo } from './ui/CargaInsumo'
import { TablaIngresos } from './ui/TablaIngresos'

export default function App() {
  const [rows, setRows] = useState<IngresoRawRow[]>([])
  const filas = useMemo(() => analisisIngresos(rows), [rows])

  return (
    <main className="mx-auto max-w-7xl space-y-6 p-6">
      <h1 className="text-2xl font-bold">Plataforma Alcaldías — Análisis Presupuestal</h1>
      <CargaInsumo onRows={setRows} />
      {filas.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-lg font-semibold">Análisis de Ingresos ({filas.length} rubros)</h2>
          <TablaIngresos filas={filas} />
        </section>
      )}
    </main>
  )
}
```

- [ ] **Step 7: Verificar tests y build**

Run: `npm test`
Expected: PASS (todos: smoke, parser, motor, golden, tabla).

Run: `npm run build`
Expected: build exitoso sin errores de TypeScript.

- [ ] **Step 8: Verificación manual (opcional pero recomendada)**

Run: `npm run dev`, abrir el navegador, subir `tests/fixtures/ingresos.briceno.xlsx` y confirmar que la tabla muestra 237 rubros con la fila total "1 / INGRESOS" y `% Ingreso ≈ 43.66 %`.

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "feat: UI mínima para cargar insumo y ver Análisis de Ingresos"
```

---

## Self-Review

**Cobertura del spec (Plan 1):**
- Ingesta archivo + pegado → Task 2 (`parseIngresoFile`, `parseIngresoPaste`). ✓
- Motor de dominio puro → Task 3. ✓
- Clasificadores como datos → N/A para esta hoja (el subagente confirmó que Análisis de Ingresos no usa catálogos; los textos vienen resueltos en el insumo). Se abordará en áreas que sí los usan. ✓ (documentado)
- Fidelidad tolerancia 0 con golden test → Task 4. ✓
- Tablas web limpias → Task 5. ✓
- Diferido a planes posteriores: export a Excel, persistencia Dexie, otras 6 áreas. ✓ (declarado en Alcance)

**Escaneo de placeholders:** sin TBD/TODO; todo el código está completo en cada step.

**Consistencia de tipos:** `IngresoRawRow` y `FilaIngreso` se definen en `src/types.ts` (Task 2) y se usan idénticos en Tasks 3–5. Nombres de funciones (`normalizeIngresoRows`, `sheetToMatrix`, `parseIngresoFile`, `parseIngresoPaste`, `analisisIngresos`) coinciden entre definición y consumo. Mapeo de columnas del golden (script de extracción) alineado con el mapeo del parser y del motor.
