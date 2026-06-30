# Plan 4 — Fuentes y Usos Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reproducir la hoja "Fuentes y Usos" de la plantilla con valores idénticos (tolerancia 0), validados por un golden test contra los datos reales de Briceño (234 fuentes), reutilizando el método de fidelidad de los planes previos.

**Architecture:** Primera área que AGREGA por fuente de financiación (estilo SUMIF), no pass-through. Por cada fuente del catálogo CCPET05 (lista estática de 234 entradas extraída de la plantilla como dato de referencia), el motor suma columnas de los insumos ya parseados — Ejecución de Ingresos (`IngresoRawRow[]`) y Ejecución de Gastos (`GastoRawRow[]`) — filtrando por la cadena completa de la fuente, y calcula columnas derivadas (diferencias, %, saldos, superávit/déficit, ECB). No requiere `Análisis de Ingresos`; las columnas que la plantilla toma de `Análisis de Gastos` son pass-through de gastos y se obtienen igual de `GastoRawRow[]`.

**Tech Stack:** React 18, TypeScript, Vite, SheetJS (`xlsx` 0.20.3), Tailwind CSS, Vitest. (Proyecto inicializado; Planes 1–3 completos: Ingresos, Gastos, ingesta unificada + dashboard.)

## Global Constraints

- **Fidelidad tolerancia 0:** cada valor debe ser exactamente igual al de la plantilla (comparación estricta `toEqual`). Se excluye de la comparación solo `observaciones` (columna manual, col23).
- **Clave de match:** la cadena COMPLETA `Descripción Fuente` (formato `"<código CCPET05> - <NOMBRE>"`), comparada por igualdad exacta tras `trim` contra la columna `CCPET05 - FUENTES DE FINANCIACIÓN` de cada insumo. NO usar el código (col3) ni fragmentos.
- **Orden de acumulación:** sumar recorriendo las filas en el ORDEN del archivo fuente (las filas parseadas ya preservan el orden), para reproducir el residuo de punto flotante de Excel. No reordenar.
- **Catálogo de fuentes como dato:** las 234 cadenas (col4) se extraen una vez a `src/data/fuentes.json` (en orden, incluyendo la primera "NO APLICA") y se versionan. No se derivan de los insumos (se perderían fuentes con cero movimiento y cambiaría el orden).
- **Motor = función pura.** Aritmética IEEE-754 sin redondeos. Identificadores English/camelCase, UI en español. App 100% cliente.
- **No tocar** motores/parsers/golden de los Planes 1–3; la suite completa debe seguir verde.

## Alcance de este plan

Incluye: extracción del catálogo de fuentes a JSON, motor `fuentesYUsos`, golden test (234 filas), tabla web y su integración en el dashboard (pestaña que aparece cuando Ingresos Y Gastos están válidos).

Fuera de alcance (planes posteriores): Seguimiento SGP, Ley 617, PAC, Indicadores; gráficos; export a Excel; persistencia.

### Reglas de cálculo (verificadas contra Briceño, tolerancia 0)

Por cada fila-fuente `f` (clave = `f.descripcionFuente`, comparada contra `IngresoRawRow.ccpet05` y `GastoRawRow.fuentes`):

| Columna salida | Regla |
|---|---|
| `piIngresos` (col5) | Σ `IngresoRawRow.pptoInicial` donde `ccpet05 == f` |
| `pfIngresos` (col6) | Σ `IngresoRawRow.pptoFinal` donde `ccpet05 == f` |
| `piGastos` (col7) | Σ `GastoRawRow.pptoInicial` donde `fuentes == f` |
| `pfGastos` (col8) | Σ `GastoRawRow.pptoFinal` donde `fuentes == f` |
| `recaudo` (col11) | Σ `IngresoRawRow.totalIngresos` donde `ccpet05 == f` |
| `disponibilidades` (col13) | Σ `GastoRawRow.disponibilidades` donde `fuentes == f` |
| `compromisos` (col14) | Σ `GastoRawRow.registros` donde `fuentes == f` |
| `obligaciones` (col16) | Σ `GastoRawRow.ordenPago` donde `fuentes == f` |
| `pagos` (col17) | Σ `GastoRawRow.egresos` + Σ `GastoRawRow.egresosPapeles` (ambos donde `fuentes == f`) |
| `difPptoInicial` (col9) | `piIngresos − piGastos` |
| `difPptoFinal` (col10) | `pfIngresos − pfGastos` |
| `pctRecaudo` (col12) | `pfIngresos !== 0 ? recaudo / pfIngresos : 0` |
| `pctCompromisos` (col15) | `pfGastos !== 0 ? compromisos / pfGastos : 0` |
| `saldoPresupuesto` (col18) | `pfIngresos − disponibilidades` |
| `dispSinCompromiso` (col19) | `disponibilidades − compromisos` |
| `reservas` (col20) | `compromisos − obligaciones` |
| `cuentasPorPagar` (col21) | `obligaciones − pagos` |
| `superavitDeficit` (col22) | `recaudo − compromisos` |
| `ecb` (col24) | `superavitDeficit − reservas − cuentasPorPagar` |
| `observaciones` (col23) | manual → `''` (no se compara) |

