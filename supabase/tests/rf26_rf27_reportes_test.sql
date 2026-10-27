-- RF-26 / CU-26 y RF-27 / CU-27 · rpt_novedades_abiertas y rpt_tiempos_atencion (SDD 6.1.9,
-- Tabla 34; plan del Sprint 5, decisiones 19 a 23 y 27). Las cifras exactas se prueban con datos
-- propios de 2001, creados dentro de la transacción: «staging» acumula otras novedades, así que
-- las abiertas se comparan por sus filas (fincas y áreas de la prueba) y por la diferencia
-- antes y después por estado.
begin;

create extension if not exists pgtap with schema extensions;

select plan(30);

-- Usuarios (como propietario) ----------------------------------------------------------

insert into public.razon_social (id, nombre)
values ('e6000000-0000-4000-8000-0000000000a1', 'RS pgTAP reportes');

insert into public.area (id, nombre, activo)
values
  ('e6000000-0000-4000-8000-0000000000b1', 'Área pgTAP reportes 1', true),
  ('e6000000-0000-4000-8000-0000000000b2', 'Área pgTAP reportes 2', true),
  ('e6000000-0000-4000-8000-0000000000b3', 'Área pgTAP reportes 3', true);

-- f1 y f5 activas con novedades; f2 activa sin abiertas; f3 inactiva con una abierta; f4
-- inactiva sin abiertas.
insert into public.finca (id, razon_social_id, nombre, activo)
values
  ('e6000000-0000-4000-8000-0000000000f1', 'e6000000-0000-4000-8000-0000000000a1', 'Finca pgTAP reportes 1', true),
  ('e6000000-0000-4000-8000-0000000000f2', 'e6000000-0000-4000-8000-0000000000a1', 'Finca pgTAP reportes 2', true),
  ('e6000000-0000-4000-8000-0000000000f3', 'e6000000-0000-4000-8000-0000000000a1', 'Finca pgTAP reportes 3', false),
  ('e6000000-0000-4000-8000-0000000000f4', 'e6000000-0000-4000-8000-0000000000a1', 'Finca pgTAP reportes 4', false),
  ('e6000000-0000-4000-8000-0000000000f5', 'e6000000-0000-4000-8000-0000000000a1', 'Finca pgTAP reportes 5', true);

insert into auth.users (instance_id, id, aud, role, email)
select '00000000-0000-0000-0000-000000000000', id, 'authenticated', 'authenticated', correo
from (
  values
    ('e6000000-0000-4000-8000-000000000001'::uuid, 'reportante@reportes.pgtap.test'),
    ('e6000000-0000-4000-8000-000000000002'::uuid, 'aprobador@reportes.pgtap.test'),
    ('e6000000-0000-4000-8000-000000000003'::uuid, 'director@reportes.pgtap.test'),
    ('e6000000-0000-4000-8000-000000000004'::uuid, 'administrador@reportes.pgtap.test'),
    ('e6000000-0000-4000-8000-000000000005'::uuid, 'inactivo@reportes.pgtap.test')
) as u (id, correo);

insert into public.usuario (id, nombre, correo, rol_id, finca_id, area_id, activo)
values
  ('e6000000-0000-4000-8000-000000000001', 'Reportante', 'reportante@reportes.pgtap.test', 1, 'e6000000-0000-4000-8000-0000000000f1', null, true),
  ('e6000000-0000-4000-8000-000000000002', 'Aprobador', 'aprobador@reportes.pgtap.test', 2, null, 'e6000000-0000-4000-8000-0000000000b1', true),
  ('e6000000-0000-4000-8000-000000000003', 'Director', 'director@reportes.pgtap.test', 3, null, null, true),
  ('e6000000-0000-4000-8000-000000000004', 'Administrador', 'administrador@reportes.pgtap.test', 4, null, null, true),
  ('e6000000-0000-4000-8000-000000000005', 'Director inactivo', 'inactivo@reportes.pgtap.test', 3, null, null, false);

