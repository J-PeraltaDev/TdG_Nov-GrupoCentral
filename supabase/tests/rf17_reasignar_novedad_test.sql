-- RF-17 / CU-17 · reasignar_novedad (SDD 6.1.3, Tablas 29 y 30).
-- Se prueba a través del RPC, con el rol y el JWT de cada usuario. Los datos se crean dentro
-- de la transacción, en áreas propias, y no dependen del seed.
begin;

create extension if not exists pgtap with schema extensions;

select plan(52);

-- Datos de la prueba (como propietario) ------------------------------------------------

insert into public.razon_social (id, nombre)
values ('a4000000-0000-4000-8000-0000000000a1', 'RS pgTAP reasignar');

insert into public.finca (id, razon_social_id, nombre)
values
  ('a4000000-0000-4000-8000-0000000000f1', 'a4000000-0000-4000-8000-0000000000a1', 'Finca pgTAP reasignar A'),
  ('a4000000-0000-4000-8000-0000000000f2', 'a4000000-0000-4000-8000-0000000000a1', 'Finca pgTAP reasignar B');

-- b1, el área de origen; b2, la de destino; b3, un área desactivada.
insert into public.area (id, nombre, activo)
values
  ('a4000000-0000-4000-8000-0000000000b1', 'Área pgTAP reasignar', true),
  ('a4000000-0000-4000-8000-0000000000b2', 'Área pgTAP reasignar vecina', true),
  ('a4000000-0000-4000-8000-0000000000b3', 'Área pgTAP reasignar inactiva', false);

insert into auth.users (instance_id, id, aud, role, email)
select '00000000-0000-0000-0000-000000000000', id, 'authenticated', 'authenticated', correo
from (
  values
    ('a4000000-0000-4000-8000-000000000001'::uuid, 'reportante@reasignar.pgtap.test'),
    ('a4000000-0000-4000-8000-000000000002'::uuid, 'aprobador@reasignar.pgtap.test'),
    ('a4000000-0000-4000-8000-000000000003'::uuid, 'aprobador.colega@reasignar.pgtap.test'),
    ('a4000000-0000-4000-8000-000000000004'::uuid, 'aprobador.vecino@reasignar.pgtap.test'),
    ('a4000000-0000-4000-8000-000000000005'::uuid, 'aprobador.inactivo@reasignar.pgtap.test'),
    ('a4000000-0000-4000-8000-000000000006'::uuid, 'director@reasignar.pgtap.test'),
    ('a4000000-0000-4000-8000-000000000007'::uuid, 'administrador@reasignar.pgtap.test'),
    ('a4000000-0000-4000-8000-000000000008'::uuid, 'sin.perfil@reasignar.pgtap.test'),
    ('a4000000-0000-4000-8000-000000000009'::uuid, 'reportante.inactivo@reasignar.pgtap.test'),
    ('a4000000-0000-4000-8000-00000000000c'::uuid, 'aprobador.vecino.dos@reasignar.pgtap.test'),
    ('a4000000-0000-4000-8000-00000000000d'::uuid, 'aprobador.vecino.inactivo@reasignar.pgtap.test')
) as u (id, correo);

insert into public.usuario (id, nombre, correo, rol_id, finca_id, area_id, activo)
values
  ('a4000000-0000-4000-8000-000000000001', 'Reportante', 'reportante@reasignar.pgtap.test', 1, 'a4000000-0000-4000-8000-0000000000f1', null, true),
  ('a4000000-0000-4000-8000-000000000002', 'Aprobador', 'aprobador@reasignar.pgtap.test', 2, null, 'a4000000-0000-4000-8000-0000000000b1', true),
  ('a4000000-0000-4000-8000-000000000003', 'Aprobador colega', 'aprobador.colega@reasignar.pgtap.test', 2, null, 'a4000000-0000-4000-8000-0000000000b1', true),
  ('a4000000-0000-4000-8000-000000000004', 'Aprobador vecino', 'aprobador.vecino@reasignar.pgtap.test', 2, null, 'a4000000-0000-4000-8000-0000000000b2', true),
  ('a4000000-0000-4000-8000-000000000005', 'Aprobador inactivo', 'aprobador.inactivo@reasignar.pgtap.test', 2, null, 'a4000000-0000-4000-8000-0000000000b1', false),
  ('a4000000-0000-4000-8000-000000000006', 'Director', 'director@reasignar.pgtap.test', 3, null, null, true),
  ('a4000000-0000-4000-8000-000000000007', 'Administrador', 'administrador@reasignar.pgtap.test', 4, null, null, true),
  ('a4000000-0000-4000-8000-000000000009', 'Reportante inactivo', 'reportante.inactivo@reasignar.pgtap.test', 1, 'a4000000-0000-4000-8000-0000000000f2', null, false),
  ('a4000000-0000-4000-8000-00000000000c', 'Aprobador vecino dos', 'aprobador.vecino.dos@reasignar.pgtap.test', 2, null, 'a4000000-0000-4000-8000-0000000000b2', true),
  ('a4000000-0000-4000-8000-00000000000d', 'Aprobador vecino inactivo', 'aprobador.vecino.inactivo@reasignar.pgtap.test', 2, null, 'a4000000-0000-4000-8000-0000000000b2', false);

