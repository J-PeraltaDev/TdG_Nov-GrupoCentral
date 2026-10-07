-- RF-05, RF-06, RF-07 y RF-16 · registrar_novedad (SDD 6.1.3 y Tabla 30).
-- Se prueba el comportamiento a través del RPC, con el rol y el JWT de cada usuario.
-- Los datos se crean dentro de la transacción; el área de la prueba es propia para que los
-- avisos no dependan de los aprobadores del seed.
begin;

create extension if not exists pgtap with schema extensions;

select plan(37);

-- Datos de la prueba (como propietario) ------------------------------------------------

insert into public.razon_social (id, nombre)
values ('30000000-0000-4000-8000-0000000000a1', 'RS pgTAP registro');

insert into public.finca (id, razon_social_id, nombre, activo)
values
  ('30000000-0000-4000-8000-0000000000f1', '30000000-0000-4000-8000-0000000000a1', 'Finca pgTAP registro A', true),
  ('30000000-0000-4000-8000-0000000000f2', '30000000-0000-4000-8000-0000000000a1', 'Finca pgTAP registro B', true),
  ('30000000-0000-4000-8000-0000000000f3', '30000000-0000-4000-8000-0000000000a1', 'Finca pgTAP registro inactiva', false);

insert into public.area (id, nombre, activo)
values
  ('30000000-0000-4000-8000-0000000000b1', 'Área pgTAP registro', true),
  ('30000000-0000-4000-8000-0000000000b2', 'Área pgTAP registro inactiva', false);

insert into auth.users (instance_id, id, aud, role, email)
select '00000000-0000-0000-0000-000000000000', id, 'authenticated', 'authenticated', correo
from (
  values
    ('30000000-0000-4000-8000-000000000001'::uuid, 'reportante.a@registro.pgtap.test'),
    ('30000000-0000-4000-8000-000000000002'::uuid, 'reportante.b@registro.pgtap.test'),
    ('30000000-0000-4000-8000-000000000003'::uuid, 'reportante.finca.inactiva@registro.pgtap.test'),
    ('30000000-0000-4000-8000-000000000004'::uuid, 'reportante.inactivo@registro.pgtap.test'),
    ('30000000-0000-4000-8000-000000000005'::uuid, 'aprobador@registro.pgtap.test'),
    ('30000000-0000-4000-8000-000000000006'::uuid, 'aprobador.inactivo@registro.pgtap.test'),
    ('30000000-0000-4000-8000-000000000007'::uuid, 'aprobador.otra.area@registro.pgtap.test'),
    ('30000000-0000-4000-8000-000000000008'::uuid, 'director@registro.pgtap.test'),
    ('30000000-0000-4000-8000-000000000009'::uuid, 'administrador@registro.pgtap.test'),
    ('30000000-0000-4000-8000-00000000000a'::uuid, 'sin.perfil@registro.pgtap.test')
) as u (id, correo);

insert into public.usuario (id, nombre, correo, rol_id, finca_id, area_id, activo)
values
  ('30000000-0000-4000-8000-000000000001', 'Reportante A', 'reportante.a@registro.pgtap.test', 1, '30000000-0000-4000-8000-0000000000f1', null, true),
  ('30000000-0000-4000-8000-000000000002', 'Reportante B', 'reportante.b@registro.pgtap.test', 1, '30000000-0000-4000-8000-0000000000f2', null, true),
  ('30000000-0000-4000-8000-000000000003', 'Reportante de finca inactiva', 'reportante.finca.inactiva@registro.pgtap.test', 1, '30000000-0000-4000-8000-0000000000f3', null, true),
  ('30000000-0000-4000-8000-000000000004', 'Reportante inactivo', 'reportante.inactivo@registro.pgtap.test', 1, '30000000-0000-4000-8000-0000000000f1', null, false),
  ('30000000-0000-4000-8000-000000000005', 'Aprobador del área', 'aprobador@registro.pgtap.test', 2, null, '30000000-0000-4000-8000-0000000000b1', true),
  ('30000000-0000-4000-8000-000000000006', 'Aprobador inactivo', 'aprobador.inactivo@registro.pgtap.test', 2, null, '30000000-0000-4000-8000-0000000000b1', false),
  ('30000000-0000-4000-8000-000000000007', 'Aprobador de otra área', 'aprobador.otra.area@registro.pgtap.test', 2, null, (select id from public.area where nombre = 'Sistemas'), true),
  ('30000000-0000-4000-8000-000000000008', 'Director', 'director@registro.pgtap.test', 3, null, null, true),
  ('30000000-0000-4000-8000-000000000009', 'Administrador', 'administrador@registro.pgtap.test', 4, null, null, true);

-- CU-05, CU-06 y CU-07 · curso normal ---------------------------------------------------

