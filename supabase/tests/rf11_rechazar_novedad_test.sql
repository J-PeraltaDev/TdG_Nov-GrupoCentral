-- RF-11 / CU-11 · rechazar_novedad (SDD 6.1.3, Tablas 29 y 30).
-- Se prueba a través del RPC, con el rol y el JWT de cada usuario. Los datos se crean dentro
-- de la transacción, en un área propia, y no dependen del seed.
begin;

create extension if not exists pgtap with schema extensions;

select plan(47);

-- Datos de la prueba (como propietario) ------------------------------------------------

insert into public.razon_social (id, nombre)
values ('a2000000-0000-4000-8000-0000000000a1', 'RS pgTAP rechazar');

insert into public.finca (id, razon_social_id, nombre)
values
  ('a2000000-0000-4000-8000-0000000000f1', 'a2000000-0000-4000-8000-0000000000a1', 'Finca pgTAP rechazar A'),
  ('a2000000-0000-4000-8000-0000000000f2', 'a2000000-0000-4000-8000-0000000000a1', 'Finca pgTAP rechazar B');

insert into public.area (id, nombre)
values
  ('a2000000-0000-4000-8000-0000000000b1', 'Área pgTAP rechazar'),
  ('a2000000-0000-4000-8000-0000000000b2', 'Área pgTAP rechazar vecina');

insert into auth.users (instance_id, id, aud, role, email)
select '00000000-0000-0000-0000-000000000000', id, 'authenticated', 'authenticated', correo
from (
  values
    ('a2000000-0000-4000-8000-000000000001'::uuid, 'reportante@rechazar.pgtap.test'),
    ('a2000000-0000-4000-8000-000000000002'::uuid, 'aprobador@rechazar.pgtap.test'),
    ('a2000000-0000-4000-8000-000000000003'::uuid, 'aprobador.colega@rechazar.pgtap.test'),
    ('a2000000-0000-4000-8000-000000000004'::uuid, 'aprobador.vecino@rechazar.pgtap.test'),
    ('a2000000-0000-4000-8000-000000000005'::uuid, 'aprobador.inactivo@rechazar.pgtap.test'),
    ('a2000000-0000-4000-8000-000000000006'::uuid, 'director@rechazar.pgtap.test'),
    ('a2000000-0000-4000-8000-000000000007'::uuid, 'administrador@rechazar.pgtap.test'),
    ('a2000000-0000-4000-8000-000000000008'::uuid, 'sin.perfil@rechazar.pgtap.test'),
    ('a2000000-0000-4000-8000-000000000009'::uuid, 'reportante.inactivo@rechazar.pgtap.test')
) as u (id, correo);

insert into public.usuario (id, nombre, correo, rol_id, finca_id, area_id, activo)
values
  ('a2000000-0000-4000-8000-000000000001', 'Reportante', 'reportante@rechazar.pgtap.test', 1, 'a2000000-0000-4000-8000-0000000000f1', null, true),
  ('a2000000-0000-4000-8000-000000000002', 'Aprobador', 'aprobador@rechazar.pgtap.test', 2, null, 'a2000000-0000-4000-8000-0000000000b1', true),
  ('a2000000-0000-4000-8000-000000000003', 'Aprobador colega', 'aprobador.colega@rechazar.pgtap.test', 2, null, 'a2000000-0000-4000-8000-0000000000b1', true),
  ('a2000000-0000-4000-8000-000000000004', 'Aprobador vecino', 'aprobador.vecino@rechazar.pgtap.test', 2, null, 'a2000000-0000-4000-8000-0000000000b2', true),
  ('a2000000-0000-4000-8000-000000000005', 'Aprobador inactivo', 'aprobador.inactivo@rechazar.pgtap.test', 2, null, 'a2000000-0000-4000-8000-0000000000b1', false),
  ('a2000000-0000-4000-8000-000000000006', 'Director', 'director@rechazar.pgtap.test', 3, null, null, true),
  ('a2000000-0000-4000-8000-000000000007', 'Administrador', 'administrador@rechazar.pgtap.test', 4, null, null, true),
  ('a2000000-0000-4000-8000-000000000009', 'Reportante inactivo', 'reportante.inactivo@rechazar.pgtap.test', 1, 'a2000000-0000-4000-8000-0000000000f2', null, false);

