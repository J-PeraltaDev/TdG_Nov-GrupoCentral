-- Sprint 5 · contratos de las funciones del sprint (SDD 5.3.2, Tabla 21, y lo que la precisa
-- docs/cambios-sdd.md, entradas 24 y 25) y la columna resuelta_en de v_novedad.
-- Verifica la forma de cada función (firma, nombres de los parámetros, resultado, seguridad y
-- privilegios), no su comportamiento: estas aserciones valen igual con el cuerpo
-- NO_IMPLEMENTADO del contrato y con la función ya implementada. resuelta_en sí se prueba
-- completa, porque nace implementada.
begin;

create extension if not exists pgtap with schema extensions;

select plan(36);

-- Firmas ---------------------------------------------------------------------------------

select has_function(
  'public'::name, 'marcar_avisos_leidos'::name, array['uuid[]']::name[],
  'RF-30: marcar_avisos_leidos tiene la firma de la Tabla 21'
);
select has_function(
  'public'::name, 'rpt_novedades_abiertas'::name, array[]::name[],
  'RF-26: rpt_novedades_abiertas existe y no recibe parámetros'
);
select has_function(
  'public'::name, 'rpt_tiempos_atencion'::name, array['date', 'date']::name[],
  'RF-27: rpt_tiempos_atencion recibe el período como dos fechas'
);
select has_function(
  'public'::name, 'rpt_escalamiento'::name, array['date', 'date']::name[],
  'RF-28: rpt_escalamiento recibe el período como dos fechas'
);
select has_function(
  'public'::name, 'rpt_recurrencia'::name, array['date', 'date']::name[],
  'RF-29: rpt_recurrencia recibe el período como dos fechas'
);
select has_function(
  'public'::name, 'renombrar_tipo_falla'::name, array['uuid', 'text']::name[],
  'RF-32: renombrar_tipo_falla tiene la firma de la Tabla 21'
);
select has_function(
  'public'::name, 'fusionar_tipos_falla'::name, array['uuid', 'uuid']::name[],
  'RF-32: fusionar_tipos_falla tiene la firma de la Tabla 21'
);
select has_function(
  'public'::name, 'desactivar_tipo_falla'::name, array['uuid']::name[],
  'RF-32: desactivar_tipo_falla tiene la firma de la Tabla 21'
);
select has_function(
  'public'::name, 'corregir_tipo_falla'::name, array['uuid', 'uuid']::name[],
  'RF-32: corregir_tipo_falla tiene la firma de la Tabla 21'
);

-- Nombres de los parámetros: la API los recibe por nombre, así que son parte del contrato ---

select is(
  (select p.proargnames from pg_proc p where p.oid = to_regprocedure('public.marcar_avisos_leidos(uuid[])')),
  array['p_ids'],
  'RF-30: marcar_avisos_leidos recibe p_ids'
);
select is(
  (select p.pronargdefaults::int from pg_proc p where p.oid = to_regprocedure('public.marcar_avisos_leidos(uuid[])')),
  1,
  'RF-30: p_ids es opcional (nulo marca todos los del usuario)'
);
select is(
  (select p.proargnames from pg_proc p where p.oid = to_regprocedure('public.rpt_novedades_abiertas()')),
  null,
  'RF-26: rpt_novedades_abiertas no tiene parámetros con nombre'
);
select is(
  (select p.proargnames from pg_proc p where p.oid = to_regprocedure('public.rpt_tiempos_atencion(date, date)')),
  array['p_desde', 'p_hasta'],
  'RF-27: rpt_tiempos_atencion recibe p_desde y p_hasta'
);
select is(
  (select p.proargnames from pg_proc p where p.oid = to_regprocedure('public.rpt_escalamiento(date, date)')),
  array['p_desde', 'p_hasta'],
  'RF-28: rpt_escalamiento recibe p_desde y p_hasta'
);
select is(
  (select p.proargnames from pg_proc p where p.oid = to_regprocedure('public.rpt_recurrencia(date, date)')),
  array['p_desde', 'p_hasta'],
  'RF-29: rpt_recurrencia recibe p_desde y p_hasta'
);
select is(
  (select p.proargnames from pg_proc p where p.oid = to_regprocedure('public.renombrar_tipo_falla(uuid, text)')),
  array['p_tipo_id', 'p_nombre'],
  'RF-32: renombrar_tipo_falla recibe p_tipo_id y p_nombre'
);
select is(
  (select p.proargnames from pg_proc p where p.oid = to_regprocedure('public.fusionar_tipos_falla(uuid, uuid)')),
  array['p_origen_id', 'p_destino_id'],
  'RF-32: fusionar_tipos_falla recibe p_origen_id y p_destino_id'
);
select is(
  (select p.proargnames from pg_proc p where p.oid = to_regprocedure('public.desactivar_tipo_falla(uuid)')),
  array['p_tipo_id'],
  'RF-32: desactivar_tipo_falla recibe p_tipo_id'
);
select is(
  (select p.proargnames from pg_proc p where p.oid = to_regprocedure('public.corregir_tipo_falla(uuid, uuid)')),
  array['p_novedad_id', 'p_tipo_falla_id'],
  'RF-32: corregir_tipo_falla recibe p_novedad_id y p_tipo_falla_id'
);

