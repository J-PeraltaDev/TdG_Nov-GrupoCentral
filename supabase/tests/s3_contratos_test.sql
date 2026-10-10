-- Sprint 3 · contratos de las funciones del sprint (SDD 5.3.2, Tabla 21, y lo que la precisa
-- en docs/cambios-sdd.md).
-- Verifica la forma de cada función (firma, nombres de los parámetros, resultado, seguridad y
-- privilegios), no su comportamiento: estas aserciones valen igual con el cuerpo
-- NO_IMPLEMENTADO del contrato y con la función ya implementada.
begin;

create extension if not exists pgtap with schema extensions;

select plan(41);

-- Firmas ---------------------------------------------------------------------------------

select has_function(
  'public'::name, 'decidir_escalamiento'::name, array['uuid', 'boolean', 'text']::name[],
  'RF-13: decidir_escalamiento tiene la firma de la Tabla 21'
);
select has_function(
  'public'::name, 'confirmar_resolucion'::name, array['uuid', 'text']::name[],
  'RF-15: confirmar_resolucion tiene la firma de la Tabla 21'
);
select has_function(
  'public'::name, 'reportar_falla_persiste'::name, array['uuid', 'text']::name[],
  'RF-15: reportar_falla_persiste tiene la firma de la Tabla 21'
);
select has_function(
  'public'::name, 'solicitar_recuperacion'::name, array['text']::name[],
  'RF-02: solicitar_recuperacion tiene la firma de la Tabla 21'
);
select has_function(
  'public'::name, 'generar_codigo_recuperacion'::name, array['uuid']::name[],
  'RF-02: generar_codigo_recuperacion tiene la firma de la Tabla 21'
);
select has_function(
  'public'::name, 'listar_usuarios'::name, array[]::name[],
  'RF-03: listar_usuarios existe y no recibe parámetros'
);
select has_function(
  'public'::name, 'consumir_codigo_recuperacion'::name, array['text', 'text']::name[],
  'RF-02: consumir_codigo_recuperacion recibe el correo y el código'
);

-- Nombres de los parámetros: la API los recibe por nombre, así que son parte del contrato ---

select is(
  (select p.proargnames from pg_proc p where p.oid = to_regprocedure('public.decidir_escalamiento(uuid, boolean, text)')),
  array['p_novedad_id', 'p_aprobar', 'p_observacion'],
  'RF-13: decidir_escalamiento recibe p_novedad_id, p_aprobar y p_observacion'
);
select is(
  (select p.pronargdefaults::int from pg_proc p where p.oid = to_regprocedure('public.decidir_escalamiento(uuid, boolean, text)')),
  1,
  'RF-13 / CU-13: la observación es opcional en la firma (obligatoria solo al rechazar)'
);
select is(
  (select p.proargnames from pg_proc p where p.oid = to_regprocedure('public.confirmar_resolucion(uuid, text)')),
  array['p_novedad_id', 'p_observacion'],
  'RF-15: confirmar_resolucion recibe p_novedad_id y p_observacion'
);
select is(
  (select p.pronargdefaults::int from pg_proc p where p.oid = to_regprocedure('public.confirmar_resolucion(uuid, text)')),
  1,
  'RF-15 / CU-15 3: la observación de confirmar_resolucion es opcional'
);
select is(
  (select p.proargnames from pg_proc p where p.oid = to_regprocedure('public.reportar_falla_persiste(uuid, text)')),
  array['p_novedad_id', 'p_observacion'],
  'RF-15: reportar_falla_persiste recibe p_novedad_id y p_observacion'
);
select is(
  (select p.pronargdefaults::int from pg_proc p where p.oid = to_regprocedure('public.reportar_falla_persiste(uuid, text)')),
  0,
  'RF-15 / CU-15 3b: la observación de reportar_falla_persiste es obligatoria'
);
select is(
  (select p.proargnames from pg_proc p where p.oid = to_regprocedure('public.solicitar_recuperacion(text)')),
  array['p_correo'],
  'RF-02: solicitar_recuperacion recibe p_correo'
);
select is(
  (select p.proargnames from pg_proc p where p.oid = to_regprocedure('public.generar_codigo_recuperacion(uuid)')),
  array['p_solicitud_id', 'codigo', 'expira_en'],
  'RF-02: generar_codigo_recuperacion recibe p_solicitud_id y devuelve codigo y expira_en'
);
select is(
  (select p.proargnames from pg_proc p where p.oid = to_regprocedure('public.consumir_codigo_recuperacion(text, text)')),
  array['p_correo', 'p_codigo', 'resultado', 'usuario_id'],
  'RF-02: consumir_codigo_recuperacion devuelve resultado y usuario_id'
);

