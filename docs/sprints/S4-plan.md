# Sprint 4 · Plan de implementación

- **Fechas:** 14–19 oct 2026 (cuatro días hábiles: 14, 15, 16 y 19 oct). El calendario decía 3–6
  nov; el equipo va adelantado (el Sprint 3 cerró el 10 oct) y empieza al aprobar.
- **Historias:** HU-21, HU-22, HU-23, HU-24, HU-25 y HU-08 (RF-21 a RF-25 de la épica E5 y RF-08
  de la E2)
- **Estado:** aprobado el 13 oct 2026, con los puntos propuestos y las 41 decisiones con su
  recomendación. El equipo autorizó las e2e que ingresan y la descarga de los cinco íconos, y dejó
  los dispositivos reales a criterio de la implementación (decisión 29). Lo que cambie en la review
  se ajusta en el PR que corresponda.

**Meta:** el reportante registra y consulta sin conexión, y nada que cambie el estado se hace sin
red.

**Incremento que se demuestra:** registrar en modo avión, cerrar la aplicación, volver con red y
ver la novedad sincronizada, con su código, su fecha real y sin duplicado; consultar sin red lo
descargado; ver bloqueadas las acciones que cambian el estado; adjuntar una foto con conexión.

**Este sprint agrega la cola; no rehace el registro.** El registro nació preparado: `id_local` y la
fecha real se fijan en el dispositivo desde el Sprint 1, `registrar_novedad` es idempotente y
`enviarNovedad.js` es el único punto que cambia.

## Punto de partida (verificado el 13 oct 2026, 11:10 p. m., en `main`)

