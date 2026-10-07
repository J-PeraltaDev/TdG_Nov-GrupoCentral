-- RF-16 / CU-16 · Estructura del modelo de datos (SDD 6.1.1, Tablas 26 y 27).
begin;

create extension if not exists pgtap with schema extensions;

select plan(44);

-- Las 13 tablas de la Tabla 26
select has_table('public'::name, 'razon_social'::name, 'RF-16: existe la tabla razon_social'::text);
select has_table('public'::name, 'finca'::name, 'RF-16: existe la tabla finca'::text);
select has_table('public'::name, 'area'::name, 'RF-16: existe la tabla area'::text);
select has_table('public'::name, 'rol'::name, 'RF-16: existe la tabla rol'::text);
select has_table('public'::name, 'usuario'::name, 'RF-16: existe la tabla usuario'::text);
select has_table('public'::name, 'solicitud_recuperacion'::name, 'RF-16: existe la tabla solicitud_recuperacion'::text);
select has_table('public'::name, 'suscripcion_push'::name, 'RF-16: existe la tabla suscripcion_push'::text);
select has_table('public'::name, 'novedad'::name, 'RF-16: existe la tabla novedad'::text);
select has_table('public'::name, 'evidencia'::name, 'RF-16: existe la tabla evidencia'::text);
select has_table('public'::name, 'historial_transicion'::name, 'RF-16: existe la tabla historial_transicion'::text);
select has_table('public'::name, 'tipo_falla'::name, 'RF-16: existe la tabla tipo_falla'::text);
select has_table('public'::name, 'auditoria_tipo_falla'::name, 'RF-16: existe la tabla auditoria_tipo_falla'::text);
select has_table('public'::name, 'notificacion'::name, 'RF-16: existe la tabla notificacion'::text);

-- RNF-11: RLS habilitado en todas las tablas de public
select is(
  (
    select count(*)::int
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relkind = 'r' and c.relrowsecurity
  ),
  13,
  'RNF-11: las 13 tablas tienen RLS habilitado'
);
select is(
  (
    select count(*)::int
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relkind = 'r' and not c.relrowsecurity
  ),
  0,
  'RNF-11: no queda ninguna tabla de public sin RLS'
);

-- Tipos de las columnas que el SDD fija
select col_type_is('public'::name, 'novedad'::name, 'codigo'::name, 'bigint', 'RF-06: novedad.codigo es bigint');
select col_type_is('public'::name, 'historial_transicion'::name, 'id'::name, 'bigint', 'RF-16: historial_transicion.id es bigint secuencial');
select col_type_is('public'::name, 'novedad'::name, 'fecha_registro'::name, 'timestamp with time zone', 'RNF-09: novedad.fecha_registro es timestamptz');
select col_type_is('public'::name, 'novedad'::name, 'fecha_sincronizacion'::name, 'timestamp with time zone', 'RNF-09: novedad.fecha_sincronizacion es timestamptz');
select col_type_is('public'::name, 'novedad'::name, 'actualizado_en'::name, 'timestamp with time zone', 'RF-16: novedad.actualizado_en es timestamptz');
select col_type_is('public'::name, 'rol'::name, 'id'::name, 'smallint', 'RF-03: rol.id es smallint');

-- Restricciones de unicidad
select col_is_unique('public'::name, 'novedad'::name, 'codigo'::name, 'RF-06: novedad.codigo es único');
select col_is_unique('public'::name, 'novedad'::name, 'id_local'::name, 'RNF-08: novedad.id_local es único');
select col_is_unique('public'::name, 'usuario'::name, 'correo'::name, 'RF-03: usuario.correo es único');
select col_is_unique('public'::name, 'suscripcion_push'::name, 'endpoint'::name, 'RF-31: suscripcion_push.endpoint es único');
select col_is_unique('public'::name, 'tipo_falla'::name, 'nombre_normalizado'::name, 'RF-14: tipo_falla.nombre_normalizado es único');
select col_is_unique('public'::name, 'finca'::name, array['razon_social_id', 'nombre']::name[], 'RF-04: la finca es única por razón social y nombre');