-- Quién puede pedir el panel (CU-26 1a; decisión 19) ------------------------------------

set local role authenticated;

set local request.jwt.claims = '{"sub": "e6000000-0000-4000-8000-000000000001", "role": "authenticated"}';
select throws_ok(
  $$ select public.rpt_novedades_abiertas() $$, 'P0001', 'SIN_PERMISO',
  'RF-26 / CU-26 1a: el reportante no ve el panel'
);
select throws_ok(
  $$ select public.rpt_tiempos_atencion('2001-03-01', '2001-04-30') $$, 'P0001', 'SIN_PERMISO',
  'RF-27 / CU-27 1a: el reportante no ve los tiempos'
);

set local request.jwt.claims = '{"sub": "e6000000-0000-4000-8000-000000000002", "role": "authenticated"}';
select is(
  (select array_agg(a ->> 'id') from jsonb_array_elements(public.rpt_novedades_abiertas() -> 'areas') a),
  array['e6000000-0000-4000-8000-0000000000b1'],
  'RF-26 (cambio 38): el aprobador ve el panel solo de su área'
);
select is(
  (select array_agg(a ->> 'id') from jsonb_array_elements(public.rpt_tiempos_atencion('2001-03-01', '2001-04-30') -> 'areas') a),
  array['e6000000-0000-4000-8000-0000000000b1'],
  'RF-27 (cambio 38): y los tiempos, solo de su área'
);

set local request.jwt.claims = '{"sub": "e6000000-0000-4000-8000-000000000005", "role": "authenticated"}';
select throws_ok(
  $$ select public.rpt_novedades_abiertas() $$, 'P0001', 'SIN_PERMISO',
  'RNF-11: un director inactivo no ve el panel'
);

select ok(
  not has_function_privilege('anon', 'public.rpt_novedades_abiertas()', 'execute')
    and not has_function_privilege('anon', 'public.rpt_tiempos_atencion(date, date)', 'execute'),
  'RNF-11: anon no ejecuta los reportes'
);

reset role;

-- Las resueltas y cerradas necesitan su solución (restricción novedad_resuelta_completa).
insert into public.tipo_falla (id, nombre, nombre_normalizado, creado_por)
values ('e6000000-0000-4000-8000-0000000000e1', 'Tipo pgTAP reportes', 'tipo pgtap reportes', 'e6000000-0000-4000-8000-000000000002');

-- Novedades de la prueba (como propietario) --------------------------------------------

