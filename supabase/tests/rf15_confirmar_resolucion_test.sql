-- RF-15 / CU-15 · confirmar_resolucion y reportar_falla_persiste (SDD 6.1.3, Tablas 29 y 30).
-- Se prueban a través del RPC, con el rol y el JWT de cada usuario. Los datos se crean dentro
-- de la transacción, en un área y unas fincas propias, y no dependen del seed. Los avisos se
-- cuentan solo entre los usuarios de la prueba: «staging» tiene sus propios aprobadores.
begin;

create extension if not exists pgtap with schema extensions;

select plan(72);

-- Datos de la prueba (como propietario) ------------------------------------------------

insert into public.razon_social (id, nombre)
values ('b5000000-0000-4000-8000-0000000000a1', 'RS pgTAP cierre');

-- f1, la finca de las novedades. f2, otra finca. f3, una finca que se desactivó después de
-- registrar su novedad.
insert into public.finca (id, razon_social_id, nombre, activo)
values
  ('b5000000-0000-4000-8000-0000000000f1', 'b5000000-0000-4000-8000-0000000000a1', 'Finca pgTAP cierre', true),
  ('b5000000-0000-4000-8000-0000000000f2', 'b5000000-0000-4000-8000-0000000000a1', 'Finca pgTAP cierre vecina', true),
  ('b5000000-0000-4000-8000-0000000000f3', 'b5000000-0000-4000-8000-0000000000a1', 'Finca pgTAP cierre desactivada', false);

insert into public.area (id, nombre)
values
  ('b5000000-0000-4000-8000-0000000000b1', 'Área pgTAP cierre'),
  ('b5000000-0000-4000-8000-0000000000b2', 'Área pgTAP cierre vecina');

insert into auth.users (instance_id, id, aud, role, email)
select '00000000-0000-0000-0000-000000000000', id, 'authenticated', 'authenticated', correo
from (
  values
    ('b5000000-0000-4000-8000-000000000001'::uuid, 'reportante@cierre.pgtap.test'),
    ('b5000000-0000-4000-8000-000000000002'::uuid, 'reportante.colega@cierre.pgtap.test'),
    ('b5000000-0000-4000-8000-000000000003'::uuid, 'reportante.vecino@cierre.pgtap.test'),
    ('b5000000-0000-4000-8000-000000000004'::uuid, 'reportante.inactivo@cierre.pgtap.test'),
    ('b5000000-0000-4000-8000-000000000005'::uuid, 'aprobador@cierre.pgtap.test'),
    ('b5000000-0000-4000-8000-000000000006'::uuid, 'aprobador.colega@cierre.pgtap.test'),
    ('b5000000-0000-4000-8000-000000000007'::uuid, 'aprobador.vecino@cierre.pgtap.test'),
    ('b5000000-0000-4000-8000-000000000008'::uuid, 'aprobador.inactivo@cierre.pgtap.test'),
    ('b5000000-0000-4000-8000-000000000009'::uuid, 'director@cierre.pgtap.test'),
    ('b5000000-0000-4000-8000-00000000000a'::uuid, 'administrador@cierre.pgtap.test'),
    ('b5000000-0000-4000-8000-00000000000b'::uuid, 'sin.perfil@cierre.pgtap.test'),
    ('b5000000-0000-4000-8000-00000000000c'::uuid, 'reportante.finca.desactivada@cierre.pgtap.test')
) as u (id, correo);

