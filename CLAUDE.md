# Novedades Grupo Central

PWA que centraliza el registro, el enrutamiento, la aprobación en dos instancias, el seguimiento
y el cierre de las novedades de infraestructura física y tecnológica de las fincas de Grupo
Central (Agropecuaria Tumaradó S.A.S.). Trabajo de grado de Mateo Vanegas y Juan Manuel Peralta
(Ingeniería Informática, Politécnico Colombiano Jaime Isaza Cadavid).

El diseño está completo y documentado. **El trabajo es construirlo como está especificado, no
rediseñarlo.** Si algo obliga a apartarse del diseño, se pregunta primero y se anota en
`docs/cambios-sdd.md` en el mismo PR.

## Fuentes de verdad

Están en `docs/fuentes/` (fuera del repo: contienen datos de personas y de la empresa) y, para
leerlas, convertidas a Markdown en `docs/fuentes/md/`.

| Documento                                                             | Decide                           |
| --------------------------------------------------------------------- | -------------------------------- |
| SRS (IEEE 830): 32 RF y 18 RNF                                        | **Qué** hace el sistema          |
| SDD (IEEE 1016): arquitectura, datos, estados, RPC, RLS, sin conexión | **Cómo** lo hace                 |
| Casos de uso: curso normal y alternos de cada CU                      | Los criterios de aceptación      |
| Plan de arranque del Objetivo 3                                       | **Cuándo** (sprints, DoR y DoD)  |
| Figma `mxiQ5ZATu4oLYhA5u5Nd54`: sistema de diseño y 69 pantallas      | La interfaz y sus textos exactos |

Antes de implementar un requerimiento, relee su RF, su CU y su fila de la Tabla 36 del SDD.
Trazabilidad: **HU-xx = RF-xx = CU-xx**. El backlog con los enlaces a Figma está en
`docs/scrum/backlog.md`.

## Comandos

```bash
npm run dev            # app en http://localhost:5173 (sin service worker)
npm run build          # build de producción en dist/ (con service worker)
npm run preview        # sirve dist/ en http://localhost:4173
npm run lint           # oxlint
npm run format         # Prettier (format:check solo verifica)
npm run test           # Vitest (test:watch para el modo interactivo)
npm run test:e2e       # Playwright: Chromium y WebKit, 360 × 800 y 1280 × 800
npm run db:start       # Supabase local (necesita Docker)
npm run db:reset       # recrea la base local: migraciones + seed.sql
npm run test:db        # pgTAP (supabase test db)
npm run db:types       # regenera src/core/supabase/database.types.ts
```

**Después de cada migración:** `npm run db:reset && npm run test:db && npm run db:types`, y el
archivo de tipos regenerado va en el mismo commit.

## Stack (no se cambia sin preguntar)

React 19 + Vite 8 en **JavaScript con JSX** (JSDoc y los tipos generados de Supabase para el
autocompletado) · React Router, API declarativa, con rutas perezosas por rol · Tailwind CSS v4
con los tokens de Figma · `@supabase/supabase-js` v2, una sola instancia · `vite-plugin-pwa`
(`injectManifest`, `registerType: 'prompt'`) · `idb` · SQL y PL/pgSQL en migraciones · Edge
Functions en Deno desde el Sprint 3 · oxlint + Prettier · Vitest + Testing Library +
`fake-indexeddb` · pgTAP · Playwright · Cloudflare Pages (no Workers).

No agregues dependencias fuera de esta lista sin preguntar. Las razones están en `docs/adr/`.

## Estructura