Notas:
- La plantilla toma `compromisos`/`obligaciones`/`egresos` de la hoja `Análisis de Gastos`; como esa hoja es pass-through de gastos, los mismos valores están en `GastoRawRow` (`registros`/`ordenPago`/`egresos`). Usar `GastoRawRow` da resultado idéntico y evita una dependencia extra.
- La plantilla limita `pfGastos` (col8) a las primeras 800 filas de Ejecución de Gastos; nuestro insumo parseado tiene 628 filas de datos reales (< 800), así que sumar todas equivale al tope (verificado por el subagente: 0 fuentes difieren). El golden lo confirma.
- Fila "NO APLICA" (primera del catálogo): ninguna fila de insumo tiene esa fuente, así que todas las sumas dan 0 y las derivadas 0 — coincide con la plantilla (sus celdas SUMIF vacías se extraen como 0).

Valores golden de control (fuente `"1.2.1.0.00 - INGRESOS CORRIENTES DE LIBRE DESTINACION"`): pfIngresos 7564774800; recaudo 5838830994.18; pctRecaudo 0.7718446548…; disponibilidades 3985453052.98; compromisos 3758303661.98; obligaciones 2422687571.18; pagos 2384260696.18; reservas 1335616090.80; cuentasPorPagar 38426875; superavitDeficit 2080527332.20; ecb 706484366.40.

## Estructura de archivos

```
src/
  data/
    fuentes.json              # NUEVO: catálogo de 234 fuentes (codigo, descripcionFuente), en orden
  engine/
    fuentesYUsos.ts           # NUEVO
    fuentesYUsos.test.ts      # NUEVO
    fuentesYUsos.golden.test.ts  # NUEVO
  types.ts                    # MODIFICAR: FuenteCatalogo, FilaFuenteUso
  ui/
    TablaFuentesYUsos.tsx     # NUEVO
    TablaFuentesYUsos.test.tsx # NUEVO
    Dashboard.tsx             # MODIFICAR: añadir pestaña Fuentes y Usos
    App.tsx                   # MODIFICAR: calcular y pasar filasFuenteUso
scripts/
  extract-fuentes-catalog.mjs # NUEVO: extrae el catálogo
  extract-golden-fuentes.mjs  # NUEVO: extrae los valores esperados
tests/
  golden/fuentes.expected.json # NUEVO (generado)
```

---

### Task 1: Catálogo de fuentes (dato de referencia)

**Files:**
- Create: `scripts/extract-fuentes-catalog.mjs`, `src/data/fuentes.json` (generado), `src/data/fuentes.test.ts`
- Modify: `src/types.ts`

**Interfaces:**
- Produces: `type FuenteCatalogo = { codigo: number | string | null; descripcionFuente: string }` y el JSON `src/data/fuentes.json` (array de `FuenteCatalogo`, 234 entradas en orden, `[0].descripcionFuente === 'NO APLICA'`).

- [ ] **Step 1: Añadir `FuenteCatalogo` a `types.ts`**

Append to `src/types.ts`:
```ts
export type FuenteCatalogo = {
  codigo: number | string | null
  descripcionFuente: string
}
```

- [ ] **Step 2: Escribir el script de extracción del catálogo**

