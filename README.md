# SnapForge (glowShot)

Aplicación de escritorio y web para componer **mockups** con marco personalizable, fondos en degradado, zoom, exportación a PNG y galería local de creaciones. Construida con **SvelteKit**, **TypeScript**, **Tailwind CSS** y **Tauri 2**.

---

## Requisitos

| Entorno | Versión recomendada |
|--------|---------------------|
| [Node.js](https://nodejs.org/) | 20+ |
| [Rust](https://www.rust-lang.org/) | Solo si compilas la app de escritorio (`tauri build` / `tauri dev`) |

---

## Instalación

```bash
git clone <repo-url> glowShot
cd glowShot
npm install
```

---

## Desarrollo

### Solo frontend (navegador)

Sirve la UI con Vite; ideal para iterar en componentes sin Rust.

```bash
npm run dev
```

Abre la URL que muestre la consola (por defecto `http://localhost:5173`).

> Algunas funciones dependen de **Tauri** (portapapeles nativo, diálogo de guardado, icono en la barra de menú, captura «Seleccionar snap»). En el navegador verás la interfaz, pero esas rutas pueden comportarse distinto o no estar disponibles.

### App de escritorio (Tauri)

Arranca el frontend y el runtime nativo.

```bash
npm run tauri:dev
```

La primera compilación de Rust puede tardar varios minutos.

---

## Scripts npm

| Script | Descripción |
|--------|-------------|
| `npm run dev` | Servidor de desarrollo Vite (SvelteKit). |
| `npm run build` | Build estático del frontend (`adapter-static`). |
| `npm run preview` | Previsualiza el build de producción. |
| `npm run check` | `svelte-check` + comprobación TypeScript. |
| `npm run tauri:dev` | Desarrollo con ventana nativa Tauri. |
| `npm run tauri:build` | Genera instalables/bundles según la plataforma. |

---

## Funciones principales

### Editor

- **Marco**: tamaño según proporción (16:9, 4:3, 1:1, auto), padding, radios y sombra.
- **Mockup**: dashboard de ejemplo con barra tipo ventana (macOS / Windows / sin cromo).
- **Fondo**: degradados predefinidos o color sólido.
- **Imagen propia**: importación por archivo o arrastrar y soltar sobre el marco; sustituye al mockup mientras haya imagen.
- **Zoom** (25–150 %) y barra flotante inferior.
- **Herramienta mano**: activa el desplazamiento del lienzo arrastrando el **fondo** (no el contenido del marco).
- **Centrar vista**: restablece el desplazamiento del lienzo.
- **Empezar de nuevo**: vacía el marco; opción de **guardar antes** en «Mis creaciones».
- **Guardar / Copy / Export**: miniatura o PNG según acción; toasts en lugar de `alert` donde aplica.

### Mis creaciones

- Galería en **localStorage** (hasta 48 entradas), deduplicación por hash de imagen.
- Vista previa y eliminación por tarjeta.

### Plantillas

- Pestaña reservada para futuras plantillas.

### Escritorio (Tauri)

- **Exportación**: diálogo nativo de guardado y escritura con plugin **fs** (en web: descarga).
- **Portapapeles**: rutas nativas para imagen PNG cuando el WebView limita el portapapeles.
- **Icono en la barra de menú del sistema** (macOS): menú con *Mostrar SnapForge*, *Seleccionar snap…* (captura interactiva con `screencapture` en macOS), *Salir*.
- La captura «Seleccionar snap» importa el resultado al marco del editor.

---

## Estructura del código (resumen)

```
src/
├── lib/
│   ├── components/snapforge/   # UI principal (cabecera, lienzo, paneles, galería)
│   ├── export/                 # Captura PNG, export, copiar
│   ├── snapforge/              # Puente clipboard / acciones de cabecera
│   ├── stores/                 # Estado (editor, creaciones, toasts)
│   └── utils/
src-tauri/                      # Rust: Tauri, bandeja, integración captura (macOS)
```

---

## Build de producción

**Frontend:**

```bash
npm run build
```

**Instalable Tauri** (después del build del frontend o usando el hook de `tauri.conf.json`):

```bash
npm run tauri:build
```

Los artefactos dependen del SO (`.app` en macOS, `.msi`/`.exe` en Windows, etc.).

---

## Permisos (macOS)

- La primera vez que uses **captura de pantalla** o **Seleccionar snap**, macOS puede pedir acceso a **grabación de pantalla** o **archivos** según la acción.
- Si el portapapeles falla en el WebView, la app intenta rutas alternativas (incl. Tauri nativo).

---

## Licencia

Indica aquí la licencia del proyecto si aplica.

---

## Créditos

- UI con [Svelte 5](https://svelte.dev/), [SvelteKit](https://kit.svelte.dev/), [Tailwind CSS](https://tailwindcss.com/).
- Escritorio con [Tauri](https://tauri.app/).
- Iconos [Lucide](https://lucide.dev/).
- Rasterizado del marco: [html-to-image](https://github.com/bubkoo/html-to-image).