insert into public.tipo_falla (id, nombre, nombre_normalizado, creado_por)
values ('a2000000-0000-4000-8000-0000000000c1', 'Tipo pgTAP rechazar', 'tipo pgtap rechazar', 'a2000000-0000-4000-8000-000000000007');

-- Una novedad por caso. d1, asignada, y d2, en atención: los dos orígenes que admite la
-- acción. d3, d4 y d8, asignadas, para los intentos que no deben cambiar nada. d5, del área
-- vecina. d6, de un reportante ya desactivado. El resto, una en cada estado que no la admite.
insert into public.novedad (
  id, id_local, finca_id, area_id, reportante_id, descripcion, prioridad, estado,
  fecha_registro, actualizado_en, tipo_falla_id, solucion, fecha_ejecucion
)
select
  ('a2000000-0000-4000-8000-0000000000d' || n.sufijo)::uuid,
  ('a2000000-0000-4000-8000-0000000000e' || n.sufijo)::uuid,
  n.finca::uuid,
  n.area::uuid,
  n.reportante::uuid,
  'Novedad pgTAP rechazar ' || n.sufijo,
  'alto',
  n.estado::public.estado_novedad,
  '2026-09-01 08:00:00-05',
  '2026-09-01 08:00:00-05',
  case when n.estado in ('resuelta', 'cerrada') then 'a2000000-0000-4000-8000-0000000000c1'::uuid end,
  case when n.estado in ('resuelta', 'cerrada') then 'Solución de prueba' end,
  case when n.estado in ('resuelta', 'cerrada') then date '2026-09-02' end
from (
  values
    ('1', 'asignada', 'a2000000-0000-4000-8000-0000000000f1', 'a2000000-0000-4000-8000-0000000000b1', 'a2000000-0000-4000-8000-000000000001'),
    ('2', 'en_atencion', 'a2000000-0000-4000-8000-0000000000f1', 'a2000000-0000-4000-8000-0000000000b1', 'a2000000-0000-4000-8000-000000000001'),
    ('3', 'asignada', 'a2000000-0000-4000-8000-0000000000f1', 'a2000000-0000-4000-8000-0000000000b1', 'a2000000-0000-4000-8000-000000000001'),
    ('4', 'asignada', 'a2000000-0000-4000-8000-0000000000f1', 'a2000000-0000-4000-8000-0000000000b1', 'a2000000-0000-4000-8000-000000000001'),
    ('5', 'asignada', 'a2000000-0000-4000-8000-0000000000f1', 'a2000000-0000-4000-8000-0000000000b2', 'a2000000-0000-4000-8000-000000000001'),
    ('6', 'asignada', 'a2000000-0000-4000-8000-0000000000f2', 'a2000000-0000-4000-8000-0000000000b1', 'a2000000-0000-4000-8000-000000000009'),
    ('7', 'registrada', 'a2000000-0000-4000-8000-0000000000f1', 'a2000000-0000-4000-8000-0000000000b1', 'a2000000-0000-4000-8000-000000000001'),
    ('8', 'asignada', 'a2000000-0000-4000-8000-0000000000f1', 'a2000000-0000-4000-8000-0000000000b1', 'a2000000-0000-4000-8000-000000000001'),
    ('9', 'escalada', 'a2000000-0000-4000-8000-0000000000f1', 'a2000000-0000-4000-8000-0000000000b1', 'a2000000-0000-4000-8000-000000000001'),
    ('a', 'aprobada', 'a2000000-0000-4000-8000-0000000000f1', 'a2000000-0000-4000-8000-0000000000b1', 'a2000000-0000-4000-8000-000000000001'),
    ('b', 'resuelta', 'a2000000-0000-4000-8000-0000000000f1', 'a2000000-0000-4000-8000-0000000000b1', 'a2000000-0000-4000-8000-000000000001'),
    ('c', 'rechazada', 'a2000000-0000-4000-8000-0000000000f1', 'a2000000-0000-4000-8000-0000000000b1', 'a2000000-0000-4000-8000-000000000001'),
    ('f', 'cerrada', 'a2000000-0000-4000-8000-0000000000f1', 'a2000000-0000-4000-8000-0000000000b1', 'a2000000-0000-4000-8000-000000000001')
) as n (sufijo, estado, finca, area, reportante);