insert into public.usuario (id, nombre, correo, rol_id, finca_id, area_id, activo)
values
  ('b5000000-0000-4000-8000-000000000001', 'Reportante', 'reportante@cierre.pgtap.test', 1, 'b5000000-0000-4000-8000-0000000000f1', null, true),
  ('b5000000-0000-4000-8000-000000000002', 'Reportante colega', 'reportante.colega@cierre.pgtap.test', 1, 'b5000000-0000-4000-8000-0000000000f1', null, true),
  ('b5000000-0000-4000-8000-000000000003', 'Reportante vecino', 'reportante.vecino@cierre.pgtap.test', 1, 'b5000000-0000-4000-8000-0000000000f2', null, true),
  ('b5000000-0000-4000-8000-000000000004', 'Reportante inactivo', 'reportante.inactivo@cierre.pgtap.test', 1, 'b5000000-0000-4000-8000-0000000000f1', null, false),
  ('b5000000-0000-4000-8000-000000000005', 'Aprobador', 'aprobador@cierre.pgtap.test', 2, null, 'b5000000-0000-4000-8000-0000000000b1', true),
  ('b5000000-0000-4000-8000-000000000006', 'Aprobador colega', 'aprobador.colega@cierre.pgtap.test', 2, null, 'b5000000-0000-4000-8000-0000000000b1', true),
  ('b5000000-0000-4000-8000-000000000007', 'Aprobador vecino', 'aprobador.vecino@cierre.pgtap.test', 2, null, 'b5000000-0000-4000-8000-0000000000b2', true),
  ('b5000000-0000-4000-8000-000000000008', 'Aprobador inactivo', 'aprobador.inactivo@cierre.pgtap.test', 2, null, 'b5000000-0000-4000-8000-0000000000b1', false),
  ('b5000000-0000-4000-8000-000000000009', 'Director', 'director@cierre.pgtap.test', 3, null, null, true),
  ('b5000000-0000-4000-8000-00000000000a', 'Administrador', 'administrador@cierre.pgtap.test', 4, null, null, true),
  ('b5000000-0000-4000-8000-00000000000c', 'Reportante de la finca desactivada', 'reportante.finca.desactivada@cierre.pgtap.test', 1, 'b5000000-0000-4000-8000-0000000000f3', null, true);

insert into public.tipo_falla (id, nombre, nombre_normalizado, creado_por)
values ('b5000000-0000-4000-8000-0000000000c1', 'Tipo pgTAP cierre', 'tipo pgtap cierre', 'b5000000-0000-4000-8000-00000000000a');

-- Una novedad por caso. d1 a d8, resueltas: d1, d2 y d3 se confirman; d4 recibe los intentos
-- que deben fallar; d5, la falla simulada del historial; d6 y d8, «la falla persiste»; d7 es
-- de la finca desactivada. El resto, una en cada uno de los demás estados.
insert into public.novedad (
  id, id_local, finca_id, area_id, reportante_id, descripcion, prioridad, estado,
  fecha_registro, actualizado_en, tipo_falla_id, solucion, fecha_ejecucion
)
select
  ('b5000000-0000-4000-8000-0000000000d' || n.sufijo)::uuid,
  ('b5000000-0000-4000-8000-0000000000e' || n.sufijo)::uuid,
  case when n.sufijo = '7' then 'b5000000-0000-4000-8000-0000000000f3'::uuid
       else 'b5000000-0000-4000-8000-0000000000f1'::uuid end,
  'b5000000-0000-4000-8000-0000000000b1',
  case when n.sufijo = '7' then 'b5000000-0000-4000-8000-00000000000c'::uuid
       else 'b5000000-0000-4000-8000-000000000001'::uuid end,
  'Novedad pgTAP cierre ' || n.sufijo,
  'alto',
  n.estado::public.estado_novedad,
  '2026-09-01 08:00:00-05',
  '2026-09-01 08:00:00-05',
  case when n.estado in ('resuelta', 'cerrada') then 'b5000000-0000-4000-8000-0000000000c1'::uuid end,
  case when n.estado in ('resuelta', 'cerrada') then 'Solución de prueba' end,
  case when n.estado in ('resuelta', 'cerrada') then date '2026-09-02' end