-- Abiertas en f1 y f3: n1 a n6, una por estado abierto; n7 cerrada y n8 rechazada no cuentan.
insert into public.novedad (id, id_local, finca_id, area_id, reportante_id, descripcion, prioridad, estado, fecha_registro, tipo_falla_id, solucion, fecha_ejecucion)
values
  ('e6000000-0000-4000-8000-0000000000d1', gen_random_uuid(), 'e6000000-0000-4000-8000-0000000000f1', 'e6000000-0000-4000-8000-0000000000b1', 'e6000000-0000-4000-8000-000000000001', 'n1', 'alto', 'asignada', '2001-01-10 08:00-05', null, null, null),
  ('e6000000-0000-4000-8000-0000000000d2', gen_random_uuid(), 'e6000000-0000-4000-8000-0000000000f1', 'e6000000-0000-4000-8000-0000000000b2', 'e6000000-0000-4000-8000-000000000001', 'n2', 'normal', 'en_atencion', '2001-01-11 08:00-05', null, null, null),
  ('e6000000-0000-4000-8000-0000000000d3', gen_random_uuid(), 'e6000000-0000-4000-8000-0000000000f1', 'e6000000-0000-4000-8000-0000000000b1', 'e6000000-0000-4000-8000-000000000001', 'n3', 'normal', 'escalada', '2001-01-12 08:00-05', null, null, null),
  ('e6000000-0000-4000-8000-0000000000d4', gen_random_uuid(), 'e6000000-0000-4000-8000-0000000000f3', 'e6000000-0000-4000-8000-0000000000b2', 'e6000000-0000-4000-8000-000000000001', 'n4', 'bajo', 'aprobada', '2001-01-13 08:00-05', null, null, null),
  ('e6000000-0000-4000-8000-0000000000d5', gen_random_uuid(), 'e6000000-0000-4000-8000-0000000000f1', 'e6000000-0000-4000-8000-0000000000b1', 'e6000000-0000-4000-8000-000000000001', 'n5', 'critico', 'resuelta', '2001-01-14 08:00-05', 'e6000000-0000-4000-8000-0000000000e1', 'Solución pgTAP', '2001-01-01'),
  ('e6000000-0000-4000-8000-0000000000d6', gen_random_uuid(), 'e6000000-0000-4000-8000-0000000000f1', 'e6000000-0000-4000-8000-0000000000b2', 'e6000000-0000-4000-8000-000000000001', 'n6', 'normal', 'registrada', '2001-01-15 08:00-05', null, null, null),
  ('e6000000-0000-4000-8000-0000000000d7', gen_random_uuid(), 'e6000000-0000-4000-8000-0000000000f1', 'e6000000-0000-4000-8000-0000000000b1', 'e6000000-0000-4000-8000-000000000001', 'n7', 'normal', 'cerrada', '2001-01-16 08:00-05', 'e6000000-0000-4000-8000-0000000000e1', 'Solución pgTAP', '2001-01-01'),
  ('e6000000-0000-4000-8000-0000000000d8', gen_random_uuid(), 'e6000000-0000-4000-8000-0000000000f1', 'e6000000-0000-4000-8000-0000000000b2', 'e6000000-0000-4000-8000-000000000001', 'n8', 'normal', 'rechazada', '2001-01-17 08:00-05', null, null, null);

