-- RF-08 / CU-08 · bucket «evidencias», sus políticas y el disparador de `evidencia`
-- (SDD 6.1.7, 5.3.3 y 6.1.4, Tabla 31; plan del Sprint 4, decisiones 19 y 20).
--
-- Una subida se simula insertando la fila de storage.objects con el rol y el JWT de cada
-- usuario: es lo que hace la API de Storage al subir un archivo, y ahí se aplican las políticas.
-- La API no corre en pgTAP: la subida real se prueba en «staging» y en la e2e. Los datos se
-- crean dentro de la transacción y no dependen del seed.
begin;

create extension if not exists pgtap with schema extensions;

select plan(47);

-- El bucket y lo que lo protege -------------------------------------------------------------

select is(
  (select public from storage.buckets where id = 'evidencias'),
  false,
  'RF-08 / SDD 4.2.9: el bucket evidencias existe y es privado'
);
select is(
  (select file_size_limit from storage.buckets where id = 'evidencias'),
  1048576::bigint,
  'RF-08 / CU-08 4a: el bucket no acepta archivos de más de 1 MB'
);
select is(
  (select allowed_mime_types from storage.buckets where id = 'evidencias'),
  array['image/jpeg'],
  'RF-08 / CU-08 4a: el bucket solo acepta JPEG (el cliente recodifica cada foto)'
);
select is(
  (select count(*)::int
   from pg_policies
   where schemaname = 'storage'
     and tablename = 'objects'
     and cmd in ('UPDATE', 'DELETE', 'ALL')
     and coalesce(qual, '') || coalesce(with_check, '') like '%evidencias%'),
  0,
  'Tabla 31: ninguna política deja actualizar ni borrar las evidencias'
);
select has_trigger('public', 'evidencia', 'evidencia_valida', 'RF-08: evidencia tiene su disparador de validación');
select ok(
  (select prosecdef and proconfig @> array['search_path=""']
   from pg_proc where oid = 'private.tg_evidencia_valida'::regproc),
  'Regla 2: el disparador es security definer y tiene search_path vacío'
);

-- Datos de la prueba (como propietario) --------------------------------------------------

insert into public.razon_social (id, nombre)
values ('b8000000-0000-4000-8000-0000000000a1', 'RS pgTAP evidencias');

insert into public.finca (id, razon_social_id, nombre)
values
  ('b8000000-0000-4000-8000-0000000000f1', 'b8000000-0000-4000-8000-0000000000a1', 'Finca pgTAP evidencias'),
  ('b8000000-0000-4000-8000-0000000000f2', 'b8000000-0000-4000-8000-0000000000a1', 'Finca pgTAP evidencias vecina');

insert into public.area (id, nombre)
values
  ('b8000000-0000-4000-8000-0000000000b1', 'Área pgTAP evidencias'),
  ('b8000000-0000-4000-8000-0000000000b2', 'Área pgTAP evidencias vecina');

insert into auth.users (instance_id, id, aud, role, email)
select '00000000-0000-0000-0000-000000000000', id, 'authenticated', 'authenticated', correo
from (
  values
    ('b8000000-0000-4000-8000-000000000001'::uuid, 'reportante@evidencias.pgtap.test'),
    ('b8000000-0000-4000-8000-000000000002'::uuid, 'reportante.vecino@evidencias.pgtap.test'),
    ('b8000000-0000-4000-8000-000000000003'::uuid, 'reportante.inactivo@evidencias.pgtap.test'),
    ('b8000000-0000-4000-8000-000000000004'::uuid, 'aprobador@evidencias.pgtap.test'),
    ('b8000000-0000-4000-8000-000000000005'::uuid, 'aprobador.vecino@evidencias.pgtap.test'),
    ('b8000000-0000-4000-8000-000000000006'::uuid, 'director@evidencias.pgtap.test'),
    ('b8000000-0000-4000-8000-000000000007'::uuid, 'administrador@evidencias.pgtap.test'),
    ('b8000000-0000-4000-8000-000000000008'::uuid, 'sin.perfil@evidencias.pgtap.test')
) as u (id, correo);

