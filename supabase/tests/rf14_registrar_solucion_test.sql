-- RF-14 / CU-14 · registrar_solucion, sugerir_tipos_falla y el catálogo de tipos de falla
-- (SDD 6.1.3, Tablas 29 y 30, y 6.1.8).
-- Se prueba a través del RPC, con el rol y el JWT de cada usuario. Los datos se crean dentro
-- de la transacción, con nombres propios («Zz pgTAP…», «Zzq pgTAP…»), y no dependen del seed.
begin;

create extension if not exists pgtap with schema extensions;

select plan(82);

-- Datos de la prueba (como propietario) ------------------------------------------------

insert into public.razon_social (id, nombre)
values ('a5000000-0000-4000-8000-0000000000a1', 'RS pgTAP solución');

insert into public.finca (id, razon_social_id, nombre)
values
  ('a5000000-0000-4000-8000-0000000000f1', 'a5000000-0000-4000-8000-0000000000a1', 'Finca pgTAP solución A'),
  ('a5000000-0000-4000-8000-0000000000f2', 'a5000000-0000-4000-8000-0000000000a1', 'Finca pgTAP solución B');

insert into public.area (id, nombre)
values
  ('a5000000-0000-4000-8000-0000000000b1', 'Área pgTAP solución'),
  ('a5000000-0000-4000-8000-0000000000b2', 'Área pgTAP solución vecina');

insert into auth.users (instance_id, id, aud, role, email)
select '00000000-0000-0000-0000-000000000000', id, 'authenticated', 'authenticated', correo
from (
  values
    ('a5000000-0000-4000-8000-000000000001'::uuid, 'reportante@solucion.pgtap.test'),
    ('a5000000-0000-4000-8000-000000000002'::uuid, 'aprobador@solucion.pgtap.test'),
    ('a5000000-0000-4000-8000-000000000003'::uuid, 'aprobador.colega@solucion.pgtap.test'),
    ('a5000000-0000-4000-8000-000000000004'::uuid, 'aprobador.vecino@solucion.pgtap.test'),
    ('a5000000-0000-4000-8000-000000000005'::uuid, 'aprobador.inactivo@solucion.pgtap.test'),
    ('a5000000-0000-4000-8000-000000000006'::uuid, 'director@solucion.pgtap.test'),
    ('a5000000-0000-4000-8000-000000000007'::uuid, 'administrador@solucion.pgtap.test'),
    ('a5000000-0000-4000-8000-000000000008'::uuid, 'sin.perfil@solucion.pgtap.test'),
    ('a5000000-0000-4000-8000-000000000009'::uuid, 'reportante.inactivo@solucion.pgtap.test'),
    ('a5000000-0000-4000-8000-00000000000a'::uuid, 'administrador.dos@solucion.pgtap.test'),
    ('a5000000-0000-4000-8000-00000000000b'::uuid, 'administrador.inactivo@solucion.pgtap.test')
) as u (id, correo);

insert into public.usuario (id, nombre, correo, rol_id, finca_id, area_id, activo)
values
  ('a5000000-0000-4000-8000-000000000001', 'Reportante', 'reportante@solucion.pgtap.test', 1, 'a5000000-0000-4000-8000-0000000000f1', null, true),
  ('a5000000-0000-4000-8000-000000000002', 'Aprobador', 'aprobador@solucion.pgtap.test', 2, null, 'a5000000-0000-4000-8000-0000000000b1', true),
  ('a5000000-0000-4000-8000-000000000003', 'Aprobador colega', 'aprobador.colega@solucion.pgtap.test', 2, null, 'a5000000-0000-4000-8000-0000000000b1', true),
  ('a5000000-0000-4000-8000-000000000004', 'Aprobador vecino', 'aprobador.vecino@solucion.pgtap.test', 2, null, 'a5000000-0000-4000-8000-0000000000b2', true),
  ('a5000000-0000-4000-8000-000000000005', 'Aprobador inactivo', 'aprobador.inactivo@solucion.pgtap.test', 2, null, 'a5000000-0000-4000-8000-0000000000b1', false),
  ('a5000000-0000-4000-8000-000000000006', 'Director', 'director@solucion.pgtap.test', 3, null, null, true),
  ('a5000000-0000-4000-8000-000000000007', 'Administrador', 'administrador@solucion.pgtap.test', 4, null, null, true),
  ('a5000000-0000-4000-8000-000000000009', 'Reportante inactivo', 'reportante.inactivo@solucion.pgtap.test', 1, 'a5000000-0000-4000-8000-0000000000f2', null, false),
  ('a5000000-0000-4000-8000-00000000000a', 'Administrador dos', 'administrador.dos@solucion.pgtap.test', 4, null, null, true),
  ('a5000000-0000-4000-8000-00000000000b', 'Administrador inactivo', 'administrador.inactivo@solucion.pgtap.test', 4, null, null, false);

-- Tipos de falla. c1, activo. c2, desactivado. c3, fusionado en c1. c4, fusionado en c3 (una
-- cadena que termina en c1). c5, fusionado en c2, que después se desactivó.
insert into public.tipo_falla (id, nombre, nombre_normalizado, activo, creado_por)
values
  ('a5000000-0000-4000-8000-0000000000c1', 'Zz pgTAP Puentes', 'zz pgtap puentes', true, 'a5000000-0000-4000-8000-000000000007'),
  ('a5000000-0000-4000-8000-0000000000c2', 'Zz pgTAP Desactivado', 'zz pgtap desactivado', false, 'a5000000-0000-4000-8000-000000000007'),
  ('a5000000-0000-4000-8000-0000000000c3', 'Zz pgTAP Fusionado', 'zz pgtap fusionado', false, 'a5000000-0000-4000-8000-000000000007'),
  ('a5000000-0000-4000-8000-0000000000c4', 'Zz pgTAP Cadena', 'zz pgtap cadena', false, 'a5000000-0000-4000-8000-000000000007'),
  ('a5000000-0000-4000-8000-0000000000c5', 'Zz pgTAP Sin destino', 'zz pgtap sin destino', false, 'a5000000-0000-4000-8000-000000000007');

