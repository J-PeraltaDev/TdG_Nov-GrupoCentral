-- RF-30 / CU-30 · marcar_avisos_leidos y la escritura en notificacion (SDD 6.1.6; plan del
-- Sprint 5, decisión 29). El cliente ya no escribe en notificacion: la regla 1 de CLAUDE.md.
-- Se prueba a través del RPC, con el rol y el JWT de cada usuario. Los datos se crean dentro de
-- la transacción y no dependen del seed.
begin;

create extension if not exists pgtap with schema extensions;

select plan(18);

-- Datos de la prueba (como propietario) ------------------------------------------------

insert into public.razon_social (id, nombre)
values ('e3000000-0000-4000-8000-0000000000a1', 'RS pgTAP avisos');

insert into public.finca (id, razon_social_id, nombre)
values ('e3000000-0000-4000-8000-0000000000f1', 'e3000000-0000-4000-8000-0000000000a1', 'Finca pgTAP avisos');

insert into public.area (id, nombre)
values ('e3000000-0000-4000-8000-0000000000b1', 'Área pgTAP avisos');

insert into auth.users (instance_id, id, aud, role, email)
select '00000000-0000-0000-0000-000000000000', id, 'authenticated', 'authenticated', correo
from (
  values
    ('e3000000-0000-4000-8000-000000000001'::uuid, 'reportante@avisos.pgtap.test'),
    ('e3000000-0000-4000-8000-000000000002'::uuid, 'aprobador@avisos.pgtap.test'),
    ('e3000000-0000-4000-8000-000000000003'::uuid, 'inactivo@avisos.pgtap.test'),
    ('e3000000-0000-4000-8000-000000000004'::uuid, 'sin.perfil@avisos.pgtap.test')
) as u (id, correo);

insert into public.usuario (id, nombre, correo, rol_id, finca_id, area_id, activo)
values
  ('e3000000-0000-4000-8000-000000000001', 'Reportante', 'reportante@avisos.pgtap.test', 1, 'e3000000-0000-4000-8000-0000000000f1', null, true),
  ('e3000000-0000-4000-8000-000000000002', 'Aprobador', 'aprobador@avisos.pgtap.test', 2, null, 'e3000000-0000-4000-8000-0000000000b1', true),
  ('e3000000-0000-4000-8000-000000000003', 'Inactivo', 'inactivo@avisos.pgtap.test', 1, 'e3000000-0000-4000-8000-0000000000f1', null, false);

insert into public.novedad (id, id_local, finca_id, area_id, reportante_id, descripcion, prioridad, estado, fecha_registro)
values (
  'e3000000-0000-4000-8000-0000000000d1', gen_random_uuid(), 'e3000000-0000-4000-8000-0000000000f1',
  'e3000000-0000-4000-8000-0000000000b1', 'e3000000-0000-4000-8000-000000000001',
  'Novedad pgTAP avisos', 'normal', 'en_atencion', '2026-09-01 08:00:00-05'
);

-- r1 a r3, sin leer, y r4, ya leída, son del reportante; p1 es del aprobador.
insert into public.notificacion (id, destinatario_id, novedad_id, estado_nuevo, leida, leida_en)
values
  ('e3000000-0000-4000-8000-0000000000e1', 'e3000000-0000-4000-8000-000000000001', 'e3000000-0000-4000-8000-0000000000d1', 'asignada', false, null),
  ('e3000000-0000-4000-8000-0000000000e2', 'e3000000-0000-4000-8000-000000000001', 'e3000000-0000-4000-8000-0000000000d1', 'en_atencion', false, null),
  ('e3000000-0000-4000-8000-0000000000e3', 'e3000000-0000-4000-8000-000000000001', 'e3000000-0000-4000-8000-0000000000d1', 'escalada', false, null),
  ('e3000000-0000-4000-8000-0000000000e4', 'e3000000-0000-4000-8000-000000000001', 'e3000000-0000-4000-8000-0000000000d1', 'aprobada', true, '2026-09-01 10:00:00-05'),
  ('e3000000-0000-4000-8000-0000000000e5', 'e3000000-0000-4000-8000-000000000002', 'e3000000-0000-4000-8000-0000000000d1', 'cerrada', false, null);

-- El reportante marca sus avisos (CU-30 5) -----------------------------------------------