from (
  values
    ('1', 'resuelta'), ('2', 'resuelta'), ('3', 'resuelta'), ('4', 'resuelta'),
    ('5', 'resuelta'), ('6', 'resuelta'), ('7', 'resuelta'), ('8', 'resuelta'),
    ('9', 'registrada'), ('a', 'asignada'), ('b', 'en_atencion'), ('c', 'escalada'),
    ('f', 'aprobada'), ('0', 'rechazada'), ('e', 'cerrada')
) as n (sufijo, estado);

-- Quién tomó d6: de aquí sale «Tomada por» en el detalle (SDD 6.1.3).
insert into public.historial_transicion (novedad_id, usuario_id, estado_anterior, estado_nuevo, fecha_hora)
values (
  'b5000000-0000-4000-8000-0000000000d6', 'b5000000-0000-4000-8000-000000000005',
  'asignada', 'en_atencion', '2026-09-01 09:00:00-05'
);

-- CU-15 · curso normal: confirmar el cierre ---------------------------------------------------

set local role authenticated;
set local request.jwt.claims = '{"sub": "b5000000-0000-4000-8000-000000000001", "role": "authenticated"}';

select lives_ok(
  $$ select public.confirmar_resolucion(
       'b5000000-0000-4000-8000-0000000000d1', '  Quedó funcionando bien.  '
     ) $$,
  'RF-15 / CU-15 3: el reportante confirma que la novedad quedó resuelta, con una observación'
);
select is(
  (select estado::text from public.novedad where id = 'b5000000-0000-4000-8000-0000000000d1'),
  'cerrada',
  'RF-15 / CU-15 4: la novedad queda cerrada'
);
select ok(
  (select actualizado_en > '2026-09-02'::timestamptz from public.novedad where id = 'b5000000-0000-4000-8000-0000000000d1'),
  'RF-16: actualizado_en refleja el cambio (lo mantiene el disparador)'
);
select results_eq(
  $$ select estado_anterior::text, estado_nuevo::text, usuario_id, observacion, area_anterior_id, area_nueva_id
     from public.historial_transicion
     where novedad_id = 'b5000000-0000-4000-8000-0000000000d1' $$,
  $$ values ('resuelta', 'cerrada', 'b5000000-0000-4000-8000-000000000001'::uuid,
             'Quedó funcionando bien.', null::uuid, null::uuid) $$,
  'RF-16 / CU-15 5: el historial registra resuelta → cerrada a nombre del reportante, con su observación sin espacios sobrantes'
);
select results_eq(
  $$ select solucion, fecha_ejecucion, tipo_falla_id
     from public.novedad where id = 'b5000000-0000-4000-8000-0000000000d1' $$,
  $$ values ('Solución de prueba', date '2026-09-02', 'b5000000-0000-4000-8000-0000000000c1'::uuid) $$,
  'RF-15: al cerrar conserva la solución, la fecha de ejecución y el tipo de falla'
);
select throws_ok(
  $$ select public.confirmar_resolucion('b5000000-0000-4000-8000-0000000000d1') $$,
  'P0001', 'TRANSICION_INVALIDA',
  'RF-15: una novedad cerrada es final: no se confirma dos veces'
);
select throws_ok(
  $$ select public.reportar_falla_persiste('b5000000-0000-4000-8000-0000000000d1', 'Volvió a fallar') $$,
  'P0001', 'TRANSICION_INVALIDA',
  'RF-15: ni se devuelve a atención después de cerrada'
);
select lives_ok(
  $$ select public.confirmar_resolucion('b5000000-0000-4000-8000-0000000000d3', E'   \n  ') $$,
  'RF-15 / CU-15 3: una observación de solo espacios se toma como vacía'
);
select is(
  (select observacion from public.historial_transicion where novedad_id = 'b5000000-0000-4000-8000-0000000000d3'),
  null,
  'RF-15: y queda nula en el historial'
);

-- CU-15 3a · la falla persiste ------------------------------------------------------------------

