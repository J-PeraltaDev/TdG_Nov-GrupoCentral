-- RF-16 / RNF-11 · Control de acceso por rol en la base de datos (SDD 6.1.4, Tabla 31).
-- Los datos de la prueba se crean dentro de la transacción y no dependen del seed.
begin;

create extension if not exists pgtap with schema extensions;

select plan(53);

-- Datos de la prueba (como propietario) ------------------------------------------------

insert into public.razon_social (id, nombre)
values
  ('10000000-0000-4000-8000-0000000000a1', 'RS pgTAP A'),
  ('10000000-0000-4000-8000-0000000000a2', 'RS pgTAP B');

insert into public.finca (id, razon_social_id, nombre)
values
  ('10000000-0000-4000-8000-0000000000f1', '10000000-0000-4000-8000-0000000000a1', 'Finca pgTAP A'),
  ('10000000-0000-4000-8000-0000000000f2', '10000000-0000-4000-8000-0000000000a2', 'Finca pgTAP B');

insert into auth.users (instance_id, id, aud, role, email)
select '00000000-0000-0000-0000-000000000000', id, 'authenticated', 'authenticated', correo
from (
  values
    ('10000000-0000-4000-8000-000000000001'::uuid, 'reportante.a@pgtap.test'),
    ('10000000-0000-4000-8000-000000000002'::uuid, 'reportante.b@pgtap.test'),
    ('10000000-0000-4000-8000-000000000003'::uuid, 'aprobador.mantenimiento@pgtap.test'),
    ('10000000-0000-4000-8000-000000000004'::uuid, 'aprobador.sistemas@pgtap.test'),
    ('10000000-0000-4000-8000-000000000005'::uuid, 'director@pgtap.test'),
    ('10000000-0000-4000-8000-000000000006'::uuid, 'administrador@pgtap.test'),
    ('10000000-0000-4000-8000-000000000007'::uuid, 'inactivo@pgtap.test')
) as u (id, correo);

insert into public.usuario (id, nombre, correo, rol_id, finca_id, area_id, activo)
values
  ('10000000-0000-4000-8000-000000000001', 'Reportante pgTAP A', 'reportante.a@pgtap.test', 1, '10000000-0000-4000-8000-0000000000f1', null, true),
  ('10000000-0000-4000-8000-000000000002', 'Reportante pgTAP B', 'reportante.b@pgtap.test', 1, '10000000-0000-4000-8000-0000000000f2', null, true),
  ('10000000-0000-4000-8000-000000000003', 'Aprobador pgTAP Mantenimiento', 'aprobador.mantenimiento@pgtap.test', 2, null, (select id from public.area where nombre = 'Mantenimiento'), true),
  ('10000000-0000-4000-8000-000000000004', 'Aprobador pgTAP Sistemas', 'aprobador.sistemas@pgtap.test', 2, null, (select id from public.area where nombre = 'Sistemas'), true),
  ('10000000-0000-4000-8000-000000000005', 'Director pgTAP', 'director@pgtap.test', 3, null, null, true),
  ('10000000-0000-4000-8000-000000000006', 'Administrador pgTAP', 'administrador@pgtap.test', 4, null, null, true),
  ('10000000-0000-4000-8000-000000000007', 'Inactivo pgTAP', 'inactivo@pgtap.test', 1, '10000000-0000-4000-8000-0000000000f1', null, false);

-- N1: finca A, Mantenimiento. N2: finca B, Sistemas.
insert into public.novedad (id, id_local, finca_id, area_id, reportante_id, descripcion, prioridad, estado, fecha_registro)
values
  ('10000000-0000-4000-8000-0000000000d1', '10000000-0000-4000-8000-0000000000e1', '10000000-0000-4000-8000-0000000000f1',
   (select id from public.area where nombre = 'Mantenimiento'), '10000000-0000-4000-8000-000000000001',
   'El torniquete de la entrada no gira', 'alto', 'asignada', now()),
  ('10000000-0000-4000-8000-0000000000d2', '10000000-0000-4000-8000-0000000000e2', '10000000-0000-4000-8000-0000000000f2',
   (select id from public.area where nombre = 'Sistemas'), '10000000-0000-4000-8000-000000000002',
   'El computador de la oficina no enciende', 'normal', 'asignada', now());

insert into public.historial_transicion (novedad_id, usuario_id, estado_anterior, estado_nuevo)
values
  ('10000000-0000-4000-8000-0000000000d1', '10000000-0000-4000-8000-000000000001', null, 'registrada'),
  ('10000000-0000-4000-8000-0000000000d2', '10000000-0000-4000-8000-000000000002', null, 'registrada');

