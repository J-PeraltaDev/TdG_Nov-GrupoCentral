-- RF-08 · fotos de la solución: el aprobador del área las adjunta a una novedad resuelta y
-- quedan atadas a su intento de solución (cambio 23 de docs/cambios-sdd.md).
--
-- Como en rf08_evidencias_test.sql, una subida se simula insertando la fila de storage.objects
-- con el rol y el JWT de cada usuario. Los datos se crean dentro de la transacción.
begin;

create extension if not exists pgtap with schema extensions;

select plan(26);

select has_column('public', 'evidencia', 'transicion_id', 'RF-08: cada evidencia puede decir de qué intento de solución es');
select fk_ok(
  'public', 'evidencia', 'transicion_id', 'public', 'historial_transicion', 'id',
  'RF-08: el intento es una transición del historial'
);
select ok(
  exists (select 1 from pg_policies where schemaname = 'storage' and tablename = 'objects'
            and policyname = 'evidencias_subida_aprobador' and cmd = 'INSERT'),
  'Tabla 31: el aprobador tiene su política de subida'
);

-- Datos de la prueba (como propietario) --------------------------------------------------

insert into public.razon_social (id, nombre)
values ('b9000000-0000-4000-8000-0000000000a1', 'RS pgTAP fotos de la solución');

insert into public.finca (id, razon_social_id, nombre)
values ('b9000000-0000-4000-8000-0000000000f1', 'b9000000-0000-4000-8000-0000000000a1', 'Finca pgTAP solución');

insert into public.area (id, nombre)
values
  ('b9000000-0000-4000-8000-0000000000b1', 'Área pgTAP solución'),
  ('b9000000-0000-4000-8000-0000000000b2', 'Área pgTAP solución vecina');

insert into auth.users (instance_id, id, aud, role, email)
select '00000000-0000-0000-0000-000000000000', id, 'authenticated', 'authenticated', correo
from (
  values
    ('b9000000-0000-4000-8000-000000000001'::uuid, 'reportante@solucion.pgtap.test'),
    ('b9000000-0000-4000-8000-000000000004'::uuid, 'aprobador@solucion.pgtap.test'),
    ('b9000000-0000-4000-8000-000000000005'::uuid, 'aprobador.vecino@solucion.pgtap.test'),
    ('b9000000-0000-4000-8000-000000000006'::uuid, 'director@solucion.pgtap.test'),
    ('b9000000-0000-4000-8000-000000000007'::uuid, 'administrador@solucion.pgtap.test')
) as u (id, correo);

insert into public.usuario (id, nombre, correo, rol_id, finca_id, area_id, activo)
values
  ('b9000000-0000-4000-8000-000000000001', 'Reportante', 'reportante@solucion.pgtap.test', 1, 'b9000000-0000-4000-8000-0000000000f1', null, true),
  ('b9000000-0000-4000-8000-000000000004', 'Aprobador', 'aprobador@solucion.pgtap.test', 2, null, 'b9000000-0000-4000-8000-0000000000b1', true),
  ('b9000000-0000-4000-8000-000000000005', 'Aprobador vecino', 'aprobador.vecino@solucion.pgtap.test', 2, null, 'b9000000-0000-4000-8000-0000000000b2', true),
  ('b9000000-0000-4000-8000-000000000006', 'Director', 'director@solucion.pgtap.test', 3, null, null, true),
  ('b9000000-0000-4000-8000-000000000007', 'Administrador', 'administrador@solucion.pgtap.test', 4, null, null, true);

insert into public.tipo_falla (id, nombre, nombre_normalizado, creado_por)
values ('b9000000-0000-4000-8000-0000000000c1', 'Tipo pgTAP solución', 'tipo pgtap solucion', 'b9000000-0000-4000-8000-000000000007');

-- s1 resuelta (las fotos de la solución), s2 en atención y s3 cerrada, todas del área b1.
insert into public.novedad (
  id, id_local, finca_id, area_id, reportante_id, descripcion, prioridad, estado,
  fecha_registro, actualizado_en, tipo_falla_id, solucion, fecha_ejecucion
)
select
  ('b9000000-0000-4000-8000-0000000000d' || n.sufijo)::uuid,
  ('b9000000-0000-4000-8000-0000000000e' || n.sufijo)::uuid,
  'b9000000-0000-4000-8000-0000000000f1',
  'b9000000-0000-4000-8000-0000000000b1',
  'b9000000-0000-4000-8000-000000000001',
  'Novedad pgTAP solución ' || n.sufijo,
  'normal',
  n.estado::public.estado_novedad,
  '2026-09-01 08:00:00-05',
  '2026-09-01 08:00:00-05',
  case when n.estado in ('resuelta', 'cerrada') then 'b9000000-0000-4000-8000-0000000000c1'::uuid end,
  case when n.estado in ('resuelta', 'cerrada') then 'Solución de prueba' end,
  case when n.estado in ('resuelta', 'cerrada') then date '2026-09-02' end
