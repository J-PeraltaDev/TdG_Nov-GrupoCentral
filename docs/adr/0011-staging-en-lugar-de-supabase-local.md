# 0011 · «staging» como base de desarrollo, sin Docker

- **Estado:** Aceptada por el equipo el 7 oct 2026. Reemplaza la primera viñeta de la decisión
  del ADR 0005 («se desarrolla contra Supabase local»); el resto de ese ADR sigue vigente.
- **Requerimientos:** RNF-11, RNF-14, RNF-15, RNF-17

## Contexto

El ADR 0005 pedía desarrollar contra Supabase local, que necesita Docker. Los equipos del
proyecto son Windows 11 Home sin Docker ni WSL, y el equipo decidió no instalarlo. El plan de
arranque ya traía la alternativa: un segundo proyecto gratuito de Supabase.

## Decisión

- Se creó el proyecto **«staging»** (`qxjnnanjidytbyihanet`, us-east-1, plan gratuito, en la
  organización «Trabajo de Grado»). Es la base de desarrollo, de las pruebas y de las vistas
  previas de Cloudflare Pages.
- **«PROYECTO» (`lyrdsmfalrchbdpmikmt`) sigue siendo producción** y no cambia nada de lo que el
  ADR 0005 dice sobre él.
- Todo se hace con `scripts/staging.mjs`, que llama al CLI de Supabase con la referencia de
  «staging» escrita en el código: no depende de `supabase link` y no puede apuntar a producción
  por accidente.

  | Script                     | Qué hace                                                            |
  | -------------------------- | ------------------------------------------------------------------- |
  | `npm run staging:reset`    | Borra «staging» y lo reconstruye: migraciones + `supabase/seed.sql` |
  | `npm run staging:push`     | Aplica las migraciones que falten, sin borrar datos                 |
  | `npm run staging:test`     | Corre las pruebas pgTAP de `supabase/tests/`                        |
  | `npm run staging:types`    | Regenera `src/core/supabase/database.types.ts`                      |
  | `npm run staging:advisors` | Corre el asesor de seguridad y rendimiento                          |
  | `npm run staging:usuarios` | Pone a los usuarios de prueba la contraseña que cada quien define   |

- **pgTAP sin `pg_prove`.** `supabase test db` necesita Docker. El script envía cada archivo de
  prueba en una sola transacción que termina en `ROLLBACK`, recoge las líneas TAP y falla si
  alguna aserción no pasa o si el plan no coincide. Las pruebas no dejan datos.
- **Contraseñas de prueba fuera del repositorio.** El repositorio es público y «staging» está en
  internet, así que el seed crea los usuarios `@novedades.test` con una contraseña aleatoria que
  nadie conoce. Cada persona define la suya en `.env.local` (`CLAVE_USUARIOS_DE_PRUEBA`, mínimo 8
  caracteres) y la aplica con `npm run staging:usuarios`. Las pruebas de extremo a extremo que
  necesitan ingresar se omiten si la variable no está.
- **El CI no cambia:** GitHub Actions sí tiene Docker, levanta su propia base con `supabase start`
  y corre `supabase test db` en cada PR.

## Consecuencias

- No hace falta Docker en los equipos de desarrollo.
- «staging» es **compartido**: `staging:reset` borra los datos de todos, y dos personas probando
  migraciones distintas al tiempo se pisan. Con un equipo de dos se coordina por chat; conviene
  hacer `staging:reset` solo al empezar una historia de base de datos.
- Las migraciones de una rama se aplican a «staging» antes de la review; si el PR no se aprueba,
  `staging:reset` desde `main` lo devuelve a su estado.
- El plan gratuito pausa un proyecto tras una semana sin uso: si «staging» aparece pausado, se
  reanuda desde el panel.
- Los scripts `db:start`, `db:reset`, `test:db` y `db:types` se conservan para el CI y para quien
  tenga Docker.
- La contraseña de la base de «staging» se generó al azar y no se guardó: el CLI entra con la
  sesión de `supabase login`. Si alguna vez hace falta, se restablece desde el panel.
