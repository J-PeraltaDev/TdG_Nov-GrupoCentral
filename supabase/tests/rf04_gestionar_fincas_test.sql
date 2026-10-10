-- RF-04 / CU-04 · gestionar fincas: las políticas de `finca` (SDD 6.1.4, Tabla 31) y la vista
-- v_finca, con los conteos de la pantalla 30.
-- El administrador escribe directamente en `finca`, con el rol y el JWT de cada usuario. Los
-- datos se crean dentro de la transacción y no dependen del seed.
begin;

create extension if not exists pgtap with schema extensions;

select plan(32);

-- Datos de la prueba (como propietario) ------------------------------------------------

insert into public.razon_social (id, nombre)
values
  ('c4000000-0000-4000-8000-0000000000a1', 'RS pgTAP fincas A'),
  ('c4000000-0000-4000-8000-0000000000a2', 'RS pgTAP fincas B');

insert into public.finca (id, razon_social_id, nombre)
values
  ('c4000000-0000-4000-8000-0000000000f1', 'c4000000-0000-4000-8000-0000000000a1', 'Finca pgTAP gestión'),
  ('c4000000-0000-4000-8000-0000000000f2', 'c4000000-0000-4000-8000-0000000000a1', 'Finca pgTAP sin nadie');

insert into public.area (id, nombre)
values ('c4000000-0000-4000-8000-0000000000b1', 'Área pgTAP fincas');

insert into auth.users (instance_id, id, aud, role, email)
select '00000000-0000-0000-0000-000000000000', id, 'authenticated', 'authenticated', correo
from (
  values
    ('c4000000-0000-4000-8000-000000000001'::uuid, 'administrador@fincas.pgtap.test'),
    ('c4000000-0000-4000-8000-000000000002'::uuid, 'reportante@fincas.pgtap.test'),
    ('c4000000-0000-4000-8000-000000000003'::uuid, 'aprobador@fincas.pgtap.test'),
    ('c4000000-0000-4000-8000-000000000004'::uuid, 'director@fincas.pgtap.test'),
    ('c4000000-0000-4000-8000-000000000005'::uuid, 'reportante.inactivo@fincas.pgtap.test'),
    ('c4000000-0000-4000-8000-000000000006'::uuid, 'administrador.inactivo@fincas.pgtap.test')
) as u (id, correo);

insert into public.usuario (id, nombre, correo, rol_id, finca_id, area_id, activo)
values
  ('c4000000-0000-4000-8000-000000000001', 'Administrador', 'administrador@fincas.pgtap.test', 4, null, null, true),
  ('c4000000-0000-4000-8000-000000000002', 'Reportante', 'reportante@fincas.pgtap.test', 1, 'c4000000-0000-4000-8000-0000000000f1', null, true),
  ('c4000000-0000-4000-8000-000000000003', 'Aprobador', 'aprobador@fincas.pgtap.test', 2, null, 'c4000000-0000-4000-8000-0000000000b1', true),
  ('c4000000-0000-4000-8000-000000000004', 'Director', 'director@fincas.pgtap.test', 3, null, null, true),
  ('c4000000-0000-4000-8000-000000000005', 'Reportante inactivo', 'reportante.inactivo@fincas.pgtap.test', 1, 'c4000000-0000-4000-8000-0000000000f1', null, false),
  ('c4000000-0000-4000-8000-000000000006', 'Administrador inactivo', 'administrador.inactivo@fincas.pgtap.test', 4, null, null, false);

insert into public.tipo_falla (id, nombre, nombre_normalizado, creado_por)
values ('c4000000-0000-4000-8000-0000000000c1', 'Tipo pgTAP fincas', 'tipo pgtap fincas', 'c4000000-0000-4000-8000-000000000001');

-- Cuatro novedades de la finca f1: dos abiertas (asignada y en atención) y dos en un estado
-- final (cerrada y rechazada).
insert into public.novedad (
  id, id_local, finca_id, area_id, reportante_id, descripcion, prioridad, estado,
  fecha_registro, tipo_falla_id, solucion, fecha_ejecucion
)
select
  ('c4000000-0000-4000-8000-0000000000d' || n.sufijo)::uuid,
  ('c4000000-0000-4000-8000-0000000000e' || n.sufijo)::uuid,
  'c4000000-0000-4000-8000-0000000000f1',
  'c4000000-0000-4000-8000-0000000000b1',
  'c4000000-0000-4000-8000-000000000002',
  'Novedad pgTAP fincas ' || n.sufijo,
  'normal',
  n.estado::public.estado_novedad,
  '2026-09-01 08:00:00-05',
  case when n.estado = 'cerrada' then 'c4000000-0000-4000-8000-0000000000c1'::uuid end,
  case when n.estado = 'cerrada' then 'Solución de prueba' end,
  case when n.estado = 'cerrada' then date '2026-09-02' end
from (
  values ('1', 'asignada'), ('2', 'en_atencion'), ('3', 'cerrada'), ('4', 'rechazada')
) as n (sufijo, estado);