select lives_ok(
  $$ select public.reportar_falla_persiste(
       'b5000000-0000-4000-8000-0000000000d6', '  Sigue goteando la bomba.  '
     ) $$,
  'RF-15 / CU-15 3a: el reportante indica que la falla persiste, con su observación'
);
select results_eq(
  $$ select estado::text, solucion, fecha_ejecucion, tipo_falla_id
     from public.novedad where id = 'b5000000-0000-4000-8000-0000000000d6' $$,
  $$ values ('en_atencion', null::text, null::date, null::uuid) $$,
  'RF-15 / CU-15 3a: la novedad vuelve a estar en atención, ya sin la solución que no sirvió'
);
select results_eq(
  $$ select estado_anterior::text, estado_nuevo::text, usuario_id, observacion, area_anterior_id, area_nueva_id
     from public.historial_transicion
     where novedad_id = 'b5000000-0000-4000-8000-0000000000d6' and estado_anterior = 'resuelta' $$,
  $$ values ('resuelta', 'en_atencion', 'b5000000-0000-4000-8000-000000000001'::uuid,
             'Sigue goteando la bomba.', null::uuid, null::uuid) $$,
  'RF-16 / CU-15 3a: el historial registra resuelta → en atención a nombre del reportante, con su observación'
);
select is(
  (
    select usuario_id
    from public.historial_transicion
    where novedad_id = 'b5000000-0000-4000-8000-0000000000d6'
      and estado_anterior = 'asignada' and estado_nuevo = 'en_atencion'
    order by id desc
    limit 1
  ),
  'b5000000-0000-4000-8000-000000000005'::uuid,
  'SDD 6.1.3: la última vez que pasó de asignada a en atención sigue siendo la del aprobador («Tomada por»)'
);
select throws_ok(
  $$ select public.confirmar_resolucion('b5000000-0000-4000-8000-0000000000d6') $$,
  'P0001', 'TRANSICION_INVALIDA',
  'RF-15: de nuevo en atención, ya no se puede confirmar el cierre'
);

-- CU-15 3b · la observación es obligatoria cuando la falla persiste ----------------------------

select throws_ok(
  $$ select public.reportar_falla_persiste('b5000000-0000-4000-8000-0000000000d4', null) $$,
  'P0001', 'DATO_OBLIGATORIO',
  'RF-15 / CU-15 3b: «la falla persiste» sin observación → DATO_OBLIGATORIO'
);
select throws_ok(
  $$ select public.reportar_falla_persiste('b5000000-0000-4000-8000-0000000000d4', '') $$,
  'P0001', 'DATO_OBLIGATORIO',
  'RF-15 / CU-15 3b: con la observación vacía → DATO_OBLIGATORIO'
);
select throws_ok(
  $$ select public.reportar_falla_persiste('b5000000-0000-4000-8000-0000000000d4', E'  \n\t  ') $$,
  'P0001', 'DATO_OBLIGATORIO',
  'RF-15 / CU-15 3b: con solo espacios y saltos de línea → DATO_OBLIGATORIO'
);
select throws_ok(
  $$ select public.reportar_falla_persiste('b5000000-0000-4000-8000-0000000000d4', repeat('x', 501)) $$,
  'P0001', 'DATO_OBLIGATORIO',
  'RF-15: con más de 500 caracteres → DATO_OBLIGATORIO'
);
select throws_ok(
  $$ select public.confirmar_resolucion('b5000000-0000-4000-8000-0000000000d4', repeat('x', 501)) $$,
  'P0001', 'DATO_OBLIGATORIO',
  'RF-15: confirmar con una observación de más de 500 caracteres → DATO_OBLIGATORIO'
);

-- Estados que no admiten la acción (SDD, Tabla 29) ------------------------------------------