Create `scripts/extract-fuentes-catalog.mjs`:
```js
import { createRequire } from 'node:module'
import { writeFileSync } from 'node:fs'
const require = createRequire(import.meta.url)
const XLSX = require('xlsx')

const TEMPLATE = process.env.TEMPLATE ??
  '/Users/alejandro/Documents/DocumentosProyectoGobierno/1. Análisis Ejecución de Ingresos y Gastos Fuentes y Usos V2025 Corte 31-05-2026 Briceño.xlsx'

const text = (v) => (v == null ? '' : String(v).trim())

const wb = XLSX.readFile(TEMPLATE)
const ws = wb.Sheets['Fuentes y Usos']
if (!ws) { console.error('No se encontró la hoja "Fuentes y Usos"'); process.exit(1) }
const m = XLSX.utils.sheet_to_json(ws, { header: 1, raw: true, defval: null })

// Encabezado en fila 3 (m[2]); datos desde fila 4 (m[3]). col3=Código=idx2, col4=Descripción=idx3.
const out = []
for (let r = 3; r < m.length; r++) {
  const row = m[r] ?? []
  const descripcionFuente = text(row[3])
  if (descripcionFuente === '') break
  out.push({ codigo: row[2] ?? null, descripcionFuente })
}
writeFileSync('src/data/fuentes.json', JSON.stringify(out, null, 2))
console.log('wrote', out.length, 'fuentes a src/data/fuentes.json')
```

- [ ] **Step 3: Generar el catálogo**

Run:
```bash
mkdir -p src/data
node scripts/extract-fuentes-catalog.mjs
```
Expected: `wrote 234 fuentes a src/data/fuentes.json`. La primera entrada debe ser `{ "codigo": 0, "descripcionFuente": "NO APLICA" }` y debe existir `"1.2.1.0.00 - INGRESOS CORRIENTES DE LIBRE DESTINACION"`.

- [ ] **Step 4: Escribir el test del catálogo**

Create `src/data/fuentes.test.ts`:
```ts
import { describe, it, expect } from 'vitest'
import fuentes from './fuentes.json'
import type { FuenteCatalogo } from '../types'

describe('catálogo de fuentes', () => {
  it('tiene 234 entradas en orden, empezando por NO APLICA', () => {
    const cat = fuentes as FuenteCatalogo[]
    expect(cat).toHaveLength(234)
    expect(cat[0].descripcionFuente).toBe('NO APLICA')
    expect(cat.some((f) => f.descripcionFuente === '1.2.1.0.00 - INGRESOS CORRIENTES DE LIBRE DESTINACION')).toBe(true)
  })
})
```

- [ ] **Step 5: Habilitar import de JSON (si hace falta) y correr el test**

Asegurar que `tsconfig.app.json` tiene `"resolveJsonModule": true` (Vite lo soporta; si falta, añadirlo en `compilerOptions`). Luego:

Run: `npm test -- src/data/fuentes.test.ts`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: catálogo CCPET05 de fuentes de financiación (dato de referencia)"
```

---

### Task 2: Motor `fuentesYUsos`

**Files:**
- Modify: `src/types.ts`
- Create: `src/engine/fuentesYUsos.ts`, `src/engine/fuentesYUsos.test.ts`

**Interfaces:**
- Consumes: `FuenteCatalogo`, `IngresoRawRow`, `GastoRawRow`, `FilaFuenteUso`.
- Produces: `function fuentesYUsos(catalogo: FuenteCatalogo[], ingresoRows: IngresoRawRow[], gastoRows: GastoRawRow[]): FilaFuenteUso[]`

- [ ] **Step 1: Añadir `FilaFuenteUso` a `types.ts`**

Append to `src/types.ts`:
```ts
export type FilaFuenteUso = {
  codigo: number | string | null
  descripcionFuente: string
  piIngresos: number
  pfIngresos: number
  piGastos: number
  pfGastos: number
  difPptoInicial: number
  difPptoFinal: number
  recaudo: number
  pctRecaudo: number
  disponibilidades: number
  compromisos: number
  pctCompromisos: number
  obligaciones: number
  pagos: number
  saldoPresupuesto: number
  dispSinCompromiso: number
  reservas: number
  cuentasPorPagar: number
  superavitDeficit: number
  observaciones: string
  ecb: number
}
```

- [ ] **Step 2: Escribir el test del motor (falla)**

Create `src/engine/fuentesYUsos.test.ts`:
```ts
import { describe, it, expect } from 'vitest'
import { fuentesYUsos } from './fuentesYUsos'
import type { FuenteCatalogo, IngresoRawRow, GastoRawRow } from '../types'

const ing = (ccpet05: string, pptoInicial: number, pptoFinal: number, totalIngresos: number): IngresoRawRow => ({
  codigoRubro: 'x', descripcion: '', ccpet02: '', ccpet05, ccpet83: '',
  pptoInicial, adicAnteriores: 0, adicPeriodo: 0, reducAnteriores: 0, reducPeriodo: 0,
  pptoFinal, totalIngresos,
})
const gas = (fuentes: string, p: Partial<GastoRawRow>): GastoRawRow => ({
  rubro: 'x', descripcion: '', cpc: '', unidadEjec: '', programatico: '', fuentes, cpi: '', atributo: '',
  pptoInicial: 0, pptoFinal: 0, disponibilidades: 0, saldoDisponible: 0, registros: 0,
  saldoDisponibilidades: 0, ordenPago: 0, saldoRegistro: 0, egresos: 0, egresosPapeles: 0,
  saldoOrdenesPago: 0, ...p,
})

