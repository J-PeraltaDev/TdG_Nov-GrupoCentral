-- RF-32 / CU-32 · renombrar_tipo_falla, fusionar_tipos_falla, desactivar_tipo_falla y
-- corregir_tipo_falla (SDD 6.1.8 y Tabla 21; plan del Sprint 5, decisiones 48 a 53). Con
-- tipos y novedades propios, creados dentro de la transacción: no toca los del seed.
begin;

create extension if not exists pgtap with schema extensions;

select plan(37);

-- Usuarios, área, finca y tipos (como propietario) -------------------------------------

insert into public.razon_social (id, nombre)
values ('e8000000-0000-4000-8000-0000000000a1', 'RS pgTAP tipos');

insert into public.area (id, nombre, activo)
values ('e8000000-0000-4000-8000-0000000000b1', 'Área pgTAP tipos', true);

insert into public.finca (id, razon_social_id, nombre, activo)
values ('e8000000-0000-4000-8000-0000000000f1', 'e8000000-0000-4000-8000-0000000000a1', 'Finca pgTAP tipos', true);

insert into auth.users (instance_id, id, aud, role, email)
select '00000000-0000-0000-0000-000000000000', id, 'authenticated', 'authenticated', correo
from (
  values
    ('e8000000-0000-4000-8000-000000000001'::uuid, 'reportante@tipos.pgtap.test'),
    ('e8000000-0000-4000-8000-000000000002'::uuid, 'aprobador@tipos.pgtap.test'),
    ('e8000000-0000-4000-8000-000000000003'::uuid, 'director@tipos.pgtap.test'),
    ('e8000000-0000-4000-8000-000000000004'::uuid, 'administrador@tipos.pgtap.test'),
    ('e8000000-0000-4000-8000-000000000005'::uuid, 'inactivo@tipos.pgtap.test')
) as u (id, correo);

insert into public.usuario (id, nombre, correo, rol_id, finca_id, area_id, activo)
values
  ('e8000000-0000-4000-8000-000000000001', 'Reportante', 'reportante@tipos.pgtap.test', 1, 'e8000000-0000-4000-8000-0000000000f1', null, true),
  ('e8000000-0000-4000-8000-000000000002', 'Aprobador', 'aprobador@tipos.pgtap.test', 2, null, 'e8000000-0000-4000-8000-0000000000b1', true),
  ('e8000000-0000-4000-8000-000000000003', 'Director', 'director@tipos.pgtap.test', 3, null, null, true),
  ('e8000000-0000-4000-8000-000000000004', 'Administrador', 'administrador@tipos.pgtap.test', 4, null, null, true),
  ('e8000000-0000-4000-8000-000000000005', 'Administrador inactivo', 'inactivo@tipos.pgtap.test', 4, null, null, false);

-- t1 y t2 para renombrar; t3 inactivo; t4 se fusiona en t5 y después t5 en t6; t7 se
-- desactiva.
insert into public.tipo_falla (id, nombre, nombre_normalizado, activo, creado_por)
values
  ('e8000000-0000-4000-8000-0000000000e1', 'Tipo pgTAP uno', 'tipo pgtap uno', true, 'e8000000-0000-4000-8000-000000000002'),
  ('e8000000-0000-4000-8000-0000000000e2', 'Tipo pgTAP dos', 'tipo pgtap dos', true, 'e8000000-0000-4000-8000-000000000002'),
  ('e8000000-0000-4000-8000-0000000000e3', 'Tipo pgTAP inactivo', 'tipo pgtap inactivo', false, 'e8000000-0000-4000-8000-000000000002'),
  ('e8000000-0000-4000-8000-0000000000e4', 'Tipo pgTAP origen', 'tipo pgtap origen', true, 'e8000000-0000-4000-8000-000000000002'),
  ('e8000000-0000-4000-8000-0000000000e5', 'Tipo pgTAP destino', 'tipo pgtap destino', true, 'e8000000-0000-4000-8000-000000000002'),
  ('e8000000-0000-4000-8000-0000000000e6', 'Tipo pgTAP cadena', 'tipo pgtap cadena', true, 'e8000000-0000-4000-8000-000000000002'),
  ('e8000000-0000-4000-8000-0000000000e7', 'Tipo pgTAP desactivar', 'tipo pgtap desactivar', true, 'e8000000-0000-4000-8000-000000000002');

