-- RF-03 / CU-03 · listar_usuarios y los privilegios de las cuentas (SDD 6.1.10, ADR 0010).
-- La función se prueba a través del RPC, con el rol y el JWT de cada usuario. Los datos se
-- crean dentro de la transacción y no dependen del seed: «staging» tiene sus propios usuarios,
-- así que los resultados se miran solo entre los de la prueba.
begin;

create extension if not exists pgtap with schema extensions;

select plan(22);

-- Datos de la prueba (como propietario) ------------------------------------------------

insert into public.razon_social (id, nombre)
values ('c3000000-0000-4000-8000-0000000000a1', 'RS pgTAP usuarios');

insert into public.finca (id, razon_social_id, nombre)
values ('c3000000-0000-4000-8000-0000000000f1', 'c3000000-0000-4000-8000-0000000000a1', 'Finca pgTAP usuarios');

insert into public.area (id, nombre)
values ('c3000000-0000-4000-8000-0000000000b1', 'Área pgTAP usuarios');

-- El administrador ingresó el 20 de septiembre; los demás, nunca.
insert into auth.users (instance_id, id, aud, role, email, last_sign_in_at)
select '00000000-0000-0000-0000-000000000000', id, 'authenticated', 'authenticated', correo, ingreso
from (
  values
    ('c3000000-0000-4000-8000-000000000001'::uuid, 'administrador@usuarios.pgtap.test', '2026-09-20 08:00:00-05'::timestamptz),
    ('c3000000-0000-4000-8000-000000000002'::uuid, 'reportante@usuarios.pgtap.test', null),
    ('c3000000-0000-4000-8000-000000000003'::uuid, 'aprobador@usuarios.pgtap.test', null),
    ('c3000000-0000-4000-8000-000000000004'::uuid, 'director@usuarios.pgtap.test', null),
    ('c3000000-0000-4000-8000-000000000005'::uuid, 'reportante.inactivo@usuarios.pgtap.test', null),
    ('c3000000-0000-4000-8000-000000000006'::uuid, 'administrador.inactivo@usuarios.pgtap.test', null),
    ('c3000000-0000-4000-8000-000000000007'::uuid, 'sin.perfil@usuarios.pgtap.test', null)
) as u (id, correo, ingreso);

insert into public.usuario (id, nombre, correo, rol_id, finca_id, area_id, activo)
values
  ('c3000000-0000-4000-8000-000000000001', 'Zz pgTAP Administrador', 'administrador@usuarios.pgtap.test', 4, null, null, true),
  ('c3000000-0000-4000-8000-000000000002', 'Zz pgTAP Reportante', 'reportante@usuarios.pgtap.test', 1, 'c3000000-0000-4000-8000-0000000000f1', null, true),
  ('c3000000-0000-4000-8000-000000000003', 'Zz pgTAP Aprobador', 'aprobador@usuarios.pgtap.test', 2, null, 'c3000000-0000-4000-8000-0000000000b1', true),
  ('c3000000-0000-4000-8000-000000000004', 'Zz pgTAP Director', 'director@usuarios.pgtap.test', 3, null, null, true),
  ('c3000000-0000-4000-8000-000000000005', 'Zz pgTAP Reportante inactivo', 'reportante.inactivo@usuarios.pgtap.test', 1, 'c3000000-0000-4000-8000-0000000000f1', null, false),
  ('c3000000-0000-4000-8000-000000000006', 'Zz pgTAP Administrador inactivo', 'administrador.inactivo@usuarios.pgtap.test', 4, null, null, false);

-- El contrato y los privilegios ----------------------------------------------------------------

select ok(
  (select p.prosecdef and p.proconfig @> array['search_path=""'] and p.provolatile = 's'
   from pg_proc p where p.oid = 'public.listar_usuarios()'::regprocedure),
  'RNF-11: listar_usuarios es security definer, con search_path vacío, y no modifica nada'
);
select ok(
  has_function_privilege('authenticated', 'public.listar_usuarios()', 'execute')
  and not has_function_privilege('anon', 'public.listar_usuarios()', 'execute'),
  'RNF-11: la ejecutan los usuarios autenticados, no anon'
);
select ok(
  has_table_privilege('service_role', 'public.usuario', 'select')
  and has_table_privilege('service_role', 'public.usuario', 'insert')
  and has_table_privilege('service_role', 'public.usuario', 'update'),
  'RF-03: la función gestionar-usuario (service_role) lee, crea y actualiza usuarios'
);
select ok(
  not has_table_privilege('service_role', 'public.usuario', 'delete')
  and not has_table_privilege('service_role', 'public.usuario', 'truncate'),
  'RF-03: ni siquiera service_role borra usuarios: se desactivan'
);
select ok(
  has_table_privilege('service_role', 'public.finca', 'select')
  and has_table_privilege('service_role', 'public.area', 'select'),
  'RF-03 / CU-03 6b: gestionar-usuario puede comprobar que la finca o el área existen y están activas'
);

-- CU-03 2 · el administrador ve todas las cuentas ------------------------------------------------

set local role authenticated;
set local request.jwt.claims = '{"sub": "c3000000-0000-4000-8000-000000000001", "role": "authenticated"}';

