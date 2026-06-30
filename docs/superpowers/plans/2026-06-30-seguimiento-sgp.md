# Plan 9 — Seguimiento SGP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Construir el área "Seguimiento SGP" (ficha SGP por concepto) a partir del SICODIS provisto + la ejecución ya calculada, validando a tolerancia 0 las columnas que derivan de la ejecución (Presupuesto/Recaudo/Compromisos) contra la plantilla, y mapeando las columnas Última Doceava / Once Doceavas / Total directamente del SICODIS.

**Contexto / decisión:** El cliente confirmó que los datos de Última/Once/Total **salen del SICODIS** (archivo `ResumenDistribucionSGPUltimaYOnce.xlsx`, hoja "Datos Reporte SGP"). La plantilla tenía pegados valores de un export anterior; NO se replican esos (se genera la ficha del corte actual). Por eso:
- **D (Última Doceava) / E (Once Doceavas) / F (Total)**: del SICODIS, por concepto.
- **G (Presupuesto) / J (Recaudo) / L (Compromisos)**: de la ejecución (ingresos + Fuentes y Usos) — coinciden con la plantilla a tolerancia 0.
- **H/I/K/M** (Diferencia, Observación, % Recaudo, % Ejecución): derivados, usando el F del SICODIS actual.

**Architecture:** catálogo fijo de 22 conceptos (estructura SGP nacional, estable) como dato de referencia; parser del SICODIS Resumen; motor puro `seguimientoSgp(...)`; panel UI + sección en el informe; el payload del SICODIS se cablea desde el slot de carga hasta App.

**Tech Stack:** React 18, TS, Vite, Tailwind, Vitest, SheetJS, Recharts. (Planes 1–8 completos; rama actual `feat/rediseno-visual`.)

## Global Constraints

- **Match por CÓDIGO de fuente** (p. ej. `1.2.4.1.04`), no por string completo: definir `codigoFuente(s) = s.split(' - ')[0].trim()` y comparar. (Evita errores de transcripción; equivale al SUMIF exacto porque cada código mapea a una sola fuente.) Rubros se comparan por código exacto.
- **D/E/F del SICODIS** por `sicodisConcepto` (nombre exacto de la columna B del Resumen). Conceptos sin fuente SICODIS → 0/0/0.
- **G/J/L**: por fila, según el flag `g`/`j`/`l` del catálogo (`'fuente'` o `'rubro'`):
  - `g='fuente'`: Σ `IngresoRawRow.pptoFinal` donde `codigoFuente(ccpet05) === fuenteCodigo`.
  - `g='rubro'`: Σ `IngresoRawRow.pptoFinal` donde `codigoRubro === rubro`.
  - `j='fuente'`: `FilaFuenteUso` cuyo `codigoFuente(descripcionFuente) === fuenteCodigo` → `recaudo` (primera coincidencia; 0 si no hay).
  - `j='rubro'`: Σ `IngresoRawRow.totalIngresos` donde `codigoRubro === rubro`.
  - `l='fuente'`: `FilaFuenteUso` (match por código) → `compromisos`.
  - Si el flag no está, la celda queda en `null` (filas grupo/total y subgrupos sin fórmula).
- **Derivadas** (solo en filas con F y G/J/L según corresponda): `H = F - G`; `K = F!==0 ? J/F : 0`; `M = F!==0 ? L/F : 0`; `I` (texto): si `G>F` → `"Reducir "+H+" en presupuesto"`; si `G<F` → `("Incorporar " si fila∈{33,34} else "Adicionar ")+H+" en presupuesto"`; si `G===F` → `"OK"`.
- **Fidelidad:** golden test valida **G/J/L** contra la plantilla (tolerancia 0) y **D/E/F** contra el SICODIS (igualdad). H/I/K/M se validan con unit tests (dependen del F actual, no del de la plantilla). No tocar `src/engine/**` previos, parsers de otras áreas, ni `*.golden.test.*` existentes.
- Motor puro; App 100% cliente; identificadores English/camelCase, UI español.

## Catálogo (22 filas) — `src/data/sgpCatalogo.ts`

Constante tipada (verificada contra la plantilla de Briceño). `indent` solo para sangría visual. `tipo`: 'grupo' (solo D/E/F) | 'detalle' | 'total'.