-- La auxiliar que valida los textos: en private y fuera del alcance de los usuarios --------

select ok(
  (
    select not p.prosecdef
      and p.proconfig @> array['search_path=""']
      and not has_function_privilege('authenticated', p.oid, 'execute')
      and not has_function_privilege('anon', p.oid, 'execute')
    from pg_proc p
    where p.oid = 'private.texto_obligatorio(text)'::regprocedure
  ),
  'RNF-11: texto_obligatorio está en private, fija search_path, no es security definer y no la ejecutan authenticated ni anon'
);

-- CU-11 · curso normal ---------------------------------------------------------------------

set local role authenticated;
set local request.jwt.claims = '{"sub": "a2000000-0000-4000-8000-000000000002", "role": "authenticated"}';

select lives_ok(
  $$ select public.rechazar_novedad(
       'a2000000-0000-4000-8000-0000000000d1',
       '  Duplicada: ya está en atención como NOV-0149.  '
     ) $$,
  'RF-11 / CU-11 3: el aprobador rechaza una novedad asignada a su área con un motivo'
);
select is(
  (select estado::text from public.novedad where id = 'a2000000-0000-4000-8000-0000000000d1'),
  'rechazada',
  'RF-11 / CU-11 4: la novedad queda rechazada'
);
select ok(
  (select actualizado_en > '2026-09-02'::timestamptz from public.novedad where id = 'a2000000-0000-4000-8000-0000000000d1'),
  'RF-16: actualizado_en refleja el cambio (lo mantiene el disparador)'
);
select results_eq(
  $$ select estado_anterior::text, estado_nuevo::text, usuario_id, observacion, area_anterior_id, area_nueva_id
     from public.historial_transicion
     where novedad_id = 'a2000000-0000-4000-8000-0000000000d1' $$,
  $$ values ('asignada', 'rechazada', 'a2000000-0000-4000-8000-000000000002'::uuid,
             'Duplicada: ya está en atención como NOV-0149.', null::uuid, null::uuid) $$,
  'RF-16 / CU-11 5: el historial registra asignada → rechazada con el motivo, sin espacios sobrantes'
);
select results_eq(
  $$ select r.id, r.estado::text, r.area_id
     from public.rechazar_novedad('a2000000-0000-4000-8000-0000000000d2', 'Es una solicitud de insumos') as r $$,
  $$ values ('a2000000-0000-4000-8000-0000000000d2'::uuid, 'rechazada', 'a2000000-0000-4000-8000-0000000000b1'::uuid) $$,
  'RF-11: también rechaza una novedad en atención y devuelve la novedad actualizada'
);
select results_eq(
  $$ select estado_anterior::text, estado_nuevo::text, usuario_id, observacion
     from public.historial_transicion
     where novedad_id = 'a2000000-0000-4000-8000-0000000000d2' $$,
  $$ values ('en_atencion', 'rechazada', 'a2000000-0000-4000-8000-000000000002'::uuid, 'Es una solicitud de insumos') $$,
  'RF-16: el historial registra en atención → rechazada con el motivo'
);
select lives_ok(
  $$ select public.rechazar_novedad('a2000000-0000-4000-8000-0000000000d6', 'Duplicada') $$,
  'RF-11: rechaza la novedad de un reportante que ya fue desactivado'
);

-- Rechazada es un estado final (SDD, Tabla 29) ------------------------------------------------

select throws_ok(
  $$ select public.rechazar_novedad('a2000000-0000-4000-8000-0000000000d1', 'Duplicada') $$,
  'P0001', 'TRANSICION_INVALIDA',
  'RF-11: rechazarla por segunda vez → TRANSICION_INVALIDA'
);