-- n1 cerrada y n2 resuelta con el origen (en agosto de 2001, para rpt_recurrencia); n3 cerrada
-- y n4 resuelta con t1, para corregir; n5 en atención, sin tipo; n6 cerrada con t7.
insert into public.novedad (id, id_local, finca_id, area_id, reportante_id, descripcion, prioridad, estado, fecha_registro, tipo_falla_id, solucion, fecha_ejecucion)
values
  ('e8000000-0000-4000-8000-0000000000d1', gen_random_uuid(), 'e8000000-0000-4000-8000-0000000000f1', 'e8000000-0000-4000-8000-0000000000b1', 'e8000000-0000-4000-8000-000000000001', 'n1', 'normal', 'cerrada', '2001-08-05 08:00-05', 'e8000000-0000-4000-8000-0000000000e4', 'Solución', '2001-08-06'),
  ('e8000000-0000-4000-8000-0000000000d2', gen_random_uuid(), 'e8000000-0000-4000-8000-0000000000f1', 'e8000000-0000-4000-8000-0000000000b1', 'e8000000-0000-4000-8000-000000000001', 'n2', 'normal', 'resuelta', '2001-08-10 08:00-05', 'e8000000-0000-4000-8000-0000000000e4', 'Solución', '2001-08-11'),
  ('e8000000-0000-4000-8000-0000000000d3', gen_random_uuid(), 'e8000000-0000-4000-8000-0000000000f1', 'e8000000-0000-4000-8000-0000000000b1', 'e8000000-0000-4000-8000-000000000001', 'n3', 'normal', 'cerrada', '2001-08-12 08:00-05', 'e8000000-0000-4000-8000-0000000000e1', 'Solución', '2001-08-13'),
  ('e8000000-0000-4000-8000-0000000000d4', gen_random_uuid(), 'e8000000-0000-4000-8000-0000000000f1', 'e8000000-0000-4000-8000-0000000000b1', 'e8000000-0000-4000-8000-000000000001', 'n4', 'normal', 'resuelta', '2001-08-14 08:00-05', 'e8000000-0000-4000-8000-0000000000e1', 'Solución', '2001-08-15'),
  ('e8000000-0000-4000-8000-0000000000d5', gen_random_uuid(), 'e8000000-0000-4000-8000-0000000000f1', 'e8000000-0000-4000-8000-0000000000b1', 'e8000000-0000-4000-8000-000000000001', 'n5', 'normal', 'en_atencion', '2001-08-16 08:00-05', null, null, null),
  ('e8000000-0000-4000-8000-0000000000d6', gen_random_uuid(), 'e8000000-0000-4000-8000-0000000000f1', 'e8000000-0000-4000-8000-0000000000b1', 'e8000000-0000-4000-8000-000000000001', 'n6', 'normal', 'cerrada', '2001-08-18 08:00-05', 'e8000000-0000-4000-8000-0000000000e7', 'Solución', '2001-08-19');

-- Quién puede (decisión 48) ------------------------------------------------------------

set local role authenticated;

set local request.jwt.claims = '{"sub": "e8000000-0000-4000-8000-000000000002", "role": "authenticated"}';
select throws_ok(
  $$ select public.renombrar_tipo_falla('e8000000-0000-4000-8000-0000000000e1', 'Otro') $$,
  'P0001', 'SIN_PERMISO', 'RF-32: el aprobador no renombra tipos'
);
select throws_ok(
  $$ select public.fusionar_tipos_falla('e8000000-0000-4000-8000-0000000000e4', 'e8000000-0000-4000-8000-0000000000e5') $$,
  'P0001', 'SIN_PERMISO', 'RF-32: el aprobador no fusiona tipos'
);
select throws_ok(
  $$ select public.desactivar_tipo_falla('e8000000-0000-4000-8000-0000000000e7') $$,
  'P0001', 'SIN_PERMISO', 'RF-32: el aprobador no desactiva tipos'
);
select throws_ok(
  $$ select public.corregir_tipo_falla('e8000000-0000-4000-8000-0000000000d3', 'e8000000-0000-4000-8000-0000000000e2') $$,
  'P0001', 'SIN_PERMISO', 'RF-32 / CU-32 1a: el aprobador no corrige el tipo de una novedad'
);

set local request.jwt.claims = '{"sub": "e8000000-0000-4000-8000-000000000003", "role": "authenticated"}';
select throws_ok(
  $$ select public.corregir_tipo_falla('e8000000-0000-4000-8000-0000000000d3', 'e8000000-0000-4000-8000-0000000000e2') $$,
  'P0001', 'SIN_PERMISO', 'RF-32: el director no corrige el tipo de una novedad'
);