select throws_ok(
  format($f$ select public.confirmar_resolucion('b5000000-0000-4000-8000-0000000000d%s') $f$, n.sufijo),
  'P0001', 'TRANSICION_INVALIDA',
  format('RF-15: una novedad %s no se confirma', n.estado)
)
from (
  values
    ('9', 'registrada'), ('a', 'asignada'), ('b', 'en atención'), ('c', 'escalada'),
    ('f', 'aprobada'), ('0', 'rechazada'), ('e', 'cerrada')
) as n (sufijo, estado);

select throws_ok(
  format(
    $f$ select public.reportar_falla_persiste('b5000000-0000-4000-8000-0000000000d%s', 'Sigue fallando') $f$,
    n.sufijo
  ),
  'P0001', 'TRANSICION_INVALIDA',
  format('RF-15: una novedad %s no se devuelve a atención', n.estado)
)
from (
  values
    ('9', 'registrada'), ('a', 'asignada'), ('b', 'en atención'), ('c', 'escalada'),
    ('f', 'aprobada'), ('0', 'rechazada'), ('e', 'cerrada')
) as n (sufijo, estado);

select throws_ok(
  $$ select public.confirmar_resolucion('b5000000-0000-4000-8000-0000000000ee') $$,
  'P0001', 'SIN_PERMISO',
  'RNF-11: confirmar una novedad que no existe responde igual que una fuera del alcance'
);
select throws_ok(
  $$ select public.reportar_falla_persiste('b5000000-0000-4000-8000-0000000000ee', 'Sigue fallando') $$,
  'P0001', 'SIN_PERMISO',
  'RNF-11: y «la falla persiste», también'
);

-- Tabla 30 · cualquier reportante activo de la finca, no solo quien la registró -------------

reset role;
set local role authenticated;
set local request.jwt.claims = '{"sub": "b5000000-0000-4000-8000-000000000002", "role": "authenticated"}';

select results_eq(
  $$ select r.id, r.estado::text from public.confirmar_resolucion('b5000000-0000-4000-8000-0000000000d2') as r $$,
  $$ values ('b5000000-0000-4000-8000-0000000000d2'::uuid, 'cerrada') $$,
  'RF-15 / Tabla 30: otro reportante de la misma finca confirma, sin observación, y recibe la novedad cerrada'
);
select results_eq(
  $$ select usuario_id, observacion
     from public.historial_transicion where novedad_id = 'b5000000-0000-4000-8000-0000000000d2' $$,
  $$ values ('b5000000-0000-4000-8000-000000000002'::uuid, null::text) $$,
  'RF-16: el cierre queda a nombre de quien confirmó, sin observación'
);
select results_eq(
  $$ select r.id, r.estado::text, r.area_id
     from public.reportar_falla_persiste('b5000000-0000-4000-8000-0000000000d8', 'No prende.') as r $$,
  $$ values ('b5000000-0000-4000-8000-0000000000d8'::uuid, 'en_atencion', 'b5000000-0000-4000-8000-0000000000b1'::uuid) $$,
  'RF-15 / Tabla 30: y también puede indicar que la falla persiste; la novedad sigue en su área'
);

-- CU-04 3b · la finca se desactivó, pero la novedad sigue su curso ----------------------------

reset role;
set local role authenticated;
set local request.jwt.claims = '{"sub": "b5000000-0000-4000-8000-00000000000c", "role": "authenticated"}';

select lives_ok(
  $$ select public.confirmar_resolucion('b5000000-0000-4000-8000-0000000000d7') $$,
  'RF-15 / CU-04 3b: el reportante de una finca desactivada todavía puede confirmar el cierre'
);
select is(
  (select estado::text from public.novedad where id = 'b5000000-0000-4000-8000-0000000000d7'),
  'cerrada',
  'RF-15: y la novedad queda cerrada'
);

-- Alcance y roles: SIN_PERMISO -----------------------------------------------------------------