const F = '1.2.1.0.00 - ICLD'
const catalogo: FuenteCatalogo[] = [
  { codigo: 0, descripcionFuente: 'NO APLICA' },
  { codigo: 2, descripcionFuente: F },
]

describe('fuentesYUsos', () => {
  it('agrega ingresos y gastos por fuente y calcula derivadas', () => {
    const ingresos = [ing(F, 100, 200, 150), ing(F, 0, 50, 30), ing('OTRA', 999, 999, 999)]
    const gastos = [gas(F, { pptoInicial: 80, pptoFinal: 180, disponibilidades: 120, registros: 90, ordenPago: 40, egresos: 10, egresosPapeles: 5 })]
    const [noAplica, icld] = fuentesYUsos(catalogo, ingresos, gastos)

    // ICLD
    expect(icld.piIngresos).toBe(100)
    expect(icld.pfIngresos).toBe(250)
    expect(icld.piGastos).toBe(80)
    expect(icld.pfGastos).toBe(180)
    expect(icld.recaudo).toBe(180)
    expect(icld.disponibilidades).toBe(120)
    expect(icld.compromisos).toBe(90)
    expect(icld.obligaciones).toBe(40)
    expect(icld.pagos).toBe(15) // egresos 10 + egresosPapeles 5
    expect(icld.difPptoInicial).toBe(20) // 100 - 80
    expect(icld.difPptoFinal).toBe(70) // 250 - 180
    expect(icld.pctRecaudo).toBe(180 / 250)
    expect(icld.pctCompromisos).toBe(90 / 180)
    expect(icld.saldoPresupuesto).toBe(130) // 250 - 120
    expect(icld.dispSinCompromiso).toBe(30) // 120 - 90
    expect(icld.reservas).toBe(50) // 90 - 40
    expect(icld.cuentasPorPagar).toBe(25) // 40 - 15
    expect(icld.superavitDeficit).toBe(90) // 180 - 90
    expect(icld.ecb).toBe(15) // 90 - 50 - 25

    // NO APLICA → todo 0
    expect(noAplica.pfIngresos).toBe(0)
    expect(noAplica.pctRecaudo).toBe(0)
    expect(noAplica.ecb).toBe(0)
  })

  it('% es 0 cuando el denominador es 0 (IFERROR)', () => {
    const [, icld] = fuentesYUsos(catalogo, [ing(F, 0, 0, 100)], [])
    expect(icld.pctRecaudo).toBe(0) // pfIngresos 0
    expect(icld.pctCompromisos).toBe(0) // pfGastos 0
  })

  it('respeta el orden y el contenido del catálogo', () => {
    const filas = fuentesYUsos(catalogo, [], [])
    expect(filas.map((f) => f.descripcionFuente)).toEqual(['NO APLICA', F])
    expect(filas[1].codigo).toBe(2)
  })
})
```

- [ ] **Step 3: Correr (verificar que falla)**

Run: `npm test -- src/engine/fuentesYUsos.test.ts`
Expected: FAIL (`fuentesYUsos` no existe).

- [ ] **Step 4: Implementar el motor**

Create `src/engine/fuentesYUsos.ts`:
```ts
import type { FilaFuenteUso, FuenteCatalogo, GastoRawRow, IngresoRawRow } from '../types'

// Suma, en orden de aparición, los valores cuyo campo clave (normalizado con trim)
// coincide exactamente con la fuente. Reproduce SUMIF respetando el orden de filas.
function sumBy<T>(rows: T[], fuente: string, keyOf: (r: T) => string, valOf: (r: T) => number): number {
  let acc = 0
  for (const r of rows) {
    if (keyOf(r).trim() === fuente) acc += valOf(r) || 0
  }
  return acc
}

