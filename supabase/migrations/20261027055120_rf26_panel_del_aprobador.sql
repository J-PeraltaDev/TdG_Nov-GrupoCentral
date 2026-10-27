-- RF-26 a RF-29 · El panel de reportes también para el aprobador de área, solo de su área
-- (cambio 38 de cambios-sdd). Reemplaza los cuerpos de rf26_rf27_reportes y rf28_rf29_reportes:
-- las firmas, los privilegios (solo authenticated) y la forma del jsonb no cambian.
--
-- Siguen siendo security invoker: la RLS de novedad (y, con ella, la de v_novedad y la de
-- historial_transicion) ya limita al aprobador a las novedades de su área actual. Además, cada
-- consulta filtra por private.fn_area() y la lista de áreas trae solo la suya, para que el
-- panel no muestre las demás en cero. Un aprobador sin área recibe SIN_PERMISO.
--
-- Como el resto del sistema, una novedad cuenta para el área que la tiene hoy: si se reasignó,
-- el área anterior ya no la ve, ni sus tiempos ni sus escalamientos.

-- Novedades abiertas (RF-26) ------------------------------------------------------------
-- Abiertas: los seis estados que no son finales (Tabla 34). Salen todas las fincas activas,
-- en cero si no tienen abiertas, y las inactivas que aún tengan alguna (CU-04 3b permite
-- desactivar una finca con abiertas).

create or replace function public.rpt_novedades_abiertas()
returns jsonb
language plpgsql
stable
security invoker
set search_path = ''
as $$
declare
  -- El aprobador ve solo su área (cambio 38); el director y el administrador, todas.
  v_rol integer := private.fn_rol();
  v_area uuid := case when private.fn_rol() = 2 then private.fn_area() end;
begin
  if coalesce(v_rol, 0) not in (2, 3, 4) or (v_rol = 2 and v_area is null) then
    raise exception 'SIN_PERMISO' using errcode = 'P0001';
  end if;

  return (
    with abiertas as (
      select n.finca_id, n.area_id, n.estado
      from public.novedad n
      where n.estado in ('registrada', 'asignada', 'en_atencion', 'escalada', 'aprobada', 'resuelta')
        and (v_area is null or n.area_id = v_area)
    ),
    por_finca_y_area as (
      select a.finca_id, a.area_id, count(*)::int as cantidad
      from abiertas a
      group by a.finca_id, a.area_id
    )
    select jsonb_build_object(
      'datos_al', now(),
      'areas', (
        select coalesce(
          jsonb_agg(
            jsonb_build_object('id', ar.id, 'nombre', ar.nombre, 'abiertas', coalesce(x.cantidad, 0))
            order by ar.nombre
          ),
          '[]'::jsonb
        )
        from public.area ar
        left join (
          select p.area_id, sum(p.cantidad)::int as cantidad
          from por_finca_y_area p
          group by p.area_id
        ) x on x.area_id = ar.id
        where (v_area is null or ar.id = v_area) and (ar.activo or x.cantidad > 0)
      ),
      'fincas', (
        select coalesce(
          jsonb_agg(
            jsonb_build_object(
              'id', f.id,
              'nombre', f.nombre,
              'razon_social', rs.nombre,
              'activa', f.activo,
              'total', coalesce(x.total, 0),
              'por_area', coalesce(x.por_area, '{}'::jsonb)
            )
            order by coalesce(x.total, 0) desc, f.nombre
          ),
          '[]'::jsonb
        )
        from public.finca f
        join public.razon_social rs on rs.id = f.razon_social_id
        left join (
          select p.finca_id, sum(p.cantidad)::int as total, jsonb_object_agg(p.area_id, p.cantidad) as por_area
          from por_finca_y_area p
          group by p.finca_id
        ) x on x.finca_id = f.id
        where f.activo or x.total > 0
      ),
      'estados', (
        select jsonb_agg(
          jsonb_build_object('estado', e.estado, 'abiertas', coalesce(x.cantidad, 0))
          order by e.estado
        )
        from unnest(
          array['registrada', 'asignada', 'en_atencion', 'escalada', 'aprobada', 'resuelta']::public.estado_novedad[]
        ) as e (estado)
        left join (
          select a.estado, count(*)::int as cantidad
          from abiertas a
          group by a.estado
        ) x on x.estado = e.estado
      )
    )
  );
end;
$$;

-- Tiempos de atención (RF-27) -----------------------------------------------------------
-- Desde fecha_registro (RNF-09) hasta la última resolución, de las novedades resueltas o
-- cerradas cuya última resolución cae en el período: v_novedad.resuelta_en, la misma regla del
-- historial y del detalle (cambio 25). p_desde y p_hasta son días de Colombia, inclusivos
-- (decisión 5); «por mes» es el mes de Colombia de la resolución. «Abiertas con más tiempo» no
-- depende del período: son las cinco abiertas más antiguas hoy.

