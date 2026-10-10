# Sistema de Diseño: PassLive

**Versión:** 1.2 "Verde Mate"
**Tipo:** Guía de Estilo y Arquitectura UI
**Dominio:** Ticketing, Validación Bluetooth (BLE) y Control de Acceso
**Estándar de Accesibilidad:** WCAG 2.1 AA

---

## 1. Resumen y Contexto

PassLive es una plataforma integral para la venta y validación de entradas a espectáculos (locales, discotecas, arenas). Su sistema de diseño está pensado para ofrecer **fiabilidad táctica** en torniquetes y puntos de acceso, combinando dos canales de validación:

- **Bluetooth Beacon (BLE):** verificación pasiva de proximidad en el punto de acceso.
- **Códigos QR dinámicos:** escaneo activo con verificación estricta de edad (+18/+21) y acreditación VIP.

### Principios de diseño

| Atributo | Valor |
|---|---|
| Estilo visual | Verde Mate / Matte Green |
| Validación | Dual: Bluetooth BLE + QR 2D |
| Accesibilidad | WCAG 2.1 AA (contraste mínimo 4.5:1) |
| Uso operativo | Locales nocturnos, discotecas, arenas |
| Tono | Sobrio, orgánico, alta visibilidad en baja luminosidad |

**ADN de diseño:** acabado verde mate apagado, sin reflejos molestos, optimizado para entornos de sala con iluminación nocturna.

---

## 2. Paleta Cromática

### 2.1 Color primario — Matte Green / Verde Mate Corporativo

Base cromática del sistema. Se usa para acciones principales, marca, acentos y estados activos.

| Token | Hex | Uso recomendado |
|---|---|---|
| `--color-brand-50` | `#F0FDF4` | Fondos suaves, hover en modo claro |
| `--color-brand-100` | `#DCFCE7` | Fondos de badge claro |
| `--color-brand-200` | `#BBF7D0` | Bordes suaves, divisores |
| `--color-brand-300` | `#86EFAC` | Texto de acento sobre fondos oscuros |
| `--color-brand-400` | `#4ADE80` | Acentos, indicadores activos |
| `--color-brand-500` | `#2D6A4F` | **Verde mate corporativo principal** |
| `--color-brand-600` | `#1B4332` | Verde mate profundo — hover, énfasis |
| `--color-brand-700` | `#081C15` | Fondos oscuros de marca |
| `--color-brand-800` | `#061611` | Superficies oscuras profundas |
| `--color-brand-900` | `#030B08` | Fondos casi negros |

### 2.2 Colores de acento (Accent)

Colores semánticos reservados para estados, categorías de ticket y elementos VIP.

| Token | Hex | Significado |
|---|---|---|
| `accent-lime` | `#A3E635` | Acento energético, disponibles |
| `accent-amber` | `#F59E0B` | **VIP Gold** — acreditación premium |
| `accent-emerald` | `#10B981` | Confirmación, escaneo correcto |
| `accent-violet` | `#8B5CF6` | Categorías especiales / analytics |

### 2.3 Neutros y superficies (Slate)

| Token | Hex | Uso |
|---|---|---|
| `slate-850` | `#151E2E` | Superficies elevadas en modo oscuro |
| `slate-950` | `#0B1120` | Fondo base en modo oscuro |

Además, el sistema extiende la paleta nativa de Tailwind:

- **`stone`**: paleta neutra principal para fondos y textos (`bg-stone-50` en claro / `bg-stone-950` en oscuro).
- **`emerald`**: alias de confirmación utilizada ampliamente para estados activos.

### 2.4 Modo claro / Modo oscuro

El sistema utiliza `darkMode: 'class'` de Tailwind. El cambio de tema se realiza añadiendo/quitando la clase `dark` en el elemento `<html>`, con transición suave:

```css
transition-colors duration-200
```

| Elemento | Modo claro | Modo oscuro |
|---|---|---|
| Fondo body | `bg-stone-50` | `bg-stone-950` |
| Texto body | `text-stone-800` | `text-stone-100` |
| Superficie card | `bg-white` | `bg-stone-900` |
| Borde | `border-stone-200` | `border-stone-800` |