reset role;
set local role authenticated;
set local request.jwt.claims = '{"sub": "b5000000-0000-4000-8000-000000000003", "role": "authenticated"}';
select throws_ok(
  $$ select public.confirmar_resolucion('b5000000-0000-4000-8000-0000000000d4') $$,
  'P0001', 'SIN_PERMISO', 'RNF-11: el reportante de otra finca no confirma'
);
select throws_ok(
  $$ select public.reportar_falla_persiste('b5000000-0000-4000-8000-0000000000d4', 'Sigue fallando') $$,
  'P0001', 'SIN_PERMISO', 'RNF-11: ni indica que la falla persiste'
);

reset role;
set local role authenticated;
set local request.jwt.claims = '{"sub": "b5000000-0000-4000-8000-000000000004", "role": "authenticated"}';
select throws_ok(
  $$ select public.confirmar_resolucion('b5000000-0000-4000-8000-0000000000d4') $$,
  'P0001', 'SIN_PERMISO', 'RNF-11: un reportante desactivado de la misma finca no confirma'
);
select throws_ok(
  $$ select public.reportar_falla_persiste('b5000000-0000-4000-8000-0000000000d4', 'Sigue fallando') $$,
  'P0001', 'SIN_PERMISO', 'RNF-11: ni indica que la falla persiste'
);

reset role;
set local role authenticated;
set local request.jwt.claims = '{"sub": "b5000000-0000-4000-8000-000000000005", "role": "authenticated"}';
select throws_ok(
  $$ select public.confirmar_resolucion('b5000000-0000-4000-8000-0000000000d4') $$,
  'P0001', 'SIN_PERMISO', 'RNF-11: el aprobador que la resolvió no confirma su propia solución'
);
select throws_ok(
  $$ select public.reportar_falla_persiste('b5000000-0000-4000-8000-0000000000d4', 'Sigue fallando') $$,
  'P0001', 'SIN_PERMISO', 'RNF-11: ni la devuelve a atención por esta vía'
);

reset role;
set local role authenticated;
set local request.jwt.claims = '{"sub": "b5000000-0000-4000-8000-000000000009", "role": "authenticated"}';
select throws_ok(
  $$ select public.confirmar_resolucion('b5000000-0000-4000-8000-0000000000d4') $$,
  'P0001', 'SIN_PERMISO', 'RNF-11: el director no confirma el cierre'
);
select throws_ok(
  $$ select public.reportar_falla_persiste('b5000000-0000-4000-8000-0000000000d4', 'Sigue fallando') $$,
  'P0001', 'SIN_PERMISO', 'RNF-11: ni indica que la falla persiste'
);

reset role;
set local role authenticated;
set local request.jwt.claims = '{"sub": "b5000000-0000-4000-8000-00000000000a", "role": "authenticated"}';
select throws_ok(
  $$ select public.confirmar_resolucion('b5000000-0000-4000-8000-0000000000d4') $$,
  'P0001', 'SIN_PERMISO', 'RNF-11: el administrador no confirma el cierre'
);
select throws_ok(
  $$ select public.reportar_falla_persiste('b5000000-0000-4000-8000-0000000000d4', 'Sigue fallando') $$,
  'P0001', 'SIN_PERMISO', 'RNF-11: ni indica que la falla persiste'
);

reset role;
set local role authenticated;
set local request.jwt.claims = '{"sub": "b5000000-0000-4000-8000-00000000000b", "role": "authenticated"}';
select throws_ok(
  $$ select public.confirmar_resolucion('b5000000-0000-4000-8000-0000000000d4') $$,
  'P0001', 'SIN_PERMISO', 'RNF-11: una cuenta sin perfil no confirma'
);
select throws_ok(
  $$ select public.reportar_falla_persiste('b5000000-0000-4000-8000-0000000000d4', 'Sigue fallando') $$,
  'P0001', 'SIN_PERMISO', 'RNF-11: ni indica que la falla persiste'
);

