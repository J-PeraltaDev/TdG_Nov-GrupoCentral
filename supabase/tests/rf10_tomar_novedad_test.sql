-- RF-10 / CU-10 · tomar_novedad y la base de las transiciones (SDD 6.1.3, Tablas 29 y 30).
-- Se prueba a través del RPC, con el rol y el JWT de cada usuario. Los datos se crean dentro
-- de la transacción, en un área propia, y no dependen del seed.
begin;

create extension if not exists pgtap with schema extensions;

select plan(38);

-- Datos de la prueba (como propietario) ------------------------------------------------

insert into public.razon_social (id, nombre)
values ('a1000000-0000-4000-8000-0000000000a1', 'RS pgTAP tomar');

insert into public.finca (id, razon_social_id, nombre)
values
  ('a1000000-0000-4000-8000-0000000000f1', 'a1000000-0000-4000-8000-0000000000a1', 'Finca pgTAP tomar A'),
  ('a1000000-0000-4000-8000-0000000000f2', 'a1000000-0000-4000-8000-0000000000a1', 'Finca pgTAP tomar B');

insert into public.area (id, nombre)
values
  ('a1000000-0000-4000-8000-0000000000b1', 'Área pgTAP tomar'),
  ('a1000000-0000-4000-8000-0000000000b2', 'Área pgTAP tomar vecina');

insert into auth.users (instance_id, id, aud, role, email)
select '00000000-0000-0000-0000-000000000000', id, 'authenticated', 'authenticated', correo
from (
  values
    ('a1000000-0000-4000-8000-000000000001'::uuid, 'reportante@tomar.pgtap.test'),
    ('a1000000-0000-4000-8000-000000000002'::uuid, 'aprobador@tomar.pgtap.test'),
    ('a1000000-0000-4000-8000-000000000003'::uuid, 'aprobador.colega@tomar.pgtap.test'),
    ('a1000000-0000-4000-8000-000000000004'::uuid, 'aprobador.vecino@tomar.pgtap.test'),
    ('a1000000-0000-4000-8000-000000000005'::uuid, 'aprobador.inactivo@tomar.pgtap.test'),
    ('a1000000-0000-4000-8000-000000000006'::uuid, 'director@tomar.pgtap.test'),
    ('a1000000-0000-4000-8000-000000000007'::uuid, 'administrador@tomar.pgtap.test'),
    ('a1000000-0000-4000-8000-000000000008'::uuid, 'sin.perfil@tomar.pgtap.test'),
    ('a1000000-0000-4000-8000-000000000009'::uuid, 'reportante.inactivo@tomar.pgtap.test')
) as u (id, correo);

insert into public.usuario (id, nombre, correo, rol_id, finca_id, area_id, activo)
values
  ('a1000000-0000-4000-8000-000000000001', 'Reportante', 'reportante@tomar.pgtap.test', 1, 'a1000000-0000-4000-8000-0000000000f1', null, true),
  ('a1000000-0000-4000-8000-000000000002', 'Aprobador', 'aprobador@tomar.pgtap.test', 2, null, 'a1000000-0000-4000-8000-0000000000b1', true),
  ('a1000000-0000-4000-8000-000000000003', 'Aprobador colega', 'aprobador.colega@tomar.pgtap.test', 2, null, 'a1000000-0000-4000-8000-0000000000b1', true),
  ('a1000000-0000-4000-8000-000000000004', 'Aprobador vecino', 'aprobador.vecino@tomar.pgtap.test', 2, null, 'a1000000-0000-4000-8000-0000000000b2', true),
  ('a1000000-0000-4000-8000-000000000005', 'Aprobador inactivo', 'aprobador.inactivo@tomar.pgtap.test', 2, null, 'a1000000-0000-4000-8000-0000000000b1', false),
  ('a1000000-0000-4000-8000-000000000006', 'Director', 'director@tomar.pgtap.test', 3, null, null, true),
  ('a1000000-0000-4000-8000-000000000007', 'Administrador', 'administrador@tomar.pgtap.test', 4, null, null, true),
  ('a1000000-0000-4000-8000-000000000009', 'Reportante inactivo', 'reportante.inactivo@tomar.pgtap.test', 1, 'a1000000-0000-4000-8000-0000000000f2', null, false);