insert into public.usuario (id, nombre, correo, rol_id, finca_id, area_id, activo)
values
  ('b8000000-0000-4000-8000-000000000001', 'Reportante', 'reportante@evidencias.pgtap.test', 1, 'b8000000-0000-4000-8000-0000000000f1', null, true),
  ('b8000000-0000-4000-8000-000000000002', 'Reportante vecino', 'reportante.vecino@evidencias.pgtap.test', 1, 'b8000000-0000-4000-8000-0000000000f2', null, true),
  ('b8000000-0000-4000-8000-000000000003', 'Reportante inactivo', 'reportante.inactivo@evidencias.pgtap.test', 1, 'b8000000-0000-4000-8000-0000000000f1', null, false),
  ('b8000000-0000-4000-8000-000000000004', 'Aprobador', 'aprobador@evidencias.pgtap.test', 2, null, 'b8000000-0000-4000-8000-0000000000b1', true),
  ('b8000000-0000-4000-8000-000000000005', 'Aprobador vecino', 'aprobador.vecino@evidencias.pgtap.test', 2, null, 'b8000000-0000-4000-8000-0000000000b2', true),
  ('b8000000-0000-4000-8000-000000000006', 'Director', 'director@evidencias.pgtap.test', 3, null, null, true),
  ('b8000000-0000-4000-8000-000000000007', 'Administrador', 'administrador@evidencias.pgtap.test', 4, null, null, true);

insert into public.tipo_falla (id, nombre, nombre_normalizado, creado_por)
values ('b8000000-0000-4000-8000-0000000000c1', 'Tipo pgTAP evidencias', 'tipo pgtap evidencias', 'b8000000-0000-4000-8000-000000000007');

-- d1 asignada (las subidas normales), d2 en atención (el máximo de 3), d3 cerrada, d4
-- rechazada, d5 de la finca vecina y d6 resuelta (el reportante todavía puede adjuntar).
insert into public.novedad (
  id, id_local, finca_id, area_id, reportante_id, descripcion, prioridad, estado,
  fecha_registro, actualizado_en, tipo_falla_id, solucion, fecha_ejecucion
)
select
  ('b8000000-0000-4000-8000-0000000000d' || n.sufijo)::uuid,
  ('b8000000-0000-4000-8000-0000000000e' || n.sufijo)::uuid,
  case when n.sufijo = '5' then 'b8000000-0000-4000-8000-0000000000f2'::uuid
       else 'b8000000-0000-4000-8000-0000000000f1'::uuid end,
  'b8000000-0000-4000-8000-0000000000b1',
  case when n.sufijo = '5' then 'b8000000-0000-4000-8000-000000000002'::uuid
       else 'b8000000-0000-4000-8000-000000000001'::uuid end,
  'Novedad pgTAP evidencias ' || n.sufijo,
  'normal',
  n.estado::public.estado_novedad,
  '2026-09-01 08:00:00-05',
  '2026-09-01 08:00:00-05',
  case when n.estado in ('resuelta', 'cerrada') then 'b8000000-0000-4000-8000-0000000000c1'::uuid end,
  case when n.estado in ('resuelta', 'cerrada') then 'Solución de prueba' end,
  case when n.estado in ('resuelta', 'cerrada') then date '2026-09-02' end
from (
  values ('1', 'asignada'), ('2', 'en_atencion'), ('3', 'cerrada'), ('4', 'rechazada'),
         ('5', 'asignada'), ('6', 'resuelta')
) as n (sufijo, estado);

-- CU-08 · curso normal: el reportante sube a una novedad de su finca ----------------------

