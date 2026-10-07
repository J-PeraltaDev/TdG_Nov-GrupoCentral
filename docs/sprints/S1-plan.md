# Sprint 1 · Plan de implementación

- **Fechas:** 13–16 oct 2026 (4 días; el lunes 12 es festivo)
- **Historias:** HU-01, HU-05, HU-06, HU-07 y HU-16 (RF-01, RF-05, RF-06, RF-07 y RF-16)
- **Estado:** propuesta. No se empieza hasta tener el OK del equipo y el Sprint 0 en `main`.

**Meta:** el reportante ingresa, registra una novedad, recibe la constancia NOV-#### y la novedad
queda «asignada» al área elegida, con su historial y los avisos a los aprobadores. La app es
instalable.

**Incremento que se demuestra:** ingreso por rol; registro con el código NOV-0001 asignado al
área; app instalable.

## Antes de empezar

| Necesidad                                                                  | Para qué                                                         | Quién                       |
| -------------------------------------------------------------------------- | ---------------------------------------------------------------- | --------------------------- |
| Docker Desktop **o** el OK para crear «staging»                            | Aplicar migraciones y correr pgTAP: sin esto no hay PR 1 ni PR 2 | El equipo                   |
| Correr `npm run db:reset && npm run test:db` con la migración del Sprint 0 | Confirmar que lo ya escrito funciona                             | El agente, apenas haya base |
| `npx playwright install chromium webkit`                                   | Pruebas e2e y capturas                                           | El equipo autoriza          |
| Aprobar `idb` y `fake-indexeddb`                                           | Ya están en el stack; se instalan en el PR 3                     | —                           |
| Sprint 0 en `main` y proyecto de Pages creado                              | Vistas previas para la review                                    | El equipo                   |
| DoR: estimar las cinco historias                                           | Sprint Planning del 13 oct                                       | El equipo                   |

## Orden de los PR

```
PR 1  feat/RF-16-esquema-nucleo ──► PR 2  feat/RF-05-registrar-novedad ──┐
        │ (publica el contrato y los tipos)                              ├─► PR 4  feat/RF-05-pantallas-registro
        └──────────────────────────► PR 3  feat/RF-01-iniciar-sesion ────┘
```

El PR 1 publica la firma de `registrar_novedad` y regenera los tipos, así el PR 3 (cliente) avanza
en paralelo con el PR 2 (servidor). Reparto sugerido: una persona el servidor (PR 1 y 2) y la otra
el cliente (PR 3 y 4).

| Día    | Servidor                                          | Cliente                                                          |
| ------ | ------------------------------------------------- | ---------------------------------------------------------------- |
| Mar 13 | PR 1: esquema, RLS, disparadores, catálogos, seed | PR 3: núcleo (`errores`, `utils`, `offline`) con pruebas primero |
| Mié 14 | PR 2: `registrar_novedad`, caso por caso          | PR 3: sesión, guardián, layouts y pantalla 01                    |
| Jue 15 | PR 2: errores, asesor; apoyo a e2e                | PR 3: prueba de sesión sin conexión · PR 4: pantallas 05 y 06    |
| Vie 16 | Revisión cruzada, Lighthouse y medición de peso   | PR 4: pantallas 04 y 04-C, e2e · review y retro                  |

---

## PR 1 · `feat/RF-16-esquema-nucleo`

**Migraciones** (cada archivo se crea con `supabase migration new`)

| Nombre                            | Contenido                                                                                                                                                                                                                                                                          |
| --------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `rf16_esquema_nucleo`             | Las 13 tablas de la Tabla 26 con sus restricciones; secuencia de `novedad.codigo`; índices de la Tabla 27 y los de claves foráneas que pida el asesor; `revoke all … from anon, authenticated` en cada tabla                                                                       |
| `rf16_control_de_acceso`          | `private.fn_rol`, `fn_finca`, `fn_area`, `fn_activo` y `puede_ver_novedad`; RLS habilitado en las 13 tablas; políticas de la Tabla 31; privilegios por columna de `usuario` y de `notificacion`; vistas `v_novedad` y `usuario_publico` con `security_invoker`; `GRANT` explícitos |
| `rf16_disparadores`               | Inmutabilidad de `historial_transicion` (`BEFORE UPDATE OR DELETE` por fila y `BEFORE TRUNCATE` por sentencia) y `actualizado_en` en `novedad`                                                                                                                                     |
| `rf16_catalogos_fijos`            | `rol` (los 4) y `area` (mantenimiento y sistemas): van en migración porque producción también los necesita                                                                                                                                                                         |
| `rf05_contrato_registrar_novedad` | La firma de `registrar_novedad` con sus permisos; por ahora lanza `NO_IMPLEMENTADO`                                                                                                                                                                                                |

