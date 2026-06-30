# Plan 2 — Análisis de Gastos Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reproducir la hoja "Análisis de Gastos" de la plantilla con valores idénticos (tolerancia 0), validados por un golden test contra los datos reales de Briceño (628 filas), reutilizando el método de fidelidad del Plan 1.

**Architecture:** Igual que Ingresos: el insumo `.xlsx` de gastos (o pegado) se parsea a filas normalizadas; un motor de función pura en TypeScript reproduce la hoja de análisis; el resultado se muestra en una tabla web. `Análisis de Gastos` es un **pass-through fila-a-fila** del insumo (reselección de columnas) más 3 columnas calculadas (`Extrae`, `Columna1`, `Concat`). No usa catálogos, ni SUMIFS, ni lookups. Los saldos vienen **copiados** del insumo (no se recalculan).

**Tech Stack:** React 18, TypeScript, Vite, SheetJS (`xlsx` 0.20.3), Tailwind CSS, Vitest. (Proyecto ya inicializado en el Plan 1.)

## Global Constraints

- **Fidelidad tolerancia 0:** cada valor (numérico y string) debe ser exactamente igual al de la plantilla (comparación estricta `toEqual`). `Análisis de Gastos` no tiene columnas manuales, así que se comparan TODOS los campos (no hay exclusiones tipo `observaciones`).
- **Saldos copiados, no recalculados:** las columnas de saldo (`saldoDisponible`, `saldoDisponibilidades`, `saldoRegistro`, `saldoOrdenesPago`) se copian tal cual del insumo. La plantilla las copia (pass-through) y recalcularlas NO reproduce el valor de origen — p. ej. el total `saldoOrdenesPago = 153153230.999998` es `ordenPago − (egresos + egresosPapeles)`, no `ordenPago − egresos`. Copiar garantiza igualdad exacta.
- **Strings byte-exact:** las 3 columnas calculadas (`extrae`, `columna1`, `concat`) NO se recortan (`.trim()`); reproducen el literal de la plantilla (incl. separadores estructurales como el espacio final en `"2 -  - "`). Los campos de texto de datos (rubro, descripción, clasificadores) se normalizan con `trim` de forma consistente en parser y extracción (no tienen espacios espurios, así que igualan al template).
- **Motor = función pura:** sin DOM/red/estado.
- **Aritmética IEEE-754 sin redondeos.** Identificadores English/camelCase; textos de UI en español. App 100% cliente.

## Alcance de este plan

Incluye: primitivas de parser compartidas (refactor menor de ingresos para DRY), parser de gastos (archivo + pegado), motor `analisisGastos`, golden test de fidelidad (628 filas), y la UI con pestañas para alternar entre Análisis de Ingresos y Análisis de Gastos.

Fuera de alcance (planes posteriores): Fuentes y Usos, Seguimiento SGP, Ley 617, PAC, Indicadores; export a Excel; persistencia Dexie.

## Estructura de archivos

```
src/
  parsers/
    sheet.ts             # NUEVO: primitivas compartidas (text, num, sheetToMatrix)
    sheet.test.ts        # NUEVO: tests de text/num
    ingresos.ts          # MODIFICAR: usar sheet.ts (re-exporta sheetToMatrix)
    gastos.ts            # NUEVO: parser de ejecución de gastos
    gastos.test.ts       # NUEVO
  engine/
    analisisGastos.ts        # NUEVO
    analisisGastos.test.ts   # NUEVO
    analisisGastos.golden.test.ts  # NUEVO
  types.ts               # MODIFICAR: añadir GastoRawRow, FilaGasto
  ui/
    CargaArchivo.tsx     # NUEVO: uploader genérico (reemplaza CargaInsumo)
    TablaGastos.tsx      # NUEVO
    App.tsx              # MODIFICAR: pestañas Ingresos/Gastos
scripts/
  extract-golden-gastos.mjs    # NUEVO
tests/
  fixtures/gastos.briceno.xlsx        # NUEVO (copia del insumo crudo de gastos)
  golden/gastos.expected.json         # NUEVO (generado)
```

### Referencia de dominio (Análisis de Gastos)

Mapeo insumo crudo de gastos → salida. El insumo `19_ejec_egr_combina_clasif (1).xlsx` tiene encabezado en la fila que contiene `Código rubro presupuestal` (ojo: "rubro" en minúscula, distinto del de ingresos) y 34 columnas; datos hasta la primera fila sin código de rubro (628 filas en Briceño).

| Campo salida (`FilaGasto`) | Origen (encabezado exacto del insumo) | Tipo |
|---|---|---|
| `rubro` | "Código rubro presupuestal" | texto |
| `descripcion` | "Descripción rubro presupuestal" | texto |
| `cpc` | "CCPET01 - CPC V2.1 AC" | texto (vacío en esta entidad) |
| `unidadEjec` | "CCPET02 - UNIDAD EJECUTORA" | texto |
| `programatico` | "CCPET03 - CLASIFICADOR PROGRAMÁTICO DE LA INVERSIÓN PÚBLICA" | texto |
| `fuentes` | "CCPET05 - FUENTES DE FINANCIACIÓN" | texto |
| `cpi` | "CCPET81 - PRODUCTO DE INVERSIÓN" | texto |
| `atributo` | "CCPET83 - ATRIBUTO EJECUCIÓN CON / SIN SITUACIÓN DE FONDOS" | texto |
| `pptoInicial` | "Presupuesto inicial" | número |
| `pptoFinal` | "Presupuesto final" | número |
| `disponibilidades` | "Disponibilidades" | número |
| `saldoDisponible` | "Saldo disponible: Presupuesto final - disponibilidades" | número (copiado) |
| `registros` | "Registros" | número |
| `saldoDisponibilidades` | "Saldo de disponibilidades: Disponibilidades - registros" | número (copiado) |
| `ordenPago` | "Ordenes de pago" | número |
| `saldoRegistro` | "Saldo registro: Registros - ordenes de pago" | número (copiado) |
| `egresos` | "Egresos" | número |
| `egresosPapeles` | "Egresos en papeles" | número |
| `saldoOrdenesPago` | "Saldo ordenes de pago: Ordenes de pago - egresos" | número (copiado) |