insert into public.tipo_falla (id, nombre, nombre_normalizado, creado_por)
values ('a1000000-0000-4000-8000-0000000000c1', 'Tipo pgTAP tomar', 'tipo pgtap tomar', 'a1000000-0000-4000-8000-000000000007');

-- Una novedad por caso. d1 a d4, asignadas al área; d5, asignada al área vecina; el resto,
-- una en cada estado que no admite «tomar». La d6 la registró un reportante ya desactivado.
insert into public.novedad (
  id, id_local, finca_id, area_id, reportante_id, descripcion, prioridad, estado,
  fecha_registro, actualizado_en, tipo_falla_id, solucion, fecha_ejecucion
)
select
  ('a1000000-0000-4000-8000-0000000000d' || n.sufijo)::uuid,
  ('a1000000-0000-4000-8000-0000000000e' || n.sufijo)::uuid,
  n.finca::uuid,
  n.area::uuid,
  n.reportante::uuid,
  'Novedad pgTAP tomar ' || n.sufijo,
  'alto',
  n.estado::public.estado_novedad,
  '2026-09-01 08:00:00-05',
  '2026-09-01 08:00:00-05',
  case when n.estado in ('resuelta', 'cerrada') then 'a1000000-0000-4000-8000-0000000000c1'::uuid end,
  case when n.estado in ('resuelta', 'cerrada') then 'Solución de prueba' end,
  case when n.estado in ('resuelta', 'cerrada') then date '2026-09-02' end
from (
  values
    ('1', 'asignada', 'a1000000-0000-4000-8000-0000000000f1', 'a1000000-0000-4000-8000-0000000000b1', 'a1000000-0000-4000-8000-000000000001'),
    ('2', 'asignada', 'a1000000-0000-4000-8000-0000000000f1', 'a1000000-0000-4000-8000-0000000000b1', 'a1000000-0000-4000-8000-000000000001'),
    ('3', 'asignada', 'a1000000-0000-4000-8000-0000000000f1', 'a1000000-0000-4000-8000-0000000000b1', 'a1000000-0000-4000-8000-000000000001'),
    ('4', 'asignada', 'a1000000-0000-4000-8000-0000000000f1', 'a1000000-0000-4000-8000-0000000000b1', 'a1000000-0000-4000-8000-000000000001'),
    ('5', 'asignada', 'a1000000-0000-4000-8000-0000000000f1', 'a1000000-0000-4000-8000-0000000000b2', 'a1000000-0000-4000-8000-000000000001'),
    ('6', 'asignada', 'a1000000-0000-4000-8000-0000000000f2', 'a1000000-0000-4000-8000-0000000000b1', 'a1000000-0000-4000-8000-000000000009'),
    ('7', 'registrada', 'a1000000-0000-4000-8000-0000000000f1', 'a1000000-0000-4000-8000-0000000000b1', 'a1000000-0000-4000-8000-000000000001'),
    ('8', 'en_atencion', 'a1000000-0000-4000-8000-0000000000f1', 'a1000000-0000-4000-8000-0000000000b1', 'a1000000-0000-4000-8000-000000000001'),
    ('9', 'escalada', 'a1000000-0000-4000-8000-0000000000f1', 'a1000000-0000-4000-8000-0000000000b1', 'a1000000-0000-4000-8000-000000000001'),
    ('a', 'aprobada', 'a1000000-0000-4000-8000-0000000000f1', 'a1000000-0000-4000-8000-0000000000b1', 'a1000000-0000-4000-8000-000000000001'),
    ('b', 'resuelta', 'a1000000-0000-4000-8000-0000000000f1', 'a1000000-0000-4000-8000-0000000000b1', 'a1000000-0000-4000-8000-000000000001'),
    ('c', 'rechazada', 'a1000000-0000-4000-8000-0000000000f1', 'a1000000-0000-4000-8000-0000000000b1', 'a1000000-0000-4000-8000-000000000001'),
    ('f', 'cerrada', 'a1000000-0000-4000-8000-0000000000f1', 'a1000000-0000-4000-8000-0000000000b1', 'a1000000-0000-4000-8000-000000000001')
) as n (sufijo, estado, finca, area, reportante);