insert into public.auditoria_tipo_falla (tipo_falla_id, tipo_destino_id, usuario_id, accion, valor_anterior, fecha)
values
  ('a5000000-0000-4000-8000-0000000000c2', null, 'a5000000-0000-4000-8000-000000000007', 'desactivar', null, '2026-09-01 08:00:00-05'),
  -- c3 se fusionó primero en c2 por error y después en c1: vale la última fusión.
  ('a5000000-0000-4000-8000-0000000000c3', 'a5000000-0000-4000-8000-0000000000c2', 'a5000000-0000-4000-8000-000000000007', 'fusionar', 'Zz pgTAP Fusionado', '2026-09-01 09:00:00-05'),
  ('a5000000-0000-4000-8000-0000000000c3', 'a5000000-0000-4000-8000-0000000000c1', 'a5000000-0000-4000-8000-000000000007', 'fusionar', 'Zz pgTAP Fusionado', '2026-09-02 09:00:00-05'),
  ('a5000000-0000-4000-8000-0000000000c4', 'a5000000-0000-4000-8000-0000000000c3', 'a5000000-0000-4000-8000-000000000007', 'fusionar', 'Zz pgTAP Cadena', '2026-09-01 10:00:00-05'),
  ('a5000000-0000-4000-8000-0000000000c5', 'a5000000-0000-4000-8000-0000000000c2', 'a5000000-0000-4000-8000-000000000007', 'fusionar', 'Zz pgTAP Sin destino', '2026-09-01 11:00:00-05');

-- Tipos para las sugerencias: diez activos que contienen «zzq pgtap sug» y uno desactivado.
insert into public.tipo_falla (id, nombre, nombre_normalizado, activo, creado_por)
select
  ('a5000000-0000-4000-8000-00000000c1' || lpad(n::text, 2, '0'))::uuid,
  case when n = 0 then 'Zzq pgTAP Súg' else 'Zzq pgTAP Súg ' || lpad(n::text, 2, '0') end,
  case when n = 0 then 'zzq pgtap sug' else 'zzq pgtap sug ' || lpad(n::text, 2, '0') end,
  n <> 10,
  'a5000000-0000-4000-8000-000000000007'
from generate_series(0, 10) as n;

-- Una novedad por caso, todas del área salvo d5. d0 a d4, d6 a d9: en atención. d2: aprobada.
insert into public.novedad (
  id, id_local, finca_id, area_id, reportante_id, descripcion, prioridad, estado,
  fecha_registro, actualizado_en, tipo_falla_id, solucion, fecha_ejecucion
)
select
  ('a5000000-0000-4000-8000-0000000000d' || n.sufijo)::uuid,
  ('a5000000-0000-4000-8000-0000000000e' || n.sufijo)::uuid,
  n.finca::uuid,
  n.area::uuid,
  n.reportante::uuid,
  'Novedad pgTAP solución ' || n.sufijo,
  'alto',
  n.estado::public.estado_novedad,
  '2026-09-01 08:00:00-05',
  '2026-09-01 08:00:00-05',
  case when n.estado in ('resuelta', 'cerrada') then 'a5000000-0000-4000-8000-0000000000c1'::uuid end,
  case when n.estado in ('resuelta', 'cerrada') then 'Solución de prueba' end,
  case when n.estado in ('resuelta', 'cerrada') then date '2026-09-02' end
from (
  values
    ('0', 'en_atencion', 'a5000000-0000-4000-8000-0000000000f1', 'a5000000-0000-4000-8000-0000000000b1', 'a5000000-0000-4000-8000-000000000001'),
    ('1', 'en_atencion', 'a5000000-0000-4000-8000-0000000000f1', 'a5000000-0000-4000-8000-0000000000b1', 'a5000000-0000-4000-8000-000000000001'),
    ('2', 'aprobada', 'a5000000-0000-4000-8000-0000000000f1', 'a5000000-0000-4000-8000-0000000000b1', 'a5000000-0000-4000-8000-000000000001'),
    ('3', 'en_atencion', 'a5000000-0000-4000-8000-0000000000f1', 'a5000000-0000-4000-8000-0000000000b1', 'a5000000-0000-4000-8000-000000000001'),
    ('4', 'en_atencion', 'a5000000-0000-4000-8000-0000000000f1', 'a5000000-0000-4000-8000-0000000000b1', 'a5000000-0000-4000-8000-000000000001'),
    ('5', 'en_atencion', 'a5000000-0000-4000-8000-0000000000f1', 'a5000000-0000-4000-8000-0000000000b2', 'a5000000-0000-4000-8000-000000000001'),
    ('6', 'en_atencion', 'a5000000-0000-4000-8000-0000000000f2', 'a5000000-0000-4000-8000-0000000000b1', 'a5000000-0000-4000-8000-000000000009'),
    ('7', 'en_atencion', 'a5000000-0000-4000-8000-0000000000f1', 'a5000000-0000-4000-8000-0000000000b1', 'a5000000-0000-4000-8000-000000000001'),
    ('8', 'en_atencion', 'a5000000-0000-4000-8000-0000000000f1', 'a5000000-0000-4000-8000-0000000000b1', 'a5000000-0000-4000-8000-000000000001'),
    ('9', 'en_atencion', 'a5000000-0000-4000-8000-0000000000f1', 'a5000000-0000-4000-8000-0000000000b1', 'a5000000-0000-4000-8000-000000000001'),
    ('a', 'asignada', 'a5000000-0000-4000-8000-0000000000f1', 'a5000000-0000-4000-8000-0000000000b1', 'a5000000-0000-4000-8000-000000000001'),
    ('b', 'escalada', 'a5000000-0000-4000-8000-0000000000f1', 'a5000000-0000-4000-8000-0000000000b1', 'a5000000-0000-4000-8000-000000000001'),
    ('c', 'resuelta', 'a5000000-0000-4000-8000-0000000000f1', 'a5000000-0000-4000-8000-0000000000b1', 'a5000000-0000-4000-8000-000000000001'),
    ('d', 'rechazada', 'a5000000-0000-4000-8000-0000000000f1', 'a5000000-0000-4000-8000-0000000000b1', 'a5000000-0000-4000-8000-000000000001'),
    ('e', 'cerrada', 'a5000000-0000-4000-8000-0000000000f1', 'a5000000-0000-4000-8000-0000000000b1', 'a5000000-0000-4000-8000-000000000001'),
    ('f', 'registrada', 'a5000000-0000-4000-8000-0000000000f1', 'a5000000-0000-4000-8000-0000000000b1', 'a5000000-0000-4000-8000-000000000001')
) as n (sufijo, estado, finca, area, reportante);