```ts
export type SgpConcepto = {
  fila: number
  concepto: string
  indent: 0 | 1 | 2
  tipo: 'grupo' | 'detalle' | 'total'
  rubro?: string
  fuenteCodigo?: string
  sicodisConcepto: string | null   // nombre exacto en SICODIS Resumen (col B); null = sin fuente → 0/0/0
  g?: 'fuente' | 'rubro'
  j?: 'fuente' | 'rubro'
  l?: 'fuente'
}

export const SGP_CATALOGO: SgpConcepto[] = [
  { fila: 16, concepto: 'Educación', indent: 0, tipo: 'grupo', sicodisConcepto: 'Educación' },
  { fila: 17, concepto: 'Prestación de Servicios', indent: 1, tipo: 'grupo', sicodisConcepto: 'Prestación Servicios' },
  { fila: 18, concepto: 'Calidad', indent: 1, tipo: 'detalle', rubro: '', g: 'rubro', sicodisConcepto: 'Calidad' },
  { fila: 19, concepto: 'Matrícula Gratuidad', indent: 2, tipo: 'detalle', rubro: '1.1.02.06.001.01.03.02', fuenteCodigo: '1.2.4.1.04', g: 'fuente', j: 'fuente', l: 'fuente', sicodisConcepto: 'Calidad (Gratuidad)' },
  { fila: 20, concepto: 'Matrícula Oficial', indent: 2, tipo: 'detalle', rubro: '1.1.02.06.001.01.03.01', fuenteCodigo: '1.2.4.1.03', g: 'fuente', j: 'fuente', l: 'fuente', sicodisConcepto: 'Calidad (Matrícula)' },
  { fila: 21, concepto: 'Salud', indent: 0, tipo: 'grupo', sicodisConcepto: 'Salud' },
  { fila: 22, concepto: 'Régimen Subsidiado', indent: 1, tipo: 'detalle', rubro: '1.1.02.06.001.02.01', fuenteCodigo: '1.2.4.2.01', g: 'fuente', j: 'fuente', l: 'fuente', sicodisConcepto: 'Régimen Subsidiado' },
  { fila: 23, concepto: 'Salud Pública', indent: 1, tipo: 'detalle', rubro: '1.1.02.06.001.02.02', fuenteCodigo: '1.2.4.2.02', g: 'fuente', j: 'fuente', l: 'fuente', sicodisConcepto: 'Salud Pública' },
  { fila: 24, concepto: 'Prestación de Servicios', indent: 1, tipo: 'detalle', rubro: '1.1.02.06.001.02.04', fuenteCodigo: '1.2.4.2.04', g: 'fuente', j: 'fuente', l: 'fuente', sicodisConcepto: 'Subsidio a la Oferta' },
  { fila: 25, concepto: 'Agua Potable', indent: 0, tipo: 'detalle', rubro: '1.1.02.06.001.05', fuenteCodigo: '1.2.4.6.00', g: 'fuente', j: 'fuente', l: 'fuente', sicodisConcepto: 'Agua Potable' },
  { fila: 26, concepto: 'Propósito General - Destinación', indent: 0, tipo: 'grupo', sicodisConcepto: 'Propósito General' },
  { fila: 27, concepto: 'Libre Destinación', indent: 1, tipo: 'detalle', rubro: '1.1.02.06.001.03.04', fuenteCodigo: '1.2.4.3.04', g: 'rubro', j: 'rubro', l: 'fuente', sicodisConcepto: 'Libre Destinación' },
  { fila: 28, concepto: 'Deporte', indent: 1, tipo: 'detalle', rubro: '1.1.02.06.001.03.01', fuenteCodigo: '1.2.4.3.01', g: 'fuente', j: 'fuente', l: 'fuente', sicodisConcepto: 'Deporte' },
  { fila: 29, concepto: 'Cultura', indent: 1, tipo: 'detalle', rubro: '1.1.02.06.001.03.02', fuenteCodigo: '1.2.4.3.02', g: 'fuente', j: 'fuente', l: 'fuente', sicodisConcepto: 'Cultura' },
  { fila: 30, concepto: 'Libre Inversión', indent: 1, tipo: 'detalle', rubro: '1.1.02.06.001.03.03', fuenteCodigo: '1.2.4.3.03', g: 'fuente', j: 'fuente', l: 'fuente', sicodisConcepto: 'Libre Inversión' },
  { fila: 31, concepto: 'Fonpet(2)', indent: 1, tipo: 'grupo', sicodisConcepto: 'Fonpet' },
  { fila: 32, concepto: 'Alimentación Escolar', indent: 0, tipo: 'detalle', rubro: '1.1.02.06.001.04.01', fuenteCodigo: '1.2.4.4.01', g: 'rubro', j: 'fuente', l: 'fuente', sicodisConcepto: 'Alimentación Escolar' },
  { fila: 33, concepto: 'Ribereños', indent: 0, tipo: 'detalle', rubro: '1.1.02.06.001.04.02', g: 'rubro', sicodisConcepto: 'Ribereños' },
  { fila: 34, concepto: 'Resguardos Indígenas', indent: 0, tipo: 'detalle', rubro: '1.1.02.06.001.04.03', g: 'rubro', sicodisConcepto: 'Resguardos Indígenas' },
  { fila: 35, concepto: 'Fonpet', indent: 0, tipo: 'grupo', sicodisConcepto: 'Fonpet 2.9%' },
  { fila: 36, concepto: 'Primera Infancia', indent: 0, tipo: 'grupo', sicodisConcepto: null },
  { fila: 37, concepto: 'TOTAL SGP', indent: 0, tipo: 'total', sicodisConcepto: 'Total SGP' },
]
```

