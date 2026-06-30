# Sistema de diseño — "Editorial fiscal"

Dirección visual elegida para la Plataforma Alcaldías: **editorial premium, claro, papel cálido, identidad verde bosque + dorado**, tipografía serif editorial para títulos y grotesca + mono para datos. Sofisticado, con carácter (tipo revista financiera de alta gama), cómodo para leer tablas largas. NO es un dashboard financiero genérico.

Esta es la fuente de verdad. Todo color va por **tokens** (CSS variables / Tailwind). Nada de azul/naranja por defecto, nada de Inter/Roboto/Arial.

## Tipografías (Google Fonts)

- **Display / títulos:** `Fraunces` (serif editorial, opsz variable). Para h1–h3, números KPI grandes, portada de informe.
- **UI / cuerpo:** `Archivo` (grotesca con carácter). Texto, labels, botones, celdas de tabla.
- **Cifras / mono:** `Spline Sans Mono` (tabular). Para TODOS los valores numéricos (KPIs, tablas, ejes) — usar `font-variant-numeric: tabular-nums`.

En `index.html` (head): preconnect + un solo `<link>` a:
`https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600;9..144,700&family=Archivo:wght@400;500;600;700&family=Spline+Sans+Mono:wght@400;500;600&display=swap`

## Tokens de color (CSS variables en `:root`)

```css
--paper:        #f3f0e8;  /* fondo lienzo, papel cálido */
--surface:      #fbf9f4;  /* superficie de tarjetas */
--surface-2:    # efe d e3 -> #efe ... usar #f6f3ec  /* zebra/hover suave */
--ink:          #15241d;  /* texto principal (verde casi negro) */
--ink-soft:     #5e6d63;  /* texto secundario/muted */
--line:         #e4ded2;  /* hairlines/bordes sobre papel */
--forest:       #0e5c46;  /* primario, emerald profundo */
--forest-700:   #0c4d3a;
--forest-deep:  #0a3a2c;  /* fondo del sidebar */
--forest-ink:   #08312569 -> usar #073025  /* fondo sidebar más profundo (gradiente) */
--gold:         #c0892d;  /* acento cálido (dorado) */
--gold-soft:    #e6c87c;
--clay:         #b24a33;  /* negativos / déficit / alertas */
--teal:         #2a8c7a;  /* secundario para gráficos */
--sage:         #6fa08c;  /* terciario gráficos */
--sand:         #d9b679;  /* cuaternario gráficos */
```

(Los valores con espacios arriba son erratas tipográficas; usar: `--surface-2: #f6f3ec;` y `--forest-ink: #073025;`.)

Texto sobre el sidebar oscuro: claro `var(--paper)`; muted `#8fb3a6`; activo/acento `var(--gold-soft)`.

## Paleta de gráficos (cohesiva, por tokens)

Constante `CHART_COLORS` (en `src/ui/charts.ts`), en este orden:
`['#0e5c46' (forest), '#c0892d' (gold), '#2a8c7a' (teal), '#b24a33' (clay), '#6fa08c' (sage), '#d9b679' (sand), '#0c4d3a' (forest-700), '#8a5a16' (gold-deep)]`
Más helpers: `AXIS = '#9a8f7a'` (texto ejes), `GRID = '#e4ded2'` (líneas guía). Tooltip: fondo `--surface`, borde `--line`, texto `--ink`, cifras mono.

## Tailwind (extend en `tailwind.config.js`)

- `colors`: mapear todos los tokens (`paper`, `surface`, `surface-2`, `ink`, `ink-soft`, `line`, `forest`{DEFAULT,700,deep,ink}, `gold`{DEFAULT,soft}, `clay`, `teal`, `sage`, `sand`) a sus `var(--…)`.
- `fontFamily`: `display: ['Fraunces','serif']`, `sans: ['Archivo','system-ui','sans-serif']`, `mono: ['"Spline Sans Mono"','monospace']`.
- `borderRadius`: `card: '16px'`, `xl2: '20px'`.
- `boxShadow`: `card: '0 1px 2px rgba(20,36,29,.04), 0 16px 34px -20px rgba(10,61,46,.25)'`, `pop: '0 24px 48px -24px rgba(10,61,46,.35)'`.