reset role;
set local role anon;
set local request.jwt.claims = '{"role": "anon"}';
select throws_ok(
  $$ select public.confirmar_resolucion('b5000000-0000-4000-8000-0000000000d4') $$,
  '42501', null,
  'RNF-11: anon no puede ejecutar confirmar_resolucion'
);
select throws_ok(
  $$ select public.reportar_falla_persiste('b5000000-0000-4000-8000-0000000000d4', 'Sigue fallando') $$,
  '42501', null,
  'RNF-11: anon no puede ejecutar reportar_falla_persiste'
);

-- El ciclo completo: la falla persiste, el área la resuelve otra vez y la finca la cierra ------

reset role;
set local role authenticated;
set local request.jwt.claims = '{"sub": "b5000000-0000-4000-8000-000000000005", "role": "authenticated"}';

select lives_ok(
  $$ select public.registrar_solucion(
       'b5000000-0000-4000-8000-0000000000d6', 'Se cambió el sello de la bomba.',
       (now() at time zone 'America/Bogota')::date, 'b5000000-0000-4000-8000-0000000000c1'
     ) $$,
  'RF-14 / CU-14: después de «la falla persiste», el aprobador registra la solución otra vez'
);
select results_eq(
  $$ select estado_anterior::text, estado_nuevo::text, usuario_id, observacion
     from public.historial_transicion
     where novedad_id = 'b5000000-0000-4000-8000-0000000000d6' and estado_nuevo = 'resuelta' $$,
  $$ values ('en_atencion', 'resuelta', 'b5000000-0000-4000-8000-000000000005'::uuid,
             'Se cambió el sello de la bomba.') $$,
  'RF-16: la solución queda también en el historial, bajo su transición: si la falla vuelve a persistir, el texto no se pierde'
);

reset role;
set local role authenticated;
set local request.jwt.claims = '{"sub": "b5000000-0000-4000-8000-000000000001", "role": "authenticated"}';

select lives_ok(
  $$ select public.confirmar_resolucion('b5000000-0000-4000-8000-0000000000d6', 'Ahora sí quedó.') $$,
  'RF-15 / CU-15: y el reportante confirma el cierre de la segunda solución'
);
select results_eq(
  $$ select estado::text, solucion from public.novedad where id = 'b5000000-0000-4000-8000-0000000000d6' $$,
  $$ values ('cerrada', 'Se cambió el sello de la bomba.') $$,
  'RF-15: la novedad queda cerrada con la solución que sí sirvió'
);

-- Lo que quedó escrito (como propietario: nadie ve los avisos de otro) ------------------------

reset role;

select results_eq(
  $$ select estado_anterior::text, estado_nuevo::text
     from public.historial_transicion
     where novedad_id = 'b5000000-0000-4000-8000-0000000000d6'
     order by id $$,
  $$ values
       ('asignada', 'en_atencion'),
       ('resuelta', 'en_atencion'),
       ('en_atencion', 'resuelta'),
       ('resuelta', 'cerrada') $$,
  'RF-16: el historial guarda el ciclo completo, en orden'
);
select is(
  (select estado::text from public.novedad where id = 'b5000000-0000-4000-8000-0000000000d4'),
  'resuelta',
  'RF-15: los intentos sin permiso o sin datos no cambian el estado'
);
select is(
  (select count(*)::int from public.historial_transicion where novedad_id = 'b5000000-0000-4000-8000-0000000000d4'),
  0,
  'RF-16: ni dejan nada en el historial'
);
select is(
  (select count(*)::int from public.notificacion where novedad_id = 'b5000000-0000-4000-8000-0000000000d4'),
  0,
  'RF-30: ni envían avisos'
);
select results_eq(
  $$ select destinatario_id, estado_nuevo::text
     from public.notificacion
     where novedad_id = 'b5000000-0000-4000-8000-0000000000d1'
     order by destinatario_id $$,
  $$ values
       ('b5000000-0000-4000-8000-000000000005'::uuid, 'cerrada'),
       ('b5000000-0000-4000-8000-000000000006'::uuid, 'cerrada') $$,
  'RF-30 / CU-15 6: el cierre avisa a los aprobadores activos del área'
);
select results_eq(
  $$ select destinatario_id, estado_nuevo::text
     from public.notificacion
     where novedad_id = 'b5000000-0000-4000-8000-0000000000d8'
     order by destinatario_id $$,
  $$ values
       ('b5000000-0000-4000-8000-000000000005'::uuid, 'en_atencion'),
       ('b5000000-0000-4000-8000-000000000006'::uuid, 'en_atencion') $$,
  'RF-30 / CU-15 6: «la falla persiste» avisa a los mismos'
);
select is(
  (
    select count(*)::int
    from public.notificacion
    where novedad_id::text like 'b5000000-0000-4000-8000-0000000000d%'
      and estado_nuevo in ('cerrada', 'en_atencion')
      and destinatario_id not in (
        'b5000000-0000-4000-8000-000000000005', 'b5000000-0000-4000-8000-000000000006'
      )
  ),
  0,
  'RF-30: no avisa a los reportantes, al aprobador de otra área, al inactivo, al director ni al administrador'
);

