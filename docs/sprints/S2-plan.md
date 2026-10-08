# Sprint 2 · Plan de implementación

- **Fechas:** 19–23 oct 2026 (5 días). El equipo va adelantado: se puede empezar antes si lo aprueba.
- **Historias:** HU-09, HU-10, HU-11, HU-12, HU-14, HU-17 y HU-18 (RF-09, RF-10, RF-11, RF-12,
  RF-14, RF-17 y RF-18)
- **Estado:** aprobado el 8 oct 2026, con los puntos propuestos y con la recomendación de cada
  decisión del final. Lo que cambie en la review se ajusta en el PR que corresponda.

**Meta:** el área atiende y resuelve en primera instancia: la novedad registrada aparece en la
bandeja del área, el aprobador la toma, la rechaza, la reasigna o la escala, o registra la solución
con su tipo de falla, y cada paso queda en la línea de tiempo con su aviso.

**Incremento que se demuestra:** registrar → tomar → resolver con tipo de falla, todo visible en la
línea de tiempo. Además: rechazar, escalar (con aviso al director) y reasignar a la otra área.

## Punto de partida (verificado el 8 oct 2026, en `main`)

| Verificación                | Resultado                                                             |
| --------------------------- | --------------------------------------------------------------------- |
| `npm ci`                    | 457 paquetes, 0 vulnerabilidades                                      |
| `npm run lint`              | Sin advertencias                                                      |
| `npm run format:check`      | Correcto                                                              |
| `npm run test`              | 20 archivos, 235 pruebas: 234 pasan y 1 falla esperada (`it.fails`)   |
| `npm run build`             | Correcto. Ruta de ingreso: 148,6 + 6,2 + 26,8 + 2,2 ≈ 183,8 KB de 200 |
| `npm run staging:test`      | 5 archivos, 157 aserciones, 0 fallidas                                |
| `npm run test:e2e:chromium` | **Sin correr:** necesita la contraseña de los usuarios de prueba      |
| WebKit                      | Sin verificar (no abre en estos equipos; el CI no corre Playwright)   |

Las cifras coinciden con las del cierre del Sprint 1. No hay diferencias que reportar.

## Antes de empezar

| Necesidad                                                             | Para qué                                                                   | Quién     |
| --------------------------------------------------------------------- | -------------------------------------------------------------------------- | --------- |
| Aprobar este plan y responder las decisiones del final                | Sin eso no se escribe código del sprint                                    | El equipo |
| DoR: estimar las siete historias (hay una propuesta abajo)            | Sprint Planning                                                            | El equipo |
| CLI de GitHub (`gh`) con sesión                                       | **Resuelto el 8 oct:** instalado; el agente abre los PR con `gh pr create` | El equipo |
| Repetir `npm run test:e2e:chromium` (deben pasar las 40 del Sprint 1) | Empezar con las e2e en verde (`decisiones-pendientes.md`, punto 17)        | El equipo |
| Decir si el agente corre las e2e que ingresan o las corre el equipo   | Usan `CLAVE_USUARIOS_DE_PRUEBA`; el agente no lee `.env.local`             | El equipo |
| Revisar entre los dos lo que ya está en `main`                        | Los PR #2 a #6 se fusionaron sin review                                    | El equipo |
| Avisar antes de un `staging:reset`                                    | Solo se prevé uno, en el PR 8 (tipos de falla del seed)                    | El equipo |
| OK para empezar antes del 19 oct                                      | El calendario dice 19–23 oct                                               | El equipo |

## Skills del entorno

Están disponibles `supabase`, `supabase-postgres-best-practices`, `vitest`,
`vercel-react-best-practices`, `accessibility`, `web-design-guidelines`, `webapp-testing` (hay
Python 3.14), `cloudflare:web-perf`, `wrangler`, `chrome-browser`, `built-in-browser` y `docx`.

- **`figma-design-to-code`** no aparece en la lista de skills, pero el conector de Figma la entrega
  como recurso (`skill://figma/figma-design-to-code/SKILL.md`): se carga desde ahí antes de cada
  `get_design_context`.
- **`pdf-reading`** no está; existe `pdf`, que sirve para lo mismo (solo si `docs/fuentes/md/` no
  alcanza).
- **`code-review`** sí está en este entorno, aunque el plan de arranque la daba por faltante. Se
  puede usar en la revisión propia, además de la revisión en dos ejes.
- El conector de Cloudflare (MCP) está sin autorizar. No bloquea: el peso se mide con el build y,
  si hace falta consultar Pages, se usa `wrangler` por línea de comandos.

## Orden de los PR

```
PR 1 contratos ──────────────────────────┐
PR 2 bandeja (RF-09) ───────┐            │
PR 3 detalle (RF-18) ───────┴──► PR 4 tomar (RF-10) + base compartida ──► PR 5 rechazar (RF-11)
                                                                     ├──► PR 6 escalar (RF-12)
                                                                     ├──► PR 7 reasignar (RF-17)
                                                                     └──► PR 8 solución (RF-14)
```

- **Cada PR apunta a `main`.** Si depende de uno sin fusionar, sale de esa rama, va en borrador y
  dice «Depende de #N». Nadie fusiona sin la review del compañero; el agente no fusiona.
- Los PR 1, 2 y 3 no dependen entre sí en el servidor, pero el 2 y el 3 comparten la tarjeta de
  novedad y `fechas.js`. Si los hace una sola persona (o el agente), van en serie: 1 → 2 → 3.
- Las migraciones de los PR 4 a 8 van en orden (4 → 5 → 6 → 7 → 8): comparten «staging» y su
  historial de migraciones.
- **Review:** una persona revisa los PR 1, 4 y 8; la otra, los PR 2, 3, 5, 6 y 7.

| Día    | Servidor                                                 | Cliente                                                 |
| ------ | -------------------------------------------------------- | ------------------------------------------------------- |
| Lun 19 | PR 1: contratos · PR 4: auxiliares y `tomar_novedad`     | PR 2: bandeja (11, 11-C y 12)                           |
| Mar 20 | PR 5: `rechazar_novedad` · PR 6: `escalar_novedad`       | PR 3: detalle, línea de tiempo y mapa de acciones       |
| Mié 21 | PR 7: `reasignar_novedad` · PR 8: normalización de tipos | PR 4: `Hoja`, `AvisoTemporal`, tomar · hojas 16 y 15    |
| Jue 22 | PR 8: `registrar_solucion` y `sugerir_tipos_falla`       | Hoja 17 · pantalla 18 con el autocompletado             |
| Vie 23 | Revisión cruzada, asesor, peso y e2e                     | 18-B, 18-C, capturas e informe · review y retrospectiva |