Columnas calculadas (en el motor):
- `extrae = rubro.slice(0, 3)`  (equivale a `MID(rubro,1,3)`: "2"→"2", "2.1.1"→"2.1", "2.3.x"→"2.3").
- `columna1 = extrae === '2.3' ? \`${extrae} - ${rubro}\` : ''`  (solo se llena en inversión).
- `concat = \`${rubro} - ${unidadEjec} - ${fuentes}\``  (sin trim; total → `"2 -  - "`).

Valores golden de control (fila total "2 GASTOS"): pptoInicial 30807760602; pptoFinal 40248500999.27; disponibilidades 29932416102.76; saldoDisponible 10316084896.51; registros 20174379502.57; saldoDisponibilidades 9758036600.19; ordenPago 10514056874.38; saldoRegistro 9660322628.19; egresos 6769591638.97; egresosPapeles 3591312004.41; saldoOrdenesPago 153153230.999998; extrae "2"; columna1 ""; concat "2 -  - ".

---

### Task 1: Primitivas de parser compartidas + refactor de ingresos

**Files:**
- Create: `src/parsers/sheet.ts`, `src/parsers/sheet.test.ts`
- Modify: `src/parsers/ingresos.ts`

**Interfaces:**
- Consumes: `xlsx`.
- Produces:
  - `const text: (v: unknown) => string`  (None→'', en otro caso `String(v).trim()`)
  - `const num: (v: unknown) => number`  (number→pasa; None/''→0; string→`Number(trim)`; NaN→0)
  - `function sheetToMatrix(ws: import('xlsx').WorkSheet): unknown[][]`
- `ingresos.ts` debe seguir exportando `sheetToMatrix` (re-export) para no romper imports existentes.

- [ ] **Step 1: Escribir test de las primitivas (falla)**

Create `src/parsers/sheet.test.ts`:
```ts
import { describe, it, expect } from 'vitest'
import { text, num } from './sheet'

describe('text', () => {
  it('None/undefined → cadena vacía', () => {
    expect(text(null)).toBe('')
    expect(text(undefined)).toBe('')
  })
  it('recorta espacios', () => {
    expect(text('  hola  ')).toBe('hola')
  })
  it('convierte números a string', () => {
    expect(text(5)).toBe('5')
  })
})

describe('num', () => {
  it('pasa números tal cual (sin redondeo)', () => {
    expect(num(40248500999.27)).toBe(40248500999.27)
  })
  it('None/cadena vacía → 0', () => {
    expect(num(null)).toBe(0)
    expect(num('')).toBe(0)
  })
  it('string numérico → número exacto', () => {
    expect(num('153153230.999998')).toBe(153153230.999998)
  })
  it('string no parseable → 0', () => {
    expect(num('N/A')).toBe(0)
  })
})
```

- [ ] **Step 2: Correr (verificar que falla)**

Run: `npm test -- src/parsers/sheet.test.ts`
Expected: FAIL (módulo `./sheet` no existe).

- [ ] **Step 3: Implementar `sheet.ts`**

Create `src/parsers/sheet.ts`:
```ts
import * as XLSX from 'xlsx'

export const text = (v: unknown): string => (v == null ? '' : String(v).trim())

export const num = (v: unknown): number => {
  if (typeof v === 'number') return v
  if (v == null || v === '') return 0
  const n = Number(String(v).trim())
  return Number.isNaN(n) ? 0 : n
}

export function sheetToMatrix(ws: XLSX.WorkSheet): unknown[][] {
  return XLSX.utils.sheet_to_json(ws, { header: 1, raw: true, defval: null }) as unknown[][]
}
```

- [ ] **Step 4: Refactorizar `ingresos.ts` para usar `sheet.ts`**

En `src/parsers/ingresos.ts`:
- Eliminar las definiciones locales de `text`, `num` y `sheetToMatrix`.
- Añadir al inicio: `import { text, num, sheetToMatrix } from './sheet'`
- Añadir un re-export para no romper imports existentes: `export { sheetToMatrix } from './sheet'`
- No cambiar nada más (`IngresoParseError`, `normalizeIngresoRows`, `parseIngresoPaste`, `parseIngresoFile` quedan igual, ahora usando las primitivas importadas).

- [ ] **Step 5: Correr la suite completa (verificar que pasa, sin regresiones)**

Run: `npm test`
Expected: PASS — todos los tests previos (incluido el golden de ingresos, 237 filas) siguen verdes + los nuevos de `sheet.test.ts`.

- [ ] **Step 6: Verificar el build**