set local role authenticated;
set local request.jwt.claims = '{"sub": "b8000000-0000-4000-8000-000000000001", "role": "authenticated"}';

select lives_ok(
  $$ insert into storage.objects (bucket_id, name, owner_id, metadata)
     values ('evidencias',
             'b8000000-0000-4000-8000-0000000000d1/b8000000-0000-4000-8000-000000000101.jpg',
             'b8000000-0000-4000-8000-000000000001',
             '{"size": 2048, "mimetype": "image/jpeg"}') $$,
  'RF-08 / CU-08 4: el reportante sube una foto a una novedad asignada de su finca'
);
select lives_ok(
  $$ insert into public.evidencia (novedad_id, subida_por, ruta_storage, tamano_bytes)
     values ('b8000000-0000-4000-8000-0000000000d1', 'b8000000-0000-4000-8000-000000000001',
             'b8000000-0000-4000-8000-0000000000d1/b8000000-0000-4000-8000-000000000101.jpg', 1) $$,
  'RF-08 / CU-08 4: y la asocia a la novedad'
);
select is(
  (select tamano_bytes from public.evidencia
   where ruta_storage = 'b8000000-0000-4000-8000-0000000000d1/b8000000-0000-4000-8000-000000000101.jpg'),
  2048,
  'RF-08: el tamaño se toma del archivo guardado, no del que dice el cliente'
);
-- Un archivo subido cuya fila nunca se insertó (decisión 21): queda huérfano.
select lives_ok(
  $$ insert into storage.objects (bucket_id, name, owner_id, metadata)
     values ('evidencias',
             'b8000000-0000-4000-8000-0000000000d1/b8000000-0000-4000-8000-000000000102.jpg',
             'b8000000-0000-4000-8000-000000000001',
             '{"size": 1024, "mimetype": "image/jpeg"}') $$,
  'RF-08: una segunda foto se sube aunque su fila no llegue (archivo huérfano)'
);
select lives_ok(
  $$ insert into storage.objects (bucket_id, name, owner_id, metadata)
     values ('evidencias',
             'b8000000-0000-4000-8000-0000000000d6/b8000000-0000-4000-8000-000000000601.jpg',
             'b8000000-0000-4000-8000-000000000001',
             '{"size": 3000, "mimetype": "image/jpeg"}') $$,
  'RF-08 / Tabla 35: también se adjunta a una novedad resuelta, que todavía no es final'
);
select lives_ok(
  $$ insert into public.evidencia (novedad_id, subida_por, ruta_storage, tamano_bytes)
     values ('b8000000-0000-4000-8000-0000000000d6', 'b8000000-0000-4000-8000-000000000001',
             'b8000000-0000-4000-8000-0000000000d6/b8000000-0000-4000-8000-000000000601.jpg', 3000) $$,
  'RF-08: y se asocia a la resuelta'
);

-- Lo que el bucket no deja subir ------------------------------------------------------------

select throws_ok(
  $$ insert into storage.objects (bucket_id, name, owner_id, metadata)
     values ('evidencias',
             'b8000000-0000-4000-8000-0000000000d5/b8000000-0000-4000-8000-000000000501.jpg',
             'b8000000-0000-4000-8000-000000000001', '{"size": 10}') $$,
  '42501', null,
  'RNF-11: no sube a una novedad de otra finca'
);
select throws_ok(
  $$ insert into storage.objects (bucket_id, name, owner_id, metadata)
     values ('evidencias', 'b8000000-0000-4000-8000-0000000000d1/foto.png',
             'b8000000-0000-4000-8000-000000000001', '{"size": 10}') $$,
  '42501', null,
  'SDD 6.1.7: no sube un archivo fuera de la forma {novedad_id}/{uuid}.jpg'
);
select throws_ok(
  $$ insert into storage.objects (bucket_id, name, owner_id, metadata)
     values ('evidencias',
             'b8000000-0000-4000-8000-0000000000d3/b8000000-0000-4000-8000-000000000301.jpg',
             'b8000000-0000-4000-8000-000000000001', '{"size": 10}') $$,
  '42501', null,
  'RF-08: no sube a una novedad cerrada'
);
select throws_ok(
  $$ insert into storage.objects (bucket_id, name, owner_id, metadata)
     values ('evidencias',
             'b8000000-0000-4000-8000-0000000000d4/b8000000-0000-4000-8000-000000000401.jpg',
             'b8000000-0000-4000-8000-000000000001', '{"size": 10}') $$,
  '42501', null,
  'RF-08: no sube a una novedad rechazada'
);