-- Las auxiliares de las transiciones: en private y fuera del alcance de los usuarios ------

select is(
  (
    select count(*)::int
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'private'
      and p.proname in (
        'perfil_para_transicion', 'novedad_para_transicion', 'aprobadores_del_area',
        'usuarios_del_rol', 'avisar'
      )
      and not p.prosecdef
      and p.proconfig @> array['search_path=""']
  ),
  5,
  'RNF-11: las 5 auxiliares de las transiciones están en private, fijan search_path y no son security definer'
);
select is(
  (
    select count(*)::int
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'private'
      and p.proname in (
        'perfil_para_transicion', 'novedad_para_transicion', 'aprobadores_del_area',
        'usuarios_del_rol', 'avisar'
      )
      and (
        has_function_privilege('authenticated', p.oid, 'execute')
        or has_function_privilege('anon', p.oid, 'execute')
      )
  ),
  0,
  'RNF-11: ni authenticated ni anon pueden ejecutar las auxiliares de las transiciones'
);

-- CU-10 · curso normal ---------------------------------------------------------------------

set local role authenticated;
set local request.jwt.claims = '{"sub": "a1000000-0000-4000-8000-000000000002", "role": "authenticated"}';

select lives_ok(
  $$ select public.tomar_novedad('a1000000-0000-4000-8000-0000000000d1') $$,
  'RF-10 / CU-10 2: el aprobador toma una novedad asignada a su área'
);
select is(
  (select estado::text from public.novedad where id = 'a1000000-0000-4000-8000-0000000000d1'),
  'en_atencion',
  'RF-10 / CU-10 3: la novedad queda en atención'
);
select ok(
  (select actualizado_en > '2026-09-02'::timestamptz from public.novedad where id = 'a1000000-0000-4000-8000-0000000000d1'),
  'RF-16: actualizado_en refleja el cambio (lo mantiene el disparador)'
);
select results_eq(
  $$ select estado_anterior::text, estado_nuevo::text, usuario_id, observacion, area_anterior_id, area_nueva_id
     from public.historial_transicion
     where novedad_id = 'a1000000-0000-4000-8000-0000000000d1' $$,
  $$ values ('asignada', 'en_atencion', 'a1000000-0000-4000-8000-000000000002'::uuid, null::text, null::uuid, null::uuid) $$,
  'RF-16 / CU-10 4: el historial registra asignada → en atención a nombre del aprobador, sin observación'
);
select results_eq(
  $$ select r.id, r.estado::text, r.area_id
     from public.tomar_novedad('a1000000-0000-4000-8000-0000000000d2') as r $$,
  $$ values ('a1000000-0000-4000-8000-0000000000d2'::uuid, 'en_atencion', 'a1000000-0000-4000-8000-0000000000b1'::uuid) $$,
  'RF-10: devuelve la novedad actualizada'
);
select lives_ok(
  $$ select public.tomar_novedad('a1000000-0000-4000-8000-0000000000d6') $$,
  'RF-10: toma la novedad de un reportante que ya fue desactivado'
);

-- Concurrencia: el segundo intento encuentra la novedad en atención -------------------------

select throws_ok(
  $$ select public.tomar_novedad('a1000000-0000-4000-8000-0000000000d1') $$,
  'P0001', 'TRANSICION_INVALIDA',
  'RF-10 / CU-10: tomarla por segunda vez → TRANSICION_INVALIDA'
);

reset role;
set local role authenticated;
set local request.jwt.claims = '{"sub": "a1000000-0000-4000-8000-000000000003", "role": "authenticated"}';

select throws_ok(
  $$ select public.tomar_novedad('a1000000-0000-4000-8000-0000000000d1') $$,
  'P0001', 'TRANSICION_INVALIDA',
  'RF-10 / CU-10: si otro aprobador del área ya la tomó, el segundo recibe TRANSICION_INVALIDA'
);

-- Estados que no admiten la acción (SDD, Tabla 29) ------------------------------------------

