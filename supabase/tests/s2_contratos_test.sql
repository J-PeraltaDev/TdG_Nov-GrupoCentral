-- Sprint 2 · contratos de las funciones de atención (SDD 5.3.2, Tabla 21).
-- Verifica la forma de cada función (firma, nombres de los parámetros, resultado, seguridad y
-- privilegios), no su comportamiento: estas aserciones valen igual con el cuerpo
-- NO_IMPLEMENTADO del contrato y con la función ya implementada.
begin;

create extension if not exists pgtap with schema extensions;

select plan(31);

-- Firmas ---------------------------------------------------------------------------------

select has_function(
  'public'::name, 'tomar_novedad'::name, array['uuid']::name[],
  'RF-10: tomar_novedad tiene la firma de la Tabla 21'
);
select has_function(
  'public'::name, 'rechazar_novedad'::name, array['uuid', 'text']::name[],
  'RF-11: rechazar_novedad tiene la firma de la Tabla 21'
);
select has_function(
  'public'::name, 'reasignar_novedad'::name, array['uuid', 'uuid', 'text']::name[],
  'RF-17: reasignar_novedad tiene la firma de la Tabla 21'
);
select has_function(
  'public'::name, 'escalar_novedad'::name, array['uuid', 'text']::name[],
  'RF-12: escalar_novedad tiene la firma de la Tabla 21'
);
select has_function(
  'public'::name, 'registrar_solucion'::name, array['uuid', 'text', 'date', 'uuid', 'text']::name[],
  'RF-14: registrar_solucion tiene la firma de la Tabla 21'
);
select has_function(
  'public'::name, 'sugerir_tipos_falla'::name, array['text']::name[],
  'RF-14: sugerir_tipos_falla tiene la firma de la Tabla 21'
);

-- Nombres de los parámetros: la API los recibe por nombre, así que son parte del contrato ---

select is(
  (select p.proargnames from pg_proc p where p.oid = to_regprocedure('public.tomar_novedad(uuid)')),
  array['p_novedad_id'],
  'RF-10: tomar_novedad recibe p_novedad_id'
);
select is(
  (select p.proargnames from pg_proc p where p.oid = to_regprocedure('public.rechazar_novedad(uuid, text)')),
  array['p_novedad_id', 'p_motivo'],
  'RF-11: rechazar_novedad recibe p_novedad_id y p_motivo'
);
select is(
  (select p.proargnames from pg_proc p where p.oid = to_regprocedure('public.reasignar_novedad(uuid, uuid, text)')),
  array['p_novedad_id', 'p_area_destino_id', 'p_motivo'],
  'RF-17: reasignar_novedad recibe p_novedad_id, p_area_destino_id y p_motivo'
);
select is(
  (select p.proargnames from pg_proc p where p.oid = to_regprocedure('public.escalar_novedad(uuid, text)')),
  array['p_novedad_id', 'p_justificacion'],
  'RF-12: escalar_novedad recibe p_novedad_id y p_justificacion'
);
select is(
  (select p.proargnames from pg_proc p where p.oid = to_regprocedure('public.registrar_solucion(uuid, text, date, uuid, text)')),
  array['p_novedad_id', 'p_solucion', 'p_fecha_ejecucion', 'p_tipo_falla_id', 'p_tipo_falla_nombre'],
  'RF-14: registrar_solucion recibe la novedad, la solución, la fecha y el tipo por id o por nombre'
);
select is(
  (select p.pronargdefaults::int from pg_proc p where p.oid = to_regprocedure('public.registrar_solucion(uuid, text, date, uuid, text)')),
  2,
  'RF-14: p_tipo_falla_id y p_tipo_falla_nombre son opcionales'
);

-- Resultados -----------------------------------------------------------------------------

