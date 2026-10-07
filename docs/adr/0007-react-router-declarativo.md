# 0007 · API declarativa de React Router

- **Estado:** Propuesta en el Sprint 0, para confirmar en la revisión
- **Requerimientos:** RNF-05 (presupuesto de 200 KB comprimidos en la ruta de ingreso) · SDD 6.1.11

## Contexto

React Router 8 ofrece dos formas de declarar rutas: la declarativa (`BrowserRouter`, `Routes`,
`Route`) y la de datos (`createBrowserRouter`, `RouterProvider`). Se midió el peso de cada una
con el build de producción de este proyecto (6 oct 2026, gzip):

| Paquete                          | JavaScript comprimido |
| -------------------------------- | --------------------- |
| React + React DOM                | 68,3 KB               |
| + React Router, API declarativa  | 81,4 KB (+13 KB)      |
| + React Router, API de datos     | 98,1 KB (+30 KB)      |
| `@supabase/supabase-js` (aparte) | 55,0 KB               |

## Decisión

Se usa la API declarativa, con `React.lazy` y `Suspense` para cargar bajo demanda las rutas de
cada rol. Ahorra unos 17 KB comprimidos en la ruta de ingreso.

## Consecuencias

- No hay `loader` ni `action`: los datos se piden desde hooks y repositorios de `core/supabase`,
  que es lo que describe el SDD (capas C-02 y C-03).
- Las páginas cargadas con `React.lazy` usan `export default`.
- La ruta de ingreso queda, estimada, en unos 185 KB: React y el router (81) + Supabase (55) +
  fuente (27) + CSS (5) + registro del service worker (2) + código propio (≈15). Es un margen
  estrecho frente a los 200 KB: hay que medirlo en cada PR del Sprint 1.