-- La vista --------------------------------------------------------------------------------------

select has_view('public', 'v_finca', 'RF-04: existe la vista v_finca');
select ok(
  (select c.reloptions @> array['security_invoker=true'] from pg_class c where c.oid = 'public.v_finca'::regclass),
  'RNF-11: v_finca se declara con security_invoker'
);
select ok(
  has_table_privilege('authenticated', 'public.v_finca', 'select')
  and not has_table_privilege('anon', 'public.v_finca', 'select')
  and not has_table_privilege('authenticated', 'public.v_finca', 'insert'),
  'RNF-11: v_finca solo la leen los usuarios autenticados'
);

-- CU-04 · el administrador crea y edita --------------------------------------------------------

set local role authenticated;
set local request.jwt.claims = '{"sub": "c4000000-0000-4000-8000-000000000001", "role": "authenticated"}';

select results_eq(
  $$ select nombre, razon_social, activo, novedades_abiertas, reportantes_activos
     from public.v_finca where id = 'c4000000-0000-4000-8000-0000000000f1' $$,
  $$ values ('Finca pgTAP gestión', 'RS pgTAP fincas A', true, 2, 1) $$,
  'RF-04 / CU-04 2: la lista trae la razón social, las novedades abiertas (no las cerradas ni las rechazadas) y los reportantes activos'
);
select results_eq(
  $$ select novedades_abiertas, reportantes_activos
     from public.v_finca where id = 'c4000000-0000-4000-8000-0000000000f2' $$,
  $$ values (0, 0) $$,
  'RF-04: una finca sin novedades ni reportantes cuenta cero'
);
select lives_ok(
  $$ insert into public.finca (id, razon_social_id, nombre)
     values ('c4000000-0000-4000-8000-0000000000f3', 'c4000000-0000-4000-8000-0000000000a1', 'Finca pgTAP nueva') $$,
  'RF-04 / CU-04 5 y 6: el administrador crea una finca'
);
select results_eq(
  $$ select activo, creado_en is not null from public.finca where id = 'c4000000-0000-4000-8000-0000000000f3' $$,
  $$ values (true, true) $$,
  'RF-04: la finca nueva queda activa'
);
select throws_ok(
  $$ insert into public.finca (razon_social_id, nombre)
     values ('c4000000-0000-4000-8000-0000000000a1', 'Finca pgTAP nueva') $$,
  '23505', null,
  'RF-04 / CU-04 6a: el mismo nombre en la misma razón social se rechaza (23505)'
);
select lives_ok(
  $$ insert into public.finca (id, razon_social_id, nombre)
     values ('c4000000-0000-4000-8000-0000000000f4', 'c4000000-0000-4000-8000-0000000000a2', 'Finca pgTAP nueva') $$,
  'RF-04 / CU-04 6a: el mismo nombre en otra razón social sí se admite'
);
select throws_ok(
  $$ insert into public.finca (razon_social_id, nombre)
     values ('c4000000-0000-4000-8000-0000000000a1', '   ') $$,
  '23514', null,
  'RF-04: un nombre vacío o de solo espacios se rechaza'
);
select throws_ok(
  $$ update public.finca set nombre = 'Finca pgTAP gestión'
     where id = 'c4000000-0000-4000-8000-0000000000f3' $$,
  '23505', null,
  'RF-04 / CU-04 6a: al editar tampoco puede quedar con el nombre de otra de su razón social'
);
select lives_ok(
  $$ update public.finca
     set nombre = 'Finca pgTAP renombrada', razon_social_id = 'c4000000-0000-4000-8000-0000000000a2'
     where id = 'c4000000-0000-4000-8000-0000000000f3' $$,
  'RF-04 / CU-04 5: el administrador edita el nombre y la razón social'
);
select results_eq(
  $$ select nombre, razon_social from public.v_finca where id = 'c4000000-0000-4000-8000-0000000000f3' $$,
  $$ values ('Finca pgTAP renombrada', 'RS pgTAP fincas B') $$,
  'RF-04: y la lista lo refleja'
);
select throws_ok(
  $$ delete from public.finca where id = 'c4000000-0000-4000-8000-0000000000f3' $$,
  '42501', null,
  'RF-04: una finca no se borra, ni siquiera el administrador: se desactiva'
);

-- CU-04 3a · desactivar: las novedades siguen su curso, pero no se registran nuevas -----------

select lives_ok(
  $$ update public.finca set activo = false where id = 'c4000000-0000-4000-8000-0000000000f1' $$,
  'RF-04 / CU-04 3: el administrador desactiva una finca con novedades abiertas'
);
select results_eq(
  $$ select activo, novedades_abiertas from public.v_finca where id = 'c4000000-0000-4000-8000-0000000000f1' $$,
  $$ values (false, 2) $$,
  'RF-04 / CU-04 3b: queda inactiva y conserva sus novedades abiertas'
);

reset role;
set local role authenticated;
set local request.jwt.claims = '{"sub": "c4000000-0000-4000-8000-000000000002", "role": "authenticated"}';

