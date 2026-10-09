# 0012 · Edge Functions: despliegue sin Docker y lógica fuera de Deno

- **Estado:** Aceptada el 9 oct 2026 (plan del Sprint 3, decisiones 1 a 6).
- **Requerimientos:** RF-02, RF-03, RNF-11, RNF-13, RNF-14, RNF-17 · SDD 4.2.10 y 5.3.4

## Contexto

El SDD pone en Edge Functions lo que necesita la clave secreta de Supabase: crear y suspender
cuentas (`gestionar-usuario`) y fijar una contraseña con un código temporal
(`restablecer-contrasena`). Son las primeras del proyecto.

Los equipos son Windows 11 sin Docker ni WSL (ADR 0011) y tampoco tienen Deno. `supabase functions
serve` y el empaquetado normal de `supabase functions deploy` necesitan Docker: no hay cómo ejecutar
una función en el equipo antes de desplegarla.

## Decisión

1. **Se despliega con `supabase functions deploy --use-api`,** que empaqueta en el servidor. Va
   detrás de `npm run staging:functions`, con la referencia de «staging» escrita en
   `scripts/staging.mjs`, igual que los demás comandos: no puede apuntar a producción.
2. **La entrada de Deno es mínima y la lógica vive en módulos puros.** `index.ts` solo lee las
   variables, crea el cliente de Supabase y llama a `manejar(cuerpo, dependencias)`. Las
   validaciones, las reglas por rol y la forma de las respuestas están en archivos `.js` que no
   importan nada de Deno ni de `npm:`. Se prueban con Vitest en entorno `node`, con las
   dependencias simuladas, junto a las demás pruebas (`npm run test`).
3. **El recorrido completo se prueba contra «staging» desplegado,** y las pruebas de extremo a
   extremo lo recorren desde la aplicación.
4. **El CI revisa cada entrada con `deno check`** (acción `denoland/setup-deno`). No es una
   dependencia del repositorio; es la única revisión estática de lo que solo corre en Deno.
5. **Claves.** La función crea su cliente de administración con
   `JSON.parse(Deno.env.get('SUPABASE_SECRET_KEYS'))['default']`, que inyecta la plataforma. Nadie
   copia la clave secreta: no va al repositorio, a `.env.local` ni a Pages. No se usan las
   variables antiguas (`SUPABASE_SERVICE_ROLE_KEY`).
6. **Quién puede llamarlas** (SDD, Tabla 23):
   - `gestionar-usuario` deja activa la comprobación de la plataforma (`verify_jwt = true`), que
     rechaza lo que no trae un token de sesión válido. Dentro, obtiene la identidad con
     `auth.getClaims(token)` y lee el perfil en `usuario`: si no existe, no está activo o no es
     administrador, responde 403. Nunca decide con los metadatos del token.
   - `restablecer-contrasena` va con `verify_jwt = false`: no hay sesión y la validez la da el
     código.
7. **CORS con lista cerrada.** Se devuelve el origen solo si es el servidor de desarrollo, la
   vista previa local, producción o una vista previa de Pages. Nunca `*`.
8. **Un `deno.json` por función,** con `npm:@supabase/supabase-js` en la misma versión que usa la
   aplicación, y nada más. No se adopta `@supabase/server`, que hoy recomienda la documentación:
   sería una dependencia nueva.
9. **Los errores llevan el cuerpo `{ codigo, campos }`,** con los códigos de la Tabla 22 donde
   aplican. El repositorio del cliente los convierte en el mismo error que ya traduce
   `core/errores`.

## Comprobado el 9 oct 2026, contra «staging»

- El despliegue sin Docker funciona y empaqueta lo que cada función importa de `_shared/` (y no
  las pruebas).
- `verify_jwt` se toma de `supabase/config.toml`: quedó activo en `gestionar-usuario` y
  desactivado en `restablecer-contrasena`.
- La función recibe sus variables: `gestionar-usuario` arranca y crea su cliente.
- La consulta previa del navegador (`OPTIONS`) llega a la función aunque `verify_jwt` esté activo.
- A un origen de la aplicación se le devuelve su origen; a uno ajeno, nada.
- Sin token, o con uno inventado, `gestionar-usuario` responde 401 antes de ejecutar el código.

**Falta comprobar** que con el token de un administrador la función lo reconoce y que con el de
otro rol responde 403: hay que ingresar con un usuario de prueba.

## Consecuencias

- Un error que solo existe en Deno (una importación, una variable) aparece al desplegar o al
  invocar, no antes. Lo acotan la entrada mínima, `deno check` en el CI y los registros de
  «staging».
- Cuando la plataforma rechaza una petición (401 sin token), responde ella y no la función: el
  cuerpo es `{ code, message }` y trae `Access-Control-Allow-Origin: *`. El cliente trata ese 401
  por su estado, como una sesión vencida.
- La regla de la contraseña existe dos veces, en `supabase/functions/_shared/contrasena.js` y en
  `src/core/utils/contrasena.js`, porque una función no puede importar de `src/`. Una prueba falla
  si una cambia sin la otra.
- «staging» es compartido: un despliegue reemplaza la función para todos. Se despliega desde la
  rama de la historia, como las migraciones.
- A «PROYECTO» las funciones llegan al cierre del sprint, con el OK del equipo, con el mismo
  comando y su referencia. Lo hace una persona.
