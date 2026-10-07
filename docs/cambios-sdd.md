# Cambios frente al SDD y al SRS

El SDD y el SRS son documentos vivos. Cada vez que la implementación se aparta de ellos, se anota
aquí, en el mismo PR, con la sección afectada y el texto propuesto, para que Mateo y Juan
actualicen los documentos (lo exige la Definition of Done).

| N.º | Sprint | Documento y sección                         | Qué cambia                                                                                                             | Estado    |
| --- | ------ | ------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- | --------- |
| 1   | S0     | SDD 4.2.4 (C-04) y plan de arranque («PWA») | Precisión, no cambio: el service worker precachea con código propio, sin las librerías de Workbox                      | Propuesto |
| 2   | S0     | SDD 5.2 («Sistema de diseño»)               | Precisión: los íconos de Figma son la fuente Material Symbols Rounded; en el código son SVG locales del mismo conjunto | Propuesto |

## 1 · Service worker sin librerías de Workbox (S0)

**Sección:** SDD 4.2.4, ficha de C-04, fila «Función».

**Qué pasa.** El SDD no nombra Workbox, así que no hay contradicción. Se anota porque el plan lo
daba por supuesto al elegir `vite-plugin-pwa`: el plugin solo inyecta la lista de archivos de la
versión publicada y el precaché lo hace `src/sw.js` con la API Cache Storage (unas 60 líneas).
Razón: `workbox-precaching` y `workbox-routing` no están en la lista de dependencias aprobadas.

**Texto propuesto (agregar al final de la fila «Función»):**

> El precaché se implementa con la API Cache Storage en el propio service worker: cada versión
> publicada usa una caché con nombre propio y las anteriores se eliminan al activarse la nueva.

Si prefieren usar `workbox-precaching`, es un cambio de pocas líneas en `src/sw.js` (ver
`docs/decisiones-pendientes.md`, punto 7).

## 2 · Íconos como SVG locales de Material Symbols (S0)

**Sección:** SDD 5.2, párrafo «Sistema de diseño».

**Texto propuesto (agregar una frase):**

> Los íconos corresponden al conjunto Material Symbols Rounded (Google, licencia Apache 2.0); en
> la aplicación se incluyen como archivos SVG locales, sin cargar la fuente de íconos, para
> mantener liviana la carga inicial (RNF-05) y funcionar sin conexión.

---

_Para el Sprint 1 ya está identificado un cambio real (la lectura de `usuario` y los privilegios
por columna, SDD 6.1.4 y Tabla 31). Se registra aquí en el PR que lo implemente._