-- El disparador: la fila tiene que corresponder a un archivo de esa novedad ----------------

select throws_ok(
  $$ insert into public.evidencia (novedad_id, subida_por, ruta_storage, tamano_bytes)
     values ('b8000000-0000-4000-8000-0000000000d1', 'b8000000-0000-4000-8000-000000000001',
             'b8000000-0000-4000-8000-0000000000d1/b8000000-0000-4000-8000-000000000199.jpg', 10) $$,
  'P0001', 'EVIDENCIA_INVALIDA',
  'RF-08: no se registra una evidencia sin su archivo'
);
select throws_ok(
  $$ insert into public.evidencia (novedad_id, subida_por, ruta_storage, tamano_bytes)
     values ('b8000000-0000-4000-8000-0000000000d6', 'b8000000-0000-4000-8000-000000000001',
             'b8000000-0000-4000-8000-0000000000d1/b8000000-0000-4000-8000-000000000102.jpg', 10) $$,
  'P0001', 'EVIDENCIA_INVALIDA',
  'SDD 6.1.7: no se asocia a una novedad el archivo que está en la carpeta de otra'
);
select throws_ok(
  $$ insert into public.evidencia (novedad_id, subida_por, ruta_storage, tamano_bytes)
     values ('b8000000-0000-4000-8000-0000000000d1', 'b8000000-0000-4000-8000-000000000002',
             'b8000000-0000-4000-8000-0000000000d1/b8000000-0000-4000-8000-000000000102.jpg', 10) $$,
  '42501', null,
  'Tabla 31: subida_por es siempre quien sube'
);

-- CU-08 · máximo de 3 fotos por novedad (FOTOS_MAXIMO_POR_NOVEDAD) -------------------------

select lives_ok(
  $$ insert into storage.objects (bucket_id, name, owner_id, metadata)
     select 'evidencias',
            'b8000000-0000-4000-8000-0000000000d2/b8000000-0000-4000-8000-00000000020' || n || '.jpg',
            'b8000000-0000-4000-8000-000000000001', '{"size": 500}'
     from generate_series(1, 3) as n $$,
  'RF-08: sube tres fotos a la misma novedad'
);
select lives_ok(
  $$ insert into public.evidencia (novedad_id, subida_por, ruta_storage, tamano_bytes)
     select 'b8000000-0000-4000-8000-0000000000d2', 'b8000000-0000-4000-8000-000000000001',
            'b8000000-0000-4000-8000-0000000000d2/b8000000-0000-4000-8000-00000000020' || n || '.jpg', 500
     from generate_series(1, 3) as n $$,
  'RF-08: y las asocia'
);
select throws_ok(
  $$ insert into storage.objects (bucket_id, name, owner_id, metadata)
     values ('evidencias',
             'b8000000-0000-4000-8000-0000000000d2/b8000000-0000-4000-8000-000000000204.jpg',
             'b8000000-0000-4000-8000-000000000001', '{"size": 500}') $$,
  '42501', null,
  'RF-08: la cuarta foto no se sube'
);