-- Novedades cerradas del área vecina, para que tres sugerencias tengan conteo: «Súg 01»,
-- tres; «Súg 02», dos; «Súg 03», una.
insert into public.novedad (
  id_local, finca_id, area_id, reportante_id, descripcion, prioridad, estado,
  fecha_registro, tipo_falla_id, solucion, fecha_ejecucion
)
select
  gen_random_uuid(),
  'a5000000-0000-4000-8000-0000000000f1',
  'a5000000-0000-4000-8000-0000000000b2',
  'a5000000-0000-4000-8000-000000000001',
  'Novedad pgTAP conteo',
  'bajo',
  'cerrada',
  '2026-08-01 08:00:00-05',
  ('a5000000-0000-4000-8000-00000000c1' || lpad(t.n::text, 2, '0'))::uuid,
  'Solución de prueba',
  date '2026-08-02'
from (values (1), (1), (1), (2), (2), (3)) as t (n);

-- La normalización (SDD 6.1.8) --------------------------------------------------------------

select is(
  private.normalizar_tipo_falla(E'  BIOMÉTRICO \t de   la\nENTRADA  '),
  'biometrico de la entrada',
  'RF-14: normalizar deja minúsculas, sin tildes, sin espacios en los extremos y con espacios simples'
);
select is(
  private.normalizar_tipo_falla('Señalización'),
  'senalizacion',
  'RF-14: normalizar quita las tildes y la virgulilla, como unaccent'
);
select is(private.normalizar_tipo_falla(null), '', 'RF-14: normalizar de un nulo es el texto vacío');
select ok(
  (
    select count(*) = 2
      and bool_and(not p.prosecdef)
      and bool_and(p.proconfig @> array['search_path=""'])
      and bool_and(not has_function_privilege('authenticated', p.oid, 'execute'))
      and bool_and(not has_function_privilege('anon', p.oid, 'execute'))
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'private' and p.proname in ('normalizar_tipo_falla', 'resolver_tipo_falla')
  ),
  'RNF-11: normalizar_tipo_falla y resolver_tipo_falla están en private, fijan search_path, no son security definer y no las ejecutan authenticated ni anon'
);
select is(
  (select p.provolatile::text from pg_proc p where p.oid = 'private.normalizar_tipo_falla(text)'::regprocedure),
  'i',
  'RF-14: normalizar_tipo_falla es immutable'
);

-- CU-14 · curso normal con un tipo nuevo -------------------------------------------------------

set local role authenticated;
set local request.jwt.claims = '{"sub": "a5000000-0000-4000-8000-000000000002", "role": "authenticated"}';

select results_eq(
  $$ select r.id, r.estado::text, r.solucion, r.fecha_ejecucion
     from public.registrar_solucion(
       'a5000000-0000-4000-8000-0000000000d1',
       '  Se actualizó el firmware del biométrico.  ',
       (now() at time zone 'America/Bogota')::date,
       null,
       '  Zz   pgTAP Biométrico '
     ) as r $$,
  $$ values ('a5000000-0000-4000-8000-0000000000d1'::uuid, 'resuelta',
             'Se actualizó el firmware del biométrico.', (now() at time zone 'America/Bogota')::date) $$,
  'RF-14 / CU-14 5 y 6: el aprobador registra la solución de una novedad en atención; queda resuelta, con la solución sin espacios sobrantes y la fecha de hoy en Colombia'
);
select results_eq(
  $$ select t.nombre, t.nombre_normalizado, t.activo, t.creado_por
     from public.tipo_falla t
     join public.novedad n on n.tipo_falla_id = t.id
     where n.id = 'a5000000-0000-4000-8000-0000000000d1' $$,
  $$ values ('Zz pgTAP Biométrico', 'zz pgtap biometrico', true, 'a5000000-0000-4000-8000-000000000002'::uuid) $$,
  'RF-14 / CU-14 5: un nombre que no existe crea el tipo, con sus espacios arreglados, su nombre normalizado y quien lo creó'
);
select ok(
  (select actualizado_en > '2026-09-02'::timestamptz from public.novedad where id = 'a5000000-0000-4000-8000-0000000000d1'),
  'RF-16: actualizado_en refleja el cambio (lo mantiene el disparador)'
);
select results_eq(
  $$ select estado_anterior::text, estado_nuevo::text, usuario_id, observacion, area_anterior_id, area_nueva_id
     from public.historial_transicion
     where novedad_id = 'a5000000-0000-4000-8000-0000000000d1' $$,
  $$ values ('en_atencion', 'resuelta', 'a5000000-0000-4000-8000-000000000002'::uuid,
             'Se actualizó el firmware del biométrico.', null::uuid, null::uuid) $$,
  'RF-16 / CU-14 7: el historial registra en atención → resuelta, con la solución como observación (así no se pierde si la falla persiste; Sprint 3)'
);