export function fuentesYUsos(
  catalogo: FuenteCatalogo[],
  ingresoRows: IngresoRawRow[],
  gastoRows: GastoRawRow[],
): FilaFuenteUso[] {
  return catalogo.map((f) => {
    const fuente = f.descripcionFuente.trim()

    const piIngresos = sumBy(ingresoRows, fuente, (r) => r.ccpet05, (r) => r.pptoInicial)
    const pfIngresos = sumBy(ingresoRows, fuente, (r) => r.ccpet05, (r) => r.pptoFinal)
    const recaudo = sumBy(ingresoRows, fuente, (r) => r.ccpet05, (r) => r.totalIngresos)

    const piGastos = sumBy(gastoRows, fuente, (r) => r.fuentes, (r) => r.pptoInicial)
    const pfGastos = sumBy(gastoRows, fuente, (r) => r.fuentes, (r) => r.pptoFinal)
    const disponibilidades = sumBy(gastoRows, fuente, (r) => r.fuentes, (r) => r.disponibilidades)
    const compromisos = sumBy(gastoRows, fuente, (r) => r.fuentes, (r) => r.registros)
    const obligaciones = sumBy(gastoRows, fuente, (r) => r.fuentes, (r) => r.ordenPago)
    const pagos =
      sumBy(gastoRows, fuente, (r) => r.fuentes, (r) => r.egresos) +
      sumBy(gastoRows, fuente, (r) => r.fuentes, (r) => r.egresosPapeles)

    const difPptoInicial = piIngresos - piGastos
    const difPptoFinal = pfIngresos - pfGastos
    const pctRecaudo = pfIngresos !== 0 ? recaudo / pfIngresos : 0
    const pctCompromisos = pfGastos !== 0 ? compromisos / pfGastos : 0
    const saldoPresupuesto = pfIngresos - disponibilidades
    const dispSinCompromiso = disponibilidades - compromisos
    const reservas = compromisos - obligaciones
    const cuentasPorPagar = obligaciones - pagos
    const superavitDeficit = recaudo - compromisos
    const ecb = superavitDeficit - reservas - cuentasPorPagar

    return {
      codigo: f.codigo,
      descripcionFuente: f.descripcionFuente,
      piIngresos, pfIngresos, piGastos, pfGastos,
      difPptoInicial, difPptoFinal,
      recaudo, pctRecaudo,
      disponibilidades, compromisos, pctCompromisos,
      obligaciones, pagos,
      saldoPresupuesto, dispSinCompromiso, reservas, cuentasPorPagar,
      superavitDeficit, observaciones: '', ecb,
    }
  })
}
```

- [ ] **Step 5: Correr (verificar que pasa)**

Run: `npm test -- src/engine/fuentesYUsos.test.ts`
Expected: PASS (3 casos).

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: motor fuentesYUsos (agregación por fuente de financiación)"
```

---

### Task 3: Golden test de fidelidad de Fuentes y Usos (Briceño)

**Files:**
- Create: `scripts/extract-golden-fuentes.mjs`, `tests/golden/fuentes.expected.json` (generado)
- Test: `src/engine/fuentesYUsos.golden.test.ts`

**Interfaces:**
- Consumes: catálogo `src/data/fuentes.json` (Task 1); `normalizeIngresoRows`/`sheetToMatrix` (parsers), `normalizeGastoRows`; `fuentesYUsos` (Task 2); fixtures `tests/fixtures/ingresos.briceno.xlsx` y `gastos.briceno.xlsx`.
- Produces: prueba extremo a extremo `catálogo + insumos Briceño → motor === valores de la plantilla`, tolerancia 0, 234 filas (excluyendo `observaciones`).

- [ ] **Step 1: Escribir el script de extracción de valores esperados**