-- Archivos puestos por el propietario: llegan al disparador sin pasar por la política.
reset role;
insert into storage.objects (bucket_id, name, owner_id, metadata)
values
  ('evidencias', 'b8000000-0000-4000-8000-0000000000d2/b8000000-0000-4000-8000-000000000205.jpg',
   'b8000000-0000-4000-8000-000000000001', '{"size": 500}'),
  ('evidencias', 'b8000000-0000-4000-8000-0000000000d3/b8000000-0000-4000-8000-000000000302.jpg',
   'b8000000-0000-4000-8000-000000000001', '{"size": 500}');

set local role authenticated;
set local request.jwt.claims = '{"sub": "b8000000-0000-4000-8000-000000000001", "role": "authenticated"}';

select throws_ok(
  $$ insert into public.evidencia (novedad_id, subida_por, ruta_storage, tamano_bytes)
     values ('b8000000-0000-4000-8000-0000000000d2', 'b8000000-0000-4000-8000-000000000001',
             'b8000000-0000-4000-8000-0000000000d2/b8000000-0000-4000-8000-000000000205.jpg', 500) $$,
  'P0001', 'LIMITE_DE_FOTOS',
  'RF-08: la cuarta evidencia no se registra aunque su archivo exista'
);
select throws_ok(
  $$ insert into public.evidencia (novedad_id, subida_por, ruta_storage, tamano_bytes)
     values ('b8000000-0000-4000-8000-0000000000d3', 'b8000000-0000-4000-8000-000000000001',
             'b8000000-0000-4000-8000-0000000000d3/b8000000-0000-4000-8000-000000000302.jpg', 500) $$,
  'P0001', 'TRANSICION_INVALIDA',
  'RF-08: una novedad cerrada no recibe evidencias, aunque el archivo exista'
);

-- RNF-11 · al reporte solo le sube fotos el reportante activo de la finca ----------------
-- El aprobador del área sube fotos de la solución, solo a una novedad resuelta (cambio 23;
-- rf08_fotos_de_la_solucion_test.sql). d1 está asignada.

set local request.jwt.claims = '{"sub": "b8000000-0000-4000-8000-000000000004", "role": "authenticated"}';
select throws_ok(
  $$ insert into storage.objects (bucket_id, name, owner_id, metadata)
     values ('evidencias',
             'b8000000-0000-4000-8000-0000000000d1/b8000000-0000-4000-8000-000000000141.jpg',
             'b8000000-0000-4000-8000-000000000004', '{"size": 10}') $$,
  '42501', null,
  'RF-08: el aprobador del área no sube fotos a una novedad que no está resuelta'
);
select throws_ok(
  $$ insert into public.evidencia (novedad_id, subida_por, ruta_storage, tamano_bytes)
     values ('b8000000-0000-4000-8000-0000000000d1', 'b8000000-0000-4000-8000-000000000004',
             'b8000000-0000-4000-8000-0000000000d1/b8000000-0000-4000-8000-000000000102.jpg', 10) $$,
  'P0001', 'TRANSICION_INVALIDA',
  'RF-08: ni registra evidencias en ella'
);

set local request.jwt.claims = '{"sub": "b8000000-0000-4000-8000-000000000006", "role": "authenticated"}';
select throws_ok(
  $$ insert into storage.objects (bucket_id, name, owner_id, metadata)
     values ('evidencias',
             'b8000000-0000-4000-8000-0000000000d1/b8000000-0000-4000-8000-000000000161.jpg',
             'b8000000-0000-4000-8000-000000000006', '{"size": 10}') $$,
  '42501', null,
  'RNF-11: el director no sube fotos'
);

set local request.jwt.claims = '{"sub": "b8000000-0000-4000-8000-000000000007", "role": "authenticated"}';
select throws_ok(
  $$ insert into storage.objects (bucket_id, name, owner_id, metadata)
     values ('evidencias',
             'b8000000-0000-4000-8000-0000000000d1/b8000000-0000-4000-8000-000000000171.jpg',
             'b8000000-0000-4000-8000-000000000007', '{"size": 10}') $$,
  '42501', null,
  'RNF-11: el administrador no sube fotos'
);