reset role;
set local role authenticated;
set local request.jwt.claims = '{"sub": "a2000000-0000-4000-8000-000000000003", "role": "authenticated"}';

select throws_ok(
  $$ select public.rechazar_novedad('a2000000-0000-4000-8000-0000000000d1', 'Duplicada') $$,
  'P0001', 'TRANSICION_INVALIDA',
  'RF-11: si otro aprobador del área ya la rechazó, el segundo recibe TRANSICION_INVALIDA'
);

-- CU-11 3a · el motivo es obligatorio --------------------------------------------------------

select throws_ok(
  $$ select public.rechazar_novedad('a2000000-0000-4000-8000-0000000000d8', null) $$,
  'P0001', 'DATO_OBLIGATORIO',
  'RF-11 / CU-11 3a: sin motivo → DATO_OBLIGATORIO'
);
select throws_ok(
  $$ select public.rechazar_novedad('a2000000-0000-4000-8000-0000000000d8', '') $$,
  'P0001', 'DATO_OBLIGATORIO',
  'RF-11 / CU-11 3a: motivo vacío → DATO_OBLIGATORIO'
);
select throws_ok(
  $$ select public.rechazar_novedad('a2000000-0000-4000-8000-0000000000d8', '     ') $$,
  'P0001', 'DATO_OBLIGATORIO',
  'RF-11 / CU-11 3a: motivo de solo espacios → DATO_OBLIGATORIO'
);
select throws_ok(
  $$ select public.rechazar_novedad('a2000000-0000-4000-8000-0000000000d8', E' \n\t\r ') $$,
  'P0001', 'DATO_OBLIGATORIO',
  'RF-11 / CU-11 3a: motivo de solo saltos de línea y tabulaciones → DATO_OBLIGATORIO'
);
select throws_ok(
  $$ select public.rechazar_novedad('a2000000-0000-4000-8000-0000000000d8', repeat('a', 501)) $$,
  'P0001', 'DATO_OBLIGATORIO',
  'RF-11: motivo de más de 500 caracteres → DATO_OBLIGATORIO'
);
select is(
  (select estado::text from public.novedad where id = 'a2000000-0000-4000-8000-0000000000d8'),
  'asignada',
  'RF-11 / CU-11 3a: sin un motivo válido la novedad no cambia de estado'
);
select lives_ok(
  $$ select public.rechazar_novedad('a2000000-0000-4000-8000-0000000000d8', repeat('a', 500)) $$,
  'RF-11: un motivo de 500 caracteres sí se acepta (y la rechaza otro aprobador del área)'
);

-- Estados que no admiten la acción (SDD, Tabla 29) ------------------------------------------

select throws_ok(
  $$ select public.rechazar_novedad('a2000000-0000-4000-8000-0000000000d7', 'Duplicada') $$,
  'P0001', 'TRANSICION_INVALIDA', 'RF-11: registrada → TRANSICION_INVALIDA'
);
select throws_ok(
  $$ select public.rechazar_novedad('a2000000-0000-4000-8000-0000000000d9', 'Duplicada') $$,
  'P0001', 'TRANSICION_INVALIDA', 'RF-11: escalada → TRANSICION_INVALIDA'
);
select throws_ok(
  $$ select public.rechazar_novedad('a2000000-0000-4000-8000-0000000000da', 'Duplicada') $$,
  'P0001', 'TRANSICION_INVALIDA', 'RF-11: aprobada → TRANSICION_INVALIDA'
);
select throws_ok(
  $$ select public.rechazar_novedad('a2000000-0000-4000-8000-0000000000db', 'Duplicada') $$,
  'P0001', 'TRANSICION_INVALIDA', 'RF-11: resuelta → TRANSICION_INVALIDA'
);
select throws_ok(
  $$ select public.rechazar_novedad('a2000000-0000-4000-8000-0000000000dc', 'Duplicada') $$,
  'P0001', 'TRANSICION_INVALIDA', 'RF-11: rechazada (final) → TRANSICION_INVALIDA'
);
select throws_ok(
  $$ select public.rechazar_novedad('a2000000-0000-4000-8000-0000000000df', 'Duplicada') $$,
  'P0001', 'TRANSICION_INVALIDA', 'RF-11: cerrada (final) → TRANSICION_INVALIDA'
);
select throws_ok(
  $$ select public.rechazar_novedad('a2000000-0000-4000-8000-0000000000d9', null) $$,
  'P0001', 'TRANSICION_INVALIDA',
  'SDD 6.1.3: el estado se comprueba antes que los datos (escalada y sin motivo → TRANSICION_INVALIDA)'
);