## Base (`src/index.css`)

- `body`: `background: var(--paper); color: var(--ink); font-family: Archivo`.
- **Grano sutil**: overlay fijo con `feTurbulence` (SVG data-uri) a `opacity: .04`, `pointer-events:none`, `z-index:0`; `#root { position:relative; z-index:1 }`.
- h1–h3 → `font-family: Fraunces`, con `letter-spacing:-.01em` y peso 500–600.
- Clase utilitaria `.num { font-family:'Spline Sans Mono',monospace; font-variant-numeric:tabular-nums; }` para cifras.
- Scrollbars finos en el área de contenido (opcional).

## Formato de cifras (helpers compartidos en `src/ui/format.ts`)

- `fmtMoneda(n)` → `n.toLocaleString('es-CO', { maximumFractionDigits: 0 })` (pesos, sin decimales para KPIs/tablas grandes; mantener 2 decimales solo donde la fidelidad visual lo pida — pero los valores subyacentes NO se redondean, es solo display).
- `fmtPct(n)` → `(n*100).toLocaleString('es-CO',{maximumFractionDigits:2}) + ' %'`.
- `fmtMill(n)` → millones para ejes: `(n/1e6).toLocaleString('es-CO',{maximumFractionDigits:0]) + ' M'`.
- `truncar(s, max=40)` → corta con `…` (para nombres largos de fuente/rubro en ejes y celdas, con `title` completo).

## Kit de componentes (`src/ui/kit.tsx`)

Componentes presentacionales reutilizables (todos con los tokens):

- `Card({title?, action?, children, className})`: superficie `bg-surface`, `rounded-card`, `border border-line`, `shadow-card`, padding generoso. Si `title`, encabezado con `SectionHeading`.
- `SectionHeading({children, kicker?})`: `kicker` opcional en mayúsculas, tracking, color `gold`, tamaño xs; título en `font-display`, `text-ink`, ~text-lg/xl. Acompañar con una **regla fina** (hairline `--line`) debajo a lo ancho — sello editorial.
- `StatTile({label, value, delta?, tone?})`: tarjeta KPI editorial. `label` xs uppercase `ink-soft`; `value` grande en `font-display` (o mono si es cifra pura) ~text-3xl; `delta` opcional (chip con flecha ↗/↘, verde/clay). Borde superior de 3px en color de acento (forest o gold) como detalle.
- `Badge({tone, children})`: pill. tones: `ok` (fondo verde claro `#e3f0ea`/texto forest), `alert` (clay), `neutral` (line/ink-soft), `gold`.
- `Kicker` / divisor `SectionDivider` (hairline con un cuadrito gold a la izquierda).

## Tabla de datos (`src/ui/DataTable.tsx`)

Componente genérico para reemplazar el estilo crudo de las tablas:
- Contenedor `overflow-auto rounded-card border border-line bg-surface shadow-card`, con altura máx y **thead pegajoso** (`sticky top-0`).
- `thead`: fondo `forest-deep` (oscuro) con texto `paper`, xs uppercase tracking, peso 600; o alternativamente fondo `surface-2` con texto `ink` y borde inferior 2px forest — **elige el thead oscuro forest** para contraste editorial.
- Filas: hover `bg-surface-2`; zebra muy sutil; borde inferior hairline `--line` (sin grid completo, estilo editorial — solo líneas horizontales).
- Celdas numéricas: clase `.num`, alineadas a la derecha; texto a la izquierda. Primera columna (rubro/código) `whitespace-nowrap` y peso medio.
- API: `DataTable({columns, rows})` donde `columns: {key, label, align?, num?, format?, width?, nowrap?}[]`. Mantener accesible (thead con th scope="col").

## Layout — AppShell (`src/ui/AppShell.tsx`)

Reemplaza el layout de tabs superior por **sidebar + contenido**:

