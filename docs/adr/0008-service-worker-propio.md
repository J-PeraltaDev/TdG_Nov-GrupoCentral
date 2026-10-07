# 0008 · Service worker propio, sin librerías de Workbox

- **Estado:** Propuesta en el Sprint 0, para confirmar en la revisión
  (`docs/decisiones-pendientes.md`, punto 7)
- **Requerimientos:** RNF-03, RNF-05, RF-31 · SDD 4.2.4 (C-04)

## Contexto

La decisión del stack es `vite-plugin-pwa` con `strategies: 'injectManifest'` y
`registerType: 'prompt'`, con un service worker propio en `src/sw.js`. Lo habitual es importar en
ese archivo `workbox-precaching` y `workbox-routing`, pero no están en la lista de dependencias
aprobadas.

## Decisión

`src/sw.js` no importa nada. El plugin le inyecta la lista de archivos de la versión
(`self.__WB_MANIFEST`) y el resto se hace con la API Cache Storage:

1. **Instalación:** descarga todos los archivos a una caché cuyo nombre incluye una huella del
   manifiesto. Si uno falla, la instalación falla y el navegador reintenta después.
2. **Navegaciones:** responde con el `index.html` precacheado, así la app abre sin red.
3. **Otros archivos propios:** de la caché si están precacheados; si no, de la red.
4. **Otros orígenes (Supabase incluido):** no los toca.
5. **Actualización:** la versión nueva espera hasta que la persona pulsa «Actualizar»; al
   activarse borra las cachés anteriores.
6. **Push:** manejadores vacíos, listos para el Sprint 5.

Verificado el 6 oct 2026 con el build real: precaché de 11 archivos, apertura sin servidor en `/`
y en una ruta cualquiera, aviso de nueva versión, actualización y borrado de la caché anterior.

## Consecuencias

- Cada versión vuelve a pedir todos los archivos; los que tienen hash en el nombre salen de la
  caché HTTP, porque `_headers` los marca como inmutables.
- El equipo mantiene unas 70 líneas que Workbox ya tiene probadas. Cambiar a `workbox-precaching`
  es reemplazar los manejadores `install`, `activate` y `fetch`; el resto no cambia.
- `vite-plugin-pwa` instala por su cuenta `workbox-build` (para inyectar el manifiesto) y
  `workbox-window` (para registrar el service worker y detectar la versión nueva): son
  dependencias del plugin, no del proyecto.