**Puntos que se deben cuidar**

- `usuario`: `id` referencia `auth.users.id`; correo único; un `CHECK` por rol (reportante con
  finca y sin área; aprobador con área y sin finca; director y administrador sin ninguna).
- `novedad`: `codigo` y `id_local` únicos; tres fechas `timestamptz`; `CHECK` de descripción no
  vacía y de máximo 500 caracteres; `CHECK` de que `resuelta` y `cerrada` exigen `tipo_falla_id`,
  `solucion` y `fecha_ejecucion`.
- `historial_transicion.id` es `bigint` secuencial. Las demás claves son `uuid`, como dice el
  SDD, aunque la skill sugiera otra estrategia.
- `tipo_falla.nombre_normalizado` único; el envoltorio IMMUTABLE de `unaccent` es del Sprint 2.
- **Corrección al SDD (Tabla 31):** la lectura de `usuario` se permite a cualquier usuario
  autenticado y activo, con privilegios por columna (`id, nombre, rol_id, finca_id, area_id,
activo`); el correo no se expone por la API. Sin esto, `v_novedad` y `usuario_publico`
  saldrían sin nombres. Va con un ADR y su entrada en `docs/cambios-sdd.md`.
- `notificacion`: el destinatario solo actualiza `leida` y `leida_en` (privilegio por columna,
  política `UPDATE` con `USING` y `WITH CHECK`, y política `SELECT`).
- Las políticas de Storage son del Sprint 4.

**Seed local (`supabase/seed.sql`)**: 2 razones sociales y 3 fincas de prueba; 2 reportantes de
fincas distintas, 1 aprobador por área, 1 director, 1 administrador y 1 usuario desactivado, con
correos `@novedades.test`. Se crean en `auth.users` y `auth.identities` como documenta Supabase,
para que todo se reconstruya con `supabase db reset`. Las contraseñas de prueba se documentan en
el README de desarrollo.

**Pruebas pgTAP** (`supabase/tests/`)

| Archivo                             | Verifica                                                                                                                                                                                                                                                                                           |
| ----------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `rf16_estructura_test.sql`          | 13 tablas con RLS; tipos; índices de la Tabla 27; vistas con `security_invoker`; funciones auxiliares en `private`                                                                                                                                                                                 |
| `rf16_rls_por_rol_test.sql`         | Reportante de la finca A no ve la finca B; aprobador de sistemas no ve mantenimiento; director y administrador ven todo; inactivo y `anon` no ven nada; nadie inserta, actualiza ni borra en `novedad`, `historial_transicion` ni `notificacion`; leer `usuario.correo` falla para todos los roles |
| `rf16_historial_inmutable_test.sql` | `UPDATE`, `DELETE` y `TRUNCATE` lanzan excepción, también como propietario                                                                                                                                                                                                                         |

**Además:** `npm run db:types` (reemplaza el marcador del Sprint 0), asesor sin alertas nuevas,
ADR y `docs/cambios-sdd.md`.

---

## PR 2 · `feat/RF-05-registrar-novedad`

**Migración:** `rf05_registrar_novedad` (reemplaza el cuerpo del contrato).

**Firma:** `registrar_novedad(p_id_local uuid, p_descripcion text, p_prioridad prioridad_novedad,
p_area_id uuid, p_fecha_registro timestamptz)`, `security definer`, `set search_path = ''`,
`revoke execute … from public, anon`, `grant execute … to authenticated`. Devuelve la novedad
(`id`, `codigo`, `estado`, `area_id`, `fecha_registro`, `fecha_sincronizacion`…).

**Algoritmo** (SDD 6.1.3 y Tabla 30, con las correcciones del plan):

1. Perfil de `(select auth.uid())`: si no existe, está inactivo o no es reportante → `SIN_PERMISO`.
2. Idempotencia: si ya existe `id_local` y es suyo, la devuelve sin escribir; si es de otro →
   `SIN_PERMISO`. Se busca primero y después se inserta (un `on conflict` consumiría la
   secuencia); la restricción única queda como red de seguridad ante una carrera.
