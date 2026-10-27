-- RF-28 / CU-28 y RF-29 / CU-29 · rpt_escalamiento y rpt_recurrencia (SDD 6.1.9, Tabla 34;
-- plan del Sprint 5, decisiones 19 a 23 y 27). Las cifras exactas, con datos propios de 2001
-- creados dentro de la transacción: escalamiento en marzo y abril, recurrencia en junio y julio.
begin;

create extension if not exists pgtap with schema extensions;

select plan(24);

-- Usuarios, áreas, fincas y tipos (como propietario) ----------------------------------

insert into public.razon_social (id, nombre)
values ('e7000000-0000-4000-8000-0000000000a1', 'RS pgTAP escalas');

insert into public.area (id, nombre, activo)
values
  ('e7000000-0000-4000-8000-0000000000b1', 'Área pgTAP escalas 1', true),
  ('e7000000-0000-4000-8000-0000000000b2', 'Área pgTAP escalas 2', true);

insert into public.finca (id, razon_social_id, nombre, activo)
values
  ('e7000000-0000-4000-8000-0000000000f1', 'e7000000-0000-4000-8000-0000000000a1', 'Finca pgTAP escalas 1', true),
  ('e7000000-0000-4000-8000-0000000000f2', 'e7000000-0000-4000-8000-0000000000a1', 'Finca pgTAP escalas 2', true),
  ('e7000000-0000-4000-8000-0000000000f3', 'e7000000-0000-4000-8000-0000000000a1', 'Finca pgTAP escalas 3', true);

insert into auth.users (instance_id, id, aud, role, email)
select '00000000-0000-0000-0000-000000000000', id, 'authenticated', 'authenticated', correo
from (
  values
    ('e7000000-0000-4000-8000-000000000001'::uuid, 'reportante@escalas.pgtap.test'),
    ('e7000000-0000-4000-8000-000000000002'::uuid, 'aprobador@escalas.pgtap.test'),
    ('e7000000-0000-4000-8000-000000000003'::uuid, 'director@escalas.pgtap.test'),
    ('e7000000-0000-4000-8000-000000000004'::uuid, 'administrador@escalas.pgtap.test'),
    ('e7000000-0000-4000-8000-000000000005'::uuid, 'inactivo@escalas.pgtap.test')
) as u (id, correo);

insert into public.usuario (id, nombre, correo, rol_id, finca_id, area_id, activo)
values
  ('e7000000-0000-4000-8000-000000000001', 'Reportante', 'reportante@escalas.pgtap.test', 1, 'e7000000-0000-4000-8000-0000000000f1', null, true),
  ('e7000000-0000-4000-8000-000000000002', 'Aprobador', 'aprobador@escalas.pgtap.test', 2, null, 'e7000000-0000-4000-8000-0000000000b1', true),
  ('e7000000-0000-4000-8000-000000000003', 'Director', 'director@escalas.pgtap.test', 3, null, null, true),
  ('e7000000-0000-4000-8000-000000000004', 'Administrador', 'administrador@escalas.pgtap.test', 4, null, null, true),
  ('e7000000-0000-4000-8000-000000000005', 'Director inactivo', 'inactivo@escalas.pgtap.test', 3, null, null, false);

insert into public.tipo_falla (id, nombre, nombre_normalizado, creado_por)
values
  ('e7000000-0000-4000-8000-0000000000e1', 'Tipo pgTAP escalas 1', 'tipo pgtap escalas 1', 'e7000000-0000-4000-8000-000000000002'),
  ('e7000000-0000-4000-8000-0000000000e2', 'Tipo pgTAP escalas 2', 'tipo pgtap escalas 2', 'e7000000-0000-4000-8000-000000000002');

