# generador-de-ordenes-ceot

App de una sola página (`index.html` + `imagenes_b64.js`) para generar en PDF las
órdenes de honorarios y presupuestos de CEOT / Clínica Colón, a partir de una
planilla de Google Sheets. Se publica sola en GitHub Pages al hacer push a `master`
(`https://febo983.github.io/generador-de-ordenes-ceot/`).

## Deploy

- `git push origin master` publica en 1-2 minutos. **Siempre confirmar con el
  usuario antes de pushear** — no hay ambiente de staging, master es producción.
- GitHub Pages cachea con `max-age=600`. Si el usuario dice "no veo el cambio",
  es casi siempre caché del navegador — pedirle `Cmd+Shift+R`, no asumir que el
  deploy falló.

## jsPDF — trampas conocidas

- Unit siempre `'cm'`.
- `addImgFit()` (la función original para el logo/sello de las órdenes) asume el
  formato angosto `PW=11, PH=22` y hace un flip de coordenadas Y pensado para ESE
  tamaño de página. **No reusar `addImgFit` en páginas A4** (presupuesto, parte de
  quirófano) — ya rompió una vez (imagen invisible, sin error en consola porque el
  catch la traga silenciosamente). Para A4 usar un `imgFit()` local con coordenadas
  top-down normales (ver `generarBlobPresupuesto`).
- Los sellos/firmas de médicos y el logo de la clínica viven en `imagenes_b64.js`
  como `IMAGENES.sellos`, `IMAGENES.firmas`, `IMAGENES.logoClinica` (base64). Se
  buscan por `normalizar(doctor)` contra el array `SK` de apellidos conocidos.

## Datos de la planilla (Google Sheets)

- `filtrar()` en `index.html` mapea columnas del CSV por índice (0-based). Hay dos
  bloques de índices (`ix`): el primero (columnas B-S) es el que usan todas las
  filas reales hoy. El segundo (`else if(row[17]...)`) es un fallback casi seguro
  muerto de una versión vieja del form — **no confiar en sus índices**, quedaron
  desalineados la última vez que se insertaron columnas nuevas (R, S, T) sin
  actualizarlo. No tocarlo salvo que aparezca un bug reproducible ahí.
- `esVacio(s)` trata `''`, `'-'` y `'no'` (case-insensitive) como vacío. Importante
  para decidir si una línea de orden se genera o no.
- `esPresupuesto(entidad)`: si la columna ENTIDAD es `Particular`, `IOMA` o `PAMI`
  (normalizado), el paciente genera el formulario de presupuesto (GPI-FOR-001) en
  vez de las órdenes de honorarios.

## Verificar cambios antes de pushear

1. `node --check` sobre el `<script>` inline — ahora automático via el hook
   `PostToolUse` en `.claude/settings.json` (corre `.claude/hooks/check-syntax.js`).
2. Generar un PDF de prueba real: levantar el server con `preview_start` (nombre
   `generador-ordenes-ceot`, usa `.claude/launch.json` — el de **este proyecto**,
   no el global de `~/.claude/`), llamar la función `generarBlob*` desde
   `javascript_exec` con un paciente de prueba, y **mirar el PDF renderizado**
   (Read tool sobre el archivo descargado), no solo confirmar que no tira excepción.
   Los bugs de layout de jsPDF (texto pisado, imagen invisible, coordenadas mal)
   no generan errores de JS.
3. Chrome bloquea descargas automáticas repetidas sin gesto de usuario real —
   si `descargar()` deja de generar archivo después de la segunda o tercera vez
   seguida, no es un bug de la app: abrir una pestaña nueva o hacer el click real
   con el tool de `computer`.

## Convenciones de UI/estilo ya establecidas

- Paleta: naranja `--or` / dorado `--go` para lo existente; celeste `#38bdf8`
  para el módulo de presupuesto (para diferenciarlo visualmente del resto).
- Patrón de panel desplegable (checkboxes que se completan antes de generar el
  PDF): ver `.presu-p` / `togglePresu()` — mismo patrón que el panel de
  Prequirúrgicos (`.preq-p` / `togglePreq()`). Reusar ese patrón para futuros
  formularios con checks.