Reparto sugerido: una persona el servidor y la otra el cliente, al revés que en el Sprint 1.

## Puntos propuestos (DoR)

| Historia  | Requerimiento              | Puntos | Por qué                                                                             |
| --------- | -------------------------- | ------ | ----------------------------------------------------------------------------------- |
| HU-09     | RF-09 · Bandeja del área   | 5      | Dos formatos (tarjetas y tabla con panel), tres pestañas con conteos y un filtro    |
| HU-18     | RF-18 · Detalle y línea    | 8      | Cuatro roles, dos formatos, línea de tiempo, mapa de acciones y 22-B                |
| HU-10     | RF-10 · Tomar novedad      | 8      | Lleva la base de las demás: contratos, auxiliares, `Hoja`, avisos y errores comunes |
| HU-11     | RF-11 · Rechazar           | 3      | Una función y una hoja sobre la base del PR 4                                       |
| HU-12     | RF-12 · Escalar            | 3      | Igual, con aviso a los directores                                                   |
| HU-17     | RF-17 · Reasignar          | 3      | Igual, con cambio de área y salida del alcance                                      |
| HU-14     | RF-14 · Registrar solución | 8      | Normalización, `resolver_tipo`, sugerencias, autocompletado y fecha en Colombia     |
| **Total** |                            | **38** |                                                                                     |

Aprobados el 8 oct 2026 y anotados en `docs/scrum/backlog.md` y `backlog.json`.

---

## PR 1 · `feat/RF-10-contratos-atencion`

Contrato primero, como en el Sprint 1: el cliente avanza sin esperar al servidor.

**Migración** `rf10_contratos_atencion`: las seis firmas de la Tabla 21, `security definer`,
`set search_path = ''`, cuerpo `raise exception 'NO_IMPLEMENTADO'`, `comment on function`,
`revoke execute … from public, anon` y `grant execute … to authenticated`.

| Función               | Firma                                                                                                                                    | Devuelve           |
| --------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- | ------------------ |
| `tomar_novedad`       | `(p_novedad_id uuid)`                                                                                                                    | `public.novedad`   |
| `rechazar_novedad`    | `(p_novedad_id uuid, p_motivo text)`                                                                                                     | `public.novedad`   |
| `reasignar_novedad`   | `(p_novedad_id uuid, p_area_destino_id uuid, p_motivo text)`                                                                             | `public.novedad`   |
| `escalar_novedad`     | `(p_novedad_id uuid, p_justificacion text)`                                                                                              | `public.novedad`   |
| `registrar_solucion`  | `(p_novedad_id uuid, p_solucion text, p_fecha_ejecucion date, p_tipo_falla_id uuid default null, p_tipo_falla_nombre text default null)` | `public.novedad`   |
| `sugerir_tipos_falla` | `(p_texto text)`, `stable`                                                                                                               | Tabla (decisión 8) |

`registrar_solucion` es una sola función con los dos parámetros opcionales, sin sobrecargas.

**Archivos**

| Ruta                                           | Contenido                                                                                    |
| ---------------------------------------------- | -------------------------------------------------------------------------------------------- |
| `supabase/tests/s2_contratos_test.sql`         | `has_function` con cada firma exacta; `authenticated` las ejecuta y `anon` no                |
| `src/core/supabase/repositorios/novedades.js`  | `tomarNovedad`, `rechazarNovedad`, `reasignarNovedad`, `escalarNovedad`, `registrarSolucion` |
| `src/core/supabase/repositorios/tiposFalla.js` | `sugerirTiposFalla` (archivo nuevo)                                                          |
| `src/core/supabase/database.types.ts`          | Regenerado, en el mismo commit                                                               |

Las aserciones de `s2_contratos_test.sql` no prueban `NO_IMPLEMENTADO`: deben seguir valiendo
cuando las funciones estén implementadas.

**Vitest:** cada envoltura llama a su función con los nombres de parámetros de la Tabla 21 y lanza
el error de Supabase (se simula el módulo del cliente, no la red).

**Asesor:** las seis funciones suman desde ya seis avisos
`authenticated_security_definer_function_executable`, iguales al de `registrar_novedad`. Son los
esperados; se documentan en `docs/decisiones-pendientes.md`, punto 16.

**`docs/cambios-sdd.md`:** precisión a la Tabla 21 (columnas de salida de `sugerir_tipos_falla` y
`registrar_solucion` como una sola función con dos parámetros opcionales).

---

## PR 2 · `feat/RF-09-bandeja-del-area` (cliente)

**Pantallas de Figma:** 11 (`3:295`), 11-C (`3:524`) y 12 (`3:587`).

**Archivos**

| Ruta                                          | Contenido                                                                                                  |
| --------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `src/modules/e3-atencion/Bandeja.jsx`         | Ruta `/bandeja` con `React.lazy`: resumen, pestañas, lista, 11-C y «Ver más» (páginas de 20)               |
| `src/modules/e3-atencion/TablaDeBandeja.jsx`  | Escritorio (12): tabla, filtro «Todas las fincas» y selección de fila                                      |
| `src/modules/e3-atencion/VistaPrevia.jsx`     | Panel lateral de 12: datos, justificación del escalamiento, decisión del director y «Ver detalle completo» |
| `src/core/ui/TarjetaNovedad.jsx`              | La tarjeta de Mis novedades, extraída, con la variante que muestra la finca y con enlace                   |
| `src/core/supabase/repositorios/novedades.js` | `listarBandeja`, `contarBandeja` y `listarUltimasTransiciones` (decisión 5)                                |
| `src/core/supabase/repositorios/catalogos.js` | `listarFincas` para el filtro del escritorio                                                               |
| `src/core/utils/fechas.js`                    | `formatearDuracion` («1 d 3 h», «35 min») y la fecha corta sin año («21 sep, 6:48 a. m.»)                  |
| `supabase/tests/rf09_bandeja_test.sql`        | El orden de `v_novedad` por prioridad y antigüedad (sin migración)                                         |

**Reglas**

- **Pestañas (SDD 6.1.11):** Por atender (`asignada`, `aprobada`), En atención (`en_atencion`) y En
  espera (`escalada`, `resuelta`). Los tres conteos y la primera página se piden en paralelo. En el
  teléfono los conteos van en las tres tarjetas de resumen de Figma; en el escritorio, en el nombre
  de la pestaña («Por atender (3)»).
