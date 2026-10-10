-- RF-12 / CU-12 · escalar_novedad (SDD 6.1.3, Tablas 29 y 30).
-- Se prueba a través del RPC, con el rol y el JWT de cada usuario. Los datos se crean dentro
-- de la transacción, en un área propia, y no dependen del seed. Los avisos se cuentan solo
-- entre los usuarios de la prueba: «staging» tiene sus propios directores.
begin;

create extension if not exists pgtap with schema extensions;

select plan(47);

-- Datos de la prueba (como propietario) ------------------------------------------------

insert into public.razon_social (id, nombre)
values ('a3000000-0000-4000-8000-0000000000a1', 'RS pgTAP escalar');

insert into public.finca (id, razon_social_id, nombre)
values
  ('a3000000-0000-4000-8000-0000000000f1', 'a3000000-0000-4000-8000-0000000000a1', 'Finca pgTAP escalar A'),
  ('a3000000-0000-4000-8000-0000000000f2', 'a3000000-0000-4000-8000-0000000000a1', 'Finca pgTAP escalar B');

insert into public.area (id, nombre)
values
  ('a3000000-0000-4000-8000-0000000000b1', 'Área pgTAP escalar'),
  ('a3000000-0000-4000-8000-0000000000b2', 'Área pgTAP escalar vecina');

insert into auth.users (instance_id, id, aud, role, email)
select '00000000-0000-0000-0000-000000000000', id, 'authenticated', 'authenticated', correo
from (
  values
    ('a3000000-0000-4000-8000-000000000001'::uuid, 'reportante@escalar.pgtap.test'),
    ('a3000000-0000-4000-8000-000000000002'::uuid, 'aprobador@escalar.pgtap.test'),
    ('a3000000-0000-4000-8000-000000000003'::uuid, 'aprobador.colega@escalar.pgtap.test'),
    ('a3000000-0000-4000-8000-000000000004'::uuid, 'aprobador.vecino@escalar.pgtap.test'),
    ('a3000000-0000-4000-8000-000000000005'::uuid, 'aprobador.inactivo@escalar.pgtap.test'),
    ('a3000000-0000-4000-8000-000000000006'::uuid, 'director@escalar.pgtap.test'),
    ('a3000000-0000-4000-8000-000000000007'::uuid, 'administrador@escalar.pgtap.test'),
    ('a3000000-0000-4000-8000-000000000008'::uuid, 'sin.perfil@escalar.pgtap.test'),
    ('a3000000-0000-4000-8000-000000000009'::uuid, 'reportante.inactivo@escalar.pgtap.test'),
    ('a3000000-0000-4000-8000-00000000000a'::uuid, 'director.dos@escalar.pgtap.test'),
    ('a3000000-0000-4000-8000-00000000000b'::uuid, 'director.inactivo@escalar.pgtap.test')
) as u (id, correo);

insert into public.usuario (id, nombre, correo, rol_id, finca_id, area_id, activo)
values
  ('a3000000-0000-4000-8000-000000000001', 'Reportante', 'reportante@escalar.pgtap.test', 1, 'a3000000-0000-4000-8000-0000000000f1', null, true),
  ('a3000000-0000-4000-8000-000000000002', 'Aprobador', 'aprobador@escalar.pgtap.test', 2, null, 'a3000000-0000-4000-8000-0000000000b1', true),
  ('a3000000-0000-4000-8000-000000000003', 'Aprobador colega', 'aprobador.colega@escalar.pgtap.test', 2, null, 'a3000000-0000-4000-8000-0000000000b1', true),
  ('a3000000-0000-4000-8000-000000000004', 'Aprobador vecino', 'aprobador.vecino@escalar.pgtap.test', 2, null, 'a3000000-0000-4000-8000-0000000000b2', true),
  ('a3000000-0000-4000-8000-000000000005', 'Aprobador inactivo', 'aprobador.inactivo@escalar.pgtap.test', 2, null, 'a3000000-0000-4000-8000-0000000000b1', false),
  ('a3000000-0000-4000-8000-000000000006', 'Director', 'director@escalar.pgtap.test', 3, null, null, true),
  ('a3000000-0000-4000-8000-000000000007', 'Administrador', 'administrador@escalar.pgtap.test', 4, null, null, true),
  ('a3000000-0000-4000-8000-000000000009', 'Reportante inactivo', 'reportante.inactivo@escalar.pgtap.test', 1, 'a3000000-0000-4000-8000-0000000000f2', null, false),
  ('a3000000-0000-4000-8000-00000000000a', 'Director dos', 'director.dos@escalar.pgtap.test', 3, null, null, true),
  ('a3000000-0000-4000-8000-00000000000b', 'Director inactivo', 'director.inactivo@escalar.pgtap.test', 3, null, null, false);