-- Tiempos, en f5, con el período del 1 de marzo al 30 de abril de 2001.
insert into public.novedad (id, id_local, finca_id, area_id, reportante_id, descripcion, prioridad, estado, fecha_registro, tipo_falla_id, solucion, fecha_ejecucion)
values
  -- t1 y t2: área 1, marzo, 48 h y 24 h.
  ('e6000000-0000-4000-8000-0000000000c1', gen_random_uuid(), 'e6000000-0000-4000-8000-0000000000f5', 'e6000000-0000-4000-8000-0000000000b1', 'e6000000-0000-4000-8000-000000000001', 't1', 'normal', 'cerrada', '2001-03-01 08:00-05', 'e6000000-0000-4000-8000-0000000000e1', 'Solución pgTAP', '2001-01-01'),
  ('e6000000-0000-4000-8000-0000000000c2', gen_random_uuid(), 'e6000000-0000-4000-8000-0000000000f5', 'e6000000-0000-4000-8000-0000000000b1', 'e6000000-0000-4000-8000-000000000001', 't2', 'normal', 'cerrada', '2001-03-10 08:00-05', 'e6000000-0000-4000-8000-0000000000e1', 'Solución pgTAP', '2001-01-01'),
  -- t3: área 2, registrada antes del período y resuelta dentro: 120 h.
  ('e6000000-0000-4000-8000-0000000000c3', gen_random_uuid(), 'e6000000-0000-4000-8000-0000000000f5', 'e6000000-0000-4000-8000-0000000000b2', 'e6000000-0000-4000-8000-000000000001', 't3', 'normal', 'cerrada', '2001-02-25 08:00-05', 'e6000000-0000-4000-8000-0000000000e1', 'Solución pgTAP', '2001-01-01'),
  -- t4: área 2, la falla persistió y se volvió a resolver: cuenta la última, 96 h.
  ('e6000000-0000-4000-8000-0000000000c4', gen_random_uuid(), 'e6000000-0000-4000-8000-0000000000f5', 'e6000000-0000-4000-8000-0000000000b2', 'e6000000-0000-4000-8000-000000000001', 't4', 'normal', 'cerrada', '2001-04-01 08:00-05', 'e6000000-0000-4000-8000-0000000000e1', 'Solución pgTAP', '2001-01-01'),
  -- t5: abierta, no entra en el promedio.
  ('e6000000-0000-4000-8000-0000000000c5', gen_random_uuid(), 'e6000000-0000-4000-8000-0000000000f5', 'e6000000-0000-4000-8000-0000000000b3', 'e6000000-0000-4000-8000-000000000001', 't5', 'normal', 'en_atencion', '2001-03-05 08:00-05', null, null, null),
  -- t6: resuelta después del período.
  ('e6000000-0000-4000-8000-0000000000c6', gen_random_uuid(), 'e6000000-0000-4000-8000-0000000000f5', 'e6000000-0000-4000-8000-0000000000b1', 'e6000000-0000-4000-8000-000000000001', 't6', 'normal', 'cerrada', '2001-04-20 08:00-05', 'e6000000-0000-4000-8000-0000000000e1', 'Solución pgTAP', '2001-01-01'),
  -- t7: se resolvió en el período, pero la falla persiste y no se ha vuelto a resolver.
  ('e6000000-0000-4000-8000-0000000000c7', gen_random_uuid(), 'e6000000-0000-4000-8000-0000000000f5', 'e6000000-0000-4000-8000-0000000000b3', 'e6000000-0000-4000-8000-000000000001', 't7', 'normal', 'en_atencion', '2001-03-20 08:00-05', null, null, null),
  -- t8: resuelta el último día a las 11:30 p. m. de Colombia (ya es 1 de mayo en UTC): 15,5 h.
  ('e6000000-0000-4000-8000-0000000000c8', gen_random_uuid(), 'e6000000-0000-4000-8000-0000000000f5', 'e6000000-0000-4000-8000-0000000000b1', 'e6000000-0000-4000-8000-000000000001', 't8', 'normal', 'cerrada', '2001-04-30 08:00-05', 'e6000000-0000-4000-8000-0000000000e1', 'Solución pgTAP', '2001-01-01'),
  -- t9: resuelta a las 12:10 a. m. del 1 de mayo de Colombia: fuera.
  ('e6000000-0000-4000-8000-0000000000c9', gen_random_uuid(), 'e6000000-0000-4000-8000-0000000000f5', 'e6000000-0000-4000-8000-0000000000b1', 'e6000000-0000-4000-8000-000000000001', 't9', 'normal', 'cerrada', '2001-04-30 09:00-05', 'e6000000-0000-4000-8000-0000000000e1', 'Solución pgTAP', '2001-01-01');

insert into public.historial_transicion (novedad_id, usuario_id, estado_anterior, estado_nuevo, fecha_hora)
values
  ('e6000000-0000-4000-8000-0000000000d5', 'e6000000-0000-4000-8000-000000000002', 'en_atencion', 'resuelta', '2001-02-01 08:00-05'),
  ('e6000000-0000-4000-8000-0000000000c1', 'e6000000-0000-4000-8000-000000000002', 'en_atencion', 'resuelta', '2001-03-03 08:00-05'),
  ('e6000000-0000-4000-8000-0000000000c2', 'e6000000-0000-4000-8000-000000000002', 'en_atencion', 'resuelta', '2001-03-11 08:00-05'),
  ('e6000000-0000-4000-8000-0000000000c3', 'e6000000-0000-4000-8000-000000000002', 'en_atencion', 'resuelta', '2001-03-02 08:00-05'),
  ('e6000000-0000-4000-8000-0000000000c4', 'e6000000-0000-4000-8000-000000000002', 'en_atencion', 'resuelta', '2001-04-02 08:00-05'),
  ('e6000000-0000-4000-8000-0000000000c4', 'e6000000-0000-4000-8000-000000000001', 'resuelta', 'en_atencion', '2001-04-03 08:00-05'),
  ('e6000000-0000-4000-8000-0000000000c4', 'e6000000-0000-4000-8000-000000000002', 'en_atencion', 'resuelta', '2001-04-05 08:00-05'),
  ('e6000000-0000-4000-8000-0000000000c6', 'e6000000-0000-4000-8000-000000000002', 'en_atencion', 'resuelta', '2001-06-15 08:00-05'),
  ('e6000000-0000-4000-8000-0000000000c7', 'e6000000-0000-4000-8000-000000000002', 'en_atencion', 'resuelta', '2001-03-21 08:00-05'),
  ('e6000000-0000-4000-8000-0000000000c7', 'e6000000-0000-4000-8000-000000000001', 'resuelta', 'en_atencion', '2001-03-22 08:00-05'),
  ('e6000000-0000-4000-8000-0000000000c8', 'e6000000-0000-4000-8000-000000000002', 'en_atencion', 'resuelta', '2001-04-30 23:30-05'),
  ('e6000000-0000-4000-8000-0000000000c9', 'e6000000-0000-4000-8000-000000000002', 'en_atencion', 'resuelta', '2001-05-01 00:10-05');