set local request.jwt.claims = '{"sub": "b8000000-0000-4000-8000-000000000003", "role": "authenticated"}';
select throws_ok(
  $$ insert into storage.objects (bucket_id, name, owner_id, metadata)
     values ('evidencias',
             'b8000000-0000-4000-8000-0000000000d1/b8000000-0000-4000-8000-000000000131.jpg',
             'b8000000-0000-4000-8000-000000000003', '{"size": 10}') $$,
  '42501', null,
  'RNF-11: un reportante desactivado no sube fotos'
);

set local request.jwt.claims = '{"sub": "b8000000-0000-4000-8000-000000000008", "role": "authenticated"}';
select throws_ok(
  $$ insert into storage.objects (bucket_id, name, owner_id, metadata)
     values ('evidencias',
             'b8000000-0000-4000-8000-0000000000d1/b8000000-0000-4000-8000-000000000181.jpg',
             'b8000000-0000-4000-8000-000000000008', '{"size": 10}') $$,
  '42501', null,
  'RNF-11: un usuario sin perfil no sube fotos'
);

set local role anon;
set local request.jwt.claims = '{"role": "anon"}';
select throws_ok(
  $$ insert into storage.objects (bucket_id, name, metadata)
     values ('evidencias',
             'b8000000-0000-4000-8000-0000000000d1/b8000000-0000-4000-8000-000000000191.jpg',
             '{"size": 10}') $$,
  '42501', null,
  'RNF-11: sin sesión no se sube nada'
);
select is(
  (select count(*)::int from storage.objects where bucket_id = 'evidencias'
     and name like 'b8000000-0000-4000-8000-0000000000d1/%'),
  0,
  'RNF-11: sin sesión no se ve ningún archivo'
);

-- Tabla 31 · lee los archivos quien puede ver la novedad ---------------------------------
-- En la carpeta de d1 hay dos archivos: el de la evidencia (101) y el huérfano (102).

set local role authenticated;

set local request.jwt.claims = '{"sub": "b8000000-0000-4000-8000-000000000001", "role": "authenticated"}';
select is(
  (select array_agg(name order by name) from storage.objects
   where bucket_id = 'evidencias' and name like 'b8000000-0000-4000-8000-0000000000d1/%'),
  array['b8000000-0000-4000-8000-0000000000d1/b8000000-0000-4000-8000-000000000101.jpg'],
  'Tabla 31: el reportante de la finca ve la foto de la evidencia y no el archivo huérfano'
);

set local request.jwt.claims = '{"sub": "b8000000-0000-4000-8000-000000000004", "role": "authenticated"}';
select is(
  (select count(*)::int from storage.objects where bucket_id = 'evidencias'
     and name like 'b8000000-0000-4000-8000-0000000000d1/%'),
  1,
  'Tabla 31: el aprobador del área la ve'
);

set local request.jwt.claims = '{"sub": "b8000000-0000-4000-8000-000000000005", "role": "authenticated"}';
select is(
  (select count(*)::int from storage.objects where bucket_id = 'evidencias'
     and name like 'b8000000-0000-4000-8000-0000000000d1/%'),
  0,
  'RNF-11: el aprobador de otra área no la ve'
);

set local request.jwt.claims = '{"sub": "b8000000-0000-4000-8000-000000000006", "role": "authenticated"}';
select is(
  (select count(*)::int from storage.objects where bucket_id = 'evidencias'
     and name like 'b8000000-0000-4000-8000-0000000000d1/%'),
  1,
  'Tabla 31: el director la ve'
);

set local request.jwt.claims = '{"sub": "b8000000-0000-4000-8000-000000000007", "role": "authenticated"}';
select is(
  (select count(*)::int from storage.objects where bucket_id = 'evidencias'
     and name like 'b8000000-0000-4000-8000-0000000000d1/%'),
  1,
  'Tabla 31: el administrador la ve'
);