Run: `npm run build`
Expected: build exitoso, sin errores de TypeScript.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "refactor: primitivas de parser compartidas (sheet.ts) y reuso en ingresos"
```

---

### Task 2: Parser de gastos

**Files:**
- Modify: `src/types.ts`
- Create: `src/parsers/gastos.ts`, `src/parsers/gastos.test.ts`

**Interfaces:**
- Consumes: `text`, `num`, `sheetToMatrix` de `./sheet` (Task 1); `xlsx`.
- Produces:
  - `type GastoRawRow` (en `types.ts`) con los 19 campos de la tabla de dominio (rubro, descripcion, cpc, unidadEjec, programatico, fuentes, cpi, atributo, pptoInicial, pptoFinal, disponibilidades, saldoDisponible, registros, saldoDisponibilidades, ordenPago, saldoRegistro, egresos, egresosPapeles, saldoOrdenesPago).
  - `class GastoParseError extends Error {}`
  - `function normalizeGastoRows(matrix: unknown[][]): GastoRawRow[]`
  - `function parseGastoPaste(text: string): GastoRawRow[]`
  - `function parseGastoFile(file: File): Promise<GastoRawRow[]>`

- [ ] **Step 1: Añadir `GastoRawRow` a `types.ts`**

Append to `src/types.ts`:
```ts
export type GastoRawRow = {
  rubro: string
  descripcion: string
  cpc: string
  unidadEjec: string
  programatico: string
  fuentes: string
  cpi: string
  atributo: string
  pptoInicial: number
  pptoFinal: number
  disponibilidades: number
  saldoDisponible: number
  registros: number
  saldoDisponibilidades: number
  ordenPago: number
  saldoRegistro: number
  egresos: number
  egresosPapeles: number
  saldoOrdenesPago: number
}
```

- [ ] **Step 2: Escribir el test del parser (falla)**

Create `src/parsers/gastos.test.ts`:
```ts
import { describe, it, expect } from 'vitest'
import { normalizeGastoRows, parseGastoPaste, GastoParseError } from './gastos'

const HEADER = [
  'Código rubro presupuestal', 'Descripción rubro presupuestal', 'CCPET01 - CPC V2.1 AC',
  'CCPET02 - UNIDAD EJECUTORA', 'CCPET03 - CLASIFICADOR PROGRAMÁTICO DE LA INVERSIÓN PÚBLICA',
  'CCPET04 - TERCEROS', 'CCPET05 - FUENTES DE FINANCIACIÓN', 'CCPET30 - DETALLE SECTORIAL',
  'CCPET50 - FONDO LOCAL DE SALUD', 'CCPET80 - LÍNEA ESTRATÉGICA', 'CCPET81 - PRODUCTO DE INVERSIÓN',
  'CCPET83 - ATRIBUTO EJECUCIÓN CON / SIN SITUACIÓN DE FONDOS', 'CCPET84 - ATRIBUTO DESTINACIÓN DE LA RENTA',
  'CCPET85 - INDICADOR DE INVERSIÓN', 'CCPET86 - AUXILIAR ECB Y RF', 'Presupuesto inicial',
  'Adiciones', 'Reducciones', 'Créditos presupuesto', 'Contracreditos presupuesto',
  'Créditos clasificadores', 'Contracreditos clasificadores', 'Aplazamientos', 'Desaplazamientos',
  'Presupuesto final', 'Disponibilidades', 'Saldo disponible: Presupuesto final - disponibilidades',
  'Registros', 'Saldo de disponibilidades: Disponibilidades - registros', 'Ordenes de pago',
  'Saldo registro: Registros - ordenes de pago', 'Egresos', 'Egresos en papeles',
  'Saldo ordenes de pago: Ordenes de pago - egresos',
]
// fila total "2 GASTOS" (34 columnas; clasificadores vacíos)
const TOTAL = ['2', 'GASTOS', null, null, null, null, null, null, null, null, null, null, null, null, null,
  30807760602, 1234, 1234, 1234, 1234, 1234, 1234, 1234, 1234, 40248500999.27,
  29932416102.76, 10316084896.51, 20174379502.57, 9758036600.19, 10514056874.38,
  9660322628.19, 6769591638.97, 3591312004.41, 153153230.999998]

describe('normalizeGastoRows', () => {
  it('encuentra el encabezado y mapea las columnas por nombre', () => {
    const matrix = [['MUNICIPIO'], [], [], HEADER, TOTAL]
    const rows = normalizeGastoRows(matrix)
    expect(rows).toHaveLength(1)
    expect(rows[0]).toEqual({
      rubro: '2', descripcion: 'GASTOS', cpc: '', unidadEjec: '', programatico: '',
      fuentes: '', cpi: '', atributo: '',
      pptoInicial: 30807760602, pptoFinal: 40248500999.27, disponibilidades: 29932416102.76,
      saldoDisponible: 10316084896.51, registros: 20174379502.57, saldoDisponibilidades: 9758036600.19,
      ordenPago: 10514056874.38, saldoRegistro: 9660322628.19, egresos: 6769591638.97,
      egresosPapeles: 3591312004.41, saldoOrdenesPago: 153153230.999998,
    })
  })

  it('corta en la primera fila sin código de rubro', () => {
    const matrix = [HEADER, TOTAL, [null], TOTAL]
    expect(normalizeGastoRows(matrix)).toHaveLength(1)
  })

  it('lanza GastoParseError si falta el encabezado', () => {
    expect(() => normalizeGastoRows([['x'], [1, 2]])).toThrow(GastoParseError)
  })

  it('lanza GastoParseError si falta una columna esperada', () => {
    const incompleto = HEADER.slice(0, 30)
    expect(() => normalizeGastoRows([incompleto, TOTAL])).toThrow(GastoParseError)
  })
})