select is(
  (select count(*)::int from public.listar_usuarios() where id::text like 'c3000000-%'),
  6,
  'RF-03 / CU-03 2: el administrador recibe todos los usuarios, activos e inactivos'
);
select results_eq(
  $$ select nombre, correo, rol_id, finca_id, area_id, activo, creado_en is not null, ultimo_ingreso
     from public.listar_usuarios() where id = 'c3000000-0000-4000-8000-000000000002' $$,
  $$ values ('Zz pgTAP Reportante', 'reportante@usuarios.pgtap.test', 1::smallint,
             'c3000000-0000-4000-8000-0000000000f1'::uuid, null::uuid, true, true, null::timestamptz) $$,
  'RF-03: cada fila trae el nombre, el correo, el rol y la finca; quien nunca ha ingresado no tiene último ingreso'
);
select results_eq(
  $$ select correo, rol_id, finca_id, area_id
     from public.listar_usuarios() where id = 'c3000000-0000-4000-8000-000000000003' $$,
  $$ values ('aprobador@usuarios.pgtap.test', 2::smallint, null::uuid,
             'c3000000-0000-4000-8000-0000000000b1'::uuid) $$,
  'RF-03: el aprobador trae su área'
);
select is(
  (select ultimo_ingreso from public.listar_usuarios() where id = 'c3000000-0000-4000-8000-000000000001'),
  '2026-09-20 08:00:00-05'::timestamptz,
  'RF-03: el último ingreso sale de Auth'
);
select is(
  (select activo from public.listar_usuarios() where id = 'c3000000-0000-4000-8000-000000000005'),
  false,
  'RF-03 / CU-03 3a: los usuarios desactivados siguen en la lista, marcados como inactivos'
);
select is(
  (select count(*)::int from public.listar_usuarios() where id = 'c3000000-0000-4000-8000-000000000007'),
  0,
  'RF-03: una cuenta de Auth sin perfil no es un usuario de la aplicación'
);
select results_eq(
  $$ select nombre from public.listar_usuarios() where id::text like 'c3000000-%' $$,
  $$ select nombre from public.usuario where id::text like 'c3000000-%' order by nombre, id $$,
  'RF-03: la lista llega ordenada por nombre'
);

-- RNF-18 · el correo no sale por la API de datos, ni para el administrador ---------------------

select throws_ok(
  $$ select correo from public.usuario limit 1 $$,
  '42501', null,
  'RNF-18 / ADR 0010: ni el administrador lee el correo directamente de la tabla'
);
select lives_ok(
  $$ select id, nombre, rol_id, finca_id, area_id, activo from public.usuario limit 1 $$,
  'RF-03: las demás columnas sí se leen'
);

-- RNF-11 · solo un administrador activo ----------------------------------------------------------

reset role;
set local role authenticated;
set local request.jwt.claims = '{"sub": "c3000000-0000-4000-8000-000000000002", "role": "authenticated"}';
select throws_ok(
  $$ select * from public.listar_usuarios() $$,
  'P0001', 'SIN_PERMISO', 'RNF-11: el reportante no lista los usuarios'
);
select throws_ok(
  $$ select correo from public.usuario limit 1 $$,
  '42501', null,
  'RNF-18: ni lee el correo de nadie'
);

reset role;
set local role authenticated;
set local request.jwt.claims = '{"sub": "c3000000-0000-4000-8000-000000000003", "role": "authenticated"}';
select throws_ok(
  $$ select * from public.listar_usuarios() $$,
  'P0001', 'SIN_PERMISO', 'RNF-11: el aprobador no lista los usuarios'
);

reset role;
set local role authenticated;
set local request.jwt.claims = '{"sub": "c3000000-0000-4000-8000-000000000004", "role": "authenticated"}';
select throws_ok(
  $$ select * from public.listar_usuarios() $$,
  'P0001', 'SIN_PERMISO', 'RNF-11: el director no lista los usuarios'
);

reset role;
set local role authenticated;
set local request.jwt.claims = '{"sub": "c3000000-0000-4000-8000-000000000006", "role": "authenticated"}';
select throws_ok(
  $$ select * from public.listar_usuarios() $$,
  'P0001', 'SIN_PERMISO', 'RNF-11: un administrador desactivado no lista los usuarios'
);

reset role;
set local role authenticated;
set local request.jwt.claims = '{"sub": "c3000000-0000-4000-8000-000000000007", "role": "authenticated"}';
select throws_ok(
  $$ select * from public.listar_usuarios() $$,
  'P0001', 'SIN_PERMISO', 'RNF-11: una cuenta sin perfil no lista los usuarios'
);

reset role;
set local role authenticated;
set local request.jwt.claims = '{"role": "authenticated"}';
select throws_ok(
  $$ select * from public.listar_usuarios() $$,
  'P0001', 'SIN_PERMISO', 'RNF-11: sin identidad en el token, tampoco'
);

reset role;
set local role anon;
set local request.jwt.claims = '{"role": "anon"}';
select throws_ok(
  $$ select * from public.listar_usuarios() $$,
  '42501', null,
  'RNF-11: anon no puede ejecutar listar_usuarios'
);

select * from finish();
rollback;