-- Escalamiento: el período es del 1 de marzo al 30 de abril de 2001 --------------------
-- e1 escalada y aprobada; e2 escalada y rechazada; e3 escalada, en espera; e4 escalada dos
-- veces (la última, rechazada); e5 sin escalar; e6 registrada antes y e7 después del período;
-- e8 registrada el último día a las 11 p. m. de Colombia.
insert into public.novedad (id, id_local, finca_id, area_id, reportante_id, descripcion, prioridad, estado, fecha_registro)
values
  ('e7000000-0000-4000-8000-0000000000d1', gen_random_uuid(), 'e7000000-0000-4000-8000-0000000000f1', 'e7000000-0000-4000-8000-0000000000b1', 'e7000000-0000-4000-8000-000000000001', 'e1', 'normal', 'aprobada', '2001-03-05 08:00-05'),
  ('e7000000-0000-4000-8000-0000000000d2', gen_random_uuid(), 'e7000000-0000-4000-8000-0000000000f1', 'e7000000-0000-4000-8000-0000000000b1', 'e7000000-0000-4000-8000-000000000001', 'e2', 'normal', 'rechazada', '2001-03-10 08:00-05'),
  ('e7000000-0000-4000-8000-0000000000d3', gen_random_uuid(), 'e7000000-0000-4000-8000-0000000000f1', 'e7000000-0000-4000-8000-0000000000b2', 'e7000000-0000-4000-8000-000000000001', 'e3', 'normal', 'escalada', '2001-03-15 08:00-05'),
  ('e7000000-0000-4000-8000-0000000000d4', gen_random_uuid(), 'e7000000-0000-4000-8000-0000000000f1', 'e7000000-0000-4000-8000-0000000000b1', 'e7000000-0000-4000-8000-000000000001', 'e4', 'normal', 'rechazada', '2001-03-20 08:00-05'),
  ('e7000000-0000-4000-8000-0000000000d5', gen_random_uuid(), 'e7000000-0000-4000-8000-0000000000f1', 'e7000000-0000-4000-8000-0000000000b2', 'e7000000-0000-4000-8000-000000000001', 'e5', 'normal', 'asignada', '2001-03-25 08:00-05'),
  ('e7000000-0000-4000-8000-0000000000d6', gen_random_uuid(), 'e7000000-0000-4000-8000-0000000000f1', 'e7000000-0000-4000-8000-0000000000b1', 'e7000000-0000-4000-8000-000000000001', 'e6', 'normal', 'aprobada', '2001-02-20 08:00-05'),
  ('e7000000-0000-4000-8000-0000000000d7', gen_random_uuid(), 'e7000000-0000-4000-8000-0000000000f1', 'e7000000-0000-4000-8000-0000000000b2', 'e7000000-0000-4000-8000-000000000001', 'e7', 'normal', 'asignada', '2001-05-01 08:00-05'),
  ('e7000000-0000-4000-8000-0000000000d8', gen_random_uuid(), 'e7000000-0000-4000-8000-0000000000f1', 'e7000000-0000-4000-8000-0000000000b1', 'e7000000-0000-4000-8000-000000000001', 'e8', 'normal', 'asignada', '2001-04-30 23:00-05');

insert into public.historial_transicion (novedad_id, usuario_id, estado_anterior, estado_nuevo, observacion, fecha_hora)
values
  ('e7000000-0000-4000-8000-0000000000d1', 'e7000000-0000-4000-8000-000000000002', 'en_atencion', 'escalada', 'J1', '2001-03-06 08:00-05'),
  ('e7000000-0000-4000-8000-0000000000d1', 'e7000000-0000-4000-8000-000000000003', 'escalada', 'aprobada', null, '2001-03-07 10:00-05'),
  ('e7000000-0000-4000-8000-0000000000d2', 'e7000000-0000-4000-8000-000000000002', 'en_atencion', 'escalada', 'J2', '2001-03-11 08:00-05'),
  ('e7000000-0000-4000-8000-0000000000d2', 'e7000000-0000-4000-8000-000000000003', 'escalada', 'rechazada', 'No', '2001-03-12 08:00-05'),
  ('e7000000-0000-4000-8000-0000000000d3', 'e7000000-0000-4000-8000-000000000002', 'en_atencion', 'escalada', 'J3', '2001-03-16 08:00-05'),
  ('e7000000-0000-4000-8000-0000000000d4', 'e7000000-0000-4000-8000-000000000002', 'en_atencion', 'escalada', 'J4a', '2001-03-21 08:00-05'),
  ('e7000000-0000-4000-8000-0000000000d4', 'e7000000-0000-4000-8000-000000000003', 'escalada', 'aprobada', null, '2001-03-22 08:00-05'),
  ('e7000000-0000-4000-8000-0000000000d4', 'e7000000-0000-4000-8000-000000000002', 'en_atencion', 'escalada', 'J4b', '2001-03-25 08:00-05'),
  ('e7000000-0000-4000-8000-0000000000d4', 'e7000000-0000-4000-8000-000000000003', 'escalada', 'rechazada', 'Tampoco', '2001-03-26 08:00-05'),
  ('e7000000-0000-4000-8000-0000000000d6', 'e7000000-0000-4000-8000-000000000002', 'en_atencion', 'escalada', 'J6', '2001-03-02 08:00-05');