set local request.jwt.claims = '{"sub": "b8000000-0000-4000-8000-000000000002", "role": "authenticated"}';
select is(
  (select count(*)::int from storage.objects where bucket_id = 'evidencias'
     and name like 'b8000000-0000-4000-8000-0000000000d1/%'),
  0,
  'RNF-11: el reportante de otra finca no la ve'
);

set local request.jwt.claims = '{"sub": "b8000000-0000-4000-8000-000000000003", "role": "authenticated"}';
select is(
  (select count(*)::int from storage.objects where bucket_id = 'evidencias'
     and name like 'b8000000-0000-4000-8000-0000000000d1/%'),
  0,
  'RNF-11: un reportante desactivado de la misma finca no la ve'
);

-- Nadie actualiza ni borra -----------------------------------------------------------------
-- Sin política de update, la sentencia no alcanza ninguna fila. Los borrados directos los
-- rechaza Storage mismo (storage.protect_delete); `evidencia` no da esos privilegios.

set local request.jwt.claims = '{"sub": "b8000000-0000-4000-8000-000000000001", "role": "authenticated"}';
update storage.objects set metadata = '{"size": 1}'
where name = 'b8000000-0000-4000-8000-0000000000d1/b8000000-0000-4000-8000-000000000101.jpg';

select throws_ok(
  $$ delete from storage.objects
     where name = 'b8000000-0000-4000-8000-0000000000d1/b8000000-0000-4000-8000-000000000101.jpg' $$,
  '42501', null,
  'Tabla 31: el reportante no borra el archivo'
);
select throws_ok(
  $$ update public.evidencia set tamano_bytes = 1
     where ruta_storage = 'b8000000-0000-4000-8000-0000000000d1/b8000000-0000-4000-8000-000000000101.jpg' $$,
  '42501', null,
  'Tabla 31: ni cambia la fila de la evidencia'
);
select throws_ok(
  $$ delete from public.evidencia
     where ruta_storage = 'b8000000-0000-4000-8000-0000000000d1/b8000000-0000-4000-8000-000000000101.jpg' $$,
  '42501', null,
  'Tabla 31: ni la borra'
);

reset role;

select is(
  (select (metadata ->> 'size')::int from storage.objects
   where name = 'b8000000-0000-4000-8000-0000000000d1/b8000000-0000-4000-8000-000000000101.jpg'),
  2048,
  'Tabla 31: el reportante no puede cambiar el archivo'
);

-- Las auxiliares no se ejecutan desde la API ----------------------------------------------

select ok(
  not has_function_privilege('anon', 'private.novedad_de_la_ruta(text)', 'execute'),
  'Regla 2: anon no ejecuta la auxiliar de la ruta'
);
select ok(
  not has_function_privilege('authenticated', 'private.tg_evidencia_valida()', 'execute'),
  'Regla 2: nadie ejecuta el disparador directamente'
);
select is(
  private.novedad_de_la_ruta('b8000000-0000-4000-8000-0000000000d1/b8000000-0000-4000-8000-000000000101.jpg'),
  'b8000000-0000-4000-8000-0000000000d1'::uuid,
  'SDD 6.1.7: la ruta dice de qué novedad es el archivo'
);
select ok(
  private.novedad_de_la_ruta('b8000000-0000-4000-8000-0000000000d1/../x.jpg') is null
  and private.novedad_de_la_ruta('B8000000-0000-4000-8000-0000000000D1/b8000000-0000-4000-8000-000000000101.JPG') is null
  and private.novedad_de_la_ruta('otra/b8000000-0000-4000-8000-0000000000d1/b8000000-0000-4000-8000-000000000101.jpg') is null,
  'SDD 6.1.7: una ruta con otra forma no corresponde a ninguna novedad, sin lanzar un error'
);

select * from finish();

rollback;