-- CU-16 1a · si falla el historial, se revierte todo -----------------------------------------

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
set local request.jwt.claims = '{"sub": "b5000000-0000-4000-8000-000000000001", "role": "authenticated"}';

select throws_ok(
  $$ select public.confirmar_resolucion('b5000000-0000-4000-8000-0000000000d5', 'Quedó bien.') $$,
  'P0001', 'FALLA_SIMULADA_DEL_HISTORIAL',
  'RF-16 / CU-16 1a: si el registro del historial falla, confirmar_resolucion informa el error'
);
select throws_ok(
  $$ select public.reportar_falla_persiste('b5000000-0000-4000-8000-0000000000d5', 'Sigue fallando') $$,
  'P0001', 'FALLA_SIMULADA_DEL_HISTORIAL',
  'RF-16 / CU-16 1a: y reportar_falla_persiste, también'
);

reset role;

select results_eq(
  $$ select estado::text, solucion, fecha_ejecucion, tipo_falla_id
     from public.novedad where id = 'b5000000-0000-4000-8000-0000000000d5' $$,
  $$ values ('resuelta', 'Solución de prueba', date '2026-09-02', 'b5000000-0000-4000-8000-0000000000c1'::uuid) $$,
  'RF-16 / CU-16 1a: la novedad sigue resuelta y con su solución (se revierte todo)'
);
select is(
  (select count(*)::int from public.notificacion where novedad_id = 'b5000000-0000-4000-8000-0000000000d5'),
  0,
  'RF-16 / CU-16 1a: ni se envía ningún aviso'
);

-- El contrato sigue intacto -------------------------------------------------------------------

select ok(
  has_function_privilege('authenticated', 'public.confirmar_resolucion(uuid, text)', 'execute')
  and has_function_privilege('authenticated', 'public.reportar_falla_persiste(uuid, text)', 'execute'),
  'RF-15: authenticated conserva el permiso de ejecutar las dos funciones'
);
select ok(
  (
    select bool_and(p.prosecdef and p.proconfig @> array['search_path=""'])
    from pg_proc p
    where p.oid in (
      'public.confirmar_resolucion(uuid, text)'::regprocedure,
      'public.reportar_falla_persiste(uuid, text)'::regprocedure,
      'public.registrar_solucion(uuid, text, date, uuid, text)'::regprocedure
    )
  ),
  'RNF-11: las dos, y registrar_solucion, siguen siendo security definer con search_path vacío'
);
select ok(
  has_function_privilege('authenticated', 'public.registrar_solucion(uuid, text, date, uuid, text)', 'execute')
  and not has_function_privilege('anon', 'public.registrar_solucion(uuid, text, date, uuid, text)', 'execute'),
  'RNF-11: registrar_solucion conserva sus privilegios después de reemplazar su cuerpo'
);

select * from finish();
rollback;