set local role authenticated;
set local request.jwt.claims = '{"sub": "30000000-0000-4000-8000-000000000001", "role": "authenticated"}';

select lives_ok(
  $$ select public.registrar_novedad(
       '30000000-0000-4000-8000-0000000000e1', '  La bomba de riego no enciende  ', 'alto',
       '30000000-0000-4000-8000-0000000000b1', '2026-10-01 08:00:00-05') $$,
  'RF-05 / CU-05: el reportante registra una novedad de su finca'
);
select results_eq(
  $$ select estado::text, finca_id, area_id, reportante_id, descripcion, prioridad::text
     from public.novedad where id_local = '30000000-0000-4000-8000-0000000000e1' $$,
  $$ values ('asignada', '30000000-0000-4000-8000-0000000000f1'::uuid, '30000000-0000-4000-8000-0000000000b1'::uuid,
             '30000000-0000-4000-8000-000000000001'::uuid, 'La bomba de riego no enciende', 'alto') $$,
  'RF-07 / CU-07: queda asignada al área elegida, en la finca del reportante y a su nombre'
);
select ok(
  (select codigo > 0 from public.novedad where id_local = '30000000-0000-4000-8000-0000000000e1'),
  'RF-06 / CU-06: recibe un código consecutivo'
);
select is(
  (select fecha_registro from public.novedad where id_local = '30000000-0000-4000-8000-0000000000e1'),
  '2026-10-01 08:00:00-05'::timestamptz,
  'RNF-09: conserva la fecha real de registro que envió el dispositivo'
);
select ok(
  (select fecha_sincronizacion > now() - interval '1 minute' and fecha_sincronizacion > fecha_registro
   from public.novedad where id_local = '30000000-0000-4000-8000-0000000000e1'),
  'RNF-09: la fecha de sincronización es la del servidor, separada de la de registro'
);
select results_eq(
  $$ select h.estado_anterior::text, h.estado_nuevo::text, h.usuario_id, h.area_nueva_id,
            h.fecha_hora = '2026-10-01 08:00:00-05'::timestamptz
     from public.historial_transicion h
     join public.novedad n on n.id = h.novedad_id
     where n.id_local = '30000000-0000-4000-8000-0000000000e1'
     order by h.id $$,
  $$ values
       (null::text, 'registrada', '30000000-0000-4000-8000-000000000001'::uuid, null::uuid, true),
       ('registrada', 'asignada', '30000000-0000-4000-8000-000000000001'::uuid, '30000000-0000-4000-8000-0000000000b1'::uuid, false) $$,
  'RF-16 / CU-16: el historial tiene dos registros en orden: creación (con la fecha real) y enrutamiento'
);
select is(
  (select r.codigo from public.registrar_novedad(
     '30000000-0000-4000-8000-0000000000e1', 'Otro texto', 'bajo', '30000000-0000-4000-8000-0000000000b1', now()) as r),
  (select codigo from public.novedad where id_local = '30000000-0000-4000-8000-0000000000e1'),
  'RNF-08: repetir el envío con el mismo id_local devuelve la misma novedad, con el mismo código'
);
select results_eq(
  $$ select count(*)::int, min(descripcion) from public.novedad where id_local = '30000000-0000-4000-8000-0000000000e1' $$,
  $$ values (1, 'La bomba de riego no enciende') $$,
  'RNF-08: el reenvío no crea otra fila ni cambia la novedad'
);
select is(
  (select count(*)::int from public.historial_transicion h join public.novedad n on n.id = h.novedad_id
   where n.id_local = '30000000-0000-4000-8000-0000000000e1'),
  2,
  'RNF-08: el reenvío no agrega registros al historial'
);

-- El siguiente código es el anterior más uno: el reenvío no consumió la secuencia.
select lives_ok(
  $$ select public.registrar_novedad(
       '30000000-0000-4000-8000-0000000000e2', 'El portón eléctrico quedó abierto', 'critico',
       '30000000-0000-4000-8000-0000000000b1', now() + interval '2 days') $$,
  'RF-05: el reportante registra una segunda novedad'
);
select is(
  (select codigo from public.novedad where id_local = '30000000-0000-4000-8000-0000000000e2'),
  (select codigo + 1 from public.novedad where id_local = '30000000-0000-4000-8000-0000000000e1'),
  'RF-06 / RNF-08: los códigos son consecutivos, sin saltos por los reenvíos'
);
select ok(
  (select fecha_registro <= now() from public.novedad where id_local = '30000000-0000-4000-8000-0000000000e2'),
  'RNF-09: una fecha de registro futura se reemplaza por la hora del servidor'
);
select lives_ok(
  $$ select public.registrar_novedad(
       '30000000-0000-4000-8000-0000000000e3', 'Sin fecha del dispositivo', 'bajo',
       '30000000-0000-4000-8000-0000000000b1', null) $$,
  'RF-05: acepta una fecha de registro nula'
);
select ok(
  (select fecha_registro = fecha_sincronizacion from public.novedad where id_local = '30000000-0000-4000-8000-0000000000e3'),
  'RNF-09: sin fecha del dispositivo, la fecha de registro es la del servidor'
);

