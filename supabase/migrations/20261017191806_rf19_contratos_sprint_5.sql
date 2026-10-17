-- RF-19, RF-26 a RF-30 y RF-32 (Sprint 5): contratos de las funciones del sprint y la columna
-- resuelta_en de v_novedad.
-- Fuente: SDD 5.3.2, Tabla 21, con lo que la precisa docs/cambios-sdd.md (entradas 24 y 25).
-- Publican las firmas para que el cliente avance mientras se implementa el servidor. Por ahora
-- todas lanzan NO_IMPLEMENTADO; el cuerpo de cada una llega en la migración de su historia.
--
-- Las cinco que escriben (los avisos y el catálogo de tipos de falla) son security definer: el
-- cliente no escribe en notificacion, novedad, historial_transicion, tipo_falla ni
-- auditoria_tipo_falla, y cada una verificará por sí misma la identidad y el rol. Los cuatro
-- indicadores son security invoker (SDD 6.1.9): leen con la RLS de quien consulta y, aun así,
-- verificarán el rol, porque a un aprobador su RLS le daría un panel recortado.
--
-- Período de los indicadores: p_desde y p_hasta son días de Colombia, inclusivos. Un rango
-- invertido o nulo responderá FECHA_INVALIDA.

-- Avisos (SDD 6.1.6) -----------------------------------------------------------------------

create function public.marcar_avisos_leidos(p_ids uuid[] default null)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
begin
  raise exception 'NO_IMPLEMENTADO' using errcode = 'P0001';
end;
$$;

comment on function public.marcar_avisos_leidos(uuid[]) is
  'Marca como leídos los avisos del usuario con esos id, o todos los suyos si p_ids es nulo, y devuelve cuántos marcó. Ignora los ajenos (RF-30).';

-- Indicadores del panel (SDD 6.1.9, Tabla 34) --------------------------------------------
-- Cada uno devuelve un jsonb con datos_al (la hora de la consulta) y su forma, que es parte del
-- contrato: el cliente la simula mientras llega el cuerpo.

create function public.rpt_novedades_abiertas()
returns jsonb
language plpgsql
stable
security invoker
set search_path = ''
as $$
begin
  raise exception 'NO_IMPLEMENTADO' using errcode = 'P0001';
end;
$$;

comment on function public.rpt_novedades_abiertas() is
  'Novedades abiertas (registrada, asignada, en atención, escalada, aprobada y resuelta) por finca, por área y por estado (RF-26). { datos_al, areas: [{ id, nombre, abiertas }], fincas: [{ id, nombre, razon_social, activa, total, por_area: { <area_id>: n } }], estados: [{ estado, abiertas }] }. Las fincas activas sin abiertas salen en cero.';

create function public.rpt_tiempos_atencion(p_desde date, p_hasta date)
returns jsonb
language plpgsql
stable
security invoker
set search_path = ''
as $$
begin
  raise exception 'NO_IMPLEMENTADO' using errcode = 'P0001';
end;
$$;

comment on function public.rpt_tiempos_atencion(date, date) is
  'Tiempos de atención desde fecha_registro (RF-27, RNF-09), de las resueltas o cerradas cuya última resolución cae en el período. { datos_al, desde, hasta, areas: [{ id, nombre, resueltas, promedio_horas }], meses: [{ mes, area_id, resueltas, promedio_horas }], abiertas: [{ id, codigo, finca, area_id, area, estado, prioridad, fecha_registro, horas_abierta }] }. promedio_horas es nulo sin resueltas; abiertas trae las cinco con más tiempo.';

create function public.rpt_escalamiento(p_desde date, p_hasta date)
returns jsonb
language plpgsql
stable
security invoker
set search_path = ''
as $$
begin
  raise exception 'NO_IMPLEMENTADO' using errcode = 'P0001';
end;
$$;

comment on function public.rpt_escalamiento(date, date) is
  'Proporción de escaladas entre las registradas en el período, por área, y las decisiones del director (RF-28). { datos_al, desde, hasta, registradas, escaladas, areas: [{ id, nombre, registradas, escaladas }], decisiones: { aprobadas, rechazadas, en_espera }, novedades: [{ id, codigo, finca, area_id, area, justificacion, escalada_en, decision, decidida_en }] }. La decisión es la de la última escalada; nula si espera.';

create function public.rpt_recurrencia(p_desde date, p_hasta date)
returns jsonb
language plpgsql
stable
security invoker
set search_path = ''
as $$
begin
  raise exception 'NO_IMPLEMENTADO' using errcode = 'P0001';
end;
$$;

comment on function public.rpt_recurrencia(date, date) is
  'Resueltas y cerradas registradas en el período, por finca y tipo de falla (RF-29). { datos_al, desde, hasta, total, excluidas, celdas: [{ finca_id, finca, tipo_falla_id, tipo_falla, cantidad }] }. excluidas son las del período sin tipo (abiertas o rechazadas); celdas solo trae las que no son cero.';