3. Finca asignada y activa; si no → `FINCA_NO_ASIGNADA`.
4. Descripción no vacía y de máximo 500 caracteres, prioridad y área no nulas →
   `DATO_OBLIGATORIO`; área existente y activa → `AREA_INVALIDA`.
5. `fecha_registro`: la del dispositivo; si es nula o futura, `now()`.
6. Inserta con la finca del reportante (nunca la del cliente) y `fecha_sincronizacion = now()`.
7. Historial: (nulo → `registrada`, con la fecha real) y (`registrada` → `asignada`, con el área
   nueva y `now()`), ambas a nombre del reportante.
8. Avisos: uno por cada aprobador activo del área, excepto quien registra.
9. Cualquier excepción revierte todo (RF-16, CU-16 1a).

**Pruebas pgTAP, una a la vez y primero la prueba** (`rf05_registrar_novedad_test.sql`)

| Prueba                                                                                                        | CU                         |
| ------------------------------------------------------------------------------------------------------------- | -------------------------- |
| Curso normal: estado `asignada`, código creciente, dos filas de historial en orden                            | CU-05, CU-06, CU-07, CU-16 |
| Avisos a los aprobadores activos del área y a nadie más                                                       | CU-07 4                    |
| Idempotencia: el mismo `id_local` dos veces deja una fila con el mismo código; la siguiente recibe código + 1 | RNF-08                     |
| Una fecha futura se reemplaza por `now()`                                                                     | RNF-09                     |
| La finca es siempre la del reportante                                                                         | RF-05                      |
| `SIN_PERMISO`: aprobador, director, administrador, inactivo, `id_local` de otro reportante                    | CU-05                      |
| `anon` no puede ejecutarla                                                                                    | RNF-11                     |
| `FINCA_NO_ASIGNADA`                                                                                           | CU-05                      |
| `DATO_OBLIGATORIO`: descripción vacía, solo espacios o de más de 500; prioridad o área nulas                  | CU-05 4a                   |
| `AREA_INVALIDA`: área inactiva o inexistente                                                                  | CU-05                      |
| Si falla el historial, no queda la novedad                                                                    | CU-16 1a                   |

**Asesor:** marcará `registrar_novedad` como `SECURITY DEFINER` ejecutable por `authenticated`.
Es una decisión de diseño (D-02) y se documenta como excepción aceptada en el ADR. La equivalente
para `anon` debe quedar en cero.

---

## PR 3 · `feat/RF-01-iniciar-sesion`

**Dependencias que entran:** `idb` y `fake-indexeddb` (ya aprobadas en el stack).

**Archivos**

