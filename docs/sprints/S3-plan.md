# Sprint 3 · Plan de implementación

- **Fechas:** 26–30 oct 2026 (5 días, sin festivos). El equipo va adelantado: se puede empezar antes
  si lo aprueba.
- **Historias:** HU-13, HU-15, HU-04, HU-03 y HU-02 (RF-13, RF-15, RF-04, RF-03 y RF-02)
- **Estado:** aprobado el 9 oct 2026, con los puntos propuestos. El equipo dejó las 47 decisiones a
  criterio de la implementación: quedan con la recomendación de cada una, salvo la 30, que cambió
  (el equipo pidió redactar la política de tratamiento de datos). Lo que cambie en la review se
  ajusta en el PR que corresponda.

**Meta:** el director aprueba o rechaza lo escalado; el reportante confirma el cierre o dice que la
falla persiste; el administrador crea, edita y desactiva usuarios y fincas, y atiende las
solicitudes de recuperación de contraseña.

**Incremento que se demuestra:** el ciclo completo de una novedad con escalamiento y cierre
confirmado (registrar → tomar → escalar → aprobar → resolver → confirmar), y un administrador que
crea una cuenta y le recupera la contraseña.

## Punto de partida (verificado el 9 oct 2026, 1:15 p. m., en `docs/S2-informe`)