(Nota: el flag `g='rubro'` para filas 33/34 con rubro presente dará 0 si no hay ingreso para ese rubro — coincide con la plantilla.)

---

### Task 1: Catálogo SGP + parser del SICODIS Resumen

**Files:** Create `src/data/sgpCatalogo.ts`; modify `src/parsers/sgp.ts` (add `parseSgpResumen`); add `src/parsers/sgp.test.ts` cases.

**Interfaces:**
- `SgpConcepto`, `SGP_CATALOGO` (arriba).
- `type SgpResumenRow = { concepto: string; ultima: number; once: number; total: number }`
- `function parseSgpResumenMatrix(matrix: unknown[][]): SgpResumenRow[]` — localiza la hoja 'Datos Reporte SGP': encabezado en la fila cuyo col B === 'Concepto'; datos hasta 'Total SGP' inclusive; columnas C/D/E (índices 2/3/4) = ultima/once/total; concepto = col B (índice 1), `text()`.
- `function parseSgpResumenFile(file: File): Promise<SgpResumenRow[]>` (lee la hoja 'Datos Reporte SGP' del workbook → matrix → parseSgpResumenMatrix). Mantener `readSgpSheetNames` para la validación de estructura.

- [ ] Step 1: Crear `src/data/sgpCatalogo.ts` con el tipo y la constante (copiar el bloque del catálogo verbatim).
- [ ] Step 2 (TDD): test de `parseSgpResumenMatrix` con una matriz sintética (filas de título + 'Concepto' header + Educación/Calidad (Gratuidad)/Total SGP) → verifica que extrae {concepto, ultima, once, total} y corta en 'Total SGP'.
- [ ] Step 3: correr (falla) → implementar `parseSgpResumenMatrix`/`parseSgpResumenFile` en `src/parsers/sgp.ts` (reusar `sheetToMatrix`, `text`, `num` de `./sheet`) → correr (pasa).
- [ ] Step 4: `npm test` (verde) → commit: `feat: catálogo SGP + parser del SICODIS resumen`.

---

### Task 2: Motor `seguimientoSgp`

**Files:** modify `src/types.ts` (add `FilaSgp`); create `src/engine/seguimientoSgp.ts`, `src/engine/seguimientoSgp.test.ts`.

**Interfaces:**
- `type FilaSgp = { fila:number; concepto:string; indent:number; tipo:'grupo'|'detalle'|'total'; rubro:string; fuente:string; ultima:number; once:number; total:number; presupuesto:number|null; diferencia:number|null; observacion:string|null; recaudo:number|null; pctRecaudo:number|null; compromisos:number|null; pctEjecucion:number|null }`
- `function seguimientoSgp(catalogo: SgpConcepto[], sicodis: SgpResumenRow[], ingresoRows: IngresoRawRow[], filasFuenteUso: FilaFuenteUso[]): FilaSgp[]`

Reglas (ver Global Constraints): mapear D/E/F desde `sicodis` por `sicodisConcepto` (0/0/0 si null o no hay match); calcular G/J/L por fila según flags; derivar H/I/K/M. Filas `grupo`/`total`: solo D/E/F (G/J/L/H/I/K/M = null) — EXCEPTO la observación/derivadas que no aplican. (La fila 18 'Calidad' con `g:'rubro'` y rubro '' dará presupuesto 0 y recaudo/compromisos null.)

- [ ] Step 1 (TDD): test con catálogo reducido + sicodis sintético + ingresoRows/fuenteUso sintéticos que cubra: D/E/F desde SICODIS; G por fuente; G por rubro; J por fuente (FuenteUso) y por rubro (totalIngresos); L por fuente; H=F-G; I 'Reducir'/'Adicionar'/'Incorporar'/'OK'; K/M con F=0→0; fila grupo solo D/E/F; concepto sin sicodis→0.
- [ ] Step 2: correr (falla) → implementar el motor → correr (pasa).
- [ ] Step 3: `npm test` verde → commit: `feat: motor seguimientoSgp`.

---

### Task 3: Golden test (Briceño)

**Files:** create `scripts/extract-golden-sgp.mjs`, `tests/golden/sgp.expected.json`; create `src/engine/seguimientoSgp.golden.test.ts`. Reuse fixtures `tests/fixtures/ingresos.briceno.xlsx`, `gastos.briceno.xlsx`, `sgp.briceno.xlsx`.