describe('parseGastoPaste', () => {
  it('parsea TSV con encabezado', () => {
    const tsv = [HEADER.join('\t'), TOTAL.map((v) => (v == null ? '' : v)).join('\t')].join('\n')
    const rows = parseGastoPaste(tsv)
    expect(rows).toHaveLength(1)
    expect(rows[0].saldoOrdenesPago).toBe(153153230.999998)
  })
})
```

- [ ] **Step 3: Correr (verificar que falla)**

Run: `npm test -- src/parsers/gastos.test.ts`
Expected: FAIL (módulo `./gastos` no existe).

- [ ] **Step 4: Implementar `gastos.ts`**

Create `src/parsers/gastos.ts`:
```ts
import * as XLSX from 'xlsx'
import type { GastoRawRow } from '../types'
import { text, num, sheetToMatrix } from './sheet'

export class GastoParseError extends Error {}

const HEADER_RUBRO = 'Código rubro presupuestal'

const TEXT_COLS = {
  rubro: 'Código rubro presupuestal',
  descripcion: 'Descripción rubro presupuestal',
  cpc: 'CCPET01 - CPC V2.1 AC',
  unidadEjec: 'CCPET02 - UNIDAD EJECUTORA',
  programatico: 'CCPET03 - CLASIFICADOR PROGRAMÁTICO DE LA INVERSIÓN PÚBLICA',
  fuentes: 'CCPET05 - FUENTES DE FINANCIACIÓN',
  cpi: 'CCPET81 - PRODUCTO DE INVERSIÓN',
  atributo: 'CCPET83 - ATRIBUTO EJECUCIÓN CON / SIN SITUACIÓN DE FONDOS',
} as const

const NUM_COLS = {
  pptoInicial: 'Presupuesto inicial',
  pptoFinal: 'Presupuesto final',
  disponibilidades: 'Disponibilidades',
  saldoDisponible: 'Saldo disponible: Presupuesto final - disponibilidades',
  registros: 'Registros',
  saldoDisponibilidades: 'Saldo de disponibilidades: Disponibilidades - registros',
  ordenPago: 'Ordenes de pago',
  saldoRegistro: 'Saldo registro: Registros - ordenes de pago',
  egresos: 'Egresos',
  egresosPapeles: 'Egresos en papeles',
  saldoOrdenesPago: 'Saldo ordenes de pago: Ordenes de pago - egresos',
} as const

export function normalizeGastoRows(matrix: unknown[][]): GastoRawRow[] {
  const headerIdx = matrix.findIndex((r) => text(r?.[0]) === HEADER_RUBRO)
  if (headerIdx === -1) {
    throw new GastoParseError(
      `No se encontró la fila de encabezado (columna "${HEADER_RUBRO}"). ¿Es el reporte de ejecución de gastos correcto?`,
    )
  }
  const header = matrix[headerIdx].map((c) => text(c))
  const idxOf = (name: string): number => {
    const i = header.indexOf(name)
    if (i === -1) throw new GastoParseError(`Falta la columna esperada "${name}".`)
    return i
  }
  const textIdx = Object.fromEntries(
    Object.entries(TEXT_COLS).map(([k, name]) => [k, idxOf(name)]),
  ) as Record<keyof typeof TEXT_COLS, number>
  const numIdx = Object.fromEntries(
    Object.entries(NUM_COLS).map(([k, name]) => [k, idxOf(name)]),
  ) as Record<keyof typeof NUM_COLS, number>

  const rows: GastoRawRow[] = []
  for (let r = headerIdx + 1; r < matrix.length; r++) {
    const row = matrix[r] ?? []
    const rubro = text(row[textIdx.rubro])
    if (rubro === '') break
    rows.push({
      rubro,
      descripcion: text(row[textIdx.descripcion]),
      cpc: text(row[textIdx.cpc]),
      unidadEjec: text(row[textIdx.unidadEjec]),
      programatico: text(row[textIdx.programatico]),
      fuentes: text(row[textIdx.fuentes]),
      cpi: text(row[textIdx.cpi]),
      atributo: text(row[textIdx.atributo]),
      pptoInicial: num(row[numIdx.pptoInicial]),
      pptoFinal: num(row[numIdx.pptoFinal]),
      disponibilidades: num(row[numIdx.disponibilidades]),
      saldoDisponible: num(row[numIdx.saldoDisponible]),
      registros: num(row[numIdx.registros]),
      saldoDisponibilidades: num(row[numIdx.saldoDisponibilidades]),
      ordenPago: num(row[numIdx.ordenPago]),
      saldoRegistro: num(row[numIdx.saldoRegistro]),
      egresos: num(row[numIdx.egresos]),
      egresosPapeles: num(row[numIdx.egresosPapeles]),
      saldoOrdenesPago: num(row[numIdx.saldoOrdenesPago]),
    })
  }
  return rows
}

export function parseGastoPaste(textInput: string): GastoRawRow[] {
  const matrix = textInput.split(/\r?\n/).map((line) => line.split('\t'))
  return normalizeGastoRows(matrix)
}

export async function parseGastoFile(file: File): Promise<GastoRawRow[]> {
  const buf = await file.arrayBuffer()
  const wb = XLSX.read(buf, { type: 'array' })
  const ws = wb.Sheets[wb.SheetNames[0]]
  return normalizeGastoRows(sheetToMatrix(ws))
}
```

- [ ] **Step 5: Correr (verificar que pasa)**

Run: `npm test -- src/parsers/gastos.test.ts`
Expected: PASS (5 casos).

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: parser de ejecución de gastos (archivo y pegado)"
```

---

### Task 3: Motor `analisisGastos`

**Files:**
- Modify: `src/types.ts`
- Create: `src/engine/analisisGastos.ts`, `src/engine/analisisGastos.test.ts`

