# Sprint 5 · Plan de implementación

- **Fechas:** 19–23 oct 2026 (cinco días hábiles; el próximo festivo es el 2 nov). El calendario
  decía 9–13 nov; el Sprint 4 cerró el 14 oct y el equipo empieza al aprobar.
- **Historias:** HU-19, HU-20, HU-26, HU-27, HU-28, HU-29, HU-30, HU-31 y HU-32 (RF-19 y RF-20 de
  la E4, RF-26 a RF-29 de la E6, RF-30 y RF-31 de la E7 y RF-32 de la E1)
- **Estado:** **aprobado el 17 oct 2026, con todas las recomendaciones**: las fechas, los 39
  puntos comprometidos, los ocho íconos, sin dependencias nuevas y el trabajo `e2e` obligatorio.
  Sigue vigente el permiso de las e2e que ingresan. Lo que cambie en la review se ajusta en el PR
  que corresponda.

**Meta:** el director y el administrador siguen el proceso de lejos (historial, panel y
exportación), cada persona se entera de lo que cambia en sus novedades, y el administrador depura
el catálogo de tipos de falla.

**Incremento que se demuestra:** el director abre la matriz finca × tipo de falla y salta al
historial filtrado; versión 1.0 en producción.

**Este sprint lee lo que el proceso ya escribe.** Las transiciones dejan su historial desde el
Sprint 1 y sus avisos desde el Sprint 2 (`private.avisar`, con los destinatarios de las Tablas 30
y 33, sin avisar a quien actúa). `suscripcion_push`, `auditoria_tipo_falla` y `pg_net` existen
desde los Sprints 0 y 1. Lo nuevo de servidor son nueve funciones, una columna de `v_novedad`, el
disparador del webhook y la Edge Function `enviar-push`.

## Punto de partida (verificado el 17 oct 2026, 1:35 p. m.)