-- CU-05 4a · datos obligatorios -----------------------------------------------------------

select throws_ok(
  $$ select public.registrar_novedad(gen_random_uuid(), '', 'alto', '30000000-0000-4000-8000-0000000000b1', now()) $$,
  'P0001', 'DATO_OBLIGATORIO',
  'RF-05 / CU-05 4a: descripción vacía → DATO_OBLIGATORIO'
);
select throws_ok(
  $$ select public.registrar_novedad(gen_random_uuid(), '     ', 'alto', '30000000-0000-4000-8000-0000000000b1', now()) $$,
  'P0001', 'DATO_OBLIGATORIO',
  'RF-05 / CU-05 4a: descripción de solo espacios → DATO_OBLIGATORIO'
);
select throws_ok(
  $$ select public.registrar_novedad(gen_random_uuid(), null, 'alto', '30000000-0000-4000-8000-0000000000b1', now()) $$,
  'P0001', 'DATO_OBLIGATORIO',
  'RF-05 / CU-05 4a: descripción nula → DATO_OBLIGATORIO'
);
select throws_ok(
  $$ select public.registrar_novedad(gen_random_uuid(), repeat('a', 501), 'alto', '30000000-0000-4000-8000-0000000000b1', now()) $$,
  'P0001', 'DATO_OBLIGATORIO',
  'RF-05 / CU-05 4a: descripción de más de 500 caracteres → DATO_OBLIGATORIO'
);
select lives_ok(
  $$ select public.registrar_novedad('30000000-0000-4000-8000-0000000000e4', repeat('a', 500), 'alto', '30000000-0000-4000-8000-0000000000b1', now()) $$,
  'RF-05: una descripción de exactamente 500 caracteres sí se acepta'
);
select throws_ok(
  $$ select public.registrar_novedad(gen_random_uuid(), 'Sin prioridad', null, '30000000-0000-4000-8000-0000000000b1', now()) $$,
  'P0001', 'DATO_OBLIGATORIO',
  'RF-05 / CU-05 4a: prioridad nula → DATO_OBLIGATORIO'
);
select throws_ok(
  $$ select public.registrar_novedad(gen_random_uuid(), 'Sin área', 'alto', null, now()) $$,
  'P0001', 'DATO_OBLIGATORIO',
  'RF-05 / CU-05 4a: área nula → DATO_OBLIGATORIO'
);
select throws_ok(
  $$ select public.registrar_novedad(null, 'Sin identificador local', 'alto', '30000000-0000-4000-8000-0000000000b1', now()) $$,
  'P0001', 'DATO_OBLIGATORIO',
  'RNF-08: identificador local nulo → DATO_OBLIGATORIO'
);

-- Área inválida ---------------------------------------------------------------------------

select throws_ok(
  $$ select public.registrar_novedad(gen_random_uuid(), 'Área inactiva', 'alto', '30000000-0000-4000-8000-0000000000b2', now()) $$,
  'P0001', 'AREA_INVALIDA',
  'RF-05: área inactiva → AREA_INVALIDA'
);
select throws_ok(
  $$ select public.registrar_novedad(gen_random_uuid(), 'Área inexistente', 'alto', '30000000-0000-4000-8000-0000000000bf', now()) $$,
  'P0001', 'AREA_INVALIDA',
  'RF-05: área inexistente → AREA_INVALIDA'
);

-- Sin permiso -----------------------------------------------------------------------------

reset role;
set local role authenticated;
set local request.jwt.claims = '{"sub": "30000000-0000-4000-8000-000000000002", "role": "authenticated"}';

select throws_ok(
  $$ select public.registrar_novedad(
       '30000000-0000-4000-8000-0000000000e1', 'Con el id_local de otro', 'alto', '30000000-0000-4000-8000-0000000000b1', now()) $$,
  'P0001', 'SIN_PERMISO',
  'RNF-08: el id_local de una novedad de otro reportante → SIN_PERMISO'
);
select lives_ok(
  $$ select public.registrar_novedad(
       '30000000-0000-4000-8000-0000000000e5', 'El computador no enciende', 'normal', '30000000-0000-4000-8000-0000000000b1', now()) $$,
  'RF-05: otro reportante registra una novedad'
);
select is(
  (select finca_id from public.novedad where id_local = '30000000-0000-4000-8000-0000000000e5'),
  '30000000-0000-4000-8000-0000000000f2'::uuid,
  'RF-05: la finca es siempre la del reportante que registra'
);