insert into public.tipo_falla (id, nombre, nombre_normalizado, creado_por)
values ('a4000000-0000-4000-8000-0000000000c1', 'Tipo pgTAP reasignar', 'tipo pgtap reasignar', 'a4000000-0000-4000-8000-000000000007');

-- Una novedad por caso. d1, asignada, y d2, en atención: los dos orígenes que admite la
-- acción. d3, d4 y d8, asignadas, para los intentos que no deben cambiar nada. d5, que ya es
-- del área vecina. d6, de un reportante ya desactivado. El resto, una en cada estado que no
-- la admite.
insert into public.novedad (
  id, id_local, finca_id, area_id, reportante_id, descripcion, prioridad, estado,
  fecha_registro, actualizado_en, tipo_falla_id, solucion, fecha_ejecucion
)
select
  ('a4000000-0000-4000-8000-0000000000d' || n.sufijo)::uuid,
  ('a4000000-0000-4000-8000-0000000000e' || n.sufijo)::uuid,
  n.finca::uuid,
  n.area::uuid,
  n.reportante::uuid,
  'Novedad pgTAP reasignar ' || n.sufijo,
  'alto',
  n.estado::public.estado_novedad,
  '2026-09-01 08:00:00-05',
  '2026-09-01 08:00:00-05',
  case when n.estado in ('resuelta', 'cerrada') then 'a4000000-0000-4000-8000-0000000000c1'::uuid end,
  case when n.estado in ('resuelta', 'cerrada') then 'Solución de prueba' end,
  case when n.estado in ('resuelta', 'cerrada') then date '2026-09-02' end
from (
  values
    ('1', 'asignada', 'a4000000-0000-4000-8000-0000000000f1', 'a4000000-0000-4000-8000-0000000000b1', 'a4000000-0000-4000-8000-000000000001'),
    ('2', 'en_atencion', 'a4000000-0000-4000-8000-0000000000f1', 'a4000000-0000-4000-8000-0000000000b1', 'a4000000-0000-4000-8000-000000000001'),
    ('3', 'asignada', 'a4000000-0000-4000-8000-0000000000f1', 'a4000000-0000-4000-8000-0000000000b1', 'a4000000-0000-4000-8000-000000000001'),
    ('4', 'asignada', 'a4000000-0000-4000-8000-0000000000f1', 'a4000000-0000-4000-8000-0000000000b1', 'a4000000-0000-4000-8000-000000000001'),
    ('5', 'asignada', 'a4000000-0000-4000-8000-0000000000f1', 'a4000000-0000-4000-8000-0000000000b2', 'a4000000-0000-4000-8000-000000000001'),
    ('6', 'asignada', 'a4000000-0000-4000-8000-0000000000f2', 'a4000000-0000-4000-8000-0000000000b1', 'a4000000-0000-4000-8000-000000000009'),
    ('7', 'registrada', 'a4000000-0000-4000-8000-0000000000f1', 'a4000000-0000-4000-8000-0000000000b1', 'a4000000-0000-4000-8000-000000000001'),
    ('8', 'asignada', 'a4000000-0000-4000-8000-0000000000f1', 'a4000000-0000-4000-8000-0000000000b1', 'a4000000-0000-4000-8000-000000000001'),
    ('9', 'escalada', 'a4000000-0000-4000-8000-0000000000f1', 'a4000000-0000-4000-8000-0000000000b1', 'a4000000-0000-4000-8000-000000000001'),
    ('a', 'aprobada', 'a4000000-0000-4000-8000-0000000000f1', 'a4000000-0000-4000-8000-0000000000b1', 'a4000000-0000-4000-8000-000000000001'),
    ('b', 'resuelta', 'a4000000-0000-4000-8000-0000000000f1', 'a4000000-0000-4000-8000-0000000000b1', 'a4000000-0000-4000-8000-000000000001'),
    ('c', 'rechazada', 'a4000000-0000-4000-8000-0000000000f1', 'a4000000-0000-4000-8000-0000000000b1', 'a4000000-0000-4000-8000-000000000001'),
    ('f', 'cerrada', 'a4000000-0000-4000-8000-0000000000f1', 'a4000000-0000-4000-8000-0000000000b1', 'a4000000-0000-4000-8000-000000000001')
) as n (sufijo, estado, finca, area, reportante);