-- Novedades abiertas (RF-26 / CU-26 2) ------------------------------------------------

set local role authenticated;
set local request.jwt.claims = '{"sub": "e6000000-0000-4000-8000-000000000003", "role": "authenticated"}';
do $$ begin perform set_config('prueba.abiertas', public.rpt_novedades_abiertas()::text, true); end $$;

select is(
  (current_setting('prueba.abiertas')::jsonb ->> 'datos_al')::timestamptz,
  now(),
  'RF-26: «Datos al» es la hora de la consulta'
);

select is(
  (
    select jsonb_object_agg(a ->> 'id', (a ->> 'abiertas')::int)
    from jsonb_array_elements(current_setting('prueba.abiertas')::jsonb -> 'areas') a
    where a ->> 'id' like 'e6000000%'
  ),
  '{"e6000000-0000-4000-8000-0000000000b1": 3, "e6000000-0000-4000-8000-0000000000b2": 3, "e6000000-0000-4000-8000-0000000000b3": 2}'::jsonb,
  'RF-26 / CU-26 2: por área cuentan los seis estados abiertos, no las cerradas ni las rechazadas'
);

select is(
  (
    select f - 'razon_social'
    from jsonb_array_elements(current_setting('prueba.abiertas')::jsonb -> 'fincas') f
    where f ->> 'id' = 'e6000000-0000-4000-8000-0000000000f1'
  ),
  '{"id": "e6000000-0000-4000-8000-0000000000f1", "nombre": "Finca pgTAP reportes 1", "activa": true, "total": 5,
    "por_area": {"e6000000-0000-4000-8000-0000000000b1": 3, "e6000000-0000-4000-8000-0000000000b2": 2}}'::jsonb,
  'RF-26 / CU-26 2: la finca con su total y su reparto por área'
);

select is(
  (
    select f ->> 'razon_social'
    from jsonb_array_elements(current_setting('prueba.abiertas')::jsonb -> 'fincas') f
    where f ->> 'id' = 'e6000000-0000-4000-8000-0000000000f1'
  ),
  'RS pgTAP reportes',
  'RF-26: la tabla de 23 trae la razón social'
);

select is(
  (
    select f - 'razon_social' - 'nombre'
    from jsonb_array_elements(current_setting('prueba.abiertas')::jsonb -> 'fincas') f
    where f ->> 'id' = 'e6000000-0000-4000-8000-0000000000f2'
  ),
  '{"id": "e6000000-0000-4000-8000-0000000000f2", "activa": true, "total": 0, "por_area": {}}'::jsonb,
  'RF-26 / CU-26 2a: una finca activa sin abiertas sale en cero'
);

select is(
  (
    select f -> 'activa' || jsonb_build_object('total', f -> 'total')
    from jsonb_array_elements(current_setting('prueba.abiertas')::jsonb -> 'fincas') f
    where f ->> 'id' = 'e6000000-0000-4000-8000-0000000000f3'
  ),
  '[false, {"total": 1}]'::jsonb,
  'RF-26 (decisión 21): una finca inactiva que aún tiene abiertas también sale'
);

