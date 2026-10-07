# 0005 · Base de datos local para desarrollar; «PROYECTO» es producción

- **Estado:** Aceptada (plan de arranque del Objetivo 3, 6 oct 2026). **Ajustada el 7 oct 2026
  por el [ADR 0011](0011-staging-en-lugar-de-supabase-local.md):** el equipo no usa Docker, así
  que se desarrolla contra el proyecto «staging» y no contra Supabase local. Lo demás sigue igual.
- **Requerimientos:** RNF-11, RNF-15, RNF-17

## Contexto

El plan gratuito de Supabase no incluye ramas de base de datos y permite dos proyectos activos.
El proyecto «PROYECTO» (`lyrdsmfalrchbdpmikmt`, us-east-1, Postgres 17) es el que usará la
empresa.

## Decisión

- Se desarrolla contra **Supabase local** (Supabase CLI + Docker): `npm run db:start`,
  `npm run db:reset` y `npm run test:db`. Las migraciones viven en `supabase/migrations/`.
- **«PROYECTO» es producción.** Recibe las migraciones con `supabase db push` solo al cierre de
  cada sprint, después de la review y con el visto bueno del equipo. Nadie —persona o agente—
  le aplica cambios a mano ni con `apply_migration` del MCP.
- Las migraciones se escriben a mano en archivos creados con `supabase migration new`.
- `seed.sql` es solo para el entorno local: datos y usuarios de prueba, nunca nombres reales.
- **Privilegios explícitos.** En «PROYECTO», las tablas nuevas de `public` no quedan expuestas a
  la API de datos por defecto (cambio de Supabase del 30 may 2026). En local,
  `auto_expose_new_tables = false` reproduce ese comportamiento. Cada migración escribe sus
  `GRANT`.

Verificado el 6 oct 2026 en «PROYECTO»: los privilegios por defecto de `postgres` en `public` dan
a `anon` y `authenticated` solo TRUNCATE, REFERENCES, TRIGGER y MAINTAIN sobre las tablas nuevas,
y nada sobre funciones ni secuencias (más el `EXECUTE` a `PUBLIC` propio de Postgres). Por eso
cada tabla empieza con `revoke all … from anon, authenticated` y cada función con
`revoke execute … from public, anon`.

## Consecuencias

- Hace falta Docker en los equipos de desarrollo. Sin Docker, la alternativa del plan es un
  segundo proyecto gratuito de Supabase como «staging».
- El CI levanta su propia base (`supabase start`) y corre pgTAP en cada PR.
- Una vista previa de Pages que apunte a producción vería una base sin las migraciones del sprint.