-- CU-14 5a · el mismo tipo, aunque cambien mayúsculas, tildes o espacios ----------------------

select lives_ok(
  $$ select public.registrar_solucion(
       'a5000000-0000-4000-8000-0000000000d2', 'Se cambiaron los tablones.', date '2026-09-20', null, 'zz pgtap biometrico'
     ) $$,
  'RF-14: también registra la solución de una novedad aprobada por el director'
);
select lives_ok(
  $$ select public.registrar_solucion(
       'a5000000-0000-4000-8000-0000000000d3', 'Se reinició el equipo.', date '2026-09-20', null, E'  ZZ   PGTAP\tBIOMÉTRICO  '
     ) $$,
  'RF-14 / CU-14 5a: registra con el nombre en mayúsculas y con espacios de más'
);
select is(
  (
    select count(distinct n.tipo_falla_id)::int
    from public.novedad n
    where n.id in (
      'a5000000-0000-4000-8000-0000000000d1', 'a5000000-0000-4000-8000-0000000000d2',
      'a5000000-0000-4000-8000-0000000000d3'
    )
  ),
  1,
  'RF-14 / CU-14 5a: «Zz pgTAP Biométrico», «zz pgtap biometrico» y «  ZZ   PGTAP BIOMÉTRICO  » son el mismo tipo'
);
select is(
  (select count(*)::int from public.tipo_falla where nombre_normalizado = 'zz pgtap biometrico'),
  1,
  'RF-14 / CU-14 5a: no se creó un tipo duplicado'
);
select is(
  (select nombre from public.tipo_falla where nombre_normalizado = 'zz pgtap biometrico'),
  'Zz pgTAP Biométrico',
  'RF-14: el tipo conserva el nombre con que se creó'
);
select results_eq(
  $$ select estado_anterior::text, estado_nuevo::text
     from public.historial_transicion
     where novedad_id = 'a5000000-0000-4000-8000-0000000000d2' $$,
  $$ values ('aprobada', 'resuelta') $$,
  'RF-16: desde aprobada, el historial registra aprobada → resuelta'
);

-- Con el identificador de un tipo existente ---------------------------------------------------

select lives_ok(
  $$ select public.registrar_solucion(
       'a5000000-0000-4000-8000-0000000000d4', 'Se cambiaron los tablones.', date '2026-09-20',
       'a5000000-0000-4000-8000-0000000000c1'
     ) $$,
  'RF-14 / CU-14 5: registra con el identificador de un tipo activo'
);
select lives_ok(
  $$ select public.registrar_solucion(
       'a5000000-0000-4000-8000-0000000000d0', 'Se cambiaron los tablones.', date '2026-09-20',
       'a5000000-0000-4000-8000-0000000000c1', 'Zz pgTAP No debe crearse'
     ) $$,
  'RF-14: si llegan el identificador y el nombre, se usa el identificador'
);
select is(
  (select count(*)::int from public.tipo_falla where nombre_normalizado = 'zz pgtap no debe crearse'),
  0,
  'RF-14: y el nombre no crea un tipo'
);
select lives_ok(
  $$ select public.registrar_solucion(
       'a5000000-0000-4000-8000-0000000000d6', 'Se cambiaron los tablones.', date '2026-09-20',
       'a5000000-0000-4000-8000-0000000000c1'
     ) $$,
  'RF-14: registra la solución de la novedad de un reportante que ya fue desactivado'
);

-- Tipos fusionados y desactivados (SDD 6.1.8) --------------------------------------------------

select results_eq(
  $$ select r.tipo_falla_id
     from public.registrar_solucion(
       'a5000000-0000-4000-8000-0000000000d8', 'Se cambiaron los tablones.', date '2026-09-20', null, 'zz pgtap cadena'
     ) as r $$,
  $$ values ('a5000000-0000-4000-8000-0000000000c1'::uuid) $$,
  'RF-14: el nombre de un tipo fusionado usa el destino de su última fusión, siguiendo la cadena hasta un tipo activo'
);

reset role;
set local role authenticated;
set local request.jwt.claims = '{"sub": "a5000000-0000-4000-8000-000000000003", "role": "authenticated"}';

select throws_ok(
  $$ select public.registrar_solucion('a5000000-0000-4000-8000-0000000000d7', 'Se arregló.', date '2026-09-20', null, 'ZZ pgtap desactivado') $$,
  'P0001', 'TIPO_FALLA_INVALIDO',
  'RF-14: el nombre de un tipo desactivado → TIPO_FALLA_INVALIDO'
);
select throws_ok(
  $$ select public.registrar_solucion('a5000000-0000-4000-8000-0000000000d7', 'Se arregló.', date '2026-09-20', null, 'Zz pgTAP Sin destino') $$,
  'P0001', 'TIPO_FALLA_INVALIDO',
  'RF-14: un tipo fusionado en otro que después se desactivó → TIPO_FALLA_INVALIDO'
);
select throws_ok(
  $$ select public.registrar_solucion('a5000000-0000-4000-8000-0000000000d7', 'Se arregló.', date '2026-09-20', 'a5000000-0000-4000-8000-0000000000c2') $$,
  'P0001', 'TIPO_FALLA_INVALIDO',
  'RF-14: el identificador de un tipo desactivado → TIPO_FALLA_INVALIDO'
);
select throws_ok(
  $$ select public.registrar_solucion('a5000000-0000-4000-8000-0000000000d7', 'Se arregló.', date '2026-09-20', 'a5000000-0000-4000-8000-0000000000cf') $$,
  'P0001', 'TIPO_FALLA_INVALIDO',
  'RF-14: el identificador de un tipo que no existe → TIPO_FALLA_INVALIDO'
);

