# Diseño — Plataforma de Análisis Presupuestal CCPET (Alcaldías)

- **Fecha:** 2026-06-29
- **Estado:** Aprobado para escribir plan de implementación
- **Caso de validación:** Municipio de Briceño (corte 31-05-2025)

## 1. Propósito

Reemplazar con software una plantilla Excel "súper potente" que un analista usa hoy para
hacer el análisis financiero de la ejecución presupuestal de un municipio colombiano.

Hoy el flujo es manual:

1. El analista descarga 3 insumos de plataformas públicas del gobierno.
2. Pega los datos a mano en una plantilla Excel (23 hojas).
3. La plantilla calcula 7 áreas de análisis financiero mediante fórmulas.

El objetivo del MVP es codificar **toda esa lógica de cálculo** en una app React, de modo
que los resultados sean **idénticos** a la plantilla (tolerancia 0 — coincidencia exacta).
La generación de informes (PDF/Word) queda explícitamente para una **fase 2**; lo crítico
ahora es la **consistencia de los datos**.

## 2. Decisiones de alcance (acordadas)

| Decisión | Resolución |
|---|---|
| Áreas a replicar | **Las 7 completas**: Análisis de Ingresos, Análisis de Gastos, Fuentes y Usos, Seguimiento SGP, Ley 617, PAC, Indicadores |
| Ingesta de insumos | **Ambas vías**: subir el `.xlsx` descargado (vía principal) y pegado manual (respaldo, porque a veces la fuente no exporta bien) |
| Arquitectura | **100% cliente** (sin backend) + **persistencia local** (IndexedDB) para reabrir cortes previos |
| Generalidad | **Cualquier municipio**; Briceño es el primer caso/validación. Clasificadores nacionales embebidos + parámetros del municipio configurables |
| Presentación | **Tablas web limpias** con valores idénticos + **export a Excel** |
| Enfoque del motor | **Lógica de dominio en TypeScript + golden tests** (leer fórmulas de la plantilla para reconstruir la lógica, validar contra valores reales) |
| Tolerancia de fidelidad | **0 — coincidencia exacta** valor a valor |
| Informes | **Fase 2** (propuesta posterior); no entran en el MVP |

## 3. Contexto del dominio (CCPET)

Los insumos siguen el **CCPET** (Catálogo de Clasificación Presupuestal para Entidades
Territoriales), estándar nacional. Por eso la estructura es genérica entre municipios.

### 3.1 Insumos

| Insumo | Origen | Contenido (observado en los archivos de Briceño) |
|---|---|---|
| Ejecución de Ingresos (`19_ejec_ing_combina_clasif.xlsx`) | CHIP / CCPET | 1 hoja, ~241 filas × 27 col. Encabezado en fila 4. Columnas: `Código Rubro presupuestal`, `Descripción`, clasificadores CCPET01/02/04/05/07/08/30/50/82/83/84/86, y columnas de valores |
| Ejecución de Gastos (`19_ejec_egr_combina_clasif (1).xlsx`) | CHIP / CCPET | 1 hoja, ~633 filas × 34 col. Encabezado en fila 4. Columnas: `Código rubro presupuestal`, `Descripción`, clasificadores CCPET01/02/03/04/05/30/50/80/81/83/84/85, y valores (CDP/RP/Obligaciones/Pagos…) |
| SICODIS SGP (`ResumenDistribucionSGPUltimaYOnce.xlsx`) | DNP – SICODIS | 2 hojas: `Datos Reporte SGP` (resumen, ~37 filas) y `Datos Reporte SGP Detalle` (~18 filas) |

Los modelos de informe (PDF `Inf_pptp_Briceño_140526.pdf` y DOCX `Seguimiento presupuestal…`)
son **guías de estilo de fase 2**; según el cliente NO corresponden al corte de estos datos
(se hicieron para un empalme a mitad de mayo). No son salida a replicar en el MVP.

### 3.2 La plantilla (referencia de verdad)

Archivo `1. Análisis Ejecución de Ingresos y Gastos Fuentes y Usos V2025 Corte 31-05-2026
Briceño.xlsx` (21 MB, 23 hojas). Contiene **fórmulas** (permiten reconstruir la lógica) y
**valores ya calculados** de Briceño (sirven como golden de prueba).

Hojas relevantes:

- **Entrada** (donde hoy se pega): `Ejecución de Ingresos`, `Ejecución de Gastos`,
  `Ejec Gast Combin Clasific` y variantes.
- **Salidas de análisis (las 7 áreas):**
  - `Análisis de Ingresos` — cols: Rubro, Nombre, CCPET02/05/83, Presupuesto Inicial,
    Adiciones, Reducciones, Presupuesto Final, Ingreso, % Ingreso, Proyección, Observaciones.
  - `Análisis de Gastos` — cols: Rubro, Descripción, CCPET01/02/03/05/81/83, Presupuesto
    Inicial/Final, Disponibilidades, Saldo Disponible, Registros, Saldo de disponibilidades,
    Orden de Pago, Saldo registro, Egresos, Egresos en papeles, Saldo Órdenes de Pago.
  - `Fuentes y Usos` — cols: Código, Descripción Fuente, Ppto Inicial/Final Ingresos,
    Ppto Inicial/Final Gastos, Diferencias, Recaudo, % Recaudo, Disponibilidades,
    Compromisos, % Compromisos, Obligaciones, Pagos, Saldo en Presupuesto, Disponibilidades
    sin Compromiso, Reservas, Cuentas por Pagar, Superávit/Déficit, ECB.
  - `Seguimiento SGP` — ficha SGP por entidad.
  - `Ley 617` — indicador Ley 617 (ingresos base, gastos de funcionamiento, relación).
  - `PAC` — programación mensual (ENERO…DICIEMBRE) por rubro (p. ej. PREDIAL).
  - `Indicadores` — autofinanciación y otros indicadores.
- **Clasificadores:** `CCPET - Igresos` (sic, 458 filas: Código/Nivel/Tipo/Nombre),
  `CCPET - Gastos` (759 filas), `CPI` (2228 filas), `Clasificador Prog. Inversion`
  (385 filas), `UniEjec` (unidades ejecutoras), y catálogos de Fuentes.

## 4. Arquitectura

App React 100% cliente; build estático que se sirve/abre manualmente en el MVP.

```
Navegador
  ├─ UI (carga insumos, config municipio, tablas por área, export)
  ├─ parsers       (xlsx/paste → filas normalizadas)
  ├─ engine        (7 funciones puras + clasificadores + config → resultados)
  ├─ exporters     (resultados → Excel)
  └─ persistence   (Dexie / IndexedDB: municipios y cortes)
Sin backend. Los datos financieros nunca salen del equipo.
```

### 4.1 Stack

- **React 18 + TypeScript + Vite** — SPA, build estático.
- **SheetJS (`xlsx`)** — parseo de insumos y export.
- **Dexie** — IndexedDB tipado para municipios/cortes.
- **Vitest** — golden tests (núcleo de la fidelidad).
- **Tailwind CSS** — tablas limpias.

## 5. Módulos (aislados y testeables)

```
src/
  parsers/
    ingresos.ts        # ejec. ingresos (xlsx o texto) → IngresoRow[]
    gastos.ts          # ejec. gastos → GastoRow[]
    sicodis.ts         # SICODIS SGP → SgpRow[]
  classifiers/
    *.json             # CCPET ingresos/gastos, CPI, prog. inversión, UniEjec, fuentes
    index.ts           # loaders tipados
  engine/
    analisisIngresos.ts
    analisisGastos.ts
    fuentesYUsos.ts
    seguimientoSGP.ts
    ley617.ts
    pac.ts
    indicadores.ts     # cada uno: función PURA, sin estado ni DOM
  exporters/
    toExcel.ts
  persistence/
    db.ts              # Dexie
  types.ts             # Municipio, Corte, Insumos, Resultado, *Row
  ui/                  # componentes React
```

Cada función del `engine` recibe **insumos normalizados + clasificadores + config del
municipio** y devuelve la tabla de su área. Al ser puras, son exactamente lo que cubren los
golden tests.

## 6. Modelo de datos

```ts
type Municipio = { id: string; nombre: string; categoria: string; departamento?: string }
type Corte     = { id: string; municipioId: string; vigencia: number; fechaCorte: string }

type Insumos = {
  ingresosRaw: IngresoRow[]
  gastosRaw:   GastoRow[]
  sgpRaw:      SgpRow[]
}

type Resultado = {
  analisisIngresos: FilaIngreso[]
  analisisGastos:   FilaGasto[]
  fuentesYUsos:     FilaFuenteUso[]
  seguimientoSGP:   FichaSGP
  ley617:           IndicadorLey617
  pac:              FilaPAC[]
  indicadores:      Indicadores
}
```