- **Orden:** `prioridad` (el orden de declaración del tipo) y luego `fecha_registro` ascendente.
- **Consulta:** columnas explícitas de `v_novedad`, filtro por el área del perfil (el RLS ya lo
  impone; así usa `novedad_bandeja_idx`) y, en el escritorio, por finca. El filtro y la pestaña
  viven en la URL, como en Mis novedades.
- **Notas de estado:** «Aprobada por el director» sale del estado; «Reasignada desde {área}» sale de
  la última transición de la novedad (decisión 5).
- **Tiempo:** «hace 25 min» en el teléfono; fecha corta y duración en el escritorio.
- **11-C:** «No hay novedades pendientes en {área}», con el texto exacto de Figma.
- La tarjeta y la fila abren `/novedades/:id` (la ruta llega en el PR 3).

**Pruebas**

| Nivel  | Prueba                                                                                                                                                                                               | CU                   |
| ------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------- |
| pgTAP  | Con una de cada prioridad, `v_novedad` ordenada por `prioridad, fecha_registro` sale crítico → bajo                                                                                                  | CU-09 2              |
| Vitest | Estados y orden que pide cada pestaña; conteos; cambio de pestaña; filtro por finca                                                                                                                  | CU-09 2 y 3          |
| Vitest | 11-C con la lista vacía; aviso con «Reintentar» si la consulta falla                                                                                                                                 | CU-09 2b             |
| Vitest | `formatearDuracion` y la fecha corta, con temporizadores falsos                                                                                                                                      | CU-09 3              |
| Vitest | Las pruebas de Mis novedades del Sprint 1 siguen pasando con la tarjeta extraída                                                                                                                     | CU-18                |
| e2e    | `cu-09-consultar-bandeja.spec.js`: el reportante registra por la API una crítica y una baja para Mantenimiento; su aprobador ve las dos en Por atender, la crítica primero; el de Sistemas no las ve | CU-09 normal, RNF-11 |
| e2e    | 11-C con `page.route` devolviendo una lista vacía                                                                                                                                                    | CU-09 2b             |

**No cubre:** CU-09 2a (bandeja sin conexión, 11-B), que es del Sprint 4.

---

## PR 3 · `feat/RF-18-detalle-novedad` (cliente)

**Pantallas de Figma:** 13 (`3:764`), 14 (`3:965`), 22 (`4:2093`), 22-B (`4:2322`) y 09 (`2:1118`)
como referencia del reportante.

**Archivos**

| Ruta                                          | Contenido                                                                                                 |
| --------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| `src/modules/e4-consulta/DetalleNovedad.jsx`  | Ruta `/novedades/:id` con `React.lazy`: estructura de 13 y 14 en el teléfono y de 22 en el escritorio     |
| `src/modules/e4-consulta/SinPermiso.jsx`      | 22-B: «No puedes ver esta novedad» y volver al inicio del rol                                             |
| `src/core/ui/LineaDeTiempo.jsx`               | El «Riel» y la «Transición» de Figma; variantes en `/_dev/componentes`                                    |
| `src/core/acciones/accionesDisponibles.js`    | La Tabla 35 completa, como función pura de rol, estado y alcance                                          |
| `src/core/supabase/repositorios/novedades.js` | `obtenerNovedad(id)` (`v_novedad`, `maybeSingle()`) y `listarLineaDeTiempo(id)`, que se piden en paralelo |
| `src/app/Rutas.jsx`                           | `/novedades/:id` con el guardián de los cuatro roles; `/novedades` sigue siendo del reportante            |
| `src/core/utils/fechas.js`                    | «21 sep 2026, 6:48 a. m. (Sem 39)» y «23 sep 2026» para una fecha sin hora, sin tocar los que ya existen  |
| `MisNovedades.jsx`, `NovedadRecibida.jsx`     | Las tarjetas y «Ver novedad» ya abren el detalle                                                          |

**Reglas**

- **Encabezado y datos:** código, estado, prioridad, área y finca; «Registrada hace…» y «Tomada por
  {nombre}»; descripción con «Reportada por», «Registrada en finca» y «Sincronizada». En el
  escritorio, además, razón social y, si está resuelta o cerrada, «Tiempo hasta resolver», «Tipo de
  falla», «Fecha de ejecución» y «Solución aplicada».
- **Línea de tiempo:** de la más reciente a la más antigua. `registrada → asignada` se presenta como
  «Sistema» con «Área: {área}»; una reasignación muestra el área anterior y la nueva; la observación
  va en su recuadro. Al pie, en el escritorio: «El historial no se puede editar ni borrar.»
- **Nombres:** de `usuario_publico`. Nunca se pide `usuario.correo` (ADR 0010).
- **22-B:** si la consulta no devuelve filas (fuera del alcance, o un `id` que no existe o no es un
  uuid). No se consulta el servidor con un `id` que no tenga forma de uuid.
- **Acciones:** el mapa dice qué permite la Tabla 35; el detalle solo pinta las que ya tienen
  manejador (se agregan en los PR 4 a 8). Sin ninguna, no hay barra. El reportante no ve barra en
  este sprint.
- **Menú:** el ítem activo sigue siendo el de origen (Novedades o Bandeja).
- **`fecha_ejecucion` es una fecha sin hora:** se formatea desde su texto (`2026-09-23`), sin pasar
  por `new Date()`, que la correría un día en la hora de Colombia.

**Pruebas**

| Nivel  | Prueba                                                                                                        | CU           |
| ------ | ------------------------------------------------------------------------------------------------------------- | ------------ |
| Vitest | Mapa de acciones: tabla de los 8 estados × 4 roles, con y sin alcance                                         | CU-18 5      |
| Vitest | Línea de tiempo: orden, «Sistema», reasignación con las dos áreas, observación, usuario con su rol            | CU-18 4      |
| Vitest | Detalle: datos de una asignada; datos adicionales de una resuelta; «Tomada por»                               | CU-18 3      |
| Vitest | 22-B: sin filas, `id` inexistente e `id` que no es uuid                                                       | CU-18 2a     |
| Vitest | Formatos nuevos de `fechas.js`, incluida la fecha sin hora                                                    | CU-18 3      |
| e2e    | `cu-18-consultar-detalle.spec.js`: el reportante 01 abre su novedad desde Mis novedades y ve dos transiciones | CU-18 normal |
| e2e    | El reportante 03 con la misma URL ve 22-B; el aprobador de la otra área, también                              | CU-18 2a     |
| e2e    | El aprobador del área la ve; el director la ve sin acciones                                                   | CU-18 2 y 5  |