insert into public.tipo_falla (id, nombre, nombre_normalizado, creado_por)
values ('a3000000-0000-4000-8000-0000000000c1', 'Tipo pgTAP escalar', 'tipo pgtap escalar', 'a3000000-0000-4000-8000-000000000007');

-- Una novedad por caso. d1, d2, d3, d4 y d8, en atención en el área. d5, en atención en el
-- área vecina. d6, de un reportante ya desactivado. d0, asignada: todavía nadie la tomó. El
-- resto, una en cada uno de los demás estados.
insert into public.novedad (
  id, id_local, finca_id, area_id, reportante_id, descripcion, prioridad, estado,
  fecha_registro, actualizado_en, tipo_falla_id, solucion, fecha_ejecucion
)
select
  ('a3000000-0000-4000-8000-0000000000d' || n.sufijo)::uuid,
  ('a3000000-0000-4000-8000-0000000000e' || n.sufijo)::uuid,
  n.finca::uuid,
  n.area::uuid,
  n.reportante::uuid,
  'Novedad pgTAP escalar ' || n.sufijo,
  'alto',
  n.estado::public.estado_novedad,
  '2026-09-01 08:00:00-05',
  '2026-09-01 08:00:00-05',
  case when n.estado in ('resuelta', 'cerrada') then 'a3000000-0000-4000-8000-0000000000c1'::uuid end,
  case when n.estado in ('resuelta', 'cerrada') then 'Solución de prueba' end,
  case when n.estado in ('resuelta', 'cerrada') then date '2026-09-02' end
from (
  values
    ('0', 'asignada', 'a3000000-0000-4000-8000-0000000000f1', 'a3000000-0000-4000-8000-0000000000b1', 'a3000000-0000-4000-8000-000000000001'),
    ('1', 'en_atencion', 'a3000000-0000-4000-8000-0000000000f1', 'a3000000-0000-4000-8000-0000000000b1', 'a3000000-0000-4000-8000-000000000001'),
    ('2', 'en_atencion', 'a3000000-0000-4000-8000-0000000000f1', 'a3000000-0000-4000-8000-0000000000b1', 'a3000000-0000-4000-8000-000000000001'),
    ('3', 'en_atencion', 'a3000000-0000-4000-8000-0000000000f1', 'a3000000-0000-4000-8000-0000000000b1', 'a3000000-0000-4000-8000-000000000001'),
    ('4', 'en_atencion', 'a3000000-0000-4000-8000-0000000000f1', 'a3000000-0000-4000-8000-0000000000b1', 'a3000000-0000-4000-8000-000000000001'),
    ('5', 'en_atencion', 'a3000000-0000-4000-8000-0000000000f1', 'a3000000-0000-4000-8000-0000000000b2', 'a3000000-0000-4000-8000-000000000001'),
    ('6', 'en_atencion', 'a3000000-0000-4000-8000-0000000000f2', 'a3000000-0000-4000-8000-0000000000b1', 'a3000000-0000-4000-8000-000000000009'),
    ('7', 'registrada', 'a3000000-0000-4000-8000-0000000000f1', 'a3000000-0000-4000-8000-0000000000b1', 'a3000000-0000-4000-8000-000000000001'),
    ('8', 'en_atencion', 'a3000000-0000-4000-8000-0000000000f1', 'a3000000-0000-4000-8000-0000000000b1', 'a3000000-0000-4000-8000-000000000001'),
    ('9', 'escalada', 'a3000000-0000-4000-8000-0000000000f1', 'a3000000-0000-4000-8000-0000000000b1', 'a3000000-0000-4000-8000-000000000001'),
    ('a', 'aprobada', 'a3000000-0000-4000-8000-0000000000f1', 'a3000000-0000-4000-8000-0000000000b1', 'a3000000-0000-4000-8000-000000000001'),
    ('b', 'resuelta', 'a3000000-0000-4000-8000-0000000000f1', 'a3000000-0000-4000-8000-0000000000b1', 'a3000000-0000-4000-8000-000000000001'),
    ('c', 'rechazada', 'a3000000-0000-4000-8000-0000000000f1', 'a3000000-0000-4000-8000-0000000000b1', 'a3000000-0000-4000-8000-000000000001'),
    ('f', 'cerrada', 'a3000000-0000-4000-8000-0000000000f1', 'a3000000-0000-4000-8000-0000000000b1', 'a3000000-0000-4000-8000-000000000001')
) as n (sufijo, estado, finca, area, reportante);