-- Un aviso para cada aprobador.
insert into public.notificacion (id, destinatario_id, novedad_id, estado_nuevo)
values
  ('10000000-0000-4000-8000-0000000000c1', '10000000-0000-4000-8000-000000000003', '10000000-0000-4000-8000-0000000000d1', 'asignada'),
  ('10000000-0000-4000-8000-0000000000c2', '10000000-0000-4000-8000-000000000004', '10000000-0000-4000-8000-0000000000d2', 'asignada');

insert into public.solicitud_recuperacion (usuario_id)
values ('10000000-0000-4000-8000-000000000001');

-- Reportante de la finca A --------------------------------------------------------------

set local role authenticated;
set local request.jwt.claims = '{"sub": "10000000-0000-4000-8000-000000000001", "role": "authenticated"}';

select is(
  (select count(*)::int from public.novedad where id = '10000000-0000-4000-8000-0000000000d1'),
  1,
  'RF-18 / RNF-11: el reportante ve las novedades de su finca'
);
select is(
  (select count(*)::int from public.novedad where id = '10000000-0000-4000-8000-0000000000d2'),
  0,
  'RF-18 / RNF-11: el reportante de la finca A no ve las novedades de la finca B'
);
select results_eq(
  $$ select finca, area, reportante from public.v_novedad where id = '10000000-0000-4000-8000-0000000000d1' $$,
  $$ values ('Finca pgTAP A', 'Mantenimiento', 'Reportante pgTAP A') $$,
  'RF-18: v_novedad trae la finca, el área y el nombre del reportante'
);
select is(
  (select count(*)::int from public.v_novedad where id = '10000000-0000-4000-8000-0000000000d2'),
  0,
  'RNF-11: v_novedad respeta el alcance de quien consulta (security_invoker)'
);
select is(
  (select count(*)::int from public.historial_transicion where novedad_id = '10000000-0000-4000-8000-0000000000d1'),
  1,
  'RF-18: el reportante ve el historial de las novedades de su finca'
);
select is(
  (select count(*)::int from public.historial_transicion where novedad_id = '10000000-0000-4000-8000-0000000000d2'),
  0,
  'RNF-11: el reportante no ve el historial de las novedades de otra finca'
);
select is(
  (select count(*)::int from public.notificacion where id in ('10000000-0000-4000-8000-0000000000c1', '10000000-0000-4000-8000-0000000000c2')),
  0,
  'RF-30 / RNF-11: nadie ve los avisos de otro usuario'
);
select ok(
  private.puede_ver_novedad('10000000-0000-4000-8000-0000000000f1', (select id from public.area where nombre = 'Mantenimiento')),
  'RNF-11: puede_ver_novedad acepta la finca del reportante'
);
select ok(
  not private.puede_ver_novedad('10000000-0000-4000-8000-0000000000f2', (select id from public.area where nombre = 'Sistemas')),
  'RNF-11: puede_ver_novedad rechaza otra finca'
);

-- El nombre de los demás usuarios sí se puede leer; el correo, no.
select is(
  (select nombre from public.usuario_publico where id = '10000000-0000-4000-8000-000000000003'),
  'Aprobador pgTAP Mantenimiento',
  'RF-18: usuario_publico entrega el nombre de los usuarios de la línea de tiempo'
);
select throws_ok(
  'select correo from public.usuario',
  '42501', null,
  'RNF-18: el reportante no puede leer usuario.correo'
);
select throws_ok(
  'select * from public.usuario',
  '42501', null,
  'RNF-18: select * de usuario falla, porque incluye el correo'
);

-- El cliente nunca escribe directamente en novedad, historial_transicion ni notificacion.
select throws_ok(
  $$ insert into public.novedad (id_local, finca_id, area_id, reportante_id, descripcion, prioridad, fecha_registro)
     select gen_random_uuid(), '10000000-0000-4000-8000-0000000000f1', id, '10000000-0000-4000-8000-000000000001', 'directa', 'bajo', now()
     from public.area limit 1 $$,
  '42501', null,
  'RNF-11: el reportante no inserta directamente en novedad'
);
select throws_ok(
  $$ update public.novedad set estado = 'cerrada' where id = '10000000-0000-4000-8000-0000000000d1' $$,
  '42501', null,
  'RNF-11: el reportante no actualiza directamente novedad'
);
select throws_ok(
  $$ delete from public.novedad where id = '10000000-0000-4000-8000-0000000000d1' $$,
  '42501', null,
  'RNF-11: el reportante no borra novedades'
);
select throws_ok(
  $$ insert into public.historial_transicion (novedad_id, usuario_id, estado_nuevo)
     values ('10000000-0000-4000-8000-0000000000d1', '10000000-0000-4000-8000-000000000001', 'cerrada') $$,
  '42501', null,
  'RNF-12: el reportante no inserta directamente en historial_transicion'
);
select throws_ok(
  $$ update public.historial_transicion set observacion = 'x' where novedad_id = '10000000-0000-4000-8000-0000000000d1' $$,
  '42501', null,
  'RNF-12: el reportante no actualiza historial_transicion'
);
select throws_ok(
  $$ delete from public.historial_transicion where novedad_id = '10000000-0000-4000-8000-0000000000d1' $$,
  '42501', null,
  'RNF-12: el reportante no borra historial_transicion'
);
select throws_ok(
  $$ insert into public.notificacion (destinatario_id, novedad_id, estado_nuevo)
     values ('10000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-0000000000d1', 'asignada') $$,
  '42501', null,
  'RF-30: el cliente no inserta avisos'
);
select throws_ok(
  $$ delete from public.notificacion where novedad_id = '10000000-0000-4000-8000-0000000000d1' $$,
  '42501', null,
  'RF-30: el cliente no borra avisos'
);