-- Resultados -----------------------------------------------------------------------------

select is(
  (
    select count(*)::int
    from pg_proc p
    where p.oid in (
        to_regprocedure('public.decidir_escalamiento(uuid, boolean, text)'),
        to_regprocedure('public.confirmar_resolucion(uuid, text)'),
        to_regprocedure('public.reportar_falla_persiste(uuid, text)')
      )
      and p.prorettype = 'public.novedad'::regtype
      and not p.proretset
  ),
  3,
  'RF-16: las tres transiciones devuelven la novedad actualizada'
);
select is(
  (select p.prorettype::regtype::text from pg_proc p where p.oid = to_regprocedure('public.solicitar_recuperacion(text)')),
  'void',
  'RF-02 / CU-02 4a: solicitar_recuperacion no devuelve nada, exista o no el correo'
);
select is(
  (select p.proallargtypes::regtype[]::text[] from pg_proc p where p.oid = to_regprocedure('public.generar_codigo_recuperacion(uuid)')),
  array['uuid', 'text', 'timestamp with time zone'],
  'RF-02: generar_codigo_recuperacion devuelve el código como texto y cuándo vence'
);
select is(
  (select p.proargnames from pg_proc p where p.oid = to_regprocedure('public.listar_usuarios()')),
  array[
    'id', 'nombre', 'correo', 'rol_id', 'finca_id', 'area_id', 'activo', 'creado_en',
    'ultimo_ingreso'
  ],
  'RF-03: listar_usuarios devuelve el perfil con el correo y el último ingreso'
);
select is(
  (select p.proallargtypes::regtype[]::text[] from pg_proc p where p.oid = to_regprocedure('public.listar_usuarios()')),
  array[
    'uuid', 'text', 'text', 'smallint', 'uuid', 'uuid', 'boolean', 'timestamp with time zone',
    'timestamp with time zone'
  ],
  'RF-03: las columnas de listar_usuarios tienen los tipos de la tabla usuario'
);
select ok(
  (select p.proretset from pg_proc p where p.oid = to_regprocedure('public.listar_usuarios()')),
  'RF-03: listar_usuarios devuelve un conjunto de filas'
);
select is(
  (select p.provolatile::text from pg_proc p where p.oid = to_regprocedure('public.listar_usuarios()')),
  's',
  'RF-03: listar_usuarios es stable (solo lee)'
);
select is(
  (select p.proallargtypes::regtype[]::text[] from pg_proc p where p.oid = to_regprocedure('public.consumir_codigo_recuperacion(text, text)')),
  array['text', 'text', 'text', 'uuid'],
  'RF-02: consumir_codigo_recuperacion devuelve un texto y el uuid del usuario'
);

-- Seguridad ------------------------------------------------------------------------------

select is(
  (
    select count(*)::int
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname in (
        'decidir_escalamiento', 'confirmar_resolucion', 'reportar_falla_persiste',
        'solicitar_recuperacion', 'generar_codigo_recuperacion', 'listar_usuarios',
        'consumir_codigo_recuperacion'
      )
  ),
  7,
  'Sprint 3: ninguna de las siete funciones tiene sobrecargas'
);
select is(
  (
    select count(*)::int
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname in (
        'decidir_escalamiento', 'confirmar_resolucion', 'reportar_falla_persiste',
        'solicitar_recuperacion', 'generar_codigo_recuperacion', 'listar_usuarios',
        'consumir_codigo_recuperacion'
      )
      and p.prosecdef
      and p.proconfig @> array['search_path=""']
  ),
  7,
  'RNF-11: las siete son security definer y fijan el search_path vacío'
);

