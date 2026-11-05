# Auditoría de la interfaz (5 nov 2026)

- **Alcance:** los componentes de `src/core/ui/`, el marco y doce pantallas de los cuatro roles
  (ingreso, mis novedades, registrar, constancia 06, detalle, hoja de rechazo, bandeja, avisos,
  cuenta, historial, escaladas y usuarios), a 360 × 800 y a 1280 × 800.
- **Cómo:** la auditoría técnica de la skill `impeccable` (accesibilidad, rendimiento,
  tematización, responsive e integridad), su detector sobre el código y sobre las pantallas
  renderizadas (por CDP), el contraste de los tokens con la fórmula de `tokens.test.js` y un arnés
  temporal de Playwright con sesión fabricada y API simulada, sin credenciales.
- **Segunda opinión:** Gemini 4 Argon (esfuerzo alto), por el MCP de Antigravity, en la auditoría
  y en la revisión final del diff.
- **Antecedente:** la auditoría externa del 19 oct (punto 50 de `decisiones-pendientes.md`). Lo
  que ahí ya se decidió no se vuelve a proponer.

## Puntaje

| #   | Dimensión     | Antes | Después | Lo principal                                                                      |
| --- | ------------- | ----- | ------- | --------------------------------------------------------------------------------- |
| 1   | Accesibilidad | 3     | 3       | Dos contrastes bajo 4,5:1 que esperan a Figma; los campos ya reciben todo toque   |
| 2   | Rendimiento   | 3     | 4       | Tres barras fijas con un filtro `drop-shadow`; ahora todas usan `box-shadow`      |
| 3   | Tematización  | 3     | 4       | Sombras repetidas a mano y superficies del navegador sin la paleta; resueltas     |
| 4   | Responsive    | 3     | 4       | Sin desbordes a 360 px; campos con 24 px táctiles de 50 y fondo que se desplazaba |
| 5   | Integridad    | 3     | 3       | Sistema coherente; sin movimiento; estados de interacción pendientes (punto 9)    |
|     | **Total**     | 15    | **18**  | De «bueno» a «excelente, con detalles»                                            |

**Veredicto de integridad:** pasa. Los tokens de Figma, los componentes compartidos y las
convenciones se respetan en todo el código; el detector no encontró patrones genéricos en el
código fuente, y los dos que encontró en las pantallas son del diseño (ver «Falsos positivos»).

## Hallazgos

| Prioridad | Hallazgo                                                                                                    | Estado                                                         |
| --------- | ----------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| P1        | «Escalada»: `#a16207` sobre `#fef3c7` da 4,42:1 en texto de 12 px                                           | Pendiente: se corrige primero en Figma (punto 6)               |
| P1        | «Mantenimiento» sobre el gris de su etiqueta da 4,28:1 (el detector lo midió en el detalle)                 | Pendiente: se corrige primero en Figma (punto 51)              |
| P2        | `CampoTexto`, el buscador de listas y el tipo de falla: la caja mide 50 px y solo 20–24 px reciben el toque | **Resuelto** (punto 24)                                        |
| P2        | Sin estado presionado en el teléfono ni `hover` en los botones que no son el primario                       | Pendiente: decisión del equipo (punto 9)                       |
| P2        | Sin movimiento: hojas, diálogos, panel y avisos aparecen de golpe; el ícono de sincronizar no gira          | **Resuelto** (cambio 49 de `cambios-sdd.md`)                   |
| P2        | Movimiento reducido: un bloque global dejaba todo en 0,01 ms, sin una alternativa pensada                   | **Resuelto**: nada se desplaza, los cambios llegan con fundido |
| P3        | Con una hoja abierta, arrastrar sobre el fondo desplazaba la página de atrás                                | **Resuelto** en el teléfono (punto 50)                         |
| P3        | Un filtro `drop-shadow` en tres barras fijas y sombras repetidas a mano en siete lugares                    | **Resuelto**: `shadow-barra` y `shadow-flotante`               |
| P3        | «Cargando…» parpadea cuando la respuesta llega rápido                                                       | **Resuelto**: aparece si la espera pasa de 300 ms              |
| P3        | La selección de texto, el cursor y las barras de desplazamiento usaban los colores del navegador            | **Resuelto**                                                   |
| P3        | Una palabra sola en la última línea de un párrafo («…aunque no haya / internet» en el ingreso)              | **Resuelto**: `text-wrap: pretty`                              |
| P3        | Los contadores «45/500» con cifras de ancho variable                                                        | **Resuelto**: `tabular-nums`                                   |
| P3        | Las clases del botón primario, copiadas en siete enlaces                                                    | Pendiente: opcional (punto 50); va con el punto 9              |

## Movimiento agregado

Solo CSS (0,6 KB de CSS y 0,1 KB de JavaScript comprimidos, sin dependencias). El detalle está en
el cambio 49 de `cambios-sdd.md`:

- En el teléfono la hoja sube desde abajo en 300 ms; en el escritorio la hoja y el diálogo llegan
  con un fundido y un leve escalado en 200 ms, y el panel entra por la derecha en 300 ms.
- Los avisos temporales suben 12 px al aparecer; el ícono «sync» gira mientras se sincroniza.
- La constancia 06 se sella: el círculo llega y el chulo se dibuja de izquierda a derecha.
- La vista previa de la bandeja del escritorio llega con un fundido al cambiar de fila.
- Los cambios de color que ya existían se suavizan en 150 ms; el foco no espera.

## Falsos positivos del detector

- **«Side-tab accent border»** en las tarjetas de las listas: la barra de 4 px es el color de la
  prioridad, dibujado así en Figma (2:36), y la prioridad también va escrita en su pastilla.
- **«Flat type hierarchy»** en el detalle del teléfono: es la escala de texto de Figma (28, 22, 18
  y 16 px).

## Lo que se verificó

- `npm run lint` y Prettier sin hallazgos; `npm run build` correcto.
- Vitest sin las variables de Supabase, como el CI: 1588 pruebas pasan. Falla una
  (`estadoDeSolicitud.test.js`), por el cambio sin confirmar de `CODIGO_RECUPERACION_MAX_INTENTOS`
  en `parametros.js`, que no es de esta auditoría. `HojaActivarNotificaciones.test.jsx` falló una
  vez con la suite y el build corriendo a la vez y pasó 12 de 12 veces sola, con y sin el cambio de
  `Hoja.jsx`: es una prueba que depende del tiempo.
- En Chromium, a 360 × 800 y a 1280 × 800: ningún desborde horizontal y ningún control de menos de
  44 px en el teléfono (antes fallaban los campos del ingreso y la búsqueda de usuarios).
- Cada animación, cuadro a cuadro con la API de animaciones: la hoja empieza fuera de la pantalla y
  llega a su lugar en 300 ms; con movimiento reducido no hay `translate` ni `scale`, solo opacidad.
  Esa revisión encontró que el chulo saltaba entero a mitad del tiempo (`clip-path` no interpola
  hacia `none`); se corrigió con un final explícito.
- El detector, por CDP, sobre las pantallas cambiadas: ningún hallazgo nuevo.

**Sin verificar:** WebKit (no abre en estos equipos; lo cubre el CI), un teléfono real y las
pruebas de extremo a extremo, que necesitan la contraseña de los usuarios de prueba.