set local role authenticated;
set local request.jwt.claims = '{"sub": "e3000000-0000-4000-8000-000000000001", "role": "authenticated"}';

select is(
  public.marcar_avisos_leidos(array['e3000000-0000-4000-8000-0000000000e1']::uuid[]),
  1,
  'RF-30 / CU-30 5: abrir un aviso lo marca leído y devuelve cuántos marcó'
);
select results_eq(
  $$ select leida, leida_en = now() from public.notificacion where id = 'e3000000-0000-4000-8000-0000000000e1' $$,
  $$ values (true, true) $$,
  'RF-30: queda leído y la hora la pone el servidor'
);
select is(
  (select leida from public.notificacion where id = 'e3000000-0000-4000-8000-0000000000e2'),
  false,
  'RF-30: los demás avisos siguen sin leer'
);
select is(
  public.marcar_avisos_leidos(array['e3000000-0000-4000-8000-0000000000e1']::uuid[]),
  0,
  'RF-30: un aviso ya leído no se vuelve a contar'
);
select is(
  public.marcar_avisos_leidos(array['e3000000-0000-4000-8000-0000000000e5']::uuid[]),
  0,
  'RNF-11: el aviso de otra persona se ignora, sin error y sin decir que existe'
);
select is(
  public.marcar_avisos_leidos(array[]::uuid[]),
  0,
  'RF-30: una lista vacía no marca nada'
);
select is(
  public.marcar_avisos_leidos(),
  2,
  'RF-30: sin lista («Marcar todas como leídas») marca todos los del usuario sin leer'
);
select is(
  public.marcar_avisos_leidos(null),
  0,
  'RF-30: la segunda vez ya no queda ninguno'
);
select is(
  (select leida_en from public.notificacion where id = 'e3000000-0000-4000-8000-0000000000e4'),
  '2026-09-01 10:00:00-05'::timestamptz,
  'RF-30: un aviso leído antes conserva su hora de lectura'
);
select throws_ok(
  $$ update public.notificacion set leida = false where id = 'e3000000-0000-4000-8000-0000000000e1' $$,
  '42501',
  null,
  'Regla 1: el cliente ya no escribe directamente en notificacion'
);

-- Quien no puede marcar --------------------------------------------------------------

set local request.jwt.claims = '{"sub": "e3000000-0000-4000-8000-000000000003", "role": "authenticated"}';

select throws_ok(
  $$ select public.marcar_avisos_leidos() $$,
  'P0001', 'SIN_PERMISO',
  'RNF-11: un usuario inactivo no marca avisos'
);

set local request.jwt.claims = '{"sub": "e3000000-0000-4000-8000-000000000004", "role": "authenticated"}';

select throws_ok(
  $$ select public.marcar_avisos_leidos() $$,
  'P0001', 'SIN_PERMISO',
  'RNF-11: una cuenta sin perfil no marca avisos'
);

set local role anon;

select throws_ok(
  $$ select public.marcar_avisos_leidos() $$,
  '42501',
  null,
  'RNF-11: sin sesión no se puede ejecutar'
);

-- Lo que quedó (como propietario) ----------------------------------------------------------

reset role;

select is(
  (select leida from public.notificacion where id = 'e3000000-0000-4000-8000-0000000000e5'),
  false,
  'RNF-11: el aviso del aprobador sigue sin leer'
);
select is(
  (select count(*)::int from public.notificacion where destinatario_id = 'e3000000-0000-4000-8000-000000000001' and not leida),
  0,
  'RF-30: al reportante no le queda ningún aviso sin leer'
);
select policies_are(
  'public', 'notificacion', array['notificacion_lectura'],
  'Regla 1: notificacion solo tiene la política de lectura del destinatario'
);
select ok(
  not has_column_privilege('authenticated', 'public.notificacion', 'leida', 'update')
    and not has_column_privilege('authenticated', 'public.notificacion', 'leida_en', 'update'),
  'Regla 1: authenticated ya no puede actualizar leida ni leida_en'
);
select ok(
  has_table_privilege('authenticated', 'public.notificacion', 'select'),
  'RF-30: el destinatario sigue leyendo sus avisos (los filtra notificacion_lectura)'
);

select * from finish();

rollback;
