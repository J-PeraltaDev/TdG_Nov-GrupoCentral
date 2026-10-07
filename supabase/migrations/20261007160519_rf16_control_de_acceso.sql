-- RF-16 (Sprint 1): control de acceso por rol en la base de datos (RNF-11, D-01).
-- Fuente: SDD 6.1.4 y Tabla 31. Las políticas de Storage van en el Sprint 4.
--
-- Corrección al SDD (docs/cambios-sdd.md): la lectura de `usuario` se permite a cualquier
-- usuario activo, limitada por columnas. Con la política de la Tabla 31 (solo la fila propia),
-- las vistas con security_invoker saldrían sin el nombre del reportante.

-- Funciones auxiliares ------------------------------------------------------------------
-- Leen el perfil del usuario autenticado. Viven en `private`, que no se expone en la API.
-- Devuelven nulo (o falso) si el usuario no existe o está inactivo, así una política que
-- olvide exigir fn_activo() tampoco deja pasar a un usuario desactivado.

create function private.fn_activo()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    (select u.activo from public.usuario u where u.id = (select auth.uid())),
    false
  );
$$;

create function private.fn_rol()
returns smallint
language sql
stable
security definer
set search_path = ''
as $$
  select u.rol_id from public.usuario u where u.id = (select auth.uid()) and u.activo;
$$;

create function private.fn_finca()
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select u.finca_id from public.usuario u where u.id = (select auth.uid()) and u.activo;
$$;

create function private.fn_area()
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select u.area_id from public.usuario u where u.id = (select auth.uid()) and u.activo;
$$;

-- Alcance de consulta de una novedad (SDD 6.1.4): el reportante ve las de su finca; el
-- aprobador, las de su área; el director y el administrador, todas.
create function private.puede_ver_novedad(p_finca_id uuid, p_area_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.usuario u
    where u.id = (select auth.uid())
      and u.activo
      and (
        (u.rol_id = 1 and u.finca_id = p_finca_id)
        or (u.rol_id = 2 and u.area_id = p_area_id)
        or u.rol_id in (3, 4)
      )
  );
$$;

revoke execute on function
  private.fn_activo(),
  private.fn_rol(),
  private.fn_finca(),
  private.fn_area(),
  private.puede_ver_novedad(uuid, uuid)
from public, anon;

-- Las políticas se evalúan con el rol de quien consulta: necesita poder ejecutarlas.
grant usage on schema private to authenticated;
grant execute on function
  private.fn_activo(),
  private.fn_rol(),
  private.fn_finca(),
  private.fn_area(),
  private.puede_ver_novedad(uuid, uuid)
to authenticated;

-- RLS en las 13 tablas ------------------------------------------------------------------

alter table public.razon_social enable row level security;
alter table public.finca enable row level security;
alter table public.area enable row level security;
alter table public.rol enable row level security;
alter table public.usuario enable row level security;
alter table public.solicitud_recuperacion enable row level security;
alter table public.suscripcion_push enable row level security;
alter table public.tipo_falla enable row level security;
alter table public.novedad enable row level security;
alter table public.evidencia enable row level security;
alter table public.historial_transicion enable row level security;
alter table public.auditoria_tipo_falla enable row level security;
alter table public.notificacion enable row level security;

-- Catálogos: los lee cualquier usuario activo; nadie los escribe desde el cliente ---------

grant select on public.razon_social, public.area, public.rol, public.tipo_falla to authenticated;

create policy razon_social_lectura on public.razon_social
  for select to authenticated
  using ((select private.fn_activo()));

create policy area_lectura on public.area
  for select to authenticated
  using ((select private.fn_activo()));

create policy rol_lectura on public.rol
  for select to authenticated
  using ((select private.fn_activo()));

create policy tipo_falla_lectura on public.tipo_falla
  for select to authenticated
  using ((select private.fn_activo()));

-- finca: la leen los usuarios activos; el administrador la crea y la edita (RF-04) -------

grant select, insert, update on public.finca to authenticated;

create policy finca_lectura on public.finca
  for select to authenticated
  using ((select private.fn_activo()));

create policy finca_insercion_administrador on public.finca
  for insert to authenticated
  with check ((select private.fn_rol()) = 4);

create policy finca_actualizacion_administrador on public.finca
  for update to authenticated
  using ((select private.fn_rol()) = 4)
  with check ((select private.fn_rol()) = 4);

-- usuario: lectura para los usuarios activos, limitada por columnas ---------------------
-- El correo no se expone: el propio usuario lo tiene en su sesión y el administrador lo
-- leerá en el Sprint 3 mediante una función que verifique su rol. El cliente debe pedir
-- columnas explícitas de `usuario`, nunca `select *`. Las escrituras son de gestionar-usuario.

grant select (id, nombre, rol_id, finca_id, area_id, activo) on public.usuario to authenticated;

create policy usuario_lectura on public.usuario
  for select to authenticated
  using ((select private.fn_activo()));

-- novedad: se lee según el alcance; solo las funciones de transición escriben -----------
-- La condición es la de private.puede_ver_novedad, escrita con las auxiliares envueltas en
-- (select …) para que se evalúen una vez por consulta y no una vez por fila.

grant select on public.novedad to authenticated;