select throws_ok(
  $$ select public.tomar_novedad('a1000000-0000-4000-8000-0000000000d7') $$,
  'P0001', 'TRANSICION_INVALIDA', 'RF-10: registrada → TRANSICION_INVALIDA'
);
select throws_ok(
  $$ select public.tomar_novedad('a1000000-0000-4000-8000-0000000000d8') $$,
  'P0001', 'TRANSICION_INVALIDA', 'RF-10: en atención → TRANSICION_INVALIDA'
);
select throws_ok(
  $$ select public.tomar_novedad('a1000000-0000-4000-8000-0000000000d9') $$,
  'P0001', 'TRANSICION_INVALIDA', 'RF-10: escalada → TRANSICION_INVALIDA'
);
select throws_ok(
  $$ select public.tomar_novedad('a1000000-0000-4000-8000-0000000000da') $$,
  'P0001', 'TRANSICION_INVALIDA', 'RF-10: aprobada → TRANSICION_INVALIDA'
);
select throws_ok(
  $$ select public.tomar_novedad('a1000000-0000-4000-8000-0000000000db') $$,
  'P0001', 'TRANSICION_INVALIDA', 'RF-10: resuelta → TRANSICION_INVALIDA'
);
select throws_ok(
  $$ select public.tomar_novedad('a1000000-0000-4000-8000-0000000000dc') $$,
  'P0001', 'TRANSICION_INVALIDA', 'RF-10: rechazada (final) → TRANSICION_INVALIDA'
);
select throws_ok(
  $$ select public.tomar_novedad('a1000000-0000-4000-8000-0000000000df') $$,
  'P0001', 'TRANSICION_INVALIDA', 'RF-10: cerrada (final) → TRANSICION_INVALIDA'
);

-- Alcance y roles: SIN_PERMISO --------------------------------------------------------------

select throws_ok(
  $$ select public.tomar_novedad('a1000000-0000-4000-8000-0000000000d5') $$,
  'P0001', 'SIN_PERMISO',
  'RNF-11: la novedad de otra área → SIN_PERMISO'
);
select throws_ok(
  $$ select public.tomar_novedad('a1000000-0000-4000-8000-0000000000ff') $$,
  'P0001', 'SIN_PERMISO',
  'RNF-11: una novedad que no existe → SIN_PERMISO (igual que una fuera del alcance)'
);
select throws_ok(
  $$ select public.tomar_novedad(null) $$,
  'P0001', 'SIN_PERMISO',
  'RNF-11: sin identificador → SIN_PERMISO'
);

reset role;
set local role authenticated;
set local request.jwt.claims = '{"sub": "a1000000-0000-4000-8000-000000000004", "role": "authenticated"}';

select throws_ok(
  $$ select public.tomar_novedad('a1000000-0000-4000-8000-0000000000d3') $$,
  'P0001', 'SIN_PERMISO',
  'RNF-11: el aprobador de otra área → SIN_PERMISO'
);

reset role;
set local role authenticated;
set local request.jwt.claims = '{"sub": "a1000000-0000-4000-8000-000000000001", "role": "authenticated"}';

select throws_ok(
  $$ select public.tomar_novedad('a1000000-0000-4000-8000-0000000000d3') $$,
  'P0001', 'SIN_PERMISO',
  'RF-10: el reportante no toma novedades → SIN_PERMISO'
);

reset role;
set local role authenticated;
set local request.jwt.claims = '{"sub": "a1000000-0000-4000-8000-000000000006", "role": "authenticated"}';

select throws_ok(
  $$ select public.tomar_novedad('a1000000-0000-4000-8000-0000000000d3') $$,
  'P0001', 'SIN_PERMISO',
  'RF-10: el director no toma novedades → SIN_PERMISO'
);

reset role;
set local role authenticated;
set local request.jwt.claims = '{"sub": "a1000000-0000-4000-8000-000000000007", "role": "authenticated"}';

select throws_ok(
  $$ select public.tomar_novedad('a1000000-0000-4000-8000-0000000000d3') $$,
  'P0001', 'SIN_PERMISO',
  'RF-10: el administrador no toma novedades → SIN_PERMISO'
);