-- CU-14 6a · datos obligatorios y fecha ---------------------------------------------------------

select throws_ok(
  $$ select public.registrar_solucion('a5000000-0000-4000-8000-0000000000d7', null, date '2026-09-20', 'a5000000-0000-4000-8000-0000000000c1') $$,
  'P0001', 'DATO_OBLIGATORIO',
  'RF-14 / CU-14 6a: sin solución → DATO_OBLIGATORIO'
);
select throws_ok(
  $$ select public.registrar_solucion('a5000000-0000-4000-8000-0000000000d7', E'  \n ', date '2026-09-20', 'a5000000-0000-4000-8000-0000000000c1') $$,
  'P0001', 'DATO_OBLIGATORIO',
  'RF-14 / CU-14 6a: solución de solo espacios y saltos de línea → DATO_OBLIGATORIO'
);
select throws_ok(
  $$ select public.registrar_solucion('a5000000-0000-4000-8000-0000000000d7', repeat('a', 501), date '2026-09-20', 'a5000000-0000-4000-8000-0000000000c1') $$,
  'P0001', 'DATO_OBLIGATORIO',
  'RF-14: solución de más de 500 caracteres → DATO_OBLIGATORIO'
);
select throws_ok(
  $$ select public.registrar_solucion('a5000000-0000-4000-8000-0000000000d7', 'Se arregló.', null, 'a5000000-0000-4000-8000-0000000000c1') $$,
  'P0001', 'DATO_OBLIGATORIO',
  'RF-14 / CU-14 6a: sin fecha de ejecución → DATO_OBLIGATORIO'
);
select throws_ok(
  $$ select public.registrar_solucion('a5000000-0000-4000-8000-0000000000d7', 'Se arregló.', date '2026-09-20') $$,
  'P0001', 'DATO_OBLIGATORIO',
  'RF-14 / CU-14 6a: sin tipo de falla (ni identificador ni nombre) → DATO_OBLIGATORIO'
);
select throws_ok(
  $$ select public.registrar_solucion('a5000000-0000-4000-8000-0000000000d7', 'Se arregló.', date '2026-09-20', null, E'  \t ') $$,
  'P0001', 'DATO_OBLIGATORIO',
  'RF-14 / CU-14 6a: nombre del tipo en blanco → DATO_OBLIGATORIO'
);
select throws_ok(
  $$ select public.registrar_solucion(
       'a5000000-0000-4000-8000-0000000000d7', 'Se arregló.',
       (now() at time zone 'America/Bogota')::date + 1, 'a5000000-0000-4000-8000-0000000000c1'
     ) $$,
  'P0001', 'FECHA_INVALIDA',
  'RF-14 / CU-14 6a: fecha de ejecución de mañana en Colombia → FECHA_INVALIDA'
);
select throws_ok(
  $$ select public.registrar_solucion(
       'a5000000-0000-4000-8000-0000000000d7', 'Se arregló.',
       (now() at time zone 'America/Bogota')::date + 1, null, 'Zz pgTAP No debe crearse'
     ) $$,
  'P0001', 'FECHA_INVALIDA',
  'RF-14: con la fecha inválida no se llega a resolver el tipo'
);
select ok(
  (
    select p.prosrc like '%America/Bogota%' and p.prosrc !~* 'current_date'
    from pg_proc p
    where p.oid = 'public.registrar_solucion(uuid, text, date, uuid, text)'::regprocedure
  ),
  'RF-14: «hoy» se calcula en la hora de Colombia y no con current_date (el servidor está en UTC)'
);
select results_eq(
  $$ select estado::text, solucion, tipo_falla_id from public.novedad where id = 'a5000000-0000-4000-8000-0000000000d7' $$,
  $$ values ('en_atencion', null::text, null::uuid) $$,
  'RF-14 / CU-14 6a: con datos inválidos la novedad sigue en atención, sin solución ni tipo'
);
select is(
  (select count(*)::int from public.tipo_falla where nombre_normalizado = 'zz pgtap no debe crearse'),
  0,
  'RF-14: un intento fallido no deja un tipo nuevo'
);
select lives_ok(
  $$ select public.registrar_solucion(
       'a5000000-0000-4000-8000-0000000000d7', repeat('a', 500),
       (now() at time zone 'America/Bogota')::date, 'a5000000-0000-4000-8000-0000000000c1'
     ) $$,
  'RF-14: una solución de 500 caracteres con la fecha de hoy sí se acepta (y la registra otro aprobador del área)'
);

-- Estados que no admiten la acción (SDD, Tabla 29) ------------------------------------------