**No cubre:** CU-18 3a (detalle sin conexión, 14-B), que es del Sprint 4.

**Documentos:** `docs/decisiones-pendientes.md`, punto 13 («Ver novedad» y las tarjetas ya abren el
detalle) y el comentario del buscador en `Marco.jsx` (decisión 15).

---

## PR 4 · `feat/RF-10-tomar-novedad` (servidor y cliente, más la base de los PR 5 a 8)

**Pantallas de Figma:** 13 (`3:764`), 13-B (`3:854`) y 14-C (`3:1178`).

### Servidor

**Migración `rf10_transiciones_base`:** auxiliares en `private` para no repetir el algoritmo de SDD
6.1.3 en cada función. Todas con `set search_path = ''` y nombres calificados, sin
`security definer`, y con `revoke execute … from public, anon, authenticated`: solo las llaman las
funciones de transición, que corren como su propietario.

| Auxiliar (nombres propuestos)                                               | Qué hace                                                                                |
| --------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| `private.perfil_para_transicion(p_rol_id smallint)`                         | Perfil de `auth.uid()`; si no existe, está inactivo o no tiene ese rol → `SIN_PERMISO`  |
| `private.novedad_para_transicion(p_novedad_id, p_perfil)`                   | `select … for update`; si no existe o está fuera del alcance del perfil → `SIN_PERMISO` |
| `private.aprobadores_del_area(p_area_id)`                                   | Aprobadores activos del área                                                            |
| `private.usuarios_del_rol(p_rol_id)`                                        | Usuarios activos de un rol (directores, administradores)                                |
| `private.avisar(p_novedad_id, p_estado_nuevo, p_destinatarios, p_actor_id)` | Inserta un aviso por destinatario activo, sin repetir y sin quien actúa                 |

**Migración `rf10_tomar_novedad`:** `asignada → en_atencion`, solo un aprobador activo del área de
la novedad. Historial sin observación; aviso al reportante. `actualizado_en` lo mantiene el
disparador del Sprint 1.

**Orden de las verificaciones, igual en todas las transiciones:**

1. Perfil activo con el rol de la función → `SIN_PERMISO`.
2. Bloqueo de la fila y alcance → `SIN_PERMISO`.
3. Estado admitido → `TRANSICION_INVALIDA`.
4. Guardas de datos → `DATO_OBLIGATORIO`, `AREA_INVALIDA`, `FECHA_INVALIDA`, `TIPO_FALLA_INVALIDO`.
5. Actualización → historial → avisos. Cualquier excepción revierte todo.

El seudocódigo de SDD 6.1.3 pone el rol en la verificación que da `TRANSICION_INVALIDA`, pero la
Tabla 22 lo asigna a `SIN_PERMISO`. Se sigue la Tabla 22, como ya hace `registrar_novedad`, y se
anota en `docs/cambios-sdd.md` como precisión.

**pgTAP `rf10_tomar_novedad_test.sql`** (primero la prueba; debe fallar con `NO_IMPLEMENTADO`)

| Prueba                                                                                                             | CU               |
| ------------------------------------------------------------------------------------------------------------------ | ---------------- |
| Curso normal: estado `en_atencion`; una fila de historial `asignada → en_atencion` a nombre del aprobador          | CU-10 3–4, CU-16 |
| Un aviso, solo para el reportante, con `estado_nuevo = en_atencion`; `actualizado_en` cambia                       | CU-10 5          |
| Segundo intento → `TRANSICION_INVALIDA` (la concurrencia del plan de arranque)                                     | CU-10            |
| Aprobador de la otra área, reportante, director, administrador, inactivo, sin perfil e inexistente → `SIN_PERMISO` | RNF-11           |
| `anon` no la ejecuta; `authenticated` no ejecuta las auxiliares de `private`                                       | RNF-11           |
| Cada estado no admitido, incluidos los finales → `TRANSICION_INVALIDA`                                             | Tabla 29         |
| Si falla el historial, el estado no cambia (disparador en `pg_temp`, como en el Sprint 1)                          | CU-16 1a         |

### Cliente

| Ruta                                          | Contenido                                                                                         |
| --------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| `src/core/ui/Hoja.jsx`                        | Hoja inferior con `<dialog>` y `showModal()`: foco atrapado, Escape, fondo inerte, foco de vuelta |
| `src/core/ui/AvisoTemporal.jsx`               | Aviso que se quita solo (`role="status"`; `alert` si es un error) y admite una acción             |
| `src/pruebas/preparacion.js`                  | Simulación de `showModal` y `close`: jsdom 29 no los implementa (comprobado)                      |
| `src/modules/e3-atencion/useAccion.js`        | Ejecuta una acción y trata sus errores igual para los PR 4 a 8                                    |
| `src/modules/e3-atencion/BarraDeAcciones.jsx` | Las acciones del aprobador; se carga bajo demanda, solo para su rol                               |
| `DetalleNovedad.jsx`, `VistaPrevia.jsx`       | «Tomar para atención» en el detalle y en el panel de la bandeja del escritorio                    |

**Manejo común de los errores de una acción**

| Error                 | Qué ve la persona                                                                                                                      |
| --------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `TRANSICION_INVALIDA` | «La novedad cambió de estado» y el detalle se recarga                                                                                  |
| Red                   | El aviso de 14-C: «No se aplicó: se perdió la conexión. La novedad sigue {estado}.» con «Reintentar». Sin cola ni reintento automático |
| `SIN_PERMISO`         | Su mensaje de la Tabla 22                                                                                                              |
| Sesión vencida        | El flujo que ya existe                                                                                                                 |

**Pruebas**

| Nivel  | Prueba                                                                                                                                                                                                         | CU           |
| ------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------ |
| Vitest | `Hoja`: abre con el foco dentro, cierra con Escape y con «Cancelar», devuelve el foco                                                                                                                          | —            |
| Vitest | `AvisoTemporal`: rol, acción y desaparición con temporizadores falsos                                                                                                                                          | —            |
| Vitest | `useAccion`: éxito, `TRANSICION_INVALIDA` (recarga), red (14-C y reintento), `SIN_PERMISO`                                                                                                                     | CU-10 2a     |
| Vitest | Tomar: aviso de 13-B («Novedad tomada. Ya está En atención.») y acciones de 14                                                                                                                                 | CU-10        |
| e2e    | `cu-10-tomar-novedad.spec.js`: el aprobador abre la novedad desde la bandeja y la toma; la línea de tiempo muestra la transición y «Tomada por»; el reportante tiene su aviso (leído por la API con su sesión) | CU-10 normal |
| e2e    | Concurrencia: dos páginas del mismo aprobador; la segunda recibe «La novedad cambió de estado» y se recarga                                                                                                    | CU-10        |