-- Catálogos: lectura sí, escritura no.
select is(
  (select count(*)::int from public.area where nombre in ('Mantenimiento', 'Sistemas')),
  2,
  'RF-05: un usuario activo lee el catálogo de áreas'
);
select throws_ok(
  $$ insert into public.area (nombre) values ('Otra área') $$,
  '42501', null,
  'RNF-11: nadie crea áreas desde el cliente'
);
select throws_ok(
  $$ insert into public.finca (razon_social_id, nombre) values ('10000000-0000-4000-8000-0000000000a1', 'Finca del reportante') $$,
  '42501', null,
  'RF-04: el reportante no crea fincas'
);

-- Evidencias (RF-08): solo en las novedades de su finca y a su nombre.
select lives_ok(
  $$ insert into public.evidencia (novedad_id, subida_por, ruta_storage, tamano_bytes)
     values ('10000000-0000-4000-8000-0000000000d1', '10000000-0000-4000-8000-000000000001', 'pgtap/d1/foto-1.jpg', 1000) $$,
  'RF-08: el reportante registra una evidencia de una novedad de su finca'
);
select throws_ok(
  $$ insert into public.evidencia (novedad_id, subida_por, ruta_storage, tamano_bytes)
     values ('10000000-0000-4000-8000-0000000000d2', '10000000-0000-4000-8000-000000000001', 'pgtap/d2/foto-1.jpg', 1000) $$,
  '42501', null,
  'RF-08: el reportante no registra evidencias de una novedad de otra finca'
);
select throws_ok(
  $$ insert into public.evidencia (novedad_id, subida_por, ruta_storage, tamano_bytes)
     values ('10000000-0000-4000-8000-0000000000d1', '10000000-0000-4000-8000-000000000002', 'pgtap/d1/foto-2.jpg', 1000) $$,
  '42501', null,
  'RF-08: nadie registra una evidencia a nombre de otro usuario'
);

-- Suscripciones push (RF-31): cada quien las suyas.
select lives_ok(
  $$ insert into public.suscripcion_push (usuario_id, endpoint, p256dh, auth)
     values ('10000000-0000-4000-8000-000000000001', 'https://push.pgtap.test/a', 'clave', 'auth') $$,
  'RF-31: un usuario registra su suscripción push'
);
select throws_ok(
  $$ insert into public.suscripcion_push (usuario_id, endpoint, p256dh, auth)
     values ('10000000-0000-4000-8000-000000000002', 'https://push.pgtap.test/b', 'clave', 'auth') $$,
  '42501', null,
  'RF-31: nadie registra una suscripción push a nombre de otro'
);

-- Aprobador de Sistemas ---------------------------------------------------------------

reset role;
set local role authenticated;
set local request.jwt.claims = '{"sub": "10000000-0000-4000-8000-000000000004", "role": "authenticated"}';

select is(
  (select count(*)::int from public.novedad where id = '10000000-0000-4000-8000-0000000000d2'),
  1,
  'RF-09 / RNF-11: el aprobador ve las novedades de su área'
);
select is(
  (select count(*)::int from public.novedad where id = '10000000-0000-4000-8000-0000000000d1'),
  0,
  'RF-09 / RNF-11: el aprobador de Sistemas no ve las novedades de Mantenimiento'
);
select is(
  (select count(*)::int from public.suscripcion_push where endpoint = 'https://push.pgtap.test/a'),
  0,
  'RF-31: nadie ve las suscripciones push de otro usuario'
);
select throws_ok(
  'select correo from public.usuario',
  '42501', null,
  'RNF-18: el aprobador no puede leer usuario.correo'
);