-- Alcance y roles: SIN_PERMISO --------------------------------------------------------------

select throws_ok(
  $$ select public.rechazar_novedad('a2000000-0000-4000-8000-0000000000d5', 'Duplicada') $$,
  'P0001', 'SIN_PERMISO',
  'RNF-11: la novedad de otra área → SIN_PERMISO'
);
select throws_ok(
  $$ select public.rechazar_novedad('a2000000-0000-4000-8000-0000000000ff', 'Duplicada') $$,
  'P0001', 'SIN_PERMISO',
  'RNF-11: una novedad que no existe → SIN_PERMISO (igual que una fuera del alcance)'
);
select throws_ok(
  $$ select public.rechazar_novedad(null, 'Duplicada') $$,
  'P0001', 'SIN_PERMISO',
  'RNF-11: sin identificador → SIN_PERMISO'
);

reset role;
set local role authenticated;
set local request.jwt.claims = '{"sub": "a2000000-0000-4000-8000-000000000004", "role": "authenticated"}';

select throws_ok(
  $$ select public.rechazar_novedad('a2000000-0000-4000-8000-0000000000d3', 'Duplicada') $$,
  'P0001', 'SIN_PERMISO',
  'RNF-11: el aprobador de otra área → SIN_PERMISO'
);

reset role;
set local role authenticated;
set local request.jwt.claims = '{"sub": "a2000000-0000-4000-8000-000000000001", "role": "authenticated"}';

select throws_ok(
  $$ select public.rechazar_novedad('a2000000-0000-4000-8000-0000000000d3', 'Duplicada') $$,
  'P0001', 'SIN_PERMISO',
  'RF-11: el reportante no rechaza novedades → SIN_PERMISO'
);
select throws_ok(
  $$ select public.rechazar_novedad('a2000000-0000-4000-8000-0000000000d3', null) $$,
  'P0001', 'SIN_PERMISO',
  'SDD 6.1.3: el rol se comprueba antes que los datos (reportante y sin motivo → SIN_PERMISO)'
);

reset role;
set local role authenticated;
set local request.jwt.claims = '{"sub": "a2000000-0000-4000-8000-000000000006", "role": "authenticated"}';

select throws_ok(
  $$ select public.rechazar_novedad('a2000000-0000-4000-8000-0000000000d3', 'Duplicada') $$,
  'P0001', 'SIN_PERMISO',
  'RF-11: el director no rechaza con esta función (lo suyo es decidir_escalamiento) → SIN_PERMISO'
);

reset role;
set local role authenticated;
set local request.jwt.claims = '{"sub": "a2000000-0000-4000-8000-000000000007", "role": "authenticated"}';

select throws_ok(
  $$ select public.rechazar_novedad('a2000000-0000-4000-8000-0000000000d3', 'Duplicada') $$,
  'P0001', 'SIN_PERMISO',
  'RF-11: el administrador no rechaza novedades → SIN_PERMISO'
);

reset role;
set local role authenticated;
set local request.jwt.claims = '{"sub": "a2000000-0000-4000-8000-000000000005", "role": "authenticated"}';

select throws_ok(
  $$ select public.rechazar_novedad('a2000000-0000-4000-8000-0000000000d3', 'Duplicada') $$,
  'P0001', 'SIN_PERMISO',
  'RF-01 / RF-11: un aprobador desactivado → SIN_PERMISO'
);

