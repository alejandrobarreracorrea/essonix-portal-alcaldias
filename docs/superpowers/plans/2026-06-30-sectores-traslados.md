# Plan 10 — Inversión por sectores + Traslados Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:subagent-driven-development. Steps use checkbox (`- [ ]`).

**Goal:** Añadir dos secciones derivables de los archivos que ya tenemos (sin depender del cliente): **Inversión por sectores** (agrega el gasto de inversión por sector del clasificador programático CCPET03) y **Traslados presupuestales** (agrega créditos/contracréditos por fuente). Integrarlas al dashboard y al Informe (reemplazando sus tarjetas "pendiente de insumo").

**Nota de fidelidad:** la plantilla NO calcula estas dos áreas (la sección de la plantilla no las tiene), por lo que NO hay golden tolerancia-0 contra la plantilla. Se validan contra el **archivo fuente de gastos**: Traslados → Σ créditos por fuente debe igualar el total del gasto (fila rubro "2"); Sectores → Σ por sector debe reconciliar con el total de inversión (rubro "2.3").

**Tech Stack:** React 18, TS, Vite, Tailwind, Vitest, SheetJS, Recharts. Rama actual `feat/seguimiento-sgp` (se ramifica `feat/sectores-traslados`).

## Global Constraints

- **Sector** = primer token del CCPET03: `programatico.split('|')[0].trim()` (2 dígitos, p. ej. `'24'`). Nombre desde el catálogo de sectores.
- **Catálogo de sectores** = filas con `Tipo === 'Sector'` de la hoja `Clasificador Prog. Inversion` de la plantilla → `{ codigo, nombre }` (dato de referencia, `src/data/sectores.json`).
- **Inversión por sectores**: sobre `gastoRows` con `rubro` que empieza por `'2.3'` Y `programatico` no vacío (las hojas/leaf de inversión con producto). Agrupar por código de sector → sumar `pptoFinal`, `registros` (compromisos), `disponibilidades`; `ejecucion = pptoFinal!==0 ? registros/pptoFinal : 0`; `saldoDisponible = pptoFinal - disponibilidades`. Ordenar por `pptoFinal` desc. (Esto evita doble conteo: las filas agregadas 2.3/2.3.1… no tienen CCPET03.)
- **Traslados**: sobre `gastoRows` con `fuentes` no vacío (excluye agregados, igual que Fuentes y Usos). Agrupar por fuente (match por **código** `codigoFuente(s)=s.split(' - ')[0].trim()`) → sumar `creditos`, `contracreditos`; `diferencia = creditos - contracreditos`. Solo filas con `creditos>0 || contracreditos>0`. `total = Σ creditos`.
- Motores puros; IEEE-754 sin redondeo; identificadores English/camelCase, UI español. No tocar `src/engine/**` previos, otros parsers (salvo extender el de gastos), `src/data/**` previos, ni `*.golden.test.*` previos.

---

### Task 1: Parser de gastos extendido + catálogo de sectores

**Files:** modify `src/types.ts` (`GastoRawRow` + new types), `src/parsers/gastos.ts`, `src/parsers/gastos.test.ts`; create `scripts/extract-sectores.mjs`, `src/data/sectores.json`, `src/data/sectores.test.ts`.

**Interfaces:**
- Extender `GastoRawRow` con campos **opcionales** `creditos?: number` y `contracreditos?: number` (opcionales para no romper los helpers `gas()` de otros tests; el parser SIEMPRE los setea).
- `type FilaTraslado = { fuente: string; creditos: number; contracreditos: number; diferencia: number }`
- `type FilaSector = { codigo: string; sector: string; pptoFinal: number; registros: number; disponibilidades: number; saldoDisponible: number; ejecucion: number }`
- `sectores.json`: array `{ codigo: string; nombre: string }`.

- [ ] Step 1: en `src/parsers/gastos.ts`, añadir al `NUM_COLS` las columnas `creditos: 'Créditos presupuesto'` y `contracreditos: 'Contracreditos presupuesto'`, y setearlas en cada `GastoRawRow`. (No cambiar las demás columnas.) Añadir los campos opcionales a `GastoRawRow` en `types.ts`.
- [ ] Step 2: actualizar `src/parsers/gastos.test.ts`: el caso `toEqual` de la fila total debe incluir `creditos`/`contracreditos` (de la fila TOTAL sintética: usa 1234 como en las otras cols de movimiento del test, o añade valores). Correr: `npm test -- src/parsers/gastos.test.ts` verde. Confirmar que `analisisGastos.golden` y `fuentesYUsos.golden` siguen verdes (FilaGasto no cambia).
- [ ] Step 3: `scripts/extract-sectores.mjs` (Node ESM, `createRequire`): de la plantilla hoja `'Clasificador Prog. Inversion'`, filas donde col C (índice 2) === `'Sector'` → `{ codigo: text(col A/idx0), nombre: text(col B/idx1) }`. Escribir `src/data/sectores.json`. Correr `node scripts/extract-sectores.mjs` (imprime N sectores; debe incluir p. ej. `12 → 'Justicia y del Derecho'`).
- [ ] Step 4: `src/data/sectores.test.ts`: importa el JSON; asserta que tiene >10 entradas, que `12` mapea a algo con 'Justicia', y que todos los `codigo` son 2 dígitos.
- [ ] Step 5: `npm test` verde, `npm run build` limpio → commit `feat: parser gastos +créditos/contracréditos y catálogo de sectores`.