set local request.jwt.claims = '{"sub": "e8000000-0000-4000-8000-000000000005", "role": "authenticated"}';
select throws_ok(
  $$ select public.desactivar_tipo_falla('e8000000-0000-4000-8000-0000000000e7') $$,
  'P0001', 'SIN_PERMISO', 'RNF-11: un administrador inactivo no administra el catálogo'
);

select ok(
  not has_function_privilege('anon', 'public.renombrar_tipo_falla(uuid, text)', 'execute')
    and not has_function_privilege('anon', 'public.fusionar_tipos_falla(uuid, uuid)', 'execute')
    and not has_function_privilege('anon', 'public.desactivar_tipo_falla(uuid)', 'execute')
    and not has_function_privilege('anon', 'public.corregir_tipo_falla(uuid, uuid)', 'execute'),
  'RNF-11: anon no ejecuta las cuatro funciones'
);

-- Renombrar (CU-32 3 y 3a; decisión 49) -----------------------------------------------

set local request.jwt.claims = '{"sub": "e8000000-0000-4000-8000-000000000004", "role": "authenticated"}';

select is(
  (
    select row(r.nombre, r.nombre_normalizado, r.activo)::text
    from public.renombrar_tipo_falla('e8000000-0000-4000-8000-0000000000e1', '  Tipo   pgTAP Uno  renombrado ') r
  ),
  row('Tipo pgTAP Uno renombrado', 'tipo pgtap uno renombrado', true)::text,
  'RF-32 / CU-32 3: guarda el nombre como lo escribió, con los espacios arreglados, y lo normaliza'
);

select results_eq(
  $$
    select a.usuario_id, a.accion::text, a.valor_anterior, a.tipo_destino_id
    from public.auditoria_tipo_falla a
    where a.tipo_falla_id = 'e8000000-0000-4000-8000-0000000000e1'
  $$,
  $$ values ('e8000000-0000-4000-8000-000000000004'::uuid, 'renombrar', 'Tipo pgTAP uno', null::uuid) $$,
  'RF-32: el renombre queda auditado con el nombre anterior'
);

select is(
  (select r.nombre from public.renombrar_tipo_falla('e8000000-0000-4000-8000-0000000000e2', 'Tipo pgTAP Dós') r),
  'Tipo pgTAP Dós',
  'RF-32: el mismo tipo con otras mayúsculas o tildes sí se puede renombrar'
);

-- En otra sentencia: la consulta no ve lo que inserta una función que ella misma llama.
do $$ begin perform public.renombrar_tipo_falla('e8000000-0000-4000-8000-0000000000e2', 'Tipo pgTAP Dós'); end $$;

select is(
  (
    select count(*)::int from public.auditoria_tipo_falla a
    where a.tipo_falla_id = 'e8000000-0000-4000-8000-0000000000e2'
  ),
  1,
  'RF-32: renombrar con el mismo nombre no cambia nada ni deja otra auditoría'
);

select throws_ok(
  $$ select public.renombrar_tipo_falla('e8000000-0000-4000-8000-0000000000e2', 'TIPO PGTAP UNO RENOMBRADO') $$,
  'P0001', 'TIPO_FALLA_DUPLICADO',
  'RF-32 / CU-32 3a: el nombre de otro tipo activo es TIPO_FALLA_DUPLICADO'
);

select throws_ok(
  $$ select public.renombrar_tipo_falla('e8000000-0000-4000-8000-0000000000e2', 'tipo pgtap inactivo') $$,
  'P0001', 'TIPO_FALLA_DUPLICADO',
  'RF-32: el nombre de un tipo inactivo también está ocupado'
);

select throws_ok(
  $$ select public.renombrar_tipo_falla('e8000000-0000-4000-8000-0000000000e3', 'Tipo pgTAP reactivado') $$,
  'P0001', 'TIPO_FALLA_INVALIDO',
  'RF-32: un tipo inactivo no se renombra (decisión 51)'
);

select throws_ok(
  $$ select public.renombrar_tipo_falla(gen_random_uuid(), 'Tipo pgTAP fantasma') $$,
  'P0001', 'TIPO_FALLA_INVALIDO',
  'RF-32: un tipo que no existe es TIPO_FALLA_INVALIDO'
);

select throws_ok(
  $$ select public.renombrar_tipo_falla('e8000000-0000-4000-8000-0000000000e2', '   ') $$,
  'P0001', 'DATO_OBLIGATORIO',
  'RF-32: el nombre nuevo es obligatorio'
);

-- Fusionar (CU-32 4 y 4a; decisión 50) ------------------------------------------------