- **Sidebar** (fijo, ancho ~268px, `bg-forest-deep` con gradiente sutil a `--forest-ink`, texto claro, `shadow-sidebar`):
  - **Brand** arriba: una marca geométrica simple (p. ej. un cuadrado/rombo gold con iniciales) + "Plataforma Alcaldías" en `font-display` claro + caption "Análisis Presupuestal CCPET" en `#8fb3a6` xs.
  - **Estado de insumos**: 3 mini-filas (Ingresos / Gastos / SGP) con punto/check (gold si válido, contorno si pendiente) — refleja qué se cargó.
  - **Navegación**: items verticales (Cargar insumos + las áreas disponibles). Item activo: fondo `rgba(255,255,255,.06)`, **barra izquierda gold de 3px**, texto claro; inactivo: `#8fb3a6` con hover. Iconos opcionales (usar caracteres/sutiles, sin librería pesada; o un set mínimo inline SVG).
  - **Footer**: chip de contexto (municipio · corte) y, si quieres, "v MVP".
- **Main**: 
  - **Topbar**: título del área en `font-display` (text-xl/2xl) + subtítulo/kicker; a la derecha acciones: botón **"Imprimir / Informe"** (abre la vista de informe / `window.print()`), y un chip de corte. Botón primario: `bg-forest text-paper rounded-xl px-4 py-2 hover:bg-forest-700`; secundario: contorno `border-line`.
  - **Contenido**: `max-w-[1200px] mx-auto px-6/8 py-6/8`, sobre el papel con grano. Animación de entrada sutil (fade/translate con stagger por tarjeta usando `animation-delay`; CSS-only).
- **Responsive**: en pantallas pequeñas el sidebar colapsa a una barra superior (aceptable simplificar para MVP, pero no romper).

## Estado de carga (empty state)

Cuando no hay análisis, el `main` muestra un **hero editorial**: título grande en Fraunces ("Carga los insumos del corte"), copy breve, y **3 dropzones** (restyle de `SlotInsumo`) como tarjetas grandes con borde punteado `--line`, icono, título, descripción y, tras cargar, el estado de validación (✓ verde / errores en clay con lista). Drag-over: resaltar con borde gold. Mantener la funcionalidad y los textos existentes (los tests RTL verifican textos).

## Gráficos (restyle de `PanelResumen`)

- Usar `CHART_COLORS`, `AXIS`, `GRID`. Quitar el azul/naranja por defecto.
- Tooltip y leyenda con tokens (texto `ink`, cifras mono).
- **Arreglar el solape de etiquetas de "Top 10 fuentes"**: truncar el nombre de la fuente a ~32–36 chars con `…` (y `title`/tooltip con el nombre completo), dar `width` suficiente al eje Y (≈260), `tick` fontSize 11, e `interval={0}`. Considerar mostrar solo el código o "código — nombre corto". Altura proporcional al número de barras.
- KPIs del Resumen: usar `StatTile` del kit (no las tarjetas crudas actuales).
- Barras con `radius` superior, color `forest`/`gold`; pie con `CHART_COLORS` y labels legibles (sin solape; usar leyenda + % en tooltip).

## Restyle de paneles existentes

- `PanelLey617`: hero del indicador como `StatTile` grande (gauge/medidor: barra horizontal del % vs límite 0.8, con marca del límite en gold y relleno forest; badge Cumple/No Cumple). Tabla de desglose con `DataTable`.
- `PanelIndicadores`: Indicador 1 como tarjeta destacada (mismo medidor); 2–6 como tarjetas con borde punteado y nota "No calculado en la plantilla" (badge neutral/gold).
- Tablas (`TablaIngresos/Gastos/FuentesYUsos`): migrar a `DataTable` + helpers de formato. Mantener todas las columnas y textos actuales (los tests verifican `getByText`).

## Restricciones

- **No romper tests**: los tests RTL verifican textos (`getByText`) y los golden tests son de motor (no UI). El restyle debe conservar los textos visibles y no tocar `src/engine/**` ni `src/parsers/**` ni `*.golden.*`. La suite completa debe quedar verde.
- **Build limpio** (`npm run build`), sin errores TS.
- Accesibilidad básica: contraste suficiente, `th scope`, foco visible en nav/botones, `aria-label` en el botón de imprimir.
- Sin librerías pesadas nuevas salvo las ya presentes (Recharts ya está). Iconos: SVG inline mínimos, no una librería.