-- Resultados -----------------------------------------------------------------------------

select is(
  (select p.prorettype::regtype::text from pg_proc p where p.oid = to_regprocedure('public.marcar_avisos_leidos(uuid[])')),
  'integer',
  'RF-30: marcar_avisos_leidos devuelve cuántos avisos marcó'
);
select is(
  (
    select count(*)::int
    from pg_proc p
    where p.oid in (
        to_regprocedure('public.rpt_novedades_abiertas()'),
        to_regprocedure('public.rpt_tiempos_atencion(date, date)'),
        to_regprocedure('public.rpt_escalamiento(date, date)'),
        to_regprocedure('public.rpt_recurrencia(date, date)')
      )
      and p.prorettype = 'jsonb'::regtype
      and not p.proretset
  ),
  4,
  'RF-26 a RF-29: cada indicador devuelve un solo jsonb'
);
select is(
  (
    select count(*)::int
    from pg_proc p
    where p.oid in (
        to_regprocedure('public.renombrar_tipo_falla(uuid, text)'),
        to_regprocedure('public.fusionar_tipos_falla(uuid, uuid)'),
        to_regprocedure('public.desactivar_tipo_falla(uuid)')
      )
      and p.prorettype = 'public.tipo_falla'::regtype
      and not p.proretset
  ),
  3,
  'RF-32: las operaciones del catálogo devuelven el tipo de falla (el destino, al fusionar)'
);
select is(
  (
    select count(*)::int
    from pg_proc p
    where p.oid = to_regprocedure('public.corregir_tipo_falla(uuid, uuid)')
      and p.prorettype = 'public.novedad'::regtype
      and not p.proretset
  ),
  1,
  'RF-32: corregir_tipo_falla devuelve la novedad, como las transiciones'
);

-- Seguridad ------------------------------------------------------------------------------

select is(
  (
    select count(*)::int
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname in (
        'marcar_avisos_leidos', 'rpt_novedades_abiertas', 'rpt_tiempos_atencion',
        'rpt_escalamiento', 'rpt_recurrencia', 'renombrar_tipo_falla', 'fusionar_tipos_falla',
        'desactivar_tipo_falla', 'corregir_tipo_falla'
      )
  ),
  9,
  'Sprint 5: ninguna de las nueve funciones tiene sobrecargas'
);
select is(
  (
    select count(*)::int
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname in (
        'marcar_avisos_leidos', 'renombrar_tipo_falla', 'fusionar_tipos_falla',
        'desactivar_tipo_falla', 'corregir_tipo_falla'
      )
      and p.prosecdef
      and p.proconfig @> array['search_path=""']
  ),
  5,
  'RNF-11: las cinco que escriben son security definer y fijan el search_path vacío'
);
select is(
  (
    select count(*)::int
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname in (
        'rpt_novedades_abiertas', 'rpt_tiempos_atencion', 'rpt_escalamiento', 'rpt_recurrencia'
      )
      and not p.prosecdef
      and p.provolatile = 's'
      and p.proconfig @> array['search_path=""']
  ),
  4,
  'SDD 6.1.9: los cuatro indicadores corren con los permisos de quien consulta, solo leen y fijan el search_path vacío'
);

-- Privilegios ----------------------------------------------------------------------------
-- Con sesión: cada función verifica por sí misma el rol. Sin sesión, ninguna.