| Ruta                              | Contenido                                                                                                                                                                  |
| --------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/core/errores/traducir.js`    | Tabla 22 completa, más error de red y sesión vencida (401)                                                                                                                 |
| `src/core/utils/fechas.js`        | «24 sep 2026, 7:40 a. m. · Sem 39» con `formatToParts` y tabla propia de meses; semana ISO; «hace 3 h»                                                                     |
| `src/core/utils/codigo.js`        | `NOV-0001`                                                                                                                                                                 |
| `src/core/utils/validadores.js`   | Validadores del formulario 05                                                                                                                                              |
| `src/core/offline/bd.js`          | IndexedDB con los cuatro almacenes de la Tabla 32 y su versión; en este sprint se usan `meta` y `catalogos`                                                                |
| `src/core/conexion/`              | El hook del Sprint 0 más la detección de fallos de red                                                                                                                     |
| `src/core/sesion/`                | Ingreso, perfil con columnas explícitas, catálogos, `storage.persist()`, cierre de sesión                                                                                  |
| `src/core/supabase/repositorios/` | `usuarios.js` y `catalogos.js`                                                                                                                                             |
| `src/app/`                        | Guardián de rol, rutas perezosas por rol, layout del teléfono (barra inferior) y del escritorio (barra lateral y superior), marcadores de las pantallas que llegan después |
| `src/modules/e1-acceso-admin/`    | Pantalla 01 con 01-B, 01-C y 01-D; aviso de la Ley 1581; invitación a instalar                                                                                             |

**Pantallas de Figma:** 01 (1:351), 01-B (1:392), 01-C (1:435) y 01-D (1:478). La 01-E es del
Sprint 3.

**Pruebas Vitest** (primero la prueba): traductor de errores; fechas y semana (24 sep 2026 →
Sem 39; 31 dic 2026 y 1 ene 2027 → Sem 53); código; sesión con el cliente simulado (un perfil
inactivo cierra la sesión); almacén `meta` con `fake-indexeddb`; guardián de rol.

**Playwright** (`e2e/cu-01-iniciar-sesion.spec.js`): curso normal por rol con su menú; 4a (01-B);
4b (01-C); 2a (01-D); cierre de sesión.

**Prueba de sesión sin conexión (RNF-10), obligatoria:** `jwt_expiry = 300` temporal en local;
ingresar, cortar la red, dejar vencer el token, recargar. Debe abrir desde la caché, conservar la
sesión, pintar el menú con el perfil de `meta` y llegar al formulario. Resultado en
`docs/pruebas/sesion-sin-conexion.md`. **Si `supabase-js` cierra o borra la sesión, se detiene el
trabajo y se avisa con las opciones:** rompe RNF-10 y el Sprint 4 depende de esto.

**Accesibilidad:** `label` en cada campo; errores con `aria-live` o `aria-describedby`, no solo
en rojo; permitir pegar la contraseña; `autocomplete="current-password"`; enlace de salto al
contenido en los layouts.

---

## PR 4 · `feat/RF-05-pantallas-registro`

**Archivos**

| Ruta                                          | Contenido                                                                                       |
| --------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| `src/core/supabase/repositorios/novedades.js` | `registrar()` (RPC) y `listarMias()` (`v_novedad`, paginada)                                    |
| `src/modules/e2-registro/`                    | Pantallas 05, 05-C y 06; envío aislado en una función para que el Sprint 4 solo agregue la cola |
| `src/modules/e4-consulta/`                    | Pantallas 04 y 04-C                                                                             |

**Pantallas de Figma:** 04 (2:36), 04-C (2:291), 05 (2:423), 05-C (2:657) y 06 (2:887).

**Envío del formulario** (SDD 6.1.5): `id_local = crypto.randomUUID()` y `fecha_registro` antes
del primer envío, conservados en el estado del formulario. Si el RPC responde bien → pantalla 06.
Error de negocio → mensaje y se conserva el formulario. Error de red → informa que no se envió y
permite reintentar **con el mismo `id_local`**.

**Pruebas Vitest:** validadores del formulario; el envío (éxito, error de negocio, error de red y
reintento con el mismo `id_local`).

**Playwright**

| Archivo                               | Casos                                                                                                                                                                          |
| ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `e2e/cu-05-registrar-novedad.spec.js` | Curso normal hasta la pantalla 06 con NOV-####; 4a (05-C); reintento después de un corte (`route.fetch()` y luego `route.abort()`): queda una sola novedad con el mismo código |
| `e2e/cu-07-enrutar-novedad.spec.js`   | Tras registrar, la novedad está `asignada` en el área elegida (verificación por SQL)                                                                                           |

**Cierre:** Lighthouse (instalable y abre sin red); peso de la ruta de ingreso dentro de los
200 KB; revisión de accesibilidad; `docs/sprints/S1.md`.

---

## Fuera del alcance del Sprint 1

Recuperación de contraseña, gestión de usuarios y de fincas, Edge Functions (Sprint 3) · bandeja,
detalle y demás transiciones (Sprint 2) · cola sin conexión, sincronización y fotos (Sprint 4) ·
panel, pantalla de avisos, push y CSV (Sprint 5). Las tablas de esos módulos sí se crean ahora.

## Riesgos del sprint

| Riesgo                                           | Señal                                | Respuesta                                                                          |
| ------------------------------------------------ | ------------------------------------ | ---------------------------------------------------------------------------------- |
| No hay base donde probar                         | El martes 13 sin Docker ni «staging» | Bloquea los PR 1 y 2; el cliente avanza con el cliente de Supabase simulado        |
| `supabase-js` cierra la sesión sin red           | Falla la prueba de RNF-10            | Detener y decidir con el equipo                                                    |
| La ruta de ingreso supera los 200 KB             | Medición del build en el PR 3        | Cargar `supabase-js` bajo demanda o revisar la fuente                              |
| Cuatro días para el sprint con más base de datos | Burndown del miércoles               | Recortar 04-C y los layouts de escritorio de los otros roles antes que las pruebas |