-- CU-17 · curso normal ---------------------------------------------------------------------

set local role authenticated;
set local request.jwt.claims = '{"sub": "a4000000-0000-4000-8000-000000000002", "role": "authenticated"}';

select lives_ok(
  $$ select public.reasignar_novedad(
       'a4000000-0000-4000-8000-0000000000d1',
       'a4000000-0000-4000-8000-0000000000b2',
       '  Es un daño del aire acondicionado; lo atiende la otra área.  '
     ) $$,
  'RF-17 / CU-17 3: el aprobador reasigna una novedad asignada a su área, con un motivo'
);
select is(
  (select count(*)::int from public.novedad where id = 'a4000000-0000-4000-8000-0000000000d1'),
  0,
  'RNF-11: después de reasignarla, la novedad sale del alcance del aprobador de origen'
);
select throws_ok(
  $$ select public.reasignar_novedad(
       'a4000000-0000-4000-8000-0000000000d1', 'a4000000-0000-4000-8000-0000000000b1', 'De vuelta'
     ) $$,
  'P0001', 'SIN_PERMISO',
  'RF-17: ni puede actuar sobre ella otra vez → SIN_PERMISO'
);
select results_eq(
  $$ select r.id, r.estado::text, r.area_id
     from public.reasignar_novedad(
       'a4000000-0000-4000-8000-0000000000d2', 'a4000000-0000-4000-8000-0000000000b2', 'No es de esta área'
     ) as r $$,
  $$ values ('a4000000-0000-4000-8000-0000000000d2'::uuid, 'asignada', 'a4000000-0000-4000-8000-0000000000b2'::uuid) $$,
  'RF-17 / CU-17 4: una novedad en atención vuelve a asignada en el área nueva; devuelve la novedad actualizada'
);
select lives_ok(
  $$ select public.reasignar_novedad(
       'a4000000-0000-4000-8000-0000000000d6', 'a4000000-0000-4000-8000-0000000000b2', 'No es de esta área'
     ) $$,
  'RF-17: reasigna la novedad de un reportante que ya fue desactivado'
);

-- CU-17 3a · el motivo es obligatorio; el área de destino debe ser otra y estar activa ---------

reset role;
set local role authenticated;
set local request.jwt.claims = '{"sub": "a4000000-0000-4000-8000-000000000003", "role": "authenticated"}';