select is(
  (
    select count(*)::int
    from pg_proc p
    where p.oid in (
        to_regprocedure('public.tomar_novedad(uuid)'),
        to_regprocedure('public.rechazar_novedad(uuid, text)'),
        to_regprocedure('public.reasignar_novedad(uuid, uuid, text)'),
        to_regprocedure('public.escalar_novedad(uuid, text)'),
        to_regprocedure('public.registrar_solucion(uuid, text, date, uuid, text)')
      )
      and p.prorettype = 'public.novedad'::regtype
      and not p.proretset
  ),
  5,
  'RF-16: las cinco transiciones devuelven la novedad actualizada'
);
select is(
  (select p.proargnames from pg_proc p where p.oid = to_regprocedure('public.sugerir_tipos_falla(text)')),
  array['p_texto', 'id', 'nombre', 'cantidad_novedades', 'coincidencia_exacta'],
  'RF-14: sugerir_tipos_falla devuelve id, nombre, cantidad_novedades y coincidencia_exacta'
);
select is(
  (select p.proallargtypes::regtype[]::text[] from pg_proc p where p.oid = to_regprocedure('public.sugerir_tipos_falla(text)')),
  array['text', 'uuid', 'text', 'integer', 'boolean'],
  'RF-14: las columnas de sugerir_tipos_falla son uuid, text, integer y boolean'
);
select ok(
  (select p.proretset from pg_proc p where p.oid = to_regprocedure('public.sugerir_tipos_falla(text)')),
  'RF-14: sugerir_tipos_falla devuelve un conjunto de filas'
);
select is(
  (select p.provolatile::text from pg_proc p where p.oid = to_regprocedure('public.sugerir_tipos_falla(text)')),
  's',
  'RF-14: sugerir_tipos_falla es stable (solo lee)'
);

-- Seguridad ------------------------------------------------------------------------------

select is(
  (
    select count(*)::int
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname in (
        'tomar_novedad', 'rechazar_novedad', 'reasignar_novedad', 'escalar_novedad',
        'registrar_solucion', 'sugerir_tipos_falla'
      )
  ),
  6,
  'RF-14: ninguna de las seis funciones tiene sobrecargas'
);
select is(
  (
    select count(*)::int
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname in (
        'tomar_novedad', 'rechazar_novedad', 'reasignar_novedad', 'escalar_novedad',
        'registrar_solucion', 'sugerir_tipos_falla'
      )
      and p.prosecdef
      and p.proconfig @> array['search_path=""']
  ),
  6,
  'RNF-11: las seis son security definer y fijan el search_path vacío'
);

-- Privilegios: solo authenticated; cada función verifica por sí misma el rol y el alcance ---

select ok(
  has_function_privilege('authenticated', to_regprocedure('public.tomar_novedad(uuid)'), 'execute'),
  'RF-10: authenticated puede ejecutar tomar_novedad'
);
select ok(
  not has_function_privilege('anon', to_regprocedure('public.tomar_novedad(uuid)'), 'execute'),
  'RNF-11: anon no puede ejecutar tomar_novedad'
);
select ok(
  has_function_privilege('authenticated', to_regprocedure('public.rechazar_novedad(uuid, text)'), 'execute'),
  'RF-11: authenticated puede ejecutar rechazar_novedad'
);
select ok(
  not has_function_privilege('anon', to_regprocedure('public.rechazar_novedad(uuid, text)'), 'execute'),
  'RNF-11: anon no puede ejecutar rechazar_novedad'
);
select ok(
  has_function_privilege('authenticated', to_regprocedure('public.reasignar_novedad(uuid, uuid, text)'), 'execute'),
  'RF-17: authenticated puede ejecutar reasignar_novedad'
);
select ok(
  not has_function_privilege('anon', to_regprocedure('public.reasignar_novedad(uuid, uuid, text)'), 'execute'),
  'RNF-11: anon no puede ejecutar reasignar_novedad'
);
select ok(
  has_function_privilege('authenticated', to_regprocedure('public.escalar_novedad(uuid, text)'), 'execute'),
  'RF-12: authenticated puede ejecutar escalar_novedad'
);
select ok(
  not has_function_privilege('anon', to_regprocedure('public.escalar_novedad(uuid, text)'), 'execute'),
  'RNF-11: anon no puede ejecutar escalar_novedad'
);
select ok(
  has_function_privilege(
    'authenticated', to_regprocedure('public.registrar_solucion(uuid, text, date, uuid, text)'), 'execute'
  ),
  'RF-14: authenticated puede ejecutar registrar_solucion'
);
select ok(
  not has_function_privilege(
    'anon', to_regprocedure('public.registrar_solucion(uuid, text, date, uuid, text)'), 'execute'
  ),
  'RNF-11: anon no puede ejecutar registrar_solucion'
);
select ok(
  has_function_privilege('authenticated', to_regprocedure('public.sugerir_tipos_falla(text)'), 'execute'),
  'RF-14: authenticated puede ejecutar sugerir_tipos_falla'
);
select ok(
  not has_function_privilege('anon', to_regprocedure('public.sugerir_tipos_falla(text)'), 'execute'),
  'RNF-11: anon no puede ejecutar sugerir_tipos_falla'
);

select * from finish();
rollback;