select is(
  (
    select count(*)::int
    from jsonb_array_elements(current_setting('prueba.abiertas')::jsonb -> 'fincas') f
    where f ->> 'id' = 'e6000000-0000-4000-8000-0000000000f4'
  ),
  0,
  'RF-26: una finca inactiva sin abiertas no sale'
);

-- En una sola sentencia, la función y la tabla ven la misma instantánea, aunque otra corrida
-- registre novedades a la vez en «staging».
select is(
  (
    select jsonb_object_agg(e ->> 'estado', (e ->> 'abiertas')::int)
    from jsonb_array_elements(public.rpt_novedades_abiertas() -> 'estados') e
  ),
  (
    select jsonb_object_agg(
      x.estado::text,
      (select count(*)::int from public.novedad n where n.estado = x.estado)
    )
    from unnest(
      array['registrada', 'asignada', 'en_atencion', 'escalada', 'aprobada', 'resuelta']::public.estado_novedad[]
    ) as x (estado)
  ),
  'RF-26 / CU-26 2: la distribución por estado cuenta los seis estados abiertos, como la tabla'
);

select is(
  (
    select array_agg(e ->> 'estado')
    from jsonb_array_elements(current_setting('prueba.abiertas')::jsonb -> 'estados') e
  ),
  array['registrada', 'asignada', 'en_atencion', 'escalada', 'aprobada', 'resuelta'],
  'RF-26: los seis estados abiertos, en el orden del tipo'
);

set local request.jwt.claims = '{"sub": "e6000000-0000-4000-8000-000000000004", "role": "authenticated"}';
select lives_ok(
  $$ select public.rpt_novedades_abiertas() $$,
  'RF-26: el administrador también ve el panel'
);

-- Tiempos de atención (RF-27 / CU-27) --------------------------------------------------

set local request.jwt.claims = '{"sub": "e6000000-0000-4000-8000-000000000003", "role": "authenticated"}';
do $$ begin perform set_config('prueba.tiempos', public.rpt_tiempos_atencion('2001-03-01', '2001-04-30')::text, true); end $$;

select is(
  (current_setting('prueba.tiempos')::jsonb - 'datos_al' - 'areas' - 'meses' - 'abiertas'),
  '{"desde": "2001-03-01", "hasta": "2001-04-30"}'::jsonb,
  'RF-27: devuelve el período que se pidió'
);

select is(
  (current_setting('prueba.tiempos')::jsonb ->> 'datos_al')::timestamptz,
  now(),
  'RF-27: «Datos al» es la hora de la consulta'
);

select is(
  (
    select jsonb_object_agg(a ->> 'id', a - 'id' - 'nombre')
    from jsonb_array_elements(current_setting('prueba.tiempos')::jsonb -> 'areas') a
    where a ->> 'id' like 'e6000000%'
  ),
  '{"e6000000-0000-4000-8000-0000000000b1": {"resueltas": 3, "promedio_horas": 29.17},
    "e6000000-0000-4000-8000-0000000000b2": {"resueltas": 2, "promedio_horas": 108.00},
    "e6000000-0000-4000-8000-0000000000b3": {"resueltas": 0, "promedio_horas": null}}'::jsonb,
  'RF-27 / CU-27 3: promedio por área desde el registro; cuenta por la última resolución, el último día entero de Colombia'
);

select is(
  (
    select jsonb_agg(m - 'promedio_horas' || jsonb_build_object('promedio', m -> 'promedio_horas') order by m ->> 'area_id', m ->> 'mes')
    from jsonb_array_elements(current_setting('prueba.tiempos')::jsonb -> 'meses') m
    where m ->> 'area_id' like 'e6000000%'
  ),
  '[{"mes": "2001-03-01", "area_id": "e6000000-0000-4000-8000-0000000000b1", "resueltas": 2, "promedio": 36.00},
    {"mes": "2001-04-01", "area_id": "e6000000-0000-4000-8000-0000000000b1", "resueltas": 1, "promedio": 15.50},
    {"mes": "2001-03-01", "area_id": "e6000000-0000-4000-8000-0000000000b2", "resueltas": 1, "promedio": 120.00},
    {"mes": "2001-04-01", "area_id": "e6000000-0000-4000-8000-0000000000b2", "resueltas": 1, "promedio": 96.00}]'::jsonb,
  'RF-27 / CU-27 2: la evolución por mes de Colombia y por área'
);