-- CU-12 · curso normal ---------------------------------------------------------------------

set local role authenticated;
set local request.jwt.claims = '{"sub": "a3000000-0000-4000-8000-000000000002", "role": "authenticated"}';

select lives_ok(
  $$ select public.escalar_novedad(
       'a3000000-0000-4000-8000-0000000000d1',
       '  El router se quemó. Hay que comprar uno nuevo; costo aproximado $380.000.  '
     ) $$,
  'RF-12 / CU-12 3: el aprobador escala una novedad en atención de su área con una justificación'
);
select is(
  (select estado::text from public.novedad where id = 'a3000000-0000-4000-8000-0000000000d1'),
  'escalada',
  'RF-12 / CU-12 4: la novedad queda escalada'
);
select ok(
  (select actualizado_en > '2026-09-02'::timestamptz from public.novedad where id = 'a3000000-0000-4000-8000-0000000000d1'),
  'RF-16: actualizado_en refleja el cambio (lo mantiene el disparador)'
);
select results_eq(
  $$ select estado_anterior::text, estado_nuevo::text, usuario_id, observacion, area_anterior_id, area_nueva_id
     from public.historial_transicion
     where novedad_id = 'a3000000-0000-4000-8000-0000000000d1' $$,
  $$ values ('en_atencion', 'escalada', 'a3000000-0000-4000-8000-000000000002'::uuid,
             'El router se quemó. Hay que comprar uno nuevo; costo aproximado $380.000.', null::uuid, null::uuid) $$,
  'RF-16 / CU-12 5: el historial registra en atención → escalada con la justificación, sin espacios sobrantes'
);
select results_eq(
  $$ select r.id, r.estado::text, r.area_id
     from public.escalar_novedad('a3000000-0000-4000-8000-0000000000d2', 'Hay que contratar la obra.') as r $$,
  $$ values ('a3000000-0000-4000-8000-0000000000d2'::uuid, 'escalada', 'a3000000-0000-4000-8000-0000000000b1'::uuid) $$,
  'RF-12: devuelve la novedad actualizada, que sigue en el área'
);
select lives_ok(
  $$ select public.escalar_novedad('a3000000-0000-4000-8000-0000000000d6', 'Hay que comprar el repuesto.') $$,
  'RF-12: escala la novedad de un reportante que ya fue desactivado'
);

-- Una novedad escalada ya no se escala otra vez -----------------------------------------------

select throws_ok(
  $$ select public.escalar_novedad('a3000000-0000-4000-8000-0000000000d1', 'Otra vez') $$,
  'P0001', 'TRANSICION_INVALIDA',
  'RF-12: escalarla por segunda vez → TRANSICION_INVALIDA'
);

reset role;
set local role authenticated;
set local request.jwt.claims = '{"sub": "a3000000-0000-4000-8000-000000000003", "role": "authenticated"}';

select throws_ok(
  $$ select public.escalar_novedad('a3000000-0000-4000-8000-0000000000d1', 'Otra vez') $$,
  'P0001', 'TRANSICION_INVALIDA',
  'RF-12: si otro aprobador del área ya la escaló, el segundo recibe TRANSICION_INVALIDA'
);

-- CU-12 3a · la justificación es obligatoria -------------------------------------------------