reset role;
set local role authenticated;
set local request.jwt.claims = '{"sub": "30000000-0000-4000-8000-000000000003", "role": "authenticated"}';

select throws_ok(
  $$ select public.registrar_novedad(gen_random_uuid(), 'Finca inactiva', 'alto', '30000000-0000-4000-8000-0000000000b1', now()) $$,
  'P0001', 'FINCA_NO_ASIGNADA',
  'RF-05: reportante con la finca inactiva → FINCA_NO_ASIGNADA'
);

reset role;
set local role authenticated;
set local request.jwt.claims = '{"sub": "30000000-0000-4000-8000-000000000004", "role": "authenticated"}';

select throws_ok(
  $$ select public.registrar_novedad(gen_random_uuid(), 'Usuario inactivo', 'alto', '30000000-0000-4000-8000-0000000000b1', now()) $$,
  'P0001', 'SIN_PERMISO',
  'RF-01 / RF-05: usuario inactivo → SIN_PERMISO'
);

reset role;
set local role authenticated;
set local request.jwt.claims = '{"sub": "30000000-0000-4000-8000-000000000005", "role": "authenticated"}';

select throws_ok(
  $$ select public.registrar_novedad(gen_random_uuid(), 'Como aprobador', 'alto', '30000000-0000-4000-8000-0000000000b1', now()) $$,
  'P0001', 'SIN_PERMISO',
  'RF-05: el aprobador de área no registra novedades → SIN_PERMISO'
);

reset role;
set local role authenticated;
set local request.jwt.claims = '{"sub": "30000000-0000-4000-8000-000000000008", "role": "authenticated"}';

select throws_ok(
  $$ select public.registrar_novedad(gen_random_uuid(), 'Como director', 'alto', '30000000-0000-4000-8000-0000000000b1', now()) $$,
  'P0001', 'SIN_PERMISO',
  'RF-05: el director no registra novedades → SIN_PERMISO'
);

reset role;
set local role authenticated;
set local request.jwt.claims = '{"sub": "30000000-0000-4000-8000-000000000009", "role": "authenticated"}';

select throws_ok(
  $$ select public.registrar_novedad(gen_random_uuid(), 'Como administrador', 'alto', '30000000-0000-4000-8000-0000000000b1', now()) $$,
  'P0001', 'SIN_PERMISO',
  'RF-05: el administrador no registra novedades → SIN_PERMISO'
);

reset role;
set local role authenticated;
set local request.jwt.claims = '{"sub": "30000000-0000-4000-8000-00000000000a", "role": "authenticated"}';

select throws_ok(
  $$ select public.registrar_novedad(gen_random_uuid(), 'Sin perfil', 'alto', '30000000-0000-4000-8000-0000000000b1', now()) $$,
  'P0001', 'SIN_PERMISO',
  'RF-05: una cuenta sin perfil → SIN_PERMISO'
);

-- RF-30 · avisos (se revisan como propietario: nadie ve los avisos de otro) ----------------

reset role;

select results_eq(
  $$ select distinct destinatario_id from public.notificacion nt
     join public.novedad n on n.id = nt.novedad_id
     where n.id_local = '30000000-0000-4000-8000-0000000000e1' $$,
  $$ values ('30000000-0000-4000-8000-000000000005'::uuid) $$,
  'RF-30 / CU-07 4: avisa a los aprobadores activos del área y a nadie más (ni al inactivo, ni a otra área, ni al reportante)'
);
select results_eq(
  $$ select count(*)::int, min(nt.estado_nuevo::text), bool_or(nt.leida)
     from public.notificacion nt
     join public.novedad n on n.id = nt.novedad_id
     where n.id_local = '30000000-0000-4000-8000-0000000000e1' $$,
  $$ values (1, 'asignada', false) $$,
  'RF-30 / RNF-08: hay un solo aviso por aprobador, sin leer y con el estado «asignada»; el reenvío no lo repite'
);

-- CU-16 1a · si falla el historial, se revierte todo ---------------------------------------

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
set local request.jwt.claims = '{"sub": "30000000-0000-4000-8000-000000000001", "role": "authenticated"}';

select throws_ok(
  $$ select public.registrar_novedad(
       '30000000-0000-4000-8000-0000000000e9', 'No debe quedar guardada', 'alto', '30000000-0000-4000-8000-0000000000b1', now()) $$,
  'P0001', 'FALLA_SIMULADA_DEL_HISTORIAL',
  'RF-16 / CU-16 1a: si el registro del historial falla, la función informa el error'
);

reset role;

select is(
  (select count(*)::int from public.novedad where id_local = '30000000-0000-4000-8000-0000000000e9'),
  0,
  'RF-16 / CU-16 1a: y la novedad no queda guardada (se revierte todo)'
);

select * from finish();
rollback;