Create `scripts/extract-golden-fuentes.mjs`:
```js
import { createRequire } from 'node:module'
import { writeFileSync } from 'node:fs'
const require = createRequire(import.meta.url)
const XLSX = require('xlsx')

const TEMPLATE = process.env.TEMPLATE ??
  '/Users/alejandro/Documents/DocumentosProyectoGobierno/1. Análisis Ejecución de Ingresos y Gastos Fuentes y Usos V2025 Corte 31-05-2026 Briceño.xlsx'

const text = (v) => (v == null ? '' : String(v).trim())
const num = (v) => (typeof v === 'number' ? v : v == null || v === '' ? 0 : Number(v))

const wb = XLSX.readFile(TEMPLATE)
const ws = wb.Sheets['Fuentes y Usos']
if (!ws) { console.error('No se encontró la hoja "Fuentes y Usos"'); process.exit(1) }
const m = XLSX.utils.sheet_to_json(ws, { header: 1, raw: true, defval: null })

// idx: 2=codigo(C col3), 3=descripcionFuente(D col4), 4=piIngresos(E), 5=pfIngresos(F),
// 6=piGastos(G), 7=pfGastos(H), 8=difPptoInicial(I), 9=difPptoFinal(J), 10=recaudo(K),
// 11=pctRecaudo(L), 12=disponibilidades(M), 13=compromisos(N), 14=pctCompromisos(O),
// 15=obligaciones(P), 16=pagos(Q), 17=saldoPresupuesto(R), 18=dispSinCompromiso(S),
// 19=reservas(T), 20=cuentasPorPagar(U), 21=superavitDeficit(V), 22=observaciones(W col23), 23=ecb(X col24)
const out = []
for (let r = 3; r < m.length; r++) {
  const row = m[r] ?? []
  const descripcionFuente = text(row[3])
  if (descripcionFuente === '') break
  out.push({
    codigo: row[2] ?? null, descripcionFuente,
    piIngresos: num(row[4]), pfIngresos: num(row[5]), piGastos: num(row[6]), pfGastos: num(row[7]),
    difPptoInicial: num(row[8]), difPptoFinal: num(row[9]), recaudo: num(row[10]), pctRecaudo: num(row[11]),
    disponibilidades: num(row[12]), compromisos: num(row[13]), pctCompromisos: num(row[14]),
    obligaciones: num(row[15]), pagos: num(row[16]), saldoPresupuesto: num(row[17]),
    dispSinCompromiso: num(row[18]), reservas: num(row[19]), cuentasPorPagar: num(row[20]),
    superavitDeficit: num(row[21]), observaciones: text(row[22]), ecb: num(row[23]),
  })
}
writeFileSync('tests/golden/fuentes.expected.json', JSON.stringify(out, null, 2))
console.log('wrote', out.length, 'filas a tests/golden/fuentes.expected.json')
```

- [ ] **Step 2: Generar el JSON esperado**

Run: `node scripts/extract-golden-fuentes.mjs`
Expected: `wrote 234 filas a tests/golden/fuentes.expected.json`. Verificar que la fila de `"1.2.1.0.00 - INGRESOS CORRIENTES DE LIBRE DESTINACION"` tiene `recaudo: 5838830994.18` (o el residuo de punto flotante de la plantilla) y `ecb: 706484366.4`.

- [ ] **Step 3: Escribir el golden test**

Create `src/engine/fuentesYUsos.golden.test.ts`:
```ts
import { describe, it, expect } from 'vitest'
import * as XLSX from 'xlsx'
import { readFileSync } from 'node:fs'
import { normalizeIngresoRows } from '../parsers/ingresos'
import { normalizeGastoRows } from '../parsers/gastos'
import { sheetToMatrix } from '../parsers/sheet'
import { fuentesYUsos } from './fuentesYUsos'
import fuentes from '../data/fuentes.json'
import type { FuenteCatalogo } from '../types'

const sinObs = <T extends { observaciones?: unknown }>(f: T) => {
  const { observaciones: _omit, ...rest } = f
  return rest
}

describe('fidelidad Fuentes y Usos (Briceño) — tolerancia 0', () => {
  it('la salida del motor coincide exactamente con la plantilla', () => {
    const wbI = XLSX.read(readFileSync('tests/fixtures/ingresos.briceno.xlsx'))
    const wbG = XLSX.read(readFileSync('tests/fixtures/gastos.briceno.xlsx'))
    const ingresoRows = normalizeIngresoRows(sheetToMatrix(wbI.Sheets[wbI.SheetNames[0]]))
    const gastoRows = normalizeGastoRows(sheetToMatrix(wbG.Sheets[wbG.SheetNames[0]]))

    const got = fuentesYUsos(fuentes as FuenteCatalogo[], ingresoRows, gastoRows).map(sinObs)
    const want = (JSON.parse(readFileSync('tests/golden/fuentes.expected.json', 'utf8')) as Array<{ observaciones?: unknown }>).map(sinObs)

    expect(got).toHaveLength(want.length)
    expect(got).toEqual(want)
  })
})
```

- [ ] **Step 4: Correr el golden test (verificar que pasa)**

Run: `npm test -- src/engine/fuentesYUsos.golden.test.ts`
Expected: PASS. 234 filas coinciden exactamente (excluyendo `observaciones`).