**No cubre:** la restricción preventiva sin conexión (CU-25, 14-B), que es del Sprint 4. En este
sprint el curso 2a queda cubierto solo por la respuesta al error de red (14-C).

---

## PR 5 · `feat/RF-11-rechazar-novedad`

**Pantalla de Figma:** 16 (`3:1387`).

**Migración `rf11_rechazar_novedad`:** `asignada` o `en_atencion` → `rechazada` (final). Motivo con
`btrim` no vacío, o `DATO_OBLIGATORIO`. Historial con el motivo como observación; aviso al
reportante.

**Cliente:** `src/modules/e3-atencion/HojaRechazar.jsx`. Motivos frecuentes como accesos rápidos, en
una constante con los textos de Figma («Duplicada», «Es una solicitud de insumos», «No corresponde a
Mantenimiento ni a Sistemas»); la advertencia «La novedad se cerrará como Rechazada y la finca verá
el motivo. Esta acción no se puede deshacer.»; contador; «Rechazar novedad» deshabilitado con el
motivo vacío, con la explicación en texto. El campo de texto con contador del formulario 05 se
reutiliza (si es local a esa pantalla, se extrae a `src/core/ui/`).

**Pruebas**

| Nivel  | Prueba                                                                                                                       | CU           |
| ------ | ---------------------------------------------------------------------------------------------------------------------------- | ------------ |
| pgTAP  | Desde `asignada` y desde `en_atencion`: estado `rechazada`, historial con el motivo, aviso solo al reportante                | CU-11 4–6    |
| pgTAP  | Motivo vacío, nulo o de solo espacios → `DATO_OBLIGATORIO`; el motivo se guarda recortado                                    | CU-11 3a     |
| pgTAP  | Estados no admitidos (incluida `rechazada`) → `TRANSICION_INVALIDA`; alcance y roles → `SIN_PERMISO`; `anon` no ejecuta      | Tabla 29     |
| pgTAP  | Si falla el historial, no cambia el estado                                                                                   | CU-16 1a     |
| Vitest | El botón se habilita al escribir; un acceso rápido llena el motivo; contador y máximo                                        | CU-11 3a     |
| e2e    | `cu-11-rechazar-novedad.spec.js`: rechazar con motivo; el reportante la ve en Rechazadas con el motivo en la línea de tiempo | CU-11 normal |
| e2e    | Con el motivo vacío no se puede confirmar                                                                                    | CU-11 3a     |

---

## PR 6 · `feat/RF-12-escalar-novedad`

**Pantalla de Figma:** 15 (`3:1281`).

**Migración `rf12_escalar_novedad`:** `en_atencion` → `escalada`. Justificación obligatoria.
Historial con la justificación; avisos a los directores activos y al reportante.

**Cliente:** `src/modules/e3-atencion/HojaEscalar.jsx`, con el texto de ayuda de Figma, el resumen
de la novedad, «Obligatoria para escalar», el contador y «Se avisará al director de agricultura y a
la finca.» «Escalar novedad» queda deshabilitado sin justificación. La novedad pasa a «En espera».

**Pruebas**

| Nivel  | Prueba                                                                                                                                                       | CU           |
| ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------ |
| pgTAP  | Curso normal: estado `escalada`, historial con la justificación, avisos a los directores activos y al reportante (no al director inactivo ni a quien escala) | CU-12 4–6    |
| pgTAP  | Justificación vacía → `DATO_OBLIGATORIO`                                                                                                                     | CU-12 3a     |
| pgTAP  | Desde `asignada` no se puede escalar; los demás estados tampoco → `TRANSICION_INVALIDA`                                                                      | Tabla 29     |
| pgTAP  | Alcance y roles → `SIN_PERMISO`; `anon` no ejecuta; reversión si falla el historial                                                                          | RNF-11       |
| Vitest | El botón se habilita al escribir; después de escalar el detalle queda sin acciones                                                                           | CU-12 3a     |
| e2e    | `cu-12-escalar-novedad.spec.js`: tomar → escalar; la novedad queda en «En espera»; el director tiene su aviso (leído por la API con su sesión)               | CU-12 normal |
| e2e    | Sin justificación no se puede confirmar                                                                                                                      | CU-12 3a     |

---

## PR 7 · `feat/RF-17-reasignar-novedad`

**Pantalla de Figma:** 17 (`3:1499`).

**Migración `rf17_reasignar_novedad`:** `asignada` o `en_atencion` → `asignada` en el área de
destino. Motivo obligatorio. `AREA_INVALIDA` si el destino es el área actual, está inactiva o no
existe. Historial con `area_anterior_id`, `area_nueva_id` y el motivo. Avisos a los aprobadores
activos del área nueva y al reportante.

**Cliente:** `src/modules/e3-atencion/HojaReasignar.jsx`. «Área actual» y «Destino» con las áreas
activas del catálogo (`listarAreas`), sin la actual; con dos áreas, el destino queda elegido.
Después de reasignar, la novedad sale del alcance del aprobador: no se recarga el detalle (daría
22-B); se vuelve a la bandeja con un aviso temporal.

**Pruebas**

| Nivel  | Prueba                                                                                                                                                                                                              | CU           |
| ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------ |
| pgTAP  | Desde `asignada` y desde `en_atencion`: queda `asignada` en el área nueva; historial con las dos áreas y el motivo                                                                                                  | CU-17 4–5    |
| pgTAP  | Avisos a los aprobadores activos del área nueva y al reportante, y a nadie más                                                                                                                                      | CU-17 6      |
| pgTAP  | Motivo vacío → `DATO_OBLIGATORIO`; destino igual al actual, inactivo o inexistente → `AREA_INVALIDA`                                                                                                                | CU-17 3a     |
| pgTAP  | Después de reasignar, el aprobador original ya no la ve ni puede actuar sobre ella (`SIN_PERMISO`)                                                                                                                  | RNF-11       |
| pgTAP  | Estados no admitidos → `TRANSICION_INVALIDA`; roles → `SIN_PERMISO`; `anon`; reversión                                                                                                                              | Tabla 29     |
| Vitest | El destino no incluye el área actual; botón deshabilitado sin motivo; vuelve a la bandeja                                                                                                                           | CU-17 3a     |
| e2e    | `cu-17-reasignar-novedad.spec.js`: Mantenimiento la reasigna a Sistemas; el aprobador de Sistemas la ve en Por atender con «Reasignada desde Mantenimiento»; la URL del detalle ya da 22-B para el de Mantenimiento | CU-17 normal |