create or replace function public.rpt_tiempos_atencion(p_desde date, p_hasta date)
returns jsonb
language plpgsql
stable
security invoker
set search_path = ''
as $$
declare
  -- El aprobador ve solo su área (cambio 38); el director y el administrador, todas.
  v_rol integer := private.fn_rol();
  v_area uuid := case when private.fn_rol() = 2 then private.fn_area() end;
  v_inicio timestamptz;
  v_fin timestamptz;
begin
  if coalesce(v_rol, 0) not in (2, 3, 4) or (v_rol = 2 and v_area is null) then
    raise exception 'SIN_PERMISO' using errcode = 'P0001';
  end if;
  if p_desde is null or p_hasta is null or p_desde > p_hasta then
    raise exception 'FECHA_INVALIDA' using errcode = 'P0001';
  end if;

  v_inicio := p_desde::timestamp at time zone 'America/Bogota';
  v_fin := (p_hasta + 1)::timestamp at time zone 'America/Bogota';

  return (
    with resueltas as (
      select
        v.area_id,
        v.resuelta_en,
        extract(epoch from v.resuelta_en - v.fecha_registro) / 3600 as horas
      from public.v_novedad v
      where v.resuelta_en >= v_inicio and v.resuelta_en < v_fin
        and (v_area is null or v.area_id = v_area)
    )
    select jsonb_build_object(
      'datos_al', now(),
      'desde', p_desde,
      'hasta', p_hasta,
      'areas', (
        select coalesce(
          jsonb_agg(
            jsonb_build_object(
              'id', ar.id,
              'nombre', ar.nombre,
              'resueltas', coalesce(x.resueltas, 0),
              'promedio_horas', x.promedio_horas
            )
            order by ar.nombre
          ),
          '[]'::jsonb
        )
        from public.area ar
        left join (
          select r.area_id, count(*)::int as resueltas, round(avg(r.horas), 2) as promedio_horas
          from resueltas r
          group by r.area_id
        ) x on x.area_id = ar.id
        where (v_area is null or ar.id = v_area) and (ar.activo or x.resueltas > 0)
      ),
      'meses', (
        select coalesce(
          jsonb_agg(
            jsonb_build_object(
              'mes', m.mes,
              'area_id', m.area_id,
              'resueltas', m.resueltas,
              'promedio_horas', m.promedio_horas
            )
            order by m.mes, m.area_id
          ),
          '[]'::jsonb
        )
        from (
          select
            date_trunc('month', r.resuelta_en at time zone 'America/Bogota')::date as mes,
            r.area_id,
            count(*)::int as resueltas,
            round(avg(r.horas), 2) as promedio_horas
          from resueltas r
          group by 1, 2
        ) m
      ),
      'abiertas', (
        select coalesce(
          jsonb_agg(
            jsonb_build_object(
              'id', v.id,
              'codigo', v.codigo,
              'finca', v.finca,
              'area_id', v.area_id,
              'area', v.area,
              'estado', v.estado,
              'prioridad', v.prioridad,
              'fecha_registro', v.fecha_registro,
              'horas_abierta', round(extract(epoch from now() - v.fecha_registro) / 3600, 2)
            )
            order by v.fecha_registro, v.id
          ),
          '[]'::jsonb
        )
        from (
          select va.id, va.codigo, va.finca, va.area_id, va.area, va.estado, va.prioridad, va.fecha_registro
          from public.v_novedad va
          where va.estado in ('registrada', 'asignada', 'en_atencion', 'escalada', 'aprobada', 'resuelta')
            and (v_area is null or va.area_id = v_area)
          order by va.fecha_registro, va.id
          limit 5
        ) v
      )
    )
  );
end;
$$;

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
  -- El aprobador ve solo su área (cambio 38); el director y el administrador, todas.
  v_rol integer := private.fn_rol();
  v_area uuid := case when private.fn_rol() = 2 then private.fn_area() end;
  v_inicio timestamptz;
  v_fin timestamptz;
begin
  if coalesce(v_rol, 0) not in (2, 3, 4) or (v_rol = 2 and v_area is null) then
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
        and (v_area is null or n.area_id = v_area)
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
        where (v_area is null or ar.id = v_area) and (ar.activo or r.cantidad > 0)
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
  -- El aprobador ve solo su área (cambio 38); el director y el administrador, todas.
  v_rol integer := private.fn_rol();
  v_area uuid := case when private.fn_rol() = 2 then private.fn_area() end;
  v_inicio timestamptz;
  v_fin timestamptz;
begin
  if coalesce(v_rol, 0) not in (2, 3, 4) or (v_rol = 2 and v_area is null) then
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
        and (v_area is null or n.area_id = v_area)
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