select throws_ok(
  $$ select public.reasignar_novedad('a4000000-0000-4000-8000-0000000000d8', 'a4000000-0000-4000-8000-0000000000b2', null) $$,
  'P0001', 'DATO_OBLIGATORIO',
  'RF-17 / CU-17 3a: sin motivo → DATO_OBLIGATORIO'
);
select throws_ok(
  $$ select public.reasignar_novedad('a4000000-0000-4000-8000-0000000000d8', 'a4000000-0000-4000-8000-0000000000b2', '') $$,
  'P0001', 'DATO_OBLIGATORIO',
  'RF-17 / CU-17 3a: motivo vacío → DATO_OBLIGATORIO'
);
select throws_ok(
  $$ select public.reasignar_novedad('a4000000-0000-4000-8000-0000000000d8', 'a4000000-0000-4000-8000-0000000000b2', '     ') $$,
  'P0001', 'DATO_OBLIGATORIO',
  'RF-17 / CU-17 3a: motivo de solo espacios → DATO_OBLIGATORIO'
);
select throws_ok(
  $$ select public.reasignar_novedad('a4000000-0000-4000-8000-0000000000d8', 'a4000000-0000-4000-8000-0000000000b2', E' \n\t\r ') $$,
  'P0001', 'DATO_OBLIGATORIO',
  'RF-17 / CU-17 3a: motivo de solo saltos de línea y tabulaciones → DATO_OBLIGATORIO'
);
select throws_ok(
  $$ select public.reasignar_novedad('a4000000-0000-4000-8000-0000000000d8', 'a4000000-0000-4000-8000-0000000000b2', repeat('a', 501)) $$,
  'P0001', 'DATO_OBLIGATORIO',
  'RF-17: motivo de más de 500 caracteres → DATO_OBLIGATORIO'
);
select throws_ok(
  $$ select public.reasignar_novedad('a4000000-0000-4000-8000-0000000000d8', 'a4000000-0000-4000-8000-0000000000b1', 'No es de esta área') $$,
  'P0001', 'AREA_INVALIDA',
  'RF-17: el área de destino es la actual → AREA_INVALIDA'
);
select throws_ok(
  $$ select public.reasignar_novedad('a4000000-0000-4000-8000-0000000000d8', 'a4000000-0000-4000-8000-0000000000b3', 'No es de esta área') $$,
  'P0001', 'AREA_INVALIDA',
  'RF-17: el área de destino está desactivada → AREA_INVALIDA'
);
select throws_ok(
  $$ select public.reasignar_novedad('a4000000-0000-4000-8000-0000000000d8', 'a4000000-0000-4000-8000-0000000000bf', 'No es de esta área') $$,
  'P0001', 'AREA_INVALIDA',
  'RF-17: el área de destino no existe → AREA_INVALIDA'
);
select throws_ok(
  $$ select public.reasignar_novedad('a4000000-0000-4000-8000-0000000000d8', null, 'No es de esta área') $$,
  'P0001', 'AREA_INVALIDA',
  'RF-17: sin área de destino → AREA_INVALIDA'
);
select throws_ok(
  $$ select public.reasignar_novedad('a4000000-0000-4000-8000-0000000000d8', 'a4000000-0000-4000-8000-0000000000b1', '') $$,
  'P0001', 'DATO_OBLIGATORIO',
  'SDD, Tabla 30: el motivo se comprueba antes que el área (sin motivo y con el área actual → DATO_OBLIGATORIO)'
);
select results_eq(
  $$ select estado::text, area_id from public.novedad where id = 'a4000000-0000-4000-8000-0000000000d8' $$,
  $$ values ('asignada', 'a4000000-0000-4000-8000-0000000000b1'::uuid) $$,
  'RF-17 / CU-17 3a: sin datos válidos la novedad sigue asignada en su área'
);
select lives_ok(
  $$ select public.reasignar_novedad('a4000000-0000-4000-8000-0000000000d8', 'a4000000-0000-4000-8000-0000000000b2', repeat('a', 500)) $$,
  'RF-17: un motivo de 500 caracteres sí se acepta (y la reasigna otro aprobador del área)'
);

-- Estados que no admiten la acción (SDD, Tabla 29) ------------------------------------------