select throws_ok(
  $$ select public.registrar_solucion('a5000000-0000-4000-8000-0000000000d1', 'Otra vez.', date '2026-09-20', 'a5000000-0000-4000-8000-0000000000c1') $$,
  'P0001', 'TRANSICION_INVALIDA', 'RF-14: registrarla por segunda vez (ya resuelta) → TRANSICION_INVALIDA'
);
select throws_ok(
  $$ select public.registrar_solucion('a5000000-0000-4000-8000-0000000000da', 'Se arregló.', date '2026-09-20', 'a5000000-0000-4000-8000-0000000000c1') $$,
  'P0001', 'TRANSICION_INVALIDA', 'RF-14: asignada (sin tomar) → TRANSICION_INVALIDA'
);
select throws_ok(
  $$ select public.registrar_solucion('a5000000-0000-4000-8000-0000000000db', 'Se arregló.', date '2026-09-20', 'a5000000-0000-4000-8000-0000000000c1') $$,
  'P0001', 'TRANSICION_INVALIDA', 'RF-14: escalada (sin decisión del director) → TRANSICION_INVALIDA'
);
select throws_ok(
  $$ select public.registrar_solucion('a5000000-0000-4000-8000-0000000000dc', 'Se arregló.', date '2026-09-20', 'a5000000-0000-4000-8000-0000000000c1') $$,
  'P0001', 'TRANSICION_INVALIDA', 'RF-14: resuelta → TRANSICION_INVALIDA'
);
select throws_ok(
  $$ select public.registrar_solucion('a5000000-0000-4000-8000-0000000000dd', 'Se arregló.', date '2026-09-20', 'a5000000-0000-4000-8000-0000000000c1') $$,
  'P0001', 'TRANSICION_INVALIDA', 'RF-14: rechazada (final) → TRANSICION_INVALIDA'
);
select throws_ok(
  $$ select public.registrar_solucion('a5000000-0000-4000-8000-0000000000de', 'Se arregló.', date '2026-09-20', 'a5000000-0000-4000-8000-0000000000c1') $$,
  'P0001', 'TRANSICION_INVALIDA', 'RF-14: cerrada (final) → TRANSICION_INVALIDA'
);
select throws_ok(
  $$ select public.registrar_solucion('a5000000-0000-4000-8000-0000000000df', 'Se arregló.', date '2026-09-20', 'a5000000-0000-4000-8000-0000000000c1') $$,
  'P0001', 'TRANSICION_INVALIDA', 'RF-14: registrada → TRANSICION_INVALIDA'
);
select throws_ok(
  $$ select public.registrar_solucion('a5000000-0000-4000-8000-0000000000da', null, null) $$,
  'P0001', 'TRANSICION_INVALIDA',
  'SDD 6.1.3: el estado se comprueba antes que los datos (asignada y sin datos → TRANSICION_INVALIDA)'
);

-- Alcance y roles: SIN_PERMISO --------------------------------------------------------------

select throws_ok(
  $$ select public.registrar_solucion('a5000000-0000-4000-8000-0000000000d5', 'Se arregló.', date '2026-09-20', 'a5000000-0000-4000-8000-0000000000c1') $$,
  'P0001', 'SIN_PERMISO',
  'RNF-11: la novedad de otra área → SIN_PERMISO'
);
select throws_ok(
  $$ select public.registrar_solucion('a5000000-0000-4000-8000-0000000000ff', 'Se arregló.', date '2026-09-20', 'a5000000-0000-4000-8000-0000000000c1') $$,
  'P0001', 'SIN_PERMISO',
  'RNF-11: una novedad que no existe → SIN_PERMISO (igual que una fuera del alcance)'
);

reset role;
set local role authenticated;
set local request.jwt.claims = '{"sub": "a5000000-0000-4000-8000-000000000004", "role": "authenticated"}';

select throws_ok(
  $$ select public.registrar_solucion('a5000000-0000-4000-8000-0000000000d9', 'Se arregló.', date '2026-09-20', 'a5000000-0000-4000-8000-0000000000c1') $$,
  'P0001', 'SIN_PERMISO',
  'RNF-11: el aprobador de otra área → SIN_PERMISO'
);

reset role;
set local role authenticated;
set local request.jwt.claims = '{"sub": "a5000000-0000-4000-8000-000000000001", "role": "authenticated"}';

select throws_ok(
  $$ select public.registrar_solucion('a5000000-0000-4000-8000-0000000000d9', 'Se arregló.', date '2026-09-20', 'a5000000-0000-4000-8000-0000000000c1') $$,
  'P0001', 'SIN_PERMISO',
  'RF-14: el reportante no registra soluciones → SIN_PERMISO'
);
select throws_ok(
  $$ select public.registrar_solucion('a5000000-0000-4000-8000-0000000000d9', null, null) $$,
  'P0001', 'SIN_PERMISO',
  'SDD 6.1.3: el rol se comprueba antes que los datos (reportante y sin datos → SIN_PERMISO)'
);
select throws_ok(
  $$ select * from public.sugerir_tipos_falla('zzq pgtap sug') $$,
  'P0001', 'SIN_PERMISO',
  'RF-14: el reportante no consulta las sugerencias de tipos → SIN_PERMISO'
);

reset role;
set local role authenticated;
set local request.jwt.claims = '{"sub": "a5000000-0000-4000-8000-000000000006", "role": "authenticated"}';

select throws_ok(
  $$ select public.registrar_solucion('a5000000-0000-4000-8000-0000000000d9', 'Se arregló.', date '2026-09-20', 'a5000000-0000-4000-8000-0000000000c1') $$,
  'P0001', 'SIN_PERMISO',
  'RF-14: el director no registra soluciones → SIN_PERMISO'
);
select throws_ok(
  $$ select * from public.sugerir_tipos_falla('zzq pgtap sug') $$,
  'P0001', 'SIN_PERMISO',
  'RF-14: el director no consulta las sugerencias de tipos → SIN_PERMISO'
);

reset role;
set local role authenticated;
set local request.jwt.claims = '{"sub": "a5000000-0000-4000-8000-000000000005", "role": "authenticated"}';