select throws_ok(
  $$ select public.escalar_novedad('a3000000-0000-4000-8000-0000000000d8', null) $$,
  'P0001', 'DATO_OBLIGATORIO',
  'RF-12 / CU-12 3a: sin justificación → DATO_OBLIGATORIO'
);
select throws_ok(
  $$ select public.escalar_novedad('a3000000-0000-4000-8000-0000000000d8', '') $$,
  'P0001', 'DATO_OBLIGATORIO',
  'RF-12 / CU-12 3a: justificación vacía → DATO_OBLIGATORIO'
);
select throws_ok(
  $$ select public.escalar_novedad('a3000000-0000-4000-8000-0000000000d8', '     ') $$,
  'P0001', 'DATO_OBLIGATORIO',
  'RF-12 / CU-12 3a: justificación de solo espacios → DATO_OBLIGATORIO'
);
select throws_ok(
  $$ select public.escalar_novedad('a3000000-0000-4000-8000-0000000000d8', E' \n\t\r ') $$,
  'P0001', 'DATO_OBLIGATORIO',
  'RF-12 / CU-12 3a: justificación de solo saltos de línea y tabulaciones → DATO_OBLIGATORIO'
);
select throws_ok(
  $$ select public.escalar_novedad('a3000000-0000-4000-8000-0000000000d8', repeat('a', 501)) $$,
  'P0001', 'DATO_OBLIGATORIO',
  'RF-12: justificación de más de 500 caracteres → DATO_OBLIGATORIO'
);
select is(
  (select estado::text from public.novedad where id = 'a3000000-0000-4000-8000-0000000000d8'),
  'en_atencion',
  'RF-12 / CU-12 3a: sin una justificación válida la novedad no cambia de estado'
);
select lives_ok(
  $$ select public.escalar_novedad('a3000000-0000-4000-8000-0000000000d8', repeat('a', 500)) $$,
  'RF-12: una justificación de 500 caracteres sí se acepta (y la escala otro aprobador del área)'
);

-- Estados que no admiten la acción (SDD, Tabla 29) ------------------------------------------

select throws_ok(
  $$ select public.escalar_novedad('a3000000-0000-4000-8000-0000000000d0', 'Hay que comprar el repuesto.') $$,
  'P0001', 'TRANSICION_INVALIDA',
  'RF-12: desde asignada no se puede escalar (primero hay que tomarla) → TRANSICION_INVALIDA'
);
select throws_ok(
  $$ select public.escalar_novedad('a3000000-0000-4000-8000-0000000000d7', 'Hay que comprar el repuesto.') $$,
  'P0001', 'TRANSICION_INVALIDA', 'RF-12: registrada → TRANSICION_INVALIDA'
);
select throws_ok(
  $$ select public.escalar_novedad('a3000000-0000-4000-8000-0000000000d9', 'Hay que comprar el repuesto.') $$,
  'P0001', 'TRANSICION_INVALIDA', 'RF-12: escalada → TRANSICION_INVALIDA'
);
select throws_ok(
  $$ select public.escalar_novedad('a3000000-0000-4000-8000-0000000000da', 'Hay que comprar el repuesto.') $$,
  'P0001', 'TRANSICION_INVALIDA', 'RF-12: aprobada → TRANSICION_INVALIDA'
);
select throws_ok(
  $$ select public.escalar_novedad('a3000000-0000-4000-8000-0000000000db', 'Hay que comprar el repuesto.') $$,
  'P0001', 'TRANSICION_INVALIDA', 'RF-12: resuelta → TRANSICION_INVALIDA'
);
select throws_ok(
  $$ select public.escalar_novedad('a3000000-0000-4000-8000-0000000000dc', 'Hay que comprar el repuesto.') $$,
  'P0001', 'TRANSICION_INVALIDA', 'RF-12: rechazada (final) → TRANSICION_INVALIDA'
);
select throws_ok(
  $$ select public.escalar_novedad('a3000000-0000-4000-8000-0000000000df', 'Hay que comprar el repuesto.') $$,
  'P0001', 'TRANSICION_INVALIDA', 'RF-12: cerrada (final) → TRANSICION_INVALIDA'
);
select throws_ok(
  $$ select public.escalar_novedad('a3000000-0000-4000-8000-0000000000d0', null) $$,
  'P0001', 'TRANSICION_INVALIDA',
  'SDD 6.1.3: el estado se comprueba antes que los datos (asignada y sin justificación → TRANSICION_INVALIDA)'
);

-- Alcance y roles: SIN_PERMISO --------------------------------------------------------------

