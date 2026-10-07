# 0001 · JavaScript con JSX, JSDoc y tipos generados de Supabase

- **Estado:** Aceptada (plan de arranque del Objetivo 3, 6 oct 2026)
- **Requerimientos:** RNF-14 · SDD, Tabla 7

## Contexto

El SDD fija el frontend en «React con Vite, escrito en JavaScript moderno con JSX». Pasar a
TypeScript obligaría a actualizar el SDD y suma curva de aprendizaje a un equipo de dos personas
con cinco semanas de desarrollo.

## Decisión

El cliente se escribe en JavaScript con JSX. Para tener autocompletado y detectar errores de
nombres, se usan comentarios JSDoc y los tipos que genera Supabase a partir de la base de datos
(`npm run db:types` → `src/core/supabase/database.types.ts`), que se consumen así:

```js
/** @typedef {import('../supabase/database.types').Database['public']['Enums']['estado_novedad']} EstadoNovedad */
```

`jsconfig.json` configura el editor; no hay paso de compilación de tipos ni `tsc` en el CI.

## Consecuencias

- El archivo de tipos es el único `.ts` del cliente. Lo genera el CLI y se regenera después de
  cada migración, en el mismo commit; no se edita a mano.
- Los errores de tipos no rompen el build: los detectan el editor y las pruebas.
- Las Edge Functions (Sprint 3) sí van en TypeScript sobre Deno, como dice el SDD.
