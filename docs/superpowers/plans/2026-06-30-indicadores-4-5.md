# Plan 11 — Indicadores 4 y 5 (DNP) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:subagent-driven-development. Steps use checkbox (`- [ ]`).

**Goal:** Calcular y mostrar los indicadores DNP **#4 Generación de recursos propios** y **#5 Magnitud de la inversión** (derivables de ingresos/gastos ya calculados), dejando la base de cálculo explícita. Indicadores 2/3/6 siguen como definición (pendientes de insumo/definición del cliente).

**Nota de fidelidad:** la plantilla NO calcula estos indicadores (la hoja "Indicadores" es documental), por lo que NO hay golden tolerancia-0 contra la plantilla. Se validan contra el **archivo fuente** (los numeradores/denominadores son filas agregadas ya validadas a tolerancia 0). La elección de base (recaudo / compromisos) queda explícita en la UI para confirmación del cliente.

**Tech Stack:** React 18, TS, Vite, Tailwind, Vitest. Rama actual `feat/sectores-traslados` → se ramifica `feat/indicadores-4-5`.

## Global Constraints

- **#4 Recursos propios** = `ingresoTributarios / ingresoCorrientes`, base **recaudo**: tributarios = `FilaIngreso` rubro `'1.1.01'` campo `ingreso`; corrientes = rubro `'1.1'` campo `ingreso`. `valor = corrientes!==0 ? trib/corr : 0`.
- **#5 Magnitud de la inversión** = `inversion / gastoTotal`, base **compromisos**: inversión = `FilaGasto` rubro `'2.3'` campo `registros`; gasto total = rubro `'2'` campo `registros`. `valor = total!==0 ? inv/total : 0`.
- Motor puro; IEEE-754 sin redondeo; identificadores English/camelCase, UI español. No tocar motores/parsers/golden previos.

Valores de control (Briceño): #4 tributarios=6.577.853.241,83 / corrientes=15.240.418.188,64 → ≈ 0,4316. #5 denominador (gasto total compromisos) = 20.174.379.502,57.

---

### Task 1: Motor `indicadoresDnp` + validación

**Files:** modify `src/types.ts`; create `src/engine/indicadoresDnp.ts`, `src/engine/indicadoresDnp.test.ts`, `src/engine/indicadoresDnp.golden.test.ts`.

**Interfaces:**
- `type IndicadorDnp = { numerador: number; denominador: number; valor: number; numeradorLabel: string; denominadorLabel: string; baseNota: string }`
- `type IndicadoresDnp = { recursosPropios: IndicadorDnp; magnitudInversion: IndicadorDnp }`
- `function indicadoresDnp(filasIngreso: FilaIngreso[], filasGasto: FilaGasto[]): IndicadoresDnp`

- [ ] Step 1 (TDD): unit test con FilaIngreso/FilaGasto sintéticos: rubro '1.1.01' ingreso=400, '1.1' ingreso=1000 → recursosPropios.valor=0.4; rubro '2.3' registros=750, '2' registros=1000 → magnitudInversion.valor=0.75; denominador 0 → valor 0; rubro ausente → 0. Labels/baseNota presentes.
- [ ] Step 2: implementar `indicadoresDnp` (find por rubro exacto; `?? 0`; guardas /0→0). baseNota: '#4 base recaudo'/'#5 base compromisos' (texto claro).
- [ ] Step 3: golden de consistencia `indicadoresDnp.golden.test.ts` — parsea fixtures (ingresos→analisisIngresos, gastos→analisisGastos), corre `indicadoresDnp`, asserta: `recursosPropios.numerador === 6577853241.83` (rubro 1.1.01 recaudo), `recursosPropios.denominador === 15240418188.64` (rubro 1.1 recaudo); `magnitudInversion.denominador === 20174379502.57` (rubro 2 compromisos), `magnitudInversion.numerador > 0` y `valor === inv/total`. (Ata los números al archivo fuente.)
- [ ] Step 4: `npm test` verde, build limpio → commit `feat: motor indicadoresDnp (#4 recursos propios, #5 magnitud inversión)`.

---

### Task 2: Mostrar #4 y #5 en la vista Indicadores y en el Informe

**Files:** modify `src/ui/PanelIndicadores.tsx` (+ su test), `src/App.tsx`, `src/ui/Dashboard.tsx` (si hace falta pasar props), `src/ui/Informe.tsx`.

- [ ] Step 1: `App.tsx` memo `indicadoresExtra = (ingresoRows.length>0 && gastoRows.length>0) ? indicadoresDnp(filasIngreso, filasGasto) : undefined`. Pasar a PanelIndicadores (vía Dashboard) y al Informe.
- [ ] Step 2: `PanelIndicadores`: además del Indicador 1 (Ley 617, con semáforo) y las definiciones 2–6, ahora **#4 y #5 muestran VALOR** (tarjeta con el %, numerador/denominador en mono, y la `baseNota` como leyenda pequeña). Quitar el "No calculado en la plantilla" de #4 y #5 (reemplazar por una nota "Cálculo metodología DNP — base: …, sujeto a confirmación"). #2/#3/#6 conservan "No calculado / pendiente de definición". Mantener textos que asserten los tests (ajustar el test si cambia el marcador de #4: el test actual verifica el título '4. Generación de recursos propios' y "No calculado…" — actualizar ese test para reflejar que #4 ahora muestra valor; mantener que #2/#3/#6 sí dicen "No calculado").
- [ ] Step 3: `Informe.tsx`: en la sección de indicadores/Ley 617 (o una subsección "Otros indicadores"), añadir #4 y #5 con su valor y base. Conciso.
- [ ] Step 4: `PanelIndicadores.test.tsx`: actualizar para pasar `indicadoresExtra` y asertar que #4 muestra su % y #6 sigue como "No calculado". RTL.
- [ ] Step 5: `npm test` verde, `npm run build` limpio → commit `feat: indicadores #4 y #5 con valor en vista e informe`.

---

## Self-Review
- #4/#5 derivados de filas agregadas ya validadas; base explícita para confirmación. ✓
- Sin golden de plantilla (no los calcula) → validado vs archivo fuente. ✓
- #2/#3/#6 siguen pendientes (requieren definición/insumo del cliente). ✓
- No se tocan motores/golden previos. ✓