-- Recurrencia: el período es del 1 de junio al 31 de julio de 2001 ---------------------
-- r1, r2 y r8 en f2 × t1; r3 en f2 × t2; r4 en f3 × t1; r5 abierta y r6 rechazada, por fuera;
-- r7 registrada antes del período; r8 el último día a las 11:30 p. m. de Colombia.
insert into public.novedad (id, id_local, finca_id, area_id, reportante_id, descripcion, prioridad, estado, fecha_registro, tipo_falla_id, solucion, fecha_ejecucion)
values
  ('e7000000-0000-4000-8000-0000000000c1', gen_random_uuid(), 'e7000000-0000-4000-8000-0000000000f2', 'e7000000-0000-4000-8000-0000000000b1', 'e7000000-0000-4000-8000-000000000001', 'r1', 'normal', 'cerrada', '2001-06-05 08:00-05', 'e7000000-0000-4000-8000-0000000000e1', 'Solución', '2001-06-06'),
  ('e7000000-0000-4000-8000-0000000000c2', gen_random_uuid(), 'e7000000-0000-4000-8000-0000000000f2', 'e7000000-0000-4000-8000-0000000000b1', 'e7000000-0000-4000-8000-000000000001', 'r2', 'normal', 'resuelta', '2001-06-10 08:00-05', 'e7000000-0000-4000-8000-0000000000e1', 'Solución', '2001-06-11'),
  ('e7000000-0000-4000-8000-0000000000c3', gen_random_uuid(), 'e7000000-0000-4000-8000-0000000000f2', 'e7000000-0000-4000-8000-0000000000b1', 'e7000000-0000-4000-8000-000000000001', 'r3', 'normal', 'cerrada', '2001-06-15 08:00-05', 'e7000000-0000-4000-8000-0000000000e2', 'Solución', '2001-06-16'),
  ('e7000000-0000-4000-8000-0000000000c4', gen_random_uuid(), 'e7000000-0000-4000-8000-0000000000f3', 'e7000000-0000-4000-8000-0000000000b1', 'e7000000-0000-4000-8000-000000000001', 'r4', 'normal', 'cerrada', '2001-07-01 08:00-05', 'e7000000-0000-4000-8000-0000000000e1', 'Solución', '2001-07-02'),
  ('e7000000-0000-4000-8000-0000000000c5', gen_random_uuid(), 'e7000000-0000-4000-8000-0000000000f3', 'e7000000-0000-4000-8000-0000000000b1', 'e7000000-0000-4000-8000-000000000001', 'r5', 'normal', 'asignada', '2001-06-20 08:00-05', null, null, null),
  ('e7000000-0000-4000-8000-0000000000c6', gen_random_uuid(), 'e7000000-0000-4000-8000-0000000000f3', 'e7000000-0000-4000-8000-0000000000b1', 'e7000000-0000-4000-8000-000000000001', 'r6', 'normal', 'rechazada', '2001-06-21 08:00-05', null, null, null),
  ('e7000000-0000-4000-8000-0000000000c7', gen_random_uuid(), 'e7000000-0000-4000-8000-0000000000f2', 'e7000000-0000-4000-8000-0000000000b1', 'e7000000-0000-4000-8000-000000000001', 'r7', 'normal', 'cerrada', '2001-05-30 08:00-05', 'e7000000-0000-4000-8000-0000000000e1', 'Solución', '2001-05-31'),
  ('e7000000-0000-4000-8000-0000000000c8', gen_random_uuid(), 'e7000000-0000-4000-8000-0000000000f2', 'e7000000-0000-4000-8000-0000000000b1', 'e7000000-0000-4000-8000-000000000001', 'r8', 'normal', 'cerrada', '2001-07-31 23:30-05', 'e7000000-0000-4000-8000-0000000000e1', 'Solución', '2001-07-31');

-- Quién puede pedirlos (CU-28 1a; decisión 19) -----------------------------------------

set local role authenticated;

set local request.jwt.claims = '{"sub": "e7000000-0000-4000-8000-000000000001", "role": "authenticated"}';
select throws_ok(
  $$ select public.rpt_escalamiento('2001-03-01', '2001-04-30') $$, 'P0001', 'SIN_PERMISO',
  'RF-28 / CU-28 1a: el reportante no ve el escalamiento'
);
select throws_ok(
  $$ select public.rpt_recurrencia('2001-06-01', '2001-07-31') $$, 'P0001', 'SIN_PERMISO',
  'RF-29 / CU-29 1a: el reportante no ve la recurrencia'
);