- `extract-golden-sgp.mjs`: del template hoja 'Seguimiento SGP', por cada fila 16–37 extrae `{ fila, presupuesto: G(col7→idx6), recaudo: J(col10→idx9), compromisos: L(col12→idx11) }` (num→null si vacío) → `tests/golden/sgp.expected.json` (solo G/J/L, que son las que derivan de ejecución).
- `seguimientoSgp.golden.test.ts`:
  - Parsear los 3 fixtures (ingresos, gastos → `fuentesYUsos(fuentes, ing, gas)`, SICODIS → `parseSgpResumenFile`/matrix).
  - `got = seguimientoSgp(SGP_CATALOGO, sicodis, ingresoRows, filasFuenteUso)`.
  - **Aserción 1 (tol-0 vs plantilla):** para cada fila del golden, `got[fila].presupuesto/recaudo/compromisos === golden` (comparar solo G/J/L). 
  - **Aserción 2 (D/E/F vs SICODIS):** para filas detalle/grupo con `sicodisConcepto`, `got.ultima/once/total` === el valor del SICODIS Resumen para ese concepto (p. ej. Matrícula Gratuidad once = 132574890; Total SGP total = 13062169364).
- [ ] Step 1: copiar fixtures si falta (sgp.briceno.xlsx ya existe). Escribir el script; `node scripts/extract-golden-sgp.mjs` (imprime filas extraídas). Verificar G19=132574890, G27=2742015215, L30=1774921458.18.
- [ ] Step 2: escribir el golden test → correr. Si falla en G/J/L: revisar flags `g/j/l` de la fila divergente (fuente vs rubro) — NO relajar tolerancia. Si falla D/E/F: revisar `sicodisConcepto`.
- [ ] Step 3: `npm test` verde → commit: `test: golden Seguimiento SGP (G/J/L tol-0 vs plantilla, D/E/F vs SICODIS)`.

---

### Task 4: UI — panel, cableado del SICODIS y sección del informe

**Files:** create `src/ui/PanelSgp.tsx` (+ test); modify `src/ui/CargaInsumos.tsx`, `src/App.tsx`, `src/ui/Dashboard.tsx`, `src/ui/Informe.tsx`.

- [ ] Step 1: **Cablear el SICODIS**: en `CargaInsumos`, el slot SGP debe, además de validar estructura (`readSgpSheetNames`+`validateSgp`), parsear el Resumen (`parseSgpResumenFile`) y devolverlo hacia arriba. Añadir prop `onSgp(resumen: SgpResumenRow[] | null)`. En `App.tsx`: estado `sgpResumen`, set desde el slot (solo si validación ok), y memo `filasSgp = (ingresoRows.length>0 && gastoRows.length>0 && sgpResumen) ? seguimientoSgp(SGP_CATALOGO, sgpResumen, ingresoRows, filasFuenteUso) : []`.
- [ ] Step 2: **PanelSgp** (estilo Editorial fiscal, reusar `DataTable`/kit/`format`/`estado`): tabla de la ficha (Concepto con sangría por `indent`; columnas Última/Once/Total, Presupuesto, Diferencia, Observación, Recaudo, %Recaudo, Compromisos, %Ejecución). Filas grupo/total en negrita; % con semáforo (`nivelIndicador`-style: alto=verde). Cifras mono. RTL test: renderiza 'Seguimiento SGP' y un concepto (p. ej. 'Agua Potable').
- [ ] Step 3: **Dashboard**: añadir pestaña "Seguimiento SGP" cuando `filasSgp.length>0` (prop `filasSgp?`). 
- [ ] Step 4: **Informe**: reemplazar la card "Pendiente de insumo — SGP" por una **sección real de SGP** cuando haya `filasSgp` (narrativa: total SGP, % ejecución, conceptos con mayor/menor ejecución; tabla resumida con semáforo). Si no hay SICODIS cargado, mantener el estado "pendiente".
- [ ] Step 5: `npm test` verde + `npm run build` limpio → commit: `feat: panel Seguimiento SGP + cableado SICODIS + sección en el informe`.

---

## Self-Review

- D/E/F del SICODIS (no de la plantilla, que está obsoleta) → Tasks 1–2; validado contra el SICODIS en Task 3. ✓
- G/J/L de la ejecución, validados tol-0 vs plantilla → Task 3. ✓
- Match por código de fuente (robusto) → Global Constraints. ✓
- Catálogo nacional estable como dato de referencia → Task 1. ✓
- UI + informe + cableado del SICODIS → Task 4. ✓
- No se tocan motores/golden previos; suite verde, build limpio. ✓
- Pendiente que queda fuera: el límite SMMLV Concejo/Personería (B2) sigue requiriendo N° de sesiones + categoría — no entra aquí.