Las formas exactas de cada `Fila*` se derivan de los encabezados de la plantilla (ver §3.2)
y se fijan al reconstruir cada hoja durante la implementación.

## 7. Flujo de datos

```
subir/pegar insumos
   → parsers (normalizan a *Row[])
   → engine (7 funciones puras + clasificadores + config municipio)
   → Resultado
   → ui (tablas por área)  /  exporters (Excel)  /  persistence (guardar corte)
```

## 8. Estrategia de fidelidad (el corazón)

Tolerancia **0**: cada valor calculado debe ser exactamente igual al de la plantilla.

1. Extraer de la plantilla de Briceño los **valores calculados** de cada hoja de análisis →
   fixtures JSON en `golden/`.
2. Tomar los **insumos crudos** de Briceño como entrada de prueba.
3. Por cada área: `engine(insumosBriceño, clasificadores, configBriceño) === golden[area]`,
   comparación valor a valor con **tolerancia 0**.
4. Leer las **fórmulas** de la plantilla (no solo los valores) para reconstruir la lógica
   exacta de cada columna calculada antes de escribir el código.

Regla: un área no se considera "lista" hasta que su golden test pasa con coincidencia exacta.

Nota sobre tolerancia 0: la comparación se hará sobre el valor numérico almacenado por la
plantilla (no sobre el texto formateado). Si aparecieran diferencias por representación de
punto flotante de Excel, se documentará el caso puntual; el criterio de aceptación sigue
siendo igualdad exacta del valor calculado.

## 9. Ingesta de insumos

- **Vía principal:** subir el `.xlsx` descargado. El parser localiza la hoja y la fila de
  encabezado esperadas (fila 4 en ejec. ingresos/gastos) y normaliza.
- **Respaldo:** pegado manual (tabla/área de texto) cuando la fuente no exporta bien.
- **Validación al cargar:** verificar hoja correcta, encabezados esperados y totales de
  control. Mensaje claro si el archivo no es el reporte esperado o cambió el formato.

## 10. Manejo de errores

- Insumo no reconocido → mensaje específico indicando qué se esperaba.
- Encabezados/columnas faltantes → señalar cuáles.
- Clasificador sin coincidencia para un rubro → registrar y advertir (no fallar en silencio).

## 11. Persistencia

Dexie/IndexedDB guarda `Municipio`, `Corte` y sus `Insumos`/`Resultado` para reabrir
análisis previos sin servidor. Todo permanece en el equipo del usuario.

## 12. Export

`exporters/toExcel.ts` genera un `.xlsx` con los valores idénticos de las 7 áreas. La
réplica visual exacta del layout de la plantilla no es requisito del MVP (las tablas web son
limpias; el Excel exporta los valores correctos).

## 13. Plan de fases (orden de implementación)

Se construyen las 7 áreas; orden propuesto para validar el método cuanto antes:

1. Scaffold (Vite+React+TS+Tailwind+Vitest+Dexie) + `parsers` + extracción de clasificadores
   a JSON + extracción de goldens desde la plantilla.
2. **Análisis de Ingresos** end-to-end con su golden test (prueba el método de fidelidad).
3. **Análisis de Gastos**.
4. **Fuentes y Usos**.
5. **Seguimiento SGP**, **Ley 617**, **PAC**, **Indicadores**.
6. Export a Excel + persistencia (Dexie) + UI pulida (tablas por área, config municipio,
   carga/pegado de insumos).

## 14. Fuera de alcance (MVP)

- Generación de informes PDF/Word (fase 2).
- Backend / multiusuario / despliegue en la nube (por ahora manual y local).
- Réplica visual celda a celda del layout de la plantilla.

## 15. Criterios de aceptación del MVP

- Cargando los insumos crudos de Briceño, las 7 áreas producen valores **exactamente iguales**
  a la plantilla (golden tests en verde, tolerancia 0).
- Funciona para otro municipio cambiando insumos + config (clasificadores nacionales fijos).
- Soporta subir `.xlsx` y pegado manual.
- Exporta resultados a Excel y persiste cortes localmente.