set local request.jwt.claims = '{"sub": "e7000000-0000-4000-8000-000000000002", "role": "authenticated"}';
select is(
  (
    select array_agg(distinct a.id order by a.id)
    from (
      select x ->> 'id' as id
      from jsonb_array_elements(public.rpt_escalamiento('2001-03-01', '2001-04-30') -> 'areas') x
      union all
      select x ->> 'area_id'
      from jsonb_array_elements(public.rpt_escalamiento('2001-03-01', '2001-04-30') -> 'novedades') x
    ) a
  ),
  array['e7000000-0000-4000-8000-0000000000b1'],
  'RF-28 (cambio 38): el aprobador ve el escalamiento solo de su área'
);
select lives_ok(
  $$ select public.rpt_recurrencia('2001-06-01', '2001-07-31') $$,
  'RF-29 (cambio 38): el aprobador ve la recurrencia (la RLS la limita a su área)'
);

set local request.jwt.claims = '{"sub": "e7000000-0000-4000-8000-000000000005", "role": "authenticated"}';
select throws_ok(
  $$ select public.rpt_recurrencia('2001-06-01', '2001-07-31') $$, 'P0001', 'SIN_PERMISO',
  'RNF-11: un director inactivo no ve los reportes'
);

select ok(
  not has_function_privilege('anon', 'public.rpt_escalamiento(date, date)', 'execute')
    and not has_function_privilege('anon', 'public.rpt_recurrencia(date, date)', 'execute'),
  'RNF-11: anon no ejecuta los reportes'
);

-- Escalamiento (RF-28 / CU-28) ---------------------------------------------------------

set local request.jwt.claims = '{"sub": "e7000000-0000-4000-8000-000000000003", "role": "authenticated"}';
do $$ begin perform set_config('prueba.escalas', public.rpt_escalamiento('2001-03-01', '2001-04-30')::text, true); end $$;

select is(
  current_setting('prueba.escalas')::jsonb - 'datos_al' - 'areas' - 'decisiones' - 'novedades',
  '{"desde": "2001-03-01", "hasta": "2001-04-30", "registradas": 6, "escaladas": 4}'::jsonb,
  'RF-28 / CU-28 2: registradas en el período y escaladas entre ellas; una escalada dos veces cuenta una'
);

select is(
  (current_setting('prueba.escalas')::jsonb ->> 'datos_al')::timestamptz,
  now(),
  'RF-28: «Datos al» es la hora de la consulta'
);

select is(
  (
    select jsonb_object_agg(a ->> 'id', a - 'id' - 'nombre')
    from jsonb_array_elements(current_setting('prueba.escalas')::jsonb -> 'areas') a
    where a ->> 'id' like 'e7000000%'
  ),
  '{"e7000000-0000-4000-8000-0000000000b1": {"registradas": 4, "escaladas": 3},
    "e7000000-0000-4000-8000-0000000000b2": {"registradas": 2, "escaladas": 1}}'::jsonb,
  'RF-28 / CU-28 2: por área, con el último día entero de Colombia'
);

select is(
  current_setting('prueba.escalas')::jsonb -> 'decisiones',
  '{"aprobadas": 1, "rechazadas": 2, "en_espera": 1}'::jsonb,
  'RF-28 / CU-28 3: las decisiones del director, según la última escalada'
);

select is(
  (
    select jsonb_agg(
      jsonb_build_object(
        'id', n ->> 'id',
        'justificacion', n ->> 'justificacion',
        'decision', n ->> 'decision',
        'horas', round(extract(epoch from (n ->> 'decidida_en')::timestamptz - (n ->> 'escalada_en')::timestamptz) / 3600)
      )
      order by ordinalidad
    )
    from jsonb_array_elements(current_setting('prueba.escalas')::jsonb -> 'novedades') with ordinality as x (n, ordinalidad)
  ),
  '[{"id": "e7000000-0000-4000-8000-0000000000d4", "justificacion": "J4b", "decision": "rechazada", "horas": 24},
    {"id": "e7000000-0000-4000-8000-0000000000d3", "justificacion": "J3", "decision": null, "horas": null},
    {"id": "e7000000-0000-4000-8000-0000000000d2", "justificacion": "J2", "decision": "rechazada", "horas": 24},
    {"id": "e7000000-0000-4000-8000-0000000000d1", "justificacion": "J1", "decision": "aprobada", "horas": 26}]'::jsonb,
  'RF-28: cada escalada con su última justificación, su decisión y cuándo, de la más reciente a la más antigua'
);

select is(
  (
    select array(
      select jsonb_object_keys(current_setting('prueba.escalas')::jsonb -> 'novedades' -> 0)
      order by 1
    )
  ),
  array['area', 'area_id', 'codigo', 'decidida_en', 'decision', 'escalada_en', 'finca', 'id', 'justificacion'],
  'RF-28: cada escalada trae lo que muestra 25'
);