select throws_ok(
  $$ select public.reasignar_novedad('a4000000-0000-4000-8000-0000000000d7', 'a4000000-0000-4000-8000-0000000000b2', 'No es de esta área') $$,
  'P0001', 'TRANSICION_INVALIDA', 'RF-17: registrada → TRANSICION_INVALIDA'
);
select throws_ok(
  $$ select public.reasignar_novedad('a4000000-0000-4000-8000-0000000000d9', 'a4000000-0000-4000-8000-0000000000b2', 'No es de esta área') $$,
  'P0001', 'TRANSICION_INVALIDA', 'RF-17: escalada → TRANSICION_INVALIDA'
);
select throws_ok(
  $$ select public.reasignar_novedad('a4000000-0000-4000-8000-0000000000da', 'a4000000-0000-4000-8000-0000000000b2', 'No es de esta área') $$,
  'P0001', 'TRANSICION_INVALIDA', 'RF-17: aprobada → TRANSICION_INVALIDA'
);
select throws_ok(
  $$ select public.reasignar_novedad('a4000000-0000-4000-8000-0000000000db', 'a4000000-0000-4000-8000-0000000000b2', 'No es de esta área') $$,
  'P0001', 'TRANSICION_INVALIDA', 'RF-17: resuelta → TRANSICION_INVALIDA'
);
select throws_ok(
  $$ select public.reasignar_novedad('a4000000-0000-4000-8000-0000000000dc', 'a4000000-0000-4000-8000-0000000000b2', 'No es de esta área') $$,
  'P0001', 'TRANSICION_INVALIDA', 'RF-17: rechazada (final) → TRANSICION_INVALIDA'
);
select throws_ok(
  $$ select public.reasignar_novedad('a4000000-0000-4000-8000-0000000000df', 'a4000000-0000-4000-8000-0000000000b2', 'No es de esta área') $$,
  'P0001', 'TRANSICION_INVALIDA', 'RF-17: cerrada (final) → TRANSICION_INVALIDA'
);
select throws_ok(
  $$ select public.reasignar_novedad('a4000000-0000-4000-8000-0000000000d9', 'a4000000-0000-4000-8000-0000000000b1', null) $$,
  'P0001', 'TRANSICION_INVALIDA',
  'SDD 6.1.3: el estado se comprueba antes que los datos (escalada, sin motivo y con el área actual → TRANSICION_INVALIDA)'
);

-- Alcance y roles: SIN_PERMISO --------------------------------------------------------------

select throws_ok(
  $$ select public.reasignar_novedad('a4000000-0000-4000-8000-0000000000d5', 'a4000000-0000-4000-8000-0000000000b1', 'Es de mi área') $$,
  'P0001', 'SIN_PERMISO',
  'RNF-11: no puede traerse una novedad de otra área → SIN_PERMISO'
);
select throws_ok(
  $$ select public.reasignar_novedad('a4000000-0000-4000-8000-0000000000ff', 'a4000000-0000-4000-8000-0000000000b2', 'No es de esta área') $$,
  'P0001', 'SIN_PERMISO',
  'RNF-11: una novedad que no existe → SIN_PERMISO (igual que una fuera del alcance)'
);
select throws_ok(
  $$ select public.reasignar_novedad(null, 'a4000000-0000-4000-8000-0000000000b2', 'No es de esta área') $$,
  'P0001', 'SIN_PERMISO',
  'RNF-11: sin identificador → SIN_PERMISO'
);

reset role;
set local role authenticated;
set local request.jwt.claims = '{"sub": "a4000000-0000-4000-8000-000000000004", "role": "authenticated"}';

select throws_ok(
  $$ select public.reasignar_novedad('a4000000-0000-4000-8000-0000000000d3', 'a4000000-0000-4000-8000-0000000000b2', 'Es de mi área') $$,
  'P0001', 'SIN_PERMISO',
  'RNF-11: el aprobador de otra área no se la puede asignar → SIN_PERMISO'
);
select lives_ok(
  $$ select public.tomar_novedad('a4000000-0000-4000-8000-0000000000d2') $$,
  'RF-17 / CU-17 4: el aprobador del área nueva ya puede tomar la novedad reasignada'
);

reset role;
set local role authenticated;
set local request.jwt.claims = '{"sub": "a4000000-0000-4000-8000-000000000001", "role": "authenticated"}';

select throws_ok(
  $$ select public.reasignar_novedad('a4000000-0000-4000-8000-0000000000d3', 'a4000000-0000-4000-8000-0000000000b2', 'No es de esta área') $$,
  'P0001', 'SIN_PERMISO',
  'RF-17: el reportante no reasigna novedades → SIN_PERMISO'
);
select throws_ok(
  $$ select public.reasignar_novedad('a4000000-0000-4000-8000-0000000000d3', null, null) $$,
  'P0001', 'SIN_PERMISO',
  'SDD 6.1.3: el rol se comprueba antes que los datos (reportante, sin área y sin motivo → SIN_PERMISO)'
);