select throws_ok(
  $$ select public.escalar_novedad('a3000000-0000-4000-8000-0000000000d5', 'Hay que comprar el repuesto.') $$,
  'P0001', 'SIN_PERMISO',
  'RNF-11: la novedad de otra área → SIN_PERMISO'
);
select throws_ok(
  $$ select public.escalar_novedad('a3000000-0000-4000-8000-0000000000ff', 'Hay que comprar el repuesto.') $$,
  'P0001', 'SIN_PERMISO',
  'RNF-11: una novedad que no existe → SIN_PERMISO (igual que una fuera del alcance)'
);
select throws_ok(
  $$ select public.escalar_novedad(null, 'Hay que comprar el repuesto.') $$,
  'P0001', 'SIN_PERMISO',
  'RNF-11: sin identificador → SIN_PERMISO'
);

reset role;
set local role authenticated;
set local request.jwt.claims = '{"sub": "a3000000-0000-4000-8000-000000000004", "role": "authenticated"}';

select throws_ok(
  $$ select public.escalar_novedad('a3000000-0000-4000-8000-0000000000d3', 'Hay que comprar el repuesto.') $$,
  'P0001', 'SIN_PERMISO',
  'RNF-11: el aprobador de otra área → SIN_PERMISO'
);

reset role;
set local role authenticated;
set local request.jwt.claims = '{"sub": "a3000000-0000-4000-8000-000000000001", "role": "authenticated"}';

select throws_ok(
  $$ select public.escalar_novedad('a3000000-0000-4000-8000-0000000000d3', 'Hay que comprar el repuesto.') $$,
  'P0001', 'SIN_PERMISO',
  'RF-12: el reportante no escala novedades → SIN_PERMISO'
);
select throws_ok(
  $$ select public.escalar_novedad('a3000000-0000-4000-8000-0000000000d3', null) $$,
  'P0001', 'SIN_PERMISO',
  'SDD 6.1.3: el rol se comprueba antes que los datos (reportante y sin justificación → SIN_PERMISO)'
);

reset role;
set local role authenticated;
set local request.jwt.claims = '{"sub": "a3000000-0000-4000-8000-000000000006", "role": "authenticated"}';

select throws_ok(
  $$ select public.escalar_novedad('a3000000-0000-4000-8000-0000000000d3', 'Hay que comprar el repuesto.') $$,
  'P0001', 'SIN_PERMISO',
  'RF-12: el director no escala: decide lo que le escalan → SIN_PERMISO'
);

reset role;
set local role authenticated;
set local request.jwt.claims = '{"sub": "a3000000-0000-4000-8000-000000000007", "role": "authenticated"}';

select throws_ok(
  $$ select public.escalar_novedad('a3000000-0000-4000-8000-0000000000d3', 'Hay que comprar el repuesto.') $$,
  'P0001', 'SIN_PERMISO',
  'RF-12: el administrador no escala novedades → SIN_PERMISO'
);

reset role;
set local role authenticated;
set local request.jwt.claims = '{"sub": "a3000000-0000-4000-8000-000000000005", "role": "authenticated"}';

select throws_ok(
  $$ select public.escalar_novedad('a3000000-0000-4000-8000-0000000000d3', 'Hay que comprar el repuesto.') $$,
  'P0001', 'SIN_PERMISO',
  'RF-01 / RF-12: un aprobador desactivado → SIN_PERMISO'
);

reset role;
set local role authenticated;
set local request.jwt.claims = '{"sub": "a3000000-0000-4000-8000-000000000008", "role": "authenticated"}';

select throws_ok(
  $$ select public.escalar_novedad('a3000000-0000-4000-8000-0000000000d3', 'Hay que comprar el repuesto.') $$,
  'P0001', 'SIN_PERMISO',
  'RF-12: una cuenta sin perfil → SIN_PERMISO'
);

reset role;
set local role anon;

select throws_ok(
  $$ select public.escalar_novedad('a3000000-0000-4000-8000-0000000000d3', 'Hay que comprar el repuesto.') $$,
  '42501', null,
  'RNF-11: anon no puede ejecutar escalar_novedad'
);

-- Lo que quedó escrito (como propietario: nadie ve los avisos de otro) ------------------------

reset role;

select is(
  (select estado::text from public.novedad where id = 'a3000000-0000-4000-8000-0000000000d3'),
  'en_atencion',
  'RF-12: los intentos sin permiso no cambian el estado'
);
select is(
  (select count(*)::int from public.historial_transicion where novedad_id = 'a3000000-0000-4000-8000-0000000000d3'),
  0,
  'RF-16: ni dejan registros en el historial'
);
select is(
  (select count(*)::int from public.historial_transicion where novedad_id = 'a3000000-0000-4000-8000-0000000000d1'),
  1,
  'RF-16: el segundo intento no agrega registros al historial'
);
select is(
  (select count(*)::int from public.historial_transicion where novedad_id = 'a3000000-0000-4000-8000-0000000000d8'),
  1,
  'RF-16: los intentos sin justificación no dejaron registros; solo el escalamiento válido'
);