| Verificación                          | Resultado                                                                                                                                                                                                                                                                                                                       |
| ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `main` en GitHub                      | `452c8e9` (informe del Sprint 4, #38). #29 a #38 fusionados. El último CI de `main` (15 oct) quedó en verde en los cinco trabajos                                                                                                                                                                                               |
| Copia local                           | En `fix/RF-08-e2e-tipo-de-falla` (solo local, sin commits propios, sobre `b615660`) con el cambio sin commit de `e2e/cu-08-adjuntar-evidencia.spec.js` («Torniquetes» en vez de «Tipo e2e…»). `main` local iba un commit atrás: se puso al día con avance rápido. **El cambio sigue sin commit, intacto**, a la espera del PR 0 |
| PR abiertos                           | Solo #19 (`feat/RNF-18-tratamiento-de-datos`, borrador): espera la revisión de la empresa                                                                                                                                                                                                                                       |
| Etiquetas                             | **Ninguna**, ni local ni en GitHub (faltan `v0.1.0-s1` a `v0.4.0-s4`)                                                                                                                                                                                                                                                           |
| Node                                  | 24.14.0; `.nvmrc` pide 24                                                                                                                                                                                                                                                                                                       |
| CLI de Supabase, Playwright           | 2.120.0 (hay 2.121.0; el CI fija 2.120.0, no se cambia) y 1.63.0                                                                                                                                                                                                                                                                |
| `npm run lint`                        | Sin advertencias                                                                                                                                                                                                                                                                                                                |
| `npm run format:check`                | Correcto                                                                                                                                                                                                                                                                                                                        |
| `npm run test` (sin variables, CI)    | 1301 pruebas: 1299 pasan, 1 falla esperada (`it.fails`, contraste de «escalada») y **1 falla nueva** (abajo)                                                                                                                                                                                                                    |
| `npm run build`                       | Correcto. Ruta de ingreso: 149,9 + 8,8 + 26,8 + 2,2 ≈ **187,8 KB de 200** (gzip nivel 9, como en los sprints anteriores). Quedan ≈ 12,2 KB                                                                                                                                                                                      |
| `npm run staging:test`                | 20 archivos, 807 aserciones, 0 fallidas                                                                                                                                                                                                                                                                                         |
| `npm run staging:advisors`            | 16 avisos _WARN_: 13 por las funciones RPC, el de `anon` por `solicitar_recuperacion` y 2 de Auth. Ninguno nuevo                                                                                                                                                                                                                |
| «staging»: datos                      | 76 usuarios (7 activos, los del seed), 27 fincas (3 activas, las del seed; las demás las crean y desactivan las e2e de CU-04), 1068 novedades, 3366 transiciones, 45 tipos de falla (todos activos, 0 auditorías), **2651 avisos (todos sin leer)**, 0 suscripciones push, 43 evidencias con su archivo. PostgreSQL 17.11       |
| «staging»: novedades por estado       | 512 asignadas, 211 en atención, 59 escaladas, 2 aprobadas, 106 resueltas, 72 cerradas y 106 rechazadas                                                                                                                                                                                                                          |
| «staging»: migraciones                | 28; la última, `20261014214148`                                                                                                                                                                                                                                                                                                 |
| «staging»: Vault y `pg_net`           | `supabase_vault` 0.3.1 con **0 secretos**; `pg_net` 0.20.4                                                                                                                                                                                                                                                                      |
| «staging»: Edge Functions             | `gestionar-usuario` (v3, `verify_jwt`) y `restablecer-contrasena` (v3, sin `verify_jwt`). No hay `enviar-push`                                                                                                                                                                                                                  |
| `npm run test:e2e:chromium`           | **Sin correr hoy:** necesita el permiso de «Antes de empezar». Las 135 del cierre del Sprint 4 pasaron el 14 oct                                                                                                                                                                                                                |
| Trabajo `e2e` del CI (último de main) | 240 pasan, 4 intermitentes (pasan al reintentar) y 34 omitidas; ninguna falla                                                                                                                                                                                                                                                   |

Las cifras coinciden con el cierre del Sprint 4, salvo una. Datos nuevos:

- **Una prueba unitaria depende de la fecha de hoy.** `Pendientes.test.jsx` («RF-22 / CU-23 3a»)
  fija la fecha del registro en el 14 oct y espera «Registrada en finca: 6:52 a. m.», porque 08
  muestra solo la hora cuando el registro es de hoy. No fija el reloj: pasó el 14 oct y falla
  desde el 15. **El próximo CI de cualquier PR falla en el trabajo «App», también el de este
  plan.** Se corrige en el PR 0 (decisión 7).
- **Lo que hace `staging:reset` con Vault** (punto 29 del encargo). Se leyó el script de borrado
  que trae el binario del CLI 2.120.0 (`db reset --linked`): **excluye el esquema `vault`** y no
  borra las extensiones `supabase_vault` ni `pg_net`. Borra las tablas de `public`, el esquema
  `private` (lo recrean las migraciones) y todas las políticas, y vacía `auth`. Los secretos de
  Vault **sobreviven** a un `staging:reset` y el disparador del webhook vuelve con las migraciones.
- **Figma, leído para este plan** (capturas de 10, 10-B, 10-C, 21 a 21-D, 22, 23 a 27 y 31 a
  31-C):
  - faltan **ocho** íconos, no siete: también `tune`, el del botón «Filtros (3)» de 21-D;
  - 24 dibuja la evolución mensual como **línea**, no como barras;
  - 21 pagina con **números** («1–8 de 9» y las páginas 1 y 2); `Paginacion.jsx` solo tiene
    flechas;
  - los selectores de período sí dejan ver sus opciones: «Mes actual (sep 2026)» (24-B), «Últimos
    3 meses (jul–sep 2026)» (24 y 25), «Últimos 6 meses (abr–sep 2026)» (26) y «Personalizado
    (oct 2026)» (25-B);
  - 31 dibuja el tipo inactivo con sus tres acciones deshabilitadas: no hay «reactivar»;
  - 22 dibuja «Corregir tipo» como un enlace junto al tipo de falla; el diálogo y la anotación en
    la línea de tiempo no están dibujados;
  - 21-D le muestra al aprobador una nota sobre el CSV y no le da filtro de área;
  - 10 le escribe al reportante «Tu novedad fue asignada a Sistemas.» a la hora del registro: es
    el aviso del enrutamiento que la Tabla 30 decidió no enviar (decisión 31).
- **Peso medido de Recharts 3.10.1:** 151,5 KB comprimidos (bundlephobia, 11 dependencias); casi
  todo el JavaScript de la ruta de ingreso (decisión 3).
- **La regla 1 de `CLAUDE.md` choca con el SDD, no solo con el esquema:** las Tablas 20 y 31 del
  SDD diseñan el `PATCH` directo de `leida` y `leida_en` (decisión 29).
- `src/modules/e6-reportes/` y `src/modules/e7-avisos/` existen y están vacías.

## Antes de empezar

| Necesidad                                                      | Para qué                                                                                                                                                         | Estado al 17 oct 2026                                       |
| -------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------- |
| Aprobar este plan, los puntos y las decisiones del final       | Sin eso no se escribe código del sprint                                                                                                                          | **Hecho** (17 oct)                                          |
| Fechas reales                                                  | Se proponen 19–23 oct (decisión 1)                                                                                                                               | **Hecho:** 19–23 oct                                        |
| Confirmar el permiso de correr las e2e que ingresan            | El del 13 oct era para el Sprint 4. Cargan `.env.local` solas; la contraseña no pasa por aquí                                                                    | **Hecho** (17 oct): sigue vigente                           |
| Autorizar o no que el agente recorra una vista previa de Pages | Ingresar con un usuario de prueba en la vista previa de un PR (`built-in-browser`) y, si se autoriza, ver llegar un push real de «staging»                       | Sin respuesta desde el Sprint 4: no se hace                 |
| **Descargar ocho íconos** de Google                            | Los siete del encargo y `tune` (21-D): ver abajo                                                                                                                 | **Hecho** (17 oct)                                          |
| Dependencias nuevas                                            | **Ninguna** (decisión 3): gráficos con CSS y SVG, y cifrado de Web Push con Web Crypto. Si prefieren Recharts o `@negrel/webpush`, se dice ahora y va con su ADR | **Hecho:** ninguna                                          |
| **Correo de contacto para VAPID**                              | El _subject_ `mailto:` de la firma VAPID (RFC 8292). Va como secreto de la función, no en el repositorio                                                         | **Pendiente: ¿qué correo del equipo?**                      |
| Claves VAPID y secretos de «staging»                           | Una persona corre `npm run vapid:claves` y `npm run staging:secretos` con su `.env.local`, o autoriza al agente a correrlos (decisiones 40 y 41)                 | Pendiente; el día 1, para la prueba corta                   |
| Prueba corta de push (día 1)                                   | Una persona con Chrome (escritorio o Android) se suscribe en el build local; el agente envía desde «staging» (decisión 37)                                       | Pendiente                                                   |
| Variable de Pages `VITE_VAPID_PUBLIC_KEY`                      | Production (la clave de «PROYECTO») y Preview (la de «staging»). La pone una persona en Cloudflare                                                               | Pendiente; solo si entra RF-31                              |
| Orden de producción                                            | Decisión 55: migraciones de cada PR justo antes de fusionarlo; después la función, sus secretos, Vault y la variable de Pages                                    | **Hecho:** con la recomendación; el OK se pide en cada paso |
| Que el trabajo `e2e` del CI sea obligatorio                    | Decisión 8. Además, una persona lo marca como requerido en la protección de `main`                                                                               | **Hecho** en el PR 0 (#40); falta marcarlo como requerido   |
| Avisar antes de un `staging:reset`                             | No se prevé ninguno: todo entra con `staging:push`. Sigue el de antes de la demo                                                                                 | —                                                           |
| Lo que sigue abierto del Sprint 4                              | #19 (la empresa), las etiquetas `v0.1.0-s1` a `v0.4.0-s4`, los dispositivos reales, la vista previa, WebKit sin red y pasar a Figma las decisiones 34 a 40       | Pendiente del equipo                                        |
| El CI rojo de este PR                                          | Lo causa la prueba con fecha, no el plan. Conviene fusionar primero el PR 0 y traer `main` a esta rama                                                           | El PR 0 es #40                                              |

**Los íconos.** `src/core/ui/iconos/LEEME.md` manda bajarlos de
`https://fonts.gstatic.com/s/i/short-term/release/materialsymbolsrounded/<nombre>/default/20px.svg`
(Material Symbols Rounded, Apache 2.0, el mismo conjunto de los que ya están). Son ocho SVG de menos
de 1 KB cada uno: `notifications_active` (10-B), `search_off` (21-C), `tune` (21-D), `touch_app`
(23 y 26), `event_busy` (25-B), `expand_less` (27), `arrow_downward` y `merge` (31). Se piden ahora
para no frenar las pantallas a mitad del sprint.

Nada de este plan toca «PROYECTO» sin el OK del equipo, y aun con el OK las escrituras las hace una
persona; el agente prepara los comandos y comprueba con lecturas (decisión 55).

### Base de las ramas y PR 0

Los Sprints 0 a 4 están en `main`: todo sale de `main` al día. Un PR cuya base no esté fusionada
sale de la rama de ese PR, va en borrador y dice «Depende de #N»; al fusionarse la base, se le trae
`main` (sin `rebase` de ramas publicadas). El entorno no deja que el agente fusione: lo hace una
persona después de la review.

**PR 0.** `fix/RF-08-e2e-tipo-de-falla` nunca se publicó y no tiene commits propios: se pone al día
con avance rápido sobre `main` (sin `rebase`), conserva el cambio de CU-08 y suma el arreglo de la
prueba con fecha y, si se aprueba, el trabajo `e2e` obligatorio. Es lo primero que conviene
fusionar: mientras no entre, el CI de todos los PR del sprint sale en rojo.

## Skills del entorno

Están todas las de la tabla del encargo, salvo `pdf-reading` (está `pdf`). Ninguna se instala ni se
copia al repositorio: nada de `npx skills add`, `.claude/skills/`, `.agents/` ni
`skills-lock.json`; los archivos se agregan por nombre.

| Skill                                         | Uso en este sprint                                                                                                                                                                                                                      |
| --------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `supabase`                                    | **Ya se usó para este plan:** el script de `db reset --linked` leído en el binario del CLI (Vault y `pg_net` sobreviven) y la sección `[db.vault]` de `config.toml`. Su lista de seguridad en los PR 1, 2, 4, 5, 6 y 8                  |
| `supabase-postgres-best-practices`            | **Ya se usó:** orden de los bloqueos en la fusión (`lock-deadlock-prevention`, decisión 50) y paginación del CSV (`data-pagination`, decisión 17). Antes de cada migración, función, disparador y prueba pgTAP                          |
| `vitest`                                      | Plantillas de los avisos; grupos «Hoy», «Ayer», «Esta semana»; filtros en la dirección; CSV; cifras y períodos del panel; matriz; `enviar-push` y su cifrado; manejadores `push` y `notificationclick`                                  |
| `vercel-react-best-practices`                 | Panel, historial, avisos y tipos de falla con `React.lazy`; el panel pide solo la pestaña activa; el contador sin leer como un solo store (`useSyncExternalStore`) que no re-renderiza el marco. Se ignoran sus reglas de Next.js y RSC |
| `dataviz`                                     | **Ya se usó:** forma de cada gráfico y validación de la paleta de Figma con su script (decisión 25). Antes del primer gráfico. Los colores salen de `tokens.css`, no de su paleta de ejemplo                                            |
| `accessibility`                               | La matriz como `<table>` con nombre por celda; los datos de cada gráfico en tabla; el anuncio del contador; foco en 10, 21-B, 31-B, 31-C y los diálogos; la hoja 10-B; los desplegables de 27                                           |
| `web-design-guidelines`                       | Revisión de la interfaz en cada PR que trae pantallas                                                                                                                                                                                   |
| `webapp-testing`                              | Recorridos y capturas a 360 × 800 y 1280 × 800 sobre el build. Las pruebas del repositorio siguen siendo `e2e/*.spec.js`                                                                                                                |
| `figma-design-to-code` (recurso del conector) | **Ya se cargó:** capturas de 10, 10-B, 10-C, 21 a 21-D, 22, 23 a 27 y 31 a 31-C, y el contexto de diseño del botón de 21-D (así salió `tune`). En cada PR, `get_design_context` de sus nodos antes de escribir la pantalla              |
| `cloudflare:web-perf`                         | Al cierre: Lighthouse sobre `/ingresar`, peso de la ruta de ingreso y del paquete del panel. Si pide una herramienta que no está, se pregunta antes                                                                                     |
| `wrangler`                                    | Solo para consultar despliegues y vistas previas de Pages. No se despliega con él (ADR 0004)                                                                                                                                            |
| `built-in-browser`                            | Recorrer la vista previa de un PR con un usuario de prueba y ver un push real, si el equipo lo autoriza                                                                                                                                 |
| `docx`                                        | **No hizo falta:** las Figuras 12 y 13 del SDD son los prototipos de 22 y 26, y se leyeron en Figma                                                                                                                                     |
| `pdf`                                         | No hizo falta: `docs/fuentes/md/Plan.md` alcanzó                                                                                                                                                                                        |
| `xlsx`                                        | Opcional en el PR 7: comprobar que el CSV se lee con las tildes, el separador y las columnas                                                                                                                                            |
| `code-review`                                 | Revisión propia de cada PR, además de los dos ejes: estándares del repositorio y fidelidad al RF y al CU                                                                                                                                |
| `ponytail` (activa)                           | Todo el sprint: el cambio más chico que resuelve todo. Cada atajo con límite conocido lleva `// atajo: <límite>, <cuándo cambiarlo>`                                                                                                    |
| `ponytail-review`                             | Segunda revisión de cada PR: lógica, seguridad, carga real y cada línea necesaria                                                                                                                                                       |
| `ponytail-debt`                               | Al cierre: la lista de atajos (`atajo:`) para el informe                                                                                                                                                                                |
| `security-review`                             | PR 2 (revocación en `notificacion`), PR 4 y 5 (`rpt_*`), PR 6 (tipos de falla), PR 7 (fórmulas en el CSV), PR 8 (webhook, secretos, encabezado, `verify_jwt`) y PR 9 (suscripción y cierre de sesión)                                   |

- **Conectores:** Supabase, solo «staging» y solo para leer (`search_docs`, `list_tables`,
  `get_advisors`, los logs de `enviar-push`, `select` y `explain`); nunca `apply_migration` ni
  `deploy_edge_function`, y nada sobre «PROYECTO». Figma, solo para leer. Cloudflare, opcional y
  solo para consultar.
- **No aplican:** las que lista el encargo (`frontend-design`, las de escritura en Figma,
  `deep-research`, `skill-creator`, `find-skills`, `docs`, `pptx`, `chrome-browser`,
  `computer-use`, las de Cloudflare para Workers y compañía, y las de configuración del entorno).

## Orden de los PR

```
docs/S5-plan (este documento)

PR 0  fix/RF-08-e2e-tipo-de-falla             CU-08, reloj de la prueba de 08, e2e obligatorio   sale de main
PR 1  feat/RF-19-contratos-sprint-5 (servidor) nueve firmas vacías, v_novedad.resuelta_en, pgTAP  sale de main
 ·    prueba corta de push (día 1)            cifrado propio y una entrega real                  en la rama del PR 8
PR 2  feat/RF-30-avisos                       marcar_avisos_leidos, plantillas, 10, insignias    depende de 1
PR 3  feat/RF-19-historial                    21 a 21-D, buscador por código                     depende de 1
PR 4  feat/RF-26-panel-abiertas-y-tiempos     dos rpt_*, el marco del panel, 23, 24 y 24-B       depende de 1 y 3
PR 5  feat/RF-28-panel-escalas-y-recurrencia  dos rpt_*, 25, 25-B, 26 y 27                       depende de 4
PR 6  feat/RF-32-tipos-de-falla               cuatro funciones, 31 a 31-C, «Corregir tipo»       depende de 1
PR 7  feat/RF-20-exportar-csv                 el CSV sobre el historial                          depende de 3
PR 8  feat/RF-31-enviar-push (servidor)       webhook, Vault, enviar-push, secretos              depende de 2
PR 9  feat/RF-31-notificaciones-push          10-B, sw.js, Cuenta, cierre de sesión              depende de 2 y 8

docs/S5-informe (y la documentación técnica de RNF-17, decisión 56)
```

**Qué cambia frente a la sugerencia y por qué:**

- **El PR 0 trae también el reloj de la prueba de 08** (decisión 7) y, si se aprueba, el trabajo
  `e2e` obligatorio (decisión 8). Sin él, todo el sprint tiene el CI en rojo.
- **El PR 3 depende del PR 1** (el encargo lo sacaba de `main`): «Tiempo hasta resolver» sale de
  la columna `resuelta_en` de `v_novedad` (decisión 6), y esa columna es parte del contrato.
- **El PR 6 no depende del PR 2.** El aviso al administrador por un tipo nuevo ya lo crea la base
  desde el Sprint 2; la pantalla 10 (PR 2) lo muestra, y la gestión del catálogo no lo necesita.
- **La prueba corta de push va en la rama del PR 8:** lo que sale de ella (el módulo de cifrado y
  su prueba contra el RFC 8291) es el comienzo de ese PR. Si no entrega en un día, RF-31 sale y la
  rama queda como trabajo futuro, sin fusionar.
- Si lo hace una sola persona (o el agente), va en serie en el orden de la línea de corte, con lo
  primero en salir al final: **0 → 1 (y la prueba corta) → 2 → 3 → 4 → 5 → 6 → 7 → 8 → 9**.
- **Review:** una persona revisa los PR 0, 1, 4, 5, 6 y 8 (servidor, SQL, bloqueos y secretos); la
  otra, los PR 2, 3, 7 y 9 (pantallas, CSV, service worker y suscripción).

| Día        | Servidor y lógica                                                                       | Cliente                                                           |
| ---------- | --------------------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| Día 1 (19) | PR 0 · PR 1: contratos y `resuelta_en` en «staging» · prueba corta de push              | PR 3: historial, filtros en la dirección y buscador               |
| Día 2 (20) | PR 2: `marcar_avisos_leidos` y plantillas · PR 4: `rpt_novedades_abiertas` y de tiempos | PR 3: 21-B, 21-C y 21-D · PR 2: pantalla 10, contador e insignias |
| Día 3 (21) | PR 5: `rpt_escalamiento` y `rpt_recurrencia` · PR 6: las cuatro funciones de tipos      | PR 4: marco del panel, 23, 24 y 24-B · PR 5: 25 y 25-B            |
| Día 4 (22) | PR 8: webhook, `enviar-push` y secretos de «staging»                                    | PR 5: 26 y 27 · PR 6: 31 a 31-C y «Corregir tipo» · PR 7: CSV     |
| Día 5 (23) | Producción con el OK (decisión 55), asesor, `explain analyze` · revisión cruzada        | PR 9: 10-B, `sw.js`, Cuenta · e2e del sprint, capturas e informe  |

Reparto sugerido: quien llevó la cola y la sincronización en el Sprint 4 lleva ahora el servidor, y
al revés.

## Puntos propuestos (DoR)

| Historia  | Requerimiento                     | Puntos | Por qué                                                                                                                                           |
| --------- | --------------------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| HU-19     | RF-19 · Historial con filtros     | 8      | Cinco filtros en la dirección con dos controles nuevos (estados y rango), 21-B a 21-D, paginación numerada, buscador por código, hoja y tarjetas  |
| HU-20     | RF-20 · Exportar a CSV            | 3      | Generador puro (BOM, separador, comillas, fórmulas) y descarga por bloques; sin servidor                                                          |
| HU-26     | RF-26 · Abiertas por finca y área | 5      | La primera `rpt_*` y el marco del panel (pestañas, período, «Datos al», «Actualizar»), barras apiladas, tabla y enlaces al historial              |
| HU-27     | RF-27 · Tiempos de atención       | 5      | La última resolución de cada novedad, promedios por área, línea mensual en SVG, «Abiertas con más tiempo» y 24-B                                  |
| HU-28     | RF-28 · Proporción de escaladas   | 5      | Proporción por área, decisiones del director y tiempo hasta la decisión; barra apilada; 25-B                                                      |
| HU-29     | RF-29 · Fallas recurrentes        | 8      | Matriz accesible con pasos de color, «Otras N fincas», combinaciones más repetidas y la versión del teléfono (27)                                 |
| HU-30     | RF-30 · Avisos                    | 8      | Función que revoca la escritura directa, plantillas compartidas, 10 con grupos por día, contador e insignias en las dos barras                    |
| HU-31     | RF-31 · Notificaciones push       | 13     | Webhook con Vault, `enviar-push` con cifrado propio (RFC 8291 y 8292), secretos en dos proyectos, service worker, 10-B, Cuenta y cierre de sesión |
| HU-32     | RF-32 · Tipos de falla            | 8      | Cuatro funciones con bloqueos y auditoría, 31 a 31-C, corrección del tipo con su anotación en la línea de tiempo                                  |
| **Total** |                                   | **63** | Las velocidades fueron 38, 41 y 42 en los Sprints 2 a 4                                                                                           |

**Recomendación:** comprometer **39 puntos**: HU-19, HU-26 a HU-29 y HU-30 (lo que el plan de
arranque nunca recorta). Quedan sobre la línea de corte **24**, en este orden de salida: RF-31 (13),
RF-20 (3) y RF-32 (8). Con la velocidad del Sprint 4 entraría todo, pero 63 son una vez y media lo
de cualquier sprint anterior. Puntos de control:

- **final del día 1:** si la prueba corta no entregó un push, RF-31 sale;
- **final del día 3:** si no están arriba los PR 4 y 5, RF-31 sale aunque la prueba haya salido;
- **final del día 4:** si no está el PR 6, sale RF-20 y después RF-32.

Nunca salen el historial, el panel, los avisos dentro de la aplicación ni las pruebas de lo que sí
entra. **Adoptados el 17 oct 2026** y anotados en `docs/scrum/backlog.md` y `backlog.json`.

---

## PR 0 · `fix/RF-08-e2e-tipo-de-falla` (sale de `main`)

| Ruta                                              | Contenido                                                                                                                                                                          |
| ------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `e2e/cu-08-adjuntar-evidencia.spec.js`            | «Torniquetes», del seed, en vez de «Tipo e2e…» (lo que ya está en la copia local)                                                                                                  |
| `src/modules/e5-sin-conexion/Pendientes.test.jsx` | Fija el reloj (`vi.useFakeTimers({ toFake: ['Date'] })` y `vi.setSystemTime` el 14 oct) en la prueba de 08. Se buscan otras que comparen con «hoy» sin fijarlo y se arreglan igual |
| `.github/workflows/ci.yml`                        | Si se aprueba la decisión 8: sin `continue-on-error` en el trabajo `e2e`                                                                                                           |

**Pruebas:** las unitarias pasan con cualquier fecha (se corren con el reloj del sistema movido a
mañana); el CI en verde. **No cubre:** nada del sprint.

---

## PR 1 · `feat/RF-19-contratos-sprint-5` (servidor; sale de `main`)

**Migración `rf19_contratos_sprint_5`** (con `npx supabase migration new`). Publica las firmas que
faltan de la Tabla 21 con el cuerpo `NO_IMPLEMENTADO`, como en los Sprints 2 y 3, y la columna
`resuelta_en` de `v_novedad` (decisión 6).

| Función                  | Parámetros                                 | Devuelve                         | Seguridad                    | Quién                   |
| ------------------------ | ------------------------------------------ | -------------------------------- | ---------------------------- | ----------------------- |
| `marcar_avisos_leidos`   | `p_ids uuid[] default null` (nulo = todos) | `integer` (cuántos marcó)        | `security definer`           | Todo usuario activo     |
| `rpt_novedades_abiertas` | —                                          | `jsonb`                          | `security invoker`, `stable` | Director, administrador |
| `rpt_tiempos_atencion`   | `p_desde date, p_hasta date`               | `jsonb`                          | `security invoker`, `stable` | Director, administrador |
| `rpt_escalamiento`       | `p_desde date, p_hasta date`               | `jsonb`                          | `security invoker`, `stable` | Director, administrador |
| `rpt_recurrencia`        | `p_desde date, p_hasta date`               | `jsonb`                          | `security invoker`, `stable` | Director, administrador |
| `renombrar_tipo_falla`   | `p_tipo_id uuid, p_nombre text`            | `public.tipo_falla`              | `security definer`           | Administrador           |
| `fusionar_tipos_falla`   | `p_origen_id uuid, p_destino_id uuid`      | `public.tipo_falla` (el destino) | `security definer`           | Administrador           |
| `desactivar_tipo_falla`  | `p_tipo_id uuid`                           | `public.tipo_falla`              | `security definer`           | Administrador           |
| `corregir_tipo_falla`    | `p_novedad_id uuid, p_tipo_falla_id uuid`  | `public.novedad`                 | `security definer`           | Administrador           |

Todas llevan `set search_path = ''`, nombres calificados, `revoke execute … from public, anon` y
`grant execute … to authenticated`. La forma del `jsonb` de cada `rpt_*` (decisión 20) queda en el
comentario de la función y en el cambio 24, para que el cliente simule el repositorio sin esperar
al servidor.

**`v_novedad`:** `create or replace view … with (security_invoker = true)` con una columna nueva al
final, `resuelta_en`: la fecha de la última transición hacia `resuelta` si la novedad está
resuelta o cerrada, y nula si no. Las vistas existentes no cambian de forma.

**pgTAP `s5_contratos_test.sql`** (primero la prueba; falla sin la migración):

| Prueba                                                                                                                          | Referencia        |
| ------------------------------------------------------------------------------------------------------------------------------- | ----------------- |
| Cada función existe con la firma, los nombres de los parámetros y el tipo de retorno de la tabla de arriba                      | Tabla 21          |
| Las cinco que escriben son `security definer`; las cuatro `rpt_*`, `security invoker` y `stable`; todas con `search_path` vacío | Regla 2, 6.1.9    |
| `anon` no ejecuta ninguna; `authenticated` sí                                                                                   | Regla 2           |
| `v_novedad` tiene `resuelta_en`, sigue con `security_invoker`, y `authenticated` la lee                                         | Regla 3, Tabla 20 |

**Asesor:** se esperan **cinco avisos nuevos** del tipo conocido
(`authenticated_security_definer_function_executable`), uno por función que escribe: de 16 a 21. Las
`rpt_*` no suman: el aviso solo mira las `security definer`. Se anuncia en el PR.

**Tipos:** `staging:types` en el mismo commit (`Functions` y `v_novedad.resuelta_en`).

---

## PR 2 · `feat/RF-30-avisos` (depende del 1)

**Pantallas de Figma:** 10 (`2:1612`); la campana y «Avisos» con su insignia en las barras de 21
(`4:1189`), 21-D (`4:1973`) y 27 (`5:2174`).

**Migración `rf30_marcar_avisos_leidos`:** el cuerpo de la función (decisión 29), `revoke update
(leida, leida_en) on public.notificacion from authenticated` y `drop policy
notificacion_marcar_leida`.

| Ruta                                              | Contenido                                                                                                                                                |
| ------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `supabase/functions/_shared/plantillas.js`        | Funciones puras: el texto de la Tabla 33 según el estado nuevo y el rol del destinatario, y el título y el cuerpo del push. Una sola copia (decisión 30) |
| `src/core/supabase/repositorios/avisos.js`        | `listarAvisos({ pagina })` con la novedad embebida (código, prioridad, finca, área y tipo), `contarAvisosSinLeer()` y `marcarAvisosLeidos(ids)`          |
| `src/modules/e7-avisos/agruparAvisos.js`          | «Hoy», «Ayer», «Esta semana» y «Anteriores» en la hora de Colombia, y la hora o la fecha de cada aviso (decisión 32)                                     |
| `src/modules/e7-avisos/Avisos.jsx`                | 10 en `/avisos`, `React.lazy`, para los cuatro roles                                                                                                     |
| `src/app/useInsignias.js`, `src/app/insignias.js` | También los avisos sin leer, para todos los roles, con el monitor de conexión (decisión 33)                                                              |
| `src/app/Insignia.jsx`                            | Prop `texto`: hoy dice siempre «solicitudes pendientes»                                                                                                  |
| `src/app/Marco.jsx`                               | La insignia en la campana de las dos barras superiores y en «Avisos» de la barra lateral y de la inferior                                                |
| `src/modules/e3-atencion/useAccion.js`            | Pide el conteo después de cada acción propia                                                                                                             |
| `src/modules/e4-consulta/DetalleNovedad.jsx`      | «Volver a los avisos» cuando se llega desde 10                                                                                                           |

**Reglas**

- Tocar un aviso lo marca leído y abre el detalle (CU-30 4 y 5). Si la marca falla, igual abre el
  detalle: el aviso sigue sin leer y se vuelve a contar.
- «Marcar todas como leídas» llama la función con `p_ids` nulo; solo se ve si hay alguno sin leer.
- Cada aviso lleva el ícono de su estado (los del componente Estado), el código, la hora y el
  texto. Uno sin leer tiene el fondo de Figma, el punto azul y, para el lector de pantalla, «Sin
  leer» (nada solo por color).
- Abajo, «Toca un aviso para abrir la novedad.» (Figma).

**Pruebas**

| Nivel  | Prueba                                                                                                                                                                                                                | CU           |
| ------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------ |
| pgTAP  | `rf30_marcar_avisos_leidos_test.sql`: marca solo los propios; nulo marca todos los propios; los ajenos se ignoran sin error; devuelve la cantidad; `leida_en` la pone el servidor                                     | CU-30 5      |
| pgTAP  | Usuario inactivo → `SIN_PERMISO`; `anon` no la ejecuta; **`authenticated` ya no puede hacer `update` directo** en `notificacion`                                                                                      | Regla 1      |
| pgTAP  | Un aviso creado para alguien sin sesión sigue ahí, sin leer, para su próximo ingreso                                                                                                                                  | CU-30 3a     |
| Vitest | Plantillas: cada fila de la Tabla 33, el contexto deducido del estado y el rol (decisión 30), sin tipo de falla, con la prioridad en palabras                                                                         | CU-30 1–2    |
| Vitest | Grupos: las 11:59 p. m. y la medianoche en Colombia, el lunes que empieza la semana, el cambio de año; «7:40 a. m.», «mar 22 sep», «15 sep»                                                                           | CU-30 3      |
| Vitest | 10: grupos, sin leer con su texto, tocar marca y navega (también si la marca falla), «Marcar todas», «Ver más», vacía y sin conexión                                                                                  | CU-30 4–5    |
| Vitest | Contador: cuenta al entrar, al volver a la pestaña, al pedirlo una acción y cada minuto; sin red no pide; si falla, conserva el anterior                                                                              | CU-30 3      |
| e2e    | `cu-30-notificar-cambios.spec.js`: el reportante registra y el aprobador la toma (por la API, con sus sesiones); el reportante ve la insignia, encuentra el aviso por el código, lo toca: queda leído y ve el detalle | CU-30, CU-10 |

**No cubre:** el push (PR 8 y 9). La insignia de «Bandeja», si se aprueba la decisión 34, va aquí.

---

## PR 3 · `feat/RF-19-historial` (depende del 1)

**Pantallas de Figma:** 21 (`4:1189`), 21-B (`4:1523`), 21-C (`4:1862`), 21-D (`4:1973`) y el
buscador de la barra superior del escritorio.

| Ruta                                              | Contenido                                                                                                                          |
| ------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `src/core/supabase/repositorios/historial.js`     | `listarHistorial(filtro, pagina)` sobre `v_novedad`, con el conteo, de la más reciente a la más antigua; `buscarPorCodigo(codigo)` |
| `src/modules/e4-consulta/filtrosDelHistorial.js`  | Leer y escribir los filtros de la dirección, validar el rango, el grupo «abiertas» y el texto de cada chip (puro)                  |
| `src/modules/e4-consulta/Historial.jsx`           | 21, 21-B, 21-C y 21-D en `/historial`, `React.lazy`                                                                                |
| `src/modules/e4-consulta/FiltrosDelHistorial.jsx` | Los mismos campos en el panel del escritorio y en la hoja del teléfono («Filtros (3)»)                                             |
| `src/core/ui/Paginacion.jsx`                      | Números de página, como en 21 (decisión 12)                                                                                        |
| `src/core/utils/codigo.js`                        | `leerCodigo('nov 153') → 153`                                                                                                      |
| `src/app/Marco.jsx`                               | El buscador por código, habilitado (decisión 15)                                                                                   |
| `src/app/Rutas.jsx`                               | `/historial` deja de ser `Pendiente`                                                                                               |

**La dirección** (decisión 10):
`/historial?finca=<id>&area=<id>&estado=resuelta,cerrada&desde=2026-04-01&hasta=2026-09-24&tipo=<id>&pagina=2`.
`estado=abiertas` es el grupo de los seis estados no finales de la Tabla 34; lo usa el panel.

**Reglas**

- Requiere conexión (RF-19). Sin red, el aviso de la decisión 13 y nada más.
- «Aplicar filtros» lleva los filtros a la dirección; con 21-B se deshabilita con su candado y el
  mensaje «La fecha inicial debe ser anterior a la final» queda junto al rango.
- Cada chip se quita con su «×» y se aplica de inmediato; «Limpiar» quita todos.
- «9 novedades» y «de la más reciente a la más antigua» (por `fecha_registro`, y por `id` en un
  empate).
- Columnas de 21: Código, Registrada en finca («24 sep, 8:15 a. m.»; con el año si no es el
  actual), Finca, Área, Prioridad, Estado, Tipo de falla, Tiempo hasta resolver («1 d 2 h», o «—»)
  y Reportada por. Tocar una fila abre el detalle con el historial como origen («Volver al
  historial», que ya existe).
- 21-C: «Ninguna novedad cumple estos filtros» con `search_off` y «Limpiar filtros».

**Pruebas**

| Nivel  | Prueba                                                                                                                                               | CU            |
| ------ | ---------------------------------------------------------------------------------------------------------------------------------------------------- | ------------- |
| Vitest | Filtros: de la dirección y a la dirección; «abiertas»; rango invertido; chips; un parámetro desconocido o mal formado se ignora                      | CU-19 2–3, 3a |
| Vitest | Repositorio: cada filtro llega a la consulta; orden y conteo; páginas de 20                                                                          | CU-19 4       |
| Vitest | 21: columnas y «Tiempo hasta resolver»; 21-B; 21-C; sin conexión; el aprobador sin filtro de área y con la nota del CSV; 21-D con tarjetas y la hoja | CU-19 3a, 4a  |
| Vitest | `leerCodigo`: «NOV-0153», «nov 153», «153», «NOV0153», «0153»; vacío o con letras → nulo                                                             | Decisión 15   |
| Vitest | Buscador: encontrada → detalle; fuera del alcance o inexistente → el mismo mensaje; sin red                                                          | Decisión 15   |
| e2e    | `cu-19-consultar-historial.spec.js`: el administrador filtra por estado y fechas y abre una novedad que registró la prueba (buscada por su código)   | CU-19 1–6     |
| e2e    | Rango invertido → 21-B; filtros en 2001 → 21-C; el aprobador en el teléfono ve solo su área, sin «Exportar CSV»                                      | CU-19 3a, 4a  |
| e2e    | El reportante busca su novedad con «nov <número>» en la barra del escritorio y llega al detalle                                                      | Decisión 15   |

**No cubre:** la exportación (PR 7).

---

## PR 4 · `feat/RF-26-panel-abiertas-y-tiempos` (depende del 1 y del 3)

**Pantallas de Figma:** 23 (`5:783`), 24 (`5:1087`) y 24-B (`5:1326`); las pestañas del teléfono de
27 (`5:2174`).

**Migración `rf26_rf27_reportes`:** los cuerpos de `rpt_novedades_abiertas` y
`rpt_tiempos_atencion`. Un índice nuevo solo si `explain analyze` lo pide (decisión 27).

| Ruta                                            | Contenido                                                                                                                  |
| ----------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| `src/core/supabase/repositorios/reportes.js`    | Una llamada `rpc` por indicador (las de 25 y 26 llegan en el PR 5)                                                         |
| `src/modules/e6-reportes/Panel.jsx`             | `/panel`: título, «Datos al…», pestañas (`?indicador=`), período (`?periodo=`) y «Actualizar»; pide solo la pestaña activa |
| `src/modules/e6-reportes/periodos.js`           | Cada opción del selector → `{ desde, hasta, etiqueta }` en la hora de Colombia (decisión 23)                               |
| `src/modules/e6-reportes/cifras.js`             | «4,3 días», «18,4 %», «1 d 23 h», con `Intl.NumberFormat('es-CO')` y `formatearDuracion`                                   |
| `src/modules/e6-reportes/graficos/Barras.jsx`   | Barras horizontales, simples o apiladas por área, con CSS                                                                  |
| `src/modules/e6-reportes/graficos/Linea.jsx`    | La evolución mensual de 24, en SVG                                                                                         |
| `src/modules/e6-reportes/NovedadesAbiertas.jsx` | 23                                                                                                                         |
| `src/modules/e6-reportes/TiemposDeAtencion.jsx` | 24 y 24-B                                                                                                                  |
| `src/core/sesion/roles.js`                      | El administrador entra a `/panel` (decisión 28)                                                                            |
| `src/app/Rutas.jsx`                             | `/panel` deja de ser `Pendiente`; solo lo descargan el director y el administrador                                         |

**Reglas** (definiciones en la decisión 21)

- **23.** Tres tarjetas: «Novedades abiertas» con su explicación de Figma, y una por área (cada una
  abre el historial de esa área con `estado=abiertas`). «Abiertas por finca» en barras apiladas por
  área, solo las fincas con abiertas, y debajo «N fincas sin novedades abiertas». «Abiertas por
  estado» con el chip de cada estado. La tabla tiene **todas** las fincas activas, las de cero al
  final (RF-26: «en cero»), y las inactivas que aún tengan abiertas; «Ver en historial» abre el
  historial de esa finca. Debajo, «Haz clic en una finca o un área para ver sus novedades en el
  historial.» con `touch_app`.
- **24.** Una tarjeta por área con el promedio y «16 resueltas en el período»; la nota «Se mide
  desde la fecha de registro en finca, no desde la sincronización.»; «Promedio mensual por área»
  como línea, con el valor del último mes rotulado al final de cada serie; «Abiertas con más
  tiempo» con las cinco más antiguas (la primera resaltada, como en Figma); cada una abre su
  detalle con «Volver al panel».
- **24-B** (CU-27 3a): «No disponible» y «No hay novedades resueltas en el período» en el área sin
  resueltas; sin gráfico mensual si ninguna área tiene.

**Pruebas**

| Nivel  | Prueba                                                                                                                                                                                           | CU           |
| ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------ |
| pgTAP  | `rf26_rf27_reportes_test.sql`: reportante, aprobador e inactivo → `SIN_PERMISO`; `anon` no ejecuta                                                                                               | CU-26 1a     |
| pgTAP  | Abiertas, con fincas creadas por la prueba: cuenta por área los seis estados abiertos y no las cerradas ni las rechazadas; la finca activa sin abiertas sale en cero; la distribución por estado | CU-26 2, 2a  |
| pgTAP  | Tiempos, con novedades de 2001: promedio exacto por área; cuenta por fecha de resolución (registrada antes del período, resuelta dentro); la que volvió a resolverse usa la última               | CU-27 3      |
| pgTAP  | Tiempos: evolución por mes de Colombia; una abierta no entra en el promedio; sin resueltas → promedio nulo; «abiertas con más tiempo» de la más antigua a la más reciente                        | CU-27 2, 3a  |
| pgTAP  | `p_desde` posterior a `p_hasta` o nulo → `FECHA_INVALIDA`; `datos_al` es la hora de la consulta                                                                                                  | Decisión 23  |
| Vitest | Períodos: «Mes actual», «Últimos 3 meses» el 24 sep → 1 jul a 24 sep, cambio de año, personalizado; cifras con coma decimal                                                                      | Decisión 23  |
| Vitest | Panel: pide solo la pestaña activa; el período y la pestaña en la dirección; «Actualizar» vuelve a pedir; sin red, el aviso                                                                      | CU-26 1      |
| Vitest | 23: gráfico y tabla con los mismos datos; ceros; enlaces con sus filtros. 24 y 24-B                                                                                                              | CU-26, CU-27 |
| e2e    | `cu-26-novedades-abiertas.spec.js`: el administrador entra al panel al ingresar; el director toca una finca y llega al historial con ese filtro y las abiertas (estructura, no números)          | CU-26 4–5    |
| e2e    | `cu-27-tiempos-de-atencion.spec.js`: con «Últimos 3 meses», abre una de «Abiertas con más tiempo» y vuelve al panel                                                                              | CU-27        |

---

## PR 5 · `feat/RF-28-panel-escalas-y-recurrencia` (depende del 4)

**Pantallas de Figma:** 25 (`5:1530`), 25-B (`5:1776`), 26 (`5:1862`) y 27 (`5:2174`).

**Migración `rf28_rf29_reportes`:** los cuerpos de `rpt_escalamiento` y `rpt_recurrencia`.

| Ruta                                                | Contenido                                                                                                                |
| --------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `src/modules/e6-reportes/matriz.js`                 | Puro: orden de filas y columnas, las siete primeras fincas y «Otras N fincas», las cinco combinaciones, el paso de color |
| `src/modules/e6-reportes/Escalamiento.jsx`          | 25 y 25-B                                                                                                                |
| `src/modules/e6-reportes/FallasRecurrentes.jsx`     | 26 en el escritorio y 27 en el teléfono                                                                                  |
| `src/modules/e6-reportes/graficos/BarraApilada.jsx` | Las decisiones del director en una barra, con su leyenda y cantidades                                                    |

**Reglas**

- **25.** «Novedades escaladas al director» con el porcentaje y «7 de 38 registradas en el
  período»; «Proporción escalada por área» («26,3 %», «5 de 19»); «Decisiones del director» con la
  leyenda «Aprobadas · 3», «Rechazadas · 1», «En espera · 3»; «Novedades escaladas en el período»
  con la justificación cortada a una línea (completa en el detalle), la decisión y el tiempo hasta
  la decisión (o «—»). Cada fila abre su detalle.
- **25-B** (CU-28 2a): «No hay novedades registradas en este período» y «Elige otro período.» con
  `event_busy`. El mismo bloque para 26 sin datos (CU-29 2a).
- **26.** «64 novedades resueltas y cerradas en el período» y la nota de las que quedaron por fuera
  (CU-29 2b). La matriz es una `<table>`: filas por total, de mayor a menor (siete y «Otras N
  fincas», que se despliega); columnas por total; «Total» al final de cada fila y columna; el
  número en cada celda y su paso de color (cinco, «Menos» a «Más»). Cada celda con novedades es un
  enlace con su nombre accesible («La Mónica · Biométrico: 5 novedades») y el globo de Figma con
  «Ver en historial». «Combinaciones más repetidas» con las cinco primeras y «Ver novedades».
  Debajo, «Haz clic en una celda para ver esas novedades en el historial.».
- **27** (por debajo de `lg`): las pestañas en pastillas, el período, la nota corta de las
  excluidas, «Más repetidas» con tres, y cada finca desplegable con sus barras por tipo y «Ver en
  historial».

**Pruebas**

| Nivel  | Prueba                                                                                                                                                                                 | CU              |
| ------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------- |
| pgTAP  | `rf28_rf29_reportes_test.sql`: permisos como en el PR 4                                                                                                                                | CU-28, CU-29    |
| pgTAP  | Escalamiento, con datos de 2001: registradas y escaladas por área; escalada dos veces cuenta una; aprobadas, rechazadas y en espera según la última escalada; tiempo hasta la decisión | CU-28 2–3       |
| pgTAP  | Recurrencia: resueltas y cerradas por finca × tipo; las abiertas y las rechazadas del período, aparte; período por fecha de registro; sin novedades → total cero                       | CU-29 2, 2a, 2b |
| Vitest | `matriz.js`: orden y empates (por nombre), «Otras N fincas» con sus sumas, cinco combinaciones, pasos de color, celdas en cero                                                         | CU-29 3         |
| Vitest | 25 y 25-B; 26 con los nombres accesibles y los enlaces con finca, tipo, estados y fechas; 27 con los desplegables (`aria-expanded`)                                                    | CU-28, CU-29    |
| e2e    | `cu-28-escalamiento.spec.js`: la pestaña con sus bloques; «Personalizado» en 2001 → 25-B                                                                                               | CU-28 2a        |
| e2e    | `cu-29-fallas-recurrentes.spec.js`: tocar una celda lleva al historial con finca, tipo y fechas; en el teléfono, 27 con una finca desplegada                                           | CU-29 4–5       |

**No cubre:** que la fusión se refleje en la matriz: se prueba en el PR 6, cuando
`fusionar_tipos_falla` existe.

---

## PR 6 · `feat/RF-32-tipos-de-falla` (depende del 1)

**Pantallas de Figma:** 31 (`6:2438`), 31-B (`6:2734`), 31-C (`6:3019`) y «Corregir tipo» en 22
(`4:2093`).

**Migración `rf32_gestionar_tipos_falla`:** los cuerpos de las cuatro funciones (decisiones 48 a
53), el código `TIPO_FALLA_DUPLICADO` y `for share` en `private.resolver_tipo_falla` (decisión 50).

| Ruta                                                    | Contenido                                                                                                                |
| ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `src/core/supabase/repositorios/tiposFalla.js`          | `listarCatalogo()` (con `novedad(count)` y quién lo creó), `listarCambios()`, renombrar, fusionar, desactivar y corregir |
| `src/modules/e1-acceso-admin/TiposDeFalla.jsx`          | 31 en `/tipos-de-falla`: la lista y el «Registro de cambios»                                                             |
| `src/modules/e1-acceso-admin/DialogoRenombrarTipo.jsx`  | Renombrar y 31-B («Fusionar en su lugar»)                                                                                |
| `src/modules/e1-acceso-admin/DialogoFusionarTipos.jsx`  | Fusionar y 31-C                                                                                                          |
| `src/modules/e1-acceso-admin/DialogoDesactivarTipo.jsx` | Confirmación (sin dibujo en Figma; textos en la decisión 52)                                                             |
| `src/modules/e4-consulta/DialogoCorregirTipo.jsx`       | Desde «Corregir tipo» de 22, solo el administrador y en una cerrada                                                      |
| `src/core/ui/LineaDeTiempo.jsx`                         | «cerrada → cerrada» se muestra como «Tipo de falla corregido», no como un cambio de estado                               |
| `src/core/errores/traducir.js`                          | `TIPO_FALLA_DUPLICADO`                                                                                                   |

**Pruebas**

| Nivel  | Prueba                                                                                                                                                                                                                  | CU                 |
| ------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------ |
| pgTAP  | `rf32_gestionar_tipos_falla_test.sql`: quien no es administrador activo → `SIN_PERMISO` en las cuatro; `anon` no ejecuta                                                                                                | CU-32              |
| pgTAP  | Renombrar: normaliza; audita con el nombre anterior; mismo tipo con otras tildes, sí; nombre de otro tipo activo → `TIPO_FALLA_DUPLICADO`; tipo inactivo → `TIPO_FALLA_INVALIDO`                                        | CU-32 3a           |
| pgTAP  | Fusionar: reasigna también las cerradas; desactiva y audita el origen; origen = destino → `TIPO_FALLA_INVALIDO`; destino inactivo → `TIPO_FALLA_INVALIDO`; `registrar_solucion` con el nombre del origen usa el destino | CU-32 4, 4a, CU-14 |
| pgTAP  | **`rpt_recurrencia` refleja la fusión** en la misma transacción                                                                                                                                                         | CU-32 (post.)      |
| pgTAP  | Desactivar: sale de `sugerir_tipos_falla`; sus novedades lo conservan; audita                                                                                                                                           | CU-32 4            |
| pgTAP  | Corregir: solo una cerrada (si no, `TRANSICION_INVALIDA`); solo un tipo activo y distinto; deja `cerrada → cerrada` con los dos nombres en la observación; el estado no cambia; no avisa                                | CU-32 1a           |
| Vitest | 31: orden, «Inactivo» con sus acciones deshabilitadas, sin los fusionados; el registro de cambios con «antes → después»; 31-B detectado en la pantalla; 31-C; desactivar                                                | CU-32 2–5          |
| Vitest | «Corregir tipo» solo para el administrador y en cerradas (Tabla 35); el diálogo; la anotación en la línea de tiempo                                                                                                     | CU-32 1a           |
| e2e    | `cu-32-gestionar-tipos-falla.spec.js`: el aprobador resuelve con dos tipos nuevos de la prueba; el administrador renombra uno, ve 31-B y 31-C, los fusiona y desactiva el que queda                                     | CU-32 3a, 4a       |
| e2e    | Corrige el tipo de una cerrada que creó la prueba (registrar, tomar, resolver y confirmar por la API) y ve la anotación                                                                                                 | CU-32 1a           |

---

## PR 7 · `feat/RF-20-exportar-csv` (depende del 3)

**Pantalla de Figma:** 21 (`4:1189`, «Exportar CSV»).

| Ruta                                          | Contenido                                                                                                         |
| --------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| `src/modules/e4-consulta/csv.js`              | Puro: BOM, separador, comillas, fórmulas neutralizadas, fechas y horas (decisiones 16 a 18)                       |
| `src/core/supabase/repositorios/historial.js` | `listarParaExportar(filtro)`: todo el resultado, por bloques                                                      |
| `src/modules/e4-consulta/Historial.jsx`       | El botón, solo para el director y el administrador y solo con resultados; la descarga con `Blob` y `<a download>` |

**Pruebas**

| Nivel  | Prueba                                                                                                                                                      | CU          |
| ------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------- |
| Vitest | CSV: BOM; separador; comillas con el separador, comillas dobles y saltos de línea; tildes; horas «52,3»; sin resolver vacío; encabezado; nombre del archivo | CU-20 2     |
| Vitest | **Fórmulas:** un campo que empieza por `=`, `+`, `-`, `@`, tabulador o retorno de carro sale con `'` adelante; un número propio (las horas) no se toca      | Decisión 18 |
| Vitest | Bloques: pide hasta que llega uno incompleto; el orden se conserva; un error a mitad no descarga nada                                                       | CU-20 2     |
| Vitest | El botón: director y administrador sí; aprobador no (CU-20 1a); con cero resultados no se ve                                                                | CU-20 1a    |
| e2e    | `cu-20-exportar-resultado.spec.js`: el administrador filtra y exporta; la prueba lee la descarga: BOM, encabezado y la fila de la novedad que registró      | CU-20 1–3   |

---

## PR 8 · `feat/RF-31-enviar-push` (servidor; depende del 2)

**Empieza el día 1 con la prueba corta** (decisión 37).

**Migración `rf31_webhook_notificacion`:** `private.tg_notificacion_push()` y el disparador `after
insert` en `notificacion` (decisión 38).

| Ruta                                        | Contenido                                                                                                                           |
| ------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `supabase/functions/_shared/webpush.js`     | Puro, con Web Crypto: cifrado `aes128gcm` (RFC 8291) y firma VAPID (RFC 8292); sirve en Deno y en Node para Vitest (decisión 43)    |
| `supabase/functions/enviar-push/manejar.js` | Puro: valida el encabezado, arma el mensaje con `_shared/plantillas.js`, envía a cada suscripción y decide qué borrar (decisión 42) |
| `supabase/functions/enviar-push/index.ts`   | Solo arma las dependencias: el cliente con la clave secreta, `fetch` y los secretos (ADR 0012)                                      |
| `supabase/functions/enviar-push/deno.json`  | Su propio mapa de importaciones, para el trabajo `funciones` del CI                                                                 |
| `supabase/config.toml`                      | `[functions.enviar-push]` con `verify_jwt = false`                                                                                  |
| `scripts/vapid.mjs`, `package.json`         | `npm run vapid:claves`: genera el par con Web Crypto y lo escribe en `.env.local` sin imprimir la privada (decisión 41)             |
| `scripts/staging.mjs`                       | `npm run staging:secretos`: lee `.env.local` y pone los secretos de la función y los dos de Vault en «staging» (decisión 40)        |
| `.env.example`, `README.md`                 | Los nombres de las variables y de los secretos, con rellenos; ningún valor                                                          |

**Pruebas**

| Nivel   | Prueba                                                                                                                                                                                                              | CU             |
| ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------- |
| pgTAP   | `rf31_webhook_test.sql`: sin los secretos en Vault, una transición no encola nada y no falla (el Supabase local del CI y pgTAP)                                                                                     | CU-31          |
| pgTAP   | Con los secretos creados en la transacción, cada aviso encola una solicitud en `net.http_request_queue` con la URL, el encabezado y el aviso; **una transición que falla no deja nada**                             | CU-31 1–2      |
| pgTAP   | La función del disparador vive en `private` y `authenticated` no la ejecuta                                                                                                                                         | Regla 2        |
| Vitest  | `webpush.js`: el ejemplo del **apéndice A del RFC 8291** da el mismo cuerpo cifrado; el JWT de VAPID (cabecera, `aud` con el origen del punto de entrega, `exp` de menos de 24 h, firma verificable con la pública) | RFC 8291, 8292 |
| Vitest  | `manejar.js`: sin encabezado o con otro → 401 sin tocar nada; 201 → nada; 404 o 410 → borra esa suscripción; otro error o red → al log y sigue con las demás; siempre 200; sin suscripciones → 200                  | CU-31 2a       |
| Staging | `npm run staging:functions -- enviar-push`; una transición real con las sesiones de las e2e encola el webhook; los logs de la función (MCP) muestran el envío; el push llega al Chrome de la persona                | CU-31          |

---

## PR 9 · `feat/RF-31-notificaciones-push` (cliente; depende del 2 y del 8)

**Pantallas de Figma:** 10-B (`2:1703`) y 10-C (`2:1807`).

| Ruta                                                  | Contenido                                                                                                                                    |
| ----------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/core/push/suscripcion.js`                        | `sePuedeActivar()`, `estado()`, `activar(perfil)` (permiso tras el toque, `subscribe` con la clave pública, guarda la fila) y `desactivar()` |
| `src/core/supabase/repositorios/suscripciones.js`     | Guardar y borrar por `endpoint`                                                                                                              |
| `src/modules/e7-avisos/HojaActivarNotificaciones.jsx` | 10-B la primera vez que se abren los avisos en el dispositivo (decisión 44)                                                                  |
| `src/app/paginas/Cuenta.jsx`                          | «Notificaciones en este dispositivo», el control que promete 10-B                                                                            |
| `src/core/sesion/sesion.js`                           | `cerrarSesion` primero desactiva el push del dispositivo (decisión 45)                                                                       |
| `src/sw.js`                                           | `push` y `notificationclick` (decisión 46)                                                                                                   |
| `src/app/useInsignias.js`                             | Vuelve a contar con el mensaje del service worker                                                                                            |

**Pruebas**

| Nivel  | Prueba                                                                                                                                                                                        | CU            |
| ------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------- |
| Vitest | Suscripción: navegador sin soporte; permiso negado; `endpoint` que ya existe → se cancela y se crea otra; desactivar sin red cancela en el navegador y deja la fila para el 410               | CU-31, RNF-10 |
| Vitest | Service worker: `push` muestra la notificación con su título, cuerpo y dirección, y avisa a las pestañas; el clic enfoca una abierta y navega, o abre una nueva                               | CU-31 4–5     |
| Vitest | 10-B: aparece una vez por dispositivo; «Ahora no» no vuelve a preguntar; el texto según el rol. Cuenta: activar y desactivar                                                                  | CU-30 2a      |
| e2e    | `cu-31-notificaciones-push.spec.js`, con `PushManager` y `Notification` simulados: 10-B al abrir Avisos; «Activar» guarda la suscripción (la API la ve con la sesión); cerrar sesión la borra | CU-31         |
| Manual | La entrega real, en un Android con Chrome y, si hay, en un iPhone con la aplicación instalada (lista de chequeo de la decisión 47)                                                            | CU-31         |

---

## Cobertura de los cursos de cada caso de uso

| CU    | Curso normal                        | Alternos cubiertos | Nota                                                                                        |
| ----- | ----------------------------------- | ------------------ | ------------------------------------------------------------------------------------------- |
| CU-19 | Sí                                  | 3a, 4a, 4b         | 4b es CU-20                                                                                 |
| CU-20 | Sí                                  | 1a                 |                                                                                             |
| CU-26 | Sí                                  | 1a, 2a             | 2a con pgTAP (finca en cero) y Vitest; las e2e no cuentan: «staging» tiene cientos abiertas |
| CU-27 | Sí                                  | 3a                 | 24-B                                                                                        |
| CU-28 | Sí                                  | 2a                 | 25-B                                                                                        |
| CU-29 | Sí                                  | 2a, 2b             |                                                                                             |
| CU-30 | Sí                                  | 2a, 3a             | 2a es CU-31; 3a con pgTAP y con la e2e (el aviso espera al ingreso)                         |
| CU-31 | Con `PushManager` simulado y a mano | 2a                 | La entrega real la prueba una persona; 2a con Vitest (404, 410 y otros errores)             |
| CU-32 | Sí                                  | 1a, 3a, 4a         |                                                                                             |
| CU-18 | —                                   | —                  | «Corregir tipo»; «Volver a los avisos»; «Tiempo hasta resolver» desde `resuelta_en`         |
| CU-14 | —                                   | 5a                 | Un tipo fusionado se resuelve al destino (pgTAP del PR 6)                                   |
| CU-07 | —                                   | —                  | El aviso a los aprobadores al enrutar aparece en 10 (e2e del PR 2, del lado del aprobador)  |
| CU-10 | —                                   | —                  | El aviso al reportante al tomar (e2e del PR 2)                                              |

## En cada PR

- **Rama** desde `main` al día, con el nombre de `CLAUDE.md`. Si su base no está fusionada, sale de
  esa rama, va en borrador y dice «Depende de #N»; al fusionarse la base, se le trae `main`.
- **Prueba primero:** la prueba (pgTAP o Vitest) se escribe antes y se ve fallar; se anota en el
  PR.
- **Después de cada migración** (creada con `npx supabase migration new …`): `staging:push`,
  `staging:test`, `staging:types` (el archivo de tipos en el mismo commit) y `staging:advisors` sin
  avisos nuevos fuera de los previstos (cinco en el PR 1; ninguno más).
- **Después de cada cambio en `enviar-push`:** `npm run staging:functions -- enviar-push` y una
  prueba contra «staging».
- **Antes de abrir el PR:** lint, `format:check`, unitarias **también sin las variables de entorno,
  como el CI**, build, **peso de la ruta de ingreso** (si pasa de 200 KB, se detiene y se avisa),
  las e2e del RF en Chromium, capturas a 360 × 800 y 1280 × 800 en `docs/sprints/evidencias/S5/`
  (servidor simulado y datos de prueba), y la revisión con `code-review`, `ponytail-review`,
  `accessibility`, `web-design-guidelines` y, donde aplique, `security-review`.
- **Datos de las pruebas:** por la API con la sesión de cada rol, nunca con la clave secreta; nada
  del seed se cambia; las sesiones salen de `sesiones.setup.js` (Auth limita los ingresos); cada
  prueba busca por el código de su propia novedad, porque «staging» acumula las de todas las
  corridas.
- **Documentos en el mismo PR:** cambios al SDD y al SRS en `docs/cambios-sdd.md` (desde la 24);
  los textos que Figma no trae, con tuteo, en `docs/decisiones-pendientes.md` (desde el punto 41).
- **PR** con la plantilla y `gh pr create`. Sin fusionar, sin forzar un `push` y sin `rebase` de
  ramas publicadas. Archivos agregados por nombre. Commits con el RF como alcance.

## Fuera del alcance del Sprint 5

Avisos por correo o WhatsApp (RNF-16) · preferencias por tipo de aviso · exportar el panel (solo el
historial se exporta) · reportes programados · el panel para los aprobadores (Tabla 39, por validar
con el gerente) · crear tipos de falla desde 31 (los crean las áreas al resolver) · reactivar un
tipo (decisión 51) · borrar avisos · el historial, el panel y los avisos sin conexión · el buscador
por código en el teléfono (Figma no lo dibuja) · sincronización en segundo plano del navegador ·
todo lo que toque «PROYECTO» sin el OK del equipo.

**Lo que este plan decide no construir** (y por qué alcanza sin ello): Recharts (decisión 3) · una
librería de Web Push (decisión 43) · una tabla o columnas nuevas en `notificacion` para el contexto
del aviso (el estado y el rol alcanzan; decisión 30) · paginación por cursor (con los volúmenes del
piloto, `range` alcanza; decisión 17) · vistas materializadas para el panel (decisión 27) · la
sección `[db.vault]` de `config.toml` (decisión 40).

## Riesgos del sprint

| N.º | Riesgo                                                                     | Señal                                                 | Respuesta                                                                                                                             |
| --- | -------------------------------------------------------------------------- | ----------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | El push no llega a un navegador real                                       | El día 1 termina sin una entrega                      | RF-31 sale (línea de corte) y queda como trabajo futuro con su diseño y su rama                                                       |
| 2   | El cifrado propio tiene un error que el navegador rechaza                  | 400 o 403 del servicio push                           | El vector del RFC 8291 en Vitest antes de enviar nada; si no alcanza en el día, `@negrel/webpush` fijado (con el OK y su ADR)         |
| 3   | Todo el sprint con el CI en rojo                                           | La prueba con fecha                                   | PR 0 primero                                                                                                                          |
| 4   | Las `rpt_*` pasan de 5 s (RNF-06)                                          | `explain analyze` en «staging» con sus 1068 novedades | Índice para lo que falte; el `jsonb` de una sola consulta por pestaña; medirlo en cada PR del panel                                   |
| 5   | La ruta de ingreso pasa de 200 KB                                          | Quedan 12,2 KB                                        | Todo lo nuevo va bajo demanda; el contador vive en el marco, que ya carga aparte; se mide en cada PR                                  |
| 6   | Pages publica `main` antes de que «PROYECTO» tenga las funciones           | Pasó el 10 oct                                        | Las migraciones de cada PR, justo antes de fusionarlo (decisión 55)                                                                   |
| 7   | Un secreto termina en el repositorio, en un log o en la conversación       | `git diff` con una clave; salida de un comando        | Los scripts leen `.env.local` y nunca imprimen valores; las claves de «PROYECTO» las pone una persona; revisión con `security-review` |
| 8   | Un teléfono compartido recibe los avisos de la persona anterior            | Una prueba con dos usuarios en el mismo navegador     | Cerrar sesión cancela la suscripción; el 410 borra la fila que quede (decisión 45)                                                    |
| 9   | Dos fusiones a la vez dejan novedades en un tipo inactivo                  | Una novedad con `tipo_falla` inactivo                 | Bloqueos en orden y `for share` al resolver (decisión 50)                                                                             |
| 10  | «staging» tiene miles de avisos y novedades de las pruebas                 | La lista de avisos del reportante de prueba es larga  | Cada e2e busca por el código de su novedad; las cifras se prueban en pgTAP con datos de 2001, dentro de la transacción                |
| 11  | En iPhone el push solo existe con la aplicación instalada (iOS 16.4 o más) | No hay iPhone en el equipo                            | 10-B no se ofrece si el navegador no lo admite; Cuenta lo explica; se prueba en Android y se dice en el informe                       |
| 12  | Excel abre mal el CSV                                                      | Columnas pegadas o tildes rotas                       | `;` con BOM (decisión 16) y la prueba con `xlsx`; queda por validar con el director (Tabla 39)                                        |
| 13  | Cambiar `sw.js` dispara el aviso de nueva versión en medio de las e2e      | La e2e de RNF-05 o de `s0-app-instalable` ve el aviso | Las e2e corren sobre un build nuevo; se revisa la de instalación en el PR 9                                                           |
| 14  | Cinco días para 63 puntos                                                  | Los puntos de control de los días 1, 3 y 4            | La línea de corte: RF-31, RF-20 y RF-32, en ese orden; nunca las pruebas                                                              |
| 15  | Se pierde la clave privada VAPID de «staging»                              | Solo existe en el `.env.local` de una persona         | Se genera otra y cada dispositivo vuelve a activar las notificaciones; en «PROYECTO», la guarda el equipo en su gestor                |

## Decisiones para el equipo

Cada una trae una recomendación. **Verifiqué los 48 puntos del encargo** contra el código, las
fuentes, «staging» y Figma. Encontré otra cosa en 11: el estado de las unitarias y los íconos (§2),
y los puntos 3, 8, 9, 16, 21, 23, 25, 41 y 43; está dicho en la fila de cada uno («el encargo
decía…, encontré…»).

### Transversales

| N.º | Decisión                  | Recomendación                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| --- | ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Fechas                    | **19–23 oct**, cinco días hábiles. El calendario decía 9–13 nov; el próximo festivo es el 2 nov                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| 2   | Contrato primero          | El PR 1, desde `main`, con las nueve firmas y `resuelta_en`. **Tipos que la Tabla 21 no fija:** `p_desde` y `p_hasta` son `date`; las `rpt_*` devuelven un `jsonb` por pestaña (una sola llamada por indicador, una forma documentada, que pgTAP lee con `->>`); `marcar_avisos_leidos` devuelve cuántos marcó; las de tipos devuelven la fila del tipo y `corregir_tipo_falla`, la novedad, como las demás transiciones. Precisión al SDD (cambio 24)                                                                                                                                                                                                                                                                    |
| 3   | Dependencias nuevas       | **Ninguna.** Gráficos: **Recharts 3.10.1 pesa 151,5 KB comprimidos** (medido en bundlephobia, 11 dependencias); cargado solo en el panel no toca la ruta de ingreso, pero multiplica por diez el paquete del panel y **no dibuja la matriz** (es una tabla). Lo que piden 23 a 27 son barras (anchos con CSS), una línea de tres a doce puntos (un `<polyline>` de SVG) y una tabla con colores: unos 4 a 6 KB propios, con los tokens de Figma, como el service worker sin Workbox (ADR 0008). Push: decisión 43. **Va un ADR corto por cada una** (0014 y 0015), porque el plan de arranque nombraba Recharts y una librería                                                                                            |
| 4   | Peso (RNF-05)             | Nada nuevo entra en la ruta de ingreso. Historial, panel, avisos, tipos de falla y la suscripción, cada uno con `React.lazy`; el panel solo lo descargan el director y el administrador (su ruta tiene guardián). El contador va en el marco, que ya carga aparte. Las plantillas pesan menos de 1 KB y van con la pantalla 10. Se mide en cada PR                                                                                                                                                                                                                                                                                                                                                                        |
| 5   | Fechas, períodos y cifras | Todo en `America/Bogota` y todos los tiempos desde `fecha_registro` (RNF-09). `p_desde` y `p_hasta` son **días de Colombia, inclusivos**: desde las 12:00 a. m. de `p_desde` hasta antes de las 12:00 a. m. del día siguiente a `p_hasta`. «Por mes» es `date_trunc('month', … at time zone 'America/Bogota')`. Duraciones con `formatearDuracion` («1 d 3 h», punto 19). Promedios en días con un decimal y coma («4,3 días»); porcentajes con un decimal («18,4 %», con el espacio de Figma)                                                                                                                                                                                                                            |
| 6   | «Tiempo hasta resolver»   | **Opción A (recomendada): columna `resuelta_en` en `v_novedad`**, la fecha de la última transición hacia `resuelta` si la novedad está resuelta o cerrada. La vista sigue con `security_invoker` y la subconsulta usa el índice `(novedad_id, id)` del historial; Postgres no la calcula en las consultas que no piden la columna. Una sola regla para 21, 22, el CSV y 24 (la `rpt_tiempos_atencion` usa la misma expresión), y el detalle deja de calcularla a partir de la línea de tiempo. **B:** una consulta aparte por página, como `listarTransicionesDeBandeja`: dos viajes, y el CSV tendría que repetirla por bloque. **C:** que la traigan las `rpt_*`: no cubre 21 ni el CSV. Complemento al SDD (cambio 25) |
| 7   | La prueba con fecha       | **El encargo decía 1301 unitarias con una falla esperada; encontré una falla más:** `Pendientes.test.jsx` depende del día de hoy. Se fija el reloj en el PR 0 y se buscan otras pruebas que comparen con «hoy» sin fijarlo                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| 8   | El trabajo `e2e` del CI   | **Que pase a obligatorio** (en el PR 0) y que una persona lo marque como requerido en la protección de `main`. Desde que entró (#30): 16 corridas; falló en 3, todas en los PR que lo estrenaban o lo arreglaban, y nunca en `main`. La última de `main`: 240 pasan, 4 intermitentes que pasan al reintentar, ninguna falla. Las de WebKit sin red siguen como `fixme`                                                                                                                                                                                                                                                                                                                                                    |

### Historial (RF-19)

| N.º | Decisión                             | Recomendación                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| --- | ------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 9   | Quién lo usa y qué filtra cada rol   | El aprobador (su área), el director y el administrador (todo); el reportante no (Tabla 10). El alcance lo da la RLS y el guardián ya existe. **El filtro de área del aprobador se oculta:** así lo dibuja 21-D («Filtros (3)» sin área, y el área bajo el título). **Fincas:** activas e inactivas (las inactivas tienen historia), las inactivas al final con «(inactiva)». **Tipos de falla:** activos y desactivados; los fusionados no, porque sus novedades ya están en el destino                                                                                                      |
| 10  | Filtros en la dirección              | Como en la bandeja: `finca`, `area`, `estado` (lista separada por comas o `abiertas`), `desde`, `hasta`, `tipo` y `pagina`. «Aplicar filtros» los lleva a la dirección (Figma tiene el botón: no se aplica con cada cambio); los chips reflejan la dirección, no el formulario. Así el panel enlaza con los filtros puestos y el detalle vuelve al mismo resultado                                                                                                                                                                                                                           |
| 11  | Estados y rango (los controles)      | Figma dibuja dos desplegables («Resuelta, Cerrada» y «01 abr 2026 – 24 sep 2026»). **Estados:** un botón con ese texto que abre una lista de casillas (`aria-expanded`), sin `<select multiple>`. **Rango:** un botón con el mismo aspecto que abre dos `<input type="date">` nativos, «Desde» y «Hasta». Sin librería de calendario. En el teléfono, los mismos campos dentro de la hoja                                                                                                                                                                                                    |
| 12  | Página, columnas y números de página | **20 por página** (`NOVEDADES_POR_PAGINA`, como todas las listas); Figma muestra 8 porque el ejemplo tiene 9. **El encargo decía que `Paginacion.jsx` ya trae la paginación numerada; encontré que solo tiene flechas.** Se le agregan los números (hasta cinco, con «…»), con `aria-current="page"`. «Registrada en finca» con `formatearFechaCorta` («24 sep, 8:15 a. m.»), y con el año cuando no es el actual                                                                                                                                                                            |
| 13  | Sin conexión                         | RF-19 requiere conexión y RF-24 no cubre el historial: no se guarda nada en el dispositivo. Sin red: «El historial necesita conexión. Ábrelo cuando tengas internet.», con los filtros deshabilitados. El mismo texto, con «panel» o «avisos», en esas pantallas                                                                                                                                                                                                                                                                                                                             |
| 14  | 21-D y la nota del CSV               | **El encargo no lo menciona:** 21-D le muestra al aprobador «La exportación a CSV solo está disponible para el administrador y el director de agricultura.». Es compatible con CU-20 1a (la opción no se muestra; la nota la explica). Se muestra al aprobador en los dos tamaños. Las tarjetas de 21-D llevan «Tipo de falla: … · Reportada por …» en vez de la descripción: una variante de `TarjetaNovedad`                                                                                                                                                                               |
| 15  | Buscador por código                  | **Acepta** «NOV-0153», «nov 153», «NOV0153», «0153» y «153» (se toman los dígitos). **Hace:** busca en `v_novedad` (la RLS pone el alcance) y abre el detalle, con la pantalla actual como origen. Si no aparece: «No encontramos NOV-0153 entre las novedades que puedes ver.» (el mismo texto si no existe o si está fuera del alcance, como 22-B). Sin dígitos: «Escribe un código como NOV-0153.». Sin red: «Buscar por código necesita conexión.». **Para quién:** los cuatro roles, en la barra del escritorio (también el reportante). En el teléfono no está dibujado y no se agrega |

### Exportar a CSV (RF-20)

| N.º | Decisión              | Recomendación                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| --- | --------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 16  | Separador             | **Punto y coma con BOM**, como recomendaba el plan de arranque: Excel con la configuración regional de Colombia usa la coma como separador decimal y abre ese archivo directo, con las columnas separadas. Con coma, Excel lo pega en una columna; y la línea `sep=,` haría que ignorara el BOM (se romperían las tildes). Google Sheets y LibreOffice detectan el `;`. Es un cambio a lo que adopta el SDD (5.3.8 y Tabla 39), y **queda por validar con el director y los administradores** (cambio 32)                                                                                                                                                                                                                                                                               |
| 17  | Contenido y descarga  | Las columnas de SDD 5.3.8, en este orden y con estos encabezados: «Código;Registrada en finca;Finca;Razón social;Área;Prioridad;Estado;Tipo de falla;Fecha de ejecución;Reportada por;Horas hasta la resolución». Fechas en la hora de Colombia, en la forma que Excel reconoce como fecha («2026-09-24 08:15» y «2026-09-23»); las horas con un decimal y coma («52,3»); vacío si no se ha resuelto. UTF-8 con BOM, comillas cuando el campo trae `;`, comillas o saltos de línea. Nombre: `historial-novedades-2026-10-17.csv`. **Todo el resultado filtrado**, en bloques de 1000 (lo máximo que entrega PostgREST por solicitud) hasta que llega uno incompleto; un error a mitad no descarga nada. `// atajo: range con offset; con decenas de miles de filas, paginar por cursor` |
| 18  | Inyección de fórmulas | Todo campo de texto que empieza por `=`, `+`, `-`, `@`, tabulador o retorno de carro sale con un apóstrofo adelante (recomendación de OWASP), además de las comillas. Aplica a los nombres de tipos (los escriben los aprobadores), de personas y de fincas (el administrador) y a cualquier texto. Las columnas que arma la aplicación (fechas, horas) no lo necesitan. Pruebas con Vitest y revisión con `security-review`                                                                                                                                                                                                                                                                                                                                                            |

### Panel de reportes (RF-26 a RF-29)

| N.º | Decisión                              | Recomendación                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| --- | ------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 19  | Seguridad de las `rpt_*`              | `security invoker` (SDD 6.1.9), con `set search_path = ''`, nombres calificados, `revoke … from public, anon` y `grant … to authenticated`. **Verifican el rol al comenzar:** quien no es director ni administrador activo recibe `SIN_PERMISO` (si no, un aprobador recibiría un panel recortado por su RLS). **Confirmado: no suman avisos del asesor**, porque la regla `0029` solo mira las `security definer`. Las políticas de `novedad` evalúan el rol una sola vez (`(select private.fn_rol())`), así que la RLS no recorre fila por fila                                                                                                                                                                                                                                                                                                                                                                      |
| 20  | Lo que devuelve cada una              | `datos_al` (la hora de la consulta) en las cuatro. **Abiertas:** `fincas` (`id`, nombre, razón social, activa, total y `por_area`), `areas` y `estados`. **Tiempos:** `areas` (resueltas y promedio en horas, nulo sin resueltas), `meses` (por mes y área) y `abiertas` (las cinco con más tiempo). **Escalamiento:** `registradas`, `escaladas`, `areas`, `decisiones` (aprobadas, rechazadas, en espera) y `novedades` (código, finca, área, justificación, decisión y sus dos fechas). **Recurrencia:** `total`, `excluidas` y `celdas` (finca, tipo y cantidad, solo las que no son cero). La forma exacta va en el PR 1                                                                                                                                                                                                                                                                                          |
| 21  | Definiciones (Tabla 34) y sus bordes  | **Abiertas:** registrada, asignada, en atención, escalada, aprobada y resuelta; por finca, por área y por estado. Las fincas activas sin abiertas salen en cero; **también las inactivas que aún tengan abiertas** (CU-04 3b permite desactivar una finca con abiertas). **Tiempos:** de las novedades resueltas o cerradas cuya última resolución cae en el período; la que volvió a «en atención» por «la falla persiste» no cuenta hasta que se resuelva otra vez. **Escalamiento:** registradas en el período con al menos una transición a «escalada», sobre las registradas en el período, por el área actual; la decisión es la de su **última** escalada. **Recurrencia:** resueltas y cerradas por finca × tipo, período por fecha de registro; aparte, las del período sin tipo (abiertas o rechazadas)                                                                                                      |
| 22  | Lo que Figma agrega: quién lo calcula | **Las funciones devuelven agregados simples; la pantalla agrupa** (funciones puras con Vitest): las siete primeras fincas y «Otras N fincas» (26), las cinco «Combinaciones más repetidas» (26) y las tres de 27, las fincas desplegables de 27, el orden de filas y columnas. Así cada `rpt_*` es una o dos consultas con `group by` y el corte no queda escondido en SQL. **«Abiertas con más tiempo»: cinco**, como Figma. **25 lista todas las escaladas del período** con su justificación y su decisión. `// atajo: sin paginar; con más de 100 escaladas en un período, paginar` (en tres meses de datos de ejemplo de Figma son 7)                                                                                                                                                                                                                                                                             |
| 23  | Períodos                              | **El encargo decía que los selectores no muestran sus opciones; encontré cuatro en Figma.** Opciones: «Mes actual», «Últimos 3 meses», «Últimos 6 meses», «Últimos 12 meses» y «Personalizado» (dos fechas nativas, con el mensaje de 21-B si se invierten). «Últimos N meses» son meses de calendario hasta hoy (el 24 sep, «Últimos 3 meses» es 1 jul a 24 sep, «(jul–sep 2026)»). Por omisión, «Últimos 3 meses» en 24 y 25 y «Últimos 6 meses» en 26 y 27, como Figma. El período va en la dirección (`?periodo=3m`, o `desde` y `hasta`). En las `rpt_*`, un rango invertido o nulo responde `FECHA_INVALIDA` (precisión a la Tabla 22, cambio 29)                                                                                                                                                                                                                                                                |
| 24  | Del panel al historial                | Una finca o «Ver en historial» de 23 → `/historial?finca=<id>&estado=abiertas`; la tarjeta de un área → `?area=<id>&estado=abiertas`. Una celda o una combinación de 26 y 27 → `?finca=<id>&tipo=<id>&estado=resuelta,cerrada&desde=…&hasta=…` (el período de la pestaña). Las filas de 24 y 25 abren el detalle. **La pestaña va en un parámetro (`?indicador=`), no en una ruta:** el detalle ya sabe volver a `/panel` («Volver al panel», `rutaDeOrigen`) y no cambia                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| 25  | Gráficos y accesibilidad              | Formas de Figma (verificadas con `dataviz`): barras horizontales en 23 y 25 (apiladas por área en 23), **una línea en 24** (el encargo decía barras por mes; Figma dibuja líneas, con el último valor rotulado al final), una barra apilada para las decisiones y la matriz como tabla con color. **Nada solo por color:** cada barra lleva su número, cada serie su leyenda y cada celda su número. **Los datos también en tabla** (RF-26 «gráficos y tabla»): 23 ya la tiene visible; 24 y 25, una tabla para lectores de pantalla junto al gráfico (el SVG con `aria-hidden`). La matriz es una `<table>` con `<th scope>`, y cada celda un enlace con su nombre. **Paleta:** el ocre y el azul de las áreas pasan las seis pruebas del validador de `dataviz`; el verde azulado de «Aprobadas» queda bajo el piso de croma, y lo compensan la leyenda con cantidades y la tabla. Los colores salen de `tokens.css` |
| 26  | El panel en el teléfono               | Figma solo dibuja 27. Para 23 a 25 en el teléfono: las mismas piezas en una columna, las pestañas en pastillas de 27 y las tablas con desplazamiento horizontal dentro de su tarjeta. Sin «Datos al» ni «Actualizar», como en 27                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| 27  | Pruebas del panel y RNF-06            | Las cifras exactas en pgTAP, con datos propios en **2001**, dentro de la transacción. Para abiertas, que no tiene período, con fincas que crea la prueba y comparando su fila (y la diferencia antes y después por estado). Las e2e comprueban estructura y navegación, no números. **RNF-06:** `explain analyze` de cada `rpt_*` en «staging» con la sesión de un director simulada, anotado en el PR; si alguna se acerca a 5 s, un índice. Sin vistas materializadas                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| 28  | Inicio del administrador              | `/panel`, una línea en `roles.js`. Cierra el temporal del cambio 14 (y su prueba)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |

### Avisos (RF-30)

| N.º | Decisión                           | Recomendación                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| --- | ---------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 29  | Regla 1 frente al esquema          | **El encargo decía que el choque es con el esquema; también es con el SDD:** las Tablas 20 y 31 diseñan el `PATCH` de `leida` y `leida_en`. **Opción A (recomendada):** `marcar_avisos_leidos` `security definer` (verifica que el usuario esté activo y solo toca filas con `destinatario_id = auth.uid()`; `leida_en` la pone el servidor) y se revocan el `update` y su política. Cumple la regla 1, que no se negocia, y suma un _WARN_ del tipo conocido. **B:** `security invoker` sobre la política actual: sin aviso, pero el cliente sigue pudiendo escribir en `notificacion`. Cambio a las Tablas 20 y 31 (cambio 26)                                                                                                                                                                                                                                                                                                                    |
| 30  | Plantillas: contexto y dónde viven | **Confirmado leyendo las migraciones:** el reportante solo recibe «asignada» por una reasignación (`registrar_novedad` avisa solo a los aprobadores); los aprobadores solo reciben «en atención» cuando la finca dice que la falla persiste (`tomar_novedad` avisa al reportante); los administradores solo reciben «resuelta» por un tipo nuevo. Además, «aprobada» y «rechazada» tienen un solo texto para todos sus destinatarios. **El texto sale del estado nuevo y del rol del destinatario:** no hace falta guardar más en `notificacion`. Una sola función pura en `supabase/functions/_shared/plantillas.js`; **el cliente la importa directo** (Vite lo permite desde la raíz del proyecto), sin la segunda copia que usa `contrasena.js`. Los datos (área, finca, prioridad, tipo) son los actuales de la novedad: `// atajo: si la novedad se reasignó después del aviso, 10 muestra el área nueva; el push sí sale con la del momento` |
| 31  | Figma frente a la Tabla 33         | **Manda la Tabla 33.** 10 escribe «Tu novedad fue asignada a Sistemas.» a la hora del registro: ese aviso no existe (Tabla 30: el reportante no recibe aviso al registrar; su constancia es 06). El único «asignada» que recibe el reportante es por una reasignación, y la tabla lo dice bien: «Tu novedad fue reasignada a {área}.». Los demás textos de 10 coinciden con la Tabla 33 sin el código, que va arriba de cada aviso («El director de agricultura aprobó la novedad; vuelve a Mantenimiento para ejecutarla.»). 10-C: decisión 47                                                                                                                                                                                                                                                                                                                                                                                                     |
| 32  | Pantalla 10                        | Los 20 más recientes y «Ver más» (como las listas). Grupos en la hora de Colombia: «Hoy», «Ayer», «Esta semana» (de lunes a domingo, como la semana ISO) y, sin dibujo, «Anteriores». Hora: «7:40 a. m.» hoy y ayer; «mar 22 sep» en la semana; «15 sep» antes (con el año si es otro). Vacía: «No tienes avisos.». En el escritorio, la misma lista en una columna centrada (Figma solo la dibuja en el teléfono)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| 33  | Contador sin leer                  | Reutiliza `useInsignias.js` e `insignias.js`: `/avisos` pasa a contarse para los cuatro roles, con la recuperación del administrador como hasta hoy. Se cuenta al abrir, al volver a la pestaña, cada minuto, después de cada acción propia (`pedirConteoDeInsignias`) y cuando el service worker recibe un push. **Usa el monitor de conexión** (`estaEnLinea` y `suscribir`), no `navigator.onLine`: la decisión 39 del Sprint 4 lo dejó porque no se tocaba ese archivo; ahora se toca. `Insignia.jsx` recibe su texto («3 avisos sin leer»). Un solo anuncio cuando el número sube («Tienes 3 avisos sin leer»), por la región `aria-live` que ya tiene el marco                                                                                                                                                                                                                                                                                |
| 34  | Insignia de «Bandeja»              | Figma la dibuja en 11 y 12 (decisiones-pendientes, punto 19). **Recomendación: que cuente «Por atender»** (asignadas y aprobadas del área), con `contarBandeja`, que ya existe: unas cinco líneas en el mismo hook. Entra en el PR 2 si el equipo la quiere; si no, queda fuera                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| 35  | Sin conexión                       | Sin red, la campana no pide nada (decisión 36 del Sprint 4) y conserva el último número; 10 muestra «Los avisos necesitan conexión. Ábrelos cuando tengas internet.». Los avisos no se guardan en el dispositivo                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| 36  | Extremo a extremo                  | Sin ingresos nuevos (`sesiones.setup.js`): el reportante registra y el aprobador la toma por la API; el reportante abre la aplicación, ve la insignia y el aviso, lo toca, queda leído y ve el detalle. Busca el aviso por el código de su novedad: «staging» tiene 2651 avisos sin leer de las corridas anteriores                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |

### Notificaciones push (RF-31): la primera en la línea de corte

| N.º | Decisión                  | Recomendación                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| --- | ------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 37  | Prueba corta (día 1)      | En la rama del PR 8: (1) `webpush.js` con su prueba contra el ejemplo del RFC 8291; (2) las claves de «staging» y sus secretos (decisiones 40 y 41); (3) `enviar-push` mínima desplegada en «staging»; (4) una persona abre el build local (`npm run build` y `npm run preview`: el service worker solo existe en el build) con Chrome, se suscribe desde una página de desarrollo (`/_dev/push`, que no se empaqueta en producción, como `/_dev/componentes`) y el agente le envía un aviso. Chromium de Playwright no sirve: no trae el servicio push de Google. **Si al final del día no llegó, RF-31 sale**                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| 38  | Webhook (SDD 6.1.6)       | Un disparador propio `after insert` en `notificacion` (no el «Database Webhook» del panel de Supabase, que guarda el encabezado en la definición del disparador, es decir, en la migración). `private.tg_notificacion_push()` es `security definer`, con `search_path` vacío: lee de `vault.decrypted_secrets` la URL de la función y el secreto; si alguno falta (el Supabase local del CI, pgTAP), devuelve sin hacer nada. Si están, `net.http_post` con el aviso como `record` (como los webhooks de Supabase) y el encabezado `x-webhook-secreto`, con 5 s de espera. **`pg_net` encola en la misma transacción:** si la transición falla, la solicitud se revierte con ella (se prueba en pgTAP con la cola). La entrega ocurre después del `commit` y no frena la transición (Figura 17)                                                                                                                                                                                                                                                                                                                                                                         |
| 39  | Vault y `staging:reset`   | **Verificado en el CLI:** `db reset --linked` no toca el esquema `vault` ni las extensiones `supabase_vault` y `pg_net`; los secretos sobreviven y el disparador vuelve con las migraciones. No hace falta volver a configurarlos después de un reset                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| 40  | Secretos y quién los pone | **«staging»:** `npm run staging:secretos`, como `staging:usuarios`: lee de `.env.local` `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT` y `ENVIAR_PUSH_SECRETO` (este lo genera el mismo script si falta); los pone como secretos de la función (`supabase secrets set` con un archivo temporal que se borra) y en Vault (`enviar_push_url` y `enviar_push_secreto`, con `vault.create_secret` o `update_secret`). Nunca imprime un valor. **«PROYECTO»:** los mismos pasos, a mano, por una persona (decisión 55). **Descartado:** `[db.vault]` en `config.toml`: el CLI lo aplicaría también al hacer `db push` contra «PROYECTO» con las variables de quien lo corra                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| 41  | Claves VAPID              | **Un par por proyecto.** `npm run vapid:claves` (Web Crypto de Node, P-256, sin dependencias) escribe en `.env.local` `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY` y `VITE_VAPID_PUBLIC_KEY`, sin imprimir la privada. La privada solo existe como secreto de `enviar-push`; la pública va en Pages (Production: la de «PROYECTO»; Preview: la de «staging»), en `.env.local`, y con un relleno en `.env.example` y en el CI (sin ella, la aplicación no ofrece 10-B). Las de «staging» las genera una sola persona, una vez; las de «PROYECTO», una persona del equipo, que las guarda en su gestor de contraseñas. **El _subject_ `mailto:` lo define el equipo**                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| 42  | `enviar-push` (SDD 5.3.5) | Por cada solicitud: compara el encabezado con el secreto **en tiempo constante** (los dos pasan por SHA-256 y se comparan byte a byte sin salir antes); lee la novedad (código, finca, área, prioridad, tipo) y el rol del destinatario con la clave secreta; arma el mensaje con `plantillas.js`; lo envía a cada suscripción del destinatario con `TTL` de un día. 201: nada; 404 o 410: borra esa suscripción; otro error o falla de red: al log, y sigue con las demás. Responde 200 aunque fallen los envíos (401 solo si el secreto no coincide). El aviso de la aplicación nunca se toca (CU-31 2a). Lógica en módulos `.js` puros con Vitest; `index.ts` solo arma las dependencias; `deno.json` propio (ADR 0012)                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| 43  | Cifrado y firma en Deno   | **Implementación propia con Web Crypto** en `_shared/webpush.js`: ECDH P-256, HKDF-SHA-256 y AES-128-GCM (RFC 8291, `aes128gcm`) y un JWT ES256 para VAPID (RFC 8292). Unas 120 líneas, sin dependencias, probadas con el ejemplo del apéndice A del RFC 8291 en Vitest (Node 24 trae la misma Web Crypto que Deno). **Alternativa:** `jsr:@negrel/webpush` 0.5.0 (MIT, solo Web Crypto); es una dependencia nueva, tiene un año sin versiones y su autor advierte que no la revisó un experto en criptografía: el mismo riesgo que la propia, pero sin el control de la prueba. Queda como respaldo si la prueba corta falla por el cifrado, con el OK y su ADR                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| 44  | Suscripción (10-B)        | 10-B aparece **la primera vez que se abre 10** en el dispositivo (Figma la dibuja sobre 10), solo si el navegador lo admite (`PushManager`, `Notification` y service worker; en iPhone solo existe con la aplicación instalada, iOS 16.4 o más) y si el permiso no está decidido. «Activar notificaciones» pide el permiso (el toque es la acción explícita) y se suscribe; «Ahora no» la cierra y no vuelve a salir: se guarda en el almacén `meta` de IndexedDB, no en `localStorage`. **Cuenta** (lo que promete «Puedes cambiarlo después en Cuenta», sin dibujo): una fila «Notificaciones en este dispositivo» con «Activadas» o «Desactivadas» y el botón «Activar» o «Desactivar»; si el navegador no lo admite: «Este navegador no permite notificaciones. En iPhone, primero agrega la aplicación a la pantalla de inicio.»; si se negó el permiso: «Bloqueaste las notificaciones en el navegador. Para activarlas, cámbialo en su configuración.». El texto de 10-B es del reportante («cuando tu novedad cambie de estado»); para los demás roles: «Te avisaremos en este dispositivo cuando cambie una novedad que atiendes, aunque la app esté cerrada.» |
| 45  | Dispositivo compartido    | Al cerrar sesión, **antes de `signOut`**: `unsubscribe()` en el navegador (funciona sin red) y, con red, se borra la fila por su `endpoint`. Sin red, la fila queda: el servicio push responderá 410 y `enviar-push` la borra. Si al activar, el `endpoint` ya existe a nombre de otra persona (la RLS no deja verlo ni borrarlo), se cancela esa suscripción del navegador y se crea otra: el navegador entrega un `endpoint` nuevo                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| 46  | Service worker            | `push`: muestra la notificación con el título y el cuerpo recibidos, el ícono de la aplicación, `tag` por novedad (los avisos de una misma novedad se reemplazan) y la dirección en `data`; y avisa a las pestañas abiertas para que recuenten. `notificationclick`: la cierra y enfoca una pestaña abierta (y la lleva a `/novedades/:id?aviso=<id>`) o abre una nueva; la aplicación marca ese aviso leído al abrir el detalle. Sigue sin cachear nada de Supabase. Cambiar `sw.js` dispara el aviso de nueva versión: las e2e corren sobre un build nuevo                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| 47  | Contenido del push        | Viaja cifrado de punta a punta (Google y Apple no lo leen), pero se ve en la pantalla bloqueada de un teléfono que puede ser compartido (RNF-10, RNF-18). **Sin la descripción**, que es texto libre y puede traer nombres. **Título:** el código y el estado («NOV-0153 · Asignada»); **cuerpo:** el texto de la Tabla 33, el mismo de 10. 10-C (que muestra la descripción y la prioridad) se aparta en el cuerpo; queda anotado para Figma. **Lista de chequeo en un dispositivo real:** activar desde 10-B; cerrar la aplicación; desde otra cuenta, tomar una novedad suya; llega el push; tocarlo abre el detalle; el aviso queda leído; cerrar sesión y repetir: no llega                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |

### Tipos de falla (RF-32)

| N.º | Decisión                       | Recomendación                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| --- | ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 48  | Seguridad                      | Las cuatro son `security definer` (escriben en `tipo_falla`, `novedad`, `auditoria_tipo_falla` e `historial_transicion`), con todo lo de la regla 2 y `SIN_PERMISO` para quien no sea un administrador activo (`private.perfil_para_transicion(4)`). Cada una suma un _WARN_ del tipo conocido (en el PR 1)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| 49  | Renombrar y el nombre repetido | Normaliza con `private.normalizar_tipo_falla` y guarda el nombre como lo escribió el administrador. El mismo tipo con otras mayúsculas o tildes («biometrico» → «Biométrico») sí se permite. **La pantalla detecta 31-B antes de llamar** (compara con la lista, con `sinTildes`) y ofrece «Fusionar en su lugar». **Código propio en el servidor: `TIPO_FALLA_DUPLICADO`** (cambio a la Tabla 22) para la carrera en que otro tipo con ese nombre aparece entre la carga de la lista y el envío: la pantalla vuelve a cargar la lista y muestra 31-B. Mezclarlo con `TIPO_FALLA_INVALIDO` no dejaría saber cuándo proponer la fusión. Si el nombre es el de un tipo inactivo: «Ya existe «{tipo}», pero está inactivo. Elige otro nombre.» (no se fusiona con un inactivo)                       |
| 50  | Fusionar                       | Bloquea **los dos tipos en orden de `id`** (`select … order by id for update`), para que dos fusiones a la vez no se traben. Origen = destino → `TIPO_FALLA_INVALIDO` (31-C); origen o destino inactivo → `TIPO_FALLA_INVALIDO`. Reasigna todas las novedades del origen, **también las cerradas**; desactiva el origen; audita (origen, destino, valor anterior = nombre del origen). **Cadenas:** A→B y después B→C dejan todo en C, y `resolver_tipo_falla` sigue la cadena (cambio 9). **Carrera con `registrar_solucion`:** `resolver_tipo_falla` pasa a leer el tipo con `for share`, para que una solución en curso no deje una novedad con el origen ya inactivo. Dos fusiones simultáneas no se prueban en pgTAP (una sola sesión): quedan cubiertas por el orden de los bloqueos        |
| 51  | Reactivar                      | **Sin reactivar.** RF-32 y `accion_auditoria` no lo tienen, y **el encargo lo dejaba abierto pero Figma ya lo resuelve:** 31 dibuja el tipo «Inactivo» con sus tres acciones deshabilitadas. Agregarlo sería un valor nuevo en el tipo enumerado y un cambio al SRS                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| 52  | Pantalla 31                    | **Lista:** los activos y los desactivados; los fusionados no («retira el origen de la lista», RF-32), se reconocen por su auditoría. «Novedades asociadas» con `novedad(count)` embebido en la consulta del catálogo (el administrador ve todas por su RLS); «Creado por» con el usuario embebido; «Creado el» de `creado_en`. Orden: activos por novedades, de mayor a menor, y los inactivos al final. `// atajo: se carga todo el catálogo; con más de 500 tipos, paginar`. **Registro de cambios:** fecha, usuario, acción y cambio; el nombre nuevo de un renombre es el valor anterior del renombre siguiente o el nombre actual. **Desactivar** (sin dibujo): «Desactivar tipo de falla», «"{tipo}" saldrá de las sugerencias. Sus {n} novedades lo conservan.», «Cancelar» y «Desactivar» |
| 53  | Corregir el tipo               | Solo una novedad `cerrada` y un tipo activo y distinto, sin cambiar el estado (Tabla 30). **Verificado:** `historial_transicion` y sus disparadores aceptan `cerrada → cerrada` (no hay restricción entre los dos estados), pero **`LineaDeTiempo` hoy lo pintaría como un cambio de estado**: se muestra como «Tipo de falla corregido», con la observación «"Puentes" → "Puentes y pasos"». No avisa a nadie (Tabla 30). «Corregir tipo» en 22, solo el administrador y en cerradas (Tabla 35: ya está en `accionesDisponibles`). **El diálogo no está en Figma:** «Corregir tipo de falla», «Tipo actual: {tipo}», el campo «Tipo correcto» (los tipos activos en un `CampoDeSeleccion`), «Cancelar» y «Corregir»                                                                              |
| 54  | Datos de las pruebas           | Las e2e no renombran, fusionan ni desactivan tipos del seed (CU-08 usa «Torniquetes» desde el PR 0): crean los suyos al resolver («Tipo e2e …», con un sufijo al azar) y los dejan desactivados. La corrección usa una novedad cerrada que crea la propia prueba                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |

### Versión 1.0 y cierre

| N.º | Decisión               | Recomendación                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| --- | ---------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 55  | Producción             | **Pages publica `main` al fusionar; la base y la función van antes que el código** (decisión 28 del Sprint 4). Las migraciones de cada PR de servidor (1, 2, 4, 5, 6 y 8) en «PROYECTO» **justo antes de fusionarlo**, con el OK y en el orden de los PR (así sus fechas quedan en orden y no hace falta `--include-all`); después, la función y sus secretos, Vault y la variable de Pages; al final, la etiqueta. **Lo aplica una persona** (el modo de permisos no se lo deja al agente); el agente prepara los comandos y comprueba con lecturas. Paso a paso en «Cierre del sprint y v1.0» |
| 56  | Documentación (RNF-17) | **La técnica, en el cierre** (`docs/S5-informe`): `docs/tecnica/` con instalación (desde el README), modelo de datos (las tablas, vistas y funciones, con enlace al SDD) y despliegue (la lista de producción de este plan, ya probada). **El manual de usuario, en la validación** (Objetivo 4): necesita las pantallas finales y lo que cambie en el piloto; hacerlo ahora sería escribirlo dos veces                                                                                                                                                                                         |

### Las que aparecieron al leer Figma y el código

| N.º | Pantalla o archivo   | Qué pasa                                                                                                                                            | Recomendación                                                                                                          |
| --- | -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| 57  | 21-D                 | El botón «Filtros (3)» usa `tune`, que no está en `iconos/` ni en la lista del encargo                                                              | Se pide con los otros siete («Antes de empezar»)                                                                       |
| 58  | `Insignia.jsx`       | El texto para el lector de pantalla dice siempre «solicitudes pendientes»                                                                           | Prop `texto` (decisión 33)                                                                                             |
| 59  | `DetalleNovedad.jsx` | `VOLVER` no tiene `/avisos`                                                                                                                         | «Volver a los avisos»                                                                                                  |
| 60  | 10 (escritorio)      | Solo está dibujada en el teléfono                                                                                                                   | Una columna centrada dentro del marco, como 05, 06 y 08 (punto 14)                                                     |
| 61  | 25                   | «En espera» es un chip ocre sin ícono que no es un estado                                                                                           | Un chip con el texto y el color de «escalada», sin ícono; «Aprobada» y «Rechazada», con el componente Estado           |
| 62  | 26                   | Las celdas en cero van vacías                                                                                                                       | Vacías a la vista; el lector de pantalla oye «0 novedades»                                                             |
| 63  | 23                   | La tarjeta «Novedades abiertas» dice «No cerradas: asignadas, en atención, escaladas, aprobadas y resueltas sin confirmar» y no nombra «registrada» | Se deja: «registrada» dura lo que la transacción del registro (decisión 21 la cuenta igual)                            |
| 64  | 31, 31-B, 31-C       | Los diálogos son de escritorio; 31 no está en el teléfono («Tipos de falla» es `soloEscritorio`)                                                    | En el teléfono se llega desde «Cuenta» (cambio 16), con los diálogos a todo el ancho                                   |
| 65  | Producción           | «PROYECTO» no tiene razones sociales ni fincas: no se pueden crear reportantes (ya lo dijo el Sprint 3)                                             | En «Lo que queda para las personas»: las siete razones sociales por SQL y las fincas desde 30, antes de cargar cuentas |

Los textos que Figma no trae (historial, panel y avisos sin conexión; el buscador; los errores del
CSV; «Anteriores» y la lista vacía de 10; la fila de Cuenta y 10-B para otros roles; desactivar y
corregir el tipo; el nombre de un tipo inactivo) se redactan con tuteo y se listan en
`docs/decisiones-pendientes.md` en el PR que los introduce.

## Cambios previstos al SDD y al SRS

Cada uno va a `docs/cambios-sdd.md` (la próxima entrada es la 24) en el PR que lo introduce, con su
texto propuesto.

| N.º | PR  | Sección                                 | Qué cambia                                                                                                                                                            |
| --- | --- | --------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 24  | 1   | SDD 5.3.2, Tabla 21                     | Precisión: tipos de retorno, `p_desde` y `p_hasta` como `date`, la forma del `jsonb` de cada `rpt_*`                                                                  |
| 25  | 1   | SDD 6.1.1 (vistas), Tabla 20 y Tabla 34 | Complemento: `v_novedad.resuelta_en`, una sola regla para «Tiempo hasta resolver»                                                                                     |
| 26  | 2   | SDD 5.3.2 (Tabla 20) y 6.1.4 (Tabla 31) | **Cambio:** sin `PATCH` de `notificacion`; `marcar_avisos_leidos` es `security definer` y es la única forma de marcar                                                 |
| 27  | 2   | SDD 6.1.6 (Tabla 33)                    | Precisión: el texto sale del estado y del rol; «reasignada» manda sobre Figma 10; grupos y contador de 10                                                             |
| 28  | 3   | SDD 5.2 y 5.2.5                         | Complemento: filtros en la dirección, el grupo «abiertas», fincas inactivas y tipos desactivados en los filtros, sin conexión y el buscador por código                |
| 29  | 4–5 | SDD 6.1.9 (Tabla 34), 5.2.6 y Tabla 22  | Precisión: período en días de Colombia, «por mes», «Datos al», quién agrupa, «abiertas con más tiempo», opciones del período; `FECHA_INVALIDA` también en las `rpt_*` |
| 30  | 6   | SDD 6.1.8 y Tabla 22                    | **Cambio:** `TIPO_FALLA_DUPLICADO`; bloqueos de la fusión, destino inactivo, `for share` al resolver, sin reactivar y la lista sin los fusionados                     |
| 31  | 6   | SDD 6.1.3 (Tabla 30) y 5.2.5            | Precisión: la observación de la corrección y cómo la muestra la línea de tiempo                                                                                       |
| 32  | 7   | SDD 5.3.8 y 7.3 (Tabla 39)              | **Cambio, por validar:** separador `;`; columnas, fechas, horas y nombre del archivo; fórmulas neutralizadas                                                          |
| 33  | 8   | SDD 6.1.6, 5.3.4, 5.3.5 y 4.2.10        | Precisión: webhook propio con `pg_net` y Vault, el contenido que envía, el encabezado secreto, `verify_jwt = false`, cifrado con Web Crypto y `TTL`                   |
| 34  | 9   | SDD 5.3.5 y 6.1.6                       | Precisión: dónde se ofrece 10-B, el control de Cuenta, el cierre de sesión y el contenido del push sin la descripción (RNF-18)                                        |
| 35  | 4   | SDD 5.2, Tabla 10                       | Cierra el temporal del cambio 14: el administrador entra a `/panel`                                                                                                   |

Además, dos ADR cortos (decisión 3): **0014** (gráficos sin librería) y **0015** (Web Push con Web
Crypto).

## Cierre del sprint y v1.0

En la rama `docs/S5-informe`: `docs/sprints/S5.md` con la estructura de `S4.md`;
`docs/sprints/S5-demo.md` con el guion de la review (el director abre la matriz y salta al historial
filtrado; exporta el CSV y lo abre; el ciclo de un aviso entre la finca y el área; un push en un
teléfono, si RF-31 entró; el administrador fusiona dos tipos y el panel lo refleja; corrige el tipo
de una cerrada); capturas finales; Lighthouse y peso (`cloudflare:web-perf`); la lista de atajos
(`ponytail-debt`); `README.md` en v1.0, con las variables y los secretos nuevos;
`docs/decisiones-pendientes.md` y `docs/cambios-sdd.md` al día; la documentación técnica
(decisión 56).

**Lista de producción de la v1.0** (la ejecuta una persona; después de cada paso, el agente
comprueba con lecturas):

| Paso | Cuándo                                | Lo hace una persona                                                                                                                                                                        | Comprobación del agente                                                    |
| ---- | ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------- |
| 1    | Antes de fusionar cada PR de servidor | `npx supabase db push --project-ref lyrdsmfalrchbdpmikmt --dry-run` (debe listar solo las de ese PR) y `npx supabase db push --project-ref lyrdsmfalrchbdpmikmt`                           | Otro simulacro («Remote database is up to date») y el asesor de «PROYECTO» |
| 2    | Antes de fusionar el PR 8             | `npx supabase functions deploy enviar-push --use-api --project-ref lyrdsmfalrchbdpmikmt`                                                                                                   | `functions list` de «PROYECTO»: activa y sin `verify_jwt`                  |
| 3    | Antes de fusionar el PR 8             | Generar las claves VAPID de «PROYECTO» y el secreto del webhook; ponerlos con `npx supabase secrets set --project-ref lyrdsmfalrchbdpmikmt --env-file <archivo local>` y borrar el archivo | `secrets list` (solo los nombres)                                          |
| 4    | Antes de fusionar el PR 8             | En el editor SQL de «PROYECTO»: `vault.create_secret` con la URL de la función y con el secreto (escritos ahí, no en un archivo del repositorio)                                           | La persona confirma con `select name from vault.secrets`                   |
| 5    | Antes de fusionar el PR 9             | `VITE_VAPID_PUBLIC_KEY` en Cloudflare Pages: Production (la de «PROYECTO») y Preview (la de «staging»)                                                                                     | El build de la vista previa del PR 9 la tiene                              |
| 6    | Después de la última fusión           | Ingresar en la aplicación publicada, abrir el panel, el historial y los avisos; activar el push en un teléfono                                                                             | —                                                                          |
| 7    | Con el OK del equipo                  | Etiqueta `v1.0.0` (y las que faltan: `v0.1.0-s1` a `v0.4.0-s4`)                                                                                                                            | `git ls-remote --tags`                                                     |

**Queda para las personas** (lo lista el informe con sus pasos): review y fusión de cada PR; los
pasos de producción; **cargar los datos reales** (las siete razones sociales por SQL en «PROYECTO»
y las doce fincas desde la pantalla 30; las cuentas reales desde 29), **después de aprobar la
política de #19** (RNF-18), porque son datos de personas; las pruebas en dispositivos reales (la
lista de chequeo del Sprint 4 y la del push, decisión 47); abrir una vista previa con un usuario de
prueba; el `mailto:` de VAPID; marcar el trabajo `e2e` como requerido en GitHub; un `supabase db
dump` de «PROYECTO» antes del piloto (plan de arranque); pasar a Figma las decisiones que se
aprueben (34 a 40 del Sprint 4 y las de este sprint); y las etiquetas.