reset role;
set local role authenticated;
set local request.jwt.claims = '{"sub": "a4000000-0000-4000-8000-000000000006", "role": "authenticated"}';

select throws_ok(
  $$ select public.reasignar_novedad('a4000000-0000-4000-8000-0000000000d3', 'a4000000-0000-4000-8000-0000000000b2', 'No es de esta área') $$,
  'P0001', 'SIN_PERMISO',
  'RF-17: el director no reasigna novedades → SIN_PERMISO'
);

reset role;
set local role authenticated;
set local request.jwt.claims = '{"sub": "a4000000-0000-4000-8000-000000000007", "role": "authenticated"}';

select throws_ok(
  $$ select public.reasignar_novedad('a4000000-0000-4000-8000-0000000000d3', 'a4000000-0000-4000-8000-0000000000b2', 'No es de esta área') $$,
  'P0001', 'SIN_PERMISO',
  'RF-17: el administrador no reasigna novedades → SIN_PERMISO'
);

reset role;
set local role authenticated;
set local request.jwt.claims = '{"sub": "a4000000-0000-4000-8000-000000000005", "role": "authenticated"}';

select throws_ok(
  $$ select public.reasignar_novedad('a4000000-0000-4000-8000-0000000000d3', 'a4000000-0000-4000-8000-0000000000b2', 'No es de esta área') $$,
  'P0001', 'SIN_PERMISO',
  'RF-01 / RF-17: un aprobador desactivado → SIN_PERMISO'
);

reset role;
set local role authenticated;
set local request.jwt.claims = '{"sub": "a4000000-0000-4000-8000-000000000008", "role": "authenticated"}';

select throws_ok(
  $$ select public.reasignar_novedad('a4000000-0000-4000-8000-0000000000d3', 'a4000000-0000-4000-8000-0000000000b2', 'No es de esta área') $$,
  'P0001', 'SIN_PERMISO',
  'RF-17: una cuenta sin perfil → SIN_PERMISO'
);

reset role;
set local role anon;

select throws_ok(
  $$ select public.reasignar_novedad('a4000000-0000-4000-8000-0000000000d3', 'a4000000-0000-4000-8000-0000000000b2', 'No es de esta área') $$,
  '42501', null,
  'RNF-11: anon no puede ejecutar reasignar_novedad'
);

-- Lo que quedó escrito (como propietario: nadie ve los avisos de otro) ------------------------

reset role;

