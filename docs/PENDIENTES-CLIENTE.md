# Pendientes — Plataforma Alcaldías (concreto + por archivo)

Estado al 2026-06-29. Caso base: Municipio de Briceño. El software replica la plantilla con **tolerancia 0** (validado con golden tests).

Insumos que YA tenemos:
- **EJEC-ING** = `19_ejec_ing_combina_clasif.xlsx` (ejecución de ingresos, CCPET/CHIP).
- **EJEC-GAS** = `19_ejec_egr_combina_clasif (1).xlsx` (ejecución de gastos, CCPET; 34 columnas).
- **SICODIS** = `ResumenDistribucionSGPUltimaYOnce.xlsx` (distribución SGP, DNP).
- **PLANTILLA** = `1. Análisis ... Fuentes y Usos V2025 ... Briceño.xlsx` (incluye hojas de clasificadores).

---

## A. Lo que podemos completar SIN el cliente (ya está en los archivos que tenemos)

Esto es trabajo nuestro de ingeniería; **no requiere nada del cliente**, solo confirmación opcional.

| # | Pendiente | Qué falta exactamente | De qué archivo / columna sale |
|---|---|---|---|
| A1 | **Inversión por sectores** (Gráfico 3 + tablas del informe) | Agrupar el gasto de inversión por **sector** (Educación, Salud, Transporte, Agricultura…). Hay que mapear el código programático → sector. | **EJEC-GAS**, columna **CCPET03 — Clasificador Programático de la Inversión Pública** (ya la parseamos como `programatico`). El catálogo sector↔código está en **PLANTILLA**, hoja **`Clasificador Prog. Inversion`** (385 filas) y/o **`CPI`**. → lo extraemos como dato de referencia. *Confirmación opcional del cliente: que use los 12 sectores estándar DNP.* |
| A2 | **Traslados presupuestales** (créditos/contracréditos) | La sección de traslados por fuente (Créditos / Contracréditos / Diferencia). Hoy **descartamos** esas columnas al parsear gastos. | **EJEC-GAS**, columnas **19 "Créditos presupuesto"** y **20 "Contracreditos presupuesto"** (agregadas por fuente CCPET05). Todo está en el archivo; solo hay que parsearlas. |
| A3 | **Indicador 4 — Generación de recursos propios** | Ingresos tributarios / Ingresos corrientes. | **EJEC-ING**: filas de rubro **1.1.01 (tributarios)** y **1.1 (corrientes)** — derivable. *Confirmación opcional: qué rubros considera "tributarios".* |
| A4 | **Indicador 5 — Magnitud de la inversión** | Gasto de capital / Gasto total. | **EJEC-GAS**: rubro **2.3 (inversión)** vs **2 (total)** — derivable. *Confirmar si "gasto de capital" = solo 2.3.* |

---

## B. Lo que SÍ necesitamos del cliente (con el archivo exacto)