**Interfaces:**
- Consumes: `GastoRawRow` (Task 2), `FilaGasto` (este task, en `types.ts`).
- Produces: `function analisisGastos(rows: GastoRawRow[]): FilaGasto[]`

- [ ] **Step 1: Añadir `FilaGasto` a `types.ts`**

Append to `src/types.ts`:
```ts
export type FilaGasto = {
  extrae: string
  columna1: string
  concat: string
  rubro: string
  descripcion: string
  cpc: string
  unidadEjec: string
  programatico: string
  fuentes: string
  cpi: string
  atributo: string
  pptoInicial: number
  pptoFinal: number
  disponibilidades: number
  saldoDisponible: number
  registros: number
  saldoDisponibilidades: number
  ordenPago: number
  saldoRegistro: number
  egresos: number
  egresosPapeles: number
  saldoOrdenesPago: number
}
```

- [ ] **Step 2: Escribir el test del motor (falla)**

Create `src/engine/analisisGastos.test.ts`:
```ts
import { describe, it, expect } from 'vitest'
import { analisisGastos } from './analisisGastos'
import type { GastoRawRow } from '../types'

const base: GastoRawRow = {
  rubro: '2', descripcion: 'GASTOS', cpc: '', unidadEjec: '', programatico: '',
  fuentes: '', cpi: '', atributo: '',
  pptoInicial: 30807760602, pptoFinal: 40248500999.27, disponibilidades: 29932416102.76,
  saldoDisponible: 10316084896.51, registros: 20174379502.57, saldoDisponibilidades: 9758036600.19,
  ordenPago: 10514056874.38, saldoRegistro: 9660322628.19, egresos: 6769591638.97,
  egresosPapeles: 3591312004.41, saldoOrdenesPago: 153153230.999998,
}

describe('analisisGastos', () => {
  it('reproduce la fila total con valores idénticos y columnas calculadas', () => {
    const [f] = analisisGastos([base])
    expect(f.extrae).toBe('2')
    expect(f.columna1).toBe('')
    expect(f.concat).toBe('2 -  - ')
    expect(f.pptoFinal).toBe(40248500999.27)
    expect(f.saldoOrdenesPago).toBe(153153230.999998)
  })

  it('extrae = primeros 3 caracteres del rubro', () => {
    expect(analisisGastos([{ ...base, rubro: '2.1.1' }])[0].extrae).toBe('2.1')
    expect(analisisGastos([{ ...base, rubro: '2.3.8.05.01' }])[0].extrae).toBe('2.3')
  })

  it('columna1 solo se llena cuando extrae === "2.3" (inversión)', () => {
    const inv = analisisGastos([{
      ...base, rubro: '2.3.1.01.01.001.01',
      unidadEjec: '16.0 - ENTIDADES TERRITORIALES - ADMINISTRACION CENTRAL',
      fuentes: '1.2.1.0.00 - INGRESOS CORRIENTES DE LIBRE DESTINACION',
    }])[0]
    expect(inv.columna1).toBe('2.3 - 2.3.1.01.01.001.01')
    expect(inv.concat).toBe('2.3.1.01.01.001.01 - 16.0 - ENTIDADES TERRITORIALES - ADMINISTRACION CENTRAL - 1.2.1.0.00 - INGRESOS CORRIENTES DE LIBRE DESTINACION')
    expect(analisisGastos([{ ...base, rubro: '2.1.1' }])[0].columna1).toBe('')
  })

  it('los saldos se COPIAN del insumo, no se recalculan', () => {
    // ordenPago - egresos = 70, pero el saldo de origen es 60 (= ordenPago - egresos - egresosPapeles)
    const [f] = analisisGastos([{
      ...base, ordenPago: 100, egresos: 30, egresosPapeles: 10, saldoOrdenesPago: 60,
    }])
    expect(f.saldoOrdenesPago).toBe(60)
  })
})
```

- [ ] **Step 3: Correr (verificar que falla)**

Run: `npm test -- src/engine/analisisGastos.test.ts`
Expected: FAIL (`analisisGastos` no existe).

- [ ] **Step 4: Implementar el motor**

Create `src/engine/analisisGastos.ts`:
```ts
import type { FilaGasto, GastoRawRow } from '../types'

export function analisisGastos(rows: GastoRawRow[]): FilaGasto[] {
  return rows.map((r) => {
    const extrae = r.rubro.slice(0, 3)
    const columna1 = extrae === '2.3' ? `${extrae} - ${r.rubro}` : ''
    return {
      extrae,
      columna1,
      concat: `${r.rubro} - ${r.unidadEjec} - ${r.fuentes}`,
      rubro: r.rubro,
      descripcion: r.descripcion,
      cpc: r.cpc,
      unidadEjec: r.unidadEjec,
      programatico: r.programatico,
      fuentes: r.fuentes,
      cpi: r.cpi,
      atributo: r.atributo,
      pptoInicial: r.pptoInicial,
      pptoFinal: r.pptoFinal,
      disponibilidades: r.disponibilidades,
      saldoDisponible: r.saldoDisponible,
      registros: r.registros,
      saldoDisponibilidades: r.saldoDisponibilidades,
      ordenPago: r.ordenPago,
      saldoRegistro: r.saldoRegistro,
      egresos: r.egresos,
      egresosPapeles: r.egresosPapeles,
      saldoOrdenesPago: r.saldoOrdenesPago,
    }
  })
}
```

- [ ] **Step 5: Correr (verificar que pasa)**

