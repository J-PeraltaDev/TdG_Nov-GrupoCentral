# 0004 · Cloudflare Pages, no Workers

- **Estado:** Aceptada (plan de arranque del Objetivo 3, 6 oct 2026)
- **Requerimientos:** RNF-14, RNF-15 · SDD 4.2.11 y 5.3.7

## Contexto

Cloudflare recomienda hoy Workers para los proyectos nuevos, pero el objetivo del trabajo de
grado y el RNF-14 nombran Cloudflare Pages, y para un sitio estático no hay diferencia práctica.

## Decisión

La aplicación se publica como sitio estático en Cloudflare Pages: comando `npm run build`, salida
`dist`. No hay código de servidor en Cloudflare, ni `wrangler.jsonc`, ni Pages Functions. No se
migra a Workers aunque la documentación o las herramientas lo sugieran.

- **SPA:** el proyecto no incluye un `404.html` de nivel superior a propósito. Sin él, Pages
  asume una aplicación de una sola página y responde todas las rutas con `index.html`
  (verificado en la documentación de Pages el 6 oct 2026).
- **Cabeceras:** `public/_headers` deja `sw.js` y el manifiesto sin caché, marca `/assets/*` como
  inmutables y agrega cabeceras de seguridad básicas.
- **Vistas previas:** una por cada pull request, con sus propias variables de entorno.

## Consecuencias

- El proyecto de Pages lo crea una persona desde el panel, porque pide autorizar GitHub
  (`docs/despliegue/cloudflare-pages.md`).
- Con el modo SPA, una ruta de archivo que no existe devuelve `index.html` con código 200.
- Las cabeceras de `_headers` no aplican a Pages Functions; no importa, porque no se usan.