Si falla:
- Comparar `got[i]` vs `want[i]` de la primera fila divergente.
- Causa más probable: la CLAVE DE MATCH (la cadena `descripcionFuente` vs `ccpet05`/`fuentes`) no coincide por espacios/acentos. Revisar normalización (`.trim()`), NO relajar la tolerancia.
- Si la diferencia es solo de punto flotante en los últimos decimales, revisar que la suma respete el orden de filas del insumo (no reordenar). NO cambiar a comparación aproximada.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "test: golden de fidelidad de Fuentes y Usos (Briceño, tolerancia 0)"
```

---

### Task 4: Tabla y dashboard de Fuentes y Usos

**Files:**
- Create: `src/ui/TablaFuentesYUsos.tsx`, `src/ui/TablaFuentesYUsos.test.tsx`
- Modify: `src/ui/Dashboard.tsx`, `src/App.tsx`

**Interfaces:**
- Consumes: `FilaFuenteUso`; `fuentesYUsos` (Task 2); catálogo `fuentes.json`; `IngresoRawRow`/`GastoRawRow`.
- Produces: `TablaFuentesYUsos` y una pestaña "Fuentes y Usos" en el dashboard que aparece solo cuando hay datos de ingresos Y gastos.

- [ ] **Step 1: Escribir el test de la tabla (falla)**

Create `src/ui/TablaFuentesYUsos.test.tsx`:
```tsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { TablaFuentesYUsos } from './TablaFuentesYUsos'
import type { FilaFuenteUso } from '../types'

const fila: FilaFuenteUso = {
  codigo: 2, descripcionFuente: '1.2.1.0.00 - INGRESOS CORRIENTES DE LIBRE DESTINACION',
  piIngresos: 7564774800, pfIngresos: 7564774800, piGastos: 7564774800, pfGastos: 7564774800,
  difPptoInicial: 0, difPptoFinal: 0, recaudo: 5838830994.18, pctRecaudo: 0.7718446548,
  disponibilidades: 3985453052.98, compromisos: 3758303661.98, pctCompromisos: 0.4968163311,
  obligaciones: 2422687571.18, pagos: 2384260696.18, saldoPresupuesto: 3579321747.02,
  dispSinCompromiso: 227149391, reservas: 1335616090.8, cuentasPorPagar: 38426875,
  superavitDeficit: 2080527332.2, observaciones: '', ecb: 706484366.4,
}