select is(
  (
    select public.fusionar_tipos_falla(
      'e8000000-0000-4000-8000-0000000000e4', 'e8000000-0000-4000-8000-0000000000e5'
    )
  ).id,
  'e8000000-0000-4000-8000-0000000000e5'::uuid,
  'RF-32 / CU-32 4: la fusión devuelve el tipo de destino'
);

select set_eq(
  $$
    select n.id from public.novedad n
    where n.tipo_falla_id = 'e8000000-0000-4000-8000-0000000000e5'
  $$,
  $$ values ('e8000000-0000-4000-8000-0000000000d1'::uuid), ('e8000000-0000-4000-8000-0000000000d2'::uuid) $$,
  'RF-32 / CU-32 4: todas las novedades del origen pasan al destino, también la cerrada'
);

select is(
  (select t.activo from public.tipo_falla t where t.id = 'e8000000-0000-4000-8000-0000000000e4'),
  false,
  'RF-32 / CU-32 4: el origen queda desactivado'
);

select results_eq(
  $$
    select a.usuario_id, a.accion::text, a.valor_anterior, a.tipo_destino_id
    from public.auditoria_tipo_falla a
    where a.tipo_falla_id = 'e8000000-0000-4000-8000-0000000000e4'
  $$,
  $$
    values (
      'e8000000-0000-4000-8000-000000000004'::uuid, 'fusionar', 'Tipo pgTAP origen',
      'e8000000-0000-4000-8000-0000000000e5'::uuid
    )
  $$,
  'RF-32: la fusión queda auditada con el origen, el destino y el nombre del origen'
);

select is(
  (
    select jsonb_agg(c - 'finca_id' - 'finca' order by c ->> 'tipo_falla_id')
    from jsonb_array_elements(public.rpt_recurrencia('2001-08-01', '2001-08-31') -> 'celdas') c
    where c ->> 'finca_id' = 'e8000000-0000-4000-8000-0000000000f1'
  ),
  '[
    {"tipo_falla_id": "e8000000-0000-4000-8000-0000000000e1", "tipo_falla": "Tipo pgTAP Uno renombrado", "cantidad": 2},
    {"tipo_falla_id": "e8000000-0000-4000-8000-0000000000e5", "tipo_falla": "Tipo pgTAP destino", "cantidad": 2},
    {"tipo_falla_id": "e8000000-0000-4000-8000-0000000000e7", "tipo_falla": "Tipo pgTAP desactivar", "cantidad": 1}
  ]'::jsonb,
  'RF-29 / RF-32: la matriz de fallas recurrentes refleja la fusión en la misma transacción'
);

select throws_ok(
  $$ select public.fusionar_tipos_falla('e8000000-0000-4000-8000-0000000000e5', 'e8000000-0000-4000-8000-0000000000e5') $$,
  'P0001', 'TIPO_FALLA_INVALIDO',
  'RF-32 / CU-32 4a: un tipo no se fusiona consigo mismo'
);

select throws_ok(
  $$ select public.fusionar_tipos_falla('e8000000-0000-4000-8000-0000000000e1', 'e8000000-0000-4000-8000-0000000000e3') $$,
  'P0001', 'TIPO_FALLA_INVALIDO',
  'RF-32: no se fusiona en un tipo inactivo'
);

select throws_ok(
  $$ select public.fusionar_tipos_falla('e8000000-0000-4000-8000-0000000000e4', 'e8000000-0000-4000-8000-0000000000e1') $$,
  'P0001', 'TIPO_FALLA_INVALIDO',
  'RF-32: un tipo ya fusionado no se vuelve a fusionar'
);

-- registrar_solucion con el nombre del origen usa el destino (CU-14 5a; cambio 9).
set local request.jwt.claims = '{"sub": "e8000000-0000-4000-8000-000000000002", "role": "authenticated"}';
select is(
  (
    select public.registrar_solucion(
      'e8000000-0000-4000-8000-0000000000d5', 'Solución pgTAP', '2001-08-17', null, 'tipo pgtap ORIGEN'
    )
  ).tipo_falla_id,
  'e8000000-0000-4000-8000-0000000000e5'::uuid,
  'RF-14 / CU-14 5a: una solución con el nombre del tipo fusionado queda con el destino'
);

-- Cadenas: después de A → B, B → C deja todo en C.
set local request.jwt.claims = '{"sub": "e8000000-0000-4000-8000-000000000004", "role": "authenticated"}';
do $$ begin perform public.fusionar_tipos_falla('e8000000-0000-4000-8000-0000000000e5', 'e8000000-0000-4000-8000-0000000000e6'); end $$;