reset role;
set local role authenticated;
set local request.jwt.claims = '{"sub": "a2000000-0000-4000-8000-000000000008", "role": "authenticated"}';

select throws_ok(
  $$ select public.rechazar_novedad('a2000000-0000-4000-8000-0000000000d3', 'Duplicada') $$,
  'P0001', 'SIN_PERMISO',
  'RF-11: una cuenta sin perfil → SIN_PERMISO'
);

reset role;
set local role anon;

select throws_ok(
  $$ select public.rechazar_novedad('a2000000-0000-4000-8000-0000000000d3', 'Duplicada') $$,
  '42501', null,
  'RNF-11: anon no puede ejecutar rechazar_novedad'
);

-- Lo que quedó escrito (como propietario: nadie ve los avisos de otro) ------------------------

reset role;

select is(
  (select estado::text from public.novedad where id = 'a2000000-0000-4000-8000-0000000000d3'),
  'asignada',
  'RF-11: los intentos sin permiso no cambian el estado'
);
select is(
  (select count(*)::int from public.historial_transicion where novedad_id = 'a2000000-0000-4000-8000-0000000000d3'),
  0,
  'RF-16: ni dejan registros en el historial'
);
select is(
  (select count(*)::int from public.historial_transicion where novedad_id = 'a2000000-0000-4000-8000-0000000000d1'),
  1,
  'RF-16: el segundo intento no agrega registros al historial'
);
select is(
  (select count(*)::int from public.historial_transicion where novedad_id = 'a2000000-0000-4000-8000-0000000000d8'),
  1,
  'RF-16: los intentos sin motivo no dejaron registros; solo el rechazo válido'
);
select results_eq(
  $$ select destinatario_id, estado_nuevo::text, leida
     from public.notificacion
     where novedad_id = 'a2000000-0000-4000-8000-0000000000d1' $$,
  $$ values ('a2000000-0000-4000-8000-000000000001'::uuid, 'rechazada', false) $$,
  'RF-30 / CU-11 6: un solo aviso, sin leer, para el reportante; ni al aprobador que actúa ni a su colega'
);
select is(
  (select count(*)::int from public.notificacion where novedad_id = 'a2000000-0000-4000-8000-0000000000d6'),
  0,
  'RF-30: un reportante desactivado no recibe avisos'
);
select is(
  (
    select count(*)::int
    from public.notificacion
    where novedad_id in (
      select id from public.novedad where descripcion like 'Novedad pgTAP rechazar %'
    )
  ),
  3,
  'RF-30: solo generaron aviso las tres novedades rechazadas con reportante activo'
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
set local request.jwt.claims = '{"sub": "a2000000-0000-4000-8000-000000000002", "role": "authenticated"}';

select throws_ok(
  $$ select public.rechazar_novedad('a2000000-0000-4000-8000-0000000000d4', 'Duplicada') $$,
  'P0001', 'FALLA_SIMULADA_DEL_HISTORIAL',
  'RF-16 / CU-16 1a: si el registro del historial falla, la función informa el error'
);

reset role;

select is(
  (select estado::text from public.novedad where id = 'a2000000-0000-4000-8000-0000000000d4'),
  'asignada',
  'RF-16 / CU-16 1a: y la novedad sigue asignada (se revierte el cambio de estado)'
);
select is(
  (select count(*)::int from public.notificacion where novedad_id = 'a2000000-0000-4000-8000-0000000000d4'),
  0,
  'RF-16 / CU-16 1a: ni se envía el aviso'
);

-- El contrato sigue intacto -------------------------------------------------------------------

select ok(
  has_function_privilege('authenticated', 'public.rechazar_novedad(uuid, text)', 'execute'),
  'RF-11: authenticated conserva el permiso de ejecutar rechazar_novedad'
);
select ok(
  (select p.prosecdef and p.proconfig @> array['search_path=""'] from pg_proc p where p.oid = 'public.rechazar_novedad(uuid, text)'::regprocedure),
  'RNF-11: rechazar_novedad sigue siendo security definer con search_path vacío'
);

select * from finish();
rollback;