select results_eq(
  $$ select estado::text, area_id from public.novedad where id = 'a4000000-0000-4000-8000-0000000000d1' $$,
  $$ values ('asignada', 'a4000000-0000-4000-8000-0000000000b2'::uuid) $$,
  'RF-17 / CU-17 4: la novedad queda asignada en el área nueva'
);
select ok(
  (select actualizado_en > '2026-09-02'::timestamptz from public.novedad where id = 'a4000000-0000-4000-8000-0000000000d1'),
  'RF-16: actualizado_en refleja el cambio (lo mantiene el disparador)'
);
select results_eq(
  $$ select estado_anterior::text, estado_nuevo::text, usuario_id, observacion, area_anterior_id, area_nueva_id
     from public.historial_transicion
     where novedad_id = 'a4000000-0000-4000-8000-0000000000d1' $$,
  $$ values ('asignada', 'asignada', 'a4000000-0000-4000-8000-000000000002'::uuid,
             'Es un daño del aire acondicionado; lo atiende la otra área.',
             'a4000000-0000-4000-8000-0000000000b1'::uuid, 'a4000000-0000-4000-8000-0000000000b2'::uuid) $$,
  'RF-16 / CU-17 5: el historial registra el motivo, el área anterior y el área nueva'
);
select results_eq(
  $$ select estado_anterior::text, estado_nuevo::text, area_anterior_id, area_nueva_id
     from public.historial_transicion
     where novedad_id = 'a4000000-0000-4000-8000-0000000000d2' and usuario_id = 'a4000000-0000-4000-8000-000000000002' $$,
  $$ values ('en_atencion', 'asignada', 'a4000000-0000-4000-8000-0000000000b1'::uuid, 'a4000000-0000-4000-8000-0000000000b2'::uuid) $$,
  'RF-16: desde en atención, el historial registra en atención → asignada con las dos áreas'
);
select results_eq(
  $$ select estado::text, area_id from public.novedad where id = 'a4000000-0000-4000-8000-0000000000d3' $$,
  $$ values ('asignada', 'a4000000-0000-4000-8000-0000000000b1'::uuid) $$,
  'RF-17: los intentos sin permiso no cambian el estado ni el área'
);
select is(
  (select count(*)::int from public.historial_transicion where novedad_id = 'a4000000-0000-4000-8000-0000000000d3'),
  0,
  'RF-16: ni dejan registros en el historial'
);
select is(
  (select count(*)::int from public.historial_transicion where novedad_id = 'a4000000-0000-4000-8000-0000000000d1'),
  1,
  'RF-16: el segundo intento no agrega registros al historial'
);
select is(
  (select count(*)::int from public.historial_transicion where novedad_id = 'a4000000-0000-4000-8000-0000000000d8'),
  1,
  'RF-16: los intentos con datos inválidos no dejaron registros; solo la reasignación válida'
);
select results_eq(
  $$ select destinatario_id, estado_nuevo::text, leida
     from public.notificacion
     where novedad_id = 'a4000000-0000-4000-8000-0000000000d1'
     order by destinatario_id $$,
  $$ values
       ('a4000000-0000-4000-8000-000000000001'::uuid, 'asignada', false),
       ('a4000000-0000-4000-8000-000000000004'::uuid, 'asignada', false),
       ('a4000000-0000-4000-8000-00000000000c'::uuid, 'asignada', false) $$,
  'RF-30 / CU-17 6: un aviso sin leer para el reportante y para cada aprobador activo del área nueva; ni a quien actúa, ni a su colega, ni al desactivado'
);
select results_eq(
  $$ select destinatario_id
     from public.notificacion
     where novedad_id = 'a4000000-0000-4000-8000-0000000000d6'
     order by destinatario_id $$,
  $$ values ('a4000000-0000-4000-8000-000000000004'::uuid), ('a4000000-0000-4000-8000-00000000000c'::uuid) $$,
  'RF-30: si el reportante está desactivado, el aviso llega solo al área nueva'
);
select is(
  (select count(*)::int from public.notificacion where novedad_id = 'a4000000-0000-4000-8000-0000000000d3'),
  0,
  'RF-30: los intentos fallidos no avisan a nadie'
);

-- CU-16 1a · si falla el historial, se revierte todo -----------------------------------------

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
set local request.jwt.claims = '{"sub": "a4000000-0000-4000-8000-000000000002", "role": "authenticated"}';

select throws_ok(
  $$ select public.reasignar_novedad('a4000000-0000-4000-8000-0000000000d4', 'a4000000-0000-4000-8000-0000000000b2', 'No es de esta área') $$,
  'P0001', 'FALLA_SIMULADA_DEL_HISTORIAL',
  'RF-16 / CU-16 1a: si el registro del historial falla, la función informa el error'
);

reset role;

select results_eq(
  $$ select estado::text, area_id from public.novedad where id = 'a4000000-0000-4000-8000-0000000000d4' $$,
  $$ values ('asignada', 'a4000000-0000-4000-8000-0000000000b1'::uuid) $$,
  'RF-16 / CU-16 1a: y la novedad sigue en su área (se revierte el cambio)'
);
select is(
  (select count(*)::int from public.notificacion where novedad_id = 'a4000000-0000-4000-8000-0000000000d4'),
  0,
  'RF-16 / CU-16 1a: ni se envía ningún aviso'
);

-- El contrato sigue intacto -------------------------------------------------------------------

select ok(
  has_function_privilege('authenticated', 'public.reasignar_novedad(uuid, uuid, text)', 'execute'),
  'RF-17: authenticated conserva el permiso de ejecutar reasignar_novedad'
);
select ok(
  (select p.prosecdef and p.proconfig @> array['search_path=""'] from pg_proc p where p.oid = 'public.reasignar_novedad(uuid, uuid, text)'::regprocedure),
  'RNF-11: reasignar_novedad sigue siendo security definer con search_path vacío'
);

select * from finish();
rollback;