select is(
  (
    select count(*)::int
    from unnest(array[
      'public.marcar_avisos_leidos(uuid[])', 'public.rpt_novedades_abiertas()',
      'public.rpt_tiempos_atencion(date, date)', 'public.rpt_escalamiento(date, date)',
      'public.rpt_recurrencia(date, date)', 'public.renombrar_tipo_falla(uuid, text)',
      'public.fusionar_tipos_falla(uuid, uuid)', 'public.desactivar_tipo_falla(uuid)',
      'public.corregir_tipo_falla(uuid, uuid)'
    ]) as f (firma)
    where has_function_privilege('authenticated', to_regprocedure(f.firma), 'execute')
  ),
  9,
  'Sprint 5: authenticated puede ejecutar las nueve'
);
select is(
  (
    select count(*)::int
    from unnest(array[
      'public.marcar_avisos_leidos(uuid[])', 'public.rpt_novedades_abiertas()',
      'public.rpt_tiempos_atencion(date, date)', 'public.rpt_escalamiento(date, date)',
      'public.rpt_recurrencia(date, date)', 'public.renombrar_tipo_falla(uuid, text)',
      'public.fusionar_tipos_falla(uuid, uuid)', 'public.desactivar_tipo_falla(uuid)',
      'public.corregir_tipo_falla(uuid, uuid)'
    ]) as f (firma)
    where has_function_privilege('anon', to_regprocedure(f.firma), 'execute')
  ),
  0,
  'RNF-11: anon no puede ejecutar ninguna de las nueve'
);

-- v_novedad.resuelta_en (cambio 25) -------------------------------------------------------

select has_column(
  'public', 'v_novedad', 'resuelta_en',
  'RF-19: v_novedad trae resuelta_en, para el tiempo hasta resolver'
);
select col_type_is(
  'public', 'v_novedad', 'resuelta_en', 'timestamp with time zone',
  'RF-19: resuelta_en es una fecha con zona horaria'
);
select ok(
  (select c.reloptions @> array['security_invoker=true'] from pg_class c where c.oid = 'public.v_novedad'::regclass),
  'RNF-11: v_novedad sigue con security_invoker'
);
select ok(
  has_table_privilege('authenticated', 'public.v_novedad', 'select')
    and not has_table_privilege('anon', 'public.v_novedad', 'select'),
  'RNF-11: v_novedad la lee authenticated y no anon'
);

-- Datos para resuelta_en (como propietario) ------------------------------------------------

insert into public.razon_social (id, nombre)
values ('d5000000-0000-4000-8000-0000000000a1', 'RS pgTAP contratos S5');

insert into public.finca (id, razon_social_id, nombre)
values ('d5000000-0000-4000-8000-0000000000f1', 'd5000000-0000-4000-8000-0000000000a1', 'Finca pgTAP contratos S5');

insert into public.area (id, nombre)
values ('d5000000-0000-4000-8000-0000000000b1', 'Área pgTAP contratos S5');

insert into auth.users (instance_id, id, aud, role, email)
values
  ('00000000-0000-0000-0000-000000000000', 'd5000000-0000-4000-8000-000000000001', 'authenticated', 'authenticated', 'reportante@contratos-s5.pgtap.test'),
  ('00000000-0000-0000-0000-000000000000', 'd5000000-0000-4000-8000-000000000002', 'authenticated', 'authenticated', 'aprobador@contratos-s5.pgtap.test');

insert into public.usuario (id, nombre, correo, rol_id, finca_id, area_id, activo)
values
  ('d5000000-0000-4000-8000-000000000001', 'Reportante', 'reportante@contratos-s5.pgtap.test', 1, 'd5000000-0000-4000-8000-0000000000f1', null, true),
  ('d5000000-0000-4000-8000-000000000002', 'Aprobador', 'aprobador@contratos-s5.pgtap.test', 2, null, 'd5000000-0000-4000-8000-0000000000b1', true);

insert into public.tipo_falla (id, nombre, nombre_normalizado, creado_por)
values ('d5000000-0000-4000-8000-0000000000c1', 'Zz pgTAP contratos S5', 'zz pgtap contratos s5', 'd5000000-0000-4000-8000-000000000002');