from (values ('1', 'resuelta'), ('2', 'en_atencion'), ('3', 'cerrada')) as n (sufijo, estado);

-- El historial de s1: registrada → asignada → en atención → resuelta.
insert into public.historial_transicion (novedad_id, usuario_id, estado_anterior, estado_nuevo)
values
  ('b9000000-0000-4000-8000-0000000000d1', 'b9000000-0000-4000-8000-000000000001', null, 'registrada'),
  ('b9000000-0000-4000-8000-0000000000d1', 'b9000000-0000-4000-8000-000000000004', 'registrada', 'asignada'),
  ('b9000000-0000-4000-8000-0000000000d1', 'b9000000-0000-4000-8000-000000000004', 'asignada', 'en_atencion'),
  ('b9000000-0000-4000-8000-0000000000d1', 'b9000000-0000-4000-8000-000000000004', 'en_atencion', 'resuelta');


-- Las fotos de la solución: el aprobador del área, con la novedad resuelta ---------------

set local role authenticated;
set local request.jwt.claims = '{"sub": "b9000000-0000-4000-8000-000000000004", "role": "authenticated"}';

select lives_ok(
  $$ insert into storage.objects (bucket_id, name, owner_id, metadata)
     select 'evidencias',
            'b9000000-0000-4000-8000-0000000000d1/b9000000-0000-4000-8000-00000000010' || n || '.jpg',
            'b9000000-0000-4000-8000-000000000004', '{"size": 900}'
     from generate_series(1, 3) as n $$,
  'RF-08: el aprobador del área sube tres fotos de la solución a una novedad resuelta'
);
select lives_ok(
  $$ insert into public.evidencia (novedad_id, subida_por, ruta_storage, tamano_bytes)
     values ('b9000000-0000-4000-8000-0000000000d1', 'b9000000-0000-4000-8000-000000000004',
             'b9000000-0000-4000-8000-0000000000d1/b9000000-0000-4000-8000-000000000101.jpg', 1) $$,
  'RF-08: y registra la primera'
);
-- Aunque el cliente mande otra transición (la del registro), queda la del intento vigente.
select lives_ok(
  $$ insert into public.evidencia (novedad_id, subida_por, ruta_storage, tamano_bytes, transicion_id)
     select 'b9000000-0000-4000-8000-0000000000d1', 'b9000000-0000-4000-8000-000000000004',
            'b9000000-0000-4000-8000-0000000000d1/b9000000-0000-4000-8000-00000000010' || n || '.jpg', 1,
            (select min(id) from public.historial_transicion
             where novedad_id = 'b9000000-0000-4000-8000-0000000000d1')
     from generate_series(2, 3) as n $$,
  'RF-08: y las otras dos'
);
select is(
  (select array_agg(distinct e.transicion_id) from public.evidencia e
   where e.novedad_id = 'b9000000-0000-4000-8000-0000000000d1'),
  array[(select min(h.id) from public.historial_transicion h
    where h.novedad_id = 'b9000000-0000-4000-8000-0000000000d1' and h.estado_nuevo = 'resuelta')],
  'RF-08: las tres quedan atadas al intento de solución vigente, no al que mande el cliente'
);
select throws_ok(
  $$ insert into storage.objects (bucket_id, name, owner_id, metadata)
     values ('evidencias',
             'b9000000-0000-4000-8000-0000000000d1/b9000000-0000-4000-8000-000000000104.jpg',
             'b9000000-0000-4000-8000-000000000004', '{"size": 900}') $$,
  '42501', null,
  'RF-08: la cuarta foto de la misma solución no se sube'
);

-- El reportante: sus fotos son del reporte y su máximo no cuenta las de la solución ------

