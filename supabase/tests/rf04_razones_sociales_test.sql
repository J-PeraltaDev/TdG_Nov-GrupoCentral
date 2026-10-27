-- RF-04 · Razones sociales desde la aplicación (cambio 40 de cambios-sdd): las políticas de
-- `razon_social`. El administrador escribe directamente en la tabla, como en `finca`. Los datos
-- se crean dentro de la transacción y no dependen del seed.
begin;

create extension if not exists pgtap with schema extensions;

select plan(11);

-- Datos de la prueba (como propietario) ------------------------------------------------

insert into public.razon_social (id, nombre)
values ('c5000000-0000-4000-8000-0000000000a1', 'RS pgTAP razones A');

insert into public.finca (id, razon_social_id, nombre)
values ('c5000000-0000-4000-8000-0000000000f1', 'c5000000-0000-4000-8000-0000000000a1', 'Finca pgTAP razones');

insert into public.area (id, nombre)
values ('c5000000-0000-4000-8000-0000000000b1', 'Área pgTAP razones');

insert into auth.users (instance_id, id, aud, role, email)
select '00000000-0000-0000-0000-000000000000', id, 'authenticated', 'authenticated', correo
from (
  values
    ('c5000000-0000-4000-8000-000000000001'::uuid, 'administrador@razones.pgtap.test'),
    ('c5000000-0000-4000-8000-000000000002'::uuid, 'reportante@razones.pgtap.test'),
    ('c5000000-0000-4000-8000-000000000003'::uuid, 'aprobador@razones.pgtap.test'),
    ('c5000000-0000-4000-8000-000000000006'::uuid, 'administrador.inactivo@razones.pgtap.test')
) as u (id, correo);

insert into public.usuario (id, nombre, correo, rol_id, finca_id, area_id, activo)
values
  ('c5000000-0000-4000-8000-000000000001', 'Administrador', 'administrador@razones.pgtap.test', 4, null, null, true),
  ('c5000000-0000-4000-8000-000000000002', 'Reportante', 'reportante@razones.pgtap.test', 1, 'c5000000-0000-4000-8000-0000000000f1', null, true),
  ('c5000000-0000-4000-8000-000000000003', 'Aprobador', 'aprobador@razones.pgtap.test', 2, null, 'c5000000-0000-4000-8000-0000000000b1', true),
  ('c5000000-0000-4000-8000-000000000006', 'Administrador inactivo', 'administrador.inactivo@razones.pgtap.test', 4, null, null, false);

set local role authenticated;

-- El administrador ---------------------------------------------------------------------

set local request.jwt.claims = '{"sub": "c5000000-0000-4000-8000-000000000001", "role": "authenticated"}';

select lives_ok(
  $$ insert into public.razon_social (nombre) values ('RS pgTAP razones nueva') $$,
  'RF-04 (cambio 40): el administrador crea una razón social'
);
select is(
  (select activo from public.razon_social where nombre = 'RS pgTAP razones nueva'),
  true,
  'RF-04 (cambio 40): la razón social nueva queda activa'
);
select throws_ok(
  $$ insert into public.razon_social (nombre) values ('RS pgTAP razones A') $$,
  '23505', null,
  'RF-04 (cambio 40): no se repite el nombre de otra razón social (23505)'
);
select throws_ok(
  $$ insert into public.razon_social (nombre) values ('   ') $$,
  '23514', null,
  'RF-04 (cambio 40): un nombre vacío o de solo espacios se rechaza'
);
select throws_ok(
  $$ insert into public.razon_social (id, nombre) values (gen_random_uuid(), 'RS pgTAP con id') $$,
  '42501', null,
  'RF-04 (cambio 40): el cliente no elige el id'
);
select results_eq(
  $$ update public.razon_social set nombre = 'RS pgTAP razones A2', activo = false
     where id = 'c5000000-0000-4000-8000-0000000000a1' returning nombre, activo $$,
  $$ values ('RS pgTAP razones A2', false) $$,
  'RF-04 (cambio 40): el administrador la renombra y la desactiva'
);
select results_eq(
  $$ select razon_social from public.v_finca where id = 'c5000000-0000-4000-8000-0000000000f1' $$,
  $$ values ('RS pgTAP razones A2') $$,
  'RF-04 (cambio 40): la finca conserva su razón social desactivada, con el nombre nuevo'
);

-- Los demás roles ----------------------------------------------------------------------

set local request.jwt.claims = '{"sub": "c5000000-0000-4000-8000-000000000002", "role": "authenticated"}';
select throws_ok(
  $$ insert into public.razon_social (nombre) values ('RS pgTAP del reportante') $$,
  '42501', null,
  'RF-04 (cambio 40): el reportante no crea razones sociales'
);

set local request.jwt.claims = '{"sub": "c5000000-0000-4000-8000-000000000003", "role": "authenticated"}';
select is_empty(
  $$ update public.razon_social set activo = true
     where id = 'c5000000-0000-4000-8000-0000000000a1' returning id $$,
  'RF-04 (cambio 40): el aprobador no cambia una razón social (la política la deja sin filas)'
);

set local request.jwt.claims = '{"sub": "c5000000-0000-4000-8000-000000000006", "role": "authenticated"}';
select throws_ok(
  $$ insert into public.razon_social (nombre) values ('RS pgTAP del inactivo') $$,
  '42501', null,
  'RNF-11: un administrador inactivo no crea razones sociales'
);

reset role;
select ok(
  not has_table_privilege('anon', 'public.razon_social', 'insert')
    and not has_table_privilege('anon', 'public.razon_social', 'update'),
  'RNF-11: anon no escribe en razon_social'
);

select * from finish();

rollback;