---

## 3. Tipografía y Escala

### 3.1 Familias tipográficas

| Rol | Fuente | Fallback stack |
|---|---|---|
| Sans (cuerpo, UI) | **Inter** | `system-ui, -apple-system, sans-serif` |
| Mono (tokens, hex, código) | **JetBrains Mono** | `Fira Code, Courier New, monospace` |

### 3.2 Pesos cargados

- **Inter:** `300` (light) · `400` (regular) · `500` (medium) · `600` (semibold) · `700` (bold) · `800` (extrabold)
- **JetBrains Mono:** `400` · `500` · `600`

### 3.3 Escala tipográfica utilizada

| Rol | Clase | Tamaño | Notas |
|---|---|---|---|
| Título principal H1 | `text-3xl sm:text-4xl font-extrabold` | 30px → 36px | `tracking-tight` |
| Título de sección H2 | `text-2xl font-bold` | 24px | `tracking-tight` |
| Subtítulo H3 | `text-base font-semibold` | 16px | Encabezados de bloque |
| Cuerpo destacado | `text-base sm:text-lg leading-relaxed` | 16px → 18px | Párrafos introductorios |
| Cuerpo estándar | `text-sm` | 14px | Texto general |
| Metadatos / etiquetas | `text-xs` | 12px | Badges, labels, ayudas |
| Micro / mono tokens | `text-[10px]` · `text-[11px]` | 10px / 11px | Hex, contadores, códigos |

### 3.4 Reglas tipográficas

- Los títulos usan `tracking-tight` para reforzar la sobriedad visual.
- El cuerpo aplica `antialiased` en el `<body>`.
- Los valores técnicos (hex, IDs, tokens) **siempre** en `font-mono`.
- Las etiquetas de sección (eyebrows) usan `uppercase tracking-wider text-xs font-bold`.

---

## 4. Sistema de Espaciado

El sistema se basa en la escala por defecto de Tailwind (unidad base = `0.25rem` = **4px**).

### 4.1 Escala de referencia

| Token | Valor | Uso típico |
|---|---|---|
| `1` | 4px | Separación mínima entre iconos y texto |
| `2` | 8px | Padding interno de badges pequeños |
| `3` | 12px | Separación entre iconos y labels |
| `4` | 16px | Gap entre elementos de grid |
| `6` | 24px | Padding de contenedores medianos |
| `8` | 32px | Separación vertical entre secciones |
| `16` | 64px | Separación entre bloques principales (`space-y-16`) |

### 4.2 Patrones aplicados

- **Contenedor principal:** `px-4 sm:px-6 lg:px-8 py-8 gap-8`
- **Cabecera:** `px-6 py-3.5` (padding asimétrico horizontal/vertical)
- **Cards:** `p-6` o `p-8` para bloques destacados
- **Listas:** `space-y-1`, `space-y-4`, `space-y-16` según densidad
- **Iconos + texto:** `space-x-2.5` o `space-x-3`

---

## 5. Bordes, Radios y Sombras

### 5.1 Radios (border-radius)

| Clase | Valor | Uso |
|---|---|---|
| `rounded-lg` | 8px | Botones, badges, nav items |
| `rounded-xl` | 12px | Logo, cards pequeñas, paneles |
| `rounded-2xl` | 16px | Cards principales, secciones destacadas |
| `rounded-full` | 9999px | Pills, avatares, indicadores de estado |

### 5.2 Bordes

| Contexto | Modo claro | Modo oscuro |
|---|---|---|
| Estándar | `border-stone-200` | `border-stone-800` |
| Superficies elevadas | `border-stone-200` | `border-stone-700` |
| Marca / énfasis | `border-emerald-800/40` con opacidad | — |

Grosor siempre `1px` (`border` por defecto). No se usan bordes de 2px salvo en focus states.

### 5.3 Sombras

| Clase | Uso |
|---|---|
| `shadow-xs` | Cabecera, barras fijas |
| `shadow-sm` | Cards, logo contenedor |
| `shadow-xl` | Bloques hero/secciones destacadas |