Run: `npm test -- src/engine/analisisGastos.test.ts`
Expected: PASS (4 casos).

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: motor analisisGastos (pass-through + columnas calculadas)"
```

---

### Task 4: Golden test de fidelidad de gastos (Briceño)

**Files:**
- Create: `scripts/extract-golden-gastos.mjs`, `tests/fixtures/gastos.briceno.xlsx` (copia), `tests/golden/gastos.expected.json` (generado)
- Test: `src/engine/analisisGastos.golden.test.ts`

**Interfaces:**
- Consumes: `normalizeGastoRows` (Task 2), `sheetToMatrix` (Task 1), `analisisGastos` (Task 3).
- Produces: prueba extremo a extremo `insumo crudo gastos Briceño → parser → motor === valores de la plantilla`, tolerancia 0, 628 filas, TODOS los campos.

- [ ] **Step 1: Copiar el insumo crudo de gastos como fixture**

Run:
```bash
cp "/Users/alejandro/Documents/DocumentosProyectoGobierno/19_ejec_egr_combina_clasif (1).xlsx" tests/fixtures/gastos.briceno.xlsx
```

- [ ] **Step 2: Escribir el script de extracción**

Create `scripts/extract-golden-gastos.mjs`:
```js
import { createRequire } from 'node:module'
import { writeFileSync } from 'node:fs'
const require = createRequire(import.meta.url)
const XLSX = require('xlsx')

const TEMPLATE = process.env.TEMPLATE ??
  '/Users/alejandro/Documents/DocumentosProyectoGobierno/1. Análisis Ejecución de Ingresos y Gastos Fuentes y Usos V2025 Corte 31-05-2026 Briceño.xlsx'

const text = (v) => (v == null ? '' : String(v).trim())
const raw = (v) => (v == null ? '' : String(v)) // sin trim: columnas calculadas byte-exact
const num = (v) => (typeof v === 'number' ? v : v == null || v === '' ? 0 : Number(v))

const wb = XLSX.readFile(TEMPLATE)
const ws = wb.Sheets['Análisis de Gastos']
if (!ws) {
  console.error('No se encontró la hoja "Análisis de Gastos"')
  process.exit(1)
}
const m = XLSX.utils.sheet_to_json(ws, { header: 1, raw: true, defval: null })

// índices base 0: A0 extrae, B1 columna1, C2 concat, D3 rubro, E4 descripcion,
// F5 cpc, G6 unidadEjec, H7 programatico, I8 fuentes, J9 cpi, K10 atributo,
// L11 pptoInicial, M12 pptoFinal, N13 disponibilidades, O14 saldoDisponible,
// P15 registros, Q16 saldoDisponibilidades, R17 ordenPago, S18 saldoRegistro,
// T19 egresos, U20 egresosPapeles, V21 saldoOrdenesPago
const out = []
for (let r = 1; r < m.length; r++) {
  const row = m[r] ?? []
  const rubro = text(row[3])
  if (rubro === '') break
  out.push({
    extrae: raw(row[0]), columna1: raw(row[1]), concat: raw(row[2]),
    rubro, descripcion: text(row[4]), cpc: text(row[5]), unidadEjec: text(row[6]),
    programatico: text(row[7]), fuentes: text(row[8]), cpi: text(row[9]), atributo: text(row[10]),
    pptoInicial: num(row[11]), pptoFinal: num(row[12]), disponibilidades: num(row[13]),
    saldoDisponible: num(row[14]), registros: num(row[15]), saldoDisponibilidades: num(row[16]),
    ordenPago: num(row[17]), saldoRegistro: num(row[18]), egresos: num(row[19]),
    egresosPapeles: num(row[20]), saldoOrdenesPago: num(row[21]),
  })
}
writeFileSync('tests/golden/gastos.expected.json', JSON.stringify(out, null, 2))
console.log('wrote', out.length, 'filas a tests/golden/gastos.expected.json')
```

- [ ] **Step 3: Generar el JSON esperado**

Run: `node scripts/extract-golden-gastos.mjs`
Expected: imprime `wrote 628 filas a tests/golden/gastos.expected.json` y crea el archivo. Verificar que la primera fila tiene `rubro: "2"`, `concat: "2 -  - "`, `saldoOrdenesPago: 153153230.999998`.

- [ ] **Step 4: Escribir el golden test**

Create `src/engine/analisisGastos.golden.test.ts`:
```ts
import { describe, it, expect } from 'vitest'
import * as XLSX from 'xlsx'
import { readFileSync } from 'node:fs'
import { normalizeGastoRows } from '../parsers/gastos'
import { sheetToMatrix } from '../parsers/sheet'
import { analisisGastos } from './analisisGastos'

describe('fidelidad Análisis de Gastos (Briceño) — tolerancia 0', () => {
  it('la salida del motor coincide exactamente con la plantilla', () => {
    const wb = XLSX.read(readFileSync('tests/fixtures/gastos.briceno.xlsx'))
    const rows = normalizeGastoRows(sheetToMatrix(wb.Sheets[wb.SheetNames[0]]))
    const got = analisisGastos(rows)

    const want = JSON.parse(
      readFileSync('tests/golden/gastos.expected.json', 'utf8'),
    ) as unknown[]

    expect(got).toHaveLength(want.length)
    expect(got).toEqual(want)
  })
})
```

- [ ] **Step 5: Correr el golden test (verificar que pasa)**

Run: `npm test -- src/engine/analisisGastos.golden.test.ts`
Expected: PASS. 628 filas coinciden exactamente en TODOS los campos.

Si falla: comparar `got[i]` vs `want[i]` de la primera fila divergente. NO ajustar la tolerancia ni excluir campos: el criterio es igualdad exacta. Causas probables a revisar: mapeo de columnas del insumo, semántica de copia de saldos, o trim de columnas calculadas.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "test: golden de fidelidad de Análisis de Gastos (Briceño, tolerancia 0)"
```