set local request.jwt.claims = '{"sub": "b9000000-0000-4000-8000-000000000001", "role": "authenticated"}';
select lives_ok(
  $$ insert into storage.objects (bucket_id, name, owner_id, metadata)
     values ('evidencias',
             'b9000000-0000-4000-8000-0000000000d1/b9000000-0000-4000-8000-000000000111.jpg',
             'b9000000-0000-4000-8000-000000000001', '{"size": 700}') $$,
  'RF-08: con tres fotos de la solución, el reportante todavía sube una del reporte'
);
select lives_ok(
  $$ insert into public.evidencia (novedad_id, subida_por, ruta_storage, tamano_bytes, transicion_id)
     values ('b9000000-0000-4000-8000-0000000000d1', 'b9000000-0000-4000-8000-000000000001',
             'b9000000-0000-4000-8000-0000000000d1/b9000000-0000-4000-8000-000000000111.jpg', 1,
             (select min(h.id) from public.historial_transicion h
              where h.novedad_id = 'b9000000-0000-4000-8000-0000000000d1'
                and h.estado_nuevo = 'resuelta')) $$,
  'RF-08: y la registra'
);
select is(
  (select transicion_id from public.evidencia
   where ruta_storage = 'b9000000-0000-4000-8000-0000000000d1/b9000000-0000-4000-8000-000000000111.jpg'),
  null,
  'RF-08: la foto del reportante es del reporte, aunque mande una transición'
);
select is(
  (select count(*)::int from storage.objects where bucket_id = 'evidencias'
     and name like 'b9000000-0000-4000-8000-0000000000d1/%'),
  4,
  'Tabla 31: el reportante ve las fotos de la solución de su novedad'
);

-- Lo que no puede el aprobador -------------------------------------------------------------

-- Archivos puestos por el propietario: llegan al disparador sin pasar por las políticas.
reset role;
insert into storage.objects (bucket_id, name, owner_id, metadata)
values
  ('evidencias', 'b9000000-0000-4000-8000-0000000000d1/b9000000-0000-4000-8000-000000000105.jpg',
   'b9000000-0000-4000-8000-000000000004', '{"size": 900}'),
  ('evidencias', 'b9000000-0000-4000-8000-0000000000d2/b9000000-0000-4000-8000-000000000201.jpg',
   'b9000000-0000-4000-8000-000000000004', '{"size": 900}'),
  ('evidencias', 'b9000000-0000-4000-8000-0000000000d3/b9000000-0000-4000-8000-000000000301.jpg',
   'b9000000-0000-4000-8000-000000000004', '{"size": 900}');

set local role authenticated;
set local request.jwt.claims = '{"sub": "b9000000-0000-4000-8000-000000000004", "role": "authenticated"}';

select throws_ok(
  $$ insert into public.evidencia (novedad_id, subida_por, ruta_storage, tamano_bytes)
     values ('b9000000-0000-4000-8000-0000000000d1', 'b9000000-0000-4000-8000-000000000004',
             'b9000000-0000-4000-8000-0000000000d1/b9000000-0000-4000-8000-000000000105.jpg', 1) $$,
  'P0001', 'LIMITE_DE_FOTOS',
  'RF-08: la cuarta foto de la solución no se registra aunque su archivo exista'
);
select throws_ok(
  $$ insert into storage.objects (bucket_id, name, owner_id, metadata)
     values ('evidencias',
             'b9000000-0000-4000-8000-0000000000d2/b9000000-0000-4000-8000-000000000202.jpg',
             'b9000000-0000-4000-8000-000000000004', '{"size": 900}') $$,
  '42501', null,
  'RF-08: sin la solución registrada (en atención) no sube fotos'
);
select throws_ok(
  $$ insert into public.evidencia (novedad_id, subida_por, ruta_storage, tamano_bytes)
     values ('b9000000-0000-4000-8000-0000000000d2', 'b9000000-0000-4000-8000-000000000004',
             'b9000000-0000-4000-8000-0000000000d2/b9000000-0000-4000-8000-000000000201.jpg', 1) $$,
  'P0001', 'TRANSICION_INVALIDA',
  'RF-08: ni las registra'
);
select throws_ok(
  $$ insert into storage.objects (bucket_id, name, owner_id, metadata)
     values ('evidencias',
             'b9000000-0000-4000-8000-0000000000d3/b9000000-0000-4000-8000-000000000302.jpg',
             'b9000000-0000-4000-8000-000000000004', '{"size": 900}') $$,
  '42501', null,
  'RF-08: con la novedad cerrada ya no sube fotos'
);
select throws_ok(
  $$ insert into public.evidencia (novedad_id, subida_por, ruta_storage, tamano_bytes)
     values ('b9000000-0000-4000-8000-0000000000d3', 'b9000000-0000-4000-8000-000000000004',
             'b9000000-0000-4000-8000-0000000000d3/b9000000-0000-4000-8000-000000000301.jpg', 1) $$,
  'P0001', 'TRANSICION_INVALIDA',
  'RF-08: ni las registra'
);