### 5.4 Scrollbar personalizada

```css
.custom-scrollbar::-webkit-scrollbar { width: 6px; }
.custom-scrollbar::-webkit-scrollbar-track { background: rgba(0,0,0,0.05); }
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: rgba(45,106,79,0.3);
  border-radius: 9999px;
}
```

---

## 6. Catálogo de Componentes

### 6.1 Cabecera fija (Top Bar)

- Posición: `sticky top-0 z-50`
- Fondo translúcido: `bg-white/90 dark:bg-stone-900/90 backdrop-blur-md`
- Borde inferior y sombra ligera
- Estructura: logotipo + identificador + estado en vivo + toggle de tema

### 6.2 Logotipo (Brand Mark)

```
w-9 h-9 rounded-xl
bg-gradient-to-br from-emerald-600 to-brand-600
text-white shadow-sm
ring-2 ring-emerald-500/20
```

Contiene un icono SVG de ticket (stroke 2, tamaño 20×20).

### 6.3 Badge / Pill de estado

- **Versión del sistema:** `text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800` (claro) / `dark:bg-emerald-950/70 dark:text-emerald-300`
- **Estado en vivo:** punto con `w-2 h-2 rounded-full bg-emerald-500 animate-pulse` + label `text-xs`
- **Eyebrow de sección:** `px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-semibold uppercase tracking-wider border border-emerald-500/30`

### 6.4 Botón toggle (tema)

```
px-3.5 py-1.5 text-xs font-semibold rounded-lg
bg-stone-100 hover:bg-stone-200
dark:bg-stone-800 dark:hover:bg-stone-700
border border-stone-200 dark:border-stone-700
transition-colors
```

Incluye icono a la izquierda (emoji 🌙/☀️) y etiqueta de texto.

### 6.5 Navegación lateral (Sidebar)

- Anchura fija: `w-64`
- Visible solo desde `lg:` (`hidden lg:block`)
- Pegajosa: `sticky top-24 self-start`
- Altura máxima: `max-h-[calc(100vh-7rem)]`
- Scrollbar personalizada (`custom-scrollbar`)

**Item de navegación:**

```
flex items-center space-x-2.5
px-3 py-2 text-sm font-medium rounded-lg
text-stone-700 dark:text-stone-200
hover:bg-emerald-50 dark:hover:bg-emerald-950/40
hover:text-emerald-700 dark:hover:text-emerald-300
transition-colors
```

Icono SVG `w-4 h-4 text-emerald-600` a la izquierda.

**Encabezado de grupo:**

```
text-xs font-bold text-stone-400 dark:text-stone-500
uppercase tracking-wider px-3 mb-2
```

### 6.6 Card de información / "ADN de Diseño"

```
mt-8 p-4 rounded-xl
bg-stone-100 dark:bg-stone-900
border border-stone-200 dark:border-stone-800
text-xs
```

Incluye título (`font-semibold`), descripción y bloque mono con tokens clave.

### 6.7 Sección Hero

```
p-8 rounded-2xl
bg-gradient-to-br from-emerald-900 via-stone-900 to-stone-950
text-white shadow-xl
border border-emerald-800/40
relative overflow-hidden
```

Contiene un halo decorativo (`bg-emerald-500/10 rounded-full blur-3xl`) posicionado en la esquina superior derecha con `pointer-events-none`.

**Grid de especificaciones internas:** `grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-stone-800`.

### 6.8 Card de sección

```
bg-white dark:bg-stone-900
rounded-2xl p-6
border border-stone-200 dark:border-stone-800
shadow-sm
```

### 6.9 Muestra de color (Color Swatch)

Estructura de dos niveles dentro de un contenedor redondeado:

- **Superior:** `h-16` con el color de fondo y etiqueta numérica `text-[10px] font-mono` alineada al fondo (`items-end p-2`).
- **Inferior:** `p-2.5 bg-stone-50 dark:bg-stone-800 text-xs` con el hex `font-mono text-[11px] font-semibold`.

### 6.