---

### Task 5: UI — uploader genérico + pestañas Ingresos/Gastos

**Files:**
- Create: `src/ui/CargaArchivo.tsx`, `src/ui/TablaGastos.tsx`, `src/ui/TablaGastos.test.tsx`
- Modify: `src/App.tsx`
- Delete: `src/ui/CargaInsumo.tsx` (reemplazado por `CargaArchivo`)

**Interfaces:**
- Consumes: `parseIngresoFile`, `parseIngresoPaste` (`../parsers/ingresos`); `parseGastoFile`, `parseGastoPaste` (`../parsers/gastos`); `analisisIngresos`, `analisisGastos`; `FilaGasto`, `IngresoRawRow`, `GastoRawRow`.
- Produces: `CargaArchivo` genérico parametrizado por funciones de parseo; `TablaGastos`; `App` con pestañas.

- [ ] **Step 1: Escribir el test de TablaGastos (falla)**

Create `src/ui/TablaGastos.test.tsx`:
```tsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { TablaGastos } from './TablaGastos'
import type { FilaGasto } from '../types'

const fila: FilaGasto = {
  extrae: '2', columna1: '', concat: '2 -  - ', rubro: '2', descripcion: 'GASTOS',
  cpc: '', unidadEjec: '', programatico: '', fuentes: '', cpi: '', atributo: '',
  pptoInicial: 30807760602, pptoFinal: 40248500999.27, disponibilidades: 29932416102.76,
  saldoDisponible: 10316084896.51, registros: 20174379502.57, saldoDisponibilidades: 9758036600.19,
  ordenPago: 10514056874.38, saldoRegistro: 9660322628.19, egresos: 6769591638.97,
  egresosPapeles: 3591312004.41, saldoOrdenesPago: 153153230.999998,
}

describe('TablaGastos', () => {
  it('muestra el rubro y el nombre de cada fila', () => {
    render(<TablaGastos filas={[fila]} />)
    expect(screen.getByText('GASTOS')).toBeInTheDocument()
    expect(screen.getByText('2')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Correr (verificar que falla)**

Run: `npm test -- src/ui/TablaGastos.test.tsx`
Expected: FAIL (`TablaGastos` no existe).

- [ ] **Step 3: Implementar `TablaGastos`**

Create `src/ui/TablaGastos.tsx`:
```tsx
import type { FilaGasto } from '../types'

const fmtNum = (n: number) => n.toLocaleString('es-CO', { maximumFractionDigits: 2 })

const COLUMNAS: { key: keyof FilaGasto; label: string; num?: boolean }[] = [
  { key: 'rubro', label: 'Rubro' },
  { key: 'descripcion', label: 'Descripción' },
  { key: 'unidadEjec', label: 'Unidad Ejec.' },
  { key: 'fuentes', label: 'Fuentes' },
  { key: 'cpi', label: 'CPI' },
  { key: 'atributo', label: 'Atributo' },
  { key: 'pptoInicial', label: 'Ppto Inicial', num: true },
  { key: 'pptoFinal', label: 'Ppto Final', num: true },
  { key: 'disponibilidades', label: 'Disponibilidades', num: true },
  { key: 'saldoDisponible', label: 'Saldo Disponible', num: true },
  { key: 'registros', label: 'Registros', num: true },
  { key: 'saldoDisponibilidades', label: 'Saldo Disp.', num: true },
  { key: 'ordenPago', label: 'Orden de Pago', num: true },
  { key: 'saldoRegistro', label: 'Saldo Registro', num: true },
  { key: 'egresos', label: 'Egresos', num: true },
  { key: 'egresosPapeles', label: 'Egresos Papeles', num: true },
  { key: 'saldoOrdenesPago', label: 'Saldo Órd. Pago', num: true },
]