select is(
  public.rpt_escalamiento('2001-09-01', '2001-09-30') - 'datos_al' - 'desde' - 'hasta',
  '{"registradas": 0, "escaladas": 0, "decisiones": {"aprobadas": 0, "rechazadas": 0, "en_espera": 0}, "novedades": []}'::jsonb
    || jsonb_build_object('areas', public.rpt_escalamiento('2001-09-01', '2001-09-30') -> 'areas'),
  'RF-28 / CU-28 2a: un período sin novedades responde en cero'
);

select throws_ok(
  $$ select public.rpt_escalamiento('2001-04-30', '2001-03-01') $$, 'P0001', 'FECHA_INVALIDA',
  'RF-28 (decisión 23): el período invertido es FECHA_INVALIDA'
);
select throws_ok(
  $$ select public.rpt_escalamiento(null, '2001-03-01') $$, 'P0001', 'FECHA_INVALIDA',
  'RF-28: sin fecha inicial, FECHA_INVALIDA'
);

-- Recurrencia (RF-29 / CU-29) ----------------------------------------------------------

do $$ begin perform set_config('prueba.recurrencia', public.rpt_recurrencia('2001-06-01', '2001-07-31')::text, true); end $$;

select is(
  current_setting('prueba.recurrencia')::jsonb - 'datos_al' - 'celdas',
  '{"desde": "2001-06-01", "hasta": "2001-07-31", "total": 5, "excluidas": 2}'::jsonb,
  'RF-29 / CU-29 2 y 2b: resueltas y cerradas registradas en el período, y aparte las que no tienen tipo'
);

select is(
  (current_setting('prueba.recurrencia')::jsonb ->> 'datos_al')::timestamptz,
  now(),
  'RF-29: «Datos al» es la hora de la consulta'
);

select is(
  (
    select jsonb_agg(c - 'finca' - 'tipo_falla' order by c ->> 'finca_id', c ->> 'tipo_falla_id')
    from jsonb_array_elements(current_setting('prueba.recurrencia')::jsonb -> 'celdas') c
  ),
  '[{"finca_id": "e7000000-0000-4000-8000-0000000000f2", "tipo_falla_id": "e7000000-0000-4000-8000-0000000000e1", "cantidad": 3},
    {"finca_id": "e7000000-0000-4000-8000-0000000000f2", "tipo_falla_id": "e7000000-0000-4000-8000-0000000000e2", "cantidad": 1},
    {"finca_id": "e7000000-0000-4000-8000-0000000000f3", "tipo_falla_id": "e7000000-0000-4000-8000-0000000000e1", "cantidad": 1}]'::jsonb,
  'RF-29 / CU-29 2: por finca y tipo, solo las que no son cero, con el último día entero de Colombia'
);

select is(
  (
    select c ->> 'finca' || ' · ' || (c ->> 'tipo_falla')
    from jsonb_array_elements(current_setting('prueba.recurrencia')::jsonb -> 'celdas') c
    where c ->> 'finca_id' = 'e7000000-0000-4000-8000-0000000000f3'
  ),
  'Finca pgTAP escalas 3 · Tipo pgTAP escalas 1',
  'RF-29: cada celda trae los nombres de la finca y del tipo'
);

select is(
  public.rpt_recurrencia('2001-09-01', '2001-09-30') - 'datos_al' - 'desde' - 'hasta',
  '{"total": 0, "excluidas": 0, "celdas": []}'::jsonb,
  'RF-29 / CU-29 2a: un período sin novedades responde en cero'
);

select throws_ok(
  $$ select public.rpt_recurrencia('2001-07-31', '2001-06-01') $$, 'P0001', 'FECHA_INVALIDA',
  'RF-29 (decisión 23): el período invertido es FECHA_INVALIDA'
);
select throws_ok(
  $$ select public.rpt_recurrencia('2001-06-01', null) $$, 'P0001', 'FECHA_INVALIDA',
  'RF-29: sin fecha final, FECHA_INVALIDA'
);

set local request.jwt.claims = '{"sub": "e7000000-0000-4000-8000-000000000004", "role": "authenticated"}';
select lives_ok(
  $$ select public.rpt_escalamiento('2001-03-01', '2001-04-30') $$,
  'RF-28: el administrador también ve el escalamiento'
);
select lives_ok(
  $$ select public.rpt_recurrencia('2001-06-01', '2001-07-31') $$,
  'RF-29: el administrador también ve la recurrencia'
);

select * from finish();
rollback;