-- El destinatario solo puede marcar su aviso como leído.
select is(
  (select count(*)::int from public.notificacion where id = '10000000-0000-4000-8000-0000000000c2'),
  1,
  'RF-30: el destinatario ve su aviso'
);
select lives_ok(
  $$ update public.notificacion set leida = true, leida_en = now() where id = '10000000-0000-4000-8000-0000000000c2' $$,
  'RF-30: el destinatario marca su aviso como leído'
);
select is(
  (select leida from public.notificacion where id = '10000000-0000-4000-8000-0000000000c2'),
  true,
  'RF-30: el aviso queda marcado como leído'
);
select throws_ok(
  $$ update public.notificacion set estado_nuevo = 'cerrada' where id = '10000000-0000-4000-8000-0000000000c2' $$,
  '42501', null,
  'RF-30: el destinatario no puede cambiar nada más del aviso'
);
select throws_ok(
  $$ update public.notificacion set destinatario_id = '10000000-0000-4000-8000-000000000003' where id = '10000000-0000-4000-8000-0000000000c2' $$,
  '42501', null,
  'RF-30: el destinatario no puede reasignar el aviso'
);
select is_empty(
  $$ update public.notificacion set leida = true where id = '10000000-0000-4000-8000-0000000000c1' returning id $$,
  'RF-30: nadie marca como leído el aviso de otro usuario'
);

-- Director de agricultura --------------------------------------------------------------

reset role;
set local role authenticated;
set local request.jwt.claims = '{"sub": "10000000-0000-4000-8000-000000000005", "role": "authenticated"}';

select is(
  (select count(*)::int from public.novedad where id in ('10000000-0000-4000-8000-0000000000d1', '10000000-0000-4000-8000-0000000000d2')),
  2,
  'RF-18 / RNF-11: el director ve las novedades de todas las fincas y áreas'
);
select throws_ok(
  'select correo from public.usuario',
  '42501', null,
  'RNF-18: el director no puede leer usuario.correo'
);
select is_empty(
  'select id from public.solicitud_recuperacion',
  'RF-02: el director no ve las solicitudes de recuperación'
);

-- Administrador ---------------------------------------------------------------------------

reset role;
set local role authenticated;
set local request.jwt.claims = '{"sub": "10000000-0000-4000-8000-000000000006", "role": "authenticated"}';

select is(
  (select count(*)::int from public.novedad where id in ('10000000-0000-4000-8000-0000000000d1', '10000000-0000-4000-8000-0000000000d2')),
  2,
  'RF-18 / RNF-11: el administrador ve todas las novedades'
);
select throws_ok(
  'select correo from public.usuario',
  '42501', null,
  'RNF-18: el administrador tampoco lee usuario.correo por la API (lo hará con una función en el Sprint 3)'
);
select throws_ok(
  $$ update public.novedad set estado = 'cerrada' where id = '10000000-0000-4000-8000-0000000000d1' $$,
  '42501', null,
  'RNF-11: ni el administrador actualiza directamente novedad'
);
select lives_ok(
  $$ insert into public.finca (razon_social_id, nombre) values ('10000000-0000-4000-8000-0000000000a1', 'Finca pgTAP nueva') $$,
  'RF-04: el administrador crea fincas'
);
select is(
  (select count(*)::int from public.solicitud_recuperacion where usuario_id = '10000000-0000-4000-8000-000000000001'),
  1,
  'RF-02: el administrador ve las solicitudes de recuperación'
);
select throws_ok(
  'select codigo_hash from public.solicitud_recuperacion',
  '42501', null,
  'RF-02: el resumen del código de recuperación no sale por la API'
);

-- Usuario desactivado: no ve nada ----------------------------------------------------------

reset role;
set local role authenticated;
set local request.jwt.claims = '{"sub": "10000000-0000-4000-8000-000000000007", "role": "authenticated"}';

select is_empty('select id from public.novedad', 'RF-01 / RNF-11: un usuario desactivado no ve novedades');
select is_empty('select id from public.usuario', 'RF-01 / RNF-11: un usuario desactivado no ve usuarios, ni su propia fila');
select is_empty('select id from public.area', 'RF-01 / RNF-11: un usuario desactivado no ve los catálogos');

-- Sin sesión (anon): no tiene ningún privilegio ----------------------------------------------

reset role;
set local role anon;
set local request.jwt.claims = '{"role": "anon"}';

select throws_ok('select id from public.novedad', '42501', null, 'RNF-10 / RNF-11: sin sesión no se leen novedades');
select throws_ok('select id from public.usuario', '42501', null, 'RNF-10 / RNF-11: sin sesión no se leen usuarios');
select throws_ok(
  $$ select public.registrar_novedad(gen_random_uuid(), 'sin sesión', 'bajo', gen_random_uuid(), now()) $$,
  '42501', null,
  'RNF-10 / RNF-11: sin sesión no se puede ejecutar registrar_novedad'
);

reset role;

select * from finish();
rollback;