select set_eq(
  $$
    select n.id from public.novedad n
    where n.tipo_falla_id = 'e8000000-0000-4000-8000-0000000000e6'
  $$,
  $$
    values
      ('e8000000-0000-4000-8000-0000000000d1'::uuid),
      ('e8000000-0000-4000-8000-0000000000d2'::uuid),
      ('e8000000-0000-4000-8000-0000000000d5'::uuid)
  $$,
  'RF-32: una fusión en cadena (A → B y luego B → C) deja todas las novedades en C'
);

-- Desactivar (decisión 52) -------------------------------------------------------------

select is(
  (select public.desactivar_tipo_falla('e8000000-0000-4000-8000-0000000000e7')).activo,
  false,
  'RF-32: desactivar deja el tipo inactivo'
);

select is_empty(
  $$ select s.id from public.sugerir_tipos_falla('pgtap desactivar') s $$,
  'RF-32 / RF-14: el tipo desactivado sale de las sugerencias'
);

select is(
  (select n.tipo_falla_id from public.novedad n where n.id = 'e8000000-0000-4000-8000-0000000000d6'),
  'e8000000-0000-4000-8000-0000000000e7'::uuid,
  'RF-32: sus novedades conservan el tipo desactivado'
);

select results_eq(
  $$
    select a.usuario_id, a.accion::text, a.valor_anterior, a.tipo_destino_id
    from public.auditoria_tipo_falla a
    where a.tipo_falla_id = 'e8000000-0000-4000-8000-0000000000e7'
  $$,
  $$ values ('e8000000-0000-4000-8000-000000000004'::uuid, 'desactivar', 'Tipo pgTAP desactivar', null::uuid) $$,
  'RF-32: la desactivación queda auditada con el nombre del tipo'
);

select throws_ok(
  $$ select public.desactivar_tipo_falla('e8000000-0000-4000-8000-0000000000e7') $$,
  'P0001', 'TIPO_FALLA_INVALIDO',
  'RF-32: un tipo inactivo no se vuelve a desactivar'
);

-- Corregir el tipo de una novedad cerrada (CU-32 1a; decisión 53) ---------------------

select throws_ok(
  $$ select public.corregir_tipo_falla('e8000000-0000-4000-8000-0000000000d4', 'e8000000-0000-4000-8000-0000000000e2') $$,
  'P0001', 'TRANSICION_INVALIDA',
  'RF-32 / CU-32 1a: solo se corrige el tipo de una novedad cerrada'
);

select throws_ok(
  $$ select public.corregir_tipo_falla('e8000000-0000-4000-8000-0000000000d3', 'e8000000-0000-4000-8000-0000000000e3') $$,
  'P0001', 'TIPO_FALLA_INVALIDO',
  'RF-32: no se corrige con un tipo inactivo'
);

select throws_ok(
  $$ select public.corregir_tipo_falla('e8000000-0000-4000-8000-0000000000d3', 'e8000000-0000-4000-8000-0000000000e1') $$,
  'P0001', 'TIPO_FALLA_INVALIDO',
  'RF-32: no se «corrige» con el mismo tipo'
);

select is(
  (
    select row(r.tipo_falla_id, r.estado)::text
    from public.corregir_tipo_falla(
      'e8000000-0000-4000-8000-0000000000d3', 'e8000000-0000-4000-8000-0000000000e2'
    ) r
  ),
  row('e8000000-0000-4000-8000-0000000000e2'::uuid, 'cerrada'::public.estado_novedad)::text,
  'RF-32 / CU-32 1a: la novedad queda con el tipo correcto y sigue cerrada'
);

select results_eq(
  $$
    select h.usuario_id, h.estado_anterior::text, h.estado_nuevo::text, h.observacion
    from public.historial_transicion h
    where h.novedad_id = 'e8000000-0000-4000-8000-0000000000d3'
  $$,
  $$
    values (
      'e8000000-0000-4000-8000-000000000004'::uuid, 'cerrada', 'cerrada',
      '"Tipo pgTAP Uno renombrado" → "Tipo pgTAP Dós"'
    )
  $$,
  'RF-16 / RF-32: la corrección queda en el historial como cerrada → cerrada, con los dos nombres'
);

reset role;

select is(
  (select count(*)::int from public.notificacion n where n.novedad_id = 'e8000000-0000-4000-8000-0000000000d3'),
  0,
  'RF-32: la corrección no avisa a nadie (Tabla 30)'
);

select * from finish();

rollback;