---

### Task 2: Motores `traslados` e `inversionPorSectores` + validación

**Files:** create `src/engine/traslados.ts`, `src/engine/inversionPorSectores.ts`, their `.test.ts`; create `src/engine/sectoresTraslados.golden.test.ts`.

**Interfaces:**
- `function traslados(gastoRows: GastoRawRow[]): { filas: FilaTraslado[]; total: number }`
- `function inversionPorSectores(gastoRows: GastoRawRow[], sectores: {codigo:string;nombre:string}[]): FilaSector[]`

- [ ] Step 1 (TDD `traslados`): test con gastoRows sintéticos: filas con fuente A (creditos 100, contracred 40), fuente A otra (creditos 0, contracred 60), fuente B (creditos 50, contracred 0), una agregada sin fuente (ignorada). Esperar filas por fuente con sumas (A: cred 100, contracred 100, dif 0; B: cred 50, contracred 0, dif 50), total = 150. Implementar (match fuente por código, `creditos ?? 0`). Verde.
- [ ] Step 2 (TDD `inversionPorSectores`): test con gastoRows: filas 2.3.* con CCPET03 `'24 | …'` (pptoFinal 1000, registros 600, disp 700) y `'12 | …'` (pptoFinal 500, registros 100, disp 100), una fila 2.1 (ignorada) y una 2.3 agregada sin CCPET03 (ignorada). Catálogo [{24,'Transporte'},{12,'Justicia'}]. Esperar 2 sectores ordenados por pptoFinal desc; ejecucion=registros/pptoFinal; saldoDisponible=pptoFinal-disp; sector nombre del catálogo (código suelto si falta). Implementar. Verde.
- [ ] Step 3: golden de consistencia `sectoresTraslados.golden.test.ts` (parsea fixtures `ingresos`/`gastos`):
  - `traslados(gastoRows).total === 360269421` (= total créditos del gasto de Briceño) y `Σ filas.contracreditos === 360269421` (equilibrio).
  - `inversionPorSectores(gastoRows, sectores)`: `Σ pptoFinal` reconcilia con el total de inversión = `gastoRows.find(r=>r.rubro==='2.3').pptoFinal` (assert `Math.abs(diff) < 1`; si difiere, reportar las filas 2.3 sin CCPET03). Spot-check: el sector con mayor pptoFinal existe y su nombre no es vacío.
- [ ] Step 4: `npm test` verde, build limpio → commit `feat: motores traslados + inversionPorSectores`.

---

### Task 3: UI — paneles, pestañas y secciones del informe

**Files:** create `src/ui/PanelTraslados.tsx`, `src/ui/PanelSectores.tsx` (+ tests); modify `src/App.tsx`, `src/ui/Dashboard.tsx`, `src/ui/Informe.tsx`.

- [ ] Step 1: en `App.tsx`, memos `filasTraslados = gastoRows.length>0 ? traslados(gastoRows) : {filas:[],total:0}` y `filasSectores = gastoRows.length>0 ? inversionPorSectores(gastoRows, sectores) : []` (importar `sectores.json`). Pasar a Dashboard/Informe.
- [ ] Step 2: `PanelSectores` (estilo Editorial fiscal, reusar `DataTable`/kit/`format`/`trafficLight`): un **gráfico de barras** (Recharts, CHART_COLORS) de inversión por sector (pptoFinal o registros) + tabla (Sector, Ppto Final, Registros, %Ejecución con semáforo, Saldo Disponible). `PanelTraslados`: tabla por fuente (Fuente, Créditos, Contracréditos, Diferencia) + un KPI con el total de traslados y una nota de equilibrio (diferencia total = 0 → "equilibrado"). RTL tests: renderizan su título + un dato.
- [ ] Step 3: `Dashboard.tsx`: pestañas "Inversión por sectores" (cuando `filasSectores.length>0`) y "Traslados" (cuando `filasTraslados.filas.length>0`), tras Gastos/Fuentes. Mantener active-by-id + Rules of Hooks.
- [ ] Step 4: `Informe.tsx`: reemplazar las tarjetas "Pendiente de insumo" de **Inversión por sectores** y **Traslados** por secciones reales cuando haya datos (narrativa: sector con mayor gasto/ejecución; total de traslados + equilibrio; tablas con semáforo). Mantener "pendiente" solo si no hay gastos cargados. Ajustar la numeración de secciones.
- [ ] Step 5: `npm test` verde, `npm run build` limpio → commit `feat: paneles Inversión por sectores y Traslados + secciones del informe`.

---

## Self-Review

- Sectores derivado de CCPET03 + catálogo de la plantilla (dato de referencia); sin doble conteo (solo leaves con CCPET03). ✓
- Traslados de cols 19/20 por fuente; total reconcilia con el gasto. ✓
- Fidelidad: validado contra el archivo fuente (no hay golden de plantilla porque la plantilla no calcula estas áreas) — documentado. ✓
- `creditos/contracreditos` opcionales en `GastoRawRow` → mínima ruptura (solo el test del parser de gastos). Goldens de analisisGastos/fuentesYUsos intactos (FilaGasto no cambia). ✓
- UI + informe reemplazan las tarjetas pendientes. ✓