export function TablaGastos({ filas }: { filas: FilaGasto[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full border-collapse text-sm">
        <thead className="bg-slate-100">
          <tr>
            {COLUMNAS.map((c) => (
              <th key={c.key} className="border px-2 py-1 text-left font-semibold">{c.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {filas.map((f, i) => (
            <tr key={`${f.rubro}-${i}`} className="odd:bg-white even:bg-slate-50">
              {COLUMNAS.map((c) => (
                <td key={c.key} className={`border px-2 py-1 ${c.num ? 'text-right' : ''} ${c.key === 'rubro' ? 'whitespace-nowrap' : ''}`}>
                  {c.num ? fmtNum(f[c.key] as number) : (f[c.key] as string)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
```

- [ ] **Step 4: Correr (verificar que pasa)**

Run: `npm test -- src/ui/TablaGastos.test.tsx`
Expected: PASS.

- [ ] **Step 5: Implementar el uploader genérico `CargaArchivo`**

Create `src/ui/CargaArchivo.tsx`:
```tsx
import { useState } from 'react'

export function CargaArchivo<T>({
  titulo,
  parseFile,
  parsePaste,
  onRows,
}: {
  titulo: string
  parseFile: (file: File) => Promise<T[]>
  parsePaste: (text: string) => T[]
  onRows: (rows: T[]) => void
}) {
  const [error, setError] = useState<string | null>(null)
  const [pegado, setPegado] = useState('')

  const handle = async (fn: () => Promise<T[]> | T[]) => {
    setError(null)
    try {
      onRows(await fn())
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo leer el insumo.')
    }
  }

  return (
    <section className="space-y-3 rounded border p-4">
      <div>
        <label className="block text-sm font-medium">{titulo} (.xlsx)</label>
        <input
          type="file"
          accept=".xlsx"
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) handle(() => parseFile(file))
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
          onClick={() => handle(() => parsePaste(pegado))}
        >
          Procesar pegado
        </button>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </section>
  )
}
```

- [ ] **Step 6: Reescribir `App.tsx` con pestañas y borrar `CargaInsumo.tsx`**

Replace `src/App.tsx`:
```tsx
import { useMemo, useState } from 'react'
import type { IngresoRawRow, GastoRawRow } from './types'
import { analisisIngresos } from './engine/analisisIngresos'
import { analisisGastos } from './engine/analisisGastos'
import { parseIngresoFile, parseIngresoPaste } from './parsers/ingresos'
import { parseGastoFile, parseGastoPaste } from './parsers/gastos'
import { CargaArchivo } from './ui/CargaArchivo'
import { TablaIngresos } from './ui/TablaIngresos'
import { TablaGastos } from './ui/TablaGastos'

type Tab = 'ingresos' | 'gastos'

export default function App() {
  const [tab, setTab] = useState<Tab>('ingresos')
  const [ingresoRows, setIngresoRows] = useState<IngresoRawRow[]>([])
  const [gastoRows, setGastoRows] = useState<GastoRawRow[]>([])
  const filasIngreso = useMemo(() => analisisIngresos(ingresoRows), [ingresoRows])
  const filasGasto = useMemo(() => analisisGastos(gastoRows), [gastoRows])

  return (
    <main className="mx-auto max-w-7xl space-y-6 p-6">
      <h1 className="text-2xl font-bold">Plataforma Alcaldías — Análisis Presupuestal</h1>

      <nav className="flex gap-2 border-b">
        {(['ingresos', 'gastos'] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium ${tab === t ? 'border-b-2 border-slate-800 text-slate-900' : 'text-slate-500'}`}
          >
            {t === 'ingresos' ? 'Análisis de Ingresos' : 'Análisis de Gastos'}
          </button>
        ))}
      </nav>

      {tab === 'ingresos' && (
        <div className="space-y-4">
          <CargaArchivo
            titulo="Subir ejecución de ingresos"
            parseFile={parseIngresoFile}
            parsePaste={parseIngresoPaste}
            onRows={setIngresoRows}
          />
          {filasIngreso.length > 0 && (
            <section className="space-y-2">
              <h2 className="text-lg font-semibold">Análisis de Ingresos ({filasIngreso.length} rubros)</h2>
              <TablaIngresos filas={filasIngreso} />
            </section>
          )}
        </div>
      )}

      {tab === 'gastos' && (
        <div className="space-y-4">
          <CargaArchivo
            titulo="Subir ejecución de gastos"
            parseFile={parseGastoFile}
            parsePaste={parseGastoPaste}
            onRows={setGastoRows}
          />
          {filasGasto.length > 0 && (
            <section className="space-y-2">
              <h2 className="text-lg font-semibold">Análisis de Gastos ({filasGasto.length} rubros)</h2>
              <TablaGastos filas={filasGasto} />
            </section>
          )}
        </div>
      )}
    </main>
  )
}
```

Then delete the now-unused component:
```bash
git rm src/ui/CargaInsumo.tsx
```

- [ ] **Step 7: Verificar suite y build**

Run: `npm test`
Expected: PASS (todos: sheet, parsers, motores, goldens de ingresos y gastos, tablas).

Run: `npm run build`
Expected: build exitoso sin errores de TypeScript (confirmar que no quedan imports a `CargaInsumo`).

- [ ] **Step 8: Verificación manual (opcional)**

Run: `npm run dev`, abrir el navegador, pestaña "Análisis de Gastos", subir `tests/fixtures/gastos.briceno.xlsx`; confirmar 628 rubros con la fila total "2 / GASTOS".

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "feat: UI con pestañas Ingresos/Gastos y uploader genérico"
```

---

## Self-Review

**Cobertura del spec (Plan 2):**
- Pass-through fila-a-fila de gastos (reselección de columnas) → Task 2 (parser por nombre de columna) + Task 3 (motor). ✓
- 3 columnas calculadas (Extrae, Columna1, Concat) byte-exact → Task 3 + test. ✓
- Saldos copiados (no recalculados) → Task 3, con test específico que lo demuestra. ✓
- Fidelidad tolerancia 0, todos los campos, 628 filas → Task 4 golden. ✓
- Ingesta archivo + pegado → Task 2. ✓
- UI tablas limpias (pestañas Ingresos/Gastos) → Task 5. ✓
- DRY (recomendación de la revisión final del Plan 1): primitivas compartidas en `sheet.ts`, uploader genérico `CargaArchivo` → Tasks 1 y 5. ✓
- Diferido: Fuentes y Usos, SGP, Ley 617, PAC, Indicadores; export Excel; persistencia. ✓

**Escaneo de placeholders:** sin TBD/TODO; todo el código está completo en cada step.

**Consistencia de tipos:** `GastoRawRow` (Task 2) y `FilaGasto` (Task 3) en `types.ts`; los nombres de campo coinciden entre parser, motor, golden (script de extracción) y tabla. `extrae`/`columna1`/`concat` sin trim en motor y extracción (byte-exact). `sheetToMatrix` se centraliza en `sheet.ts` y se re-exporta desde `ingresos.ts` para no romper imports del Plan 1.