select throws_ok(
  $$ select public.registrar_solucion('a5000000-0000-4000-8000-0000000000d9', 'Se arregló.', date '2026-09-20', 'a5000000-0000-4000-8000-0000000000c1') $$,
  'P0001', 'SIN_PERMISO',
  'RF-01 / RF-14: un aprobador desactivado → SIN_PERMISO'
);
select throws_ok(
  $$ select * from public.sugerir_tipos_falla('zzq pgtap sug') $$,
  'P0001', 'SIN_PERMISO',
  'RF-01 / RF-14: un aprobador desactivado no consulta las sugerencias → SIN_PERMISO'
);

reset role;
set local role authenticated;
set local request.jwt.claims = '{"sub": "a5000000-0000-4000-8000-000000000008", "role": "authenticated"}';

select throws_ok(
  $$ select public.registrar_solucion('a5000000-0000-4000-8000-0000000000d9', 'Se arregló.', date '2026-09-20', 'a5000000-0000-4000-8000-0000000000c1') $$,
  'P0001', 'SIN_PERMISO',
  'RF-14: una cuenta sin perfil → SIN_PERMISO'
);

reset role;
set local role anon;

select throws_ok(
  $$ select public.registrar_solucion('a5000000-0000-4000-8000-0000000000d9', 'Se arregló.', date '2026-09-20', 'a5000000-0000-4000-8000-0000000000c1') $$,
  '42501', null,
  'RNF-11: anon no puede ejecutar registrar_solucion'
);
select throws_ok(
  $$ select * from public.sugerir_tipos_falla('zzq pgtap sug') $$,
  '42501', null,
  'RNF-11: anon no puede ejecutar sugerir_tipos_falla'
);

-- sugerir_tipos_falla (SDD 6.1.8) -----------------------------------------------------------------

reset role;
set local role authenticated;
set local request.jwt.claims = '{"sub": "a5000000-0000-4000-8000-000000000002", "role": "authenticated"}';

select results_eq(
  $$ select s.nombre, s.cantidad_novedades, s.coincidencia_exacta
     from public.sugerir_tipos_falla('zzq pgtap sug') as s $$,
  $$ values
       ('Zzq pgTAP Súg', 0, true),
       ('Zzq pgTAP Súg 01', 3, false),
       ('Zzq pgTAP Súg 02', 2, false),
       ('Zzq pgTAP Súg 03', 1, false),
       ('Zzq pgTAP Súg 04', 0, false),
       ('Zzq pgTAP Súg 05', 0, false),
       ('Zzq pgTAP Súg 06', 0, false),
       ('Zzq pgTAP Súg 07', 0, false) $$,
  'RF-14 / CU-14 4: sugiere los tipos activos que contienen el texto: primero la coincidencia exacta, luego por cantidad de novedades (también las de otras áreas) y por nombre, máximo ocho'
);
select results_eq(
  $$ select s.id, s.nombre, s.coincidencia_exacta
     from public.sugerir_tipos_falla(E'  ZZQ   PGTAP  SÚG 02 ') as s $$,
  $$ values ('a5000000-0000-4000-8000-00000000c102'::uuid, 'Zzq pgTAP Súg 02', true) $$,
  'RF-14 / CU-14 5a: el texto se normaliza antes de buscar; la que solo cambia en mayúsculas, tildes o espacios es coincidencia exacta'
);
select is(
  (select count(*)::int from public.sugerir_tipos_falla('zzq pgtap sug 10')),
  0,
  'RF-14: un tipo desactivado no aparece en las sugerencias'
);
select is(
  (select count(*)::int from public.sugerir_tipos_falla('zzq_pgtap')),
  0,
  'RF-14: el guion bajo del texto no es un comodín'
);
select is(
  (select count(*)::int from public.sugerir_tipos_falla('zzq%sug')),
  0,
  'RF-14: el porcentaje del texto no es un comodín'
);
select is(
  (select count(*)::int from public.sugerir_tipos_falla('zz pgtap no existe ninguno asi')),
  0,
  'RF-14: sin coincidencias no devuelve filas'
);
select results_eq(
  $$ select s.nombre, s.cantidad_novedades
     from public.sugerir_tipos_falla('zz pgtap puentes') as s $$,
  $$ values ('Zz pgTAP Puentes', 7) $$,
  'RF-14: la cantidad cuenta todas las novedades del tipo, resueltas y cerradas'
);
select is(
  (select count(*)::int from public.sugerir_tipos_falla(null)),
  8,
  'RF-14: sin texto sugiere los ocho tipos más usados'
);

reset role;
set local role authenticated;
set local request.jwt.claims = '{"sub": "a5000000-0000-4000-8000-000000000007", "role": "authenticated"}';

select is(
  (select count(*)::int from public.sugerir_tipos_falla('zzq pgtap sug')),
  8,
  'RF-32: el administrador también consulta las sugerencias'
);
select throws_ok(
  $$ select public.registrar_solucion('a5000000-0000-4000-8000-0000000000d9', 'Se arregló.', date '2026-09-20', 'a5000000-0000-4000-8000-0000000000c1') $$,
  'P0001', 'SIN_PERMISO',
  'RF-14: el administrador no registra soluciones → SIN_PERMISO'
);

-- Lo que quedó escrito (como propietario: nadie ve los avisos de otro) ------------------------

reset role;

select results_eq(
  $$ select estado::text, solucion, tipo_falla_id from public.novedad where id = 'a5000000-0000-4000-8000-0000000000d9' $$,
  $$ values ('en_atencion', null::text, null::uuid) $$,
  'RF-14: los intentos sin permiso no cambian la novedad'
);
select is(
  (select count(*)::int from public.historial_transicion where novedad_id = 'a5000000-0000-4000-8000-0000000000d9'),
  0,
  'RF-16: ni dejan registros en el historial'
);
select is(
  (select count(*)::int from public.historial_transicion where novedad_id = 'a5000000-0000-4000-8000-0000000000d1'),
  1,
  'RF-16: el segundo intento no agrega registros al historial'
);
select is(
  (select count(*)::int from public.historial_transicion where novedad_id = 'a5000000-0000-4000-8000-0000000000d7'),
  1,
  'RF-16: los intentos con datos inválidos no dejaron registros; solo la solución válida'
);

