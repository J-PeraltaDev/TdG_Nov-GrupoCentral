-- Sprint 0 (RNF-14): extensiones, esquema privado y tipos enumerados.
begin;

create extension if not exists pgtap with schema extensions;

select plan(11);

-- Extensiones
select has_extension('unaccent'::name, 'S0: la extensión unaccent está instalada'::text);
select has_extension('pg_net'::name, 'S0: la extensión pg_net está instalada'::text);
select is(
  (
    select n.nspname::text
    from pg_extension e
    join pg_namespace n on n.oid = e.extnamespace
    where e.extname = 'unaccent'
  ),
  'extensions',
  'S0: unaccent vive en el esquema extensions, no en public'
);

-- Esquema privado
select has_schema('private'::name, 'S0: existe el esquema private'::text);
select ok(
  not has_schema_privilege('anon', 'private', 'usage'),
  'S0: anon no tiene acceso al esquema private'
);
select ok(
  not has_schema_privilege('anon', 'private', 'create'),
  'S0: anon no puede crear objetos en el esquema private'
);

-- Tipos enumerados (SDD 6.1.1)
select has_enum('public'::name, 'estado_novedad'::name, 'S0: existe el tipo estado_novedad'::text);
select enum_has_labels(
  'public',
  'estado_novedad',
  array[
    'registrada',
    'asignada',
    'en_atencion',
    'escalada',
    'aprobada',
    'rechazada',
    'resuelta',
    'cerrada'
  ],
  'S0: estado_novedad tiene los 8 estados del SDD (Tabla 28), en orden'
);
select enum_has_labels(
  'public',
  'prioridad_novedad',
  array['critico', 'alto', 'normal', 'bajo'],
  'S0: prioridad_novedad se declara en el orden de la bandeja (RF-09)'
);
select ok(
  'critico'::public.prioridad_novedad < 'bajo'::public.prioridad_novedad,
  'S0: el orden natural de prioridad_novedad pone critico antes que bajo'
);
select enum_has_labels(
  'public',
  'accion_auditoria',
  array['renombrar', 'fusionar', 'desactivar'],
  'S0: accion_auditoria tiene las tres acciones de RF-32'
);

select * from finish();
rollback;