| Verificación                | Resultado                                                                                                                                                        |
| --------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `main` en GitHub            | `4ab2f04` (informe del Sprint 3, #27). Sprints 1 a 3 completos                                                                                                   |
| Copia local                 | Estaba en `docs/S3-informe`, sin diferencias con `origin/main`. `main` local iba 20 commits atrás: se puso al día con `git pull --ff-only`                       |
| PR abiertos                 | Solo #19 (`feat/RNF-18-tratamiento-de-datos`, borrador): espera la revisión de la empresa                                                                        |
| Etiquetas                   | **Ninguna**, ni local ni en GitHub. Falta `v0.3.0-s3`, y tampoco existen `v0.1.0-s1` ni `v0.2.0-s2`                                                              |
| Node                        | 24.14.0; `.nvmrc` pide 24                                                                                                                                        |
| CLI de Supabase, Playwright | 2.120.0 y 1.63.0                                                                                                                                                 |
| `npm run lint`              | Sin advertencias                                                                                                                                                 |
| `npm run format:check`      | Correcto                                                                                                                                                         |
| `npm run test`              | 1164 pruebas: 1163 pasan y 1 falla esperada (`it.fails`, contraste de «escalada»)                                                                                |
| `npm run build`             | Correcto. Ruta de ingreso: 150,5 + 8,8 + 26,8 + 2,2 ≈ **188,3 KB de 200** (quedan ≈ 11,7 KB). Es el mismo archivo del cierre del Sprint 3 (mismo hash)           |
| `npm run staging:test`      | 18 archivos, 734 aserciones, 0 fallidas                                                                                                                          |
| `npm run staging:advisors`  | 16 avisos _WARN_: 13 por las funciones RPC, el de `anon` por `solicitar_recuperacion` y 2 de Auth. Ninguno nuevo                                                 |
| «staging»                   | 46 usuarios (7 activos, los del seed), 17 fincas, 566 novedades, 30 tipos de falla, 0 evidencias, 25 migraciones (la última, `20261010011325`). PostgreSQL 17.11 |
| Storage de «staging»        | **Ningún bucket y ningún archivo**                                                                                                                               |
| `npm run test:e2e:chromium` | **Sin correr:** necesita la autorización de «Antes de empezar»                                                                                                   |

Las cifras coinciden con las del cierre del Sprint 3. Datos nuevos:

- **Lo que hace `staging:reset` con Storage** (punto 24). `db reset --linked` corre el script
  `drop.sql` del CLI: borra los esquemas propios, las tablas de `public`, **todas las políticas
  (también las de `storage.objects`)** y vacía `auth`, pero **no toca `storage.buckets` ni
  `storage.objects` ni los archivos**. Después del reset el bucket sigue ahí con sus fotos, y las
  migraciones vuelven a crear las políticas. Por eso la migración del bucket tiene que poder correr
  sobre un bucket que ya existe (decisión 19).
- **La Figura 18 del SDD** (secuencia del registro sin conexión y la sincronización) no quedó en el
  Markdown. Se sacó del `.docx` con la skill `docx`: coincide con el seudocódigo de 6.1.5 (registro
  con `tx.done`, ciclo en orden de `fecha_registro`, 401 que conserva la cola y error de red que
  detiene). No trae nada que el texto no diga.
- **«staging» crece:** 566 novedades, casi todas de las pruebas. La prueba intermitente de CU-11
  (`decisiones-pendientes.md`, punto 17) recorre «Mis novedades» entera.
- `src/modules/e5-sin-conexion/` existe y está vacía: ahí van las pantallas nuevas del sprint.

## Antes de empezar

| Necesidad                                                      | Para qué                                                                                                             | Estado al 13 oct 2026                              |
| -------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------- |
| Aprobar este plan, los puntos y las decisiones del final       | Sin eso no se escribe código del sprint                                                                              | **Hecho** (13 oct)                                 |
| Fechas reales                                                  | El calendario dice 3–6 nov; se propone empezar desde el 14 oct                                                       | **Hecho:** 14–19 oct                               |
| Autorizar que el agente corra las e2e que ingresan             | RNF-07 a RNF-09 se demuestran con una sincronización real. Cargan `.env.local` solas; la contraseña no pasa por aquí | **Hecho** (13 oct)                                 |
| Autorizar o no que el agente recorra una vista previa de Pages | Ingresar con un usuario de prueba en la vista previa de un PR (`built-in-browser`)                                   | Sin respuesta: no se hace                          |
| **Descargar cinco íconos** de Google                           | `download`, `photo_camera`, `image`, `add_a_photo` y `delete` (Figma 05-B, 05, 05-D y 09) no están en `iconos/`      | **Hecho** (13 oct)                                 |
| Cuándo se aplica la migración del bucket en «PROYECTO»         | Tiene que estar antes de fusionar su PR (decisión 28)                                                                | Con la recomendación; el OK se pide en ese momento |
| Qué dispositivos reales hay                                    | Android de gama media e iPhone, para la lista de chequeo (decisión 29)                                               | **A criterio de la implementación:** ver la 29     |
| El trabajo de e2e en el CI                                     | WebKit sigue sin verificar (decisión 27)                                                                             | **Sí** (con la recomendación)                      |
| Lo que sigue abierto del Sprint 3                              | #19 (la empresa), las etiquetas y reflejar en Figma las decisiones 31 a 47                                           | Pendiente del equipo                               |
| Avisar antes de un `staging:reset`                             | No se prevé ninguno: el bucket entra con `staging:push`. Sigue el de antes de la demo                                | —                                                  |

**Los íconos.** `src/core/ui/iconos/LEEME.md` manda bajarlos de
`https://fonts.gstatic.com/s/i/short-term/release/materialsymbolsrounded/<nombre>/default/20px.svg`
(Material Symbols Rounded, Apache 2.0, el mismo conjunto de los que ya están). Son cinco SVG de
menos de 1 KB cada uno. Se piden ahora para no frenar las pantallas a mitad del sprint, como pasó
con `gavel` y `format_quote` en el Sprint 3.

Nada de este plan toca «PROYECTO» sin el OK del equipo. Lo que le llega está en la decisión 28 y en
«Cierre del sprint».

### Base de las ramas

Los Sprints 1 a 3 están en `main`: todo sale de `main` al día. Un PR cuya base no esté fusionada
sale de la rama de ese PR, va en borrador y dice «Depende de #N»; al fusionarse la base, se le trae
`main`. Recordatorio: el entorno no deja que el agente fusione; lo hace una persona después de la
review.

## Skills del entorno

Están en la lista y se usan así. Ninguna se instala ni se copia al repositorio: nada de
`npx skills add`, `.claude/skills/`, `.agents/` ni `skills-lock.json`; los archivos se agregan por
nombre.

| Skill                                         | Uso en este sprint                                                                                                                                                                   |
| --------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `supabase`                                    | **Ya se usó para este plan:** bucket por SQL, políticas de `storage.objects`, URLs firmadas, `db reset --linked` (leído en el código del CLI). Su lista de seguridad en los PR 6 y 7 |
| `supabase-postgres-best-practices`            | **Ya se usó** para elegir el disparador con bloqueo de fila (decisión 20). Antes de escribir la migración del bucket y cada prueba pgTAP                                             |
| `vitest`                                      | Cola y sincronizador con `fake-indexeddb`; monitor con temporizadores y `fetch` simulados; Web Locks y `BroadcastChannel` simulados; cálculo de la reducción; pantallas              |
| `vercel-react-best-practices`                 | **Ya se usó:** un solo oyente global (`client-event-listeners`), hooks que devuelven un booleano (`rerender-derived-state`), carga condicional del reductor (`bundle-conditional`)   |
| `accessibility`                               | Anuncio del indicador, acciones deshabilitadas que se explican, campo de foto y 05-D, errores de la cola, foco en 07 y 08-B                                                          |
| `web-design-guidelines`                       | Revisión de la interfaz en cada PR con pantallas                                                                                                                                     |
| `webapp-testing`                              | Playwright sobre el build con service worker: `context.setOffline(true)`, cerrar y reabrir, capturas a 360 × 800 y 1280 × 800                                                        |
| `cloudflare:web-perf`                         | Al cierre: Lighthouse (instalable, abre sin red) y peso de la ruta de ingreso. Si pide una herramienta que no está, se pregunta antes                                                |
| `wrangler`                                    | Solo para consultar despliegues y vistas previas de Pages. No se despliega con él (ADR 0004)                                                                                         |
| `built-in-browser`                            | Recorrer la vista previa de un PR con un usuario de prueba, si el equipo lo autoriza                                                                                                 |
| `docx`                                        | **Ya se usó** para sacar la Figura 18 del SDD                                                                                                                                        |
| `figma-design-to-code` (recurso del conector) | **Ya se cargó.** Para este plan se pidieron 04-B, 05-B, 05-D, 07, 08, 08-B, el campo Foto de 05 y «Evidencias» de 09; 09-D, 11-B y 14-B como captura                                 |
| `code-review`                                 | Revisión propia de cada PR, además de los dos ejes                                                                                                                                   |
| `ponytail` (pedida por el equipo)             | Activa en todo el sprint: el cambio más chico que resuelve todo, sin abstracciones de más. Cada atajo con límite conocido lleva su comentario (decisión 41)                          |
| `ponytail-review`                             | Segunda revisión de cada PR: lógica, seguridad, carga real y cada línea necesaria                                                                                                    |
| `ponytail-debt`                               | Al cierre: la lista de atajos que quedaron, para el informe                                                                                                                          |
| `security-review`                             | En los PR 6 y 7 (bucket, políticas y archivos de los usuarios)                                                                                                                       |

- `pdf` no hizo falta: `docs/fuentes/md/Plan.md` alcanzó.
- **Conectores:** Supabase, solo contra «staging» y para leer (`search_docs`, `get_advisors`,
  `list_tables`); nunca `apply_migration` ni «PROYECTO». Figma, solo para leer. Cloudflare, opcional
  y solo para consultar.
- **No aplican:** `frontend-design`, `dataviz`, `skill-creator`, `find-skills`, `deep-research`,
  `docs`, `pptx`, `xlsx`, `computer-use` y las de Cloudflare para Workers, Durable Objects, Agents,
  Turnstile, correo o Next.js.

## Orden de los PR

```
docs/S4-plan (este documento)

PR 0  chore/S4-e2e-en-ci (si se aprueba la 27; un día como máximo) ─────────────────────────┐
PR 1  monitor (RF-23) ──┬──► PR 2 registrar sin conexión (RF-21) ──► PR 3 sincronizar (RF-22) │
                        └──► PR 4 consultar sin conexión (RF-24) ──► PR 5 restringir (RF-25)  │
PR 6  bucket y políticas (RF-08, servidor; sale de main) ─────────────────► PR 7 fotos (RF-08, cliente)

docs/S4-informe
```

**Qué cambia frente a la sugerencia y por qué:**

- **RF-08 se parte en dos.** El PR 6 (migración, disparador y pgTAP) es lo único de servidor del
  sprint: lo hace el día 1 quien lleva el servidor, sin depender de nada, y deja tiempo para el
  simulacro y la aplicación en «PROYECTO» antes de fusionar (decisión 28). El PR 7 (cliente) sigue
  al final, porque es lo que sale si falta tiempo; necesita además el 1 (el monitor) y el 2 (05-B).
  Si RF-08 sale, el PR 6 no se fusiona y no pasa nada.
- **El 4 y el 5 no dependen del 2 ni del 3.** Solo necesitan el monitor (PR 1): con dos personas,
  una lleva la cola (2 → 3) y la otra la consulta y el bloqueo (4 → 5). El 5 va después del 4
  porque los dos tocan `DetalleNovedad.jsx` (14-B es el detalle sin conexión).
- **PR 0 (opcional):** las e2e en el CI, con Chromium y WebKit. Si se atasca un día, se deja.
- Si lo hace una sola persona (o el agente), va en serie: 6 → 1 → 2 → 3 → 4 → 5 → 7 (el 0 al
  principio, si se aprueba).
- **Review:** una persona revisa los PR 0, 3, 6 y 7 (sincronización, servidor y seguridad); la
  otra, los PR 1, 2, 4 y 5.

| Día   | Servidor y lógica                                                          | Cliente                                                 |
| ----- | -------------------------------------------------------------------------- | ------------------------------------------------------- |
| Día 1 | PR 6: migración del bucket, disparador y pgTAP en «staging» · PR 0 (si va) | PR 1: monitor, contador e indicador                     |
| Día 2 | PR 3: `sincronizador.js` y sus pruebas con `fake-indexeddb` (lógica pura)  | PR 2: cola, 05-B y 07                                   |
| Día 3 | PR 3: 08 y 08-B, disparadores; e2e de RNF-07 a RNF-09                      | PR 4: almacén `novedades`, 04-B, 11-B y detalle sin red |
| Día 4 | PR 6 a «PROYECTO» (con el OK) · revisión cruzada, asesor, peso y e2e       | PR 5: 14-B, 09-D y el director · PR 7: fotos · capturas |

Reparto sugerido: quien hizo el servidor en el Sprint 3 hace ahora la cola y la sincronización, y
al revés.

## Puntos propuestos (DoR)

| Historia  | Requerimiento                  | Puntos | Por qué                                                                                                                                          |
| --------- | ------------------------------ | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| HU-23     | RF-23 · Estado de conexión     | 5      | Monitor nuevo con verificación periódica; contador reactivo entre pestañas; un solo anuncio; reemplaza `useEnLinea` sin cambiar sus 9 llamadores |
| HU-21     | RF-21 · Registrar sin conexión | 5      | Cola con escritura confirmada y cuota llena; 05-B y 07; la red que falla al enviar; manejo de versiones de la base local                         |
| HU-22     | RF-22 · Sincronizar            | 8      | Ciclo con bloqueo entre pestañas, sesión, cuatro clases de error y orden; 08 y 08-B; la e2e de RNF-07 a RNF-09                                   |
| HU-24     | RF-24 · Consultar sin conexión | 8      | Almacén `novedades` para tres listas y el detalle, con filtros, orden y conteos locales; pendientes en 04-B; 3a                                  |
| HU-25     | RF-25 · Restringir acciones    | 3      | Sobre el monitor y la Tabla 35: deshabilitar con explicación en tres roles, hojas abiertas; 14-C ya existe                                       |
| HU-08     | RF-08 · Evidencia fotográfica  | 13     | Bucket, políticas de Storage, disparador nuevo, reducción en el navegador, URLs firmadas y cinco pantallas                                       |
| **Total** |                                | **42** | El Sprint 2 fueron 38 y el 3, 41, en semanas de cinco días                                                                                       |

**Recomendación:** comprometer las cinco historias de E5 (**29 puntos**) y dejar HU-08 (13) sobre
la línea de corte, como dice el plan de arranque («planear esos sprints con menos puntos»). Con la
velocidad del Sprint 3 (≈ 8 puntos por día), cuatro días dan unos 33. Si al terminar el día 3 no
están el PR 3 y el PR 4, RF-08 sale; nunca las pruebas de RF-21 a RF-25.

Adoptados el 13 oct 2026 y anotados en `docs/scrum/backlog.md` y `backlog.json`.

---

## PR 0 · `chore/S4-e2e-en-ci` (si se aprueba la decisión 27)

Un trabajo nuevo del CI, `e2e`: levanta Supabase local (`supabase start`, como el trabajo `bd`),
genera una contraseña al azar para los usuarios del seed, construye la aplicación contra el
Supabase local y corre `npm run test:e2e` en Chromium y WebKit, a 360 × 800 y 1280 × 800.

- Sin dependencias nuevas: Playwright ya está; los navegadores se instalan con
  `npx playwright install --with-deps chromium webkit`.
- **La primera semana no bloquea** (`continue-on-error`): si es estable, pasa a ser obligatorio.
- Sin capturas de error como artefacto público: `test-results/` guarda lo escrito en los campos.
- Límite: un día. Si no queda, se cierra el PR y WebKit sigue como riesgo.

---

## PR 1 · `feat/RF-23-monitor-de-conexion`

**Pantallas de Figma:** el componente Conexión (`1:116`, tres variantes), 04-B (`2:160`), 07
(`2:935`) y 08 (`2:982`).

| Ruta                              | Contenido                                                                                                                     |
| --------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `src/core/conexion/monitor.js`    | Store externo: `enLinea`, `suscribir`, `informarFalloDeRed`, `informarRespuesta`; verificación periódica (decisión 11)        |
| `src/core/conexion/useEnLinea.js` | **Misma firma**, ahora lee el monitor con `useSyncExternalStore`. Sus 9 llamadores no cambian                                 |
| `src/core/supabase/cliente.js`    | `global.fetch` del cliente único: un fallo de red avisa al monitor y cualquier respuesta lo confirma. Unas cinco líneas       |
| `src/core/offline/pendientes.js`  | Store del contador de pendientes del usuario: se recalcula al guardar, al sincronizar y con `BroadcastChannel` entre pestañas |
| `src/core/offline/bd.js`          | `contarPendientes(reportanteId)`; `blocking` cierra la conexión para no trabar a otra pestaña (decisión 4)                    |
| `src/core/ui/Conexion.jsx`        | Prop `pendientes`: «Sin conexión · 1 pendiente», «En línea · 2 pendientes»; deja de ser `role="status"` (decisión 12)         |
| `src/app/Marco.jsx`               | Pasa el contador a las dos barras; una sola región `aria-live` anuncia los cambios                                            |
| `src/app/paginas/Cuenta.jsx`      | La advertencia de cerrar sesión cuenta solo las pendientes del usuario (RNF-10)                                               |

**Pruebas**

| Nivel  | Prueba                                                                                                                                               | CU        |
| ------ | ---------------------------------------------------------------------------------------------------------------------------------------------------- | --------- |
| Vitest | Monitor: `offline` y `online` del navegador; un fallo de red pasa a sin conexión aunque `navigator.onLine` diga que hay; la verificación lo devuelve | CU-23 1   |
| Vitest | Monitor: verifica cada 15 s solo sin conexión y con la pestaña visible; una respuesta tardía (más de 5 s) cuenta como fallo; nunca al revés          | CU-23 1   |
| Vitest | Contador: cuenta solo las del usuario; se actualiza con un mensaje de otra pestaña (`BroadcastChannel` simulado)                                     | CU-23 3   |
| Vitest | Indicador: los cinco textos (en línea, sin conexión, con 1 y con N pendientes, sincronizando); el anuncio sale una vez                               | CU-23 2–4 |
| e2e    | `cu-23-estado-de-conexion.spec.js`: con `setOffline` el indicador cambia y vuelve; sin ingresar (sesión fabricada, como RNF-10)                      | CU-23     |

**No cubre:** el contador nunca pasa de cero hasta el PR 2 (se prueba con datos sembrados).

---

## PR 2 · `feat/RF-21-registrar-sin-conexion`

**Pantallas de Figma:** 05-B (`2:538`) y 07 (`2:935`).

| Ruta                                           | Contenido                                                                                                                                   |
| ---------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/core/offline/cola.js`                     | `encolar(borrador, perfil)`: escribe en `pendientes` y espera `tx.done`; `QuotaExceededError` → 2a, cualquier otra falla → 2b (decisión 1)  |
| `src/modules/e2-registro/enviarNovedad.js`     | Un error de red (o de sesión, decisión 2) ya no se devuelve: el borrador va a la cola con el mismo `id_local` y la misma fecha              |
| `src/modules/e2-registro/RegistrarNovedad.jsx` | 05-B cuando el monitor dice sin conexión: aviso, «Guardar en el dispositivo» y la nota de la barra. Se quita el mensaje interino (punto 10) |
| `src/modules/e2-registro/NovedadGuardada.jsx`  | 07 en `/registrar/guardada`, `React.lazy`: resumen, `LOC-XXXX`, aviso y «Ver pendientes (N)» · «Registrar otra novedad»                     |
| `src/app/Rutas.jsx`                            | La ruta de 07                                                                                                                               |

**Reglas**

- **05-B.** Con el monitor sin conexión, el formulario muestra el aviso «Sin conexión · La novedad
  se guardará en este teléfono y se enviará sola cuando vuelva el internet.», el botón dice
  «Guardar en el dispositivo» (ícono `download`) y la nota de la barra, «Se guardará en este
  teléfono con la fecha y hora actual y tu usuario». Si vuelve la red antes de guardar, regresa a
  «Enviar novedad».
- **07 aparece solo después de `tx.done`.** Antes, nada dice que quedó guardada.
- **2a y 2b** conservan lo escrito en el formulario; los textos van en la decisión 1.
- Al encolar se vuelve a pedir `navigator.storage.persist()` (decisión 3).

**Pruebas**

| Nivel  | Prueba                                                                                                                      | CU            |
| ------ | --------------------------------------------------------------------------------------------------------------------------- | ------------- |
| Vitest | `encolar`: guarda la forma de la Tabla 32 y resuelve solo con la transacción completa; el contador sube                     | CU-21 1–3, 5  |
| Vitest | `QuotaExceededError` → 2a; otra falla → 2b; en los dos, nada en la cola y el formulario intacto                             | CU-21 2a, 2b  |
| Vitest | `enviarNovedad`: red → cola, con el mismo `id_local` y la misma fecha del primer intento; negocio → mensaje, sin cola       | CU-05 5a      |
| Vitest | 05-B y 07: textos de Figma; «Ver pendientes (N)»; el foco va al título de 07                                                | CU-21 4       |
| e2e    | `cu-21-registrar-sin-conexion.spec.js`: sin red registra, ve 07 y «Sin conexión · 1 pendiente»; recarga sin red y sigue ahí | CU-21, RNF-07 |

**No cubre:** el envío (PR 3) ni el campo Foto de 05-B (PR 7).

---

## PR 3 · `feat/RF-22-sincronizar-pendientes`

**Pantallas de Figma:** 08 (`2:982`) y 08-B (`2:1048`).

| Ruta                                            | Contenido                                                                                                                     |
| ----------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `src/core/offline/sincronizador.js`             | `sincronizar({ manual })`: bloqueo, sesión, orden, clasificación de errores y resultado de cada pendiente (decisiones 5 a 10) |
| `src/app/useSincronizacion.js`                  | Los disparadores, montados en el marco (que ya carga bajo demanda): al abrir con red, al volver la red y al ingresar          |
| `src/modules/e5-sin-conexion/Pendientes.jsx`    | 08 y 08-B en `/pendientes`, `React.lazy`, solo el reportante                                                                  |
| `src/modules/e5-sin-conexion/SesionVencida.jsx` | El bloque de 08-B, que también sale arriba de «Mis novedades» (decisión 7)                                                    |
| `src/app/Rutas.jsx`, `src/core/sesion/roles.js` | La ruta nueva                                                                                                                 |

**El ciclo** (SDD 6.1.5, Figura 18):

1. Si ya corre uno en la pestaña, o no hay conexión, termina. Pide el bloqueo
   `navigator.locks.request('novedades-sincronizacion', { ifAvailable: true })`; si lo tiene otra
   pestaña, termina.
2. Las pendientes que quedaron en `enviando` (la aplicación se cerró a mitad del envío) vuelven a
   `pendiente`. Solo se toman las del usuario de la sesión.
3. Confirma la sesión (`getSession()`, que la renueva si venció) con 4 s de espera máxima. Sin
   sesión → 08-B y termina, con la cola intacta.
4. Por cada pendiente, en orden de `fecha_registro`: `enviando` → `registrar_novedad`. Éxito: se
   borra, se guarda el código para mostrarlo y el contador baja. Red: `error` y se detiene. Sesión:
   se detiene y 08-B. Negocio: `error` y sigue. `SIN_PERMISO`: `error`, relee el perfil y se
   detiene.
5. Si la cola quedó vacía, guarda «Última sincronización completa» en `meta`.

Un ciclo automático salta las que tienen un error de negocio (solo se reintentan a mano, CU-23
3a); las que tienen un error de red sí se reintentan solas. «Reintentar» devuelve esa pendiente a
`pendiente` y corre el ciclo; «Reintentar todo», todas.

**Pruebas**

| Nivel  | Prueba                                                                                                                                                                                             | CU                     |
| ------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------- |
| Vitest | Envía en orden de `fecha_registro`, con su `id_local` y su fecha; borra cada una al recibir el código                                                                                              | CU-22 2–7              |
| Vitest | La misma `id_local` dos veces (el servidor devuelve la misma novedad): una sola fila local que se borra, sin error                                                                                 | CU-22 4a               |
| Vitest | Red a mitad: la que se enviaba queda en `error`, las demás intactas; al volver la red se reintenta sola                                                                                            | CU-22 3b               |
| Vitest | Sesión vencida (sin sesión al renovar y 401 durante el envío): 08-B, cola intacta                                                                                                                  | CU-22 3a               |
| Vitest | `FINCA_NO_ASIGNADA`, `AREA_INVALIDA`, `DATO_OBLIGATORIO`: `error` y sigue con la siguiente; el ciclo automático no la repite; «Reintentar» sí                                                      | CU-22 4b               |
| Vitest | `SIN_PERMISO`: no marca toda la cola; pide la relectura del perfil                                                                                                                                 | Decisión 8             |
| Vitest | Dos llamadas a la vez y el bloqueo en manos de otra pestaña: un solo ciclo (`navigator.locks` simulado)                                                                                            | Decisión 6             |
| Vitest | `enviando` sobrante vuelve a `pendiente`; las de otro usuario no se envían ni se cuentan                                                                                                           | RNF-10                 |
| Vitest | 08 y 08-B: «Enviando 2 de 3», «Enviada · código NOV-0155», «En espera», «Error al enviar» con su motivo, «Última sincronización completa»                                                          | CU-23 3a               |
| e2e    | `rnf-07-sincronizar-sin-duplicados.spec.js`: sin red registra dos, cierra la página, abre otra con red y por la API ve una fila de cada una con `fecha_registro` anterior a `fecha_sincronizacion` | RNF-07 a RNF-09, CU-22 |
| e2e    | 08-B con una sesión vencida fabricada (como RNF-10): la cola se conserva y «Ingresar» lleva al ingreso                                                                                             | CU-22 3a               |

**No cubre con e2e:** 4b (haría falta desactivar una finca del seed o crear una con su reportante;
queda con Vitest y con la prueba pgTAP de `FINCA_NO_ASIGNADA` del Sprint 3).

---

## PR 4 · `feat/RF-24-consultar-sin-conexion`

**Pantallas de Figma:** 04-B (`2:160`), 11-B (`3:407`), 09-D (`2:1479`) y 14-B (`3:1064`) en lo que
toca a los datos («Datos del…»).

| Ruta                                          | Contenido                                                                                                                        |
| --------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `src/core/offline/novedadesLocales.js`        | Guardar por `id` combinando lo que traiga cada consulta; leer, filtrar, ordenar, contar y paginar como el servidor (decisión 13) |
| `src/core/supabase/repositorios/novedades.js` | Cada lectura guarda lo que recibe; ante un error de red responde desde el dispositivo con `descargadaEn`                         |
| `src/modules/e4-consulta/MisNovedades.jsx`    | 04-B: aviso con la fecha, pendientes arriba de «Abiertas» con «Sin código» (decisión 14), 3a                                     |
| `src/modules/e3-atencion/Bandeja.jsx`         | 11-B: aviso «Bandeja descargada…», contadores y pestañas con lo descargado                                                       |
| `src/modules/e3-atencion/Escaladas.jsx`       | La lista del director sin red (decisión 15)                                                                                      |
| `src/modules/e4-consulta/DetalleNovedad.jsx`  | La última versión descargada, «Datos del {fecha}», sin acciones; si no hay línea de tiempo descargada, lo dice (decisión 16)     |
| `src/core/sesion/sesion.js`                   | Si el perfil vuelve con otro rol, finca o área, se borra el almacén `novedades` (decisión 13)                                    |

**Pruebas**

| Nivel  | Prueba                                                                                                                                   | CU              |
| ------ | ---------------------------------------------------------------------------------------------------------------------------------------- | --------------- |
| Vitest | Almacén: combinar sin perder lo del detalle; filtrar por estados, área y finca; el mismo orden del servidor; conteos; páginas de 20      | CU-24 3         |
| Vitest | Repositorio: con red guarda y devuelve lo del servidor; con error de red devuelve lo guardado y `descargadaEn`; sin nada guardado, vacío | CU-24 2–4       |
| Vitest | 04-B, 11-B y 19 sin red: aviso con la fecha, pendientes primero en 04-B; 3a («La primera consulta necesita conexión»)                    | CU-24 3a        |
| Vitest | Detalle sin red: «Datos del…», sin acciones, línea de tiempo descargada o el aviso de que falta                                          | CU-18 3a        |
| e2e    | `cu-24-consultar-sin-conexion.spec.js`: con red abre «Mis novedades» y un detalle; sin red recarga y ve 04-B y el detalle con su fecha   | CU-24, CU-18 3a |
| e2e    | El aprobador: con red abre la bandeja; sin red ve 11-B. Un contexto nuevo sin red ve 3a                                                  | CU-24 3a        |

---

## PR 5 · `feat/RF-25-restringir-acciones`

**Pantallas de Figma:** 14-B (`3:1064`), 09-D (`2:1479`) y, sin dibujo propio, 20 y 20-C del
director (decisión 17); 14-C (`3:1178`) ya existe.

| Ruta                                                | Contenido                                                                                                               |
| --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| `src/core/ui/Boton.jsx`                             | `noDisponible`: `aria-disabled="true"` con el aspecto deshabilitado; sigue en el orden del teclado                      |
| `src/modules/e3-atencion/AccionesDelAprobador.jsx`  | Sin red: los botones con su candado y «Se habilitan al volver la conexión» (14-B)                                       |
| `src/modules/e3-atencion/AccionesDelReportante.jsx` | Sin red: «Confirmar o devolver la novedad necesita internet, porque depende de su estado actual en el servidor.» (09-D) |
| `src/modules/e3-atencion/DecisionDelDirector.jsx`   | Sin red: el panel de 20 y la barra de 20-C, deshabilitados con la explicación                                           |
| `src/modules/e3-atencion/BotonesDeHoja.jsx`         | Una hoja o un diálogo abiertos: «Confirmar» se deshabilita mientras no haya red y vuelve solo (decisión 18)             |
| `src/modules/e4-consulta/DetalleNovedad.jsx`        | El aviso de 14-B arriba, para el aprobador y el director                                                                |

`accionesDisponibles` no cambia: sigue diciendo qué acciones corresponden; el monitor dice si se
pueden usar ahora.

**Pruebas**

| Nivel  | Prueba                                                                                                                                 | CU                            |
| ------ | -------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------- |
| Vitest | Cada rol sin red: sus acciones con `aria-disabled`, enfocables, con la explicación enlazada (`aria-describedby`); pulsar no llama nada | CU-25 1–3                     |
| Vitest | Vuelve la red: se habilitan solas, según el rol                                                                                        | CU-25 4                       |
| Vitest | Una hoja abierta (rechazar, escalar, reasignar, la falla persiste, la decisión) se queda con lo escrito y su botón se deshabilita      | CU-11 1a, 12 1a, 15 1a, 17 1a |
| Vitest | 14-C sin cambios: la caída durante el envío no encola ni reintenta                                                                     | CU-25 2a                      |
| e2e    | `cu-25-restringir-acciones.spec.js`: el aprobador abre una asignada, se corta la red: 14-B; vuelve: puede tomarla                      | CU-10 2a, CU-25               |
| e2e    | El reportante con una resuelta: 09-D; el director con una escalada: el panel deshabilitado                                             | CU-15 1a, CU-13 3a            |

---

## PR 6 · `feat/RF-08-bucket-evidencias` (servidor; sale de `main`)

**Migración `rf08_evidencias`** (con `supabase migration new`):

1. **Bucket** `evidencias`: privado, `file_size_limit` de 1 MB y `allowed_mime_types`
   `{image/jpeg}` (el cliente siempre lo recodifica a JPEG). Con
   `insert … on conflict (id) do update`, porque `staging:reset` no borra los buckets.
2. **Políticas de `storage.objects`**, todas `to authenticated`:
   - `evidencias_subida_reportante` (insert): bucket `evidencias`, reportante activo, nombre con
     la forma `{uuid}/{uuid}.jpg`, la carpeta es una novedad de su finca que no está cerrada ni
     rechazada y tiene menos de 3 evidencias.
   - `evidencias_lectura` (select): existe una fila de `evidencia` con esa ruta. Esa fila ya la
     filtra su propia política por el alcance de la novedad: un archivo sin fila no lo ve nadie.
   - Ninguna de actualización ni de borrado.
3. **Disparador** `before insert` en `evidencia`, con `private.tg_evidencia_valida()`
   (`security definer`, `search_path` vacío; decisión 20): bloquea la fila de la novedad
   (`for update`), exige que no esté cerrada ni rechazada (`TRANSICION_INVALIDA`), que tenga menos
   de 3 (`LIMITE_DE_FOTOS`), que la ruta empiece por su `novedad_id` y que el archivo exista en el
   bucket (`EVIDENCIA_INVALIDA`), y toma `tamano_bytes` del archivo, no del cliente.
4. La política `evidencia_insercion_reportante` no cambia: ya exige reportante activo (si el
   usuario está inactivo, `fn_rol()` devuelve nulo), su finca y `subida_por` igual a quien sube.

**pgTAP `rf08_evidencias_test.sql`** (primero la prueba; debe fallar sin la migración)

| Prueba                                                                                                                                             | CU          |
| -------------------------------------------------------------------------------------------------------------------------------------------------- | ----------- |
| El bucket existe, es privado, con su límite y su tipo; volver a correr la migración no falla                                                       | Decisión 19 |
| El reportante de la finca sube a `{novedad}/{uuid}.jpg` e inserta la fila; `tamano_bytes` sale del archivo                                         | CU-08 4     |
| Otra finca, otro rol, inactivo o sin perfil: ni subir ni insertar; `anon`, nada                                                                    | RNF-11      |
| Novedad cerrada o rechazada → `TRANSICION_INVALIDA`; la cuarta foto → `LIMITE_DE_FOTOS`; ruta de otra novedad o sin archivo → `EVIDENCIA_INVALIDA` | RF-08       |
| Lee los archivos quien ve la novedad (los cuatro roles, según su alcance); nadie lee un archivo sin fila; nadie actualiza ni borra                 | Tabla 31    |

Las pruebas de `storage.objects` insertan filas en la tabla con el rol simulado, sin subir bytes
(la API de Storage no corre en pgTAP); la subida real se prueba en «staging» y en la e2e.

**Asesor:** se espera **ninguno nuevo** (la función del disparador vive en `private` y no se
expone). Si sale alguno, se anuncia en el PR.

---

## PR 7 · `feat/RF-08-evidencia-fotografica` (cliente)

**Pantallas de Figma:** 05 (`2:423`, campo Foto `2:514`), 05-B (`2:538`), 05-D (`2:777`), 07
(`2:935`), 09 (`2:1118`; Evidencias `2:1168`, Adjuntar foto `2:1174`) y los bloques «Evidencias» de
13 (`3:764`), 14 (`3:965`), 20 (`4:705`), 20-C (`4:1054`) y 22 (`4:2093`).

| Ruta                                           | Contenido                                                                                                           |
| ---------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| `src/modules/e2-registro/medidasDeFoto.js`     | Funciones puras: medidas de destino (lado mayor 1600 px), tipo válido, peso máximo                                  |
| `src/modules/e2-registro/reducirFoto.js`       | `createImageBitmap` con la orientación EXIF, Canvas y `toBlob('image/jpeg', 0.7)`. Se carga solo al elegir una foto |
| `src/core/supabase/repositorios/evidencias.js` | `subirEvidencia` (archivo y fila), `listarEvidencias` con `createSignedUrls` en lote                                |
| `src/modules/e2-registro/CampoFoto.jsx`        | «Tomar foto» y «Elegir de la galería», miniaturas con «Reducida a 180 KB» y quitar; 05-D; deshabilitado sin red     |
| `src/modules/e4-consulta/Evidencias.jsx`       | El bloque del detalle para los cuatro roles; «Adjuntar foto» para el reportante; sin red, recuadros grises          |
| `RegistrarNovedad.jsx`, `NovedadGuardada.jsx`  | Registrar, subir y llevar a 06; si la red se cae al guardar, 07 avisa que las fotos no se guardaron (decisión 21)   |
| `src/core/errores/traducir.js`                 | `LIMITE_DE_FOTOS` y `EVIDENCIA_INVALIDA`                                                                            |
| `src/core/ui/TarjetaNovedad.jsx`               | El ícono de cámara en las tarjetas que tienen fotos (04-B y 11-B; decisión 23)                                      |

**Pruebas**

| Nivel  | Prueba                                                                                                                                             | CU              |
| ------ | -------------------------------------------------------------------------------------------------------------------------------------------------- | --------------- |
| Vitest | Medidas: horizontal, vertical, ya pequeña (no se agranda), cuadrada; tipo: imagen, HEIC, PDF, vacío; peso exacto en el límite                      | CU-08 4, 4a     |
| Vitest | Campo: hasta 3 fotos; quitar; 05-D con un archivo que no es imagen o que no se pudo reducir; sin red, los dos botones con su explicación           | CU-08 4a, 4b    |
| Vitest | Registrar con fotos: primero la novedad, luego cada foto; si una falla, la novedad queda y 06 lo dice                                              | CU-08 4         |
| Vitest | Evidencias: URLs firmadas en una sola llamada; «Adjuntar foto» solo al reportante y en estados no finales; sin red, recuadros y sin adjuntar       | CU-08, CU-18 3a |
| e2e    | `cu-08-adjuntar-evidencia.spec.js`: imagen generada por la prueba (Canvas, unos KB): registra con foto, la ve en el detalle; adjunta otra desde 09 | CU-08           |
| e2e    | Un `.txt` → 05-D; sin red, «Tomar foto» deshabilitado y la nota de 05-B                                                                            | CU-08 4a, 4b    |

En el repositorio no van fotos reales: las imágenes las genera la prueba.

---

## Cobertura de los cursos de cada caso de uso

| CU    | Curso normal | Alternos cubiertos              | Nota                                                                      |
| ----- | ------------ | ------------------------------- | ------------------------------------------------------------------------- |
| CU-21 | Sí           | 2a, 2b                          | 2a con `QuotaExceededError` simulado en Vitest; no se llena un disco real |
| CU-22 | Sí           | 3a, 3b, 4a, 4b                  | 4b sin e2e (no se cambian fincas del seed): Vitest y pgTAP                |
| CU-23 | Sí           | 3a                              |                                                                           |
| CU-24 | Sí           | 3a                              | Por rol: reportante (04), aprobador (11), director (19)                   |
| CU-25 | Sí           | 2a (ya cubierto en el Sprint 2) |                                                                           |
| CU-08 | Sí           | 4a, 4b                          | Si RF-08 sale, queda todo para el informe como trabajo futuro             |
| CU-05 | —            | 3a (CU-08), 5a (CU-21)          | 5a: sin red y con la red que se cae al guardar                            |
| CU-10 | —            | 2a                              | CU-25 en el aprobador                                                     |
| CU-11 | —            | 1a                              | Botón y hoja abierta                                                      |
| CU-12 | —            | 1a                              |                                                                           |
| CU-13 | —            | 3a                              | El director (decisión 17)                                                 |
| CU-14 | —            | 1a                              | «Registrar solución» y la pantalla 18 abierta                             |
| CU-15 | —            | 1a                              | 09-D                                                                      |
| CU-17 | —            | 1a                              |                                                                           |
| CU-18 | —            | 3a                              | Con la fecha de lo descargado                                             |

## En cada PR

- **Rama** desde `main` al día; si el PR anterior no está fusionado, sale de su rama, va en
  borrador y dice «Depende de #N».
- **Prueba primero.** La prueba (Vitest o pgTAP) se escribe antes y se ve fallar; se anota en el
  PR.
- **Después de la migración (PR 6):** `staging:push`, `staging:test`, `staging:types` (el archivo
  de tipos en el mismo commit, si cambia) y `staging:advisors` sin avisos nuevos.
- **Antes de abrir el PR:** lint, `format:check`, unitarias, build, **peso de la ruta de ingreso**
  (si pasa de 200 KB, se detiene y se avisa), capturas a 360 × 800 y 1280 × 800 en
  `docs/sprints/evidencias/S4/` (servidor simulado y datos de prueba; las de sin conexión, con la
  red cortada en Playwright), revisión con las skills (`code-review`, `ponytail-review`,
  `accessibility`, `web-design-guidelines`) y revisión propia en dos ejes: estándares del
  repositorio y fidelidad al RF y al CU.
- **e2e sin conexión** sobre el build con service worker (`build` y `preview`, como la de RNF-10).
- **Datos de las pruebas:** por la API con la sesión de cada rol, nunca con la clave secreta; nada
  del seed se cambia; imágenes pequeñas generadas por la prueba. **Ingresos por corrida:** las
  nuevas reutilizan `sesiones.setup.js` y 08-B usa una sesión fabricada: no suman ingresos.
- **Sin dependencias nuevas:** la cola usa `idb`, la reducción usa Canvas y el monitor usa `fetch`.
- **Documentos en el mismo PR:** cambios al SDD en `docs/cambios-sdd.md` (desde la entrada 17);
  textos que Figma no trae en `docs/decisiones-pendientes.md` (desde el punto 33).
- **PR** con la plantilla y `gh pr create`. Sin fusionar, sin forzar un `push` y sin `rebase` de
  ramas publicadas. Archivos agregados por nombre.

## Fuera del alcance del Sprint 4

Pantalla de avisos, campana, insignias y push (RF-30 y RF-31): Sprint 5 · panel de reportes,
historial con filtros, buscador por código y CSV: Sprint 5 · depuración de tipos de falla y
`corregir_tipo_falla`: Sprint 5 · sincronización en segundo plano del navegador (el SRS pide la
aplicación abierta) · guardar fotos sin conexión (RF-08 no lo permite) · borrar evidencias · las
pantallas del administrador sin red (no cambian estados de novedades; siguen con su mensaje de
error) · todo lo que toque «PROYECTO» sin el OK del equipo.

**Lo que este plan decide no construir** (y por qué alcanza sin ello): `navigator.storage.estimate()`
(la escritura avisa de la cuota llena; decisión 3) · descartar una pendiente (el SDD lo deja por
validar; decisión 10) · un aviso temporal al terminar de sincronizar (el indicador y 08 ya lo
dicen) · descargar por adelantado lo que la persona no ha abierto (decisión 13) · subir versión de
la base local (no hace falta; decisión 4).

## Riesgos del sprint

| N.º | Riesgo                                                                       | Señal                                                       | Respuesta                                                                                                                    |
| --- | ---------------------------------------------------------------------------- | ----------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| 1   | Safari borra los datos o no concede la persistencia; WebKit sigue sin probar | No hay iPhone o el día 3 nadie ha probado en un dispositivo | `persist()` al ingresar y al encolar; aviso de 07; e2e en WebKit en el CI (PR 0); la lista de chequeo en un iPhone           |
| 2   | Una novedad se envía dos veces                                               | Dos filas con la misma descripción en la e2e                | Bloqueo entre pestañas y bandera; la idempotencia por `id_local` es la red de seguridad; la e2e cuenta las filas             |
| 3   | La sincronización se queda esperando a la sesión                             | 08 en «Enviando» medio minuto                               | 4 s de espera máxima a `getSession()`; si no responde, se detiene como error de red                                          |
| 4   | El monitor dice «En línea» en un portal cautivo, o parpadea con señal débil  | Acciones habilitadas que fallan con red                     | Un fallo de red de cualquier solicitud pasa a sin conexión; vuelve solo con una verificación exitosa; 14-C sigue de respaldo |
| 5   | La ruta de ingreso pasa de 200 KB                                            | Quedan 11,7 KB                                              | Cola, sincronizador y pantallas en el marco o bajo demanda; al ingreso solo llegan el monitor y el `fetch` (≈ 1,5 KB)        |
| 6   | El disparador no puede leer `storage.objects` o bloquear la novedad          | Falla `staging:push` del PR 6                               | Quitar la comprobación del archivo y dejar la de la ruta; la política de lectura ya oculta los archivos sin fila             |
| 7   | Fotos de 12 MP en un teléfono de gama media                                  | La pestaña se recarga al reducir                            | Decodificar ya reducido (`createImageBitmap` con `resizeWidth`); probarlo en el dispositivo real                             |
| 8   | Cuatro días para 42 puntos                                                   | El día 3 no están el PR 3 y el PR 4                         | Sale RF-08 (la línea de corte); nunca las pruebas de RF-21 a RF-25                                                           |
| 9   | Pages publica `main` antes de que «PROYECTO» tenga el bucket                 | Pasó el 10 oct con las migraciones del Sprint 3             | Aplicar en «PROYECTO» justo antes de fusionar el PR 6 (decisión 28)                                                          |
| 10  | Un dispositivo compartido muestra pendientes de otra persona                 | Una prueba con dos usuarios en el mismo navegador           | Cada pendiente guarda su `reportante_id`; solo se cuentan, se muestran y se envían las del usuario de la sesión              |
| 11  | Otra pestaña abierta traba una actualización de la base local                | `blocked` en la consola                                     | `blocking` cierra la conexión vieja; este sprint no sube la versión (decisión 4)                                             |
| 12  | «staging» acumula fotos y novedades de las pruebas                           | Más de unos MB en el bucket                                 | Imágenes de pocos KB; `staging:reset` no las borra: se vacía el bucket desde el panel antes de la demo                       |

## Decisiones para el equipo

Cada una trae una recomendación. Verifiqué los 29 puntos del encargo contra el código y Figma; donde
el encargo decía algo distinto de lo que encontré, está dicho en la fila.

### Registro sin conexión (RF-21)

| N.º | Decisión                                  | Recomendación                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| --- | ----------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Forma de `pendientes` y fallas al guardar | `{ id_local, descripcion, prioridad, area_id, area, finca_id, reportante_id, fecha_registro, envio: 'pendiente' \| 'enviando' \| 'error', intentos, ultimo_error }`; `area` es el nombre, para pintar 04-B y 08 sin red. 07 solo después de `tx.done`. **2a** (`QuotaExceededError`): «No se pudo guardar: el teléfono no tiene espacio. Libera espacio e intenta de nuevo.» **2b**: «La novedad no se guardó en el teléfono. Intenta de nuevo.» con «Reintentar». En los dos, el formulario conserva lo escrito |
| 2   | La red falla con conexión aparente        | El borrador va a la cola con el mismo `id_local` y la misma fecha, y aparece 07 (SDD: «continuar como sin conexión»). Reemplaza el mensaje interino del Sprint 1 (punto 10). **Además, un error de sesión al enviar también encola:** lo escrito no se pierde y la sincronización pedirá el ingreso (08-B). Es una precisión al algoritmo del SDD                                                                                                                                                                |
| 3   | Persistencia (RNF-07)                     | **El aviso de 07 («No borres los datos del navegador…») siempre**, como lo dibuja Figma: así no hace falta preguntar si el navegador concedió la persistencia. `persist()` se pide al ingresar (ya) y otra vez al encolar (Safari decide según el uso). **Sin `estimate()`:** es aproximado y no cambia nada; la cuota llena la avisa la escritura misma (2a). Precisión al SDD 6.1.5                                                                                                                            |
| 4   | Esquema local                             | **No cambia `VERSION_BD`:** los cuatro almacenes de la Tabla 32 ya existen con sus índices. Se agrega `blocking` (cierra la conexión vieja cuando otra pestaña o la versión nueva la necesita) y la regla escrita en `bd.js` de que una actualización nunca borra `pendientes`, con su prueba                                                                                                                                                                                                                    |

### Sincronización (RF-22)

| N.º | Decisión                      | Recomendación                                                                                                                                                                                                                                                                                                                                                                                                        |
| --- | ----------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 5   | Disparadores                  | Abrir la aplicación con sesión y red; el monitor que pasa a «en línea» (no el evento `online` crudo, que miente en un portal cautivo); «Reintentar» y «Reintentar todo» (08); el reingreso del mismo usuario después de 08-B                                                                                                                                                                                         |
| 6   | Un solo ciclo                 | Bandera en la pestaña y `navigator.locks.request(…, { ifAvailable: true })` entre pestañas (Safari lo tiene desde 15.4; si falta, queda la bandera). La idempotencia de `registrar_novedad` es la red de seguridad                                                                                                                                                                                                   |
| 7   | Sesión y otros usuarios       | `getSession()` antes del primer envío, con 4 s de espera máxima. Sin sesión → 08-B y la cola intacta. 08-B sale en 08 y arriba de «Mis novedades» (la pantalla de inicio del reportante); «Ingresar» cierra la sesión local, conserva las pendientes y lleva al ingreso. **Las pendientes de otro usuario del dispositivo no se cuentan, no se muestran y no se envían** (RNF-10): esperan a que esa persona ingrese |
| 8   | Clasificación de errores      | Con `traducirError`: **red** → `error` y se detiene; **sesión** → se detiene y 08-B; **negocio** (`FINCA_NO_ASIGNADA`, `AREA_INVALIDA`, `DATO_OBLIGATORIO`, desconocido) → `error` y sigue; **`SIN_PERMISO`** → esa pendiente queda en `error`, se pide la relectura del perfil (decisión 16 del Sprint 3) y el ciclo se detiene, sin marcar las demás                                                               |
| 9   | `enviando` huérfana           | Al empezar cada ciclo, ya con el bloqueo, las que quedaron en `enviando` vuelven a `pendiente`                                                                                                                                                                                                                                                                                                                       |
| 10  | Qué ve la persona al terminar | En 08, cada pendiente enviada en esta visita queda como «Enviada · código NOV-0155» hasta salir de la pantalla; «Última sincronización completa» en `meta` cuando la cola queda vacía. **Una pendiente que una regla de negocio rechazará siempre** (la finca se desactivó): solo reintento manual, **sin descartar**, como adopta el SDD (Tabla 39, por validar con los reportantes en el piloto)                   |

### Indicador y monitor (RF-23)

| N.º | Decisión               | Recomendación                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| --- | ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 11  | Un solo monitor        | Store externo en `core/conexion/monitor.js`, leído por `useEnLinea` (misma firma: ningún llamador cambia). Fuentes: `navigator.onLine`, los fallos de red de **todas** las solicitudes del cliente único (un `fetch` envuelto en `cliente.js`: datos, RPC, Auth, Storage y funciones) y, mientras está sin conexión, una verificación cada **15 s** contra `{VITE_SUPABASE_URL}/auth/v1/health` con la clave publicable, **5 s** de espera máxima y `cache: 'no-store'`, en pausa con la pestaña oculta. Es otro origen: el service worker no la toca (`sw.js` ignora lo que no es del sitio). Un portal cautivo responde sin CORS o con error: cuenta como sin conexión |
| 12  | Contador y dónde se ve | Store en `core/offline/pendientes.js`: se recalcula al encolar, en cada paso de la sincronización y con un mensaje de `BroadcastChannel` entre pestañas. Se ve en el chip de Conexión de todas las barras («Sin conexión · 1 pendiente», «En línea · sincronizando», y sin dibujo en Figma, «En línea · 2 pendientes» cuando quedan con error). **Un solo anuncio:** el chip deja de ser `role="status"` y el marco tiene una región `aria-live="polite"` única, para que dos chips visibles no hablen dos veces                                                                                                                                                         |

### Consulta sin conexión (RF-24)

| N.º | Decisión                     | Recomendación                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| --- | ---------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 13  | Qué se guarda en `novedades` | **Lo que trae cada consulta con conexión** (como dice la Tabla 32): «Mis novedades», la bandeja, las escaladas y el detalle con su línea de tiempo, combinado por `id`. Sin red, cada lista lee el almacén y filtra, ordena, cuenta y pagina (20 y «Ver más») como el servidor; el filtro de finca de la bandeja también. Sin descarga anticipada: lo que la persona no abrió no está. El almacén se borra al cerrar sesión (ya) y **cuando el perfil vuelve con otro rol, finca o área** (nuevo). Alternativa descartada: guardar cada página tal como llegó; es menos código, pero duplica registros y se aparta de la Tabla 32 |
| 14  | Pendientes en 04-B           | Arriba de «Abiertas», con y sin red. **Figma 04-B escribe «Sin código»**, no `LOC-7F3A` (el encargo decía el código local): `LOC-` más los 4 primeros caracteres del `id_local` en mayúsculas sale en 07 y en 08, como en Figma. Tocar una pendiente abre 08 (`/pendientes`): no tiene `id` de servidor ni detalle propio                                                                                                                                                                                                                                                                                                         |
| 15  | Fecha, 3a y roles            | «Última actualización» por lista en `meta`. Textos de Figma: 04-B «Estás viendo lo descargado el {fecha}»; 11-B «Bandeja descargada {fecha}. Las acciones se habilitan al volver el internet.». 19 sin dibujo: el texto de 04-B. **3a:** «La primera consulta necesita conexión. Abre esta pantalla con internet para descargar tus novedades.» Roles: reportante (04), aprobador (11) y director (19). El administrador no tiene lista de novedades hasta el Sprint 5: solo el detalle que haya abierto                                                                                                                          |
| 16  | Detalle sin conexión         | La última versión descargada, con «Datos del {fecha}» bajo las etiquetas (Figma 09-D y 14-B), sin acciones y sin las fotos. Si la novedad llegó solo desde una lista: «La línea de tiempo se descarga cuando abres la novedad con conexión.» Si no está en el dispositivo: «Esta novedad no está descargada. Ábrela con conexión.» (no 22-B, que es para lo que no se puede ver)                                                                                                                                                                                                                                                  |

### Acciones sin conexión (RF-25)

| N.º | Decisión                   | Recomendación                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| --- | -------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 17  | Mapa de acciones y monitor | La Tabla 35 sigue igual; el monitor decide si se pueden usar. Sin red, cada acción se ve con su candado y `aria-disabled` (sigue en el orden del teclado) y `aria-describedby` al texto que explica. Textos de Figma: 14-B (aviso «Puedes consultar, pero tomar, rechazar, escalar, aprobar, resolver, cerrar y reasignar necesitan internet, porque dependen del estado actual en el servidor.» y «Se habilitan al volver la conexión») y 09-D. **El director (20 y 20-C) no tiene dibujo sin conexión:** el aviso de 14-B. «Adjuntar foto»: «Las fotos necesitan conexión.» (la primera frase de 05-B). Se habilitan solas al volver la red |
| 18  | Hoja o diálogo abiertos    | Se quedan abiertos con lo escrito; «Confirmar» se deshabilita con la misma explicación y vuelve solo. 14-C (la caída durante el envío) no cambia: **las transiciones nunca se reintentan solas ni se encolan**                                                                                                                                                                                                                                                                                                                                                                                                                                |

### Evidencias fotográficas (RF-08)

| N.º | Decisión                     | Recomendación                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| --- | ---------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 19  | Bucket y políticas           | Como en el PR 6: privado, 1 MB, solo `image/jpeg`, ruta `{novedad_id}/{uuid}.jpg`, creado con `on conflict (id) do update` (sobrevive a `staging:reset`). Sube el reportante activo de la finca a una novedad no final con menos de 3 fotos; **lee quien puede leer la fila de `evidencia`** (que ya aplica el alcance de la novedad), en vez de repetir el alcance a partir de la carpeta: un archivo huérfano no lo ve nadie. Nadie actualiza ni borra                                                                                                                                                                                                                                                                                                                                                                                                    |
| 20  | Huecos de la política actual | **Verificado:** `evidencia_insercion_reportante` sí deja fuera a un usuario inactivo (`fn_rol()` devuelve nulo); el encargo decía lo contrario. Los otros huecos son reales: estado final, máximo de 3, la ruta y el tamaño. **Opción A (recomendada): disparador `before insert`** en `private`, con `select … for update` sobre la novedad: dos subidas a la vez se ordenan y la cuenta es segura; además toma el tamaño real del archivo. No cambia la Tabla 21. **Opción B:** una función RPC `adjuntar_evidencia`; también sirve, pero agrega una función a la Tabla 21. Códigos nuevos en la Tabla 22: `LIMITE_DE_FOTOS` («Esta novedad ya tiene 3 fotos.») y `EVIDENCIA_INVALIDA` («No pudimos guardar la foto. Intenta de nuevo.»); el estado final usa `TRANSICION_INVALIDA`                                                                       |
| 21  | Orden y huérfanos            | `registrar_novedad` → subir → insertar la fila. **Si la fila falla, el archivo queda huérfano:** se acepta y se documenta (nadie lo ve, pesa máximo 1 MB y el bucket se puede vaciar desde el panel); borrarlo exigiría dar permiso de borrado al cliente. Si falla la subida, la novedad sigue registrada y 06 dice «La foto no se pudo subir. Adjúntala desde el detalle.» Si la red se cae al guardar (CU-08 4b), la novedad va a la cola sin fotos y 07 lo dice con el texto de 05-B: «Las fotos necesitan conexión. Podrás adjuntarla desde el detalle cuando la novedad se sincronice.»                                                                                                                                                                                                                                                               |
| 22  | Reducción en el navegador    | `createImageBitmap(archivo, { imageOrientation: 'from-image' })` y Canvas, lado mayor 1600 px y `toBlob('image/jpeg', 0.7)`. Lo que el navegador no puede decodificar (por ejemplo, HEIC en Chrome; Safari sí lo abre y el selector de iPhone suele entregar JPEG) o pasa de 1 MB después de reducir → 05-D. El cálculo va en funciones puras con Vitest; la codificación real, en la e2e con una imagen que genera la prueba. Hasta **3 fotos** en 05 (Figma dibuja una miniatura)                                                                                                                                                                                                                                                                                                                                                                         |
| 23  | Ver las fotos y la cámara    | `createSignedUrls` en una sola llamada, vigencia de 5 minutos; el service worker no las guarda (otro origen). Sin red, recuadros grises sin la foto (Figma 09-D y 14-B) y sin la leyenda de ejemplo de Figma («Impresora», «Router»): `evidencia` no tiene leyenda; el texto alternativo es «Foto 1 de NOV-0145». «Tomar foto» es `<input type="file" accept="image/*" capture="environment">` y «Elegir de la galería», sin `capture`. **Verificado:** la `Permissions-Policy` de `public/_headers` solo cierra `geolocation`, `microphone`, `payment` y `usb`, y el selector de archivos no pide permiso de cámara. **El ícono de cámara de las tarjetas** (04-B, 11-B): con la cuenta embebida `evidencia(count)` en la consulta de la lista; si la API no la resuelve a través de `v_novedad`, se omite y se anota (no se cambia la vista por un ícono) |
| 24  | Plan gratuito y «staging»    | 1 GB de archivos. **`staging:reset` no borra el bucket ni las fotos** (verificado en el CLI). Las fotos de las pruebas pesan unos KB: unas mil corridas no llegan a 10 MB. Antes de la demo, una persona vacía el bucket desde el panel de «staging» (borrar por SQL deja los archivos huérfanos, según la documentación de Supabase)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |

### Transversales

| N.º | Decisión                   | Recomendación                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| --- | -------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 25  | «registrada sin conexión»  | **Opción A (recomendada):** se deriva de `fecha_sincronizacion − fecha_registro` mayor que un umbral, parámetro nuevo `REGISTRO_SIN_CONEXION_MINUTOS = 5` en `parametros.js`. Sin cambios en la base; un envío con conexión tarda segundos. Va junto a la primera entrada de la línea de tiempo (20, 20-B y 20-C) y del detalle de los demás roles. **Opción B:** una columna nueva en `novedad` (cambio a la Tabla 26 y a `registrar_novedad`)                                                                                                                                                                                                                                                                   |
| 26  | Peso de la ruta de ingreso | Al ingreso solo llegan el monitor (lo usa `useEnLinea`, que está en el ingreso) y el `fetch` del cliente: ≈ 1,5 KB. Cola, sincronizador, almacén de novedades y disparadores van en el marco, que ya carga bajo demanda; 07, 08 y el reductor de fotos, cada uno en su paquete. Se mide en cada PR; si pasa de 200 KB, se detiene y se avisa                                                                                                                                                                                                                                                                                                                                                                      |
| 27  | WebKit sin verificar       | **Sí al PR 0:** un trabajo `e2e` en el CI con Supabase local, una contraseña al azar para los usuarios del seed y Playwright en Chromium y WebKit, sin bloquear la primera semana. Es el sprint que más depende de Safari (almacenamiento, `persist()`, instalación). Si no se aprueba, queda la prueba manual en un iPhone (29)                                                                                                                                                                                                                                                                                                                                                                                  |
| 28  | Producción                 | La migración `rf08_evidencias` llega a «PROYECTO» **antes de fusionar el PR 6**, con el OK del equipo: `npx supabase db push --project-ref lyrdsmfalrchbdpmikmt --dry-run` (debe listar solo esa migración), `db push` con la misma referencia, una consulta de solo lectura a `storage.buckets` y el asesor de «PROYECTO». Sin `supabase link` ni `seed.sql`. Este sprint no trae Edge Functions. Si RF-08 sale, no se aplica nada                                                                                                                                                                                                                                                                               |
| 29  | Dispositivos reales        | Las pruebas las hace el equipo, con la lista de chequeo de abajo. **Decidido el 13 oct a criterio de la implementación**, a partir de lo que usan hoy los reportantes (H14) y del plan de arranque («un Android de gama media y un PC de finca; un iPhone si hay»): **(1) obligatorio:** un Android de gama media (3 o 4 GB de RAM, Android 12 o más) con Chrome, instalado como aplicación; **(2) obligatorio:** un PC de escritorio con Windows y Chrome o Edge, como el de una oficina de finca; **(3) si alguien del equipo lo tiene:** un iPhone con iOS 17 o más, con Safari y la aplicación en la pantalla de inicio. Sin iPhone, WebKit queda cubierto solo por el CI (PR 0), y así se dice en el informe |

**Lista de chequeo en un dispositivo real** (los pasos 1 a 9 en el Android y en el iPhone; en el PC,
del 2 al 7 y el 9, con la red cortada desde el sistema):

1. Instalar la aplicación desde el navegador (en iPhone, «Agregar a inicio»).
2. Ingresar con conexión y abrir «Mis novedades» y un detalle.
3. Activar el modo avión. Abrir la aplicación desde el ícono: muestra 04-B con la fecha.
4. Registrar dos novedades: aparece 07 y el indicador dice «Sin conexión · 2 pendientes».
5. Cerrar la aplicación (quitarla de las recientes) y apagar la pantalla unos minutos.
6. Desactivar el modo avión y abrir la aplicación: el indicador pasa por «sincronizando» y queda
   «En línea»; en 08 cada una dice «Enviada · código NOV-…».
7. Comprobar en el detalle (o con el aprobador del área) que cada novedad está **una sola vez** y
   que «Registrada en finca» es la hora del paso 4, no la del paso 6.
8. Con conexión, tomar una foto con la cámara en una novedad abierta y verla en el detalle.
9. En modo avión, abrir una novedad de la bandeja con el aprobador: acciones bloqueadas (14-B).

### Las que aparecieron al leer Figma y el código

| N.º | Pantalla o archivo                                      | Qué pasa                                                                                                    | Recomendación                                                                                                                                                                         |
| --- | ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 30  | Conexión (`1:116`)                                      | Tres variantes; el número de pendientes se compone en cada pantalla. No hay «En línea» con pendientes       | «En línea · N pendientes» mientras queden con error y no haya un ciclo en curso                                                                                                       |
| 31  | 08 en el escritorio                                     | Solo está en el teléfono                                                                                    | La misma columna centrada de 05 y 06 dentro del marco (`decisiones-pendientes.md`, punto 14)                                                                                          |
| 32  | 08, 08-B                                                | ¿Cómo se llega a 08?                                                                                        | Desde «Ver pendientes (N)» de 07, desde una pendiente de 04-B y desde «Cuenta» (que ya advierte las pendientes). El chip no es un enlace: Figma lo dibuja como indicador y mide 28 px |
| 33  | `Boton.jsx`                                             | Usa `disabled` nativo: el botón sale del orden del teclado y no puede explicar por qué                      | Prop `noDisponible` con `aria-disabled`, para las acciones sin red (17). El `disabled` de siempre se queda para lo demás                                                              |
| 34  | `Conexion.jsx`, `Marco.jsx`                             | El chip es `role="status"` y el marco pinta dos (teléfono y escritorio, uno oculto); 05 y 08 pintan el suyo | La región `aria-live` única de la decisión 12                                                                                                                                         |
| 35  | 08                                                      | «Enviada · código NOV-0155» no dice qué pasa al salir                                                       | Las enviadas se ven hasta salir de 08; después están en «Mis novedades» con su código                                                                                                 |
| 36  | 04-B, 11-B                                              | La campana con insignia sale sin conexión                                                                   | Sigue el Sprint 5. Sin red, la campana no pide nada                                                                                                                                   |
| 37  | 05, 09                                                  | Figma dibuja una sola miniatura y una sola foto en «Evidencias»                                             | Hasta 3 (`FOTOS_MAXIMO_POR_NOVEDAD`); al llegar a 3, los botones se deshabilitan con «Máximo 3 fotos por novedad.»                                                                    |
| 38  | 13, 14, 20, 20-C, 22                                    | «Evidencias» sin «Adjuntar foto»                                                                            | Solo lectura para el aprobador, el director y el administrador; «Adjuntar foto» solo el reportante, en estados no finales (Tabla 35)                                                  |
| 39  | `useInsignias.js`, `AvisoNuevaVersion.jsx`, `sesion.js` | Leen `navigator.onLine` directamente                                                                        | Se dejan: preguntan si el navegador cree tener red, y el monitor arranca con ese mismo valor. Cambiarlos no arregla nada                                                              |
| 40  | `Cuenta.jsx`                                            | La advertencia de cerrar sesión cuenta las pendientes de todos los usuarios del dispositivo                 | Solo las del usuario (RNF-10), en el PR 1                                                                                                                                             |
| 41  | Atajos con límite conocido                              | `ponytail` pide marcar cada atajo con un comentario `shortcut:`; el código del repositorio va en español    | Comentario en español con la misma forma: `atajo: <límite>, <cuándo cambiarlo>`. Al cierre se listan con una búsqueda de `atajo:` para el informe                                     |

Los textos que Figma no trae (2a, 2b, 3a, la línea de tiempo no descargada, el aviso de 19 sin red,
el director sin red, 06 con una foto que no subió, el máximo de fotos, los dos códigos nuevos) se
redactan con tuteo y se listan en `docs/decisiones-pendientes.md` en el PR que los introduce.

## Cambios previstos al SDD

Cada uno va a `docs/cambios-sdd.md` (la próxima entrada es la 17) en el PR que lo introduce, con su
texto propuesto.

| PR  | Sección                             | Qué cambia                                                                                                                                 |
| --- | ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| 1   | SDD 6.1.5 («Monitor de conexión»)   | Complemento: fuentes del monitor, verificación contra Auth cada 15 s con 5 s de espera, el `fetch` del cliente y un solo anuncio           |
| 2   | SDD 6.1.5 (registro y persistencia) | Precisión: un error de sesión al enviar también encola; el aviso de 07 siempre; sin `estimate()`; `persist()` también al encolar           |
| 3   | SDD 6.1.5 (sincronización) y 5.3.6  | Complemento: Web Locks, `enviando` que vuelve a `pendiente`, `SIN_PERMISO`, disparadores del monitor y del reingreso, solo las del usuario |
| 4   | SDD 6.1.5 y Tabla 32 (consulta)     | Precisión: las escaladas también se guardan; los registros se combinan por `id`; el almacén se borra si cambian el rol o el alcance        |
| 6   | SDD 6.1.4 (Tabla 31), 6.1.7 y 5.3.3 | **Cambio:** disparador de `evidencia` (estado, máximo, ruta y tamaño real); la lectura de los archivos pasa por la fila; solo JPEG         |
| 6   | SDD 5.3.2, Tabla 22                 | **Cambio:** `LIMITE_DE_FOTOS` y `EVIDENCIA_INVALIDA`                                                                                       |
| 7   | SDD 6.1.11 y 7.3                    | Complemento: «registrada sin conexión» se deriva de las dos fechas con un umbral configurable (parámetro nuevo)                            |

## Cierre del sprint

En la rama `docs/S4-informe`: `docs/sprints/S4.md` con la estructura de `S3.md` (meta y
cumplimiento verificado y sin verificar, historias y PR, orden de fusión, migraciones, pruebas por
nivel, cobertura por curso, evidencia, desviaciones, riesgos, «Lo que nos queda a nosotros»,
revisión propia y etiqueta `v0.4.0-s4`); `docs/sprints/S4-demo.md` con el guion (modo avión →
registrar → cerrar la aplicación → volver con red → la novedad sincronizada con su código, su fecha
real y sin duplicado; una pendiente con error y su reintento; 08-B; 04-B y 11-B; 14-B y 09-D; la
foto con conexión, la no válida y el intento sin conexión); capturas finales; peso de la ruta de
ingreso y Lighthouse (`cloudflare:web-perf`); la lista de atajos (`ponytail-debt`); `README.md`
(estado, sin conexión y Storage), `docs/decisiones-pendientes.md` y `docs/cambios-sdd.md` al día.

Queda para las personas, y el informe lo lista con sus pasos: review y fusión de cada PR; aplicar
la migración del bucket en «PROYECTO» con el OK, antes de fusionar el PR 6; las pruebas en
dispositivos reales; abrir una vista previa con un usuario de prueba; vaciar el bucket de «staging»
antes de la demo; reflejar en Figma las decisiones que se aprueben; y las etiquetas.