create policy novedad_lectura on public.novedad
  for select to authenticated
  using (
    ((select private.fn_rol()) = 1 and finca_id = (select private.fn_finca()))
    or ((select private.fn_rol()) = 2 and area_id = (select private.fn_area()))
    or (select private.fn_rol()) in (3, 4)
  );

-- historial_transicion: lo ve quien puede ver la novedad; nadie lo escribe ---------------

grant select on public.historial_transicion to authenticated;

create policy historial_transicion_lectura on public.historial_transicion
  for select to authenticated
  using (
    (select private.fn_activo())
    and exists (select 1 from public.novedad n where n.id = historial_transicion.novedad_id)
  );

-- evidencia: la ve quien puede ver la novedad; la sube el reportante de la finca (RF-08) --

grant select, insert on public.evidencia to authenticated;

create policy evidencia_lectura on public.evidencia
  for select to authenticated
  using (
    (select private.fn_activo())
    and exists (select 1 from public.novedad n where n.id = evidencia.novedad_id)
  );

create policy evidencia_insercion_reportante on public.evidencia
  for insert to authenticated
  with check (
    subida_por = (select auth.uid())
    and (select private.fn_rol()) = 1
    and exists (
      select 1
      from public.novedad n
      where n.id = evidencia.novedad_id
        and n.finca_id = (select private.fn_finca())
    )
  );

-- notificacion: el destinatario la lee y solo puede marcarla como leída (RF-30) ---------
-- Sin la política de lectura, la actualización no afectaría ninguna fila.

grant select on public.notificacion to authenticated;
grant update (leida, leida_en) on public.notificacion to authenticated;

create policy notificacion_lectura on public.notificacion
  for select to authenticated
  using ((select private.fn_activo()) and destinatario_id = (select auth.uid()));

create policy notificacion_marcar_leida on public.notificacion
  for update to authenticated
  using ((select private.fn_activo()) and destinatario_id = (select auth.uid()))
  with check ((select private.fn_activo()) and destinatario_id = (select auth.uid()));

-- suscripcion_push: cada usuario gestiona las suyas (RF-31) --------------------------------

grant select, insert, update, delete on public.suscripcion_push to authenticated;

create policy suscripcion_push_lectura on public.suscripcion_push
  for select to authenticated
  using ((select private.fn_activo()) and usuario_id = (select auth.uid()));

create policy suscripcion_push_insercion on public.suscripcion_push
  for insert to authenticated
  with check ((select private.fn_activo()) and usuario_id = (select auth.uid()));

create policy suscripcion_push_actualizacion on public.suscripcion_push
  for update to authenticated
  using ((select private.fn_activo()) and usuario_id = (select auth.uid()))
  with check ((select private.fn_activo()) and usuario_id = (select auth.uid()));

create policy suscripcion_push_borrado on public.suscripcion_push
  for delete to authenticated
  using ((select private.fn_activo()) and usuario_id = (select auth.uid()));

-- Solo el administrador: auditoría del catálogo y solicitudes de recuperación ---------------

grant select on public.auditoria_tipo_falla to authenticated;

create policy auditoria_tipo_falla_lectura_administrador on public.auditoria_tipo_falla
  for select to authenticated
  using ((select private.fn_rol()) = 4);

-- El resumen del código (codigo_hash) no sale por la API.
grant select (id, usuario_id, expira_en, usado, creada_en)
  on public.solicitud_recuperacion to authenticated;

create policy solicitud_recuperacion_lectura_administrador on public.solicitud_recuperacion
  for select to authenticated
  using ((select private.fn_rol()) = 4);

-- Vistas --------------------------------------------------------------------------------
-- Con security_invoker respetan las políticas de quien consulta (SDD 6.1.1).

create view public.v_novedad
with (security_invoker = true)
as
select
  n.id,
  n.codigo,
  n.id_local,
  n.descripcion,
  n.prioridad,
  n.estado,
  n.solucion,
  n.fecha_ejecucion,
  n.fecha_registro,
  n.fecha_sincronizacion,
  n.actualizado_en,
  n.finca_id,
  f.nombre as finca,
  f.razon_social_id,
  rs.nombre as razon_social,
  n.area_id,
  a.nombre as area,
  n.tipo_falla_id,
  tf.nombre as tipo_falla,
  n.reportante_id,
  u.nombre as reportante
from public.novedad n
join public.finca f on f.id = n.finca_id
join public.razon_social rs on rs.id = f.razon_social_id
join public.area a on a.id = n.area_id
join public.usuario u on u.id = n.reportante_id
left join public.tipo_falla tf on tf.id = n.tipo_falla_id;

comment on view public.v_novedad is
  'Novedad con su finca, razón social, área, tipo de falla y nombre del reportante (bandeja, Mis novedades, historial y detalle).';

create view public.usuario_publico
with (security_invoker = true)
as
select
  u.id,
  u.nombre,
  u.rol_id,
  r.nombre as rol,
  u.area_id,
  a.nombre as area
from public.usuario u
join public.rol r on r.id = u.rol_id
left join public.area a on a.id = u.area_id;

comment on view public.usuario_publico is
  'Nombre, rol y área de los usuarios que aparecen en las líneas de tiempo.';

revoke all on public.v_novedad, public.usuario_publico from anon, authenticated;
grant select on public.v_novedad, public.usuario_publico to authenticated;