```
src/
├── app/              # rutas, guardianes por rol, layouts
├── core/             # núcleo compartido (SDD, Figura 4)
│   ├── supabase/     # cliente único, repositorios por entidad y tipos generados
│   ├── offline/      # idb, cola de pendientes, sincronizador
│   ├── conexion/     # estado de la conexión
│   ├── sesion/       # sesión, perfil y rol
│   ├── acciones/     # mapa rol × estado (SDD, Tabla 35)
│   ├── errores/      # traductor de códigos (SDD, Tabla 22)
│   ├── config/       # parametros.js
│   ├── ui/           # Estado, Prioridad, Conexión, Botón, Icono, iconos/
│   └── utils/        # fechas, semana del año, código NOV-####
├── modules/          # e1-acceso-admin … e7-avisos (una carpeta por épica)
├── dev/              # /_dev/componentes (solo en desarrollo)
├── styles/tokens.css # los 47 colores y 12 estilos de texto de Figma
└── sw.js             # service worker
supabase/             # config.toml, migrations/, tests/ (pgTAP), functions/, seed.sql (solo local)
e2e/                  # Playwright, un archivo por caso de uso
docs/                 # adr/, scrum/, sprints/, despliegue/, pruebas/
```

## Convenciones

- **Idioma:** código, base de datos y comentarios en español. Identificadores sin tildes ni ñ
  (`registrar_novedad`, `en_atencion`, `razon_social`). Interfaz en español de Colombia, con
  tuteo y los textos exactos de Figma.
- **Nombres del SDD tal cual:** tablas (Tabla 26), funciones RPC y parámetros (Tabla 21) y
  códigos de error (Tabla 22).
- **Roles fijos** (`rol.id smallint`): 1 `reportante`, 2 `aprobador_area`,
  3 `director_agricultura`, 4 `administrador`.
- **Código visible:** `codigo bigint` por secuencia, mostrado como `NOV-` más al menos 4 dígitos
  (`NOV-0001`).
- **Fechas:** `Intl.DateTimeFormat` con `timeZone: 'America/Bogota'` y semana ISO propia. Formato
  de Figma: «24 sep 2026, 7:40 a. m. · Sem 39».
- **Ramas:** `feat/RF-05-registrar-novedad`. Una rama y un PR por historia hacia `main`.
- **Commits:** Conventional Commits con el RF como alcance: `feat(RF-05): registrar novedad`.
- **Migraciones:** `supabase migration new rf05_registrar_novedad` (el archivo lo crea el CLI).
- **Pruebas:** llevan el RF y el CU en el nombre: `RF-05 / CU-05 4a: señala los campos faltantes`.
- **Merge:** squash merge a `main` hecho por una persona después de la revisión del compañero. Un
  agente no hace merge, no fuerza un push y no escribe en la base de producción sin confirmación.
- **Interfaz:** componentes y tokens de `src/core/ui/` y `tokens.css` antes que marcado nuevo;
  imports directos, sin archivos `index.js` que reexporten; 48 px de área táctil en el teléfono;
  foco visible; nada comunicado solo con color; «escritorio» es el punto de quiebre `lg`.

## Dominio

**Tipos enumerados**

- `estado_novedad`: `registrada, asignada, en_atencion, escalada, aprobada, rechazada, resuelta,
cerrada`. «Pendiente de sincronizar» solo existe en el dispositivo.
- `prioridad_novedad`: `critico, alto, normal, bajo`, en ese orden (es el de la bandeja).
- `accion_auditoria`: `renombrar, fusionar, desactivar`.

**Transiciones (SDD, Tabla 29).** `rechazada` y `cerrada` son finales. Todas, salvo el registro
sin conexión, requieren conexión y quedan en el historial.