| # | Pendiente | Qué necesitamos exactamente | Archivo / fuente que debe enviar el cliente |
|---|---|---|---|
| B1 | **Seguimiento SGP completo** | El export de SGP **del mismo corte** que la ejecución. El que tenemos (`ResumenDistribucionSGPUltimaYOnce.xlsx`) es de **vigencia 2026**, pero la plantilla tiene pegado **Última 2024 / Once 2025** → no coinciden, no hay golden completo. | **SICODIS** descargado de la página del DNP **para el mismo periodo/corte** de la ejecución presupuestal (mismo formato: hojas "Datos Reporte SGP" y "…Detalle"). |
| B2 | **Límite de gasto Concejo y Personería** (Ley 617 arts. 6 y 10) | (a) **N° de sesiones del Concejo** realizadas a la fecha (la plantilla lo deja como entrada manual); (b) confirmar la **categoría del municipio** (define el N° de SMMLV de límite). El **valor del SMMLV** de la vigencia lo ponemos nosotros (dato público; 2026 = $1.750.905). | Dato del **Municipio** (correo/planilla): N° de sesiones del Concejo + categoría. No es un archivo CCPET. |
| B3 | **Indicador 3 — Dependencia (regalías SGR)** | Datos de **Regalías (SGR)**. En los insumos de Briceño **no hay rubros de SGR**; si el municipio recibe regalías, vienen en otro reporte. | Si aplica: el **reporte de ejecución del SGR** (Gesproy/SPGR) o confirmación de que el municipio **no maneja SGR**. |
| B4 | **Indicador 2 — Respaldo del servicio de la deuda** | Definición de **"ingresos disponibles"** (denominador) y confirmar los rubros de **servicio de la deuda** (¿rubro 2.2 completo?). No hay una fórmula en la plantilla. | **Definición** del cliente (correo). Los rubros de deuda ya están en **EJEC-GAS** (rubro 2.2); falta la regla. |
| B5 | **Indicador 6 — Capacidad de ahorro** | Definición de **"ahorro corriente"** y qué entra en **"gastos corrientes"**. | **Definición** del cliente (correo). |
| B6 | **Ley 617 para otros municipios** | (a) **Categoría** (define el límite: 80% = cat. 4/5/6); (b) la **fuente CCPET05** de SGP-Propósito General libre destinación que aplique a esa categoría; (c) confirmar que 3 conceptos que en Briceño **no se descuentan** (Salarios TSE, Estampillas Procultura, Transferencia otras entidades) están bien así. | Dato del **Municipio** + revisión de su **PLANTILLA** equivalente. |
| B7 | **PAC (Plan Anual de Caja mensual)** | La hoja "PAC" de la plantilla está **en blanco** y **no es derivable** de los insumos (la ejecución solo trae "anterior/periodo", no 12 meses). | Definir: ¿captura **manual** en la plataforma, o existe un **reporte mensual** (otro archivo) del que se pueda alimentar? |
| B8 | **Modelos de informe** | El **informe del mismo corte** de los datos y el **informe del año pasado** (los modelos que enviaron no corresponden al corte). | Los **PDF/Word** de esos dos informes, para dejar el contenido idéntico a lo que presentan. |
| B9 | **Catálogo de fuentes CCPET05** | Confirmar si las **234 fuentes** son estándar nacional **estable** o pueden variar por municipio/vigencia (define si lo dejamos fijo o configurable por corte). | Confirmación del cliente (no es archivo). |
| B10 | **Parámetros multi-municipio** | Para usar la plataforma con otros municipios: **nombre, código DANE, categoría, vigencia/corte**. | Por municipio (el nombre ya viene en la fila 1 de EJEC-ING/EJEC-GAS; el corte y la categoría los confirma el cliente). |

---

## C. Estado de las 7 áreas de la plantilla

| Área | Estado | Bloqueo |
|---|---|---|
| Análisis de Ingresos | ✅ tolerancia 0 (237 filas) | — |
| Análisis de Gastos | ✅ tolerancia 0 (628 filas) | — |
| Fuentes y Usos | ✅ tolerancia 0 (234 filas) | — |
| Ley 617 (Indicador 1) | ✅ tolerancia 0 | Concejo/Personería por SMMLV → B2 |
| Seguimiento SGP | ⏸ | B1 (SICODIS del corte) |
| Indicadores 2–6 | ⏸ | A3/A4 (nosotros) + B3/B4/B5 (definiciones) |
| PAC | ⏸ | B7 (sin cálculo en la plantilla) |

**Resumen 1 línea para el cliente:** lo crítico que necesitamos de ustedes es **(B1) el SICODIS del mismo corte**, **(B2) N° de sesiones del Concejo + categoría del municipio**, **(B8) los modelos de informe del corte correcto y del año pasado**, y **(B3–B5) las definiciones de los indicadores 2, 3 y 6** (más datos de regalías si el municipio las maneja). Inversión por sectores y traslados los completamos nosotros con los archivos que ya tenemos.
