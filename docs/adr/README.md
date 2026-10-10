# Decisiones de arquitectura (ADR)

Un archivo corto por decisión: contexto, decisión y consecuencias. Las decisiones «Aceptadas»
no se cambian sin acordarlo con el equipo; si una cambia, se escribe un ADR nuevo que reemplaza
al anterior.

| N.º                                                    | Decisión                                                       | Estado                        |
| ------------------------------------------------------ | -------------------------------------------------------------- | ----------------------------- |
| [0001](0001-javascript-con-jsdoc.md)                   | JavaScript con JSX, JSDoc y tipos generados de Supabase        | Aceptada                      |
| [0002](0002-tailwind-v4-con-tokens-de-figma.md)        | Tailwind CSS v4 con los tokens de Figma                        | Aceptada                      |
| [0003](0003-oxlint-y-prettier.md)                      | oxlint y Prettier                                              | Aceptada                      |
| [0004](0004-cloudflare-pages-no-workers.md)            | Cloudflare Pages, no Workers                                   | Aceptada                      |
| [0005](0005-entorno-local-y-produccion.md)             | Base de datos local para desarrollar; «PROYECTO» es producción | Aceptada; ajustada por 0011   |
| [0006](0006-parametros-configurables.md)               | Parámetros configurables en un solo archivo                    | Aceptada, valores por validar |
| [0007](0007-react-router-declarativo.md)               | API declarativa de React Router                                | Propuesta en el Sprint 0      |
| [0008](0008-service-worker-propio.md)                  | Service worker propio, sin librerías de Workbox                | Propuesta en el Sprint 0      |
| [0009](0009-fuente-e-iconos-locales.md)                | Fuente e íconos como archivos locales                          | Propuesta en el Sprint 0      |
| [0010](0010-control-de-acceso-y-lectura-de-usuario.md) | Control de acceso en la base de datos y lectura de `usuario`   | Propuesta en el Sprint 1      |
| [0011](0011-staging-en-lugar-de-supabase-local.md)     | «staging» como base de desarrollo, sin Docker                  | Aceptada                      |
| [0012](0012-edge-functions-sin-docker.md)              | Edge Functions: despliegue sin Docker y lógica fuera de Deno   | Aceptada                      |