-- Avisos (Tabla 30): a los directores activos y al reportante. «staging» tiene sus propios
-- directores, que también reciben el suyo; aquí se miran los usuarios de la prueba.
select results_eq(
  $$ select n.destinatario_id, n.estado_nuevo::text, n.leida
     from public.notificacion n
     join public.usuario u on u.id = n.destinatario_id
     where n.novedad_id = 'a3000000-0000-4000-8000-0000000000d1'
       and u.correo like '%@escalar.pgtap.test'
     order by n.destinatario_id $$,
  $$ values
       ('a3000000-0000-4000-8000-000000000001'::uuid, 'escalada', false),
       ('a3000000-0000-4000-8000-000000000006'::uuid, 'escalada', false),
       ('a3000000-0000-4000-8000-00000000000a'::uuid, 'escalada', false) $$,
  'RF-30 / CU-12 6: un aviso sin leer para el reportante y para cada director activo'
);
select is(
  (
    select count(*)::int
    from public.notificacion
    where novedad_id = 'a3000000-0000-4000-8000-0000000000d1'
      and destinatario_id in (
        'a3000000-0000-4000-8000-000000000002', 'a3000000-0000-4000-8000-000000000003',
        'a3000000-0000-4000-8000-000000000007', 'a3000000-0000-4000-8000-00000000000b'
      )
  ),
  0,
  'RF-30: ni al aprobador que actúa, ni a su colega, ni al administrador, ni al director desactivado'
);
select is(
  (
    select count(*)::int
    from public.notificacion n
    where n.novedad_id = 'a3000000-0000-4000-8000-0000000000d1'
      and n.destinatario_id in (select u.id from public.usuario u where u.rol_id = 3 and u.activo)
  ),
  (select count(*)::int from public.usuario u where u.rol_id = 3 and u.activo),
  'RF-30: todos los directores activos del sistema reciben el aviso, uno cada uno'
);
select results_eq(
  $$ select n.destinatario_id
     from public.notificacion n
     join public.usuario u on u.id = n.destinatario_id
     where n.novedad_id = 'a3000000-0000-4000-8000-0000000000d6'
       and u.correo like '%@escalar.pgtap.test'
     order by n.destinatario_id $$,
  $$ values ('a3000000-0000-4000-8000-000000000006'::uuid), ('a3000000-0000-4000-8000-00000000000a'::uuid) $$,
  'RF-30: si el reportante está desactivado, el aviso llega solo a los directores'
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
set local request.jwt.claims = '{"sub": "a3000000-0000-4000-8000-000000000002", "role": "authenticated"}';

select throws_ok(
  $$ select public.escalar_novedad('a3000000-0000-4000-8000-0000000000d4', 'Hay que comprar el repuesto.') $$,
  'P0001', 'FALLA_SIMULADA_DEL_HISTORIAL',
  'RF-16 / CU-16 1a: si el registro del historial falla, la función informa el error'
);

reset role;

select is(
  (select estado::text from public.novedad where id = 'a3000000-0000-4000-8000-0000000000d4'),
  'en_atencion',
  'RF-16 / CU-16 1a: y la novedad sigue en atención (se revierte el cambio de estado)'
);
select is(
  (select count(*)::int from public.notificacion where novedad_id = 'a3000000-0000-4000-8000-0000000000d4'),
  0,
  'RF-16 / CU-16 1a: ni se envía ningún aviso'
);

-- El contrato sigue intacto -------------------------------------------------------------------

select ok(
  has_function_privilege('authenticated', 'public.escalar_novedad(uuid, text)', 'execute'),
  'RF-12: authenticated conserva el permiso de ejecutar escalar_novedad'
);
select ok(
  (select p.prosecdef and p.proconfig @> array['search_path=""'] from pg_proc p where p.oid = 'public.escalar_novedad(uuid, text)'::regprocedure),
  'RNF-11: escalar_novedad sigue siendo security definer con search_path vacío'
);

select * from finish();
rollback;