| Verificación                | Resultado                                                                                 |
| --------------------------- | ----------------------------------------------------------------------------------------- |
| `main` en GitHub            | `41d78bf` (Sprint 1). Ningún PR del Sprint 2 está fusionado                               |
| PR del Sprint 2             | #8 a #17 abiertos; #8, #9 y #10 listos para review y #11 a #17 en borrador                |
| Rama con todo el Sprint 2   | `docs/S2-informe` (`6113730`, PR #17)                                                     |
| Dependencias                | 458 paquetes auditados, 0 vulnerabilidades, `package-lock.json` sin cambios (ver la nota) |
| `npm run lint`              | Sin advertencias                                                                          |
| `npm run format:check`      | Correcto                                                                                  |
| `npm run test`              | 41 archivos, 600 pruebas: 599 pasan y 1 falla esperada (`it.fails`)                       |
| `npm run build`             | Correcto. Ruta de ingreso: 149,3 + 7,8 + 26,8 + 2,2 ≈ 186,1 KB de 200 (quedan ≈ 13,9 KB)  |
| `npm run staging:test`      | 12 archivos, 460 aserciones, 0 fallidas                                                   |
| `npm run staging:advisors`  | 9 avisos WARN: 7 por las funciones RPC y 2 de Auth. Ninguno nuevo                         |
| Edge Functions en «staging» | Ninguna desplegada; `supabase/functions/` solo tiene `.gitkeep`                           |
| CLI de Supabase             | 2.120.0. `supabase functions deploy` trae la opción `--use-api` («sin usar Docker»)       |
| Deno en el equipo           | **No está instalado.** Hay Node 24.14.0 y Python 3.14.3                                   |
| `npm run test:e2e:chromium` | **Sin correr:** necesita la contraseña de los usuarios de prueba                          |

Las cifras coinciden con las del cierre del Sprint 2. Diferencias y datos nuevos:

- **`npm ci` no terminó.** El servidor de desarrollo estaba abierto (`npm run dev`) y Windows no
  dejó borrar un binario que tenía cargado; `npm ci` alcanzó a vaciar `node_modules` antes de
  fallar. Se restauró con `npm install`, que respeta el archivo de bloqueo, y el servidor siguió
  respondiendo. Quedaron tres carpetas temporales dentro de `node_modules` (no se suben): se van con
  el próximo `npm ci` hecho con el servidor cerrado.
- **Los puntos del Sprint 2 no están en `docs/S2-informe`.** `backlog.md` y `backlog.json` los
  tienen solo en la rama `docs/S2-plan` (PR #8), que sale de `main` y no forma parte de la cadena.
  Llegan a `main` cuando se fusione el #8.
- **«staging»** tiene hoy 7 usuarios, 3 fincas, 114 novedades y 6 tipos de falla (los que crearon
  las pruebas), PostgreSQL 17.11 y `pgcrypto` 1.3 en el esquema `extensions`. Sus tokens de sesión
  se firman con una clave asimétrica (ES256).
- **El Sprint 2 no tocó** `scripts/staging.mjs`, `supabase/config.toml`, `package.json`,
  `vite.config.js` ni el CI: la base de las Edge Functions (PR 1) puede salir de `main`.

## Antes de empezar

| Necesidad                                                               | Para qué                                                                                     | Estado al 9 oct 2026                                                                                                       |
| ----------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| Aprobar este plan, los puntos y las decisiones del final                | Sin eso no se escribe código del sprint                                                      | **Hecho.** Las decisiones quedaron a criterio de la implementación                                                         |
| **Revisar y fusionar el Sprint 2 (#8 a #17), en su orden**              | El Sprint 3 edita los mismos archivos; ver «Base de las ramas»                               | **Pendiente, y es de una persona.** El equipo se lo encargó al agente, pero el entorno no le permite fusionar sin revisión |
| Empezar antes del 26 oct                                                | El calendario dice 26–30 oct                                                                 | **Hecho:** el equipo pidió continuar                                                                                       |
| Desplegar Edge Functions en «staging»                                   | Es la primera vez; se hace con `npm run staging:functions` y solo en «staging»               | Se hace en el PR 1                                                                                                         |
| `deno check` en el CI (herramienta nueva, solo en el CI)                | En los equipos no hay Deno: es la única revisión estática de las funciones                   | **Sí** (decisión 2)                                                                                                        |
| Decir si el agente corre las pruebas que ingresan o las corre el equipo | Las e2e y la prueba de `gestionar-usuario` con la sesión del administrador de prueba         | **Pendiente.** Mientras tanto quedan escritas y sin correr                                                                 |
| Política de tratamiento de datos (Ley 1581)                             | `/tratamiento-de-datos` deja de ser un marcador (decisión 30)                                | El equipo pidió redactarla. **Faltan los datos de contacto del responsable y la validación de la empresa**                 |
| Avisar antes de un `staging:reset`                                      | No se prevé ninguno: las migraciones entran con `staging:push`. Sigue el de antes de la demo | —                                                                                                                          |
| Cambios en Figma que quedan anotados (decisiones 31 a 47)               | Figma no se edita desde aquí                                                                 | Pendiente del equipo                                                                                                       |

Nada de este plan toca «PROYECTO». Lo que le llega al cierre está en «Cierre del sprint».

### Base de las ramas

El Sprint 2 no está en `main`. Hay dos caminos:

1. **Esperar la fusión del Sprint 2 y sacar las ramas de `main` (recomendado).** El Sprint 3 edita
   archivos que el Sprint 2 creó o cambió: `DetalleNovedad.jsx`, `novedades.js`, `Rutas.jsx`,
   `traducir.js`, `useAccion.js`, las pruebas pgTAP de las transiciones y, si se aprueba la
   decisión 21, la función `registrar_solucion`. Con diez PR sin fusionar debajo, cualquier cambio
   que pida la review del Sprint 2 hay que traerlo a siete ramas más. Una cadena de 17 PR es el
   riesgo más grande del sprint, y no es técnico.
2. **Seguir sin esperar.** Las ramas salen de `docs/S2-informe` y cada PR va en borrador con
   «Depende de #17», como en el Sprint 2.

**Decidido el 9 oct 2026:** el equipo eligió el primer camino y le encargó la fusión al agente. El
entorno no se lo permite (rechaza una fusión sin revisión, que es también lo que `CLAUDE.md` reserva
a las personas). Hasta que una persona fusione el Sprint 2, el sprint avanza por el segundo camino:
las ramas salen de `docs/S2-informe`, en borrador y con «Depende de #17»; cuando el Sprint 2 esté
en `main`, se les trae `main` y quedan con su diferencia propia.

Hay dos cosas que no dependen del Sprint 2 y pueden salir de `main`: este plan
(como el #8) y el **PR 1**, la base de las Edge Functions, que además es el mayor riesgo técnico y
conviene despejarlo primero.

## Skills del entorno

Están en la lista: `supabase`, `supabase-postgres-best-practices`, `vitest`,
`vercel-react-best-practices`, `accessibility`, `web-design-guidelines`, `webapp-testing`,
`cloudflare:web-perf`, `wrangler`, `docx`, `pdf`, `chrome-browser`, `built-in-browser` y
`code-review`. Ninguna se instala ni se copia al repositorio.

| Skill                              | Uso en este sprint                                                                                            |
| ---------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| `supabase`                         | **Ya se usó para este plan:** variables de las funciones, `verify_jwt`, CORS, `deno.json`, lista de seguridad |
| `supabase-postgres-best-practices` | Antes de cada migración y de cada prueba pgTAP (PR 2, 3, 4, 6 y 7)                                            |
| `vitest`                           | Pantallas, repositorios y la lógica pura de las Edge Functions (entorno `node`)                               |
| `vercel-react-best-practices`      | Rutas perezosas por rol y peso de la ruta de ingreso; listas de 19, 28, 30 y 32                               |
| `accessibility`                    | Formularios 29 y 30-B, diálogos 28-B, 30 y 09-C, hojas 09-B y 20-C, el código de 03 y las contraseñas         |
| `web-design-guidelines`            | Revisión de la interfaz en cada PR con pantallas                                                              |
| `webapp-testing`                   | Capturas a 360 × 800 y 1280 × 800 con el servidor simulado                                                    |
| `cloudflare:web-perf`              | Peso y Lighthouse de la ruta de ingreso al cierre                                                             |
| `built-in-browser`                 | Ingresar en la vista previa de Pages de un PR con un usuario de prueba, si el equipo lo autoriza              |
| `code-review`                      | Revisión propia de cada PR, además de los dos ejes                                                            |

- **`figma-design-to-code`** no está en la lista; el conector de Figma la entrega como recurso y ya
  se cargó. Para este plan se revisó la captura de las 19 pantallas; `get_design_context` se pide
  pantalla por pantalla al construirlas.
- **Lo que la documentación de Supabase recomienda y este plan no adopta:** el paquete
  `@supabase/server` (`withSupabase`) para las Edge Functions. Es una dependencia nueva; se usa
  `@supabase/supabase-js`, que alcanza (decisión 6).
- El conector de Cloudflare sigue sin autorizar. No bloquea.
- La Figura 19 del SDD (secuencia de la recuperación) no quedó en el Markdown y no hizo falta: el
  flujo sale de SDD 6.1.10, la Tabla 23 y CU-02.

## Orden de los PR

```
docs/S3-plan (este documento)

PR 1 base de Edge Functions ───────────────────────────────────┐
PR 2 contratos ──► PR 3 decidir (RF-13) ──► PR 4 cerrar (RF-15) │
              └──► PR 5 fincas (RF-04) ─────────────────────────┴──► PR 6 usuarios (RF-03) ──► PR 7 recuperar (RF-02)

docs/S3-informe (PR 8)
```

- **PR 1 primero, el día 1**, aunque sus historias vayan al final: es la prueba corta de que se
  puede desplegar sin Docker. Si falla, se detiene todo lo de Edge Functions y se le presentan
  opciones al equipo (riesgo 1); las historias 13, 15 y 04 no dependen de él.
- Después, lo que cierra el ciclo y reutiliza la base del Sprint 2 (HU-13 y HU-15), luego fincas
  (sin servidor nuevo) y al final las dos historias con Edge Functions: HU-03 y después HU-02, que
  necesita usuarios creados por la aplicación para sus pruebas.
- Si lo hace una sola persona (o el agente), va en serie: 1 → 2 → 3 → 4 → 5 → 6 → 7.
- Las migraciones van en el orden de los PR: comparten «staging» y su historial.
- **Review:** una persona revisa los PR 1, 2, 6 y 7 (servidor y seguridad); la otra, los PR 3, 4
  y 5.

| Día    | Servidor                                                                | Cliente                                               |
| ------ | ----------------------------------------------------------------------- | ----------------------------------------------------- |
| Lun 26 | PR 1: despliegue de prueba, base y contrato de las dos funciones · PR 2 | PR 2: repositorios · PR 3: pantalla 19                |
| Mar 27 | PR 3: `decidir_escalamiento` · PR 4: confirmar y «la falla persiste»    | PR 3: 20, 20-B y 20-C · PR 4: 09, 09-B y 09-C         |
| Mié 28 | PR 6: `listar_usuarios` y `gestionar-usuario`                           | PR 5: fincas (30 y 30-B) · PR 6: 28 y 28-B            |
| Jue 29 | PR 7: solicitar, generar y validar el código; `restablecer-contrasena`  | PR 6: 29 y 29-B · PR 7: 02, 02-B, 03, 03-B y 01-E     |
| Vie 30 | Revisión cruzada, asesor, peso y e2e                                    | PR 7: pantalla 32 · capturas, informe, review y retro |

Reparto sugerido: quien hizo el servidor en el Sprint 2 hace ahora el cliente, y al revés.

## Puntos propuestos (DoR)

| Historia  | Requerimiento                | Puntos | Por qué                                                                                                    |
| --------- | ---------------------------- | ------ | ---------------------------------------------------------------------------------------------------------- |
| HU-13     | RF-13 · Aprobar o rechazar   | 5      | Una función sobre la base del Sprint 2; cuatro pantallas en dos formatos; contadores; la e2e de 18-C       |
| HU-15     | RF-15 · Confirmar y cerrar   | 5      | Dos funciones; hoja, diálogo y barra del reportante; qué pasa con la solución anterior                     |
| HU-04     | RF-04 · Gestionar fincas     | 5      | Sin servidor nuevo; tabla con conteos y filtros, formulario, desactivación con advertencia y su teléfono   |
| HU-03     | RF-03 · Gestionar usuarios   | 13     | La primera Edge Function del proyecto, con la API de administración de Auth; cuatro pantallas; sesión viva |
| HU-02     | RF-02 · Recuperar contraseña | 13     | Función sin sesión, código de un solo uso, intentos, segunda Edge Function y seis pantallas                |
| **Total** |                              | **41** | El Sprint 2 fueron 38                                                                                      |

Adoptados el 9 oct 2026 y anotados en `docs/scrum/backlog.md` y `backlog.json`.

---

## PR 1 · `chore/S3-edge-functions` (base de las Edge Functions)

Sale de `main`. No tiene pantallas ni migraciones.

**Qué prueba, en este orden** (si un paso falla, se detiene y se avisa):

1. `supabase functions deploy --use-api --project-ref qxjnnanjidytbyihanet` empaqueta y despliega
   sin Docker una función con un módulo compartido (`_shared/`).
2. La función desplegada recibe `SUPABASE_URL` y `SUPABASE_SECRET_KEYS` con la clave `default`
   (se comprueba que existe; **nunca se imprime**).
3. `verify_jwt` se toma de `config.toml`: `restablecer-contrasena` responde sin sesión y
   `gestionar-usuario` responde 401 sin token.
4. La petición `OPTIONS` del navegador pasa con `verify_jwt` activo y devuelve las cabeceras CORS
   solo a los orígenes permitidos.
5. Con el token de un administrador, `gestionar-usuario` lo reconoce (`auth.getClaims`), y con el de
   otro rol responde 403. **Este paso ingresa con un usuario de prueba: se corre solo con permiso.**

**Archivos**

| Ruta                                            | Contenido                                                                                                    |
| ----------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| `scripts/staging.mjs`, `package.json`           | `npm run staging:functions`: despliega con `--use-api` y la referencia de «staging» fija                     |
| `supabase/config.toml`                          | `[functions.restablecer-contrasena] verify_jwt = false`; `gestionar-usuario` queda con el valor por defecto  |
| `supabase/functions/_shared/cors.js`            | Orígenes permitidos y cabeceras; responde `OPTIONS`                                                          |
| `supabase/functions/_shared/respuestas.js`      | `{ codigo, campos }` con su estado HTTP; nunca escribe el cuerpo de la petición en el registro               |
| `supabase/functions/_shared/contrasena.js`      | La regla de la contraseña (decisión 44), la misma del cliente                                                |
| `supabase/functions/gestionar-usuario/`         | `index.ts`, `deno.json` y `manejar.js`: valida la forma de la Tabla 23 y al administrador; `NO_IMPLEMENTADO` |
| `supabase/functions/restablecer-contrasena/`    | Igual: valida la forma y responde `NO_IMPLEMENTADO`                                                          |
| `vite.config.js`                                | Vitest incluye `supabase/functions/**/*.test.js`                                                             |
| `docs/adr/0012-edge-functions-sin-docker.md`    | Cómo se despliegan y se prueban, y por qué                                                                   |
| `README.md`, `docs/despliegue/supabase-auth.md` | El comando nuevo; qué variables recibe una función; la _Site URL_ (decisión 12)                              |

**Cómo quedan hechas las funciones**

- **Entrada mínima en Deno y lógica en módulos puros.** `index.ts` solo lee las variables, crea los
  clientes de Supabase y llama a `manejar(peticion, dependencias)`. Todo lo demás (validaciones,
  reglas por rol, forma de las respuestas, compensaciones) está en archivos `.js` que no importan
  nada de Deno ni de `npm:`, y se prueban con Vitest en entorno `node`, con clientes simulados.
- **Claves.** La función crea su cliente de administración con
  `JSON.parse(Deno.env.get('SUPABASE_SECRET_KEYS'))['default']`. La plataforma inyecta la variable:
  nadie copia la clave secreta, y no va al repositorio, a `.env.local` ni a Pages (regla 8).
- **`gestionar-usuario`** deja `verify_jwt` activo (la plataforma rechaza lo que no trae un token
  válido antes de ejecutar el código) y, dentro, obtiene la identidad con `auth.getClaims(token)` y
  lee el perfil con el cliente de administración: si no existe, no está activo o no es
  administrador, responde 403 `SIN_PERMISO` (Tabla 23). Nunca decide con `user_metadata`.
- **`restablecer-contrasena`** va con `verify_jwt = false`: no hay sesión y la validez la da el
  código.
- **CORS.** Se devuelve el origen solo si es `http://localhost:5173`, `http://localhost:4173`,
  `https://tdg-nov-grupocentral.pages.dev` o una vista previa
  (`https://<nombre>.tdg-nov-grupocentral.pages.dev`), con `Vary: Origin`. Nunca `*`.
- **Importaciones.** Un `deno.json` por función, con `npm:@supabase/supabase-js@2.117.0` (la versión
  de la aplicación) y nada más.

**Contrato de las dos funciones (precisa la Tabla 23)**

| Función                  | Solicitud (`POST`, JSON)                                                                     | Respuesta          |
| ------------------------ | -------------------------------------------------------------------------------------------- | ------------------ |
| `gestionar-usuario`      | `{ accion: 'crear', nombre, correo, contrasena_inicial, rol_id, finca_id, area_id, activo }` | 200 `{ usuario }`  |
|                          | `{ accion: 'actualizar', usuario_id, nombre, rol_id, finca_id, area_id, activo }`            | 200 `{ usuario }`  |
|                          | `{ accion: 'desactivar' \| 'activar', usuario_id }`                                          | 200 `{ usuario }`  |
| `restablecer-contrasena` | `{ correo, codigo, contrasena }`                                                             | 200 `{ ok: true }` |

`usuario` es `{ id, nombre, correo, rol_id, finca_id, area_id, activo }`. `activo` es opcional
(decisión 14). Los errores llevan el cuerpo `{ codigo, campos }`:

| Estado | `codigo`                            | Cuándo                                                                                            |
| ------ | ----------------------------------- | ------------------------------------------------------------------------------------------------- |
| 400    | `DATO_OBLIGATORIO`                  | Falta un dato, el rol no trae su finca o su área, o la contraseña no cumple; `campos` dice cuáles |
| 400    | `CODIGO_INVALIDO`, `CODIGO_VENCIDO` | Solo `restablecer-contrasena` (Tabla 22)                                                          |
| 401    | —                                   | Sin token o token vencido (lo responde la plataforma)                                             |
| 403    | `SIN_PERMISO`                       | No es un administrador activo, o intenta desactivarse o cambiarse el rol a sí mismo               |
| 404    | `NO_ENCONTRADO`                     | `usuario_id` no existe                                                                            |
| 409    | `CORREO_EXISTENTE`                  | El correo ya está registrado (CU-03 6a)                                                           |
| 501    | `NO_IMPLEMENTADO`                   | Solo mientras dure el contrato                                                                    |

**Pruebas**

| Nivel     | Prueba                                                                                                | CU       |
| --------- | ----------------------------------------------------------------------------------------------------- | -------- |
| Vitest    | CORS: cada origen permitido, uno ajeno, `OPTIONS`, `Vary`                                             | —        |
| Vitest    | Forma de la solicitud de cada acción: faltantes, tipos, acción desconocida, método distinto de `POST` | CU-03 6b |
| Vitest    | La regla de la contraseña da lo mismo en la función y en el cliente (una tabla de casos para las dos) | CU-02 8  |
| Vitest    | `staging.mjs`: el comando nuevo no puede apuntar a producción                                         | —        |
| «staging» | Los cinco pasos de arriba, con `curl`; el quinto, solo con permiso                                    | —        |

**No cubre:** la lógica de las funciones (PR 6 y 7). **Asesor:** sin cambios (no hay SQL).

---

## PR 2 · `feat/RF-13-contratos-cierre-y-cuentas` (contrato primero)

**Migración** `rf13_contratos_cierre_y_cuentas`: las firmas del sprint, `security definer`,
`set search_path = ''`, cuerpo `raise exception 'NO_IMPLEMENTADO'`, `comment on function`,
`revoke execute … from public, anon` y el `grant` de cada una.

| Función                        | Firma                                                                     | Devuelve                                          | `execute`                         |
| ------------------------------ | ------------------------------------------------------------------------- | ------------------------------------------------- | --------------------------------- |
| `decidir_escalamiento`         | `(p_novedad_id uuid, p_aprobar boolean, p_observacion text default null)` | `public.novedad`                                  | `authenticated`                   |
| `confirmar_resolucion`         | `(p_novedad_id uuid, p_observacion text default null)`                    | `public.novedad`                                  | `authenticated`                   |
| `reportar_falla_persiste`      | `(p_novedad_id uuid, p_observacion text)`                                 | `public.novedad`                                  | `authenticated`                   |
| `solicitar_recuperacion`       | `(p_correo text)`                                                         | `void`                                            | `anon` y `authenticated` (dec. 7) |
| `generar_codigo_recuperacion`  | `(p_solicitud_id uuid)`                                                   | Tabla `(codigo text, expira_en timestamptz)`      | `authenticated`                   |
| `listar_usuarios`              | `()`, `stable`                                                            | Tabla con el correo y el último ingreso (dec. 13) | `authenticated`                   |
| `consumir_codigo_recuperacion` | `(p_correo text, p_codigo text)`                                          | Tabla `(resultado text, usuario_id uuid)`         | Solo `service_role` (dec. 10)     |

Las tres primeras y `generar_codigo_recuperacion` son de la Tabla 21. `listar_usuarios` y
`consumir_codigo_recuperacion` no están en ella: van con su entrada en `docs/cambios-sdd.md`.

**Archivos**

| Ruta                                             | Contenido                                                                                                    |
| ------------------------------------------------ | ------------------------------------------------------------------------------------------------------------ |
| `supabase/tests/s3_contratos_test.sql`           | `has_function` con cada firma; quién las ejecuta y quién no. No prueba `NO_IMPLEMENTADO`                     |
| `src/core/supabase/repositorios/novedades.js`    | `decidirEscalamiento`, `confirmarResolucion`, `reportarFallaPersiste`                                        |
| `src/core/supabase/repositorios/usuarios.js`     | `listarUsuarios`; `crearUsuario`, `actualizarUsuario`, `desactivarUsuario`, `activarUsuario` (Edge Function) |
| `src/core/supabase/repositorios/recuperacion.js` | `solicitarRecuperacion`, `listarSolicitudes`, `generarCodigoRecuperacion`, `restablecerContrasena`           |
| `src/core/supabase/repositorios/funciones.js`    | Llama a una Edge Function y convierte su error en uno con `message = codigo`, `campos` y `status`            |
| `src/core/errores/traducir.js`                   | `FunctionsFetchError` es un error de red; mensajes de `CORREO_EXISTENTE` y `SOLICITUD_INVALIDA`              |
| `src/core/supabase/database.types.ts`            | Regenerado, en el mismo commit                                                                               |

**Vitest:** cada envoltura llama a su función con los nombres de la Tabla 21 (o a su Edge Function
con el cuerpo de la Tabla 23) y lanza el error traducible; se simula el módulo del cliente, no la
red.

**Asesor:** pasa de 9 a **16 avisos**, todos esperados y de nivel WARN: cinco
`authenticated_security_definer_function_executable` (las tres transiciones,
`generar_codigo_recuperacion` y `listar_usuarios`) y, por `solicitar_recuperacion`, uno de ese tipo
y uno **de un tipo nuevo**, `anon_security_definer_function_executable`, que es justo la excepción
de la decisión 7. Si esa decisión cambia, el tipo nuevo no aparece.

---

## PR 3 · `feat/RF-13-decidir-escalamiento`

**Pantallas de Figma:** 19 (`4:547`), 20 (`4:705`), 20-B (`4:878`) y 20-C (`4:1054`); la vista
previa de 12 (`3:587`) ya muestra la decisión del director.

### Servidor

**Migración `rf13_decidir_escalamiento`**, con el orden de verificaciones del Sprint 2:

1. Perfil activo con rol de director → `SIN_PERMISO`.
2. Bloqueo de la fila y alcance (el director ve todas) → `SIN_PERMISO` si no existe.
3. Estado distinto de `escalada` → `TRANSICION_INVALIDA`.
4. `p_aprobar` nulo → `DATO_OBLIGATORIO`. Si rechaza, la observación es obligatoria
   (`private.texto_obligatorio`); si aprueba, es opcional: se recorta, vacía queda nula y con más
   de 500 caracteres responde `DATO_OBLIGATORIO` (auxiliar nueva `private.texto_opcional`, sin
   `execute` para nadie, que también usa `confirmar_resolucion`).
5. `escalada → aprobada` o `rechazada`; historial con la observación; avisos a los aprobadores
   activos del área y al reportante (Tablas 30 y 33), nunca a quien decide.

**pgTAP `rf13_decidir_escalamiento_test.sql`** (primero la prueba; debe fallar con
`NO_IMPLEMENTADO`)

| Prueba                                                                                                           | CU               |
| ---------------------------------------------------------------------------------------------------------------- | ---------------- |
| Aprobar con y sin observación: `aprobada`, historial `escalada → aprobada` a nombre del director                 | CU-13 6–7        |
| Rechazar con observación: `rechazada`; la observación queda recortada en el historial                            | CU-13 6–7        |
| Rechazar sin observación, con espacios o con más de 500 caracteres → `DATO_OBLIGATORIO`; `p_aprobar` nulo, igual | CU-13 5a         |
| Avisos a los aprobadores activos del área y al reportante, con el estado nuevo; no al inactivo ni al director    | CU-13 8          |
| Cada estado distinto de `escalada`, incluidos los finales → `TRANSICION_INVALIDA`; segundo intento, igual        | Tabla 29         |
| Reportante, aprobador, administrador, director inactivo, sin perfil y novedad inexistente → `SIN_PERMISO`        | RNF-11           |
| `anon` no la ejecuta; si falla el historial, el estado no cambia                                                 | RNF-11, CU-16 1a |
| Después de aprobar, `registrar_solucion` del aprobador la deja `resuelta` (el camino de 18-C)                    | CU-14            |

### Cliente

| Ruta                                              | Contenido                                                                                                  |
| ------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `src/modules/e3-atencion/Escaladas.jsx`           | Ruta `/escaladas` (19), `React.lazy`, solo el director: contadores, tarjetas y «Ver más»                   |
| `src/modules/e3-atencion/DecisionDelDirector.jsx` | Panel «Tu decisión» de 20 y 20-B; en el teléfono, la barra y la hoja de 20-C. Solo lo descarga el director |
| `src/modules/e4-consulta/DetalleNovedad.jsx`      | Con una escalada y el director: el recuadro de la justificación y el panel a la derecha                    |
| `src/core/supabase/repositorios/novedades.js`     | `listarEscaladas`, `contarDecisionesDelMes`, `listarEscalamientos` (justificación y quién escaló)          |
| `src/app/Rutas.jsx`                               | `/escaladas` deja de ser un marcador                                                                       |

**Reglas**

- **19.** Título y subtítulo de Figma; tres contadores («Esperan tu decisión», «Aprobadas este mes»,
  «Rechazadas este mes»); una tarjeta por novedad con sus etiquetas, «Esperando decisión hace…»,
  la descripción, el recuadro «Justificación del escalamiento» con «Escaló: {nombre} · {rol} ·
  {área}», «Ver historial» y «Revisar y decidir». Orden y contadores: decisiones 19 y 33.
- **20 es el detalle de la novedad** (`/novedades/:id`) cuando quien lo abre es el director y está
  escalada, no una ruta aparte (decisión 32). «Revisar y decidir» lo abre; «Ver historial» lo abre
  en la línea de tiempo.
- **Panel «Tu decisión».** Dos opciones como botones de radio («Aprobar · Vuelve a {área} para
  ejecutar la solución», «Rechazar · La novedad se cierra como Rechazada»), «Observación» con su
  ayuda («Opcional al aprobar, obligatoria al rechazar»), «Confirmar decisión» y la nota «Se
  avisará a {área} y a la finca {finca}. La decisión queda en el historial y no se puede editar.»
- **20-B.** Con «Rechazar» elegido y la observación vacía, el botón queda deshabilitado y el campo
  dice «Escribe la observación para rechazar» (CU-13 5a).
- **20-C.** En el teléfono, la barra «Rechazar» · «Aprobar»; cada botón abre una hoja con la
  observación y «Confirmar decisión» (decisión 34).
- **Después de decidir** la novedad sigue en el alcance del director: se queda en el detalle
  recargado, ya sin acciones, con un aviso temporal. Los errores, como en el Sprint 2 (`useAccion`):
  si otro director ya decidió, «La novedad cambió de estado» y se recarga.

**Pruebas**

| Nivel  | Prueba                                                                                                                                                             | CU            |
| ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------- |
| Vitest | 19: contadores, orden, justificación y quién escaló; vacío; error con «Reintentar»                                                                                 | CU-13 1–2     |
| Vitest | Panel: sin opción elegida no se confirma; aprobar sin observación sí; rechazar sin observación no (20-B)                                                           | CU-13 3–5, 5a |
| Vitest | 20-C: cada botón abre su hoja; la hoja envía `p_aprobar` y la observación                                                                                          | CU-13 5       |
| Vitest | El aprobador y el reportante no ven el panel; el director no lo ve en otro estado                                                                                  | Tabla 35      |
| e2e    | `cu-13-decidir-escalamiento.spec.js`: registrar, tomar y escalar por la API; el director la ve en 19, la aprueba con observación; avisos del área y del reportante | CU-13 normal  |
| e2e    | Rechazar: sin observación no se puede; con observación queda Rechazada                                                                                             | CU-13 5a      |
| e2e    | **18-C (pendiente del Sprint 2):** tras la aprobación, el aprobador ve el recuadro con la observación del director y registra la solución                          | CU-14         |

**No cubre:** CU-13 3a (sin conexión, CU-25): Sprint 4; aquí solo el corte durante la acción.

---

## PR 4 · `feat/RF-15-confirmar-resolucion`

**Pantallas de Figma:** 09 (`2:1118`), 09-B (`2:1243`) y 09-C (`2:1365`); 04 (`2:36`) ya lleva a
«Por confirmar».

### Servidor

**Migración `rf15_confirmar_resolucion`:** `resuelta → cerrada` (final). Reportante activo de la
finca de la novedad (cualquiera, no solo quien la registró; Tabla 30). Observación opcional.
Historial con la observación, si la hay; avisos a los aprobadores activos del área.

**Migración `rf15_reportar_falla_persiste`:** `resuelta → en_atencion`. Observación obligatoria
(CU-15 3b). Historial con la observación; avisos a los aprobadores activos del área. Qué pasa con
la solución anterior: **decisión 21**.

**pgTAP `rf15_confirmar_resolucion_test.sql`**

| Prueba                                                                                                      | CU               |
| ----------------------------------------------------------------------------------------------------------- | ---------------- |
| Confirmar con y sin observación: `cerrada`; historial `resuelta → cerrada`; conserva solución, fecha y tipo | CU-15 3–5        |
| «La falla persiste» con observación: `en_atencion`; historial `resuelta → en_atencion` con la observación   | CU-15 3a         |
| Observación vacía, de espacios o de más de 500 caracteres → `DATO_OBLIGATORIO`                              | CU-15 3b         |
| Avisos a los aprobadores activos del área en los dos casos; a nadie más                                     | CU-15 6          |
| Otro reportante activo de la misma finca puede hacerlo; el de otra finca → `SIN_PERMISO`                    | Tabla 30, RNF-11 |
| El reportante de una finca desactivada todavía puede confirmar (la novedad sigue su curso)                  | CU-04 3b         |
| Estados distintos de `resuelta` → `TRANSICION_INVALIDA`; una `cerrada` no admite nada más                   | Tabla 29         |
| Después de «la falla persiste», el aprobador vuelve a registrar la solución y el reportante la cierra       | CU-14, CU-15     |
| La última transición `asignada → en_atencion` sigue siendo la del aprobador («Tomada por»)                  | SDD 6.1.3        |
| Otros roles, inactivo, sin perfil → `SIN_PERMISO`; `anon` no ejecuta; reversión si falla el historial       | RNF-11, CU-16 1a |

### Cliente

| Ruta                                                 | Contenido                                                                                      |
| ---------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| `src/core/ui/Dialogo.jsx`                            | Diálogo centrado en los dos formatos (09-C, 28-B, 30, 30-B y 32), sobre `<dialog>` como `Hoja` |
| `src/modules/e3-atencion/AccionesDelReportante.jsx`  | Barra «La falla persiste» · «Confirmar cierre»; solo la descarga el reportante                 |
| `src/modules/e3-atencion/HojaFallaPersiste.jsx`      | 09-B: «¿Qué sigue fallando?», contador y «Devolver a atención»                                 |
| `src/modules/e3-atencion/DialogoConfirmarCierre.jsx` | 09-C: «¿Confirmas que la novedad quedó resuelta?» · «Sí, cerrar»                               |
| `src/modules/e4-consulta/DetalleNovedad.jsx`         | El reportante con una resuelta recibe sus acciones                                             |

- En el escritorio, los botones van bajo el encabezado y la hoja es un diálogo centrado (decisión 4
  del Sprint 2).
- Después de cualquiera de las dos, la persona se queda en el detalle recargado con su aviso
  temporal: ya cerrada y sin acciones, o de nuevo en atención.
- **«Tomada por»** (decisión 19 del Sprint 2) sigue saliendo de la última vez que la novedad pasó de
  asignada a en atención: después de «la falla persiste» muestra al aprobador, no al reportante.

**Pruebas**

| Nivel  | Prueba                                                                                                                                                 | CU           |
| ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------ |
| Vitest | `Dialogo`: foco dentro, Escape, «Cancelar», foco de vuelta; nombre accesible                                                                           | —            |
| Vitest | 09: la barra solo con una resuelta de su finca; ningún otro rol la ve                                                                                  | Tabla 35     |
| Vitest | 09-C: «Cancelar» no llama; «Sí, cerrar» llama con la observación o sin ella                                                                            | CU-15 3      |
| Vitest | 09-B: «Devolver a atención» deshabilitado sin texto; contador; `DATO_OBLIGATORIO` se corrige en la hoja                                                | CU-15 3b     |
| Vitest | **«Tomada por» después de «la falla persiste»** muestra al aprobador de la última toma                                                                 | SDD 6.1.3    |
| e2e    | `cu-15-confirmar-resolucion.spec.js`: registrar → tomar → resolver por la API; el reportante la abre desde «Por confirmar» y la cierra; aviso del área | CU-15 normal |
| e2e    | «La falla persiste»: sin texto no se puede; con texto vuelve a En atención, con «Tomada por» del aprobador, y sale en su pestaña «En atención»         | CU-15 3a, 3b |
| e2e    | **El incremento:** registrar → tomar → escalar → aprobar → resolver → confirmar, con cada rol en su navegador                                          | Demo         |

**No cubre:** CU-15 1a (09-D, cierre bloqueado sin conexión): Sprint 4. «Adjuntar foto»: Sprint 4.

---

## PR 5 · `feat/RF-04-gestionar-fincas` (cliente; sin funciones nuevas)

**Pantallas de Figma:** 30 (`6:1961`) y 30-B (`6:2194`).

El administrador escribe directamente en `finca` con las políticas que existen desde el Sprint 1
(`finca_insercion_administrador` y `finca_actualizacion_administrador`), a través de un
repositorio. No hay política de borrado: una finca se desactiva.

| Ruta                                                     | Contenido                                                                                     |
| -------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| `src/modules/e1-acceso-admin/Fincas.jsx`                 | Ruta `/fincas`, `React.lazy`: búsqueda, filtros, tabla (tarjetas en el teléfono) y paginación |
| `src/modules/e1-acceso-admin/DialogoFinca.jsx`           | 30-B: «Nueva finca» y «Editar finca»: nombre y razón social                                   |
| `src/modules/e1-acceso-admin/DialogoDesactivarFinca.jsx` | 30: confirmación, con la advertencia si tiene novedades abiertas                              |
| `src/core/supabase/repositorios/fincas.js`               | `listarFincasConConteos`, `listarRazonesSociales`, `crearFinca`, `actualizarFinca`            |
| `supabase/tests/rf04_gestionar_fincas_test.sql`          | Las políticas de `finca`, que hasta ahora solo se probaban de pasada                          |

**Reglas**

- **Lista.** Columnas de Figma: Finca, Razón social, Novedades abiertas, Reportantes asignados,
  Estado y Acciones. Filtros «Razón social: Todas» y «Estado: Activas» (por defecto), y «Buscar
  finca». De dónde salen los conteos: decisión 17.
- **6a.** La restricción `finca_razon_social_nombre_unico` responde con el código 23505: el
  repositorio lo convierte y el campo muestra «Ya existe una finca con ese nombre en esta razón
  social». El nombre se envía sin espacios sobrantes.
- **3a y 3b.** Antes de desactivar se muestra el diálogo. Con novedades abiertas: «Tiene N novedades
  abiertas. Seguirán su curso, pero no se podrán registrar novedades nuevas para esta finca.»
  (texto de Figma). «Abierta» es un estado no final (SDD, definiciones).
- **Reactivar** una finca desactivada: un clic, sin diálogo (decisión 37).

**Pruebas**

| Nivel  | Prueba                                                                                                                            | CU            |
| ------ | --------------------------------------------------------------------------------------------------------------------------------- | ------------- |
| pgTAP  | El administrador inserta y actualiza; reportante, aprobador y director no; nadie borra; `anon`, nada                              | RNF-11        |
| pgTAP  | Mismo nombre en la misma razón social → 23505; en otra razón social, sí; nombre vacío → restricción                               | CU-04 6a      |
| pgTAP  | Con la finca desactivada, `registrar_novedad` de su reportante → `FINCA_NO_ASIGNADA`, y sus novedades abiertas siguen visibles    | CU-04 3a      |
| Vitest | Lista, filtros, búsqueda, conteos y paginación                                                                                    | CU-04 2       |
| Vitest | Crear y editar; 23505 señala el campo; campos vacíos                                                                              | CU-04 5–6, 6a |
| Vitest | Desactivar sin novedades abiertas y con ellas (advertencia y confirmación); cancelar no escribe; reactivar                        | CU-04 3a, 3b  |
| e2e    | `cu-04-gestionar-fincas.spec.js`: el administrador crea «Finca e2e {única}», repite el nombre (6a), la edita y la desactiva       | CU-04 normal  |
| e2e    | 3b: en una finca del seed con novedades abiertas, el diálogo muestra la cantidad y **se cancela** (las del seed no se desactivan) | CU-04 3b      |

**No cubre:** la carga de las fincas reales (es un paso del cierre, decisión 18).

---

## PR 6 · `feat/RF-03-gestionar-usuarios`

**Pantallas de Figma:** 28 (`6:867`), 28-B (`6:1098`), 29 (`6:1343`) y 29-B (`6:1651`).

### Servidor

**Migración `rf03_listar_usuarios`:** `public.listar_usuarios()` devuelve, solo a un administrador
activo (si no, `SIN_PERMISO`), `id, nombre, correo, rol_id, finca_id, area_id, activo, creado_en` y
`ultimo_ingreso` (de `auth.users.last_sign_in_at`). Es la función que anunciaba el ADR 0010. La
misma migración escribe los privilegios de `service_role` sobre `usuario` (regla 4): hoy los tiene
en «staging», pero no hay que depender de eso.

**Edge Function `gestionar-usuario`** (SDD 6.1.10, Tabla 23), sobre el contrato del PR 1:

| Acción       | Qué hace, en orden                                                                                                                                                             |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `crear`      | Valida; crea la cuenta en Auth con el correo confirmado y la contraseña inicial; inserta `usuario` con el mismo `id`; **si la inserción falla, borra la cuenta recién creada** |
| `actualizar` | Valida; cambia nombre, rol y finca o área. Si llega `activo` y cambió, además desactiva o reactiva                                                                             |
| `desactivar` | `usuario.activo = false` primero (corta los datos de inmediato) y después la suspensión en Auth (`ban_duration`)                                                               |
| `activar`    | Quita la suspensión en Auth (`ban_duration: 'none'`) y después `usuario.activo = true`                                                                                         |

- **Validación (6b),** antes de tocar Auth: nombre, correo con forma de correo y en minúsculas,
  contraseña según la regla, rol entre 1 y 4, y la misma combinación del `CHECK
usuario_alcance_segun_rol`: reportante con finca **activa** y sin área; aprobador con área
  **activa** y sin finca; director y administrador sin ninguna. Responde 400 con los `campos`.
- **6a.** Si Auth o la restricción `usuario_correo_unico` dicen que el correo existe → 409.
- **Nunca borra** un usuario ya creado; el único borrado es la compensación de `crear`.
- **Protecciones** (decisión 15): nadie se desactiva ni se cambia el rol a sí mismo → 403. Como
  solo un administrador activo puede llamar la función, siempre queda al menos uno.
- Si la segunda mitad de una operación falla (por ejemplo, Auth no responde al suspender), la
  función responde 500 y la operación se puede repetir: todas las acciones dan el mismo resultado
  si se ejecutan dos veces.

**pgTAP `rf03_listar_usuarios_test.sql`:** el administrador recibe todos los usuarios, activos e
inactivos, con su correo; los otros tres roles, un administrador inactivo y un usuario sin perfil →
`SIN_PERMISO`; `anon` no la ejecuta; el correo sigue sin poder leerse por la API de datos
(`select correo from usuario` → sin privilegio).

### Cliente

| Ruta                                                       | Contenido                                                                                                |
| ---------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| `src/modules/e1-acceso-admin/Usuarios.jsx`                 | Ruta `/usuarios` (28), `React.lazy`: búsqueda por nombre o correo, filtros, tabla y paginación           |
| `src/modules/e1-acceso-admin/PanelUsuario.jsx`             | 29 y 29-B: «Nuevo usuario» y «Editar usuario», con la finca o el área según el rol                       |
| `src/modules/e1-acceso-admin/DialogoDesactivarUsuario.jsx` | 28-B                                                                                                     |
| `src/modules/e1-acceso-admin/generarContrasena.js`         | Contraseña inicial con `crypto.getRandomValues` (decisión 15)                                            |
| `src/core/sesion/ProveedorSesion.jsx`, `sesion.js`         | El perfil se vuelve a leer al recuperar el foco y cuando una acción responde `SIN_PERMISO` (decisión 16) |
| `src/app/Rutas.jsx`, `src/core/sesion/roles.js`            | `/usuarios` deja de ser un marcador; inicio del administrador (decisión 25)                              |

**Reglas**

- **28.** Columnas de Figma: Nombre, Correo, Rol, Finca o área, Estado, Último ingreso y Acciones
  (editar; desactivar o reactivar). «Rol: Todos» y «Estado: Todos». La lista completa llega en una
  llamada y se filtra, se busca y se pagina en el navegador (decisión 35).
- **29.** «Nombre completo», «Correo de la plataforma» («Correo exclusivo de la plataforma; no
  recibe mensajes»), «Contraseña inicial» con «Generar» («Entrégala al usuario; podrá cambiarla
  después»), «Rol» como botones de radio con su descripción, «Finca asignada» (reportante) o
  «Área» (aprobador; 29-B), «Usuario activo» y «Guardar usuario».
- **6a.** El 409 marca el correo con «Este correo ya está registrado». **6b.** Los `campos` del 400
  se señalan uno por uno y el foco va al primero.
- **28-B.** «¿Desactivar a {nombre}?» · «No podrá ingresar a la plataforma. Sus novedades y su
  historial se conservan.» En la fila propia, las acciones de desactivar y de cambiar el rol van
  deshabilitadas, con la explicación en texto.
- **La contraseña inicial no se guarda en ningún lado** del navegador y no se registra: vive en el
  estado del formulario hasta que se cierra.

**Pruebas**

| Nivel     | Prueba                                                                                                                                              | CU             |
| --------- | --------------------------------------------------------------------------------------------------------------------------------------------------- | -------------- |
| pgTAP     | `listar_usuarios`, como arriba                                                                                                                      | RNF-11, RNF-18 |
| Vitest    | Función: cada acción con clientes simulados; el orden de las llamadas; **si falla la inserción, se borra la cuenta**                                | SDD 6.1.10     |
| Vitest    | Función: correo existente → 409; cada combinación de rol y alcance; finca o área inactiva; contraseña débil → 400 con `campos`                      | CU-03 6a, 6b   |
| Vitest    | Función: quien llama no es administrador o está inactivo → 403; desactivarse o cambiarse el rol a sí mismo → 403                                    | Tabla 23       |
| Vitest    | 28: lista, búsqueda, filtros, paginación, «Último ingreso»; 28-B; reactivar                                                                         | CU-03 2, 3a    |
| Vitest    | 29: el rol cambia el campo de alcance; «Generar»; errores 6a y 6b en su campo; editar no muestra contraseña ni deja cambiar el correo               | CU-03 4–6      |
| Vitest    | Sesión: con el perfil desactivado se cierra la sesión, se conservan las pendientes y se muestra 01-C; con el rol cambiado, cambia el menú           | CU-01 4b       |
| «staging» | La función desplegada: crear, correo repetido, actualizar, desactivar y activar, con la sesión del administrador de prueba (con permiso)            | CU-03          |
| e2e       | `cu-03-gestionar-usuarios.spec.js`: el administrador crea `e2e-{único}@novedades.test` como reportante; el usuario nuevo ingresa y ve Mis novedades | CU-03 normal   |
| e2e       | Correo de un usuario del seed → «Este correo ya está registrado»; aprobador sin área → campo señalado                                               | CU-03 6a, 6b   |
| e2e       | Edita el nombre del usuario creado; lo desactiva y su ingreso muestra 01-C; lo reactiva y vuelve a entrar                                           | CU-03 3a       |

**No cubre:** el borrado de usuarios (no existe); cambiar el correo (decisión 15).

---

## PR 7 · `feat/RF-02-recuperar-contrasena`

**Pantallas de Figma:** 02 (`1:570`), 02-B (`1:616`), 03 (`1:672`), 03-B (`1:735`), 01-E (`1:525`)
y 32 (`6:3317`).

### Servidor

**Migración `rf02_solicitud_recuperacion`** (cambia el esquema; decisiones 9 y 11): la columna
`intentos_fallidos smallint not null default 0`, la restricción de que `codigo_hash` y `expira_en`
se llenan juntos y un índice único parcial `(usuario_id) where not usado and codigo_hash is null`,
para que un usuario no tenga dos solicitudes pendientes ni con dos peticiones a la vez.

**Migración `rf02_solicitar_recuperacion`** (sin sesión; decisión 7):

- Normaliza el correo (minúsculas y sin espacios); con más de 254 caracteres no hace nada.
- Solo si corresponde a un usuario **activo** que no tiene una solicitud abierta (pendiente, o con
  un código vigente), inserta la solicitud.
- **Siempre devuelve lo mismo** (`void`) y nunca lanza una excepción: exista o no el correo, esté
  activo o no, tenga o no una solicitud (CU-02 4a).

**Migración `rf02_generar_codigo_recuperacion`** (administrador activo; si no, `SIN_PERMISO`):

- Bloquea la solicitud. Si no existe, ya se usó, ya venció o su usuario está inactivo →
  `SOLICITUD_INVALIDA` (código nuevo, decisión 8).
- Genera seis dígitos con `extensions.gen_random_bytes` (fuente criptográfica, con descarte para
  que los dígitos sean uniformes), nunca con `random()`.
- Guarda **solo el resumen con sal** (`extensions.crypt` con `gen_salt('bf')`), la vigencia
  (30 minutos, `CODIGO_RECUPERACION_VIGENCIA_MINUTOS`) y deja los intentos en cero. Un código nuevo
  reemplaza el resumen anterior: el código viejo deja de servir.
- Devuelve el código y su vencimiento. Es la única vez que el código sale de la base de datos.

**Migración `rf02_consumir_codigo_recuperacion`** (solo `service_role`; decisión 10): toma la
solicitud más reciente con código del usuario activo de ese correo, la bloquea y responde:

| Situación                                                                           | Resultado         | Efecto                                                           |
| ----------------------------------------------------------------------------------- | ----------------- | ---------------------------------------------------------------- |
| El correo no existe, no hay solicitud con código, o el código no tiene seis dígitos | `CODIGO_INVALIDO` | Ninguno (hace igual un cálculo de resumen, para tardar lo mismo) |
| El código no coincide                                                               | `CODIGO_INVALIDO` | Suma un intento fallido                                          |
| El código coincide, pero ya se usó, venció o se agotaron los cinco intentos         | `CODIGO_VENCIDO`  | Ninguno                                                          |
| El código coincide y la solicitud está vigente                                      | `OK` y el usuario | `usado = true`                                                   |

`CODIGO_VENCIDO` solo se le responde a quien conoce el código, así que ninguna respuesta dice si un
correo existe. Devuelve el resultado en lugar de lanzar una excepción, porque una excepción
desharía la suma del intento.

**Edge Function `restablecer-contrasena`:** valida la forma (correo, seis dígitos, contraseña según
la regla) **antes** de gastar el código; llama a `consumir_codigo_recuperacion`; con `OK`, fija la
contraseña con la API de administración de Auth y responde 200. No escribe en el registro el
correo, el código ni la contraseña.

**pgTAP `rf02_recuperar_contrasena_test.sql`**

| Prueba                                                                                                                            | CU          |
| --------------------------------------------------------------------------------------------------------------------------------- | ----------- |
| `solicitar_recuperacion` con un usuario activo crea una solicitud pendiente; `anon` la ejecuta y no puede leer la tabla           | CU-02 3–4   |
| Correo inexistente, de un usuario inactivo, vacío, nulo o enorme: no crea nada y responde igual                                   | CU-02 4a    |
| Segunda solicitud con una abierta: no crea otra; con la anterior vencida o usada, sí                                              | Decisión 11 |
| `generar_codigo_recuperacion`: seis dígitos; `codigo_hash` no es el código y lo verifica `crypt`; `expira_en` a 30 minutos        | CU-02 6     |
| Un código nuevo invalida el anterior                                                                                              | RF-02       |
| Solo el administrador activo genera; los demás → `SIN_PERMISO`; `codigo_hash` no se puede leer por la API ni siendo administrador | RNF-11      |
| Solicitud usada, vencida, inexistente o de un usuario inactivo → `SOLICITUD_INVALIDA`                                             | Decisión 8  |
| `consumir`: código correcto → `OK` y `usado`; **segundo uso → `CODIGO_VENCIDO`**                                                  | CU-02 9, 9a |
| `consumir`: **vencido** (se mueve `expira_en` al pasado dentro de la prueba) → `CODIGO_VENCIDO`                                   | CU-02 9a    |
| `consumir`: código incorrecto → `CODIGO_INVALIDO` y suma un intento; al quinto, el correcto ya responde `CODIGO_VENCIDO`          | CU-02 9b    |
| `consumir`: correo inexistente → `CODIGO_INVALIDO`; `authenticated` y `anon` no la ejecutan                                       | RNF-11      |

### Cliente

| Ruta                                                   | Contenido                                                                                          |
| ------------------------------------------------------ | -------------------------------------------------------------------------------------------------- |
| `src/modules/e1-acceso-admin/RecuperarContrasena.jsx`  | `/recuperar`: 02 y, al enviar, 02-B. `React.lazy`, **fuera de la ruta de ingreso**                 |
| `src/modules/e1-acceso-admin/CrearContrasena.jsx`      | `/recuperar/codigo`: 03 y 03-B. En el mismo paquete que la anterior                                |
| `src/modules/e1-acceso-admin/CampoCodigo.jsx`          | El código de seis dígitos (decisión 43)                                                            |
| `src/modules/e1-acceso-admin/Ingreso.jsx`, `sesion.js` | 01-E («Contraseña actualizada. Ya puedes ingresar.») y el mensaje propio del límite de intentos    |
| `src/modules/e1-acceso-admin/Recuperaciones.jsx`       | `/recuperacion` (32), `React.lazy`, solo el administrador: pestañas, tabla y el diálogo del código |
| `src/core/config/parametros.js`                        | `CODIGO_RECUPERACION_MAX_INTENTOS = 5`                                                             |

**Reglas**

- **02.** «Correo registrado» y «Enviar solicitud», con «Cómo funciona» y «Ya tengo un código».
  **02-B** se muestra siempre igual: «Si el correo corresponde a un usuario activo, un
  administrador te entregará un código temporal. El código tiene una vigencia limitada.» Requiere
  conexión (RF-02): sin ella, el botón queda deshabilitado con su explicación.
- **03.** Correo, código, «Contraseña nueva» con mostrar u ocultar y sus dos reglas («Mínimo 8
  caracteres», «Al menos una letra y un número»), «Confirmar contraseña» y «Guardar contraseña».
  El correo llega de 02-B por el estado de la navegación; nunca va en la dirección.
- **9b.** Código incorrecto: el campo lo dice y la persona sigue en 03. **9a / 03-B.** Vencido o
  usado: «El código venció. Pide uno nuevo al administrador.» con «Solicitar otro código», que
  vuelve a 02 con el correo puesto.
- **01-E.** Al guardar, la aplicación va al ingreso con el aviso de Figma.
- **32.** Pestañas «Pendientes (N)» y «Atendidas»; columnas Usuario, Correo, Rol y finca o área,
  Solicitada, Estado y Acción («Generar código»). El diálogo muestra el código una sola vez,
  «Copiar», «Vence hoy a las {hora}. Solo se puede usar una vez y no se volverá a mostrar.» y
  «Verifica la identidad de la persona antes de entregarlo.» Al cerrar con «Listo», el código
  desaparece de la memoria de la pantalla. Estados y pestañas: decisión 42.
- **Límite de intentos de Auth (pendiente del Sprint 2).** Cuando Auth responde 429 al ingresar, la
  pantalla dice que hay que esperar unos minutos, en lugar del mensaje general.

**Pruebas**

| Nivel     | Prueba                                                                                                                                                        | CU              |
| --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------- |
| pgTAP     | Como arriba                                                                                                                                                   | CU-02           |
| Vitest    | Función: forma inválida no gasta el código; `OK` fija la contraseña; `CODIGO_INVALIDO` y `CODIGO_VENCIDO` → 400; si Auth falla → 500; nada va al registro     | CU-02 9, 9a, 9b |
| Vitest    | 02: envía y muestra 02-B con cualquier correo; sin conexión no envía                                                                                          | CU-02 1–4, 4a   |
| Vitest    | 03: reglas de la contraseña, confirmación distinta, código incompleto; pegar un código de seis dígitos lo llena                                               | CU-02 8         |
| Vitest    | 03: `CODIGO_INVALIDO` deja corregir; **`CODIGO_VENCIDO` muestra 03-B**; éxito lleva a 01-E                                                                    | CU-02 9, 9a, 9b |
| Vitest    | 32: pestañas y estados derivados (pendiente, código generado, usada, vencida); el diálogo; «Copiar»; `SOLICITUD_INVALIDA` recarga                             | CU-02 5–7       |
| Vitest    | Ingreso: 01-E y el mensaje del 429                                                                                                                            | CU-01           |
| «staging» | La función desplegada, con un usuario creado para la prueba                                                                                                   | CU-02           |
| e2e       | `cu-02-recuperar-contrasena.spec.js`: con un usuario creado por la prueba: solicita, el administrador genera el código, crea la contraseña e ingresa con ella | CU-02 normal    |
| e2e       | Correo inexistente: el mismo mensaje, y el administrador no ve ninguna solicitud nueva                                                                        | CU-02 4a        |
| e2e       | Código incorrecto: lo informa y deja seguir; el mismo código por segunda vez: 03-B                                                                            | CU-02 9b, 9a    |

**No cubre con e2e:** CU-02 9a por tiempo (no se pueden esperar 30 minutos). Queda con pgTAP, que
mueve el vencimiento, y con Vitest. La e2e cubre la otra mitad de 9a: el código ya usado.

---

## PR aparte · `feat/RNF-18-tratamiento-de-datos`

Lo pidió el equipo el 9 oct 2026 (decisión 30). No depende de los demás PR del sprint.

- **Pantalla:** ruta `/tratamiento-de-datos`, sin sesión, con `React.lazy` y fuera de la ruta de
  ingreso. Reemplaza el marcador al que ya enlaza la pantalla 01. Figma no la dibuja: usa la
  columna y los estilos de texto de las pantallas de acceso.
- **Texto:** política de tratamiento de datos personales conforme a la Ley 1581 de 2012 y a su
  reglamentación: responsable, datos que se tratan, finalidades, derechos del titular, cómo
  ejercerlos y en qué plazos, seguridad, conservación y vigencia. Se redacta a partir de lo que el
  sistema hace de verdad con los datos (RNF-18; SDD 6.1.1 y 6.1.4).
- **Es un borrador.** No reemplaza la revisión de la empresa ni la de quien la asesore en lo
  legal. Los datos de contacto del responsable no están en ningún documento del proyecto: no se
  inventan; mientras lleguen, la política remite a los administradores de la plataforma.
- **Pruebas:** Vitest (las secciones, el enlace de regreso y que no aparezca ningún dato de
  contacto inventado) y una e2e sin sesión (del ingreso a la política y de vuelta).

---

## Cobertura de los cursos de cada caso de uso

| CU    | Curso normal | Alternos cubiertos                     | Lo que queda para otro sprint                              |
| ----- | ------------ | -------------------------------------- | ---------------------------------------------------------- |
| CU-13 | Sí           | 5a                                     | 3a (CU-25): Sprint 4; aquí solo el corte durante la acción |
| CU-15 | Sí           | 3a, 3b                                 | 1a (CU-25, 09-D): Sprint 4                                 |
| CU-04 | Sí           | 3a, 3b, 6a                             | —                                                          |
| CU-03 | Sí           | 3a, 6a, 6b                             | —                                                          |
| CU-02 | Sí           | 4a, 9a (usado y vencido), 9b           | 9a por tiempo no tiene e2e (pgTAP y Vitest)                |
| CU-16 | Sí           | 1a (en las tres transiciones nuevas)   | —                                                          |
| CU-25 | —            | 2a (corte durante la acción)           | Bloqueo preventivo sin conexión: Sprint 4                  |
| CU-30 | Parcial      | Las tres transiciones crean sus avisos | Pantalla de avisos, campana y push: Sprint 5               |
| CU-14 | Sí           | La e2e de 18-C, pendiente del Sprint 2 | —                                                          |

## En cada PR

- **Contrato y prueba primero.** La prueba pgTAP corre contra el contrato y debe fallar con
  `NO_IMPLEMENTADO` antes de implementar; igual en Vitest. Se anota en el PR.
- **Después de cada migración:** `npm run staging:push`, `staging:test`, `staging:types` (el archivo
  de tipos en el mismo commit) y `staging:advisors`, sin más avisos que los anunciados en el PR 2.
- **Después de cada cambio en una Edge Function:** `npm run staging:functions` y su prueba contra
  «staging».
- **Antes de abrir el PR:** lint, formato, unitarias, build, **peso de la ruta de ingreso**,
  capturas a 360 × 800 y 1280 × 800 en `docs/sprints/evidencias/S3/` (datos de prueba y servidor
  simulado), revisión con las skills y revisión propia en dos ejes.
- **e2e que ingresan:** quedan escritas y se corren solo con permiso en ese momento. Crean sus datos
  por la API con la sesión de cada rol, nunca con la clave secreta. **Nunca cambian la contraseña de
  un usuario del seed ni desactivan a ninguno, ni desactivan una finca del seed:** CU-02 y CU-03
  trabajan con usuarios `e2e-{único}@novedades.test` que crea la prueba, y CU-04 con fincas que crea
  la prueba. Unos y otras **se acumulan en «staging» hasta el próximo `staging:reset`**, porque no
  se pueden borrar.
- **Ingresos por corrida.** Hoy son unos 20. Los ingresos de los usuarios que crea la prueba (tres
  en CU-03 y uno en CU-02) corren solo en el tamaño de escritorio: quedan unos 24, lejos de las 170
  peticiones con que «staging» empezó a responder 429 en el Sprint 2 (punto 17).
- **Textos que Figma no trae:** con tuteo, listados en `docs/decisiones-pendientes.md` en el PR que
  los introduce. **Cambios al SDD:** en `docs/cambios-sdd.md`, en el mismo PR.
- **PR** con la plantilla y `gh pr create`, en borrador si depende de otro. Sin fusionar, sin forzar
  un `push` y sin `rebase` de ramas publicadas. Archivos agregados por nombre.

## Fuera del alcance del Sprint 3

09-D, 04-B y el bloqueo preventivo sin conexión; evidencias («Adjuntar foto» y el bloque
«Evidencias» de 09, 20 y 20-C); la etiqueta «registrada sin conexión»: Sprint 4 · pantalla de
avisos, campana, insignias del menú y push: Sprint 5 (las funciones de este sprint sí insertan en
`notificacion`) · depuración de tipos de falla y `corregir_tipo_falla`: Sprint 5, con HU-32
(decisión 29) · panel de reportes, historial con filtros, buscador por código y CSV: Sprint 5 ·
cambiar el correo de un usuario y borrar usuarios o fincas: no están en el diseño · todo lo que
toque «PROYECTO»: al cierre y con el OK del equipo.

## Riesgos del sprint

| N.º | Riesgo                                                                  | Señal                                                         | Respuesta                                                                                                                  |
| --- | ----------------------------------------------------------------------- | ------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| 1   | `--use-api` no despliega, o no empaqueta `_shared/`                     | Falla el paso 1 del PR 1                                      | Detenerse. Opciones: copiar lo compartido en cada función; desplegar desde el CI, que sí tiene Docker; o el panel          |
| 2   | Las funciones no se pueden ejecutar en los equipos                      | Un error de importación solo aparece al desplegar             | Lógica en módulos puros con Vitest; entrada mínima; `deno check` en el CI si se aprueba; registros de «staging»            |
| 3   | Diecisiete PR encadenados                                               | La review del Sprint 2 pide un cambio                         | Fusionar el Sprint 2 antes del PR 2 (ver «Base de las ramas»)                                                              |
| 4   | Una función sin sesión expuesta a internet                              | Solicitudes de recuperación que nadie pidió                   | Respuesta única, una solicitud abierta por usuario, entrada acotada; el administrador verifica la identidad (decisión 7)   |
| 5   | Alguien adivina un código de seis dígitos                               | Intentos fallidos en una solicitud                            | Cinco intentos por código, 30 minutos, un solo uso (decisión 9)                                                            |
| 6   | Una cuenta de Auth queda sin su fila de `usuario`, o al revés           | Un usuario que ingresa y la aplicación trata como desactivado | Compensación al crear; orden seguro al desactivar; acciones que se pueden repetir; prueba de cada fallo                    |
| 7   | Las pruebas dañan «staging»                                             | El compañero no puede ingresar                                | Solo usuarios y fincas que crea la prueba; nunca los del seed                                                              |
| 8   | El límite de ingresos de Auth                                           | Respuestas 429 en la corrida                                  | Los ingresos nuevos, solo en un tamaño; se reutiliza `sesiones.setup.js`                                                   |
| 9   | La ruta de ingreso pasa de 200 KB                                       | Quedan 13,9 KB y el CSS es un solo archivo                    | Todo lo nuevo bajo demanda; medir en cada PR; detenerse y avisar si se pasa                                                |
| 10  | Dos historias de 13 puntos al final de la semana                        | El miércoles no está el PR 6                                  | Recortar, en este orden: versión de teléfono de 28 a 32, advertencias de la decisión 15, insignia de 32. Nunca las pruebas |
| 11  | Un usuario desactivado con la sesión viva                               | Listas vacías sin explicación durante una hora                | Releer el perfil al recuperar el foco y ante `SIN_PERMISO` (decisión 16); `fn_activo` ya corta los datos                   |
| 12  | El código o la contraseña inicial terminan en un registro o una captura | Revisión de los registros de «staging»                        | No se registran cuerpos; el código vive solo en el diálogo; las capturas usan datos simulados                              |
| 13  | WebKit sigue sin verificar                                              | RNF-04 pide Safari                                            | Solo API estándar (`<dialog>`, `one-time-code`); e2e en el CI si el equipo lo pide                                         |
| 14  | Después de recuperar la contraseña, las sesiones abiertas siguen vivas  | Otro dispositivo sigue con sesión hasta una hora              | Se deja anotado: Auth no cierra las demás sesiones sin el token del usuario                                                |

## Decisiones para el equipo

Cada una trae una recomendación. **Adoptadas el 9 oct 2026 con la recomendación de cada una:** el
equipo dejó la decisión a criterio de la implementación. La 30 cambió ese día.

### Edge Functions

| N.º | Decisión             | Recomendación                                                                                                                                                                                                                                  |
| --- | -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Desplegar sin Docker | `supabase functions deploy --use-api`, detrás de `npm run staging:functions`, con la referencia de «staging» fija. Se prueba el día 1 (PR 1). Comprobado: el CLI 2.120.0 trae la opción                                                        |
| 2   | Cómo se prueban      | Lógica en módulos `.js` puros con Vitest; el recorrido completo, contra «staging» desplegado. **Agregar `deno check` al CI** (acción `denoland/setup-deno`): no entra al repositorio y es la única revisión estática que tendrían              |
| 3   | Claves y variables   | La función lee `SUPABASE_SECRET_KEYS` (un JSON por nombre; se usa `default`) y `SUPABASE_URL`, que inyecta la plataforma. No hay secretos que crear a mano. Las variables antiguas (`SUPABASE_SERVICE_ROLE_KEY`) no se usan                    |
| 4   | JWT                  | `restablecer-contrasena`: `verify_jwt = false`. `gestionar-usuario`: `verify_jwt` activo y, dentro, `auth.getClaims()` más la lectura del perfil (activo y administrador). «staging» firma con ES256: la verificación es local                 |
| 5   | CORS                 | Lista cerrada de orígenes (los dos `localhost`, producción y las vistas previas), con `Vary: Origin`. Sin `*`                                                                                                                                  |
| 6   | Importaciones        | `deno.json` por función con `npm:@supabase/supabase-js@2.117.0`. **No** se adopta `@supabase/server`, aunque la documentación lo recomienda: es una dependencia nueva. La entrada es `index.ts` (lo que espera el CLI) y la lógica, JavaScript |

### Recuperación de contraseña (RF-02)

| N.º | Decisión                                 | Recomendación                                                                                                                                                                                                                                                                                                                                                                               |
| --- | ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 7   | `solicitar_recuperacion` es «Sin sesión» | **Opción A (recomendada): concederle `execute` a `anon` en esa sola función**, como dice la Tabla 21, con un ADR (0013) que registra la excepción a la regla 2 y el aviso nuevo del asesor. El diseño ya tiene otra puerta sin sesión (`restablecer-contrasena`). Opción B: moverla a una tercera Edge Function; no rompe la regla, pero cambia la Tabla 21 y suma una función por mantener |
| 8   | El código                                | Como está en «Servidor» del PR 7. `generar_codigo_recuperacion` devuelve también `expira_en`, para «Vence hoy a las…». Código de error nuevo `SOLICITUD_INVALIDA` (la solicitud ya no admite un código): no está en la Tabla 22                                                                                                                                                             |
| 9   | Fuerza bruta                             | **Columna nueva `intentos_fallidos`** y máximo de **cinco** por código. Cambia el esquema (Tabla 26). Sin la columna no hay cómo contar; anular el código al primer error iría contra CU-02 9b                                                                                                                                                                                              |
| 10  | Dónde se compara el resumen              | En `consumir_codigo_recuperacion`, con `execute` solo para `service_role`: `codigo_hash` no sale de la base de datos. Se consume primero y se cambia la contraseña después: si Auth falla, el código queda gastado y hay que pedir otro. Es el lado seguro                                                                                                                                  |
| 11  | Una solicitud abierta por usuario        | Abierta = sin usar y, o no tiene código, o el código está vigente. Con una abierta, pedir otra no crea nada. Una vencida no se reabre: la persona pide otra desde 02                                                                                                                                                                                                                        |
| 12  | La _Site URL_ de «PROYECTO»              | **No hace falta para este flujo:** no usa enlaces ni redirecciones. Se corrige `cloudflare-pages.md`, que decía lo contrario. Sigue siendo sano ponerla, pero no bloquea                                                                                                                                                                                                                    |

### Usuarios (RF-03)

| N.º | Decisión                                        | Recomendación                                                                                                                                                                                                                                                                      |
| --- | ----------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 13  | El correo para el administrador                 | `listar_usuarios()`, sin parámetros, solo para un administrador activo. Sirve a la pantalla 28 y a la 32 (que cruza las solicitudes con esa lista). No está en la Tabla 21                                                                                                         |
| 14  | Interruptor «Usuario activo» de 29              | `crear` y `actualizar` aceptan `activo` (opcional); `desactivar` y `activar` quedan para los botones de la lista. Así el formulario guarda en una sola llamada                                                                                                                     |
| 15a | ¿Desactivarse a sí mismo? ¿Sin administradores? | No se permite desactivarse ni cambiarse el rol. Con eso siempre queda un administrador activo, sin contar nada                                                                                                                                                                     |
| 15b | Cambiar rol o alcance con novedades en curso    | **Se permite.** El modelo no tiene responsable individual: cualquier aprobador del área o reportante de la finca continúa. El diálogo advierte solo si era el último aprobador activo de su área o el último reportante activo de una finca con novedades abiertas                 |
| 15c | ¿Se edita el correo?                            | **No** (SDD 6.1.10 solo habla de nombre, rol y finca o área). En «Editar usuario» el correo se muestra sin poder cambiarse. Un correo mal escrito se resuelve desactivando y creando otro                                                                                          |
| 15d | Contraseña inicial                              | «Generar» arma en el navegador una palabra y cuatro cifras, como el ejemplo de Figma, con `crypto.getRandomValues`; se puede escribir otra. Debe cumplir la regla (decisión 44). Se ve en el campo, porque hay que entregarla, y en «Editar usuario» no existe: cambiarla es RF-02 |
| 16  | Sesión viva de un usuario desactivado           | La aplicación relee el perfil al recuperar el foco y cuando una acción responde `SIN_PERMISO`. Si ya no está activo: cierra la sesión local, conserva las pendientes y muestra 01-C. Si le cambiaron el rol o el alcance: actualiza el menú y lo lleva a su inicio                 |

### Fincas (RF-04)

| N.º | Decisión                                  | Recomendación                                                                                                                                                                                                                                              |
| --- | ----------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 17  | Conteos de 30 y advertencia al desactivar | Conteos con recursos embebidos de la API (`novedad(count)` y `usuario(count)`), sin objetos nuevos; si la API no los entrega así, una vista con `security_invoker`. El diálogo de 3b dice además cuántos reportantes activos se quedan sin poder registrar |
| 18  | Datos reales en producción                | Las 7 razones sociales, con un SQL que corre una persona en el panel de «PROYECTO»; el archivo vive en `docs/fuentes/`, que no se sube. Las 12 fincas, desde la pantalla 30. **El modelo sigue sin NIT, código IBM ni municipio:** ningún RF los pide      |

### Director y reportante (RF-13 y RF-15)

| N.º | Decisión                                          | Recomendación                                                                                                                                     |
| --- | ------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| 19  | Orden y contenido de 19                           | Por prioridad y luego por antigüedad, como la bandeja y como lo dibuja Figma. Páginas de 20                                                       |
| 20  | `confirmar_resolucion` y «la falla persiste»      | Como están en el PR 4. El aviso «al reportante» de las transiciones siguientes sigue yendo a quien registró la novedad (decisión 18 del Sprint 2) |
| 21  | **La solución anterior cuando la falla persiste** | Ver el cuadro de abajo. **Recomendada: la opción C**                                                                                              |
| 22  | «Tomada por» después de «la falla persiste»       | No cambia el código: ya sale de la última transición `asignada → en_atencion`. Se le agregan sus pruebas (pgTAP, Vitest y e2e)                    |

**Decisión 21, en detalle.** Hoy `solucion`, `fecha_ejecucion` y `tipo_falla_id` quedan llenos en
una novedad que vuelve a estar en atención, y el historial de `registrar_solucion` no guarda el
texto.

| Opción                                                                                                       | Detalle                                                                                         | Bandeja    | Reportes del Sprint 5                                               | Qué se pierde                                                  |
| ------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------- | ---------- | ------------------------------------------------------------------- | -------------------------------------------------------------- |
| **A.** No tocar nada                                                                                         | Una novedad en atención mostraría «Solución registrada», salvo que cada pantalla mire el estado | Sin efecto | Sin efecto: RF-27 y RF-29 miran el estado y la última resolución    | El texto de la primera solución, al registrar la segunda       |
| **B.** `reportar_falla_persiste` limpia los tres datos                                                       | Limpio: «en atención» nunca trae solución                                                       | Sin efecto | Sin efecto                                                          | Todo lo de la primera solución, de inmediato                   |
| **C.** `registrar_solucion` guarda además la solución como observación del historial, y al reabrir se limpia | Limpio, y la línea de tiempo muestra el texto de **cada** solución bajo su transición           | Sin efecto | Sin efecto: el tiempo de RF-27 ya es hasta la **última** resolución | Solo el tipo y la fecha de ejecución del intento que no sirvió |

La opción C conserva la memoria del proceso (H9) en el historial inmutable, pero cambia la Tabla 30
(«Sin observación; la solución queda en la novedad»), toca una función del Sprint 2 con una
migración nueva y hace que la línea de tiempo muestre la solución, que Figma no dibuja ahí.

### Interfaz, peso y pruebas

| N.º | Decisión                                  | Recomendación                                                                                                                                                                                                                                                                                 |
| --- | ----------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 23  | Peso de la ruta de ingreso                | `/recuperar` y `/recuperar/codigo` en su paquete; 19, 20, 28, 30 y 32, cada una en el suyo y solo para su rol. A la ruta de ingreso solo le suman el aviso de 01-E, el mensaje del 429 y dos líneas del traductor de errores. Se mide en cada PR                                              |
| 24  | Escritorio y teléfono                     | 19: las mismas tarjetas en una columna. 20: 20-C. 28, 30 y 32: la tabla pasa a tarjetas (SDD 6.1.11); el panel de 29 ocupa la pantalla; los diálogos se quedan centrados. Fincas y Recuperación no caben en la barra inferior: se llega desde «Cuenta», con una sección para el administrador |
| 25  | Inicio del administrador                  | `/usuarios`, hasta que llegue el Panel (23) en el Sprint 5. «Panel de reportes» sigue en el menú como marcador                                                                                                                                                                                |
| 26  | Pruebas de extremo a extremo              | Como dice «En cada PR»: datos propios, nada del seed, ingresos contados, y 9a por tiempo sin e2e                                                                                                                                                                                              |
| 27  | Mensaje del 429 al ingresar               | «Demasiados intentos. Espera unos minutos e intenta de nuevo.» Va en el PR 7, en un commit `fix(RF-01)`                                                                                                                                                                                       |
| 28  | Insignia de «Recuperación de contraseñas» | **Sí, en este sprint**, solo para el administrador: es la única señal de que llegó una solicitud (no genera aviso, porque no es de una novedad). Las demás insignias siguen para el Sprint 5                                                                                                  |
| 29  | `corregir_tipo_falla`                     | Se queda en el Sprint 5, con HU-32, como dicen el backlog y el plan del Sprint 2. El plan de arranque la ponía en el Sprint 3: **confirmar**                                                                                                                                                  |
| 30  | `/tratamiento-de-datos`                   | **Entra.** El equipo pidió redactar el texto (9 oct 2026). Va en un PR propio, como página estática y perezosa. Es un borrador: la empresa debe validarlo y dar los datos de contacto del responsable                                                                                         |

### Las que aparecieron al leer Figma

| N.º | Pantalla           | Qué pasa                                                                                                                                  | Recomendación                                                                                                                                                                         |
| --- | ------------------ | ----------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 31  | 09-C               | El diálogo no tiene campo de observación, pero CU-15 3 dice «si lo desea, escribe una observación» y la función la recibe                 | Agregar «Observación (opcional)» al diálogo. Es apartarse de Figma para cumplir el caso de uso: **confirmar**, y reflejarlo en Figma                                                  |
| 32  | 20                 | No dice si es una pantalla aparte o el detalle                                                                                            | Es el detalle (`/novedades/:id`) del director cuando la novedad está escalada. La línea de tiempo baja a la columna izquierda, como en Figma                                          |
| 33  | 19                 | «Aprobadas este mes» y «Rechazadas este mes»: ¿de quién y de qué mes?                                                                     | Las decisiones **de quien consulta**, en el mes calendario de Colombia (SDD 5.2.4: «cuántas aprobó y rechazó»)                                                                        |
| 34  | 20-C               | Una nota dice que cada botón abre una hoja con la observación, pero no la dibuja                                                          | Hoja con los textos del panel de 20: la consecuencia, «Observación», su ayuda y «Confirmar decisión»                                                                                  |
| 35  | 28, 30             | Muestran «1–6 de 31 usuarios» y «1–7 de 12 fincas», con flechas                                                                           | Páginas de 20, como las demás listas, con el rango y las flechas de Figma. Filtros y búsqueda en el navegador: son decenas de filas                                                   |
| 36  | 20                 | Dibuja «Aprobar» ya elegido; no hay estado sin elección ni contador                                                                       | Sin opción elegida al abrir, y el botón deshabilitado hasta elegir. Contador «0/500», como en las hojas del Sprint 2                                                                  |
| 37  | 28, 30             | Reactivar tiene ícono, pero no diálogo. Desactivar una finca sin novedades abiertas tampoco está dibujado                                 | Reactivar, en un clic con su aviso temporal. Desactivar una finca siempre pide confirmación; sin novedades abiertas, sin el recuadro de advertencia                                   |
| 38  | 20-C               | Dibuja la barra de acciones y, debajo, la navegación                                                                                      | La barra reemplaza a la navegación, como en 09, 13 y 14 (regla del Sprint 2)                                                                                                          |
| 39  | 28                 | «Último ingreso» no está en el modelo                                                                                                     | Sale de Auth por `listar_usuarios`. Es el último ingreso con contraseña: quien lleva días con la sesión abierta muestra una fecha vieja                                               |
| 40  | 29                 | Solo dibuja «Nuevo usuario». Dice «podrá cambiarla después», pero no hay pantalla para cambiar la contraseña                              | «Editar usuario» con los mismos campos, sin contraseña y con el correo fijo. El texto de Figma se deja: hoy el cambio es por RF-02                                                    |
| 41  | 30                 | El nodo dibuja el diálogo de desactivar sobre la lista; la restricción única distingue mayúsculas («Juanca» y «juanca» serían dos fincas) | La lista sale de lo que se ve detrás. Antes de guardar, el formulario compara sin mayúsculas ni tildes contra las fincas de esa razón social; la restricción sigue siendo la garantía |
| 42  | 32                 | Solo dibuja «Pendiente». El SDD nombra cuatro estados                                                                                     | Pendientes: «Pendiente» y «Código generado» (con «Generar otro código»). Atendidas: «Usada» y «Vencida», sin acción. El código se muestra «482 719» y se copia sin el espacio         |
| 43  | 03                 | Seis casillas para el código                                                                                                              | **Un solo campo** con el aspecto de seis casillas (`autocomplete="one-time-code"`, `inputmode="numeric"`): se puede pegar y lo anuncia bien un lector de pantalla                     |
| 44  | 03                 | «Al menos una letra y un número», pero Auth solo exige 8 caracteres                                                                       | La regla se valida en el cliente y en las dos funciones. La configuración de Auth no se toca en este sprint                                                                           |
| 45  | 03, 03-B           | No dibuja el código incorrecto (9b)                                                                                                       | Bajo el campo: «El código no es válido. Revísalo; si sigue sin servir, pide uno nuevo.» El mensaje actual del traductor mandaba a pedir otro de una vez                               |
| 46  | 01-E, 02, 03       | Solo están en el teléfono                                                                                                                 | En el escritorio, la misma columna centrada del ingreso. Rutas `/recuperar` y `/recuperar/codigo`                                                                                     |
| 47  | 09, 20, 20-C, menú | «Evidencias», «Adjuntar foto», «registrada sin conexión» e insignias                                                                      | No se pintan todavía (Sprint 4 y 5), salvo la insignia de la decisión 28. El recuadro de la justificación solo lo ve el director, en una escalada                                     |

Los textos que Figma no trae (avisos temporales de decidir, cerrar y devolver; estados de 32;
«Editar usuario» y «Editar finca»; errores de campo de 29 y 03; la línea de los reportantes en el
diálogo de 30; la sección de «Cuenta» del administrador) se redactan con tuteo y se listan en
`docs/decisiones-pendientes.md` en el PR que los introduce.

## Cambios previstos al SDD

Cada uno va a `docs/cambios-sdd.md` (la próxima entrada es la 10) en el PR que lo introduce, con su
texto propuesto.

| PR  | Sección                        | Qué cambia                                                                                                                             |
| --- | ------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | SDD 5.3.4, Tabla 23            | Precisión: cuerpo de los errores (`codigo`, `campos`), `activo` opcional, estados 403 y 404, CORS y `verify_jwt` de cada función       |
| 1   | SDD 4.2.10 y ADR 0012          | Complemento: las funciones se despliegan sin Docker y su lógica se prueba fuera de Deno                                                |
| 2   | SDD 5.3.2, Tabla 21            | Precisión: firmas del sprint. **Cambio:** dos funciones nuevas, `listar_usuarios` y `consumir_codigo_recuperacion`                     |
| 2   | SDD 6.1.3 y regla 2 (ADR 0013) | **Excepción**, si se aprueba la 7: `solicitar_recuperacion` es la única función que `anon` puede ejecutar                              |
| 4   | SDD 6.1.3, Tabla 30            | **Cambio**, si se aprueba la 21 C: `registrar_solucion` deja la solución en el historial y `reportar_falla_persiste` limpia la novedad |
| 6   | SDD 6.1.10 y 6.1.4 (Tabla 31)  | Precisión: el correo no se edita, nadie se desactiva a sí mismo, la contraseña inicial; el administrador lee el correo por una función |
| 6   | SDD 5.3.1, Tabla 19            | Complemento: el perfil se relee con la sesión viva (usuario desactivado o con otro rol)                                                |
| 6   | SDD 5.2, Tabla 10              | Precisión temporal: el administrador entra a Usuarios hasta que exista el Panel                                                        |
| 7   | SDD 6.1.1, Tabla 26            | **Cambio**, si se aprueba la 9: `intentos_fallidos` y el índice único parcial de `solicitud_recuperacion`                              |
| 7   | SDD 5.3.2, Tabla 22            | Complemento: `SOLICITUD_INVALIDA` y `CORREO_EXISTENTE`; `CODIGO_INVALIDO` deja reintentar                                              |
| 7   | SDD 6.1.10 y 7.3               | Precisión: una solicitud abierta por usuario; máximo de intentos (parámetro nuevo); estados de la pantalla 32                          |

## Cierre del sprint

En la rama `docs/S3-informe`: `docs/sprints/S3.md` con la estructura de `S2.md` (meta y
cumplimiento, historias y PR, orden de fusión, migraciones y Edge Functions, pruebas, cobertura por
curso, evidencia, desviaciones, riesgos, revisión propia y etiqueta); `docs/sprints/S3-demo.md` con
el recorrido (registrar → tomar → escalar → aprobar → resolver → confirmar; la falla persiste; crear
un usuario y recuperarle la contraseña; crear y desactivar una finca); capturas finales de 01-E, 02,
02-B, 03, 03-B, 09, 09-B, 09-C, 19, 20, 20-B, 20-C, 28, 28-B, 29, 29-B, 30, 30-B y 32; peso de la
ruta de ingreso y Lighthouse; `README.md` (estado, Edge Functions y `staging:functions`),
`docs/decisiones-pendientes.md` y `docs/cambios-sdd.md` al día.

Queda para las personas, y el informe lo lista con sus pasos: review y fusión de cada PR; correr las
e2e que ingresan; ingresar en una vista previa; con el OK del equipo, aplicar en «PROYECTO» las
migraciones del Sprint 2 y del Sprint 3 y desplegar las dos Edge Functions; crear el primer
administrador (punto 18); cargar las razones sociales y las fincas reales (decisión 18); reflejar en
Figma las decisiones 31 a 47 que se aprueben; y la etiqueta `v0.3.0-s3`.
