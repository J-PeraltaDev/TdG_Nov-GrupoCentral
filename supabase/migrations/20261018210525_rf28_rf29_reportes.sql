-- RF-28 y RF-29 · Cuerpos de rpt_escalamiento y rpt_recurrencia (SDD 6.1.9 y Tabla 34; plan
-- del Sprint 5, decisiones 5 y 19 a 22). Las firmas, los privilegios (solo authenticated) y la
-- forma del jsonb son los del contrato, en la migración rf19_contratos_sprint_5; `create or
-- replace` conserva los privilegios y los comentarios.
--
-- Como las de rf26_rf27_reportes: security invoker, verifican el rol al comenzar (solo el
-- director de agricultura y el administrador activos) y cortan el período en días de Colombia,
-- inclusivos. Devuelven agregados simples; la pantalla ordena, agrupa y recorta (decisión 22).

-- Escalamiento (RF-28) ------------------------------------------------------------------
-- De las novedades registradas en el período, las que tuvieron al menos una transición a
-- «escalada», por el área actual. La justificación y la decisión del director son las de la
-- última escalada: la siguiente transición desde «escalada», o ninguna si todavía espera.

create or replace function public.rpt_escalamiento(p_desde date, p_hasta date)
returns jsonb
language plpgsql
stable
security invoker
set search_path = ''
as $$
declare
  v_inicio timestamptz;
  v_fin timestamptz;
begin
  if coalesce(private.fn_rol(), 0) not in (3, 4) then
    raise exception 'SIN_PERMISO' using errcode = 'P0001';
  end if;
  if p_desde is null or p_hasta is null or p_desde > p_hasta then
    raise exception 'FECHA_INVALIDA' using errcode = 'P0001';
  end if;

  v_inicio := p_desde::timestamp at time zone 'America/Bogota';
  v_fin := (p_hasta + 1)::timestamp at time zone 'America/Bogota';

  return (
    with del_periodo as (
      select n.id, n.codigo, n.area_id, n.finca_id
      from public.novedad n
      where n.fecha_registro >= v_inicio and n.fecha_registro < v_fin
    ),
    ultima_escalada as (
      select distinct on (h.novedad_id) h.novedad_id, h.id, h.observacion, h.fecha_hora
      from public.historial_transicion h
      join del_periodo d on d.id = h.novedad_id
      where h.estado_nuevo = 'escalada'
      order by h.novedad_id, h.id desc
    ),
    decision as (
      select distinct on (u.novedad_id) u.novedad_id, h.estado_nuevo, h.fecha_hora
      from ultima_escalada u
      join public.historial_transicion h
        on h.novedad_id = u.novedad_id and h.id > u.id and h.estado_anterior = 'escalada'
      order by u.novedad_id, h.id
    ),
    escaladas as (
      select d.id, d.codigo, d.area_id, d.finca_id, u.observacion, u.fecha_hora as escalada_en,
        x.estado_nuevo as decision, x.fecha_hora as decidida_en
      from del_periodo d
      join ultima_escalada u on u.novedad_id = d.id
      left join decision x on x.novedad_id = d.id
    )
    select jsonb_build_object(
      'datos_al', now(),
      'desde', p_desde,
      'hasta', p_hasta,
      'registradas', (select count(*)::int from del_periodo),
      'escaladas', (select count(*)::int from escaladas),
      'areas', (
        select coalesce(
          jsonb_agg(
            jsonb_build_object(
              'id', ar.id,
              'nombre', ar.nombre,
              'registradas', coalesce(r.cantidad, 0),
              'escaladas', coalesce(e.cantidad, 0)
            )
            order by ar.nombre
          ),
          '[]'::jsonb
        )
        from public.area ar
        left join (
          select d.area_id, count(*)::int as cantidad from del_periodo d group by d.area_id
        ) r on r.area_id = ar.id
        left join (
          select e.area_id, count(*)::int as cantidad from escaladas e group by e.area_id
        ) e on e.area_id = ar.id
        where ar.activo or r.cantidad > 0
      ),
      'decisiones', (
        select jsonb_build_object(
          'aprobadas', count(*) filter (where e.decision = 'aprobada'),
          'rechazadas', count(*) filter (where e.decision = 'rechazada'),
          'en_espera', count(*) filter (where e.decision is null)
        )
        from escaladas e
      ),
      'novedades', (
        select coalesce(
          jsonb_agg(
            jsonb_build_object(
              'id', e.id,
              'codigo', e.codigo,
              'finca', f.nombre,
              'area_id', e.area_id,
              'area', ar.nombre,
              'justificacion', e.observacion,
              'escalada_en', e.escalada_en,
              'decision', e.decision,
              'decidida_en', e.decidida_en
            )
            order by e.escalada_en desc, e.id
          ),
          '[]'::jsonb
        )
        -- shortcut: sin paginar; con más de 100 escaladas en un período, paginar (decisión 22).
        from escaladas e
        join public.finca f on f.id = e.finca_id
        join public.area ar on ar.id = e.area_id
      )
    )
  );
end;
$$;

-- Fallas recurrentes (RF-29) ------------------------------------------------------------
-- Las resueltas y cerradas registradas en el período, por finca y tipo de falla (el tipo
-- vigente: tras una fusión, el destino). Aparte, cuántas del período quedaron por fuera por no
-- estar resueltas ni cerradas (abiertas o rechazadas, sin tipo todavía).

create or replace function public.rpt_recurrencia(p_desde date, p_hasta date)
returns jsonb
language plpgsql
stable
security invoker
set search_path = ''
as $$
declare
  v_inicio timestamptz;
  v_fin timestamptz;
begin
  if coalesce(private.fn_rol(), 0) not in (3, 4) then
    raise exception 'SIN_PERMISO' using errcode = 'P0001';
  end if;
  if p_desde is null or p_hasta is null or p_desde > p_hasta then
    raise exception 'FECHA_INVALIDA' using errcode = 'P0001';
  end if;

  v_inicio := p_desde::timestamp at time zone 'America/Bogota';
  v_fin := (p_hasta + 1)::timestamp at time zone 'America/Bogota';

  return (
    with del_periodo as (
      select n.finca_id, n.tipo_falla_id, n.estado in ('resuelta', 'cerrada') as cuenta
      from public.novedad n
      where n.fecha_registro >= v_inicio and n.fecha_registro < v_fin
    )
    select jsonb_build_object(
      'datos_al', now(),
      'desde', p_desde,
      'hasta', p_hasta,
      'total', (select count(*)::int from del_periodo d where d.cuenta),
      'excluidas', (select count(*)::int from del_periodo d where not d.cuenta),
      'celdas', (
        select coalesce(
          jsonb_agg(
            jsonb_build_object(
              'finca_id', c.finca_id,
              'finca', f.nombre,
              'tipo_falla_id', c.tipo_falla_id,
              'tipo_falla', tf.nombre,
              'cantidad', c.cantidad
            )
            order by c.cantidad desc, f.nombre, tf.nombre
          ),
          '[]'::jsonb
        )
        from (
          select d.finca_id, d.tipo_falla_id, count(*)::int as cantidad
          from del_periodo d
          where d.cuenta
          group by d.finca_id, d.tipo_falla_id
        ) c
        join public.finca f on f.id = c.finca_id
        join public.tipo_falla tf on tf.id = c.tipo_falla_id
      )
    )
  );
end;
$$;
