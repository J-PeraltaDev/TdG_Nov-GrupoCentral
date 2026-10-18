-- RF-26 y RF-27 · Cuerpos de rpt_novedades_abiertas y rpt_tiempos_atencion (SDD 6.1.9 y Tabla
-- 34; plan del Sprint 5, decisiones 5 y 19 a 23). Las firmas, los privilegios (solo
-- authenticated) y la forma del jsonb son los del contrato, en la migración
-- rf19_contratos_sprint_5; `create or replace` conserva los privilegios y los comentarios.
--
-- security invoker: cada consulta pasa por la RLS de quien llama. Verifican el rol al comenzar:
-- solo el director de agricultura y el administrador activos ven el panel; si no, un aprobador
-- recibiría un panel recortado por su RLS. Las funciones devuelven agregados simples; la
-- pantalla ordena, agrupa y recorta (decisión 22).

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
begin
  if coalesce(private.fn_rol(), 0) not in (3, 4) then
    raise exception 'SIN_PERMISO' using errcode = 'P0001';
  end if;

  return (
    with abiertas as (
      select n.finca_id, n.area_id, n.estado
      from public.novedad n
      where n.estado in ('registrada', 'asignada', 'en_atencion', 'escalada', 'aprobada', 'resuelta')
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
        where ar.activo or x.cantidad > 0
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
    with resueltas as (
      select
        v.area_id,
        v.resuelta_en,
        extract(epoch from v.resuelta_en - v.fecha_registro) / 3600 as horas
      from public.v_novedad v
      where v.resuelta_en >= v_inicio and v.resuelta_en < v_fin
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
        where ar.activo or x.resueltas > 0
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
          order by va.fecha_registro, va.id
          limit 5
        ) v
      )
    )
  );
end;
$$;