set local request.jwt.claims = '{"sub": "b9000000-0000-4000-8000-000000000005", "role": "authenticated"}';
select throws_ok(
  $$ insert into storage.objects (bucket_id, name, owner_id, metadata)
     values ('evidencias',
             'b9000000-0000-4000-8000-0000000000d1/b9000000-0000-4000-8000-000000000151.jpg',
             'b9000000-0000-4000-8000-000000000005', '{"size": 900}') $$,
  '42501', null,
  'RNF-11: el aprobador de otra área no sube fotos de la solución'
);
select throws_ok(
  $$ insert into public.evidencia (novedad_id, subida_por, ruta_storage, tamano_bytes)
     values ('b9000000-0000-4000-8000-0000000000d1', 'b9000000-0000-4000-8000-000000000005',
             'b9000000-0000-4000-8000-0000000000d1/b9000000-0000-4000-8000-000000000105.jpg', 1) $$,
  'P0001', 'SIN_PERMISO',
  'RNF-11: ni las registra'
);

set local request.jwt.claims = '{"sub": "b9000000-0000-4000-8000-000000000006", "role": "authenticated"}';
select throws_ok(
  $$ insert into storage.objects (bucket_id, name, owner_id, metadata)
     values ('evidencias',
             'b9000000-0000-4000-8000-0000000000d1/b9000000-0000-4000-8000-000000000161.jpg',
             'b9000000-0000-4000-8000-000000000006', '{"size": 900}') $$,
  '42501', null,
  'RNF-11: el director no sube fotos de la solución'
);
select throws_ok(
  $$ insert into public.evidencia (novedad_id, subida_por, ruta_storage, tamano_bytes)
     values ('b9000000-0000-4000-8000-0000000000d1', 'b9000000-0000-4000-8000-000000000006',
             'b9000000-0000-4000-8000-0000000000d1/b9000000-0000-4000-8000-000000000105.jpg', 1) $$,
  'P0001', 'SIN_PERMISO',
  'RNF-11: ni las registra'
);

-- Un intento nuevo: la falla persiste y se vuelve a resolver ------------------------------

reset role;
update public.novedad
set estado = 'en_atencion', solucion = null, fecha_ejecucion = null, tipo_falla_id = null
where id = 'b9000000-0000-4000-8000-0000000000d1';
insert into public.historial_transicion (novedad_id, usuario_id, estado_anterior, estado_nuevo, observacion)
values ('b9000000-0000-4000-8000-0000000000d1', 'b9000000-0000-4000-8000-000000000001', 'resuelta', 'en_atencion', 'Sigue fallando');
update public.novedad
set estado = 'resuelta', solucion = 'Otra solución', fecha_ejecucion = date '2026-09-03',
    tipo_falla_id = 'b9000000-0000-4000-8000-0000000000c1'
where id = 'b9000000-0000-4000-8000-0000000000d1';
insert into public.historial_transicion (novedad_id, usuario_id, estado_anterior, estado_nuevo, observacion)
values ('b9000000-0000-4000-8000-0000000000d1', 'b9000000-0000-4000-8000-000000000004', 'en_atencion', 'resuelta', 'Otra solución');

set local role authenticated;
set local request.jwt.claims = '{"sub": "b9000000-0000-4000-8000-000000000004", "role": "authenticated"}';

select lives_ok(
  $$ insert into storage.objects (bucket_id, name, owner_id, metadata)
     values ('evidencias',
             'b9000000-0000-4000-8000-0000000000d1/b9000000-0000-4000-8000-000000000121.jpg',
             'b9000000-0000-4000-8000-000000000004', '{"size": 900}') $$,
  'RF-08: en el intento nuevo el máximo empieza de cero'
);
select lives_ok(
  $$ insert into public.evidencia (novedad_id, subida_por, ruta_storage, tamano_bytes)
     values ('b9000000-0000-4000-8000-0000000000d1', 'b9000000-0000-4000-8000-000000000004',
             'b9000000-0000-4000-8000-0000000000d1/b9000000-0000-4000-8000-000000000121.jpg', 1) $$,
  'RF-08: y la foto se registra'
);
select is(
  (select transicion_id from public.evidencia
   where ruta_storage = 'b9000000-0000-4000-8000-0000000000d1/b9000000-0000-4000-8000-000000000121.jpg'),
  (select max(h.id) from public.historial_transicion h
    where h.novedad_id = 'b9000000-0000-4000-8000-0000000000d1' and h.estado_nuevo = 'resuelta'),
  'RF-08: queda atada al intento nuevo'
);
select is(
  (select count(*)::int from public.evidencia
   where transicion_id = (select min(h.id) from public.historial_transicion h
    where h.novedad_id = 'b9000000-0000-4000-8000-0000000000d1' and h.estado_nuevo = 'resuelta')),
  3,
  'RF-08: las del intento anterior siguen con el suyo'
);

reset role;

select ok(
  not has_function_privilege('anon', 'private.solucion_vigente(uuid)', 'execute'),
  'Regla 2: anon no ejecuta la auxiliar del intento vigente'
);

select * from finish();

rollback;