---

## PR 8 · `feat/RF-14-registrar-solucion`

**Pantallas de Figma:** 18 (`3:1619`), 18-B (`3:1685`) y 18-C (`3:1754`).

### Servidor

**Migración `rf14_normalizar_tipo_falla`:** `private.normalizar_tipo_falla(text)`, `immutable` y con
`set search_path = ''`. `unaccent()` no es `IMMUTABLE`: se llama la versión con diccionario
explícito, `extensions.unaccent('extensions.unaccent'::regdictionary, …)`, y después minúsculas,
`btrim` y espacios simples.

**Migración `rf14_registrar_solucion`**

- `en_atencion` o `aprobada` → `resuelta`; aprobador activo del área.
- Solución con `btrim` no vacía y fecha de ejecución no nula; si no, `DATO_OBLIGATORIO`.
- Fecha posterior a hoy → `FECHA_INVALIDA`, con **hoy en Colombia**:
  `(now() at time zone 'America/Bogota')::date`, no `current_date`. El servidor está en UTC y
  después de las 7 p. m. de Colombia ya es mañana.
- Tipo de falla con `private.resolver_tipo_falla` (SDD 6.1.8): si viene `p_tipo_falla_id`, gana y
  debe existir y estar activo (`TIPO_FALLA_INVALIDO`). Si viene solo el nombre, se normaliza:
  activo → se usa; fusionado → el destino de la última fusión; desactivado → `TIPO_FALLA_INVALIDO`;
  nuevo → se crea con `creado_por` = quien actúa. Sin ninguno de los dos, o con el nombre en
  blanco → `DATO_OBLIGATORIO`. Si otro aprobador crea el mismo nombre al tiempo, se captura
  `unique_violation` y se vuelve a leer.
- Estado, `solucion`, `fecha_ejecucion` y `tipo_falla_id` se actualizan juntos (lo exige el `CHECK`
  `novedad_resuelta_completa`). Historial sin observación. Avisos al reportante y, si se creó un
  tipo, a los administradores activos.
- `sugerir_tipos_falla`: solo aprobador o administrador (`SIN_PERMISO`). Tipos activos cuyo nombre
  normalizado contiene el texto normalizado (`strpos`, no `like`: el texto puede traer `%` o `_`);
  primero la coincidencia exacta, luego por cantidad de novedades, máximo 8.

**Seed:** tres o cuatro tipos de falla de prueba (por ejemplo, «Biométrico»), creados por el
administrador de prueba, para que el autocompletado tenga datos. **Necesita un `staging:reset`: se
pregunta antes.**

**pgTAP `rf14_registrar_solucion_test.sql`**

| Prueba                                                                                                                                         | CU               |
| ---------------------------------------------------------------------------------------------------------------------------------------------- | ---------------- |
| Curso normal desde `en_atencion` y desde `aprobada`: `resuelta` con solución, fecha y tipo; historial sin observación                          | CU-14 6–7        |
| «Biométrico», «biometrico» y « BIOMÉTRICO » dan el mismo tipo                                                                                  | CU-14 5a         |
| Tipo nuevo: se crea con `creado_por` y avisa a los administradores activos; con un tipo existente no avisa                                     | CU-14 8          |
| Tipo fusionado → el destino; tipo desactivado → `TIPO_FALLA_INVALIDO`; `p_tipo_falla_id` inexistente o inactivo → `TIPO_FALLA_INVALIDO`        | SDD 6.1.8        |
| Fecha de hoy en Colombia pasa; la de mañana → `FECHA_INVALIDA`                                                                                 | CU-14 6a         |
| Solución vacía, fecha nula, o sin tipo ni nombre → `DATO_OBLIGATORIO`                                                                          | CU-14 6a         |
| Estados no admitidos (`asignada`, `escalada`, `resuelta`, finales) → `TRANSICION_INVALIDA`                                                     | Tabla 29         |
| Alcance y roles → `SIN_PERMISO`; `anon` no ejecuta; reversión si falla el historial (no queda el tipo nuevo)                                   | RNF-11, CU-16 1a |
| `sugerir_tipos_falla`: exacta primero, luego por cantidad, máximo 8, sin inactivos; `%` y `_` son texto; reportante y director → `SIN_PERMISO` | CU-14 4          |

### Cliente

| Ruta                                            | Contenido                                                                              |
| ----------------------------------------------- | -------------------------------------------------------------------------------------- |
| `src/modules/e3-atencion/RegistrarSolucion.jsx` | Pantalla 18 en `/novedades/:id/solucion`, con el marco enfocado, como `/registrar`     |
| `src/modules/e3-atencion/CampoTipoFalla.jsx`    | Autocompletado con el patrón _combobox_, espera breve entre teclas y cantidad por tipo |
| `src/core/utils/fechas.js`                      | `hoyEnColombia()`, probada a las 11 p. m. de Bogotá                                    |
| `src/app/Rutas.jsx`                             | La ruta nueva, con el guardián del aprobador                                           |

- «¿Qué se hizo?», «Fecha de ejecución» (por defecto hoy en Colombia, con `max` de hoy en Colombia)
  y «Tipo de falla». «Coincide» y «Crear tipo nuevo «…»» deshabilitado cuando existe la coincidencia
  exacta, con el aviso de Figma («Ya existe «Biométrico». Solo cambia en mayúsculas o tildes, así
  que se usará el tipo existente.»). Botón «Marcar como resuelta».
- **18-B:** la validación del cliente y el código `FECHA_INVALIDA` del servidor llevan al mismo
  estado.
- **18-C:** el recuadro «Aprobada por el director de agricultura» con su observación, leída de la
  última transición `escalada → aprobada`.

**Pruebas**