select is(
  (
    select array_agg(a ->> 'id' order by ordinalidad)
    from jsonb_array_elements(current_setting('prueba.tiempos')::jsonb -> 'abiertas') with ordinality as x (a, ordinalidad)
  ),
  array[
    'e6000000-0000-4000-8000-0000000000d1', 'e6000000-0000-4000-8000-0000000000d2',
    'e6000000-0000-4000-8000-0000000000d3', 'e6000000-0000-4000-8000-0000000000d4',
    'e6000000-0000-4000-8000-0000000000d5'
  ],
  'RF-27: «Abiertas con más tiempo» son cinco, de la más antigua a la más reciente'
);

select is(
  (
    select array(select jsonb_object_keys(current_setting('prueba.tiempos')::jsonb -> 'abiertas' -> 0) order by 1)
  ),
  array['area', 'area_id', 'codigo', 'estado', 'fecha_registro', 'finca', 'horas_abierta', 'id', 'prioridad'],
  'RF-27: cada abierta trae lo que muestra 24'
);

select is(
  (current_setting('prueba.tiempos')::jsonb -> 'abiertas' -> 0 ->> 'horas_abierta')::numeric,
  round((extract(epoch from now() - '2001-01-10 08:00-05'::timestamptz) / 3600)::numeric, 2),
  'RF-27: el tiempo abierta se mide desde el registro hasta la consulta'
);

select is(
  (
    select count(*)::int
    from jsonb_array_elements(public.rpt_tiempos_atencion('2001-07-01', '2001-07-31') -> 'meses') m
    where m ->> 'area_id' like 'e6000000%'
  ),
  0,
  'RF-27 / CU-27 3a: un período sin resueltas no trae meses'
);

select throws_ok(
  $$ select public.rpt_tiempos_atencion('2001-04-30', '2001-03-01') $$, 'P0001', 'FECHA_INVALIDA',
  'RF-27 (decisión 23): la fecha inicial posterior a la final es FECHA_INVALIDA'
);
select throws_ok(
  $$ select public.rpt_tiempos_atencion(null, '2001-03-01') $$, 'P0001', 'FECHA_INVALIDA',
  'RF-27: sin fecha inicial, FECHA_INVALIDA'
);
select throws_ok(
  $$ select public.rpt_tiempos_atencion('2001-03-01', null) $$, 'P0001', 'FECHA_INVALIDA',
  'RF-27: sin fecha final, FECHA_INVALIDA'
);
select lives_ok(
  $$ select public.rpt_tiempos_atencion('2001-03-01', '2001-03-01') $$,
  'RF-27: un solo día es un período válido'
);

set local request.jwt.claims = '{"sub": "e6000000-0000-4000-8000-000000000004", "role": "authenticated"}';
select lives_ok(
  $$ select public.rpt_tiempos_atencion('2001-03-01', '2001-04-30') $$,
  'RF-27: el administrador también ve los tiempos'
);

-- El panel del aprobador (cambio 38) ---------------------------------------------------

set local request.jwt.claims = '{"sub": "e6000000-0000-4000-8000-000000000002", "role": "authenticated"}';
select is(
  (
    select f -> 'por_area'
    from jsonb_array_elements(public.rpt_novedades_abiertas() -> 'fincas') f
    where f ->> 'id' = 'e6000000-0000-4000-8000-0000000000f1'
  ),
  '{"e6000000-0000-4000-8000-0000000000b1": 3}'::jsonb,
  'RF-26 (cambio 38): al aprobador solo le cuentan las abiertas de su área'
);

select * from finish();
rollback;