-- Catálogo de tipos de falla (SDD 6.1.8) ---------------------------------------------------

create function public.renombrar_tipo_falla(p_tipo_id uuid, p_nombre text)
returns public.tipo_falla
language plpgsql
security definer
set search_path = ''
as $$
begin
  raise exception 'NO_IMPLEMENTADO' using errcode = 'P0001';
end;
$$;

comment on function public.renombrar_tipo_falla(uuid, text) is
  'El administrador renombra un tipo activo; si el nombre normalizado ya es de otro tipo, TIPO_FALLA_DUPLICADO. Queda auditado con el nombre anterior (RF-32).';

create function public.fusionar_tipos_falla(p_origen_id uuid, p_destino_id uuid)
returns public.tipo_falla
language plpgsql
security definer
set search_path = ''
as $$
begin
  raise exception 'NO_IMPLEMENTADO' using errcode = 'P0001';
end;
$$;

comment on function public.fusionar_tipos_falla(uuid, uuid) is
  'El administrador pasa todas las novedades del origen al destino, desactiva el origen y lo audita. Devuelve el destino. Origen igual al destino, o alguno inactivo: TIPO_FALLA_INVALIDO (RF-32).';

create function public.desactivar_tipo_falla(p_tipo_id uuid)
returns public.tipo_falla
language plpgsql
security definer
set search_path = ''
as $$
begin
  raise exception 'NO_IMPLEMENTADO' using errcode = 'P0001';
end;
$$;

comment on function public.desactivar_tipo_falla(uuid) is
  'El administrador saca un tipo de las sugerencias; sus novedades lo conservan. Queda auditado (RF-32).';

create function public.corregir_tipo_falla(p_novedad_id uuid, p_tipo_falla_id uuid)
returns public.novedad
language plpgsql
security definer
set search_path = ''
as $$
begin
  raise exception 'NO_IMPLEMENTADO' using errcode = 'P0001';
end;
$$;

comment on function public.corregir_tipo_falla(uuid, uuid) is
  'El administrador corrige el tipo de falla de una novedad cerrada, con un tipo activo, sin cambiar su estado: cerrada → cerrada en el historial, con el tipo anterior y el nuevo (RF-32, RF-16).';

-- Privilegios ----------------------------------------------------------------------------
-- Postgres concede EXECUTE a PUBLIC en cada función nueva, y Supabase, además, a los roles de
-- la API. Se retira todo y se concede lo justo: con sesión, cada una verifica el rol.

revoke execute on function
  public.marcar_avisos_leidos(uuid[]),
  public.rpt_novedades_abiertas(),
  public.rpt_tiempos_atencion(date, date),
  public.rpt_escalamiento(date, date),
  public.rpt_recurrencia(date, date),
  public.renombrar_tipo_falla(uuid, text),
  public.fusionar_tipos_falla(uuid, uuid),
  public.desactivar_tipo_falla(uuid),
  public.corregir_tipo_falla(uuid, uuid)
from public, anon, authenticated;

grant execute on function
  public.marcar_avisos_leidos(uuid[]),
  public.rpt_novedades_abiertas(),
  public.rpt_tiempos_atencion(date, date),
  public.rpt_escalamiento(date, date),
  public.rpt_recurrencia(date, date),
  public.renombrar_tipo_falla(uuid, text),
  public.fusionar_tipos_falla(uuid, uuid),
  public.desactivar_tipo_falla(uuid),
  public.corregir_tipo_falla(uuid, uuid)
to authenticated;

-- v_novedad.resuelta_en (cambio 25) -------------------------------------------------------
-- Una sola regla para «Tiempo hasta resolver» en el historial, el detalle, el CSV y el panel
-- (SDD, Tabla 34): la última transición hacia resuelta de una novedad resuelta o cerrada. La que
-- volvió a «en atención» porque la falla persistió no tiene fecha hasta que se resuelva otra
-- vez. La subconsulta usa historial_transicion_novedad_idx, y Postgres no la calcula en las
-- consultas que no piden la columna. Se agrega al final: las demás columnas no cambian.

create or replace view public.v_novedad
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
  u.nombre as reportante,
  case
    when n.estado in ('resuelta', 'cerrada') then (
      select max(h.fecha_hora)
      from public.historial_transicion h
      where h.novedad_id = n.id and h.estado_nuevo = 'resuelta'
    )
  end as resuelta_en
from public.novedad n
join public.finca f on f.id = n.finca_id
join public.razon_social rs on rs.id = f.razon_social_id
join public.area a on a.id = n.area_id
join public.usuario u on u.id = n.reportante_id
left join public.tipo_falla tf on tf.id = n.tipo_falla_id;

comment on column public.v_novedad.resuelta_en is
  'Fecha de la última transición hacia resuelta, si la novedad está resuelta o cerrada; nula si no. Tiempo hasta resolver = resuelta_en − fecha_registro (Tabla 34).';