describe('TablaFuentesYUsos', () => {
  it('muestra la descripción de la fuente', () => {
    render(<TablaFuentesYUsos filas={[fila]} />)
    expect(screen.getByText('1.2.1.0.00 - INGRESOS CORRIENTES DE LIBRE DESTINACION')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Correr (verificar que falla)**

Run: `npm test -- src/ui/TablaFuentesYUsos.test.tsx`
Expected: FAIL (`TablaFuentesYUsos` no existe).

- [ ] **Step 3: Implementar `TablaFuentesYUsos`**

Create `src/ui/TablaFuentesYUsos.tsx`:
```tsx
import type { FilaFuenteUso } from '../types'

const fmtNum = (n: number) => n.toLocaleString('es-CO', { maximumFractionDigits: 2 })
const fmtPct = (n: number) => (n * 100).toLocaleString('es-CO', { maximumFractionDigits: 2 }) + ' %'

const COLUMNAS: { key: keyof FilaFuenteUso; label: string; tipo: 'texto' | 'num' | 'pct' }[] = [
  { key: 'descripcionFuente', label: 'Fuente', tipo: 'texto' },
  { key: 'pfIngresos', label: 'Ppto Final Ingresos', tipo: 'num' },
  { key: 'pfGastos', label: 'Ppto Final Gastos', tipo: 'num' },
  { key: 'recaudo', label: 'Recaudo', tipo: 'num' },
  { key: 'pctRecaudo', label: '% Recaudo', tipo: 'pct' },
  { key: 'disponibilidades', label: 'Disponibilidades', tipo: 'num' },
  { key: 'compromisos', label: 'Compromisos', tipo: 'num' },
  { key: 'pctCompromisos', label: '% Compromisos', tipo: 'pct' },
  { key: 'obligaciones', label: 'Obligaciones', tipo: 'num' },
  { key: 'pagos', label: 'Pagos', tipo: 'num' },
  { key: 'reservas', label: 'Reservas', tipo: 'num' },
  { key: 'cuentasPorPagar', label: 'Cuentas por Pagar', tipo: 'num' },
  { key: 'superavitDeficit', label: 'Superávit/Déficit', tipo: 'num' },
  { key: 'ecb', label: 'ECB', tipo: 'num' },
]

export function TablaFuentesYUsos({ filas }: { filas: FilaFuenteUso[] }) {
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
            <tr key={`${f.descripcionFuente}-${i}`} className="odd:bg-white even:bg-slate-50">
              {COLUMNAS.map((c) => (
                <td key={c.key} className={`border px-2 py-1 ${c.tipo === 'texto' ? '' : 'text-right'}`}>
                  {c.tipo === 'texto'
                    ? (f[c.key] as string)
                    : c.tipo === 'pct'
                      ? fmtPct(f[c.key] as number)
                      : fmtNum(f[c.key] as number)}
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

Run: `npm test -- src/ui/TablaFuentesYUsos.test.tsx`
Expected: PASS.

- [ ] **Step 5: Añadir la pestaña al `Dashboard`**

In `src/ui/Dashboard.tsx`:
- Import: `import type { FilaIngreso, FilaGasto, FilaFuenteUso } from '../types'` y `import { TablaFuentesYUsos } from './TablaFuentesYUsos'`.
- Añadir prop `filasFuenteUso: FilaFuenteUso[]` a la firma del componente.
- Tras el bloque que agrega el área de gastos, añadir:
```tsx
  if (filasFuenteUso.length > 0) {
    areas.push({
      id: 'fuentes',
      label: `Fuentes y Usos (${filasFuenteUso.length})`,
      render: () => <TablaFuentesYUsos filas={filasFuenteUso} />,
    })
  }
```

- [ ] **Step 6: Calcular y pasar `filasFuenteUso` en `App.tsx`**

In `src/App.tsx`:
- Imports: `import { fuentesYUsos } from './engine/fuentesYUsos'`, `import fuentes from './data/fuentes.json'`, `import type { FuenteCatalogo } from './types'`.
- Añadir el memo (Fuentes y Usos requiere ingresos Y gastos; si falta alguno, lista vacía):
```tsx
  const filasFuenteUso = useMemo(
    () =>
      ingresoRows.length > 0 && gastoRows.length > 0
        ? fuentesYUsos(fuentes as FuenteCatalogo[], ingresoRows, gastoRows)
        : [],
    [ingresoRows, gastoRows],
  )
```
- Pasar la prop al dashboard: `<Dashboard filasIngreso={filasIngreso} filasGasto={filasGasto} filasFuenteUso={filasFuenteUso} />`.

- [ ] **Step 7: Verificar suite y build**

Run: `npm test`
Expected: PASS — toda la suite (incluye el golden de Fuentes y Usos de 234 filas y los goldens previos intactos).

Run: `npm run build`
Expected: build exitoso, sin errores de TypeScript.

- [ ] **Step 8: Verificación manual (opcional)**

Run: `npm run dev`. Cargar ingresos y gastos de Briceño; confirmar que aparece la pestaña "Fuentes y Usos (234)" con la fila de ICLD mostrando Recaudo ≈ 5.838.830.994,18 y % Recaudo ≈ 77,18 %.

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "feat: tabla y pestaña de Fuentes y Usos en el dashboard"
```

---

## Self-Review

**Cobertura del spec (Plan 4):**
- Agregación por fuente (SUMIF) desde ingresos+gastos → Task 2 (motor). ✓
- Catálogo CCPET05 de fuentes como dato de referencia (orden + cero-movimiento preservados) → Task 1. ✓
- Clave de match = `Descripción Fuente` completa, exacta con trim → Task 2 (`sumBy`), constraint global. ✓
- Columnas derivadas (diferencias, %, saldos, superávit/déficit, ECB) e IFERROR→0 → Task 2 + test. ✓
- Fidelidad tolerancia 0, 234 filas, excluyendo solo `observaciones` → Task 3 golden. ✓
- Orden de acumulación para reproducir float de Excel → constraint + `sumBy` recorre en orden. ✓
- UI tabla + pestaña que aparece con ingresos+gastos → Task 4. ✓
- No tocar motores/golden previos → solo se añaden archivos y se extiende Dashboard/App. ✓
- Diferido: SGP, Ley 617, PAC, Indicadores; gráficos; export; persistencia. ✓

**Escaneo de placeholders:** sin TBD/TODO; todo el código está completo.

**Consistencia de tipos:** `FuenteCatalogo` (Task 1) y `FilaFuenteUso` (Task 2) en `types.ts`; el script de catálogo y el de golden leen col3/col4 idénticamente, así que `codigo`/`descripcionFuente` coinciden por construcción. El motor toma la clave de `IngresoRawRow.ccpet05` y `GastoRawRow.fuentes` (nombres existentes de los Planes 1–2). El golden test usa `normalizeIngresoRows`/`normalizeGastoRows`/`sheetToMatrix` (existentes) y el catálogo `fuentes.json`. `Dashboard` recibe `filasFuenteUso` y `App` lo calcula solo cuando hay ingresos y gastos.