| Nivel  | Prueba                                                                                                                                                                           | CU           |
| ------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------ |
| Vitest | Autocompletado: teclado (flechas, Enter, Escape), `aria-expanded` y `aria-activedescendant`, espera entre teclas                                                                 | CU-14 3–4    |
| Vitest | Coincidencia exacta: «Coincide», «Crear tipo nuevo» deshabilitado y el aviso                                                                                                     | CU-14 5a     |
| Vitest | Envío con `p_tipo_falla_id` al elegir uno existente y con `p_tipo_falla_nombre` al crear                                                                                         | CU-14 5      |
| Vitest | 18-B por el cliente y por `FECHA_INVALIDA`; campos vacíos señalados; `hoyEnColombia` a las 11 p. m.                                                                              | CU-14 6a     |
| Vitest | 18-C: el recuadro de la aprobación con la observación del director                                                                                                               | CU-14        |
| e2e    | `cu-14-registrar-solucion.spec.js`: tomar → registrar la solución con un tipo nuevo de nombre único → `resuelta`; el reportante la ve en «Por confirmar» y en la línea de tiempo | CU-14 normal |
| e2e    | 18-B con la fecha de mañana                                                                                                                                                      | CU-14 6a     |

**No cubre con e2e:** 18-C, porque en el Sprint 2 no hay forma de crear una novedad `aprobada` desde
la aplicación. Queda con Vitest y pgTAP, y la e2e se escribe en el Sprint 3.

---

## Cobertura de los cursos de cada caso de uso

| CU    | Curso normal | Alternos cubiertos   | Alternos que quedan para otro sprint            |
| ----- | ------------ | -------------------- | ----------------------------------------------- |
| CU-09 | Sí           | 2b                   | 2a (sin conexión): Sprint 4                     |
| CU-10 | Sí           | —                    | 2a (CU-25): Sprint 4; aquí solo el error de red |
| CU-11 | Sí           | 3a                   | 1a (CU-25): Sprint 4                            |
| CU-12 | Sí           | 3a                   | 1a (CU-25): Sprint 4                            |
| CU-14 | Sí           | 5a, 6a               | 1a (CU-25): Sprint 4                            |
| CU-16 | Sí           | 1a (en cada función) | —                                               |
| CU-17 | Sí           | 3a                   | 1a (CU-25): Sprint 4                            |
| CU-18 | Sí           | 2a                   | 3a (sin conexión): Sprint 4                     |

## En cada PR

- **Prueba primero:** la prueba pgTAP se corre contra el contrato y debe fallar con
  `NO_IMPLEMENTADO`; después se implementa caso por caso. Igual con Vitest. Se anota en el PR.
- **Después de cada migración:** `npm run staging:push`, `staging:test`, `staging:types` (el archivo
  de tipos va en el mismo commit) y `staging:advisors`, resumido en el PR.
- **Antes del PR:** lint, formato, unitarias, build, capturas a 360 × 800 y 1280 × 800 en
  `docs/sprints/evidencias/S2/`, peso de la ruta de ingreso y revisión propia en dos ejes
  (estándares del repositorio; fidelidad al RF y al CU), con `accessibility` y
  `web-design-guidelines` en los que tienen interfaz.
- **e2e que ingresan:** el agente las deja escritas y las corre solo si se le autoriza en ese
  momento. Crean sus precondiciones por la API con la sesión de cada rol, nunca con una clave
  privilegiada, y usan descripciones únicas: «staging» acumula novedades de otras corridas.
- **Capturas:** con datos de prueba y el servidor simulado, como en el Sprint 1.

## Fuera del alcance del Sprint 2

Bandeja y detalle sin conexión (11-B, 04-B, 14-B) y evidencias fotográficas: Sprint 4 · decisión del
director, confirmar cierre y «la falla persiste»: Sprint 3 · pantalla de avisos, contador de la
campana y push: Sprint 5 (las funciones de este sprint sí insertan en `notificacion`) · corregir el
tipo de una cerrada, depurar el catálogo, historial con filtros y buscador por código: Sprint 5 ·
e2e en el CI y WebKit: solo si el equipo lo pide.

## Riesgos del sprint

| Riesgo                                                        | Señal                                            | Respuesta                                                                                               |
| ------------------------------------------------------------- | ------------------------------------------------ | ------------------------------------------------------------------------------------------------------- |
| La ruta de ingreso supera los 200 KB                          | Quedan unos 16 KB y el CSS es un solo archivo    | Medir en cada PR con pantallas; detenerse y avisar si se pasa                                           |
| Siete historias en cinco días                                 | El miércoles no está el PR 4                     | Recortar primero el filtro por finca y el panel de 12, luego RF-17 (prioridad media); nunca las pruebas |
| Los PR 5 a 8 dependen del 4                                   | El PR 4 se demora en la review                   | Revisarlo primero; los PR siguientes van en borrador sobre su rama                                      |
| Una migración ya aplicada en «staging» cambia en la review    | Comentario sobre el SQL de un PR abierto         | Migración correctiva; un `staging:reset` solo con aviso                                                 |
| El agente no puede abrir los PR ni correr las e2e             | No hay `gh`; las e2e necesitan la contraseña     | Instalar `gh` o abrir el PR con el enlace; el equipo corre las e2e o las autoriza                       |
| PostgREST no une `historial_transicion` con `usuario_publico` | Error al pedir los nombres de la línea de tiempo | Dos consultas en paralelo (historial y usuarios), sin objetos nuevos en la base                         |
| El autocompletado no queda accesible                          | Revisión con `accessibility`                     | Patrón _combobox_ de la guía ARIA, con pruebas de teclado                                               |
| WebKit sigue sin verificar                                    | RNF-04 pide Safari                               | Solo API estándar (`<dialog>` existe desde Safari 15.4); e2e en el CI si el equipo lo pide              |
| `unaccent` también convierte la ñ en n                        | «Año» y «Ano» serían el mismo tipo               | Es lo que pide SDD 6.1.8; se deja anotado                                                               |

## Decisiones para el equipo

Cada una trae una recomendación. **Aprobadas el 8 oct 2026 con la recomendación de cada una.**

### Las que pedía el plan de arranque