-- e1: cerrada, resuelta dos veces (la falla persistió) y con el tipo corregido después.
-- e2: en atención otra vez, con una resolución anterior. e3: resuelta una vez. e4: asignada.
insert into public.novedad (
  id, id_local, finca_id, area_id, reportante_id, tipo_falla_id, descripcion, prioridad, estado,
  solucion, fecha_ejecucion, fecha_registro
)
values
  ('d5000000-0000-4000-8000-0000000000e1', gen_random_uuid(), 'd5000000-0000-4000-8000-0000000000f1', 'd5000000-0000-4000-8000-0000000000b1', 'd5000000-0000-4000-8000-000000000001', 'd5000000-0000-4000-8000-0000000000c1', 'Novedad pgTAP e1', 'normal', 'cerrada', 'Se cambió.', '2026-09-05', '2026-09-01 08:00:00-05'),
  ('d5000000-0000-4000-8000-0000000000e2', gen_random_uuid(), 'd5000000-0000-4000-8000-0000000000f1', 'd5000000-0000-4000-8000-0000000000b1', 'd5000000-0000-4000-8000-000000000001', null, 'Novedad pgTAP e2', 'normal', 'en_atencion', null, null, '2026-09-01 08:00:00-05'),
  ('d5000000-0000-4000-8000-0000000000e3', gen_random_uuid(), 'd5000000-0000-4000-8000-0000000000f1', 'd5000000-0000-4000-8000-0000000000b1', 'd5000000-0000-4000-8000-000000000001', 'd5000000-0000-4000-8000-0000000000c1', 'Novedad pgTAP e3', 'normal', 'resuelta', 'Se ajustó.', '2026-09-03', '2026-09-01 08:00:00-05'),
  ('d5000000-0000-4000-8000-0000000000e4', gen_random_uuid(), 'd5000000-0000-4000-8000-0000000000f1', 'd5000000-0000-4000-8000-0000000000b1', 'd5000000-0000-4000-8000-000000000001', null, 'Novedad pgTAP e4', 'normal', 'asignada', null, null, '2026-09-01 08:00:00-05');

insert into public.historial_transicion (novedad_id, usuario_id, estado_anterior, estado_nuevo, fecha_hora)
values
  ('d5000000-0000-4000-8000-0000000000e1', 'd5000000-0000-4000-8000-000000000002', 'en_atencion', 'resuelta', '2026-09-02 10:00:00-05'),
  ('d5000000-0000-4000-8000-0000000000e1', 'd5000000-0000-4000-8000-000000000001', 'resuelta', 'en_atencion', '2026-09-03 10:00:00-05'),
  ('d5000000-0000-4000-8000-0000000000e1', 'd5000000-0000-4000-8000-000000000002', 'en_atencion', 'resuelta', '2026-09-05 15:30:00-05'),
  ('d5000000-0000-4000-8000-0000000000e1', 'd5000000-0000-4000-8000-000000000001', 'resuelta', 'cerrada', '2026-09-06 09:00:00-05'),
  ('d5000000-0000-4000-8000-0000000000e1', 'd5000000-0000-4000-8000-000000000002', 'cerrada', 'cerrada', '2026-09-07 09:00:00-05'),
  ('d5000000-0000-4000-8000-0000000000e2', 'd5000000-0000-4000-8000-000000000002', 'en_atencion', 'resuelta', '2026-09-02 10:00:00-05'),
  ('d5000000-0000-4000-8000-0000000000e2', 'd5000000-0000-4000-8000-000000000001', 'resuelta', 'en_atencion', '2026-09-03 10:00:00-05'),
  ('d5000000-0000-4000-8000-0000000000e3', 'd5000000-0000-4000-8000-000000000002', 'en_atencion', 'resuelta', '2026-09-03 11:15:00-05');

select is(
  (select v.resuelta_en from public.v_novedad v where v.id = 'd5000000-0000-4000-8000-0000000000e1'),
  '2026-09-05 15:30:00-05'::timestamptz,
  'RF-19: una cerrada que se resolvió dos veces cuenta desde la última resolución; la corrección del tipo no cambia nada'
);
select is(
  (select v.resuelta_en from public.v_novedad v where v.id = 'd5000000-0000-4000-8000-0000000000e2'),
  null,
  'RF-19: una novedad que volvió a «en atención» no tiene fecha de resolución'
);
select is(
  (select v.resuelta_en from public.v_novedad v where v.id = 'd5000000-0000-4000-8000-0000000000e3'),
  '2026-09-03 11:15:00-05'::timestamptz,
  'RF-19: una resuelta trae la fecha de su resolución'
);
select is(
  (select v.resuelta_en from public.v_novedad v where v.id = 'd5000000-0000-4000-8000-0000000000e4'),
  null,
  'RF-19: una abierta sin resolución no tiene fecha'
);

select * from finish();

rollback;