-- Avisos (Tabla 30): al reportante y, si se creó un tipo, a los administradores activos.
-- «staging» tiene sus propios administradores; aquí se miran los usuarios de la prueba.
select results_eq(
  $$ select n.destinatario_id, n.estado_nuevo::text, n.leida
     from public.notificacion n
     join public.usuario u on u.id = n.destinatario_id
     where n.novedad_id = 'a5000000-0000-4000-8000-0000000000d1'
       and u.correo like '%@solucion.pgtap.test'
     order by n.destinatario_id $$,
  $$ values
       ('a5000000-0000-4000-8000-000000000001'::uuid, 'resuelta', false),
       ('a5000000-0000-4000-8000-000000000007'::uuid, 'resuelta', false),
       ('a5000000-0000-4000-8000-00000000000a'::uuid, 'resuelta', false) $$,
  'RF-30 / CU-14 8: con un tipo nuevo, un aviso sin leer para el reportante y para cada administrador activo'
);
select is(
  (
    select count(*)::int
    from public.notificacion n
    where n.novedad_id = 'a5000000-0000-4000-8000-0000000000d1'
      and n.destinatario_id in (select u.id from public.usuario u where u.rol_id = 4 and u.activo)
  ),
  (select count(*)::int from public.usuario u where u.rol_id = 4 and u.activo),
  'RF-30: todos los administradores activos del sistema reciben el aviso, uno cada uno'
);
select is(
  (
    select count(*)::int
    from public.notificacion
    where novedad_id = 'a5000000-0000-4000-8000-0000000000d1'
      and destinatario_id in (
        'a5000000-0000-4000-8000-000000000002', 'a5000000-0000-4000-8000-000000000003',
        'a5000000-0000-4000-8000-000000000006', 'a5000000-0000-4000-8000-00000000000b'
      )
  ),
  0,
  'RF-30: ni al aprobador que actúa, ni a su colega, ni al director, ni al administrador desactivado'
);
select results_eq(
  $$ select destinatario_id, estado_nuevo::text
     from public.notificacion
     where novedad_id in ('a5000000-0000-4000-8000-0000000000d2', 'a5000000-0000-4000-8000-0000000000d4')
     order by novedad_id $$,
  $$ values
       ('a5000000-0000-4000-8000-000000000001'::uuid, 'resuelta'),
       ('a5000000-0000-4000-8000-000000000001'::uuid, 'resuelta') $$,
  'RF-30 / CU-14 8: con un tipo que ya existía (por nombre o por identificador), el aviso es solo para el reportante'
);
select is(
  (select count(*)::int from public.notificacion where novedad_id = 'a5000000-0000-4000-8000-0000000000d6'),
  0,
  'RF-30: un reportante desactivado no recibe avisos'
);

-- CU-16 1a · si falla el historial, se revierte todo, también el tipo nuevo ------------------

create function pg_temp.tg_falla_del_historial()
returns trigger
language plpgsql
as $$
begin
  raise exception 'FALLA_SIMULADA_DEL_HISTORIAL';
end;
$$;

create trigger pgtap_falla_del_historial
  before insert on public.historial_transicion
  for each row execute function pg_temp.tg_falla_del_historial();

set local role authenticated;
set local request.jwt.claims = '{"sub": "a5000000-0000-4000-8000-000000000002", "role": "authenticated"}';

select throws_ok(
  $$ select public.registrar_solucion('a5000000-0000-4000-8000-0000000000d9', 'Se arregló.', date '2026-09-20', null, 'Zz pgTAP Se revierte') $$,
  'P0001', 'FALLA_SIMULADA_DEL_HISTORIAL',
  'RF-16 / CU-16 1a: si el registro del historial falla, la función informa el error'
);

reset role;

select results_eq(
  $$ select estado::text, solucion, tipo_falla_id from public.novedad where id = 'a5000000-0000-4000-8000-0000000000d9' $$,
  $$ values ('en_atencion', null::text, null::uuid) $$,
  'RF-16 / CU-16 1a: y la novedad sigue en atención (se revierte el cambio)'
);
select is(
  (select count(*)::int from public.tipo_falla where nombre_normalizado = 'zz pgtap se revierte'),
  0,
  'RF-16 / CU-16 1a: el tipo nuevo tampoco queda creado'
);
select is(
  (select count(*)::int from public.notificacion where novedad_id = 'a5000000-0000-4000-8000-0000000000d9'),
  0,
  'RF-16 / CU-16 1a: ni se envía ningún aviso'
);

-- Los contratos siguen intactos ---------------------------------------------------------------

select ok(
  has_function_privilege('authenticated', 'public.registrar_solucion(uuid, text, date, uuid, text)', 'execute')
    and has_function_privilege('authenticated', 'public.sugerir_tipos_falla(text)', 'execute'),
  'RF-14: authenticated conserva el permiso de ejecutar registrar_solucion y sugerir_tipos_falla'
);
select ok(
  (
    select bool_and(p.prosecdef and p.proconfig @> array['search_path=""'])
    from pg_proc p
    where p.oid in (
      'public.registrar_solucion(uuid, text, date, uuid, text)'::regprocedure,
      'public.sugerir_tipos_falla(text)'::regprocedure
    )
  ),
  'RNF-11: las dos siguen siendo security definer con search_path vacío'
);

select * from finish();
rollback;