| Origen                | Evento                 | Actor             | Guarda                                              | Destino              | RF  |
| --------------------- | ---------------------- | ----------------- | --------------------------------------------------- | -------------------- | --- |
| (inicial)             | Registrar con conexión | Reportante        | Descripción, prioridad y área; finca asignada       | registrada           | 05  |
| (inicial)             | Registrar sin conexión | Reportante        | Ingreso previo con conexión en el dispositivo       | pendiente (local)    | 21  |
| pendiente (local)     | Sincronizar            | Sistema           | Conexión y sesión vigente; `id_local` no registrado | registrada           | 22  |
| registrada            | Enrutar                | Sistema           | Área responsable definida                           | asignada             | 07  |
| asignada              | Tomar para atención    | Aprobador de área | Novedad de su área                                  | en_atencion          | 10  |
| asignada, en_atencion | Reasignar              | Aprobador de área | Motivo; área de destino distinta                    | asignada (otra área) | 17  |
| asignada, en_atencion | Rechazar               | Aprobador de área | Motivo                                              | rechazada            | 11  |
| en_atencion           | Escalar                | Aprobador de área | Justificación; novedad de su área                   | escalada             | 12  |
| escalada              | Aprobar                | Director          | Observación opcional                                | aprobada             | 13  |
| escalada              | Rechazar               | Director          | Observación obligatoria                             | rechazada            | 13  |
| en_atencion, aprobada | Registrar solución     | Aprobador de área | Solución y tipo de falla; fecha no posterior a hoy  | resuelta             | 14  |
| resuelta              | Confirmar resolución   | Reportante        | Novedad de su finca                                 | cerrada              | 15  |
| resuelta              | La falla persiste      | Reportante        | Observación obligatoria                             | en_atencion          | 15  |

**Funciones RPC (SDD, Tabla 21)**

| Función                                                       | Parámetros                                                                                                         | Rol                      |
| ------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ | ------------------------ |
| `registrar_novedad`                                           | `p_id_local uuid, p_descripcion text, p_prioridad prioridad_novedad, p_area_id uuid, p_fecha_registro timestamptz` | Reportante               |
| `tomar_novedad`                                               | `p_novedad_id`                                                                                                     | Aprobador de área        |
| `rechazar_novedad`                                            | `p_novedad_id, p_motivo`                                                                                           | Aprobador de área        |
| `reasignar_novedad`                                           | `p_novedad_id, p_area_destino_id, p_motivo`                                                                        | Aprobador de área        |
| `escalar_novedad`                                             | `p_novedad_id, p_justificacion`                                                                                    | Aprobador de área        |
| `decidir_escalamiento`                                        | `p_novedad_id, p_aprobar boolean, p_observacion`                                                                   | Director                 |
| `registrar_solucion`                                          | `p_novedad_id, p_solucion, p_fecha_ejecucion date, p_tipo_falla_id` o `p_tipo_falla_nombre`                        | Aprobador de área        |
| `confirmar_resolucion`                                        | `p_novedad_id, p_observacion` (opcional)                                                                           | Reportante               |
| `reportar_falla_persiste`                                     | `p_novedad_id, p_observacion`                                                                                      | Reportante               |
| `corregir_tipo_falla`                                         | `p_novedad_id, p_tipo_falla_id`                                                                                    | Administrador            |
| `sugerir_tipos_falla`                                         | `p_texto`                                                                                                          | Aprobador, administrador |
| `renombrar_tipo_falla`                                        | `p_tipo_id, p_nombre`                                                                                              | Administrador            |
| `fusionar_tipos_falla`                                        | `p_origen_id, p_destino_id`                                                                                        | Administrador            |
| `desactivar_tipo_falla`                                       | `p_tipo_id`                                                                                                        | Administrador            |
| `marcar_avisos_leidos`                                        | `p_ids uuid[]` (nulo = todos)                                                                                      | Todos                    |
| `solicitar_recuperacion`                                      | `p_correo`                                                                                                         | Sin sesión               |
| `generar_codigo_recuperacion`                                 | `p_solicitud_id`                                                                                                   | Administrador            |
| `rpt_novedades_abiertas`                                      | —                                                                                                                  | Director, administrador  |
| `rpt_tiempos_atencion`, `rpt_escalamiento`, `rpt_recurrencia` | `p_desde, p_hasta`                                                                                                 | Director, administrador  |

Edge Functions (Sprint 3 y 5): `gestionar-usuario`, `restablecer-contrasena`, `enviar-push`.

**Códigos de error (SDD, Tabla 22).** Son el mensaje estable de la excepción; PostgREST los
entrega como HTTP 400 con `code`, `message`, `details` y `hint`, y `core/errores` los traduce.