| N.º | Decisión                                          | Recomendación                                                                                                                                                                                                                                 |
| --- | ------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Bloque «Evidencias» de 13, 14 y 22                | Ocultarlo hasta el Sprint 4, igual que el ícono de cámara de la bandeja                                                                                                                                                                       |
| 2   | Variantes sin conexión                            | 11-B y 14-B quedan para el Sprint 4; el aviso de 14-C se usa ya como respuesta al error de red de cualquier acción                                                                                                                            |
| 3   | Etiqueta «Registrada sin conexión» de 22 (RNF-09) | Dejarla para el Sprint 4. El modelo no guarda ese dato, y derivarlo de la diferencia entre las dos fechas marcaría como «sin conexión» un envío que solo fue lento                                                                            |
| 4   | Acciones y hojas en el escritorio                 | Botones bajo el encabezado del detalle y las hojas como diálogo centrado con el mismo contenido. El panel de 12 lleva además la acción principal, como dibuja Figma («Tomar para atención» en el PR 4, «Registrar solución» en el PR 8)       |
| 5   | Última transición en la bandeja                   | Consultar `historial_transicion` desde el cliente para los `id` de la página (máximo 20), sin objetos nuevos en la base. «Aprobada por el director» sale del estado                                                                           |
| 6   | `sugerir_tipos_falla` y su conteo                 | `security definer` con verificación de rol, para que la cantidad sea la de todo el sistema. Con `security invoker` contaría solo el área del aprobador                                                                                        |
| 7   | Límite de motivo, justificación y solución        | 500 caracteres (`OBSERVACION_MAX_CARACTERES`), validados en el cliente y en la función con `DATO_OBLIGATORIO`, sin `CHECK` nuevo. Ojo: Figma dibuja «/500» en 15, 16 y 17, pero no en «¿Qué se hizo?» de 18; se propone mostrarlo ahí también |
| 8   | Columnas de salida de `sugerir_tipos_falla`       | `id uuid, nombre text, cantidad_novedades integer, coincidencia_exacta boolean`                                                                                                                                                               |
| 9   | Adónde va la persona después de una acción        | Una sola regla: si la novedad sigue en su alcance (tomar, rechazar, escalar, solución), se queda en el detalle recargado con un aviso temporal, como 13-B; si sale de su alcance (reasignar), vuelve a la bandeja con el aviso                |

### Las que aparecieron al leer Figma y el código

| N.º | Decisión                                           | Recomendación                                                                                                                                                                                     |
| --- | -------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 10  | Menú «⋮» del encabezado (13, 13-B, 16 y 17)        | No pintarlo: Figma no dibuja su contenido y 14 no lo tiene                                                                                                                                        |
| 11  | Barra de acciones de «En atención»                 | La de 14 (Registrar solución · Escalar al director · Reasignar y Rechazar). 13-B dibuja el mismo estado con tres botones en fila («Escalar», «Reasignar», «Rechazar»)                             |
| 12  | Usuario en la línea de tiempo                      | «Nombre · Rol · Área» en los dos formatos, como 22 y como pide SDD 5.2.5. El teléfono (13 y 14) dibuja «Nombre · Área» para el aprobador                                                          |
| 13  | «Sincronizada» en el teléfono                      | Mostrarla siempre (RNF-09). 13 la dibuja y 14 no                                                                                                                                                  |
| 14  | Insignia con la cantidad en «Bandeja» (menú de 12) | Dejarla para el Sprint 5, con el contador de la campana: comparten el momento en que se actualizan                                                                                                |
| 15  | Buscador por código                                | Sprint 5, como dice el alcance. El comentario de `Marco.jsx` lo anunciaba para este sprint; se corrige en el PR 3                                                                                 |
| 16  | Campo «Fecha de ejecución»                         | `<input type="date">` nativo con `max`: accesible y con el selector del teléfono. Figma lo dibuja como «24 sep 2026»; el nativo usa el formato del navegador                                      |
| 17  | 22-B sin saber el código                           | Figma pone el código en el encabezado, pero sin filas la aplicación no lo conoce (la URL lleva el `id`): el encabezado dirá «Novedad». Los textos por rol van a la lista de textos fuera de Figma |
| 18  | A quién llega el aviso «al reportante»             | A quien registró la novedad (`reportante_id`), si está activo. No a los demás reportantes de la finca                                                                                             |
| 19  | «Tomada por»                                       | La última transición `asignada → en_atencion`, para que en el Sprint 3 «la falla persiste» no muestre al reportante. Solo la hora si fue hoy; si no, «24 sep, 7:15 a. m.»                         |
| 20  | Formato de las duraciones                          | Las dos unidades mayores, sin redondear hacia arriba: «35 min», «5 h 20 min», «1 d 3 h»                                                                                                           |
| 21  | Cadena de fusiones en `resolver_tipo`              | Si el destino de la fusión tampoco está activo, se sigue la cadena; si termina en uno desactivado, `TIPO_FALLA_INVALIDO`. SDD 6.1.8 solo habla del destino de la última                           |

Los textos que Figma no trae (avisos temporales de rechazar, escalar, reasignar y solución; 22-B
para el aprobador; explicación de los botones deshabilitados) se redactan con tuteo y se listan en
`docs/decisiones-pendientes.md`, punto 10, en el PR que los introduce.

## Cambios previstos al SDD

Cada uno va a `docs/cambios-sdd.md` en el PR que lo introduce, con su texto propuesto.

| PR  | Sección             | Qué cambia                                                                                       |
| --- | ------------------- | ------------------------------------------------------------------------------------------------ |
| 1   | SDD 5.3.2, Tabla 21 | Precisión: columnas de `sugerir_tipos_falla`; `registrar_solucion` con dos parámetros opcionales |
| 4   | SDD 6.1.3           | Precisión: el rol que no corresponde responde `SIN_PERMISO` (Tabla 22), no `TRANSICION_INVALIDA` |
| 4   | SDD 6.1.3           | Complemento: auxiliares de las transiciones en `private`, sin acceso para `authenticated`        |
| 5   | SDD 5.3.2, Tabla 22 | Complemento: máximo de 500 caracteres en motivo, justificación y solución (si se aprueba la 7)   |
| 8   | SDD 6.1.8           | Precisión: «hoy» es la fecha de Colombia; cadena de fusiones (si se aprueba la 21)               |
| 8   | SDD 5.3.2, Tabla 21 | Precisión: `sugerir_tipos_falla` es `security definer` (si se aprueba la 6)                      |

## Cierre del sprint

En la rama `docs/S2-informe`: `docs/sprints/S2.md` con la estructura de `S1.md`; capturas de 11,
11-C, 12, 13, 13-B, 14, 14-C, 15, 16, 17, 18, 18-B, 18-C, 22 y 22-B; peso de la ruta de ingreso,
asesor de «staging» y cobertura de cursos; `README.md`, `docs/decisiones-pendientes.md` y
`docs/cambios-sdd.md` al día; guion de la demo. Queda para las personas: review y merge de cada PR,
correr las e2e que ingresan, ingresar en una vista previa, aplicar las migraciones en «PROYECTO» con
el OK del equipo y la etiqueta `v0.2.0-s2`.