select throws_ok(
  $$ select public.registrar_novedad(
       'c4000000-0000-4000-8000-0000000000e9', 'No debería registrarse', 'normal',
       'c4000000-0000-4000-8000-0000000000b1', now()
     ) $$,
  'P0001', 'FINCA_NO_ASIGNADA',
  'RF-04 / CU-04 3a: el reportante de una finca desactivada no puede registrar novedades nuevas'
);
select is(
  (select count(*)::int from public.v_novedad where finca_id = 'c4000000-0000-4000-8000-0000000000f1'),
  4,
  'RF-04 / CU-04 3b: pero sigue viendo las novedades de su finca, que siguen su curso'
);

-- RNF-11 · los demás roles no escriben ----------------------------------------------------------

select throws_ok(
  $$ insert into public.finca (razon_social_id, nombre)
     values ('c4000000-0000-4000-8000-0000000000a1', 'Finca del reportante') $$,
  '42501', null,
  'RNF-11: el reportante no crea fincas'
);
-- La política de actualización no le deja tocar ninguna fila: la sentencia no falla, pero no
-- cambia nada.
update public.finca set nombre = 'Cambiada por el reportante'
where id = 'c4000000-0000-4000-8000-0000000000f2';

select is(
  (select nombre from public.finca where id = 'c4000000-0000-4000-8000-0000000000f2'),
  'Finca pgTAP sin nadie',
  'RNF-11: ni las edita; sí las puede leer'
);

reset role;
set local role authenticated;
set local request.jwt.claims = '{"sub": "c4000000-0000-4000-8000-000000000003", "role": "authenticated"}';

select throws_ok(
  $$ insert into public.finca (razon_social_id, nombre)
     values ('c4000000-0000-4000-8000-0000000000a1', 'Finca del aprobador') $$,
  '42501', null,
  'RNF-11: el aprobador no crea fincas'
);
update public.finca set activo = false where id = 'c4000000-0000-4000-8000-0000000000f2';

select is(
  (select activo from public.finca where id = 'c4000000-0000-4000-8000-0000000000f2'),
  true,
  'RNF-11: ni las desactiva'
);

reset role;
set local role authenticated;
set local request.jwt.claims = '{"sub": "c4000000-0000-4000-8000-000000000004", "role": "authenticated"}';

select throws_ok(
  $$ insert into public.finca (razon_social_id, nombre)
     values ('c4000000-0000-4000-8000-0000000000a1', 'Finca del director') $$,
  '42501', null,
  'RNF-11: el director no crea fincas'
);
update public.finca set activo = false where id = 'c4000000-0000-4000-8000-0000000000f2';

select is(
  (select activo from public.finca where id = 'c4000000-0000-4000-8000-0000000000f2'),
  true,
  'RNF-11: ni las desactiva'
);

reset role;
set local role authenticated;
set local request.jwt.claims = '{"sub": "c4000000-0000-4000-8000-000000000006", "role": "authenticated"}';

select throws_ok(
  $$ insert into public.finca (razon_social_id, nombre)
     values ('c4000000-0000-4000-8000-0000000000a1', 'Finca del administrador inactivo') $$,
  '42501', null,
  'RNF-11: un administrador desactivado no crea fincas'
);
select is(
  (select count(*)::int from public.v_finca),
  0,
  'RNF-11: ni las ve'
);

reset role;
set local role anon;
set local request.jwt.claims = '{"role": "anon"}';

select throws_ok(
  $$ select count(*) from public.finca $$, '42501', null, 'RNF-11: anon no lee fincas'
);
select throws_ok(
  $$ select count(*) from public.v_finca $$, '42501', null, 'RNF-11: ni la vista'
);
select throws_ok(
  $$ insert into public.finca (razon_social_id, nombre)
     values ('c4000000-0000-4000-8000-0000000000a1', 'Finca de anon') $$,
  '42501', null,
  'RNF-11: ni las crea'
);

-- CU-04 3 · reactivar ---------------------------------------------------------------------------

reset role;
set local role authenticated;
set local request.jwt.claims = '{"sub": "c4000000-0000-4000-8000-000000000001", "role": "authenticated"}';

select lives_ok(
  $$ update public.finca set activo = true where id = 'c4000000-0000-4000-8000-0000000000f1' $$,
  'RF-04: el administrador reactiva la finca'
);

reset role;
set local role authenticated;
set local request.jwt.claims = '{"sub": "c4000000-0000-4000-8000-000000000002", "role": "authenticated"}';

select lives_ok(
  $$ select public.registrar_novedad(
       'c4000000-0000-4000-8000-0000000000e9', 'Ahora sí se registra', 'normal',
       'c4000000-0000-4000-8000-0000000000b1', now()
     ) $$,
  'RF-04: y su reportante vuelve a registrar novedades'
);

reset role;

select is(
  (select novedades_abiertas from public.v_finca where id = 'c4000000-0000-4000-8000-0000000000f1'),
  3,
  'RF-04: la novedad nueva cuenta entre las abiertas'
);

select * from finish();
rollback;