reset role;
set local role authenticated;
set local request.jwt.claims = '{"sub": "a1000000-0000-4000-8000-000000000005", "role": "authenticated"}';

select throws_ok(
  $$ select public.tomar_novedad('a1000000-0000-4000-8000-0000000000d3') $$,
  'P0001', 'SIN_PERMISO',
  'RF-01 / RF-10: un aprobador desactivado → SIN_PERMISO'
);

reset role;
set local role authenticated;
set local request.jwt.claims = '{"sub": "a1000000-0000-4000-8000-000000000008", "role": "authenticated"}';

select throws_ok(
  $$ select public.tomar_novedad('a1000000-0000-4000-8000-0000000000d3') $$,
  'P0001', 'SIN_PERMISO',
  'RF-10: una cuenta sin perfil → SIN_PERMISO'
);

reset role;
set local role anon;

select throws_ok(
  $$ select public.tomar_novedad('a1000000-0000-4000-8000-0000000000d3') $$,
  '42501', null,
  'RNF-11: anon no puede ejecutar tomar_novedad'
);

-- Lo que quedó escrito (como propietario: nadie ve los avisos de otro) ------------------------

reset role;

select is(
  (select estado::text from public.novedad where id = 'a1000000-0000-4000-8000-0000000000d3'),
  'asignada',
  'RF-10: los intentos sin permiso no cambian el estado'
);
select is(
  (select count(*)::int from public.historial_transicion where novedad_id = 'a1000000-0000-4000-8000-0000000000d3'),
  0,
  'RF-16: ni dejan registros en el historial'
);
select is(
  (select count(*)::int from public.historial_transicion where novedad_id = 'a1000000-0000-4000-8000-0000000000d1'),
  1,
  'RF-16: el segundo intento no agrega registros al historial'
);
select results_eq(
  $$ select destinatario_id, estado_nuevo::text, leida
     from public.notificacion
     where novedad_id = 'a1000000-0000-4000-8000-0000000000d1' $$,
  $$ values ('a1000000-0000-4000-8000-000000000001'::uuid, 'en_atencion', false) $$,
  'RF-30 / CU-10 5: un solo aviso, sin leer, para el reportante; ni al aprobador que actúa ni a su colega'
);
select is(
  (select count(*)::int from public.notificacion where novedad_id = 'a1000000-0000-4000-8000-0000000000d6'),
  0,
  'RF-30: un reportante desactivado no recibe avisos'
);
select is(
  (
    select count(*)::int
    from public.notificacion
    where novedad_id in (
      select id from public.novedad where descripcion like 'Novedad pgTAP tomar %'
    )
  ),
  2,
  'RF-30: solo generaron aviso las dos novedades tomadas con reportante activo'
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
set local request.jwt.claims = '{"sub": "a1000000-0000-4000-8000-000000000002", "role": "authenticated"}';

select throws_ok(
  $$ select public.tomar_novedad('a1000000-0000-4000-8000-0000000000d4') $$,
  'P0001', 'FALLA_SIMULADA_DEL_HISTORIAL',
  'RF-16 / CU-16 1a: si el registro del historial falla, la función informa el error'
);

reset role;

select is(
  (select estado::text from public.novedad where id = 'a1000000-0000-4000-8000-0000000000d4'),
  'asignada',
  'RF-16 / CU-16 1a: y la novedad sigue asignada (se revierte el cambio de estado)'
);
select is(
  (select count(*)::int from public.notificacion where novedad_id = 'a1000000-0000-4000-8000-0000000000d4'),
  0,
  'RF-16 / CU-16 1a: ni se envía el aviso'
);

-- El contrato sigue intacto -------------------------------------------------------------------

select ok(
  has_function_privilege('authenticated', 'public.tomar_novedad(uuid)', 'execute'),
  'RF-10: authenticated conserva el permiso de ejecutar tomar_novedad'
);
select ok(
  (select p.prosecdef and p.proconfig @> array['search_path=""'] from pg_proc p where p.oid = 'public.tomar_novedad(uuid)'::regprocedure),
  'RNF-11: tomar_novedad sigue siendo security definer con search_path vacío'
);

select * from finish();
rollback;