-- Índices de la Tabla 27
select has_index('public'::name, 'novedad'::name, 'novedad_bandeja_idx'::name, array['area_id', 'estado', 'prioridad', 'fecha_registro']::name[], 'RF-09: índice de la bandeja del área');
select has_index('public'::name, 'novedad'::name, 'novedad_finca_estado_idx'::name, array['finca_id', 'estado']::name[], 'RF-18: índice de Mis novedades');
select has_index('public'::name, 'novedad'::name, 'novedad_fecha_registro_idx'::name, array['fecha_registro']::name[], 'RF-19: índice del historial por período');
select has_index('public'::name, 'novedad'::name, 'novedad_tipo_falla_id_idx'::name, array['tipo_falla_id']::name[], 'RF-29: índice de la matriz de recurrencia');
select has_index('public'::name, 'historial_transicion'::name, 'historial_transicion_novedad_idx'::name, array['novedad_id', 'id']::name[], 'RF-18: índice de la línea de tiempo');
select has_index('public'::name, 'historial_transicion'::name, 'historial_transicion_estado_fecha_idx'::name, array['estado_nuevo', 'fecha_hora']::name[], 'RF-27: índice de tiempos de atención');
select has_index('public'::name, 'notificacion'::name, 'notificacion_destinatario_idx'::name, array['destinatario_id', 'leida', 'creada_en']::name[], 'RF-30: índice de los avisos sin leer');

-- Vistas con security_invoker (respetan las políticas de quien consulta)
select is(
  (
    select count(*)::int
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relkind = 'v'
      and c.relname in ('v_novedad', 'usuario_publico')
      and c.reloptions @> array['security_invoker=true']
  ),
  2,
  'RNF-11: v_novedad y usuario_publico se declaran con security_invoker'
);

-- Funciones auxiliares en private y contrato de registrar_novedad
select is(
  (
    select count(*)::int
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'private'
      and p.proname in ('fn_activo', 'fn_rol', 'fn_finca', 'fn_area', 'puede_ver_novedad')
      and p.prosecdef
      and p.provolatile = 's'
      and p.proconfig @> array['search_path=""']
  ),
  5,
  'RNF-11: las 5 auxiliares de RLS están en private, son stable, security definer y fijan search_path'
);
select is(
  (
    select count(*)::int
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.prosecdef
      and not (p.proconfig @> array['search_path=""'])
  ),
  0,
  'RNF-11: ninguna función security definer de public deja el search_path abierto'
);
select has_function(
  'public'::name,
  'registrar_novedad'::name,
  array['uuid', 'text', 'public.prioridad_novedad', 'uuid', 'timestamp with time zone']::name[],
  'RF-05: registrar_novedad tiene la firma de la Tabla 21'
);
select ok(
  has_function_privilege(
    'authenticated',
    'public.registrar_novedad(uuid, text, public.prioridad_novedad, uuid, timestamptz)',
    'execute'
  ),
  'RF-05: authenticated puede ejecutar registrar_novedad'
);
select ok(
  not has_function_privilege(
    'anon',
    'public.registrar_novedad(uuid, text, public.prioridad_novedad, uuid, timestamptz)',
    'execute'
  ),
  'RNF-11: anon no puede ejecutar registrar_novedad'
);
select is(
  (
    select count(*)::int
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname in ('public', 'private')
      and has_function_privilege('anon', p.oid, 'execute')
  ),
  0,
  'RNF-11: anon no puede ejecutar ninguna función de public ni de private'
);

-- anon no tiene ningún privilegio sobre las tablas ni las vistas
select is(
  (
    select count(*)::int
    from information_schema.role_table_grants g
    where g.table_schema = 'public' and g.grantee = 'anon'
  ),
  0,
  'RNF-11: anon no tiene privilegios sobre las tablas ni las vistas de public'
);

-- Catálogos fijos
select results_eq(
  'select id::int, nombre from public.rol order by id',
  $$ values (1, 'reportante'), (2, 'aprobador_area'), (3, 'director_agricultura'), (4, 'administrador') $$,
  'RF-03: el catálogo rol tiene los 4 roles fijos'
);
select results_eq(
  'select nombre from public.area where activo order by nombre',
  $$ values ('Mantenimiento'), ('Sistemas') $$,
  'RF-05: el catálogo area tiene Mantenimiento y Sistemas'
);

select * from finish();
rollback;