| Código                              | Condición                                                        | En el cliente                                                           |
| ----------------------------------- | ---------------------------------------------------------------- | ----------------------------------------------------------------------- |
| HTTP 401                            | JWT ausente o vencido                                            | Renovar la sesión; si no se puede, pedir el ingreso conservando la cola |
| `SIN_PERMISO`                       | Rol o alcance no permitido, o usuario inactivo                   | «No tienes permiso para esta acción»                                    |
| `TRANSICION_INVALIDA`               | El estado vigente no admite la acción                            | «La novedad cambió de estado»; recargar el detalle                      |
| `DATO_OBLIGATORIO`                  | Falta descripción, motivo, justificación, observación o solución | Señalar el campo                                                        |
| `FECHA_INVALIDA`                    | Fecha de ejecución posterior a la actual                         | Pantalla 18-B                                                           |
| `AREA_INVALIDA`                     | Área inactiva o igual a la actual                                | «Elige otra área»                                                       |
| `FINCA_NO_ASIGNADA`                 | Reportante sin finca activa                                      | «Tu usuario no tiene una finca asignada»                                |
| `TIPO_FALLA_INVALIDO`               | Tipo inexistente o inactivo; fusión consigo mismo                | Pantalla 31-C o mensaje                                                 |
| `CODIGO_INVALIDO`, `CODIGO_VENCIDO` | Código temporal incorrecto, usado o vencido                      | Pantalla 03-B                                                           |

## Reglas que no se negocian

1. **Todas las tablas tienen RLS.** El cliente nunca escribe directamente en `novedad`,
   `historial_transicion` ni `notificacion`: todo cambio de estado pasa por una función RPC.
2. **Toda función `SECURITY DEFINER`** lleva `set search_path = ''` y nombres calificados, tiene
   `revoke execute … from public, anon`, concede `execute` solo a `authenticated` y verifica por
   sí misma la identidad, el rol y el alcance. Las auxiliares viven en `private`, que no se expone.
3. **Las vistas** se declaran `with (security_invoker = true)`.
4. **Privilegios explícitos.** Cada migración escribe sus `GRANT`: en «PROYECTO» las tablas nuevas
   no quedan expuestas a la API por defecto (y `auto_expose_new_tables = false` hace lo mismo en
   local). Empieza cada tabla con `revoke all … from anon, authenticated`.
5. **Políticas:** `TO authenticated` siempre con un predicado de alcance; `(select auth.uid())` y
   `(select private.fn_rol())` para que se evalúen una vez; todo `UPDATE` con `USING` y `WITH
CHECK`; nunca `user_metadata` para autorizar.
6. **Asesor:** después de cada migración corre `supabase db advisors` (o `get_advisors` del MCP)
   y no dejes alertas nuevas.
7. **El service worker no cachea nada de Supabase.** Los datos sin conexión viven en IndexedDB,
   no en `localStorage`; la sesión de `supabase-js` queda en su almacenamiento por defecto.
8. **Secretos:** el repositorio es público. En el cliente solo va la clave publicable
   (`VITE_SUPABASE_PUBLISHABLE_KEY`). La clave secreta solo existe como secreto de las Edge
   Functions.
9. **«PROYECTO» (`lyrdsmfalrchbdpmikmt`) es producción.** Solo recibe migraciones al cierre de
   cada sprint, después de la review y con el OK del equipo. Se trabaja contra Supabase local.
10. **Migraciones a mano**, con `supabase migration new`. No uses `apply_migration` del MCP.

## Definition of Done

El compañero aprobó el PR · el CI está en verde (lint, unitarias, pgTAP y build) · incluye las
pruebas de su RF · la migración está versionada y aplicada en desarrollo · se probó a 360 px y en
escritorio · el asesor de Supabase no muestra alertas nuevas · corre en la vista previa de Pages ·
si cambió algo del diseño, se actualizó el SDD o el SRS (`docs/cambios-sdd.md`).

La Definition of Ready y el detalle están en `docs/scrum/dor-dod.md`.