-- Privilegios ----------------------------------------------------------------------------
-- Con sesión: cada función verifica por sí misma el rol y el alcance.

select ok(
  has_function_privilege('authenticated', to_regprocedure('public.decidir_escalamiento(uuid, boolean, text)'), 'execute'),
  'RF-13: authenticated puede ejecutar decidir_escalamiento'
);
select ok(
  not has_function_privilege('anon', to_regprocedure('public.decidir_escalamiento(uuid, boolean, text)'), 'execute'),
  'RNF-11: anon no puede ejecutar decidir_escalamiento'
);
select ok(
  has_function_privilege('authenticated', to_regprocedure('public.confirmar_resolucion(uuid, text)'), 'execute'),
  'RF-15: authenticated puede ejecutar confirmar_resolucion'
);
select ok(
  not has_function_privilege('anon', to_regprocedure('public.confirmar_resolucion(uuid, text)'), 'execute'),
  'RNF-11: anon no puede ejecutar confirmar_resolucion'
);
select ok(
  has_function_privilege('authenticated', to_regprocedure('public.reportar_falla_persiste(uuid, text)'), 'execute'),
  'RF-15: authenticated puede ejecutar reportar_falla_persiste'
);
select ok(
  not has_function_privilege('anon', to_regprocedure('public.reportar_falla_persiste(uuid, text)'), 'execute'),
  'RNF-11: anon no puede ejecutar reportar_falla_persiste'
);
select ok(
  has_function_privilege('authenticated', to_regprocedure('public.generar_codigo_recuperacion(uuid)'), 'execute'),
  'RF-02: authenticated puede ejecutar generar_codigo_recuperacion'
);
select ok(
  not has_function_privilege('anon', to_regprocedure('public.generar_codigo_recuperacion(uuid)'), 'execute'),
  'RNF-11: anon no puede ejecutar generar_codigo_recuperacion'
);
select ok(
  has_function_privilege('authenticated', to_regprocedure('public.listar_usuarios()'), 'execute'),
  'RF-03: authenticated puede ejecutar listar_usuarios'
);
select ok(
  not has_function_privilege('anon', to_regprocedure('public.listar_usuarios()'), 'execute'),
  'RNF-18: anon no puede ejecutar listar_usuarios'
);

-- Sin sesión: la única función que anon puede ejecutar (ADR 0013).

select ok(
  has_function_privilege('anon', to_regprocedure('public.solicitar_recuperacion(text)'), 'execute'),
  'RF-02 / CU-02 1: anon puede ejecutar solicitar_recuperacion (Tabla 21: «Sin sesión»)'
);
select ok(
  has_function_privilege('authenticated', to_regprocedure('public.solicitar_recuperacion(text)'), 'execute'),
  'RF-02: authenticated también puede ejecutar solicitar_recuperacion'
);
select is(
  (
    select array_agg(p.proname::text order by p.proname)
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.prosecdef
      and has_function_privilege('anon', p.oid, 'execute')
  ),
  array['solicitar_recuperacion'],
  'RNF-11: es la única función security definer de public que anon puede ejecutar'
);

-- Solo las Edge Functions, con la clave secreta: el resumen del código no sale de la base.

select ok(
  has_function_privilege('service_role', to_regprocedure('public.consumir_codigo_recuperacion(text, text)'), 'execute'),
  'RF-02: service_role puede ejecutar consumir_codigo_recuperacion'
);
select ok(
  not has_function_privilege('authenticated', to_regprocedure('public.consumir_codigo_recuperacion(text, text)'), 'execute')
  and not has_function_privilege('anon', to_regprocedure('public.consumir_codigo_recuperacion(text, text)'), 'execute'),
  'RNF-11: ni authenticated ni anon pueden ejecutar consumir_codigo_recuperacion'
);

select * from finish();
rollback;
